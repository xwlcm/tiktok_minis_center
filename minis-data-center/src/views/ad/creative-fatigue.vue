<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">素材疲劳度</div>
        <div class="page-subtitle">广告素材 CTR 衰减与疲劳状态监控</div>
      </div>
      <div class="page-actions">
        <a-select v-model="statusFilter" placeholder="全部状态" allow-clear style="width: 140px">
          <a-option value="HEALTHY">健康</a-option>
          <a-option value="DECLINING">衰减中</a-option>
          <a-option value="FATIGUED">疲劳</a-option>
        </a-select>
        <a-range-picker v-model="dateRange" style="width: 260px" @change="loadData" />
      </div>
    </div>

    <div class="table-card">
      <a-table :columns="columns" :data="filteredList" :loading="loading" :pagination="{ pageSize: 20 }" row-key="adId" :bordered="false">
        <template #dailyCtr="{ record }">{{ Number(record.dailyCtr || 0).toFixed(4) }}</template>
        <template #ctrPeak7d="{ record }">{{ Number(record.ctrPeak7d || 0).toFixed(4) }}</template>
        <template #fatigueScore="{ record }">{{ Number(record.fatigueScore || 0).toFixed(2) }}</template>
        <template #fatigueStatus="{ record }">
          <a-tag :color="statusColor(record.fatigueStatus)" size="small">
            {{ statusLabel(record.fatigueStatus) }}
          </a-tag>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchCreativeFatigue } from '@/api/adReport.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'

const loading = ref(false)
const list = ref<any[]>([])
const statusFilter = ref<string>('')

const dateRange = ref<string[]>(yesterdayTodayRange())

const filteredList = computed(() => {
  if (!statusFilter.value) return list.value
  return list.value.filter((r: any) => r.fatigueStatus === statusFilter.value)
})

const columns = [
  { title: '广告名称', dataIndex: 'adName', ellipsis: true },
  { title: '统计日期', dataIndex: 'statDate', width: 120 },
  { title: '日 CTR', slotName: 'dailyCtr', width: 100 },
  { title: 'CTR 峰值(7d)', slotName: 'ctrPeak7d', width: 120 },
  { title: '疲劳度', slotName: 'fatigueScore', width: 100 },
  { title: '状态', slotName: 'fatigueStatus', width: 100 },
]

function statusColor(status: string) {
  return ({ HEALTHY: 'green', DECLINING: 'orange', FATIGUED: 'red' } as Record<string, string>)[status] ?? 'gray'
}
function statusLabel(status: string) {
  return ({ HEALTHY: '健康', DECLINING: '衰减中', FATIGUED: '疲劳' } as Record<string, string>)[status] ?? status
}

async function loadData() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [s, e] = dateRange.value
  loading.value = true
  list.value = []
  fetchCreativeFatigue(s, e)
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
