<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">回传归因配置</div>
        <div class="page-subtitle">为每部短剧配置事件回传频率，未配置的事件默认全量回传</div>
      </div>
    </div>

    <!-- 选择短剧 -->
    <div class="select-bar">
      <a-select
        v-model="selectedDramaId"
        placeholder="选择短剧"
        allow-search
        style="width: 360px"
        @change="handleDramaChange"
      >
        <a-option v-for="d in dramaList" :key="d.id" :value="d.id">
          <span>{{ d.name }}</span>
          <a-tag v-if="configuredDramaIds.has(d.id)" size="small" color="arcoblue" style="margin-left: 8px">已配置</a-tag>
          <a-tag v-else size="small" color="gray" style="margin-left: 8px">默认全量</a-tag>
          <a-tag size="small" :color="unlockModeColor(d.unlockMode)" style="margin-left: 4px">{{ unlockModeLabel(d.unlockMode) }}</a-tag>
        </a-option>
      </a-select>
      <a-tag v-if="currentDrama" :color="unlockModeColor(currentDrama.unlockMode)">
        {{ unlockModeLabel(currentDrama.unlockMode) }}
      </a-tag>
    </div>

    <!-- 事件配置表格 -->
    <div v-if="selectedDramaId" class="table-card">
      <div class="config-header">
        <span class="config-title">事件回传配置</span>
        <a-button type="primary" :loading="saving" @click="handleSave">
          保存配置
        </a-button>
      </div>

      <a-table :columns="columns" :data="eventConfigs" :pagination="false" row-key="eventType" :bordered="false">
        <template #eventLabel="{ record }">
          <div class="event-cell">
            <span class="event-label">{{ record.label }}</span>
            <span class="event-key">{{ record.eventType }}</span>
          </div>
        </template>
        <template #enabled="{ record }">
          <a-switch
            v-model="record.enabled"
            :checked-value="1"
            :unchecked-value="0"
            checked-text="回传"
            unchecked-text="关闭"
          />
        </template>
        <template #callbackRatio="{ record }">
          <a-input-number
            v-model="record.callbackRatio"
            :min="0"
            :max="100"
            :step="1"
            :disabled="record.enabled === 0"
            style="width: 120px"
          />
          <span class="ratio-hint">
            {{ ratioHint(record.callbackRatio) }}
          </span>
        </template>
      </a-table>
    </div>

    <!-- 未选择短剧时的空状态 -->
    <div v-else class="empty-state">
      <icon-apps style="font-size: 48px; color: var(--mc-text-tertiary)" />
      <p>请先选择一部短剧来配置回传规则</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdCallbackRules' })
import { ref, computed, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import { fetchDramaCallbackConfig, saveDramaCallbackConfig, fetchConfiguredDramaIds } from '@/api/adCallback.ts'
import { fetchDramaList } from '@/api/drama.ts'
import { IAP_EVENTS, IAA_EVENTS } from '@/types/adCallback.ts'
import type { DramaCallbackConfig } from '@/types/adCallback.ts'

interface DramaItem {
  id: string
  name: string
  unlockMode: string
}

interface EventConfigRow {
  eventType: string
  label: string
  enabled: number
  callbackRatio: number
}

const appStore = useAppStore()
const dramaList = ref<DramaItem[]>([])
const configuredDramaIds = ref<Set<string>>(new Set())
const selectedDramaId = ref<string | undefined>(undefined)
const eventConfigs = ref<EventConfigRow[]>([])
const saving = ref(false)
const loading = ref(false)

const currentDrama = computed(() => dramaList.value.find(d => d.id === selectedDramaId.value))

const columns = [
  { title: '事件', slotName: 'eventLabel', width: 260 },
  { title: '回传开关', slotName: 'enabled', width: 120 },
  { title: '回传频率（每N次回传1次）', slotName: 'callbackRatio', width: 280 },
]

function unlockModeLabel(mode: string) {
  const map: Record<string, string> = { IAA_ONLY: 'IAA', IAP_ONLY: 'IAP', IAA_IAP: 'IAA+IAP' }
  return map[mode] || mode
}

function unlockModeColor(mode: string) {
  const map: Record<string, string> = { IAA_ONLY: 'green', IAP_ONLY: 'blue', IAA_IAP: 'purple' }
  return map[mode] || 'gray'
}

function ratioHint(ratio: number) {
  if (ratio === 0) return '（不回传）'
  if (ratio === 1) return '（全量）'
  return `（${Math.round(100 / ratio)}% 回传率）`
}

/** 根据解锁模式获取标准事件列表 */
function getStandardEvents(unlockMode: string) {
  if (unlockMode === 'IAA_ONLY') return IAA_EVENTS
  if (unlockMode === 'IAP_ONLY') return IAP_EVENTS
  // IAA_IAP：合并去重
  const merged = [...IAP_EVENTS]
  for (const e of IAA_EVENTS) {
    if (!merged.find(m => m.key === e.key)) {
      merged.push(e)
    }
  }
  return merged
}

async function loadDramas() {
  try {
    const res = await fetchDramaList({ status: 1, pageNum: 1, pageSize: 200 })
    if (res && 'rows' in res) {
      dramaList.value = (res as { rows: DramaItem[] }).rows || []
    }
    // 加载已配置的短剧ID列表
    if (appStore.currentClientKey) {
      const ids = await fetchConfiguredDramaIds(appStore.currentClientKey) as string[] | null
      configuredDramaIds.value = new Set(ids || [])
    }
  } catch {
    dramaList.value = []
  }
}

async function handleDramaChange() {
  if (!selectedDramaId.value || !currentDrama.value) return
  loading.value = true
  try {
    // 获取该剧已有配置
    const configs = await fetchDramaCallbackConfig(selectedDramaId.value) as DramaCallbackConfig[] | null
    const configMap = new Map<string, DramaCallbackConfig>()
    if (configs && Array.isArray(configs)) {
      for (const c of configs) {
        configMap.set(c.eventType, c)
      }
    }

    // 根据解锁模式生成事件列表，合并已有配置
    const events = getStandardEvents(currentDrama.value.unlockMode)
    eventConfigs.value = events.map(e => {
      const existing = configMap.get(e.key)
      return {
        eventType: e.key,
        label: e.label,
        enabled: existing ? existing.enabled : 1,
        callbackRatio: existing ? existing.callbackRatio : 1,
      }
    })
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!selectedDramaId.value || !appStore.currentClientKey) {
    Message.warning('请先选择短剧和应用')
    return
  }
  saving.value = true
  try {
    const configs: DramaCallbackConfig[] = eventConfigs.value.map(e => ({
      eventType: e.eventType,
      enabled: e.enabled,
      callbackRatio: e.callbackRatio,
    }))
    await saveDramaCallbackConfig(selectedDramaId.value, appStore.currentClientKey, configs)
    Message.success('配置保存成功')
    // 刷新已配置标记
    configuredDramaIds.value.add(selectedDramaId.value)
  } finally {
    saving.value = false
  }
}

watch(() => appStore.currentClientKey, () => {
  selectedDramaId.value = undefined
  eventConfigs.value = []
  loadDramas()
}, { immediate: true })
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}
.page-subtitle {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 2px;
}
.select-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}
.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--mc-border);
}
.config-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text-primary);
}
.event-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.event-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--mc-text-primary);
}
.event-key {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.ratio-hint {
  margin-left: 8px;
  font-size: 11px;
  color: var(--mc-text-tertiary);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
  color: var(--mc-text-tertiary);
}
</style>
