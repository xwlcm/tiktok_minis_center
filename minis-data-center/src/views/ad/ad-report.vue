<template>
  <div class="ad-report">
    <div class="page-header">
      <div>
        <div class="page-title">投放报表</div>
        <div class="page-subtitle">TikTok 广告投放数据与 ROAS 分析</div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <a-range-picker v-model="dateRange" class="filter-item filter-date" @change="handleSearch" />
        <a-select
          v-model="filters.appClientKey"
          placeholder="选择小程序"
          allow-clear
          class="filter-item filter-select"
        >
          <a-option v-for="app in appList" :key="app.clientKey" :value="app.clientKey">
            {{ app.appName }}
          </a-option>
        </a-select>
        <a-select
          v-model="filters.dramaId"
          placeholder="选择短剧"
          allow-clear
          allow-search
          :filter-option="dramaFilterFn"
          class="filter-item filter-select"
        >
          <a-option v-for="d in dramaOptions" :key="d.id" :value="d.id">{{ d.name }}</a-option>
        </a-select>
        <a-select
          v-model="filters.partnerName"
          placeholder="合作商"
          allow-clear
          class="filter-item filter-select"
        >
          <a-option value="" label="暂不聚合">
            暂不聚合
          </a-option>
          <a-option v-for="partner in partnerList" :key="partner" :value="partner">
            {{ partner }}
          </a-option>
        </a-select>
        <a-input v-model="filters.optimizerName" placeholder="优化师" allow-clear class="filter-item filter-input-sm" />
        <a-input 
          placeholder="广告账户ID" 
          allow-clear 
          class="filter-item filter-input"
          :model-value="filters.adAccountId as unknown as string | undefined"
          @update:model-value="(v) => filters.adAccountId = v ? Number(v) : undefined"
        />
      </div>
      <div class="filter-actions">
        <a-button type="primary" @click="handleSearch">
          <template #icon><icon-search /></template>
          查询
        </a-button>
        <a-button @click="handleReset">重置</a-button>
        <a-button @click="handleExportCsv">
          <template #icon><icon-download /></template>
          导出 CSV
        </a-button>
      </div>
    </div>

    <a-spin :loading="loading" dot>
      <div class="summary-row">
        <div v-for="card in summaryCards" :key="card.key" class="summary-card" :style="{ '--accent': card.accent }">
          <div class="summary-icon">
            <component :is="card.icon" />
          </div>
          <div class="summary-body">
            <div class="summary-label">{{ card.label }}</div>
            <div class="summary-value">{{ card.display }}</div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <div class="section-title">消耗 & ROAS 趋势</div>
        <div ref="trendChartRef" class="chart-area"></div>
      </div>

      <div class="view-toggle">
        <a-button :type="viewMode === 'detail' ? 'primary' : 'outline'" size="small" @click="viewMode = 'detail'">
          明细视图
        </a-button>
        <a-button :type="viewMode === 'drama' ? 'primary' : 'outline'" size="small" @click="viewMode = 'drama'">
          短剧聚合
        </a-button>
      </div>
      <div v-if="viewMode === 'detail'" class="table-card">
        <a-table
          v-if="isInternal"
          :columns="internalColumns"
          :data="detailList"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          :bordered="false"
          :scroll="{ x: '100%' }"
          @page-change="onPageChange"
          @page-size-change="onPageSizeChange"
        >
          <template #spend="{ record }">${{ fmtMoney(record.spend) }}</template>
          <template #cashSpend="{ record }">${{ fmtMoney(record.cashSpend) }}</template>
          <template #grantSpend="{ record }">${{ fmtMoney(record.grantSpend) }}</template>
          <template #day0Roas="{ record }">
            <span :class="roasClass(record.day0Roas)">{{ fmtRoas(record.day0Roas) }}</span>
          </template>
          <template #day0Revenue="{ record }">${{ fmtMoney(record.day0Revenue) }}</template>
          <template #day13Roas="{ record }">
            <span :class="roasClass(record.day13Roas)">{{ fmtRoas(record.day13Roas) }}</span>
          </template>
          <template #day13Revenue="{ record }">${{ fmtMoney(record.day13Revenue) }}</template>
          <template #conversionCost="{ record }">${{ fmtMoney(record.conversionCost) }}</template>
          <template #conversionRate="{ record }">{{ fmtPct(record.conversionRate) }}</template>
          <template #clickCost="{ record }">${{ fmtMoney(record.clickCost) }}</template>
          <template #clickRate="{ record }">{{ fmtPct(record.clickRate) }}</template>
          <template #cpm="{ record }">${{ fmtMoney(record.cpm) }}</template>
        </a-table>

        <a-table
          v-else
          :columns="externalColumns"
          :data="detailList"
          :loading="loading"
          :pagination="pagination"
          row-key="id"
          :bordered="false"
          :scroll="{ x: '100%' }"
          @page-change="onPageChange"
          @page-size-change="onPageSizeChange"
        >
          <template #spend="{ record }">${{ fmtMoney(record.spend) }}</template>
          <template #day0Roas="{ record }">
            <span :class="roasClass(record.day0Roas)">{{ fmtRoas(record.day0Roas) }}</span>
          </template>
          <template #day0Revenue="{ record }">${{ fmtMoney(record.day0Revenue) }}</template>
          <template #day13Roas="{ record }">
            <span :class="roasClass(record.day13Roas)">{{ fmtRoas(record.day13Roas) }}</span>
          </template>
          <template #day13Revenue="{ record }">${{ fmtMoney(record.day13Revenue) }}</template>
        </a-table>
      </div>

      <div v-else class="table-card">
        <a-table
          :columns="dramaColumns"
          :data="dramaAggList"
          :loading="loading"
          :pagination="false"
          row-key="dramaName"
          :bordered="false"
          :scroll="{ x: '100%' }"
          :expanded-keys="expandedDramaKeys"
          @expand="handleDramaExpand"
        >
          <template #dramaSpend="{ record }">${{ fmtMoney(record.spend) }}</template>
          <template #dramaRoas="{ record }">
            <span :class="roasClass(record.roas)">{{ fmtRoas(record.roas) }}</span>
          </template>
          <template #dramaDay0Roas="{ record }">
            <span :class="roasClass(record.day0Roas)">{{ fmtRoas(record.day0Roas) }}</span>
          </template>
          <template #dramaDay13Roas="{ record }">
            <span :class="roasClass(record.day13Roas)">{{ fmtRoas(record.day13Roas) }}</span>
          </template>
          <template #expand-row="{ record }">
            <a-table
              :columns="dramaDetailColumns"
              :data="record.details || []"
              :pagination="false"
              :bordered="false"
              size="small"
              row-key="id"
            >
              <template #detailSpend="{ record: r }">${{ fmtMoney(r.spend) }}</template>
              <template #detailDay0Roas="{ record: r }">
                <span :class="roasClass(r.day0Roas)">{{ fmtRoas(r.day0Roas) }}</span>
              </template>
              <template #detailDay13Roas="{ record: r }">
                <span :class="roasClass(r.day13Roas)">{{ fmtRoas(r.day13Roas) }}</span>
              </template>
            </a-table>
          </template>
        </a-table>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdReport' })
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAccountStore } from '@/stores/account.ts'
import { useAppStore } from '@/stores/app.ts'
import { useCountUp } from '@/composables/useCountUp.ts'
import { initChart } from '@/utils/echarts.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'
import { fetchAdReportOverview, fetchAdReportRoas, fetchAdReportDramaList, fetchAdReportDailyRoas, fetchPartnerList } from '@/api/adReport.ts'
import { fetchDramaList } from '@/api/drama.ts'
import type { ECharts } from 'echarts/core'
import {
  IconTrophy,
  IconSearch,
  IconDownload,
} from '@arco-design/web-vue/es/icon'

