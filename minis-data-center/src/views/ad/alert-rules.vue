<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">预警规则</div>
        <div class="page-subtitle">配置广告异常预警规则，系统定时评估并触发告警</div>
      </div>
      <a-button type="primary" @click="openForm()">
        <template #icon><icon-plus /></template>
        新增规则
      </a-button>
    </div>

    <div class="table-card">
      <a-table
        :columns="columns"
        :data="ruleList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="{ pageSize: 20, showTotal: true }"
      >
        <template #ruleName="{ record }">
          <span class="rule-name">{{ record.ruleName }}</span>
        </template>
        <template #ruleType="{ record }">
          <a-tag :color="ruleTypeColor(record.ruleType)" size="small">{{ ruleTypeLabel(record.ruleType) }}</a-tag>
        </template>
        <template #threshold="{ record }">
          <span>{{ formatThreshold(record) }}</span>
        </template>
        <template #compareWindow="{ record }">
          <span>{{ record.compareWindow === '7d' ? '7 天' : '24 小时' }}</span>
        </template>
        <template #notifyType="{ record }">
          <a-tag :color="record.notifyType === 'SITE' ? 'blue' : 'purple'" size="small">{{ record.notifyType === 'SITE' ? '站内通知' : '邮件通知' }}</a-tag>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="启用"
            unchecked-text="禁用"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
        </template>
        <template #createTime="{ record }">
          <span class="time-text">{{ record.createTime ?? '—' }}</span>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openForm(record)">编辑</a-button>
            <a-popconfirm
              content="确定要删除该规则吗？"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <a-modal
      v-model:visible="formVisible"
      :title="editingRule ? '编辑预警规则' : '新增预警规则'"
      :ok-loading="submitting"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="ruleName" label="规则名称">
          <a-input v-model="form.ruleName" placeholder="如：CPA 飙升预警" :max-length="64" />
        </a-form-item>

        <a-form-item field="ruleType" label="规则类型">
          <a-select v-model="form.ruleType" placeholder="选择规则类型">
            <a-option value="CPA_SPIKE">CPA 飙升</a-option>
            <a-option value="CTR_DROP">CTR 下降</a-option>
            <a-option value="ROAS_DECLINE">ROAS 衰减</a-option>
            <a-option value="FATIGUE">素材疲劳</a-option>
          </a-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="threshold" label="触发阈值">
              <a-input-number v-model="form.threshold" :min="0" :max="1" :step="0.01" placeholder="0.3" style="width: 100%">
                <template #suffix>
                  <span class="threshold-hint">{{ thresholdHint }}</span>
                </template>
              </a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="compareWindow" label="对比窗口">
              <a-select v-model="form.compareWindow" placeholder="选择对比窗口">
                <a-option value="24h">24 小时</a-option>
                <a-option value="7d">7 天</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item field="notifyType" label="通知方式">
          <a-radio-group v-model="form.notifyType">
            <a-radio value="SITE">站内通知</a-radio>
            <a-radio value="EMAIL">邮件通知</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>

      <div class="form-preview">
        <div class="preview-label">规则效果预览</div>
        <div class="preview-text">
          当 <strong>{{ ruleTypeLabel(form.ruleType) || '?' }}</strong>
          指标在最近 <strong>{{ form.compareWindow === '7d' ? '7 天' : '24 小时' }}</strong>
          内变化超过阈值 <strong>{{ form.threshold ? (form.threshold * 100).toFixed(0) + '%' : '?' }}</strong> 时，
          通过 <strong>{{ form.notifyType === 'SITE' ? '站内通知' : form.notifyType === 'EMAIL' ? '邮件通知' : '?' }}</strong> 发送预警。
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchAlertRuleList,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  changeAlertRuleStatus,
} from '@/api/adAttribution.ts'

const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<number | null>(null)
const formVisible = ref(false)
const editingRule = ref<any>(null)
const formRef = ref()
const ruleList = ref<any[]>([])

const form = ref({
  ruleName: '',
  ruleType: '',
  threshold: 0.3,
  compareWindow: '24h',
  notifyType: 'SITE',
})

