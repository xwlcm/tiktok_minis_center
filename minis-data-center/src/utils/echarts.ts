import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
])

/**
 * 初始化 ECharts 实例，若已存在则复用
 */
export function initChart(el: HTMLElement, theme?: string): echarts.ECharts {
  const existing = echarts.getInstanceByDom(el)
  if (existing) return existing
  return echarts.init(el, theme)
}

export { echarts }