const accountStore = useAccountStore()
const appStore = useAppStore()

const appList = computed(() => appStore.appList)
const isInternal = computed(() => accountStore.role === 'admin' || accountStore.role === 'operator')

const loading = ref(false)
const viewMode = ref<'detail' | 'drama'>('detail')
const expandedDramaKeys = ref<string[]>([])

const dateRange = ref<string[]>(yesterdayTodayRange())

const filters = reactive({
  appClientKey: undefined as string | undefined,
  dramaId: undefined as number | undefined,
  optimizerName: '',
  adAccountId: undefined as number | undefined,
  appName: '',
  partnerName: '' as string, // 合作商名称，空字符串表示"暂不聚合"
})

const dramaOptions = ref<{ id: number; name: string }[]>([])
const partnerList = ref<string[]>([]) // 合作商列表
async function loadDramaOptions() {
  try {
    const res = await fetchDramaList({ pageSize: 999 })
    dramaOptions.value = ((res as any)?.rows || res || []).map((d: any) => ({
      id: d.id,
      name: d.name,
    }))
  } catch {
    dramaOptions.value = []
  }
}

async function loadPartnerList() {
  try {
    const res = await fetchPartnerList()
    partnerList.value = res || []
  } catch {
    partnerList.value = []
  }
}

function dramaFilterFn(input: string, option: any) {
  const label = option.label ?? option.children?.[0]?.children ?? ''
  return String(label).toLowerCase().includes(input.toLowerCase())
}

