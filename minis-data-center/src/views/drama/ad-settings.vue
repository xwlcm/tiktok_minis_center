<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">广告推送设置</div>
        <div class="page-subtitle">为每部短剧配置免费集数和解锁模式</div>
      </div>
    </div>

    <div class="toolbar">
      <a-input-search
        v-model="keyword"
        placeholder="搜索短剧名称..."
        allow-clear
        style="width: 280px"
        @search="handleSearch"
        @clear="handleSearch"
      />
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="filteredList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="{ pageSize: 20, showTotal: true }"
      >
        <template #name="{ record }">
          <div class="drama-cell">
            <a-image
              v-if="record.coverUrl"
              :src="record.coverUrl"
              width="40"
              height="28"
              fit="cover"
              style="border-radius: 4px; flex-shrink: 0"
            />
            <div v-else class="cover-placeholder">
              <icon-video-camera style="font-size: 14px; color: rgba(255,255,255,0.2)" />
            </div>
            <span class="drama-name">{{ record.name }}</span>
          </div>
        </template>
        <template #freeEpisodes="{ record }">
          <span class="config-value">{{ record.freeEpisodes ?? 0 }}</span>
          <span class="config-unit">集</span>
        </template>
        <template #unlockMode="{ record }">
          <a-tag :color="unlockModeColor(record.unlockMode)">{{ unlockModeLabel(record.unlockMode) }}</a-tag>
        </template>
        <template #adRule="{ record }">
          <span v-if="record.adPushRuleId" class="config-value">
            {{ getRuleName(record.adPushRuleId) }}
          </span>
          <span v-else class="empty-text">—</span>
        </template>
        <template #episodePrice="{ record }">
          <span v-if="record.episodePrice">{{ (record.episodePrice / 100).toFixed(2) }} 元</span>
          <span v-else class="empty-text">—</span>
        </template>
        <template #bundlePrice="{ record }">
          <span v-if="record.bundlePrice">{{ (record.bundlePrice / 100).toFixed(2) }} 元</span>
          <span v-else class="empty-text">—</span>
        </template>
        <template #operations="{ record }">
          <a-button type="primary" size="small" @click="openModal(record)">配置</a-button>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="`广告推送配置 - ${editingDrama?.name ?? ''}`"
      :ok-loading="submitting"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="freeEpisodes" label="免费集数" extra="前 N 集用户可免费观看">
          <a-input-number
            v-model="form.freeEpisodes"
            :min="0"
            :max="9999"
            placeholder="免费集数"
            style="width: 200px"
          />
          <template #append>集</template>
        </a-form-item>

        <a-form-item field="unlockMode" label="解锁模式">
          <a-select v-model="form.unlockMode" style="width: 200px">
            <a-option value="IAA_ONLY">仅广告解锁</a-option>
            <a-option value="IAP_ONLY">仅付费解锁</a-option>
            <a-option value="IAA_IAP">广告或付费</a-option>
          </a-select>
        </a-form-item>

        <a-form-item v-if="form.unlockMode === 'IAA_ONLY' || form.unlockMode === 'IAA_IAP'" field="adPushRuleId" label="广告解锁规则" extra="选择该短剧关联的广告解锁规则">
          <a-select v-model="form.adPushRuleId" allow-clear placeholder="选择规则" style="width: 300px">
            <a-option v-for="rule in adPushRules" :key="rule.id" :value="rule.id">
              {{ rule.ruleName }}（{{ unlockRuleDesc(rule) }}）
            </a-option>
          </a-select>
        </a-form-item>

        <a-form-item v-if="form.unlockMode === 'IAP_ONLY' || form.unlockMode === 'IAA_IAP'" field="episodePrice" label="单集价格（分）">
          <a-input-number
            v-model="form.episodePrice"
            :min="0"
            placeholder="0"
            style="width: 200px"
          />
        </a-form-item>

        <a-form-item v-if="form.unlockMode === 'IAP_ONLY' || form.unlockMode === 'IAA_IAP'" field="bundlePrice" label="整剧价格（分）">
          <a-input-number
            v-model="form.bundlePrice"
            :min="0"
            placeholder="0"
            style="width: 200px"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'DramaAdSettings' })
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { fetchDramaList, updateDrama } from '@/api/drama.ts'
import { fetchAdPushRuleList } from '@/api/ad.ts'
import type { Drama, AdPushRule } from '@/types/drama.ts'
import { unlockModeLabel, unlockModeColor, unlockModeDesc, unlockRuleDesc } from '@/types/drama.ts'
import ResizableTable from "@/components/ResizableTable/index.vue";

