<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">预警中心</div>
        <div class="page-subtitle">广告异常预警触发记录</div>
      </div>
      <div class="page-actions">
        <a-range-picker v-model="dateRange" style="width: 260px" @change="loadData" />
      </div>
    </div>

    <div class="table-card">
      <a-table :columns="columns" :data="list" :loading="loading" :pagination="{ pageSize: 20 }" row-key="id" :bordered="false">
        <template #ruleType="{ record }">
          <a-tag :color="ruleTypeColor(record.ruleType)" size="small">{{ ruleTypeLabel(record.ruleType) }}</a-tag>
        </template>
        <template #alertTime="{ record }">{{ record.alertTime?.replace('T', ' ').slice(0, 19) }}</template>
        <template #isRead="{ record }">
          <a-tag :color="record.isRead ? 'gray' : 'red'" size="small">{{ record.isRead ? '已读' : '未读' }}</a-tag>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAnalyticsAlerts } from '@/api/adAttribution.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'

const loading = ref(false)
const list = ref<any[]>([])

const dateRange = ref<string[]>(yesterdayTodayRange())

const columns = [
  { title: '规则类型', slotName: 'ruleType', width: 130 },
  { title: '触发时间', slotName: 'alertTime', width: 160 },
  { title: '预警内容', dataIndex: 'alertContent', ellipsis: true },
  { title: '关联实体', dataIndex: 'relatedEntityId', width: 120 },
  { title: '已读', slotName: 'isRead', width: 80 },
]

function ruleTypeColor(type: string) {
  return ({ CPA_SPIKE: 'red', CTR_DROP: 'orange', ROAS_DECLINE: 'orangered', FATIGUE: 'purple' } as Record<string, string>)[type] ?? 'gray'
}
function ruleTypeLabel(type: string) {
  return ({ CPA_SPIKE: 'CPA 突增', CTR_DROP: 'CTR 下降', ROAS_DECLINE: 'ROAS 下降', FATIGUE: '素材疲劳' } as Record<string, string>)[type] ?? type
}

async function loadData() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [s, e] = dateRange.value
  loading.value = true
  list.value = []
  fetchAnalyticsAlerts(s, e)
    .then((res: any[]) => { list.value = res || [] })
    .catch(() => { list.value = [] })
    .finally(() => { loading.value = false })
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.page-actions { display: flex; gap: 8px; }
.table-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); overflow: clip; }
</style>