const overview = reactive({
  totalSpend: 0,
  roas: 0,
  day0Roas: 0,
  day13Roas: 0,
})

const spendCounter = useCountUp(() => overview.totalSpend ?? 0, 600, (v) => '$' + Number(v).toFixed(2))
const roasCounter = useCountUp(() => overview.roas ?? 0, 600, (v) => Number(v).toFixed(2))
const day0RoasCounter = useCountUp(() => overview.day0Roas ?? 0, 600, (v) => Number(v).toFixed(2))
const day13RoasCounter = useCountUp(() => overview.day13Roas ?? 0, 600, (v) => Number(v).toFixed(2))

const summaryCards = computed(() => [
  { key: 'spend', label: '总消耗', display: spendCounter.formatted.value, icon: IconTrophy, accent: '#4c9de4' },
  { key: 'day0Roas', label: 'D0 ROAS', display: day0RoasCounter.formatted.value, icon: IconTrophy, accent: '#E5A046' },
  { key: 'day13Roas', label: 'D13 ROAS', display: day13RoasCounter.formatted.value, icon: IconTrophy, accent: '#E5A046' },
])


const trendChartRef = ref<HTMLElement>()
let trendChart: ECharts | null = null
const dailyData = ref<any[]>([])
// 新增：保存后端原始数据，用于明细视图
const rawDailyData = ref<any[]>([])

function normalizeDailyDate(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim().slice(0, 10)
}

function normalizeDailyRows(value: unknown) {
  if (!Array.isArray(value)) return []

  // 先过滤出有效数据
  const validRows = value
    .map((item: any) => {
      const date = normalizeDailyDate(item?.date ?? item?.reportDate ?? item?.report_date)
      return date ? { ...item, date } : null
    })
    .filter((item): item is any => item !== null)

  return validRows
}

// 新增：为趋势图按天汇总数据
function aggregateDailyDataForTrend(rows: any[]) {
  if (!Array.isArray(rows) || rows.length === 0) return []

  const aggregatedByDate: Map<string, any> = new Map()

  rows.forEach((row: any) => {
    const date = row.date
    if (!aggregatedByDate.has(date)) {
      aggregatedByDate.set(date, {
        date: date,
        spend: 0,
        day0Roas: 0,
        roasDay0: 0,
        roas0: 0,
        count: 0,
      })
    }

    const agg = aggregatedByDate.get(date)
    agg.count++
    agg.spend += Number(row.spend || 0)
    agg.day0Roas += Number(row.day0Roas || row.roasDay0 || row.roas0 || 0)
    agg.roasDay0 += Number(row.roasDay0 || row.roas0 || 0)
    agg.roas0 += Number(row.roas0 || row.roasDay0 || 0)
  })

  return Array.from(aggregatedByDate.values()).map(agg => ({
    date: agg.date,
    spend: agg.spend,
    day0Roas: agg.count > 0 ? agg.day0Roas / agg.count : 0,
    roasDay0: agg.count > 0 ? agg.roasDay0 / agg.count : 0,
    roas0: agg.count > 0 ? agg.roas0 / agg.count : 0,
  }))
}

