# Skill: 指标趋势折线（TrendChart）

## 定位

`src/views/dashboard/components/TrendChart.vue`：仪表盘第三区，展示新增用户 / 活跃用户 / 广告展示 / 广告完成的 4 线趋势图。

## Props / Emits

```ts
defineProps<{ trendData: TrendPoint[] }>()
defineEmits<{ 'range-change': [payload: { startDate: string; endDate: string }] }>()
```

## 时间段控制

```ts
const rangeOptions = [
  { label: '7天',   value: '7' },
  { label: '30天',  value: '30' },
  { label: '自定义', value: 'custom' },
]
```

- 点击 Tab（非 custom）：`emit('range-change', getDateRange(Number(val)))`。
- 选择 `custom`：显示 `a-range-picker`，change 时 `emit('range-change', { startDate, endDate })`。

## ECharts 配置要点

```ts
import { initChart } from '@/utils/echarts'

function renderChart() {
  if (!chartInstance) chartInstance = initChart(chartRef.value!)

  const dates = trendData.map(d => d.date.slice(5))
  const colors = { cyan: '#5BA8B0', red: '#D94466', green: '#3DB87A', orange: '#D4913A' }

  const mkArea = (hex: string) => ({
    color: {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: hex + '28' },
        { offset: 1, color: hex + '00' },
      ],
    },
  })

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#1C1F2B', borderColor: 'rgba(255,255,255,0.10)', ... },
    legend: { data: ['新增用户', '活跃用户', '广告展示', '广告完成'], bottom: 4, icon: 'roundRect' },
    grid:   { left: 52, right: 52, top: 16, bottom: 48 },
    xAxis:  { type: 'category', data: dates, ... },
    yAxis:  { ... },
    series: [/* 4 条 line 系列，平滑曲线 + 渐变面积 */],
  })
}
```

## 响应式

- 监听 `props.trendData` 变化 → `renderChart()`。
- 监听 `timeRange` 变化 → 切换查询区间。
- `onUnmounted` → `chartInstance?.dispose()`。
- 窗口 resize → `chart.resize()`（建议在实现里补上，目前未显式处理）。

## 视觉细节

- 背景透明，承载在 `trend-card` 容器上。
- 坐标轴、网格线使用 `rgba(255,255,255, 0.07)` 低对比度线。
- 工具提示使用深色毛玻璃 + 圆角 + 阴影，匹配 TikTok 深色主题。
