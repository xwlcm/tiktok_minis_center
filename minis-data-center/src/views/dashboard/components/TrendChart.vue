<template>
  <div class="trend-card">
    <div class="trend-header">
      <div class="trend-title-wrap">
        <div class="trend-title">指标趋势</div>
        <div class="trend-desc">{{ trendDesc }}</div>
      </div>
      <div class="trend-controls">
        <div class="range-tabs">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            class="range-tab"
            :class="{ active: timeRange === opt.value }"
            @click="handleRangeClick(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <a-range-picker
          v-if="timeRange === 'custom'"
          v-model="customRange"
          size="small"
          style="width: 220px"
          @change="handleCustomRangeChange"
        />
      </div>
    </div>
    <div ref="chartRef" class="chart-area" ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { initChart } from '@/utils/echarts.ts'
import { recentDaysRange } from '@/utils/date-range.ts'
import type { TrendPoint } from '@/types/dashboard.ts'
import type { ECharts } from 'echarts/core'

const props = defineProps<{
  trendData: TrendPoint[]
  appType: string
}>()
const emit = defineEmits<{ 'range-change': [payload: { startDate: string; endDate: string }] }>()

const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null
const timeRange = ref('2')
const customRange = ref<(string | number | Date)[] | undefined>(undefined)

const rangeOptions = [
  { label: '2天', value: '2' },
  { label: '7天', value: '7' },
  { label: '30天', value: '30' },
  { label: '自定义', value: 'custom' },
]

interface TrendSeriesItem {
  name: string
  yAxisIndex: number
  [key: string]: unknown
}

const trendDesc = computed(() => {
  const type = props.appType || 'IAA'
  if (type === 'IAP') return '新增用户 · 活跃用户 · IAP 数据'
  if (type === 'IAA_IAP') return '新增用户 · 活跃用户 · 广告 · IAP 数据'
  return '新增用户 · 活跃用户 · 广告数据'
})

function getDateRange(days: number) {
  const [startDate, endDate] = recentDaysRange(days)
  return { startDate, endDate }
}

function handleRangeClick(val: string) {
  timeRange.value = val
  if (val !== 'custom') emit('range-change', getDateRange(Number(val)))
}

function handleCustomRangeChange(val: (string | number | Date | undefined)[] | undefined) {
  if (!val || val.length < 2) return
  emit('range-change', { startDate: String(val[0] ?? ''), endDate: String(val[1] ?? '') })
}

function renderChart() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = initChart(chartRef.value)

  const dates = props.trendData.map(d => d.date.slice(5))
  const type = props.appType || 'IAA'

  const C = {
    cyan:   '#4c9de4',
    red:    '#4c9de4',
    green:  '#2FBF87',
    orange: '#E5A046',
    purple: '#93A6F0',
  }

  const mkArea = (hex: string) => ({
    color: {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: hex + '28' },
        { offset: 1, color: hex + '00' },
      ],
    },
  })

  const series: TrendSeriesItem[] = [
    {
      name: '新增用户', type: 'line', smooth: 0.5,
      data: props.trendData.map(d => d.newUsers),
      yAxisIndex: 0, symbol: 'none',
      lineStyle: { color: C.cyan, width: 2 },
      areaStyle: mkArea(C.cyan),
    },
    {
      name: '活跃用户', type: 'line', smooth: 0.5,
      data: props.trendData.map(d => d.activeUsers),
      yAxisIndex: 0, symbol: 'none',
      lineStyle: { color: C.green, width: 2 },
      areaStyle: mkArea(C.green),
    },
  ]

  const legendData: string[] = ['新增用户', '活跃用户']

  if (type === 'IAA' || type === 'IAA_IAP') {
    series.push(
      {
        name: '广告展示', type: 'line', smooth: 0.5,
        data: props.trendData.map(d => d.adImpressions),
        yAxisIndex: 1, symbol: 'none',
        lineStyle: { color: C.orange, width: 1.5, type: 'dashed' },
      },
      {
        name: '广告完成', type: 'line', smooth: 0.5,
        data: props.trendData.map(d => d.adCompletions),
        yAxisIndex: 1, symbol: 'none',
        lineStyle: { color: C.red, width: 1.5, type: 'dashed' },
      },
    )
    legendData.push('广告展示', '广告完成')
  }

  if (type === 'IAP' || type === 'IAA_IAP') {
    series.push({
      name: 'IAP 收入', type: 'line', smooth: 0.5,
      data: props.trendData.map(d => d.iapRevenue ?? d.watchDuration ?? 0),
      yAxisIndex: 1, symbol: 'none',
      lineStyle: { color: C.purple, width: 1.5, type: 'dashed' },
    })
    legendData.push('IAP 收入')
  }

  const hasRightAxis = series.some(s => s.yAxisIndex === 1)

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 14%, transparent)', width: 1 } },
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderColor: 'color-mix(in srgb, var(--mc-text-primary) 23%, transparent)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 96%, transparent)', fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-radius: 10px;',
    },
    legend: {
      data: legendData,
      bottom: 4,
      itemWidth: 16, itemHeight: 3, itemGap: 24,
      textStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 66%, transparent)', fontSize: 11 },
      icon: 'roundRect',
    },
    grid: { left: 52, right: hasRightAxis ? 52 : 20, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 14%, transparent)' } },
      axisTick: { show: false },
      axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 50%, transparent)', fontSize: 11, rotate: dates.length > 20 ? 30 : 0 },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: 'value', name: '用户', position: 'left',
        nameTextStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 14%, transparent)', type: 'dashed' } },
      },
      hasRightAxis ? {
        type: 'value', name: type === 'IAA_IAP' ? '广告/收入' : (type === 'IAP' ? '收入' : '广告'),
        position: 'right',
        nameTextStyle: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: 'color-mix(in srgb, var(--mc-text-primary) 41%, transparent)', fontSize: 10 },
        splitLine: { show: false },
      } : undefined,
    ].filter(Boolean),
    series,
  })
}

watch(() => props.trendData, async () => { await nextTick(); renderChart() }, { deep: true })
function handleResize() { chartInstance?.resize() }

onMounted(async () => {
  await nextTick()
  renderChart()
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.trend-card {
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.trend-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, #4c9de4, #4c9de4);
  opacity: 0.6;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  flex-wrap: wrap;
  gap: 12px;
}

.trend-title-wrap { display: flex; flex-direction: column; gap: 2px; }
.trend-title {
  font-size: 14px;
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}
.trend-desc {
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
}

.trend-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.range-tabs {
  display: flex;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  flex-wrap: wrap;
}
.range-tab {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.range-tab:hover { color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); background: color-mix(in srgb, var(--mc-text-primary) 14%, transparent); }
.range-tab.active {
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.12);
  font-weight: 600;
}

.chart-area {
  height: 340px;
  padding: 4px 0;
  min-width: 0;
}

@media (max-width: 640px) {
  .chart-area {
    height: 240px;
  }
  .trend-controls {
    width: 100%;
  }
}
</style>