function chartDateLabel(date: string) {
  return date.length > 5 ? date.slice(5) : date
}

function dailyDay0Roas(item: any) {
  return Number(item?.day0Roas ?? item?.roasDay0 ?? item?.roas0 ?? 0)
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = initChart(trendChartRef.value)

  const dates = dailyData.value.map(d => chartDateLabel(d.date))
  const spends = dailyData.value.map(d => Number(d.spend || 0))
  const roasValues = dailyData.value.map(d => dailyDay0Roas(d))

  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 24%, transparent)' } },
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderColor: 'color-mix(in srgb, var(--mc-text-primary) 23%, transparent)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 96%, transparent)', fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-radius: 10px;',
    },
    legend: {
      data: ['消耗', 'ROAS'],
      bottom: 4,
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 24,
      textStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 66%, transparent)', fontSize: 11 },
      icon: 'roundRect',
    },
    grid: { left: 56, right: 56, top: 20, bottom: 48 },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: true,
      axisLine: { lineStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 14%, transparent)' } },
      axisTick: { show: false },
      axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 50%, transparent)', fontSize: 11 },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '消耗 ($)',
        position: 'left',
        nameTextStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10, formatter: '${value}' },
        splitLine: { lineStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 14%, transparent)', type: 'dashed' } },
      },
      {
        type: 'value',
        name: 'ROAS',
        position: 'right',
        nameTextStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '消耗',
        type: 'bar',
        yAxisIndex: 0,
        data: spends,
        barWidth: '40%',
        itemStyle: { color: 'rgba(76, 157, 228, 0.6)', borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'ROAS',
        type: 'line',
        yAxisIndex: 1,
        data: roasValues,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#4c9de4', width: 2 },
        itemStyle: { color: '#4c9de4' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(76, 157, 228, 0.20)' },
              { offset: 1, color: 'rgba(76, 157, 228, 0.00)' },
            ],
          },
        },
      },
    ],
  })
}

function handleResize() { trendChart?.resize() }

