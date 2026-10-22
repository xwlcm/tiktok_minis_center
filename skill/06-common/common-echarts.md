# Skill: ECharts 按需引入

## 位置

`src/utils/echarts.ts`

## 作用

避免全量打包 ECharts，只引入项目用到的图表类型和组件，降低首屏体积。

## 按需清单

```ts
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent, ToolboxComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, BarChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent, ToolboxComponent,
  CanvasRenderer,
])
```

## `initChart(el)` 门面

```ts
export function initChart(el: HTMLElement, theme?: string): echarts.ECharts {
  const existing = echarts.getInstanceByDom(el)
  if (existing) return existing
  return echarts.init(el, theme)
}
```

优点：组件数据变化时重复调用 `initChart` 不会重复创建实例，避免内存泄漏。

## 使用模式

```ts
const chartRef = ref<HTMLElement>()
let chart: ECharts | null = null

function render() {
  if (!chart) chart = initChart(chartRef.value!)
  chart.setOption({ /* ... */ })
}

onUnmounted(() => chart?.dispose())
```

## 新增图表类型

若需要 `ScatterChart / MapChart / Radar` 等，请在 `echarts.use([...])` 中追加导入，不要在业务文件里重复 `import` 完整 `echarts` 包。
