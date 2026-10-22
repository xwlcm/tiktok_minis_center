<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">地域分析</div>
        <div class="page-subtitle">按国家/地区拆分的广告投放效果</div>
      </div>
      <div class="page-actions">
        <a-range-picker v-model="dateRange" style="width: 260px" @change="loadData" />
      </div>
    </div>

    <a-card class="chart-card" title="Top 10 国家消耗" :loading="loading" style="margin-bottom: 20px">
      <div ref="barChartRef" style="height: 280px" ></div>
    </a-card>

    <div class="table-card">
      <a-table :columns="columns" :data="list" :loading="loading" :pagination="{ pageSize: 20 }" row-key="countryCode" :bordered="false">
        <template #spend="{ record }">${{ Number(record.spend || 0).toFixed(2) }}</template>
        <template #ctr="{ record }">{{ Number(record.ctr || 0).toFixed(4) }}</template>
        <template #cpa="{ record }">{{ record.cpa ? '$' + Number(record.cpa).toFixed(2) : '-' }}</template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { fetchGeoAnalysis } from '@/api/adReport.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const loading = ref(false)
const list = ref<any[]>([])
const barChartRef = ref<HTMLElement>()
let barChart: echarts.ECharts | null = null

const dateRange = ref<string[]>(yesterdayTodayRange())

const columns = [
  { title: '国家代码', dataIndex: 'countryCode', width: 100 },
  { title: '消耗', slotName: 'spend', width: 120 },
  { title: '曝光', dataIndex: 'impressions', width: 100 },
  { title: '点击', dataIndex: 'clicks', width: 100 },
  { title: '转化', dataIndex: 'conversions', width: 100 },
  { title: 'CTR', slotName: 'ctr', width: 100 },
  { title: 'CPA', slotName: 'cpa', width: 100 },
]

async function loadData() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [s, e] = dateRange.value
  loading.value = true
  list.value = []
  fetchGeoAnalysis(s, e)
    .then((res: any[]) => {
      list.value = res || []
      const top10 = [...(res || [])].sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0)).slice(0, 10)
      nextTick(() => {
        if (!barChartRef.value) return
        if (!barChart) barChart = echarts.init(barChartRef.value)
        barChart.setOption({
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: top10.map((r: any) => r.countryCode) },
          yAxis: { type: 'value', name: '消耗 ($)' },
          series: [{ name: '消耗', type: 'bar', data: top10.map((r: any) => Number(r.spend || 0).toFixed(2)), itemStyle: { color: '#4c9de4' } }],
        })
      })
    })
    .catch(() => { list.value = [] })
    .finally(() => { loading.value = false })
}

onMounted(loadData)
onUnmounted(() => {
  barChart?.dispose()
  barChart = null
})
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.page-actions { display: flex; gap: 8px; }
.chart-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); }
.table-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); overflow: clip; }
</style>