const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称' }],
  ruleType: [{ required: true, message: '请选择规则类型' }],
  threshold: [{ required: true, message: '请输入触发阈值' }],
  compareWindow: [{ required: true, message: '请选择对比窗口' }],
  notifyType: [{ required: true, message: '请选择通知方式' }],
}

const columns = [
  { title: '规则名称', slotName: 'ruleName', width: 180 },
  { title: '规则类型', slotName: 'ruleType', width: 120 },
  { title: '触发阈值', slotName: 'threshold', width: 120 },
  { title: '对比窗口', slotName: 'compareWindow', width: 100 },
  { title: '通知方式', slotName: 'notifyType', width: 110 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', slotName: 'createTime', width: 160 },
  { title: '操作', slotName: 'operations', width: 140 },
]

const thresholdHint = computed(() => {
  const t = form.value.ruleType
  if (t === 'CPA_SPIKE') return '如 0.3 表示 CPA 上涨 30% 触发'
  if (t === 'CTR_DROP') return '如 0.2 表示 CTR 下降 20% 触发'
  if (t === 'ROAS_DECLINE') return '如 0.3 表示 ROAS 下降 30% 触发'
  if (t === 'FATIGUE') return '如 0.7 表示疲劳度 > 0.7 触发'
  return ''
})

function ruleTypeColor(type: string) {
  return ({ CPA_SPIKE: 'red', CTR_DROP: 'orange', ROAS_DECLINE: 'orangered', FATIGUE: 'purple' } as Record<string, string>)[type] ?? 'gray'
}

function ruleTypeLabel(type: string) {
  return ({ CPA_SPIKE: 'CPA 飙升', CTR_DROP: 'CTR 下降', ROAS_DECLINE: 'ROAS 衰减', FATIGUE: '素材疲劳' } as Record<string, string>)[type] ?? type
}

function formatThreshold(record: any) {
  const t = record.ruleType
  const v = record.threshold
  if (v == null) return '—'
  if (t === 'FATIGUE') return `> ${v}`
  return `${(v * 100).toFixed(0)}%`
}

async function fetchList() {
  loading.value = true
  try {
    const data = await fetchAlertRuleList()
    ruleList.value = Array.isArray(data) ? data : []
  } catch {
    ruleList.value = []
  } finally {
    loading.value = false
  }
}

function openForm(rule?: any) {
  editingRule.value = rule ?? null
  if (rule) {
    form.value = {
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      threshold: rule.threshold,
      compareWindow: rule.compareWindow,
      notifyType: rule.notifyType,
    }
  } else {
    form.value = {
      ruleName: '',
      ruleType: '',
      threshold: 0.3,
      compareWindow: '24h',
      notifyType: 'SITE',
    }
  }
  formVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  editingRule.value = null
}

async function handleSave() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    if (editingRule.value) {
      await updateAlertRule({
        id: editingRule.value.id,
        ...form.value,
      })
      Message.success('更新成功')
    } else {
      await createAlertRule({ ...form.value })
      Message.success('创建成功')
    }
    formVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(record: any) {
  try {
    await deleteAlertRule(record.id)
    Message.success('删除成功')
    fetchList()
  } catch {
    // error handled by interceptor
  }
}

async function handleToggleStatus(record: any, enabled: boolean) {
  togglingId.value = record.id
  try {
    await changeAlertRuleStatus(record.id, enabled ? 1 : 0)
    record.status = enabled ? 1 : 0
    Message.success(enabled ? '已启用' : '已禁用')
  } catch {
    // 错误由拦截器处理
  } finally {
    togglingId.value = null
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.table-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); overflow: clip; }
.rule-name { font-weight: 600; color: var(--mc-text-primary); }
.time-text { color: var(--mc-text-tertiary); font-size: 12px; }
.row-actions { display: flex; gap: 8px; align-items: center; }
.threshold-hint { font-size: 11px; color: var(--mc-text-tertiary); white-space: nowrap; }
.form-preview { margin-top: 16px; padding: 12px; background: var(--mc-bg-page); border-radius: var(--mc-radius-sm); }
.preview-label { font-size: 12px; color: var(--mc-text-tertiary); margin-bottom: 6px; }
.preview-text { font-size: 13px; color: var(--mc-text-secondary); line-height: 1.6; }
</style>
