<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">推送规则</div>
        <div class="page-subtitle">管理广告解锁规则，短剧关联规则后按策略推送广告</div>
      </div>
      <a-button type="primary" @click="openForm()">
        <template #icon><icon-plus /></template>
        新增规则
      </a-button>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="ruleList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="{ pageSize: 20, showTotal: true }"
      >
        <template #ruleName="{ record }">
          <div class="rule-name-cell">
            <span class="rule-name">{{ record.ruleName }}</span>
            <a-tag v-if="record.isDefault === 1" color="orangered" size="small">兜底规则</a-tag>
            <span class="rule-id">ID: {{ record.id }}</span>
          </div>
        </template>
        <template #strategy="{ record }">
          <div class="strategy-cell">
            <span class="strategy-text">
              每 <strong>{{ record.adCountPerUnlock }}</strong> 个广告解锁
              <strong>{{ record.episodesPerUnlock }}</strong> 集
            </span>
            <span class="strategy-limit">
              每日上限：{{ record.maxAdCountPerDay > 0 ? record.maxAdCountPerDay + ' 个' : '不限' }}
            </span>
          </div>
        </template>
        <template #status="{ record }">
          <a-switch
            v-if="record.isDefault !== 1"
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="启用"
            unchecked-text="禁用"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
          <a-tag v-else color="green" size="small">常驻启用</a-tag>
        </template>
        <template #createTime="{ record }">
          <span class="time-text">{{ record.createTime ?? '—' }}</span>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openForm(record)">编辑</a-button>
            <a-popconfirm
              v-if="record.isDefault !== 1"
              content="确定要删除该规则吗？已关联的短剧将失去广告解锁配置。"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="editingRule ? '编辑推送规则' : '新增推送规则'"
      :ok-loading="submitting"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="ruleName" label="规则名称">
          <a-input v-model="form.ruleName" placeholder="如：标准解锁规则" :max-length="64" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="adCountPerUnlock" label="解锁所需广告数" extra="用户需看多少个广告">
              <a-input-number v-model="form.adCountPerUnlock" :min="1" :max="99" placeholder="3" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="episodesPerUnlock" label="每次解锁集数" extra="看完广告解锁几集">
              <a-input-number v-model="form.episodesPerUnlock" :min="1" :max="99" placeholder="5" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item field="maxAdCountPerDay" label="每日广告上限">
          <div class="limit-row">
            <a-checkbox v-model="hasLimit">设置每日上限</a-checkbox>
            <a-input-number
              v-if="hasLimit"
              v-model="form.maxAdCountPerDay"
              :min="1"
              :max="999"
              placeholder="10"
              style="width: 140px; margin-left: 12px"
            />
            <span v-else class="no-limit-text">不限制</span>
          </div>
        </a-form-item>
      </a-form>

      <div class="form-preview">
        <div class="preview-label">规则效果预览</div>
        <div class="preview-text">
          用户每观看 <strong>{{ form.adCountPerUnlock || '?' }}</strong> 个广告，
          解锁 <strong>{{ form.episodesPerUnlock || '?' }}</strong> 集内容<template v-if="hasLimit">，每日最多观看 <strong>{{ form.maxAdCountPerDay }}</strong> 个广告</template><template v-else>，每日不限次数</template>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdPushSettings' })
import { ref, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import {
  fetchAdPushRuleList,
  createAdPushRule,
  updateAdPushRule,
  deleteAdPushRule,
  enableAdPushRule,
  disableAdPushRule,
} from '@/api/ad.ts'
import type { AdPushRule } from '@/types/drama.ts'
import ResizableTable from '@/components/ResizableTable/index.vue'

const appStore = useAppStore()
const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<string | null>(null)
const formVisible = ref(false)
const editingRule = ref<AdPushRule | null>(null)
const formRef = ref()
const ruleList = ref<AdPushRule[]>([])
const hasLimit = ref(false)

const form = ref({
  ruleName: '',
  adCountPerUnlock: 3,
  episodesPerUnlock: 5,
  maxAdCountPerDay: -1,
})

const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称' }],
  adCountPerUnlock: [{ required: true, message: '请输入解锁所需广告数' }],
  episodesPerUnlock: [{ required: true, message: '请输入每次解锁集数' }],
}

