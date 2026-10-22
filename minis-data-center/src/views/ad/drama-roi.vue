<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">剧 ROI</div>
        <div class="page-subtitle">各短剧广告投放 ROI 分析</div>
      </div>
      <div class="page-actions">
        <a-range-picker v-model="dateRange" style="width: 260px" @change="loadData" />
        <a-input v-model="filters.dramaId" placeholder="短剧ID" allow-clear style="width: 140px" />
        <a-input v-model="filters.advertiserId" placeholder="广告主ID" allow-clear style="width: 150px" />
        <a-input v-model="filters.campaignId" placeholder="推广系列ID" allow-clear style="width: 160px" />
        <a-input v-model="filters.adgroupId" placeholder="广告组ID" allow-clear style="width: 150px" />
        <a-checkbox v-model="filters.includeUnmapped">未映射</a-checkbox>
        <a-button type="primary" @click="loadData">查询</a-button>
      </div>
    </div>

    <div class="table-card">
      <a-table
        :columns="columns"
        :data="list"
        :loading="loading"
        :pagination="false"
        row-key="dramaId"
        :bordered="false"
        :scroll="{ x: '100%' }"
      >
        <template #spend="{ record }">${{ Number(record.spend || 0).toFixed(2) }}</template>
        <template #iaaRevenue="{ record }">${{ Number(record.iaaRevenue || 0).toFixed(2) }}</template>
        <template #iapRevenue="{ record }">${{ Number(record.iapRevenue || 0).toFixed(2) }}</template>
        <template #day0Roas="{ record }">{{ Number(record.day0Roas || 0).toFixed(4) }}</template>
        <template #day0Revenue="{ record }">${{ Number(record.day0Revenue || 0).toFixed(2) }}</template>
        <template #day13Roas="{ record }">{{ Number(record.day13Roas || 0).toFixed(4) }}</template>
        <template #day13Revenue="{ record }">${{ Number(record.day13Revenue || 0).toFixed(2) }}</template>
        <template #totalRoas="{ record }">
          <a-tag :color="Number(record.totalRoas || 0) >= 1 ? 'green' : 'red'" size="small">
            {{ Number(record.totalRoas || 0).toFixed(4) }}
          </a-tag>
        </template>
        <template #conversionCost="{ record }">${{ Number(record.conversionCost || 0).toFixed(4) }}</template>
        <template #conversionRate="{ record }">{{ Number(record.conversionRate || 0).toFixed(2) }}%</template>
        <template #clickCost="{ record }">${{ Number(record.clickCost || 0).toFixed(4) }}</template>
        <template #clickRate="{ record }">{{ Number(record.clickRate || 0).toFixed(2) }}%</template>
        <template #cpm="{ record }">${{ Number(record.cpm || 0).toFixed(4) }}</template>
        <template #action="{ record }">
          <a-button type="text" size="small" @click="openDetail(record)">详情</a-button>
        </template>
      </a-table>
    </div>

    <a-drawer v-model:visible="drawerVisible" :title="`剧 ${selectedDramaId} 趋势`" width="600" :footer="false">
      <div ref="trendChartRef" style="height: 300px; margin-bottom: 20px" ></div>
      <div class="churn-section">
        <div class="section-title">弃剧分析</div>
        <a-empty v-if="!churnData.length" description="暂无数据" />
        <a-table v-else :columns="churnColumns" :data="churnData" :pagination="false" size="small" />
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { fetchDramaRoiList, fetchDramaRoiTrend, fetchDramaChurn } from '@/api/adAttribution.ts'
import type { DramaRoiItem } from '@/types/adDashboard.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const loading = ref(false)
const list = ref<DramaRoiItem[]>([])
const drawerVisible = ref(false)
const selectedDramaId = ref<number>(0)
const trendChartRef = ref<HTMLElement>()
const churnData = ref<any[]>([])
let trendChart: echarts.ECharts | null = null

const dateRange = ref<string[]>(yesterdayTodayRange())
const filters = reactive({
  dramaId: '',
  advertiserId: '',
  campaignId: '',
  adgroupId: '',
  includeUnmapped: false,
})

const columns = [
  { title: '短剧 ID', dataIndex: 'dramaId', width: 100 },
  { title: '消耗', slotName: 'spend', width: 120 },
  { title: 'IAA 收入', slotName: 'iaaRevenue', width: 120 },
  { title: 'IAP 收入', slotName: 'iapRevenue', width: 120 },
  { title: 'D0广告收入ROAS', slotName: 'day0Roas', width: 150 },
  { title: 'D0广告收入', slotName: 'day0Revenue', width: 130 },
  { title: 'D13广告收入ROAS', slotName: 'day13Roas', width: 150 },
  { title: 'D13广告收入', slotName: 'day13Revenue', width: 130 },
  { title: '总 ROAS', slotName: 'totalRoas', width: 120 },
  { title: '转化成本', slotName: 'conversionCost', width: 120 },
  { title: '转化率', slotName: 'conversionRate', width: 100 },
  { title: '转化数', dataIndex: 'conversions', width: 100 },
  { title: '点击成本', slotName: 'clickCost', width: 120 },
  { title: '点击率', slotName: 'clickRate', width: 100 },
  { title: '点击数', dataIndex: 'clicks', width: 100 },
  { title: '展示数', dataIndex: 'impressions', width: 110 },
  { title: 'CPM', slotName: 'cpm', width: 100 },
  { title: '操作', slotName: 'action', width: 80 },
]

const churnColumns = [
  { title: '集数', dataIndex: 'episode', width: 80 },
  { title: '留存率', dataIndex: 'retentionRate', width: 100 },
]

async function loadData() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [s, e] = dateRange.value
  if (!s || !e) return
  loading.value = true
  list.value = []
  fetchDramaRoiList({
    startDate: s,
    endDate: e,
    dramaId: filters.dramaId || undefined,
    advertiserId: filters.advertiserId || undefined,
    campaignId: filters.campaignId || undefined,
    adgroupId: filters.adgroupId || undefined,
    includeUnmapped: filters.includeUnmapped || undefined,
  })
    .then((res: any[]) => { list.value = res || [] })
    .catch(() => { list.value = [] })
    .finally(() => { loading.value = false })
}

async function openDetail(record: any) {
  selectedDramaId.value = record.dramaId
  drawerVisible.value = true
  const [s, e] = dateRange.value
  const [trendRes, churnRes] = await Promise.allSettled([
    fetchDramaRoiTrend(record.dramaId, s, e),
    fetchDramaChurn(record.dramaId),
  ])
  const trend = trendRes.status === 'fulfilled' ? (trendRes.value as any[]) || [] : []
  churnData.value = churnRes.status === 'fulfilled' ? (churnRes.value as any[]) || [] : []
  nextTick(() => {
    if (!trendChartRef.value) return
    if (!trendChart) trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: trend.map((r: any) => r.date) },
      yAxis: { type: 'value' },
      series: [
        { name: 'IAA ROAS', type: 'line', data: trend.map((r: any) => Number(r.iaaRoas || 0).toFixed(4)), smooth: true },
        { name: 'IAP ROAS', type: 'line', data: trend.map((r: any) => Number(r.iapRoas || 0).toFixed(4)), smooth: true },
      ],
    })
  })
}

onMounted(loadData)
onUnmounted(() => {
  trendChart?.dispose()
  trendChart = null
})
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.page-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.table-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); overflow: clip; }
.churn-section { margin-top: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--mc-text-primary); margin-bottom: 12px; }
</style>