const loading = ref(false)
const submitting = ref(false)
const dramaList = ref<Drama[]>([])
const adPushRules = ref<AdPushRule[]>([])
const keyword = ref('')
const modalVisible = ref(false)
const editingDrama = ref<Drama | null>(null)
const formRef = ref()

const filteredList = computed(() => {
  if (!keyword.value) return dramaList.value
  return dramaList.value.filter((d) => d.name.includes(keyword.value))
})

const form = ref({
  freeEpisodes: 0,
  unlockMode: 'IAA_IAP',
  adPushRuleId: undefined as number | string | undefined,
  episodePrice: 0,
  bundlePrice: 0,
})

const formRules = {
  freeEpisodes: [{ required: true, message: '请输入免费集数' }],
}

const columns = ref([
  { title: '短剧', slotName: 'name', width: 220, resizable: true, minWidth: 150 },
  { title: '免费集数', slotName: 'freeEpisodes', width: 100, resizable: true, minWidth: 80 },
  { title: '解锁模式', slotName: 'unlockMode', width: 120, resizable: true, minWidth: 90 },
  { title: '广告规则', slotName: 'adRule', width: 160, resizable: true, minWidth: 100 },
  { title: '单集价格', slotName: 'episodePrice', width: 100, resizable: true, minWidth: 80 },
  { title: '整剧价格', slotName: 'bundlePrice', width: 100, resizable: true, minWidth: 80 },
  { title: '操作', slotName: 'operations', width: 80, resizable: true, minWidth: 60 },
])

async function loadData() {
  loading.value = true
  try {
    const res = await fetchDramaList()
    dramaList.value = res.rows ?? []
  } finally {
    loading.value = false
  }
}

async function loadAdPushRules() {
  try {
    const data = await fetchAdPushRuleList()
    adPushRules.value = Array.isArray(data) ? data : []
  } catch {
    adPushRules.value = []
  }
}

function handleSearch() {
}

function getRuleName(ruleId: number | string | null | undefined): string {
  if (!ruleId) return '—'
  const rule = adPushRules.value.find(r => r.id == ruleId)
  return rule ? rule.ruleName : `规则 #${ruleId}`
}

function openModal(drama: Drama) {
  editingDrama.value = drama
  form.value = {
    freeEpisodes: drama.freeEpisodes ?? 0,
    unlockMode: drama.unlockMode ?? 'IAA_IAP',
    adPushRuleId: drama.adPushRuleId ?? undefined,
    episodePrice: drama.episodePrice ?? 0,
    bundlePrice: drama.bundlePrice ?? 0,
  }
  modalVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  editingDrama.value = null
}

async function handleSave() {
  const errors = await formRef.value.validate()
  if (errors) return
  if (!editingDrama.value) return
  submitting.value = true
  try {
    await updateDrama(editingDrama.value.id, {
      freeEpisodes: form.value.freeEpisodes,
      unlockMode: form.value.unlockMode,
      adPushRuleId: form.value.adPushRuleId,
      episodePrice: form.value.episodePrice,
      bundlePrice: form.value.bundlePrice,
    })
    Message.success('配置保存成功')
    modalVisible.value = false
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadAdPushRules()
})
</script>

<style scoped>
.cover-placeholder {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

.toolbar {
  margin-bottom: 12px;
}

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}

.drama-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.drama-name {
  font-weight: 500;
  color: var(--mc-text-primary);
}

.config-value {
  font-weight: 600;
  color: var(--mc-text-primary);
}
.config-unit {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  margin-left: 2px;
}

.empty-text {
  color: var(--mc-text-disabled);
  font-size: 13px;
}
</style>