const detailList = ref<any[]>([])
const dramaAggList = ref<any[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

function onPageChange(page: number) { pagination.current = page }
function onPageSizeChange(size: number) { pagination.pageSize = size; pagination.current = 1 }

const internalColumns = [
  { title: '日期', dataIndex: 'date', width: 100, fixed: 'left' as const },
  { title: '小程序名', dataIndex: 'appName', width: 120 },
  { title: '短剧剧名', dataIndex: 'dramaName', width: 140 },
  { title: '合作商', dataIndex: 'partner', width: 100 },
  { title: '账显消耗', slotName: 'spend', width: 110 },
  { title: '现金消耗', slotName: 'cashSpend', width: 110 },
  { title: '赠款消耗', slotName: 'grantSpend', width: 110 },
  { title: 'Day0 ROAS', slotName: 'day0Roas', width: 110 },
  { title: 'Day0收入', slotName: 'day0Revenue', width: 110 },
  { title: 'Day13 ROAS', slotName: 'day13Roas', width: 110 },
  { title: 'Day13收入', slotName: 'day13Revenue', width: 110 },
  { title: '转化成本', slotName: 'conversionCost', width: 100 },
  { title: '转化率', slotName: 'conversionRate', width: 90 },
  { title: '转化数', dataIndex: 'conversions', width: 80 },
  { title: '点击成本', slotName: 'clickCost', width: 100 },
  { title: '点击率', slotName: 'clickRate', width: 80 },
  { title: '点击数', dataIndex: 'clicks', width: 80 },
  { title: '展示数', dataIndex: 'impressions', width: 90 },
  { title: 'CPM', slotName: 'cpm', width: 90 },
]

const externalColumns = [
  { title: '日期', dataIndex: 'date', width: 110 },
  { title: '小程序名', dataIndex: 'appName', width: 140 },
  { title: '短剧剧名', dataIndex: 'dramaName', width: 160 },
  { title: '广告账显消耗', slotName: 'spend', width: 130 },
  { title: 'Day0 ROAS', slotName: 'day0Roas', width: 110 },
  { title: 'Day0收入', slotName: 'day0Revenue', width: 110 },
  { title: 'Day13 ROAS', slotName: 'day13Roas', width: 110 },
  { title: 'Day13收入', slotName: 'day13Revenue', width: 110 },
]

const dramaColumns = [
  { title: '短剧剧名', dataIndex: 'dramaName', width: 200 },
  { title: '总消耗', slotName: 'dramaSpend', width: 120 },
  { title: '总曝光', dataIndex: 'impressions', width: 110 },
  { title: '总点击', dataIndex: 'clicks', width: 100 },
  { title: '总转化', dataIndex: 'conversions', width: 100 },
  { title: '综合ROAS', slotName: 'dramaRoas', width: 110 },
  { title: 'Day0 ROAS', slotName: 'dramaDay0Roas', width: 110 },
  { title: 'Day13 ROAS', slotName: 'dramaDay13Roas', width: 110 },
]
const dramaDetailColumns = [
  { title: '日期', dataIndex: 'date', width: 100 },
  { title: '消耗', slotName: 'detailSpend', width: 110 },
  { title: 'Day0 ROAS', slotName: 'detailDay0Roas', width: 110 },
  { title: 'Day13 ROAS', slotName: 'detailDay13Roas', width: 110 },
  { title: '转化数', dataIndex: 'conversions', width: 80 },
  { title: '点击数', dataIndex: 'clicks', width: 80 },
]

function handleDramaExpand(rowKeys: any) {
  expandedDramaKeys.value = rowKeys
}

function toFiniteNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function fmtMoney(v: unknown) {
  return toFiniteNumber(v).toFixed(2)
}

function fmtPct(v: unknown) {
  return `${toFiniteNumber(v).toFixed(2)}%`
}

function fmtRoas(v: unknown) {
  return toFiniteNumber(v).toFixed(2)
}

function roasClass(v: unknown) {
  return toFiniteNumber(v) >= 1 ? 'roas-good' : 'roas-bad'
}

async function loadData() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [startDate, endDate] = dateRange.value
  if (!startDate || !endDate) return
  loading.value = true
  detailList.value = []
  dramaAggList.value = []
  dailyData.value = []

  try {
    // 构建统一的查询参数
    const queryParams = {
      startDate,
      endDate,
      appClientKey: filters.appClientKey,
      dramaId: filters.dramaId,
      optimizerName: filters.optimizerName || undefined,
      adAccountId: filters.adAccountId,
      BusinessPartners: filters.partnerName || undefined, // 合作商名称，空字符串时不传
    }

    const [overviewRes, roasRes, dramaListRes, dailyRes] = await Promise.allSettled([
      fetchAdReportOverview(queryParams),
      fetchAdReportRoas(queryParams),
      fetchAdReportDramaList(queryParams),
      fetchAdReportDailyRoas(queryParams),
    ])

    if (overviewRes.status === 'fulfilled' && overviewRes.value) {
      const o = overviewRes.value as any
      overview.totalSpend = o.totalSpend ?? 0
    }

    if (roasRes.status === 'fulfilled' && roasRes.value != null) {
      const r = roasRes.value as any
      overview.roas = Number(r.roas ?? 0) || 0
      overview.day0Roas = Number(r.day0Roas ?? 0) || 0
      overview.day13Roas = Number(r.day13Roas ?? 0) || 0
    }

    if (dramaListRes.status === 'fulfilled' && dramaListRes.value) {
      const list = dramaListRes.value.list
      dramaAggList.value = list.map((item: any, idx: number) => ({
        id: idx,
        dramaName: item.dramaName || `短剧 ${item.dramaId}`,
        spend: item.spend ?? 0,
        impressions: item.impressions ?? 0,
        clicks: item.clicks ?? 0,
        conversions: item.conversions ?? 0,
        roas: item.roas ?? 0,
        day0Roas: item.day0Roas ?? item.roas ?? 0,
        day13Roas: item.day13Roas ?? 0,
        details: [],
      }))
    }

    if (dailyRes.status === 'fulfilled' && dailyRes.value) {
      // 后端已经按日期+短剧剧名聚合好了数据
      const rawData = normalizeDailyRows(dailyRes.value.list)

      // 保存原始数据，用于明细视图
      rawDailyData.value = rawData

      // 趋势图需要按天汇总（将所有短剧的数据合并）
      dailyData.value = aggregateDailyDataForTrend(rawData)

      await nextTick()
      renderTrendChart()
    }

    generateDetailList()
  } catch (e) {
    console.error('[AdReport] 加载数据失败', e)
  } finally {
    loading.value = false
  }
}
function generateDetailList() {
  // 明细视图使用后端原始数据（按日期+短剧剧名聚合）
  const rows: any[] = []

  if (rawDailyData.value.length > 0) {
    rawDailyData.value.forEach((item: any, idx: number) => {
      rows.push({
        id: idx,
        date: item.date || '',
        appName: item.appName || item.minisName || '',
        dramaName: item.dramaName || '',
        partner: item.partner || item.partnerName || '',
        spend: item.spend ?? 0,
        cashSpend: item.cashSpend ?? 0,
        grantSpend: item.grantSpend ?? 0,
        day0Roas: item.day0Roas ?? item.roasDay0 ?? 0,
        day0Revenue: item.day0Revenue ?? 0,
        day13Roas: item.day13Roas ?? item.roasDay13 ?? 0,
        day13Revenue: item.day13Revenue ?? 0,
        conversionCost: item.conversionCost ?? item.cpa ?? 0,
        conversionRate: item.conversionRate ?? 0,
        conversions: item.conversions ?? 0,
        clickCost: item.clickCost ?? item.cpc ?? 0,
        clickRate: item.clickRate ?? item.ctr ?? 0,
        clicks: item.clicks ?? 0,
        impressions: item.impressions ?? 0,
        cpm: item.cpm ?? 0,
      })
    })
  }

  detailList.value = rows
  pagination.total = rows.length
}

