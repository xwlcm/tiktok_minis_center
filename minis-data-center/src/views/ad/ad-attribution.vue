<template>
  <div class="attribution-page">
    <div class="page-header">
      <div>
        <div class="page-title">归因分析</div>
        <div class="page-subtitle">用户全链路归因漏斗与变现效率分析</div>
      </div>
      <div class="page-actions">
        <a-range-picker v-model="dateRange" style="width: 260px" @change="handleDateRangeChange" />
        <a-select
          v-model="selectedDramaId"
          placeholder="选择短剧（可选）"
          allow-search
          allow-clear
          style="width: 200px"
          @change="onDramaChange"
        >
          <a-option v-for="d in dramaList" :key="d.id" :value="d.id" :label="d.name" />
        </a-select>
        <a-button @click="refreshDashboard" :loading="loading">
          <template #icon><icon-refresh /></template>
        </a-button>
      </div>
    </div>

    <a-spin :loading="loading" dot style="width: 100%">
      <a-collapse
        v-model:active-key="activeKeys"
        :bordered="false"
        expand-icon-position="right"
        class="attribution-collapse"
      >
        <a-collapse-item key="1">
          <template #header>
            <span class="layer-name">跳转流失层</span>
            <span class="layer-desc">小程序启动 → 进入 → 到达</span>
          </template>
          <div class="metrics-grid metrics-grid-3">
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">小程序启动数</div>
              <div class="metric-value">{{ launchFmt }}</div>
            </div>
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">成功进入量 PV/UV</div>
              <div class="metric-value">{{ entryPvFmt }}</div>
              <div class="metric-sub">UV: {{ entryUvFmt }}</div>
            </div>
            <div class="metric-card" :style="{ '--accent': arrivalRateColor }">
              <div class="metric-label">到达率/进池率</div>
              <div class="metric-value">{{ sf(arrivalRate) }}%</div>
              <a-progress
                :percent="Number(arrivalRate) || 0"
                :show-text="false"
                :color="arrivalRateColor"
                track-color="rgba(22, 41, 63, 0.08)"
                size="small"
                style="margin-top: 8px"
              />
            </div>
          </div>
        </a-collapse-item>

        <a-collapse-item key="2">
          <template #header>
            <span class="layer-name">内循环活跃层</span>
            <span class="layer-desc">新增用户 → 活跃 → 流失</span>
          </template>
          <div class="metrics-grid metrics-grid-2">
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">新增用户数/UV</div>
              <div class="metric-value">{{ newUsersFmt }}</div>
            </div>
            <div class="metric-card" :style="{ '--accent': bounceRateColor }">
              <div class="metric-label">次跳率/直接流失率</div>
              <div class="metric-value">{{ sf(bounceRate) }}%</div>
              <a-progress
                :percent="Number(bounceRate) || 0"
                :show-text="false"
                :color="bounceRateColor"
                track-color="rgba(22, 41, 63, 0.08)"
                size="small"
                style="margin-top: 8px"
              />
            </div>
          </div>
        </a-collapse-item>

        <a-collapse-item key="3">
          <template #header>
            <span class="layer-name">内容消费层</span>
            <span class="layer-desc">播放 → 观看 → 解锁</span>
          </template>
          <div class="metrics-grid metrics-grid-3">
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">播放量 PV/UV</div>
              <div class="metric-value">{{ playPvFmt }}</div>
              <div class="metric-sub">UV: {{ playUvFmt }}</div>
            </div>
            <div class="metric-card" style="--accent: #db8a24">
              <div class="metric-label">人均观看时长</div>
              <div class="metric-value">{{ formatDurationDisplay(avgWatchDuration) }}</div>
            </div>
            <div class="metric-card" style="--accent: #7b8fe0">
              <div class="metric-label">卡点解锁到达率</div>
              <div class="metric-value">{{ sf(unlockGateRate) }}%</div>
              <a-progress
                :percent="Number(unlockGateRate) || 0"
                :show-text="false"
                color="#7b8fe0"
                track-color="rgba(22, 41, 63, 0.08)"
                size="small"
                style="margin-top: 8px"
              />
            </div>
          </div>
          <div v-if="selectedDramaId" class="churn-section">
            <div class="churn-title">剧集流失漏斗</div>
            <div ref="churnChartRef" class="churn-chart" />
          </div>
        </a-collapse-item>

        <a-collapse-item key="4">
          <template #header>
            <span class="layer-name">IAA 变现层</span>
            <span class="layer-desc">广告请求 → 填充 → 展现 → 收入</span>
          </template>
          <div class="metrics-grid metrics-grid-4x2">
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">广告请求量</div>
              <div class="metric-value">{{ adReqFmt }}</div>
            </div>
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">广告填充量</div>
              <div class="metric-value">{{ adFillFmt }}</div>
            </div>
            <div class="metric-card" :style="{ '--accent': fillRateColor }">
              <div class="metric-label">广告填充率</div>
              <div class="metric-value">{{ sf(adFillRate) }}%</div>
              <a-progress
                :percent="Number(adFillRate) || 0"
                :show-text="false"
                :color="fillRateColor"
                track-color="rgba(22, 41, 63, 0.08)"
                size="small"
                style="margin-top: 8px"
              />
            </div>
            <div class="metric-card" style="--accent: #4c9de4">
              <div class="metric-label">广告展现量/完播数</div>
              <div class="metric-value">{{ adImpFmt }}</div>
              <div class="metric-sub">完播: {{ adCompFmt }}</div>
            </div>
            <div class="metric-card" style="--accent: #22a06b">
              <div class="metric-label">广告展现率</div>
              <div class="metric-value">{{ sf(adImpressionRate) }}%</div>
            </div>
            <div class="metric-card" style="--accent: #db8a24">
              <div class="metric-label">人均广告观看次数</div>
              <div class="metric-value">{{ sf(avgAdViewsPerUser) }}</div>
              <a-tooltip content="大盘参考: 7-8次">
                <div class="metric-ref">大盘: 7-8次</div>
              </a-tooltip>
            </div>
            <div class="metric-card" style="--accent: #7b8fe0">
              <div class="metric-label">eCPM</div>
              <div class="metric-value">${{ sf(ecpm, 2) }}</div>
            </div>
            <div class="metric-card" style="--accent: #22a06b">
              <div class="metric-label">广告变现总收入</div>
              <div class="metric-value">{{ revenueFmt }}</div>
            </div>
          </div>
          <div class="trend-charts">
            <a-card class="trend-chart-card" :bordered="false">
              <div class="trend-chart-title">广告填充率趋势</div>
              <div ref="fillRateChartRef" class="trend-chart" />
            </a-card>
            <a-card class="trend-chart-card" :bordered="false">
              <div class="trend-chart-title">人均广告观看次数趋势</div>
              <div ref="avgAdViewsChartRef" class="trend-chart" />
            </a-card>
            <a-card class="trend-chart-card" :bordered="false">
              <div class="trend-chart-title">eCPM 趋势</div>
              <div ref="ecpmChartRef" class="trend-chart" />
            </a-card>
          </div>
        </a-collapse-item>
      </a-collapse>
    </a-spin>

    <a-card class="history-card" :bordered="false">
      <template #title>
        <div class="history-card-title">
          <div>
            <div class="section-title">归因历史记录</div>
            <div class="section-subtitle">按时间范围查询请求链路，保留透传参数和原始参数快照</div>
          </div>
          <div class="history-card-meta">
            <a-tag color="arcoblue">应用 {{ appStore.currentClientKey || '未选择' }}</a-tag>
            <a-tag color="green">记录 {{ historyPagination.total }}</a-tag>
          </div>
        </div>
      </template>

      <div class="history-toolbar">
        <a-input
          v-model="historyFilters.openId"
          placeholder="openId"
          allow-clear
          style="width: 180px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.linkCode"
          placeholder="推广链接短码"
          allow-clear
          style="width: 160px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.channel"
          placeholder="渠道"
          allow-clear
          style="width: 140px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.campaignId"
          placeholder="campaignId"
          allow-clear
          style="width: 160px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.adgroupId"
          placeholder="adgroupId"
          allow-clear
          style="width: 160px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.creativeId"
          placeholder="creativeId"
          allow-clear
          style="width: 160px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input
          v-model="historyFilters.targetDramaId"
          placeholder="目标短剧ID"
          allow-clear
          style="width: 150px"
          @keyup.enter="handleHistorySearch"
        />
        <a-input-number
          v-model="historyFilters.promoterId"
          placeholder="投手ID"
          allow-clear
          style="width: 150px"
        />
        <a-button type="primary" @click="handleHistorySearch">查询</a-button>
        <a-button @click="handleHistoryReset">重置</a-button>
        <a-button :loading="historyExportLoading" @click="handleHistoryExportCsv">
          <template #icon><icon-download /></template>
          导出 CSV
        </a-button>
        <a-button @click="copyAnalysisLink">
          <template #icon><icon-link /></template>
          复制分析链接
        </a-button>
      </div>

      <div v-if="activeHistoryFilters.length" class="history-active-filters">
        <span class="history-active-label">当前筛选</span>
        <a-space wrap size="mini">
          <span v-for="item in activeHistoryFilters" :key="item.key" class="filter-chip">
            <a-tag color="arcoblue" size="small">{{ item.label }}: {{ item.value }}</a-tag>
            <a-button type="text" size="mini" class="filter-chip-clear" @click="clearHistoryFilter(item.key)">
              清除
            </a-button>
          </span>
        </a-space>
      </div>

      <a-table
        :data="historyRows"
        :loading="historyLoading"
        :pagination="{
          current: historyPagination.current,
          pageSize: historyPagination.pageSize,
          total: historyPagination.total,
          showTotal: true,
          showPageSize: true,
        }"
        :scroll="{ x: 1780 }"
        row-key="id"
        stripe
        @page-change="onHistoryPageChange"
        @page-size-change="onHistoryPageSizeChange"
      >
        <template #columns>
          <a-table-column title="归因时间" data-index="attrTime" :width="170">
            <template #cell="{ record }">
              {{ formatDateTime(record.attrTime) }}
            </template>
          </a-table-column>
          <a-table-column title="openId" data-index="openId" :width="180" ellipsis />
          <a-table-column title="入口来源" :width="110">
            <template #cell="{ record }">
              <a-tag :color="entrySourceColor(record.entrySource)" size="small">
                {{ entrySourceLabel(record.entrySource) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="首次" :width="80" align="center">
            <template #cell="{ record }">
              <a-tag :color="record.isFirst === 1 ? 'green' : 'gray'" size="small">
                {{ record.isFirst === 1 ? '是' : '否' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="推广短码" data-index="linkCode" :width="120" ellipsis />
          <a-table-column title="投手" :width="170" ellipsis>
            <template #cell="{ record }">
              {{ record.promoterName || record.promoterId || '—' }}
            </template>
          </a-table-column>
          <a-table-column title="渠道" data-index="channel" :width="110" ellipsis />
          <a-table-column title="campaignId" :width="150" ellipsis>
            <template #cell="{ record }">
              <a-button
                v-if="record.campaignId"
                type="text"
                size="small"
                class="link-filter"
                @click="handleHistoryQuickFilter('campaignId', record.campaignId)"
              >
                {{ record.campaignId }}
              </a-button>
              <span v-else>—</span>
            </template>
          </a-table-column>
          <a-table-column title="adgroupId" :width="150" ellipsis>
            <template #cell="{ record }">
              <a-button
                v-if="record.adgroupId"
                type="text"
                size="small"
                class="link-filter"
                @click="handleHistoryQuickFilter('adgroupId', record.adgroupId)"
              >
                {{ record.adgroupId }}
              </a-button>
              <span v-else>—</span>
            </template>
          </a-table-column>
          <a-table-column title="creativeId" :width="150" ellipsis>
            <template #cell="{ record }">
              <a-button
                v-if="record.creativeId"
                type="text"
                size="small"
                class="link-filter"
                @click="handleHistoryQuickFilter('creativeId', record.creativeId)"
              >
                {{ record.creativeId }}
              </a-button>
              <span v-else>—</span>
            </template>
          </a-table-column>
          <a-table-column title="目标短剧" :width="120" ellipsis>
            <template #cell="{ record }">
              <a-button
                v-if="record.targetDramaId"
                type="text"
                size="small"
                class="link-filter"
                @click="handleHistoryQuickFilter('targetDramaId', record.targetDramaId)"
              >
                {{ record.targetDramaId }}
              </a-button>
              <span v-else>—</span>
            </template>
          </a-table-column>
          <a-table-column title="参数快照" :width="160">
            <template #cell="{ record }">
              <a-space size="mini">
                <a-tag v-if="record.extParams" color="arcoblue" size="small">透传</a-tag>
                <a-tag v-else size="small">透传空</a-tag>
                <a-tag v-if="record.rawParams" color="green" size="small">原始</a-tag>
                <a-tag v-else size="small">原始空</a-tag>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="140" fixed="right">
            <template #cell="{ record }">
              <a-space size="mini">
                <a-button type="text" size="small" @click="openDetail(record)">详情</a-button>
                <a-button
                  type="text"
                  size="small"
                  :disabled="!record.rawParams"
                  @click="copyRawParams(record)"
                >
                  复制原始
                </a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:visible="detailVisible"
      :title="selectedHistory ? `归因详情 — ${selectedHistory.openId}` : '归因详情'"
      width="760px"
      :footer="false"
    >
      <div v-if="selectedHistory" class="detail-drawer">
        <div class="drawer-actions">
          <a-button size="small" :disabled="!selectedHistory.extParams" @click="copySelectedText(selectedHistory.extParams, '已复制透传参数')">
            复制透传参数
          </a-button>
          <a-button size="small" :disabled="!selectedHistory.rawParams" @click="copySelectedText(selectedHistory.rawParams, '已复制原始参数')">
            复制原始参数
          </a-button>
        </div>

        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="应用标识">{{ selectedHistory.clientKey }}</a-descriptions-item>
          <a-descriptions-item label="归因时间">{{ formatDateTime(selectedHistory.attrTime) }}</a-descriptions-item>
          <a-descriptions-item label="openId">{{ selectedHistory.openId }}</a-descriptions-item>
          <a-descriptions-item label="入口来源">{{ entrySourceLabel(selectedHistory.entrySource) }}</a-descriptions-item>
          <a-descriptions-item label="是否首次">{{ selectedHistory.isFirst === 1 ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="推广短码">{{ selectedHistory.linkCode || '—' }}</a-descriptions-item>
          <a-descriptions-item label="投手">{{ selectedHistory.promoterName || selectedHistory.promoterId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="渠道">{{ selectedHistory.channel || '—' }}</a-descriptions-item>
          <a-descriptions-item label="campaignId">{{ selectedHistory.campaignId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="adgroupId">{{ selectedHistory.adgroupId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="creativeId">{{ selectedHistory.creativeId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="目标短剧">{{ selectedHistory.targetDramaId || '—' }}</a-descriptions-item>
        </a-descriptions>

        <div class="json-panel">
          <div class="json-panel-title">透传参数 extParams</div>
          <pre class="json-block">{{ formatJsonText(selectedHistory.extParams) }}</pre>
        </div>

        <div class="json-panel">
          <div class="json-panel-title">原始参数 rawParams</div>
          <pre class="json-block">{{ formatJsonText(selectedHistory.rawParams) }}</pre>
        </div>
      </div>
      <a-empty v-else description="暂无归因详情" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdAttribution' })
import { Message } from '@arco-design/web-vue'
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { initChart, echarts } from '@/utils/echarts.ts'
import { FunnelChart } from 'echarts/charts'
import { MarkLineComponent, MarkAreaComponent } from 'echarts/components'
import {
  fetchAttributionFunnel,
  fetchAttributionHistoryList,
  fetchAttributionVideoMetrics,
  fetchDramaChurn,
} from '@/api/adAttribution.ts'
import { fetchEcpmTrend } from '@/api/adReport.ts'
import { useDramaStore } from '@/stores/drama.ts'
import { useAppStore } from '@/stores/app.ts'
import { useCountUp } from '@/composables/useCountUp.ts'
import { formatDurationDisplay } from '@/utils/format.ts'
import { formatLocalDate, yesterdayTodayRange } from '@/utils/date-range.ts'
import type { AttributionHistoryVo } from '@/types/adDashboard.ts'
import { IconDownload, IconLink } from '@arco-design/web-vue/es/icon'

echarts.use([FunnelChart, MarkLineComponent, MarkAreaComponent])

const dramaStore = useDramaStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeKeys = ref(['1', '2', '3', '4'])

/** 安全的 toFixed — 防止 undefined/null/string 导致运行时报错 */
function sf(v: number | undefined | null, digits = 1): string {
  const n = Number(v)
  return isNaN(n) ? '0.0' : n.toFixed(digits)
}

const dateRange = ref<string[]>(yesterdayTodayRange())
const selectedDramaId = ref<string | undefined>(undefined)
const dramaList = computed(() => dramaStore.list)
const historyRows = ref<AttributionHistoryVo[]>([])
const historyLoading = ref(false)
const historyExportLoading = ref(false)
const historyPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
})
const historyFilters = reactive({
  openId: '',
  linkCode: '',
  channel: '',
  campaignId: '',
  adgroupId: '',
  creativeId: '',
  targetDramaId: '',
  promoterId: undefined as number | undefined,
})
const detailVisible = ref(false)
const selectedHistory = ref<AttributionHistoryVo | null>(null)
const activeHistoryFilters = computed(() => {
  const items: Array<{ key: HistoryFilterKey; label: string; value: string }> = []
  if (historyFilters.openId) items.push({ key: 'openId', label: 'openId', value: historyFilters.openId })
  if (historyFilters.linkCode) items.push({ key: 'linkCode', label: '推广短码', value: historyFilters.linkCode })
  if (historyFilters.channel) items.push({ key: 'channel', label: '渠道', value: historyFilters.channel })
  if (historyFilters.campaignId) items.push({ key: 'campaignId', label: 'campaignId', value: historyFilters.campaignId })
  if (historyFilters.adgroupId) items.push({ key: 'adgroupId', label: 'adgroupId', value: historyFilters.adgroupId })
  if (historyFilters.creativeId) items.push({ key: 'creativeId', label: 'creativeId', value: historyFilters.creativeId })
  if (historyFilters.targetDramaId) items.push({ key: 'targetDramaId', label: '目标短剧ID', value: historyFilters.targetDramaId })
  if (historyFilters.promoterId != null) items.push({ key: 'promoterId', label: '投手ID', value: String(historyFilters.promoterId) })
  return items
})

function getQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' && first ? first : undefined
  }
  return typeof value === 'string' && value ? value : undefined
}

function applyHistoryQueryFromRoute() {
  const startDate = getQueryValue(route.query.startDate)
  const endDate = getQueryValue(route.query.endDate)
  if (startDate && endDate) {
    dateRange.value = [startDate, endDate]
  }

  const dramaId = getQueryValue(route.query.dramaId)
  selectedDramaId.value = dramaId

  historyFilters.openId = getQueryValue(route.query.openId) || ''
  historyFilters.linkCode = getQueryValue(route.query.linkCode) || ''
  historyFilters.channel = getQueryValue(route.query.channel) || ''
  historyFilters.campaignId = getQueryValue(route.query.campaignId) || ''
  historyFilters.adgroupId = getQueryValue(route.query.adgroupId) || ''
  historyFilters.creativeId = getQueryValue(route.query.creativeId) || ''
  historyFilters.targetDramaId = getQueryValue(route.query.targetDramaId) || ''

  const promoterId = getQueryValue(route.query.promoterId)
  historyFilters.promoterId = promoterId ? Number(promoterId) : undefined

  return getQueryValue(route.query.clientKey)
}

function buildHistoryRouteQuery() {
  const [startDate, endDate] = dateRange.value
  const query: Record<string, string> = {}
  if (appStore.currentClientKey) query.clientKey = appStore.currentClientKey
  if (startDate) query.startDate = startDate
  if (endDate) query.endDate = endDate
  if (selectedDramaId.value) query.dramaId = selectedDramaId.value
  if (historyFilters.openId) query.openId = historyFilters.openId
  if (historyFilters.linkCode) query.linkCode = historyFilters.linkCode
  if (historyFilters.channel) query.channel = historyFilters.channel
  if (historyFilters.campaignId) query.campaignId = historyFilters.campaignId
  if (historyFilters.adgroupId) query.adgroupId = historyFilters.adgroupId
  if (historyFilters.creativeId) query.creativeId = historyFilters.creativeId
  if (historyFilters.targetDramaId) query.targetDramaId = historyFilters.targetDramaId
  if (historyFilters.promoterId != null) query.promoterId = String(historyFilters.promoterId)

  return query
}

async function syncHistoryQuery() {
  const query = buildHistoryRouteQuery()
  await router.replace({ query })
}

const launchCount = ref(0)
const entryPv = ref(0)
const entryUv = ref(0)
const arrivalRate = ref(0)
const newUsers = ref(0)
const bounceRate = ref(0)
const playPv = ref(0)
const playUv = ref(0)
const avgWatchDuration = ref(0)
const unlockGateRate = ref(0)
const adRequests = ref(0)
const adFillCount = ref(0)
const adFillRate = ref(0)
const adImpressions = ref(0)
const adCompletedViews = ref(0)
const adImpressionRate = ref(0)
const avgAdViewsPerUser = ref(0)
const ecpm = ref(0)
const totalAdRevenue = ref(0)

const fillRateTrend = ref<any[]>([])
const avgAdViewsTrend = ref<any[]>([])
const ecpmTrendData = ref<any[]>([])
const churnData = ref<any[]>([])

const churnChartRef = ref<HTMLElement>()
const fillRateChartRef = ref<HTMLElement>()
const avgAdViewsChartRef = ref<HTMLElement>()
const ecpmChartRef = ref<HTMLElement>()

let churnChart: echarts.ECharts | null = null
let fillRateChart: echarts.ECharts | null = null
let avgAdViewsChart: echarts.ECharts | null = null
let ecpmChartInst: echarts.ECharts | null = null

function useMetric(getter: () => number, durationOrFormatter?: number | ((v: number) => string), formatter?: (v: number) => string) {
  let duration = 600
  let fmt: ((v: number) => string) | undefined
  if (typeof durationOrFormatter === 'number') {
    duration = durationOrFormatter
    fmt = formatter
  } else {
    fmt = durationOrFormatter
  }
  const { formatted } = useCountUp(getter, duration, fmt)
  return formatted
}

const launchFmt = useMetric(() => launchCount.value)
const entryPvFmt = useMetric(() => entryPv.value)
const entryUvFmt = useMetric(() => entryUv.value)
const newUsersFmt = useMetric(() => newUsers.value)
const playPvFmt = useMetric(() => playPv.value)
const playUvFmt = useMetric(() => playUv.value)
const adReqFmt = useMetric(() => adRequests.value)
const adFillFmt = useMetric(() => adFillCount.value)
const adImpFmt = useMetric(() => adImpressions.value)
const adCompFmt = useMetric(() => adCompletedViews.value)
const revenueFmt = useMetric(
  () => totalAdRevenue.value,
  800,
  (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
)

const arrivalRateColor = computed(() =>
  arrivalRate.value > 50 ? '#22a06b' : arrivalRate.value < 30 ? '#4c9de4' : '#db8a24',
)
const bounceRateColor = computed(() =>
  bounceRate.value > 40 ? '#4c9de4' : bounceRate.value < 20 ? '#22a06b' : '#db8a24',
)
const fillRateColor = computed(() =>
  adFillRate.value > 70 ? '#22a06b' : adFillRate.value < 50 ? '#4c9de4' : '#db8a24',
)

function addDays(dateText: string, days: number): string {
  const date = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateText
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const text = typeof value === 'string' ? value.replace(' ', 'T') : value
  const date = typeof text === 'string' ? new Date(text) : text
  if (Number.isNaN(date.getTime())) return String(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function entrySourceLabel(source: string): string {
  const map: Record<string, string> = {
    login: '登录',
    touch: '触达',
    share: '分享',
    organic: '自然',
  }
  return map[source] || source || '—'
}

function entrySourceColor(source: string): string {
  const map: Record<string, string> = {
    login: 'arcoblue',
    touch: 'green',
    share: 'orange',
    organic: 'gray',
  }
  return map[source] || 'arcoblue'
}

function formatJsonText(value: string | null | undefined): string {
  if (!value) return '—'
  const text = value.trim()
  if (!text) return '—'
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function buildHistoryParams(pageNum = historyPagination.current, pageSize = historyPagination.pageSize) {
  if (!dateRange.value || dateRange.value.length < 2) return null
  const [startDate, endDate] = dateRange.value
  if (!startDate || !endDate) return null
  return {
    clientKey: appStore.currentClientKey,
    startTime: `${startDate} 00:00:00`,
    endTime: `${addDays(endDate, 1)} 00:00:00`,
    openId: historyFilters.openId || undefined,
    linkCode: historyFilters.linkCode || undefined,
    channel: historyFilters.channel || undefined,
    campaignId: historyFilters.campaignId || undefined,
    adgroupId: historyFilters.adgroupId || undefined,
    creativeId: historyFilters.creativeId || undefined,
    targetDramaId: historyFilters.targetDramaId || undefined,
    promoterId: historyFilters.promoterId == null ? undefined : historyFilters.promoterId,
    pageNum,
    pageSize,
  }
}

function escapeCsvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: AttributionHistoryVo[]) {
  const headers = [
    '归因时间',
    'openId',
    '入口来源',
    '首次',
    '推广短码',
    '投手ID',
    '投手',
    '渠道',
    'campaignId',
    'adgroupId',
    'creativeId',
    '目标短剧ID',
    'extParams',
    'rawParams',
  ]
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((record) =>
      [
        formatDateTime(record.attrTime),
        record.openId,
        entrySourceLabel(record.entrySource),
        record.isFirst === 1 ? '是' : '否',
        record.linkCode,
        record.promoterId ?? '',
        record.promoterName ?? '',
        record.channel,
        record.campaignId,
        record.adgroupId,
        record.creativeId,
        record.targetDramaId,
        formatJsonText(record.extParams),
        formatJsonText(record.rawParams),
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

async function handleHistoryExportCsv() {
  const params = buildHistoryParams(1, Math.max(historyPagination.total, historyRows.value.length, 1))
  if (!params?.clientKey) {
    Message.warning('请先选择应用并加载历史数据')
    return
  }

  historyExportLoading.value = true
  try {
    const res = await fetchAttributionHistoryList(params)
    const rows = res?.rows ?? []
    const [startDate, endDate] = dateRange.value
    const fileName = `归因历史_${startDate || 'start'}_${endDate || 'end'}.csv`
    downloadCsv(fileName, rows)
    Message.success('已导出 CSV')
  } catch (error) {
    console.error('导出归因历史失败', error)
    Message.error('导出失败，请稍后重试')
  } finally {
    historyExportLoading.value = false
  }
}

function buildAnalysisLink() {
  const query = buildHistoryRouteQuery()
  const resolved = router.resolve({ path: route.path, query })
  return new URL(resolved.href, window.location.origin).toString()
}

async function copyAnalysisLink() {
  const link = buildAnalysisLink()
  await copySelectedText(link, '已复制分析链接')
}

function openDetail(record: AttributionHistoryVo) {
  selectedHistory.value = record
  detailVisible.value = true
}

async function copySelectedText(text: string | null | undefined, successMessage: string) {
  if (!text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    Message.success(successMessage)
  } catch {
    Message.error('复制失败，请手动复制')
  }
}

async function copyRawParams(record: AttributionHistoryVo) {
  await copySelectedText(record.rawParams, '已复制原始参数')
}

async function loadDashboard() {
  if (!dateRange.value || dateRange.value.length < 2) return
  const [startDate, endDate] = dateRange.value
  loading.value = true
  fillRateTrend.value = []
  avgAdViewsTrend.value = []
  ecpmTrendData.value = []
  churnData.value = []

  const params: Record<string, any> = { startDate, endDate }
  if (selectedDramaId.value) params.dramaId = Number(selectedDramaId.value)

  try {
    const [funnelRes, videoRes] = await Promise.allSettled([
      fetchAttributionFunnel(params as any),
      fetchAttributionVideoMetrics(params as any),
    ])

    if (funnelRes.status === 'fulfilled' && funnelRes.value) {
      const d = funnelRes.value as any
      launchCount.value = d.launchCount ?? d.impressions ?? 0
      entryPv.value = d.entryPv ?? d.clicks ?? 0
      entryUv.value = d.entryUv ?? 0
      arrivalRate.value = d.arrivalRate ?? d.ctr ?? 0
      newUsers.value = d.newUsers ?? d.conversion ?? 0
      bounceRate.value = d.bounceRate ?? 0
      adRequests.value = d.adRequests ?? 0
      adFillCount.value = d.adFillCount ?? 0
      adFillRate.value = d.adFillRate ?? 0
      adImpressions.value = d.adImpressions ?? d.purchase ?? 0
      adCompletedViews.value = d.adCompletedViews ?? 0
      adImpressionRate.value = d.adImpressionRate ?? 0
      avgAdViewsPerUser.value = d.avgAdViewsPerUser ?? 0
      ecpm.value = d.ecpm ?? 0
      totalAdRevenue.value = d.totalAdRevenue ?? 0
      fillRateTrend.value = d.fillRateTrend ?? []
      avgAdViewsTrend.value = d.avgAdViewsTrend ?? []
    }

    if (videoRes.status === 'fulfilled' && videoRes.value) {
      const v = videoRes.value as any
      playPv.value = v.playPv ?? v.totalPlays ?? 0
      playUv.value = v.playUv ?? 0
      avgWatchDuration.value = v.avgWatchDuration ?? 0
      unlockGateRate.value = v.unlockGateRate ?? v.completionRate ?? 0
    }

    const subRequests: Promise<any>[] = []

    if (selectedDramaId.value) {
      subRequests.push(
        fetchDramaChurn(Number(selectedDramaId.value))
          .then((res: any[]) => {
            churnData.value = res || []
            nextTick(renderChurnChart)
          })
          .catch(() => { churnData.value = [] })
      )
    } else {
      churnData.value = []
    }

    subRequests.push(
      fetchEcpmTrend(startDate, endDate, selectedDramaId.value ? Number(selectedDramaId.value) : undefined)
        .then((res: any[]) => {
          ecpmTrendData.value = res || []
          nextTick(renderTrendCharts)
        })
        .catch(() => { ecpmTrendData.value = [] })
    )

    await Promise.allSettled(subRequests)
  } finally {
    loading.value = false
  }
}

async function loadHistory(resetPage = false) {
  if (resetPage) {
    historyPagination.current = 1
  }

  const params = buildHistoryParams()
  if (!params?.clientKey) {
    historyRows.value = []
    historyPagination.total = 0
    return
  }

  historyLoading.value = true
  try {
    const res = await fetchAttributionHistoryList(params)
    historyRows.value = res?.rows ?? []
    historyPagination.total = res?.total ?? 0
  } catch (error) {
    console.error('加载归因历史失败', error)
    historyRows.value = []
    historyPagination.total = 0
  } finally {
    historyLoading.value = false
  }
}

async function loadData(resetHistoryPage = false) {
  await Promise.allSettled([loadDashboard(), loadHistory(resetHistoryPage)])
}

function handleDateRangeChange() {
  syncHistoryQuery().catch(() => {})
  loadData(true)
}

function refreshDashboard() {
  syncHistoryQuery().catch(() => {})
  loadData(true)
}

function onDramaChange() {
  syncHistoryQuery().catch(() => {})
  loadDashboard()
}

function handleHistorySearch() {
  syncHistoryQuery().catch(() => {})
  loadHistory(true)
}

function handleHistoryQuickFilter(field: 'campaignId' | 'adgroupId' | 'creativeId' | 'targetDramaId', value: string | null | undefined) {
  if (!value) return
  historyFilters[field] = value
  syncHistoryQuery().catch(() => {})
  loadHistory(true)
}

type HistoryFilterKey =
  | 'openId'
  | 'linkCode'
  | 'channel'
  | 'campaignId'
  | 'adgroupId'
  | 'creativeId'
  | 'targetDramaId'
  | 'promoterId'

function clearHistoryFilter(field: HistoryFilterKey) {
  if (field === 'promoterId') {
    historyFilters.promoterId = undefined
  } else {
    historyFilters[field] = ''
  }
  syncHistoryQuery().catch(() => {})
  loadHistory(true)
}

function handleHistoryReset() {
  historyFilters.openId = ''
  historyFilters.linkCode = ''
  historyFilters.channel = ''
  historyFilters.campaignId = ''
  historyFilters.adgroupId = ''
  historyFilters.creativeId = ''
  historyFilters.targetDramaId = ''
  historyFilters.promoterId = undefined
  syncHistoryQuery().catch(() => {})
  loadHistory(true)
}

function onHistoryPageChange(page: number) {
  historyPagination.current = page
  loadHistory()
}

function onHistoryPageSizeChange(pageSize: number) {
  historyPagination.pageSize = pageSize
  historyPagination.current = 1
  loadHistory()
}

const chartTextColor = '#9CA3AF'
const chartGridColor = 'rgba(22, 41, 63, 0.08)'

function renderChurnChart() {
  if (!churnChartRef.value || !churnData.value.length) return
  if (!churnChart) churnChart = initChart(churnChartRef.value)

  const data = churnData.value
  let maxDropIdx = -1
  let maxDrop = 0
  for (let i = 1; i < data.length; i++) {
    const drop = (data[i - 1].retentionRate ?? 100) - (data[i].retentionRate ?? 0)
    if (drop > maxDrop) {
      maxDrop = drop
      maxDropIdx = i
    }
  }

  churnChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}<br/>留存率: ${p.value}%`,
    },
    series: [{
      type: 'funnel',
      left: '10%',
      right: '10%',
      top: 20,
      bottom: 20,
      sort: 'none',
      gap: 4,
      label: { show: true, position: 'inside', color: '#fff', fontSize: 12 },
      itemStyle: {
        borderColor: 'transparent',
        color: (params: any) => params.dataIndex === maxDropIdx ? '#4c9de4' : '#4c9de4',
      },
      data: data.map((d: any) => ({
        name: `第${d.episode ?? d.episodeNumber}集`,
        value: d.retentionRate ?? 0,
      })),
    }],
  })
}

function renderTrendCharts() {
  renderFillRateChart()
  renderAvgAdViewsChart()
  renderEcpmChart()
}

function renderFillRateChart() {
  if (!fillRateChartRef.value) return
  if (!fillRateChart) fillRateChart = initChart(fillRateChartRef.value)

  const data = fillRateTrend.value
  const dates = data.map((d: any) => d.date)
  const values = data.map((d: any) => d.fillRate ?? d.value ?? 0)

  fillRateChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>填充率: ${p[0].value}%` },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: chartTextColor, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: chartTextColor, fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: chartGridColor } },
    },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      lineStyle: { color: '#4c9de4' },
      itemStyle: { color: '#4c9de4' },
      areaStyle: { color: 'rgba(76, 157, 228, 0.1)' },
      markLine: {
        silent: true,
        lineStyle: { color: '#4c9de4', type: 'dashed' },
        data: [{ yAxis: 70 }],
        label: { color: '#4c9de4', fontSize: 10, formatter: '70%' },
      },
    }],
  }, true)
}

function renderAvgAdViewsChart() {
  if (!avgAdViewsChartRef.value) return
  if (!avgAdViewsChart) avgAdViewsChart = initChart(avgAdViewsChartRef.value)

  const data = avgAdViewsTrend.value
  const dates = data.map((d: any) => d.date)
  const values = data.map((d: any) => d.avgAdViews ?? d.value ?? 0)

  avgAdViewsChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: chartTextColor, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartTextColor, fontSize: 10 },
      splitLine: { lineStyle: { color: chartGridColor } },
    },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      lineStyle: { color: '#db8a24' },
      itemStyle: { color: '#db8a24' },
      areaStyle: { color: 'rgba(240,160,64,0.1)' },
      markArea: {
        silent: true,
        data: [[
          {
            yAxis: 7,
            itemStyle: { color: 'rgba(240,160,64,0.08)' },
            label: { show: true, position: 'insideTop', formatter: '大盘 7-8x', color: '#db8a24', fontSize: 10 },
          },
          { yAxis: 8 },
        ]],
      },
    }],
  }, true)
}

function renderEcpmChart() {
  if (!ecpmChartRef.value) return
  if (!ecpmChartInst) ecpmChartInst = initChart(ecpmChartRef.value)

  const data = ecpmTrendData.value
  const dates = data.map((d: any) => d.date)
  const values = data.map((d: any) => Number(d.ecpm ?? d.value ?? 0).toFixed(2))

  ecpmChartInst.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].axisValue}<br/>eCPM: $${p[0].value}` },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: chartTextColor, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: chartTextColor, fontSize: 10, formatter: '${value}' },
      splitLine: { lineStyle: { color: chartGridColor } },
    },
    grid: { left: 50, right: 16, top: 16, bottom: 24 },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      lineStyle: { color: '#7b8fe0' },
      itemStyle: { color: '#7b8fe0' },
      areaStyle: { color: 'rgba(155,126,196,0.1)' },
    }],
  }, true)
}

function handleResize() {
  churnChart?.resize()
  fillRateChart?.resize()
  avgAdViewsChart?.resize()
  ecpmChartInst?.resize()
}

watch(
  () => appStore.currentClientKey,
  (currentKey, previousKey) => {
    if (currentKey && currentKey !== previousKey) {
      syncHistoryQuery().catch(() => {})
      loadData(true)
    }
  },
)

onMounted(async () => {
  dramaStore.fetchList()
  const routeClientKey = applyHistoryQueryFromRoute()
  if (routeClientKey && routeClientKey !== appStore.currentClientKey) {
    try {
      await appStore.switchApp(routeClientKey)
    } catch (error) {
      console.error('切换应用失败', error)
      Message.error('没有权限访问这个应用')
      return
    }
  }
  loadData(true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  churnChart?.dispose()
  fillRateChart?.dispose()
  avgAdViewsChart?.dispose()
  ecpmChartInst?.dispose()
  churnChart = null
  fillRateChart = null
  avgAdViewsChart = null
  ecpmChartInst = null
})
</script>

<style scoped>
.attribution-page {
  padding: 0 0 32px;
  min-height: 100%;
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
  color: rgba(22, 41, 63, 0.92);
}

.page-subtitle {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.47);
  margin-top: 2px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-card {
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid rgba(31, 80, 132, 0.13);
  border-radius: 12px;
}

.history-card :deep(.arco-card-header) {
  border-bottom: 1px solid rgba(31, 80, 132, 0.09);
}

.history-card :deep(.arco-card-body) {
  padding-top: 16px;
}

.history-card-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.history-card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
}

.section-subtitle {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.47);
  margin-top: 2px;
}

.history-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.history-active-filters {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: rgba(76, 157, 228, 0.08);
  border: 1px solid rgba(76, 157, 228, 0.16);
  border-radius: 8px;
}

.history-active-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
  line-height: 20px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.filter-chip-clear {
  padding: 0 2px;
  color: rgba(22, 41, 63, 0.7);
}

.filter-chip-clear:hover {
  color: #6fb6f2;
}

.detail-drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.json-panel {
  padding: 14px 16px;
  background: #f9fafc;
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 8px;
}

.json-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
  margin-bottom: 8px;
}

.json-block {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(22, 41, 63, 0.92);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}

.link-filter {
  padding: 0;
  color: #4c9de4;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-filter:hover {
  color: #6fb6f2;
}

.attribution-collapse {
  background: transparent;
}

.attribution-collapse :deep(.arco-collapse-item) {
  background: #ffffff;
  border: 1px solid rgba(31, 80, 132, 0.13);
  border-radius: 10px !important;
  margin-bottom: 12px;
  overflow: hidden;
}

.attribution-collapse :deep(.arco-collapse-item-header) {
  background: transparent;
  border-bottom: 1px solid rgba(31, 80, 132, 0.09);
}

.attribution-collapse :deep(.arco-collapse-item-content) {
  background: transparent;
  padding: 16px 20px;
}

.layer-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
}

.layer-desc {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.47);
  margin-left: 8px;
}

.metrics-grid {
  display: grid;
  gap: 12px;
}

.metrics-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.metrics-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.metrics-grid-4x2 {
  grid-template-columns: repeat(4, 1fr);
}

.metric-card {
  padding: 16px 18px;
  background: #f9fafc;
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0.7;
}

.metric-card:hover {
  border-color: var(--accent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 15%, transparent);
}

.metric-label {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.47);
  margin-bottom: 6px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: rgba(22, 41, 63, 0.92);
  font-variant-numeric: tabular-nums;
}

.metric-sub {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.41);
  margin-top: 4px;
}

.metric-ref {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.34);
  margin-top: 4px;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
}

.churn-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(31, 80, 132, 0.11);
}

.churn-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
  margin-bottom: 12px;
}

.churn-chart {
  height: 280px;
  width: 100%;
}

.trend-charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(31, 80, 132, 0.11);
}

.trend-chart-card {
  background: #f9fafc;
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 8px;
}

.trend-chart-card :deep(.arco-card-body) {
  padding: 14px 16px;
}

.trend-chart-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(22, 41, 63, 0.74);
  margin-bottom: 10px;
}

.trend-chart {
  height: 200px;
  width: 100%;
}

:deep(.arco-spin-dot-item) {
  background: #4c9de4;
}

:deep(.arco-picker) {
  --arco-picker-bg: #ffffff;
  --arco-picker-color: rgba(22, 41, 63, 0.92);
  border-color: rgba(31, 80, 132, 0.22);
}

:deep(.arco-select-view-single) {
  --arco-select-view-bg: #ffffff;
  --arco-select-view-color: rgba(22, 41, 63, 0.92);
  border-color: rgba(31, 80, 132, 0.22);
}

:deep(.arco-progress-line-bar) {
  border-radius: 3px;
}

:deep(.arco-progress-line-wrapper) {
  border-radius: 3px;
  background: rgba(76, 157, 228, 0.07);
}
</style>