const columns = ref([
  { title: '规则名称', slotName: 'ruleName', width: 200, resizable: true, minWidth: 140 },
  { title: '解锁策略', slotName: 'strategy', width: 280, resizable: true, minWidth: 180 },
  { title: '状态', slotName: 'status', width: 100, resizable: true, minWidth: 80 },
  { title: '创建时间', slotName: 'createTime', width: 160, resizable: true, minWidth: 120 },
  { title: '操作', slotName: 'operations', width: 120, resizable: true, minWidth: 90 },
])

async function fetchList() {
  loading.value = true
  try {
    const data = await fetchAdPushRuleList()
    ruleList.value = Array.isArray(data) ? data : []
  } catch {
    ruleList.value = []
  } finally {
    loading.value = false
  }
}

function openForm(rule?: AdPushRule) {
  editingRule.value = rule ?? null
  if (rule) {
    const limited = rule.maxAdCountPerDay != null && rule.maxAdCountPerDay > 0
    hasLimit.value = limited
    form.value = {
      ruleName: rule.ruleName,
      adCountPerUnlock: rule.adCountPerUnlock,
      episodesPerUnlock: rule.episodesPerUnlock,
      maxAdCountPerDay: limited ? rule.maxAdCountPerDay : 10,
    }
  } else {
    hasLimit.value = false
    form.value = {
      ruleName: '',
      adCountPerUnlock: 3,
      episodesPerUnlock: 5,
      maxAdCountPerDay: 10,
    }
  }
  formVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  editingRule.value = null
}

async function handleSave() {
  const errors = await formRef.value.validate()
  if (errors) return

  const maxAd = hasLimit.value ? form.value.maxAdCountPerDay : -1
  if (hasLimit.value && maxAd < form.value.adCountPerUnlock) {
    Message.error('每日广告上限不能小于解锁所需广告数')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ruleName: form.value.ruleName,
      adCountPerUnlock: form.value.adCountPerUnlock,
      episodesPerUnlock: form.value.episodesPerUnlock,
      maxAdCountPerDay: maxAd,
      clientKey: appStore.currentClientKey,
    }

    if (editingRule.value) {
      await updateAdPushRule(editingRule.value.id, payload)
      Message.success('规则更新成功')
    } else {
      await createAdPushRule(payload)
      Message.success('规则创建成功')
    }
    formVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

async function handleToggleStatus(rule: AdPushRule, active: boolean) {
  togglingId.value = rule.id
  try {
    if (active) {
      await enableAdPushRule(rule.id)
    } else {
      await disableAdPushRule(rule.id)
    }
    rule.status = active ? 1 : 0
    Message.success(`规则已${active ? '启用' : '禁用'}`)
  } catch {
    // 错误由拦截器处理
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(rule: AdPushRule) {
  try {
    await deleteAdPushRule(rule.id)
    Message.success('规则已删除')
    fetchList()
  } catch {
    // 错误由拦截器处理
  }
}

watch(() => appStore.currentClientKey, (newVal) => {
  if (newVal) {
    fetchList()
  }
}, { immediate: true })
</script>

<style scoped>
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

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}

.rule-name-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rule-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--mc-text-primary);
}
.rule-id {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.strategy-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.strategy-text {
  font-size: 13px;
  color: var(--mc-text-primary);
}
.strategy-text strong {
  color: var(--mc-primary);
  font-weight: 600;
}
.strategy-limit {
  font-size: 11px;
  color: var(--mc-text-tertiary);
}

.time-text {
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.row-actions {
  display: flex;
  gap: 4px;
}

.limit-row {
  display: flex;
  align-items: center;
}
.no-limit-text {
  margin-left: 12px;
  font-size: 13px;
  color: var(--mc-text-tertiary);
}

.form-preview {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--mc-bg-elevated, rgba(255,255,255,0.03));
  border: 1px solid var(--mc-border);
  border-radius: 8px;
}
.preview-label {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.preview-text {
  font-size: 13px;
  color: var(--mc-text-secondary);
  line-height: 1.6;
}
.preview-text strong {
  color: var(--mc-primary);
  font-weight: 600;
}
</style>