function handleSearch() {
  pagination.current = 1
  loadData()
}

function handleReset() {
  filters.appClientKey = undefined
  filters.dramaId = undefined
  filters.optimizerName = ''
  filters.adAccountId = undefined
  filters.partnerName = '' // 重置为"暂不聚合"
  dateRange.value = yesterdayTodayRange()
  handleSearch()
}

function handleExportCsv() {
  const data = viewMode.value === 'drama' ? dramaAggList.value : detailList.value
  if (!data.length) return

  const cols = viewMode.value === 'drama'
    ? ['短剧剧名', '总消耗', '总曝光', '总点击', '总转化', '综合ROAS', 'Day0 ROAS', 'Day13 ROAS']
    : isInternal.value
      ? ['日期', '小程序名', '短剧剧名', '合作商', '账显消耗', '现金消耗', '赠款消耗', 'Day0 ROAS', 'Day0收入', 'Day13 ROAS', 'Day13收入', '转化成本', '转化率', '转化数', '点击成本', '点击率', '点击数', '展示数', 'CPM']
      : ['日期', '小程序名', '短剧剧名', '广告账显消耗', 'Day0 ROAS', 'Day0收入', 'Day13 ROAS', 'Day13收入']

  const header = cols.join(',')
  const rows = data.map((r: any) => {
    if (viewMode.value === 'drama') {
      return [r.dramaName, r.spend, r.impressions, r.clicks, r.conversions, r.roas, r.day0Roas, r.day13Roas].join(',')
    }
    if (isInternal.value) {
      return [r.date, r.appName, r.dramaName, r.partner, r.spend, r.cashSpend, r.grantSpend, r.day0Roas, r.day0Revenue, r.day13Roas, r.day13Revenue, r.conversionCost, r.conversionRate, r.conversions, r.clickCost, r.clickRate, r.clicks, r.impressions, r.cpm].join(',')
    }
    return [r.date, r.appName, r.dramaName, r.spend, r.day0Roas, r.day0Revenue, r.day13Roas, r.day13Revenue].join(',')
  })

  const csv = '\uFEFF' + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const [s, e] = dateRange.value
  a.href = url
  a.download = `投放报表_${s}_${e}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

watch(() => viewMode.value, () => {
  expandedDramaKeys.value = []
})

onMounted(async () => {
  await Promise.all([
    loadDramaOptions(),
    loadPartnerList(),
  ])
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  trendChart = null
})
</script>

<style scoped>
.ad-report {
  padding: 0 0 32px;
  width: 100%;
  max-width: 100%;
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
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}

.page-subtitle {
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  margin-top: 2px;
}

.filter-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.filter-item {
  min-width: 0;
  flex-shrink: 0;
}

.filter-date {
  width: 260px;
}
.filter-select {
  width: 160px;
}
.filter-input-sm {
  width: 120px;
}
.filter-input {
  width: 140px;
}

@media (max-width: 1200px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-row {
    width: 100%;
  }
  .filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    padding: 12px 14px;
  }
  .filter-row > * {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }
  .filter-actions {
    justify-content: flex-start;
  }
  .filter-actions .arco-btn {
    flex: 0 0 auto;
  }
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

@media (max-width: 1024px) {
  .summary-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-row {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0.7;
}

.summary-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 15%, transparent);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  flex-shrink: 0;
}

.summary-label {
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  margin-bottom: 4px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  font-variant-numeric: tabular-nums;
}

.chart-section {
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, #4c9de4, #4c9de4);
  opacity: 0.5;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  margin-bottom: 16px;
}

.chart-area {
  height: 300px;
  width: 100%;
  max-width: 100%;
}

.view-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  max-width: 100%;
}

.table-card :deep(.arco-table-container) {
  overflow-x: auto !important;
}

.roas-good {
  color: #2FBF87;
  font-weight: 600;
}

.roas-bad {
  color: #F2748A;
  font-weight: 600;
}

:deep(.arco-table) {
  --arco-table-bg: transparent;
  --arco-table-tr-bg: transparent;
  --arco-table-td-color: rgba(232, 242, 252, 0.96);
  --arco-table-th-color: rgba(232, 242, 252, 0.57);
  --arco-table-border-color: rgba(232, 242, 252, 0.14);
}

:deep(.arco-table-th) {
  background: rgba(76, 157, 228, 0.04) !important;
}

:deep(.arco-table-tr:hover .arco-table-td) {
  background: rgba(76, 157, 228, 0.04) !important;
}

:deep(.arco-pagination) {
  --arco-pagination-color: rgba(232, 242, 252, 0.96);
}

:deep(.arco-spin-dot-item) {
  background: #4c9de4;
}

:deep(.arco-picker) {
  --arco-picker-bg: #12263D;
  --arco-picker-color: rgba(232, 242, 252, 0.96);
  border-color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent);
}

:deep(.arco-select-view-single) {
  --arco-select-view-bg: #12263D;
  --arco-select-view-color: rgba(232, 242, 252, 0.96);
  border-color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent);
}

:deep(.arco-input-wrapper) {
  --arco-input-bg: #12263D;
  --arco-input-color: rgba(232, 242, 252, 0.96);
  border-color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent);
}
</style>