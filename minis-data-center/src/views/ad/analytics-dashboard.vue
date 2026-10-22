<template>
  <div class="analytics-dashboard-page">
    <div class="page-header">
      <div>
        <div class="page-title">数据看板</div>
        <div class="page-subtitle">从获客到内容承接、广告解锁和投放回收的关键经营信号</div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="goReport">
          <template #icon><icon-bar-chart /></template>
          投放报表
        </a-button>
      </div>
    </div>

    <section class="filter-panel">
      <a-range-picker v-model="dateRange" style="width: 260px" @change="loadDashboard" />
      <a-select
        v-model="filters.dramaId"
        placeholder="短剧"
        allow-clear
        allow-search
        style="width: 190px"
        @change="loadDashboard"
      >
        <a-option v-for="drama in dramaList" :key="drama.id" :value="drama.id" :label="drama.name" />
      </a-select>
      <a-input v-model="filters.campaignId" placeholder="campaign_id" allow-clear @press-enter="loadDashboard" />
      <a-input v-model="filters.adgroupId" placeholder="adgroup_id" allow-clear @press-enter="loadDashboard" />
      <a-input v-model="filters.creativeId" placeholder="creative_id" allow-clear @press-enter="loadDashboard" />
      <a-select v-model="filters.channel" placeholder="渠道" allow-clear style="width: 130px" @change="loadDashboard">
        <a-option value="organic">organic</a-option>
        <a-option value="paid">paid</a-option>
        <a-option value="tiktok">tiktok</a-option>
      </a-select>
      <a-select v-model="filters.userScope" placeholder="用户范围" allow-clear style="width: 130px" @change="loadDashboard">
        <a-option value="all">全部用户</a-option>
        <a-option value="new">新用户</a-option>
        <a-option value="returning">回访用户</a-option>
      </a-select>
      <a-button type="primary" :loading="loading" @click="loadDashboard">
        <template #icon><icon-refresh /></template>
      </a-button>
    </section>

    <a-spin :loading="loading" dot style="width: 100%">
      <a-empty v-if="empty" description="暂无看板数据" class="empty-state" />
      <template v-else>
        <a-tabs v-model:active-key="activeDashboardTab" class="dashboard-tabs" type="rounded">
          <a-tab-pane key="overview" title="运营总览">
            <div class="dashboard-tab-content">
              <section class="decision-board">
                <div class="decision-hero panel">
                  <div class="decision-score-ring" :class="`decision-score-ring--${overallDecision.tone}`">
                    <span>{{ overallDecision.score }}</span>
                    <small>投放健康分</small>
                  </div>
                  <div class="decision-copy">
                    <div class="decision-eyebrow">运营判断</div>
                    <div class="decision-title">{{ overallDecision.title }}</div>
                    <div class="decision-desc">{{ overallDecision.description }}</div>
                  </div>
                </div>

                <div class="action-grid">
                  <div
                    v-for="action in operatorActions"
                    :key="action.key"
                    class="action-card"
                    :class="`action-card--${action.tone}`"
                  >
                    <div class="action-card-header">
                      <span>{{ action.title }}</span>
                      <a-tag size="small" :color="action.color">{{ action.badge }}</a-tag>
                    </div>
                    <strong>{{ action.value }}</strong>
                    <p>{{ action.description }}</p>
                  </div>
                </div>
              </section>

              <section class="signal-panel panel">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">投放信号矩阵</div>
                    <div class="panel-subtitle">按链路拆解异常来源，快速判断该扩量、优化还是止损</div>
                  </div>
                </div>
                <div class="signal-grid">
                  <div v-for="signal in decisionSignals" :key="signal.key" class="signal-item">
                    <div class="signal-item-head">
                      <span>{{ signal.label }}</span>
                      <strong :class="`signal-status--${signal.tone}`">{{ signal.status }}</strong>
                    </div>
                    <div class="signal-track">
                      <div
                        class="signal-fill"
                        :class="`signal-fill--${signal.tone}`"
                        :style="{ width: signal.width }"
                      />
                    </div>
                    <div class="signal-meta">
                      <span>{{ signal.value }}</span>
                      <em>{{ signal.hint }}</em>
                    </div>
                  </div>
                </div>
              </section>

              <section class="overview-grid">
                <div v-for="metric in overviewCoreMetrics" :key="metric.key" class="metric-tile">
                  <div class="metric-topline">
                    <span class="metric-label-with-help">
                      <span>{{ metric.label }}</span>
                      <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                        <template #content>
                          <div class="metric-help-content">
                            <div>{{ metric.description }}</div>
                            <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                          </div>
                        </template>
                        <icon-question-circle class="metric-help-icon" />
                      </a-tooltip>
                    </span>
                    <span class="source-badge" :class="sourceClass(metric.dataSource)">{{ sourceLabel(metric.dataSource) }}</span>
                  </div>
                  <div class="metric-value">{{ formatMetric(metric) }}</div>
                </div>
              </section>
            </div>
          </a-tab-pane>

          <a-tab-pane key="acquisition" title="获客承接">
            <section class="content-grid dashboard-tab-content">
              <div class="panel panel-wide acquisition-panel">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">跳转流失层</div>
                    <div class="panel-subtitle">TikTok 点击到小程序启动的获客承接效率</div>
                  </div>
                  <a-tooltip position="top">
                    <template #content>
                      <div class="metric-help-content">
                        <div>从 TikTok 点击到小程序启动的整体到达比例。</div>
                        <div class="metric-help-formula">公式：小程序启动数 / TT 点击 × 100%</div>
                      </div>
                    </template>
                    <span class="rate-pill">
                      到达率 {{ formatPercent(acquisition?.arrivalRate) }}
                      <icon-question-circle class="metric-help-icon" />
                    </span>
                  </a-tooltip>
                </div>

                <div class="acquisition-layout">
                  <div class="acquisition-main">
                    <div class="acquisition-summary-grid">
                      <div v-for="metric in acquisitionSummaryCards" :key="metric.key" class="acquisition-summary-card" :class="`acquisition-summary-card--${metric.tone}`">
                        <span>{{ metric.label }}</span>
                        <strong>{{ metric.value }}</strong>
                        <small>{{ metric.hint }}</small>
                      </div>
                    </div>
                    <div class="acquisition-path">
                      <template v-for="(step, index) in acquisitionSteps" :key="step.key">
                        <div class="acquisition-node">
                          <div class="acquisition-node-top">
                            <span>{{ step.label }}</span>
                            <span class="source-badge" :class="sourceClass(step.dataSource)">{{ sourceLabel(step.dataSource) }}</span>
                          </div>
                          <strong>{{ formatNumber(step.pv ?? step.uv ?? 0) }}</strong>
                          <small>{{ formatPercent(step.rate) }}</small>
                        </div>
                        <div v-if="index < acquisitionSteps.length - 1" class="acquisition-connector">
                          <span>流失 {{ formatNumber(acquisitionStepLoss(index)) }}</span>
                        </div>
                      </template>
                    </div>
                    <div class="acquisition-progress">
                      <div class="acquisition-progress-fill" :style="{ width: barWidth(acquisition?.arrivalRate) }" />
                    </div>
                    <div class="acquisition-progress-meta">
                      <span>点击</span>
                      <span>到达 {{ formatPercent(acquisition?.arrivalRate) }}</span>
                      <span>启动</span>
                    </div>
                  </div>

                  <div class="acquisition-diagnostics">
                    <div class="diagnostic-group-title">链路诊断</div>
                    <div v-for="item in acquisitionDiagnostics" :key="item.key" class="diagnostic-item" :class="`diagnostic-item--${item.tone}`">
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                      <small>{{ item.hint }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div class="panel panel-wide activation-panel">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">内循环活跃层</div>
                    <div class="panel-subtitle">新增入池后的首集承接、次跳压力与成本回收</div>
                  </div>
                  <span class="activation-health-pill" :class="`activation-health-pill--${activationHealth.tone}`">
                    {{ activationHealth.label }}
                  </span>
                </div>

                <div class="activation-layout">
                  <div class="activation-main">
                    <div class="activation-primary-grid">
                      <div v-for="metric in activationPrimaryCards" :key="metric.key" class="activation-primary-card" :class="`activation-primary-card--${metric.tone}`">
                        <div class="activation-metric-label metric-label-with-help">
                          <span>{{ metric.label }}</span>
                          <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                            <template #content>
                              <div class="metric-help-content">
                                <div>{{ metric.description }}</div>
                                <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                              </div>
                            </template>
                            <icon-question-circle class="metric-help-icon" />
                          </a-tooltip>
                        </div>
                        <strong>{{ formatMetric(metric) }}</strong>
                        <small>{{ metric.hint }}</small>
                        <span class="source-badge" :class="sourceClass(metric.dataSource)">{{ sourceLabel(metric.dataSource) }}</span>
                      </div>
                    </div>

                    <div class="activation-quality-strip">
                      <div class="activation-quality-head">
                        <span>承接质量</span>
                        <strong>{{ activationHealth.value }}</strong>
                      </div>
                      <div class="activation-quality-row">
                        <span>首集完播</span>
                        <div class="activation-quality-track">
                          <div class="activation-quality-fill activation-quality-fill--good" :style="{ width: barWidth(derivedMetrics.firstCompletionRate) }" />
                        </div>
                        <strong>{{ formatPercent(derivedMetrics.firstCompletionRate) }}</strong>
                      </div>
                      <div class="activation-quality-row">
                        <span>次跳压力</span>
                        <div class="activation-quality-track">
                          <div class="activation-quality-fill activation-quality-fill--warn" :style="{ width: barWidth(derivedMetrics.bounceRate) }" />
                        </div>
                        <strong>{{ formatPercent(derivedMetrics.bounceRate) }}</strong>
                      </div>
                    </div>
                  </div>

                  <div class="activation-diagnostics">
                    <div class="diagnostic-group-title">投放回收</div>
                    <div v-for="item in activationCostDiagnostics" :key="item.key" class="diagnostic-item" :class="`diagnostic-item--${item.tone}`">
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                      <small>{{ item.hint }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </a-tab-pane>

          <a-tab-pane key="content" title="内容质量">
            <section class="content-grid dashboard-tab-content">
              <div class="panel panel-wide content-consumption-panel">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">内容消费层</div>
                    <div class="panel-subtitle">播放承接、首集完播、次跳压力与卡点触达</div>
                  </div>
                </div>

                <div class="content-insight-layout">
                  <div class="content-consumption-main">
                    <div class="content-primary-grid">
                      <div v-for="metric in contentPrimaryMetrics" :key="metric.key" class="content-primary-card" :class="`content-primary-card--${metric.tone}`">
                        <div class="content-metric-label metric-label-with-help">
                          <span>{{ metric.label }}</span>
                          <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                            <template #content>
                              <div class="metric-help-content">
                                <div>{{ metric.description }}</div>
                                <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                              </div>
                            </template>
                            <icon-question-circle class="metric-help-icon" />
                          </a-tooltip>
                        </div>
                        <strong>{{ formatMetric(metric) }}</strong>
                        <small>{{ metric.hint }}</small>
                        <span class="source-badge" :class="sourceClass(metric.dataSource)">{{ sourceLabel(metric.dataSource) }}</span>
                      </div>
                    </div>

                    <div class="content-flow-strip">
                      <div v-for="(metric, index) in contentFlowMetrics" :key="metric.key" class="content-flow-card" :class="`content-flow-card--${metric.tone}`">
                        <div class="content-flow-step">0{{ index + 1 }}</div>
                        <div class="content-flow-copy">
                          <span class="metric-label-with-help">
                            <span>{{ metric.label }}</span>
                            <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                              <template #content>
                                <div class="metric-help-content">
                                  <div>{{ metric.description }}</div>
                                  <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                                </div>
                              </template>
                              <icon-question-circle class="metric-help-icon" />
                            </a-tooltip>
                          </span>
                          <strong>{{ formatMetric(metric) }}</strong>
                          <small>{{ metric.hint }}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="content-diagnosis-card">
                    <div class="content-diagnosis-title">内容诊断</div>
                    <div class="content-diagnosis-list">
                      <div v-for="item in contentDiagnostics" :key="item.key" class="content-diagnosis-item" :class="`content-diagnosis-item--${item.tone}`">
                        <span>{{ item.label }}</span>
                        <strong>{{ item.value }}</strong>
                        <small>{{ item.hint }}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="episode-funnel-module">
                  <div class="episode-toolbar">
                    <div class="episode-filter-group">
                      <span class="episode-filter-label">短剧筛选</span>
                      <a-select
                        v-model="filters.dramaId"
                        placeholder="请选择短剧"
                        allow-search
                        style="width: 220px"
                        @change="loadDashboard"
                      >
                        <a-option v-for="drama in dramaList" :key="drama.id" :value="drama.id" :label="drama.name" />
                      </a-select>
                    </div>
                    <a-radio-group v-model="quickRange" type="button" size="small" @change="handleQuickRangeChange">
                      <a-radio value="24h">24小时</a-radio>
                      <a-radio value="7d">7天</a-radio>
                      <a-radio value="30d">30天</a-radio>
                      <a-radio value="custom">自定义</a-radio>
                    </a-radio-group>
                    <a-range-picker
                      v-model="dateRange"
                      size="small"
                      style="width: 240px"
                      @change="handleCustomRangeChange"
                    />
                    <div class="episode-refresh-time">
                      上次更新日期：{{ lastRefreshText }}
                    </div>
                  </div>

                  <div v-if="!filters.dramaId" class="episode-empty">
                    <a-empty description="请选择具体短剧后查看单剧集流失漏斗图" />
                  </div>
                  <template v-else>
                    <div class="episode-kpi-grid">
                      <button
                        v-for="card in episodeKpiCards"
                        :key="card.key"
                        class="episode-kpi-card"
                        :class="[
                          `episode-kpi-card--${card.tone}`,
                          { 'episode-kpi-card--active': card.checked, 'episode-kpi-card--toggle': card.toggleable },
                        ]"
                        type="button"
                        :disabled="!card.toggleable"
                        @click="toggleEpisodeMetric(card.key)"
                      >
                        <span class="episode-kpi-check">
                          <icon-check v-if="card.checked" />
                        </span>
                        <span class="episode-kpi-label">{{ card.label }}</span>
                        <strong>{{ card.value }}</strong>
                      </button>
                    </div>

                    <div class="episode-chart-head">
                      <div>
                        <div class="episode-chart-title">单剧集数流失漏斗分析（双轴）</div>
                        <div class="episode-chart-subtitle">
                          2 个柱状看播放人数 / 广告曝光，2 条折线看跳出率 / 广告解锁成功率
                        </div>
                      </div>
                      <a-button size="small" @click="exportEpisodeData">
                        <template #icon><icon-export /></template>
                        导出数据
                      </a-button>
                    </div>

                    <div class="episode-chart-metrics">
                      <div v-for="metric in episodeChartMetrics" :key="metric.key" class="episode-chart-metric" :class="`episode-chart-metric--${metric.tone}`">
                        <div class="content-metric-label metric-label-with-help">
                          <span>{{ metric.label }}</span>
                          <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                            <template #content>
                              <div class="metric-help-content">
                                <div>{{ metric.description }}</div>
                                <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                              </div>
                            </template>
                            <icon-question-circle class="metric-help-icon" />
                          </a-tooltip>
                        </div>
                        <strong>{{ formatMetric(metric) }}</strong>
                        <small>{{ metric.hint }}</small>
                        <span class="source-badge" :class="sourceClass(metric.dataSource)">{{ sourceLabel(metric.dataSource) }}</span>
                      </div>
                    </div>

                    <div v-if="episodeChartRows.length" ref="episodeChartRef" class="episode-chart" />
                    <a-empty v-else description="暂无该短剧的集数流失数据" class="episode-empty" />
                  </template>
                </div>
              </div>
            </section>
          </a-tab-pane>

          <a-tab-pane key="monetization" title="广告解锁">
            <section class="content-grid dashboard-tab-content monetization-grid">
              <div class="panel panel-wide ad-monetization-panel">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">广告解锁与变现</div>
                    <div class="panel-subtitle">按顶部短剧筛选后的入口、播放、完播、解锁和收入指标</div>
                  </div>
                  <span class="scope-pill">{{ selectedDramaScopeText }}</span>
                </div>

                <div class="ad-unlock-summary">
                  <div
                    v-for="item in adMonetizationHighlights"
                    :key="item.key"
                    class="ad-unlock-summary-item"
                    :class="`ad-unlock-summary-item--${item.tone}`"
                  >
                    <div class="ad-unlock-summary-label">{{ item.label }}</div>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                  </div>
                </div>

                <div class="ad-monetization-board">
                  <div v-for="group in adMonetizationGroups" :key="group.key" class="ad-monetization-section">
                    <div class="ad-monetization-section-head">
                      <div>
                        <span>{{ group.title }}</span>
                        <small>{{ group.subtitle }}</small>
                      </div>
                      <em>{{ group.metrics.length }} 项指标</em>
                    </div>
                    <div class="ad-monetization-grid">
                      <div v-for="metric in group.metrics" :key="metric.key" class="ad-monetization-card" :class="`ad-monetization-card--${metric.tone}`">
                        <span class="metric-label-with-help">
                          <span>{{ metric.label }}</span>
                          <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                            <template #content>
                              <div class="metric-help-content">
                                <div>{{ metric.description }}</div>
                                <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                              </div>
                            </template>
                            <icon-question-circle class="metric-help-icon" />
                          </a-tooltip>
                        </span>
                        <strong>{{ formatMetric(metric) }}</strong>
                        <small>{{ metric.hint }}</small>
                        <em :class="sourceClass(metric.dataSource)">{{ sourceLabel(metric.dataSource) }}</em>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </a-tab-pane>

          <a-tab-pane key="report" title="投放报表">
            <section class="content-grid dashboard-tab-content">
              <div class="panel panel-wide">
                <div class="panel-header">
                  <div>
                    <div class="panel-title">TikTok 投放报表摘要</div>
                    <div class="panel-subtitle">来自 TikTok Business API，和平台归因数据分开计算</div>
                  </div>
                  <a-button size="small" @click="goReport">
                    <template #icon><icon-launch /></template>
                    下钻
                  </a-button>
                </div>
                <div class="report-grid">
                  <div v-for="metric in report?.kpis || []" :key="metric.key" class="report-item">
                    <span class="metric-label-with-help">
                      <span>{{ metric.label }}</span>
                      <a-tooltip v-if="hasMetricHelp(metric)" position="top">
                        <template #content>
                          <div class="metric-help-content">
                            <div>{{ metric.description }}</div>
                            <div v-if="metric.formula" class="metric-help-formula">公式：{{ metric.formula }}</div>
                          </div>
                        </template>
                        <icon-question-circle class="metric-help-icon" />
                      </a-tooltip>
                    </span>
                    <strong>{{ formatMetric(metric) }}</strong>
                  </div>
                </div>
              </div>
            </section>
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AnalyticsDashboard' })

import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { yesterdayTodayRange } from '@/utils/date-range.ts'
import {
  fetchAcquisitionFunnel,
  fetchActivationMetrics,
  fetchAdUnlockBehavior,
  fetchAnalyticsOverview,
  fetchContentConsumption,
  fetchEpisodeChurn,
  fetchIaaMonetization,
  fetchTikTokReportSummary,
} from '@/api/analyticsDashboard.ts'
import { fetchAdPushRuleList } from '@/api/ad.ts'
import { fetchDramaDetail, fetchDramaList } from '@/api/drama.ts'
import { initChart } from '@/utils/echarts.ts'
import type { ECharts } from 'echarts/core'
import type {
  AcquisitionFunnel,
  ActivationMetrics,
  AdUnlockBehavior,
  AnalyticsDashboardQuery,
  AnalyticsMetric,
  AnalyticsOverview,
  ContentConsumption,
  EpisodeChurn,
  FunnelStep,
  IaaMonetization,
  TikTokReportSummary,
} from '@/types/analyticsDashboard.ts'
import type { AdPushRule, Drama } from '@/types/drama.ts'

type SignalTone = 'good' | 'warn' | 'bad' | 'neutral'
type EpisodeMetricKey = 'playUv' | 'bounceRate' | 'adUnlockSuccessRate'

interface DecisionSignal {
  key: string
  label: string
  value: string
  status: string
  hint: string
  width: string
  tone: SignalTone
}

interface OperatorAction {
  key: string
  title: string
  badge: string
  value: string
  description: string
  tone: SignalTone
  color: string
}

interface DiagnosticItem {
  key: string
  label: string
  value: string
  hint: string
  tone: SignalTone
}

interface AcquisitionSummaryCard {
  key: string
  label: string
  value: string
  hint: string
  tone: SignalTone
}

type ContentMetricCard = AnalyticsMetric & {
  hint: string
  tone: SignalTone
}

const router = useRouter()
const loading = ref(false)
const dramaList = ref<Drama[]>([])
const adPushRules = ref<AdPushRule[]>([])
const selectedDrama = ref<Drama>()
const overview = ref<AnalyticsOverview>()
const acquisition = ref<AcquisitionFunnel>()
const activation = ref<ActivationMetrics>()
const content = ref<ContentConsumption>()
const adUnlock = ref<AdUnlockBehavior>()
const episodeChurn = ref<EpisodeChurn>()
const iaa = ref<IaaMonetization>()
const report = ref<TikTokReportSummary>()
const episodeChartRef = ref<HTMLElement>()
const episodeVisibleRange = ref<{ startIndex: number; endIndex: number }>()
const quickRange = ref<'24h' | '7d' | '30d' | 'custom'>('custom')
const activeDashboardTab = ref('overview')
const lastRefreshedAt = ref<Date>()
const visibleEpisodeMetrics = reactive<Record<EpisodeMetricKey, boolean>>({
  playUv: true,
  bounceRate: true,
  adUnlockSuccessRate: true,
})
let episodeChart: ECharts | null = null
let resizeObserver: ResizeObserver | null = null
const poisonThreshold = 20

const dateRange = ref<[string, string]>(yesterdayTodayRange())
const filters = reactive({
  dramaId: undefined as string | undefined,
  campaignId: '',
  adgroupId: '',
  creativeId: '',
  channel: '',
  userScope: 'all',
})
const selectedDramaScopeText = computed(() => {
  if (!filters.dramaId) return '全盘短剧'
  const drama = dramaList.value.find((item) => String(item.id) === String(filters.dramaId))
  return drama?.name ? `短剧：${drama.name}` : `短剧：${filters.dramaId}`
})

const empty = computed(() => {
  if (loading.value) return false
  if (activeDashboardTab.value === 'overview') return !overview.value?.kpis?.length
  if (activeDashboardTab.value === 'acquisition') {
    return !acquisition.value?.steps?.length && !activation.value?.kpis?.length
  }
  if (activeDashboardTab.value === 'content') return !content.value?.kpis?.length
  if (activeDashboardTab.value === 'monetization') {
    return !adUnlock.value?.kpis?.length && !iaa.value?.kpis?.length
  }
  if (activeDashboardTab.value === 'report') return !report.value?.kpis?.length
  return false
})
const lastRefreshText = computed(() => {
  if (!lastRefreshedAt.value) return '—'
  const diffMs = Date.now() - lastRefreshedAt.value.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  return `${Math.floor(diffHours / 24)}天前`
})
const allMetrics = computed(() => [
  ...(overview.value?.kpis || []),
  ...(overview.value?.summaries || []),
  ...(activation.value?.kpis || []),
  ...(content.value?.kpis || []),
  ...(adUnlock.value?.kpis || []),
  ...(iaa.value?.kpis || []),
  ...(report.value?.kpis || []),
])
const metricValueMap = computed(() => {
  const map = new Map<string, number>()
  for (const metric of allMetrics.value) {
    const value = Number(metric.value)
    if (!Number.isNaN(value)) map.set(metric.key, value)
  }
  return map
})
const overviewCoreMetricKeys = new Set([
  'totalUsers',
  'newUsers',
  'activeUsers',
  'visitPv',
  'playUv',
  'adPlayPv',
  'tiktokSpend',
  'tiktokClicks',
])
const overviewCoreMetrics = computed(() => (overview.value?.kpis || []).filter((metric) => overviewCoreMetricKeys.has(metric.key)))
const acquisitionSteps = computed(() => acquisition.value?.steps || [])
const acquisitionClickCount = computed(() => Number(acquisitionSteps.value[0]?.pv ?? acquisitionSteps.value[0]?.uv ?? 0))
const acquisitionLaunchCount = computed(() => Number(acquisitionSteps.value[1]?.pv ?? acquisitionSteps.value[1]?.uv ?? 0))
const acquisitionLostCount = computed(() => Math.max(0, acquisitionClickCount.value - acquisitionLaunchCount.value))
const acquisitionLossRate = computed(() => acquisitionClickCount.value ? (acquisitionLostCount.value / acquisitionClickCount.value) * 100 : 0)
const costPerLaunch = computed(() => divideNumber(getMetricValue('spend') || getMetricValue('tiktokSpend'), acquisitionLaunchCount.value))
const acquisitionSummaryCards = computed<AcquisitionSummaryCard[]>(() => [
  {
    key: 'click',
    label: 'TT 点击',
    value: `${formatNumber(acquisitionClickCount.value)} 次`,
    hint: '广告侧带来的入口点击量',
    tone: 'neutral',
  },
  {
    key: 'launch',
    label: '小程序启动',
    value: `${formatNumber(acquisitionLaunchCount.value)} 次`,
    hint: '真正进入小程序的承接量',
    tone: Number(acquisition.value?.arrivalRate || 0) >= 70 ? 'good' : Number(acquisition.value?.arrivalRate || 0) >= 45 ? 'warn' : 'bad',
  },
  {
    key: 'lost',
    label: '点击后流失',
    value: `${formatNumber(acquisitionLostCount.value)} 次`,
    hint: `占点击 ${formatPercent(acquisitionLossRate.value)}`,
    tone: acquisitionLossRate.value > 55 ? 'bad' : acquisitionLossRate.value > 35 ? 'warn' : 'good',
  },
  {
    key: 'costPerLaunch',
    label: '单次启动成本',
    value: formatCurrency(costPerLaunch.value),
    hint: '消耗 / 小程序启动数',
    tone: costPerLaunch.value > 5 ? 'bad' : costPerLaunch.value > 2 ? 'warn' : 'good',
  },
])
const acquisitionDiagnostics = computed<DiagnosticItem[]>(() => [
  {
    key: 'arrivalRate',
    label: '点击到达率',
    value: formatPercent(acquisition.value?.arrivalRate),
    hint: acquisitionLossRate.value > 35 ? '到达链路损耗偏高' : '落地承接相对稳定',
    tone: acquisitionLossRate.value > 55 ? 'bad' : acquisitionLossRate.value > 35 ? 'warn' : 'good',
  },
  {
    key: 'lost',
    label: '点击后未启动',
    value: `${formatNumber(acquisitionLostCount.value)} 次`,
    hint: '用于定位跳转、冷启、授权流失',
    tone: acquisitionLostCount.value > acquisitionLaunchCount.value ? 'bad' : acquisitionLostCount.value > 0 ? 'warn' : 'good',
  },
  {
    key: 'costPerLaunch',
    label: '单次启动成本',
    value: formatCurrency(costPerLaunch.value),
    hint: '消耗 / 小程序启动数',
    tone: costPerLaunch.value > 5 ? 'bad' : costPerLaunch.value > 2 ? 'warn' : 'good',
  },
])
const activationPrimaryCards = computed<ContentMetricCard[]>(() => [
  activationMetricCard('newUsers', '进入内循环的新用户规模', 'neutral'),
  activationMetricCard(
    'firstEpisodeCompletionRate',
    derivedMetrics.value.firstCompletionRate >= 60 ? '首集承接稳定' : '素材承诺与首集开头需复核',
    derivedMetrics.value.firstCompletionRate >= 60 ? 'good' : derivedMetrics.value.firstCompletionRate >= 40 ? 'warn' : 'bad'
  ),
  activationMetricCard(
    'directBounceRate',
    derivedMetrics.value.bounceRate > 45 ? '次跳偏高，优先修内容承接' : '次跳压力在可控区间',
    derivedMetrics.value.bounceRate > 45 ? 'bad' : derivedMetrics.value.bounceRate > 30 ? 'warn' : 'good'
  ),
])
const activationHealth = computed(() => {
  const score = Math.round(
    scoreFromRate(derivedMetrics.value.firstCompletionRate, 60) * 0.62 +
      scoreFromInverseRate(derivedMetrics.value.bounceRate, 35) * 0.38
  )
  const tone: SignalTone = score >= 75 ? 'good' : score >= 55 ? 'warn' : 'bad'
  const labelMap: Record<SignalTone, string> = {
    good: '承接健康',
    warn: '承接待优化',
    bad: '承接偏弱',
    neutral: '承接观察',
  }
  return {
    value: `${score}分`,
    label: labelMap[tone],
    tone,
  }
})
const activationCostDiagnostics = computed<DiagnosticItem[]>(() => {
  const spend = getMetricValue('adSpend') || getMetricValue('spend') || getMetricValue('tiktokSpend')
  const costPerNewUser = derivedMetrics.value.costPerNewUser
  return [
    {
      key: 'adSpend',
      label: '投放消耗',
      value: formatCurrency(spend),
      hint: '用于判断新增入池的预算压力',
      tone: 'neutral',
    },
    {
      key: 'costPerNewUser',
      label: '单次新增成本',
      value: formatCurrency(costPerNewUser),
      hint: costPerNewUser > 5 ? '新增成本偏高，需控预算' : '新增成本相对可控',
      tone: costPerNewUser > 5 ? 'bad' : costPerNewUser > 2 ? 'warn' : 'good',
    },
  ]
})
const selectedAdRule = computed(() => {
  const ruleId = selectedDrama.value?.adPushRuleId
  if (!ruleId) return undefined
  return adPushRules.value.find((rule) => String(rule.id) === String(ruleId))
})
const adCheckpointEpisodes = computed(() => {
  const drama = selectedDrama.value
  if (!drama) return new Set<number>()
  const total = drama.totalEpisodes || episodeChartRows.value.length
  const freeEpisodes = drama.freeEpisodes || 0
  const step = Math.max(1, selectedAdRule.value?.episodesPerUnlock || 1)
  const checkpoints = new Set<number>()
  for (let episode = freeEpisodes + 1; episode <= total; episode += step) {
    if (episode > 0) checkpoints.add(episode)
  }
  return checkpoints
})
const episodeAdUnlockMap = computed(() => {
  const map = new Map<number, FunnelStep>()
  for (const episode of episodeChurn.value?.adUnlocks || []) {
    const episodeNumber = Number(episode.key)
    if (Number.isFinite(episodeNumber)) map.set(episodeNumber, episode)
  }
  return map
})
const episodeChartRows = computed(() => {
  const episodeMap = new Map<number, FunnelStep>()
  for (const episode of episodeChurn.value?.episodes || []) {
    const episodeNumber = Number(episode.key)
    if (Number.isFinite(episodeNumber)) episodeMap.set(episodeNumber, episode)
  }
  const episodeNumbers = new Set([...episodeMap.keys(), ...episodeAdUnlockMap.value.keys()])
  const rows = Array.from(episodeNumbers)
    .map((episodeNumber) => {
      const episode = episodeMap.get(episodeNumber)
      const adUnlock = episodeAdUnlockMap.value.get(episodeNumber)
      const playUv = Number(episode?.pv || 0)
      const completedUv = Number(episode?.uv || 0)
      const retentionRate = Number(episode?.rate || 0)
      const bounceRate = Math.max(0, 100 - retentionRate)
      const adPlayPv = Number(adUnlock?.pv || 0)
      const adUnlockSuccessPv = Number(adUnlock?.uv || 0)
      const adUnlockSuccessRate = Number(adUnlock?.rate || 0)
      return {
        episodeNumber,
        label: `第${episodeNumber}集`,
        playUv,
        completedUv,
        retentionRate,
        bounceRate,
        adPlayPv,
        adUnlockSuccessPv,
        adUnlockSuccessRate,
        isAdCheckpoint: adCheckpointEpisodes.value.has(episodeNumber),
        isPoisonPoint: bounceRate > poisonThreshold,
      }
    })
    .sort((a, b) => a.episodeNumber - b.episodeNumber)
  return rows
})
const totalPlayUv = computed(() => Math.max(...episodeChartRows.value.map((row) => row.playUv), 0))
const averageBounceRate = computed(() => average(episodeChartRows.value.map((row) => row.bounceRate)))
const averageAdUnlockSuccessRate = computed(() => average(episodeChartRows.value.filter((row) => row.adPlayPv > 0).map((row) => row.adUnlockSuccessRate)))
const checkpointArrivalRate = computed(() => {
  const firstPlayUv = episodeChartRows.value[0]?.playUv || 0
  if (!firstPlayUv) return getMetricValue('unlockGateArrivalRate')
  const checkpointUv = episodeChartRows.value.find((row) => row.isAdCheckpoint)?.playUv || 0
  return (checkpointUv / firstPlayUv) * 100
})
const averageWatchDurationText = computed(() => formatDurationValue(getMetricValue('avgWatchDuration')))
const poisonWarningCount = computed(() => episodeChartRows.value.filter((row) => row.isPoisonPoint).length)
const episodeKpiCards = computed(() => [
  {
    key: 'playUv' as EpisodeMetricKey,
    label: '总播放人数（UV）',
    value: `${formatCompactChinese(totalPlayUv.value)}人`,
    checked: visibleEpisodeMetrics.playUv,
    toggleable: true,
    tone: 'blue',
  },
  {
    key: 'bounceRate' as EpisodeMetricKey,
    label: '单集跳出率',
    value: formatPercent(averageBounceRate.value),
    checked: visibleEpisodeMetrics.bounceRate,
    toggleable: true,
    tone: 'purple',
  },
  {
    key: 'adUnlockSuccessRate' as EpisodeMetricKey,
    label: '广告解锁成功率',
    value: formatPercent(averageAdUnlockSuccessRate.value),
    checked: visibleEpisodeMetrics.adUnlockSuccessRate,
    toggleable: true,
    tone: 'orange',
  },
  {
    key: 'checkpointArrival' as const,
    label: '卡点到达率',
    value: formatPercent(checkpointArrivalRate.value),
    checked: false,
    toggleable: false,
    tone: 'plain',
  },
  {
    key: 'avgWatchDuration' as const,
    label: '人均观看时长',
    value: averageWatchDurationText.value,
    checked: false,
    toggleable: false,
    tone: 'plain',
  },
])
const episodeChartMetrics = computed<ContentMetricCard[]>(() => [
  contentMetricCard('adRequests', '请求总量', 'neutral'),
  contentMetricCard('adExposurePv', '曝光次数', 'neutral'),
])
const contentMetricCards = computed<ContentMetricCard[]>(() => [
  contentMetricCard('playPv', '入口热度', 'neutral'),
  contentMetricCard('playUv', '消费人数', 'neutral'),
  contentMetricCard('avgWatchDuration', '平均深度', derivedMetrics.value.bounceRate > 45 ? 'warn' : 'good'),
  contentMetricCard('unlockGateArrivalUv', '卡点人数', 'neutral'),
  contentMetricCard('firstEpisodeCompletionRate', '首集承接', derivedMetrics.value.firstCompletionRate >= 60 ? 'good' : derivedMetrics.value.firstCompletionRate >= 40 ? 'warn' : 'bad'),
  contentMetricCard('directBounceRate', '次跳压力', derivedMetrics.value.bounceRate > 45 ? 'bad' : derivedMetrics.value.bounceRate > 30 ? 'warn' : 'good'),
  contentMetricCard('unlockGateArrivalRate', '卡点到达', derivedMetrics.value.unlockGateArrivalRate >= 25 ? 'good' : derivedMetrics.value.unlockGateArrivalRate >= 12 ? 'warn' : 'bad'),
])
const contentPrimaryMetrics = computed(() => contentMetricCards.value.slice(0, 4))
const contentFlowMetrics = computed(() => contentMetricCards.value.slice(4))
const adUnlockBehaviorCards = computed<ContentMetricCard[]>(() => [
  contentMetricCard('adRequests', '用户到达解锁入口的曝光次数', 'neutral'),
  contentMetricCard('adPlayPv', 'ad_push_log 记录的广告实际播放次数', 'neutral'),
  contentMetricCard('adPlayUv', '实际播放广告的去重人数', 'neutral'),
  contentMetricCard('adPlayRate', '衡量卡点到广告播放的承接效率', derivedMetrics.value.adPlayRate >= 60 ? 'good' : derivedMetrics.value.adPlayRate >= 35 ? 'warn' : 'bad'),
  contentMetricCard('adCompletePv', '广告播放完毕次数', 'neutral'),
  contentMetricCard('adCompleteRate', '衡量广告开始播放后的完播质量', derivedMetrics.value.adCompleteRate >= 80 ? 'good' : derivedMetrics.value.adCompleteRate >= 55 ? 'warn' : 'bad'),
  contentMetricCard('avgAdWatchSeconds', '用户实际观看广告的平均秒数', 'neutral'),
  contentMetricCard('adSkipPv', '广告播放过程中被跳过的次数', derivedMetrics.value.adSkipPv > 0 ? 'warn' : 'good'),
  contentMetricCard('adFailPv', '广告播放失败次数', derivedMetrics.value.adFailPv > 0 ? 'bad' : 'good'),
  contentMetricCard('adUnlockSuccessPv', 'ad_push_log 中 unlock_success=1 的次数', 'neutral'),
  contentMetricCard('adUnlockSuccessUv', '广告播放后成功解锁的去重人数', 'neutral'),
  contentMetricCard('adUnlockSuccessRate', '广告播放后最终成功解锁的比例', derivedMetrics.value.adUnlockSuccessRate >= 70 ? 'good' : derivedMetrics.value.adUnlockSuccessRate >= 45 ? 'warn' : 'bad'),
  contentMetricCard('avgAdViewsPerUser', '每个播放用户平均观看广告次数', 'neutral'),
  contentMetricCard('ecpm', '每千次广告播放对应的收入', derivedMetrics.value.ecpm > 0 ? 'good' : 'neutral'),
  contentMetricCard('revenue', '当前筛选范围内已支付订单收入', derivedMetrics.value.revenue > 0 ? 'good' : 'neutral'),
])
const adMonetizationGroups = computed(() => [
  {
    key: 'entry',
    title: '入口承接',
    subtitle: '从解锁入口到广告播放',
    metrics: pickMetricCards(['adRequests', 'adPlayPv', 'adPlayUv', 'adPlayRate']),
  },
  {
    key: 'playback',
    title: '播放质量',
    subtitle: '完播、跳过、失败与观看时长',
    metrics: pickMetricCards(['adCompletePv', 'adCompleteRate', 'avgAdWatchSeconds', 'adSkipPv', 'adFailPv']),
  },
  {
    key: 'return',
    title: '收益回收',
    subtitle: '解锁成功、频次、eCPM 与收入',
    metrics: pickMetricCards(['adUnlockSuccessPv', 'adUnlockSuccessUv', 'adUnlockSuccessRate', 'avgAdViewsPerUser', 'ecpm', 'revenue']),
  },
])
const adMonetizationHighlights = computed(() => [
  {
    key: 'playRate',
    label: '卡点播放率',
    value: formatPercent(derivedMetrics.value.adPlayRate),
    hint: '解锁入口到广告播放',
    tone: derivedMetrics.value.adPlayRate >= 60 ? 'good' : derivedMetrics.value.adPlayRate >= 35 ? 'warn' : 'bad',
  },
  {
    key: 'completeRate',
    label: '广告完播率',
    value: formatPercent(derivedMetrics.value.adCompleteRate),
    hint: '广告开始播放后的完播质量',
    tone: derivedMetrics.value.adCompleteRate >= 80 ? 'good' : derivedMetrics.value.adCompleteRate >= 55 ? 'warn' : 'bad',
  },
  {
    key: 'unlockRate',
    label: '解锁成功率',
    value: formatPercent(derivedMetrics.value.adUnlockSuccessRate),
    hint: '播放后成功解锁占比',
    tone: derivedMetrics.value.adUnlockSuccessRate >= 70 ? 'good' : derivedMetrics.value.adUnlockSuccessRate >= 45 ? 'warn' : 'bad',
  },
  {
    key: 'revenue',
    label: '广告回收',
    value: formatCurrency(derivedMetrics.value.revenue),
    hint: `eCPM ${formatCurrency(derivedMetrics.value.ecpm)}`,
    tone: derivedMetrics.value.revenue > 0 ? 'good' : 'neutral',
  },
])
const derivedMetrics = computed(() => {
  const spend = getMetricValue('spend') || getMetricValue('tiktokSpend') || getMetricValue('adSpend')
  const revenue = getMetricValue('revenue')
  const playUv = getMetricValue('playUv')
  return {
    arrivalRate: Number(acquisition.value?.arrivalRate || 0),
    firstCompletionRate: getMetricValue('firstEpisodeCompletionRate'),
    bounceRate: getMetricValue('directBounceRate'),
    unlockGateArrivalRate: getMetricValue('unlockGateArrivalRate'),
    adPlayRate: getMetricValue('adPlayRate'),
    adCompleteRate: getMetricValue('adCompleteRate'),
    adSkipPv: getMetricValue('adSkipPv'),
    adFailPv: getMetricValue('adFailPv'),
    adUnlockSuccessRate: getMetricValue('adUnlockSuccessRate'),
    fillRate: getMetricValue('fillRate'),
    adCompletionRate: getMetricValue('adCompleteRate'),
    costPerNewUser: getMetricValue('costPerNewUser'),
    cpa: getMetricValue('cpa'),
    ctr: getMetricValue('ctr'),
    roas: getMetricValue('roas'),
    ecpm: getMetricValue('ecpm'),
    revenue,
    spend,
    playUv,
  }
})
const contentDiagnostics = computed<DiagnosticItem[]>(() => [
  {
    key: 'firstEpisode',
    label: '首集承接',
    value: formatPercent(derivedMetrics.value.firstCompletionRate),
    hint: derivedMetrics.value.firstCompletionRate >= 60 ? '可继续承接投放流量' : '优先检查素材承诺与首集开头',
    tone: derivedMetrics.value.firstCompletionRate >= 60 ? 'good' : derivedMetrics.value.firstCompletionRate >= 40 ? 'warn' : 'bad',
  },
  {
    key: 'bounce',
    label: '流失压力',
    value: formatPercent(derivedMetrics.value.bounceRate),
    hint: derivedMetrics.value.bounceRate > 45 ? '次跳偏高，需先修内容' : '首集流失在可控区间',
    tone: derivedMetrics.value.bounceRate > 45 ? 'bad' : derivedMetrics.value.bounceRate > 30 ? 'warn' : 'good',
  },
  {
    key: 'paywall',
    label: '卡点触达',
    value: formatPercent(derivedMetrics.value.unlockGateArrivalRate),
    hint: '决定 IAA/IAP 是否有足够变现场景',
    tone: derivedMetrics.value.unlockGateArrivalRate >= 25 ? 'good' : derivedMetrics.value.unlockGateArrivalRate >= 12 ? 'warn' : 'bad',
  },
  {
    key: 'poison',
    label: '毒点预警',
    value: `${poisonWarningCount.value} 集`,
    hint: poisonWarningCount.value ? '查看下方 X 轴红色集数' : '暂无明显单集异常',
    tone: poisonWarningCount.value ? 'warn' : 'good',
  },
])
const decisionSignals = computed<DecisionSignal[]>(() => {
  const metrics = derivedMetrics.value
  return [
    buildSignal('arrival', '点击到达', metrics.arrivalRate, '%', [
      { min: 70, tone: 'good', status: '到达稳定', hint: '链接、授权、启动链路可承接扩量' },
      { min: 45, tone: 'warn', status: '有流失', hint: '检查 TikTok 跳转、小程序冷启和归因参数' },
      { min: 0, tone: 'bad', status: '严重流失', hint: '先排查落地链路，再继续加预算' },
    ]),
    buildSignal('content', '首集吸引力', metrics.firstCompletionRate, '%', [
      { min: 60, tone: 'good', status: '内容可放量', hint: '素材承诺和剧集首段基本匹配' },
      { min: 40, tone: 'warn', status: '需要优化', hint: '关注前 1 集钩子、标题和素材落差' },
      { min: 0, tone: 'bad', status: '承接偏弱', hint: '暂缓扩量，优先换剧或换首集剪辑' },
    ]),
    buildSignal('paywall', '卡点触达', metrics.unlockGateArrivalRate, '%', [
      { min: 25, tone: 'good', status: '付费墙有效', hint: '用户愿意看到解锁节点，可测出价上限' },
      { min: 12, tone: 'warn', status: '触达不足', hint: '检查免费集数、节奏和推荐承接' },
      { min: 0, tone: 'bad', status: '难以变现', hint: '卡点前流失高，先优化内容消费深度' },
    ]),
    buildSignal('iaa', 'IAA 承接', Math.min(metrics.fillRate, metrics.adCompletionRate || metrics.fillRate), '%', [
      { min: 80, tone: 'good', status: '广告链路健康', hint: '入口到播放和广告完播链路可承接更多有效用户' },
      { min: 55, tone: 'warn', status: '需要盯盘', hint: '看入口曝光、广告播放和播放完毕是否分化' },
      { min: 0, tone: 'bad', status: '变现漏损', hint: '修复解锁入口、广告播放或频次策略' },
    ]),
    buildSignal('cost', '成本压力', metrics.roas || metrics.ctr, metrics.roas ? '' : '%', [
      { min: metrics.roas ? 1.2 : 1.5, tone: 'good', status: metrics.roas ? 'ROAS 可扩' : 'CTR 健康', hint: '成本质量可接受，结合内容指标加预算' },
      { min: metrics.roas ? 0.8 : 0.8, tone: 'warn', status: '成本临界', hint: '优先把预算给高完播、高卡点触达素材' },
      { min: 0, tone: 'bad', status: '成本偏高', hint: '降出价、停低效素材或换定向' },
    ], metrics.roas ? 2 : 100)
  ]
})
const overallDecision = computed(() => {
  const weightedScore = Math.round(
    scoreFromRate(derivedMetrics.value.arrivalRate, 70) * 0.2 +
      scoreFromRate(derivedMetrics.value.firstCompletionRate, 60) * 0.24 +
      scoreFromInverseRate(derivedMetrics.value.bounceRate, 35) * 0.14 +
      scoreFromRate(derivedMetrics.value.unlockGateArrivalRate, 25) * 0.2 +
      scoreFromRate(derivedMetrics.value.fillRate, 85) * 0.12 +
      scoreFromRate(derivedMetrics.value.adCompletionRate, 75) * 0.1
  )
  const tone: SignalTone = weightedScore >= 75 ? 'good' : weightedScore >= 55 ? 'warn' : 'bad'
  if (tone === 'good') {
    return {
      score: weightedScore,
      tone,
      title: '可以小步扩量',
      description: '点击到达、首集承接、解锁卡点和广告完播整体稳定。可小幅提高预算，把增量优先给高完播、高卡点触达素材，同时保留一部分预算继续测新素材。',
    }
  }
  if (tone === 'warn') {
    return {
      score: weightedScore,
      tone,
      title: '先优化再放量',
      description: '当前链路已有可定位短板，先根据下方信号矩阵确认问题落在获客到达、内容承接、卡点触达还是 IAA 播放，再决定是否继续加预算。',
    }
  }
  return {
    score: weightedScore,
    tone,
    title: '暂停盲目扩量',
    description: '当前投放健康度偏低，直接扩量容易放大亏损。建议先收缩低效 campaign，排查素材承诺、首集承接和广告解锁漏损，等核心指标修复后再恢复投放。',
  }
})
const operatorActions = computed<OperatorAction[]>(() => {
  const metrics = derivedMetrics.value
  const actions: OperatorAction[] = []
  if (metrics.arrivalRate < 45) {
    actions.push(action('arrival', '获客链路', '先排障', formatPercent(metrics.arrivalRate), 'TikTok 点击未有效转化为小程序启动，优先核查落地链接、冷启耗时、授权流程和 clientKey 归因参数。', 'bad'))
  } else if (metrics.firstCompletionRate >= 60 && metrics.unlockGateArrivalRate >= 25) {
    actions.push(action('scale', '预算策略', '小步扩量', `ROAS ${formatCompactValue(metrics.roas)}`, '内容承接和卡点触达表现较稳，可把预算逐步倾斜到高 CTR、高完播素材，并持续观察回收变化。', 'good'))
  } else {
    actions.push(action('scale', '预算策略', '控量优化', formatCurrency(metrics.spend), '当前不适合无差别扩量，先筛出首集完播和卡点触达更好的素材，再做预算转移或小额加量。', 'warn'))
  }

  if (metrics.firstCompletionRate < 40 || metrics.bounceRate > 45) {
    actions.push(action('creative', '素材/剧目', '重做承接', `${formatPercent(metrics.firstCompletionRate)} 完播`, '用户进入后没有被首集留住，重点检查素材卖点、标题承诺和开头剧情是否一致。', 'bad'))
  } else {
    actions.push(action('creative', '素材/剧目', '继续测试', `${formatPercent(metrics.bounceRate)} 次跳`, '首集承接基本可用，可继续 AB 测素材角度，并把卡点触达率作为下一轮放量门槛。', metrics.bounceRate <= 35 ? 'good' : 'warn'))
  }

  if (metrics.fillRate < 70 || metrics.adCompletionRate < 60) {
    actions.push(action('iaa', 'IAA 变现', '修漏损', `${formatPercent(metrics.fillRate)} 播放`, '广告入口到播放、播放到完播存在漏损，会直接压低回收，先检查库存、加载耗时、失败率和频次策略。', 'bad'))
  } else {
    actions.push(action('iaa', 'IAA 变现', '稳定承接', `eCPM ${formatCurrency(metrics.ecpm)}`, '广告播放与完播链路相对稳定，后续重点用人均广告次数和解锁成功率平衡体验与收益。', 'good'))
  }

  return actions
})

function buildQuery(): AnalyticsDashboardQuery {
  return {
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    dramaId: filters.dramaId,
    campaignId: filters.campaignId.trim() || undefined,
    adgroupId: filters.adgroupId.trim() || undefined,
    creativeId: filters.creativeId.trim() || undefined,
    channel: filters.channel || undefined,
    userScope: filters.userScope || undefined,
  }
}

async function loadDramas() {
  const res = await fetchDramaList({ pageNum: 1, pageSize: 999 })
  dramaList.value = res.rows || []
}

async function loadAdPushRules() {
  try {
    const rules = await fetchAdPushRuleList()
    adPushRules.value = Array.isArray(rules) ? rules : []
  } catch (error) {
    console.warn('[AnalyticsDashboard] ad push rules load failed:', error)
    adPushRules.value = []
  }
}

async function loadSelectedDramaConfig(dramaId?: string) {
  selectedDrama.value = undefined
  if (!dramaId) return
  try {
    selectedDrama.value = await fetchDramaDetail(dramaId)
  } catch (error) {
    console.warn('[AnalyticsDashboard] selected drama config load failed:', error)
    selectedDrama.value = dramaList.value.find((drama) => String(drama.id) === String(dramaId))
  }
}

async function loadDashboard() {
  loading.value = true
  try {
    const query = buildQuery()
    await loadActiveDashboardTab(query)
    lastRefreshedAt.value = new Date()
    await nextTick()
    if (activeDashboardTab.value === 'content') {
      renderEpisodeChart()
    }
  } catch (error) {
    console.error('[AnalyticsDashboard] load failed:', error)
    Message.error('数据看板加载失败')
  } finally {
    loading.value = false
  }
}

async function loadActiveDashboardTab(query: AnalyticsDashboardQuery) {
  if (activeDashboardTab.value === 'overview') {
    const [overviewData, acquisitionData, activationData, contentData, adUnlockData, iaaData, reportData] =
      await Promise.all([
        fetchAnalyticsOverview(query),
        fetchAcquisitionFunnel(query),
        fetchActivationMetrics(query),
        fetchContentConsumption(query),
        fetchAdUnlockBehavior(query),
        fetchIaaMonetization(query),
        fetchTikTokReportSummary(query),
      ])
    overview.value = overviewData
    acquisition.value = acquisitionData
    activation.value = activationData
    content.value = contentData
    adUnlock.value = adUnlockData
    iaa.value = iaaData
    report.value = reportData
    return
  }

  if (activeDashboardTab.value === 'acquisition') {
    const [acquisitionData, activationData, reportData] = await Promise.all([
      fetchAcquisitionFunnel(query),
      fetchActivationMetrics(query),
      fetchTikTokReportSummary(query),
    ])
    acquisition.value = acquisitionData
    activation.value = activationData
    report.value = reportData
    return
  }

  if (activeDashboardTab.value === 'content') {
    const [contentData] = await Promise.all([
      fetchContentConsumption(query),
      loadSelectedDramaConfig(query.dramaId),
    ])
    content.value = contentData
    episodeChurn.value = query.dramaId ? await fetchEpisodeChurn(query) : undefined
    return
  }

  if (activeDashboardTab.value === 'monetization') {
    const [adUnlockData, iaaData] = await Promise.all([
      fetchAdUnlockBehavior(query),
      fetchIaaMonetization(query),
    ])
    adUnlock.value = adUnlockData
    iaa.value = iaaData
    return
  }

  if (activeDashboardTab.value === 'report') {
    report.value = await fetchTikTokReportSummary(query)
  }
}

function handleQuickRangeChange(value: string | number | boolean) {
  if (value === 'custom') return
  dateRange.value = rangeByShortcut(String(value))
  loadDashboard()
}

function handleCustomRangeChange() {
  quickRange.value = 'custom'
  loadDashboard()
}

function formatMetric(metric: AnalyticsMetric) {
  const unit = metric.unit || ''
  const value = Number(metric.value)
  if (Number.isNaN(value)) {
    return `${metric.value}${unit}`
  }
  if (unit === '%') return `${value.toFixed(2)}%`
  if (unit === '元') return `¥${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  if (unit === '秒') return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}秒`
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`
}

function formatNumber(value: number | string) {
  const number = Number(value)
  return Number.isNaN(number) ? String(value) : number.toLocaleString()
}

function formatPercent(value?: number | string | null) {
  const number = Number(value)
  return Number.isNaN(number) ? '0.00%' : `${number.toFixed(2)}%`
}

function formatCurrency(value?: number | string | null) {
  const number = Number(value)
  return Number.isNaN(number) ? '¥0.00' : `¥${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatCompactValue(value?: number | string | null) {
  const number = Number(value)
  if (Number.isNaN(number)) return '0'
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function divideNumber(numerator: number, denominator: number) {
  if (!denominator) return 0
  return numerator / denominator
}

function funnelStepValue(step?: FunnelStep) {
  return Number(step?.pv ?? step?.uv ?? 0)
}

function acquisitionStepLoss(index: number) {
  return Math.max(0, funnelStepValue(acquisitionSteps.value[index]) - funnelStepValue(acquisitionSteps.value[index + 1]))
}

function formatCompactChinese(value?: number | string | null) {
  const number = Number(value)
  if (Number.isNaN(number)) return '0'
  if (number >= 10000) return `${(number / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}万`
  return number.toLocaleString()
}

function formatDurationValue(seconds?: number | string | null) {
  const number = Number(seconds)
  if (Number.isNaN(number) || number <= 0) return '0秒'
  if (number >= 3600) return `${(number / 3600).toLocaleString(undefined, { maximumFractionDigits: 1 })}小时`
  if (number >= 60) return `${Math.floor(number / 60)}分${Math.round(number % 60)}秒`
  return `${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}秒`
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value))
  if (!validValues.length) return 0
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
}

function barWidth(value?: number | string | null) {
  const number = Number(value)
  if (Number.isNaN(number)) return '0%'
  return `${Math.max(4, Math.min(100, number))}%`
}

function rangeByShortcut(value: string): [string, string] {
  const end = new Date()
  const start = new Date(end)
  const dayMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30 }
  start.setDate(end.getDate() - (dayMap[value] || 30) + 1)
  return [formatDate(start), formatDate(end)]
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMetricValue(key: string) {
  return metricValueMap.value.get(key) || 0
}

function getMetric(key: string) {
  return allMetrics.value.find((metric) => metric.key === key)
}

function getActivationMetric(key: string) {
  return activation.value?.kpis?.find((metric) => metric.key === key) || getMetric(key)
}

function pickMetricCards(keys: string[]) {
  return keys
    .map((key) => adUnlockBehaviorCards.value.find((metric) => metric.key === key))
    .filter((metric): metric is ContentMetricCard => Boolean(metric))
}

function activationMetricCard(key: string, hint: string, tone: SignalTone): ContentMetricCard {
  const metric = getActivationMetric(key)
  const fallback: Record<string, Pick<AnalyticsMetric, 'label' | 'unit' | 'dataSource'>> = {
    newUsers: { label: '新增入池', unit: '人', dataSource: '平台行为/归因数据' },
    firstEpisodeCompletionRate: { label: '首集承接', unit: '%', dataSource: '用户播放记录' },
    directBounceRate: { label: '次跳压力', unit: '%', dataSource: '用户播放记录' },
  }
  return {
    key,
    label: metric?.label || fallback[key]?.label || key,
    value: metric?.value ?? getMetricValue(key),
    unit: metric?.unit || fallback[key]?.unit,
    dataSource: metric?.dataSource || fallback[key]?.dataSource || '平台',
    description: metric?.description,
    formula: metric?.formula,
    hint,
    tone,
  }
}

function contentMetricCard(key: string, hint: string, tone: SignalTone): ContentMetricCard {
  const metric = getMetric(key)
  const fallback: Record<string, Pick<AnalyticsMetric, 'label' | 'unit' | 'dataSource'>> = {
    playPv: { label: '播放 PV', unit: '次', dataSource: '用户播放记录' },
    playUv: { label: '播放 UV', unit: '人', dataSource: '用户播放记录' },
    avgWatchDuration: { label: '平均播放时长', unit: '秒', dataSource: '用户播放记录' },
    firstEpisodeCompletionRate: { label: '首集完播率', unit: '%', dataSource: '用户播放记录' },
    directBounceRate: { label: '次跳率', unit: '%', dataSource: '用户播放记录' },
    unlockGateArrivalRate: { label: '卡点到达率', unit: '%', dataSource: '短剧解锁规则/播放记录' },
    unlockGateArrivalUv: { label: '卡点到达 UV', unit: '人', dataSource: '短剧解锁规则/播放记录' },
    adRequests: { label: '广告请求数量', unit: '次', dataSource: '平台事件聚合' },
    adExposurePv: { label: '广告曝光量', unit: '次', dataSource: '广告播放日志' },
    adPlayPv: { label: '广告播放 PV', unit: '次', dataSource: '广告播放日志' },
    adPlayUv: { label: '广告播放 UV', unit: '人', dataSource: '广告播放日志' },
    adPlayRate: { label: '卡点广告播放率', unit: '%', dataSource: '广告播放日志' },
    adCompletePv: { label: '广告播放完毕 PV', unit: '次', dataSource: '广告播放日志' },
    adCompleteRate: { label: '广告播放完毕率', unit: '%', dataSource: '广告播放日志' },
    adRequestToExposureRate: { label: '请求到曝光率', unit: '%', dataSource: '广告播放日志' },
    adExposureToCompleteRate: { label: '曝光到完播率', unit: '%', dataSource: '广告播放日志' },
    adCompleteToSuccessRate: { label: '完播到解锁率', unit: '%', dataSource: '广告播放日志' },
    adRequestToSuccessRate: { label: '请求到解锁率', unit: '%', dataSource: '广告播放日志' },
    avgAdWatchSeconds: { label: '平均广告观看时长', unit: '秒', dataSource: '广告播放日志' },
    adSkipPv: { label: '广告跳过 PV', unit: '次', dataSource: '广告播放日志' },
    adFailPv: { label: '广告失败 PV', unit: '次', dataSource: '广告播放日志' },
    adUnlockSuccessPv: { label: '解锁成功 PV', unit: '次', dataSource: '广告播放日志' },
    adUnlockSuccessUv: { label: '解锁成功 UV', unit: '人', dataSource: '广告播放日志' },
    adUnlockSuccessRate: { label: '解锁成功率', unit: '%', dataSource: '广告播放日志' },
    avgAdViewsPerUser: { label: '人均广告观看次数', unit: '次', dataSource: '广告播放日志' },
    ecpm: { label: 'eCPM', unit: '元', dataSource: '平台' },
    revenue: { label: '收入', unit: '元', dataSource: '平台' },
  }
  return {
    key,
    label: metric?.label || fallback[key]?.label || key,
    value: metric?.value ?? getMetricValue(key),
    unit: metric?.unit || fallback[key]?.unit,
    dataSource: metric?.dataSource || fallback[key]?.dataSource || '平台',
    description: metric?.description,
    formula: metric?.formula,
    hint,
    tone,
  }
}

function toggleEpisodeMetric(key: string | number | symbol) {
  if (key !== 'playUv' && key !== 'bounceRate' && key !== 'adUnlockSuccessRate') return
  visibleEpisodeMetrics[key] = !visibleEpisodeMetrics[key]
}

function episodeAxisLabel(row: typeof episodeChartRows.value[number]) {
  if (row.isPoisonPoint) return `第${row.episodeNumber}集\n毒点`
  if (row.isAdCheckpoint) return `第${row.episodeNumber}集\n广告`
  return `第${row.episodeNumber}集`
}

function episodeNumberFromAxisValue(value: string) {
  const match = String(value).match(/第(\d+)集/)
  if (!match) return undefined
  const episodeNumber = Number(match[1])
  return Number.isFinite(episodeNumber) ? episodeNumber : undefined
}

function rowFromAxisValue(value: string, rows: typeof episodeChartRows.value) {
  const episodeNumber = episodeNumberFromAxisValue(value)
  return episodeNumber == null ? undefined : rows.find((row) => row.episodeNumber === episodeNumber)
}

function shouldShowEpisodeAxisLabel(index: number, value: string, rows: typeof episodeChartRows.value) {
  const row = rowFromAxisValue(value, rows) || rows[index]
  if (!row) return false
  if (row.isPoisonPoint || row.isAdCheckpoint || index === 0 || index === rows.length - 1) return true
  if (rows.length <= 20) return true
  const step = rows.length <= 40 ? 2 : rows.length <= 70 ? 4 : 6
  return index % step === 0
}

function updateEpisodeVisibleRange(startPercent: number, endPercent: number, total: number) {
  if (total <= 0) {
    episodeVisibleRange.value = undefined
    return
  }
  const lastIndex = total - 1
  const parsedStart = Number(startPercent)
  const parsedEnd = Number(endPercent)
  const start = Math.max(0, Math.min(100, Number.isFinite(parsedStart) ? parsedStart : 0))
  const end = Math.max(start, Math.min(100, Number.isFinite(parsedEnd) ? parsedEnd : 100))
  episodeVisibleRange.value = {
    startIndex: Math.floor((start / 100) * lastIndex),
    endIndex: Math.ceil((end / 100) * lastIndex),
  }
}

function handleEpisodeDataZoom(params: any) {
  const zoom = params?.batch?.[0] || params || {}
  updateEpisodeVisibleRange(zoom.start ?? 0, zoom.end ?? 100, episodeChartRows.value.length)
}

function renderEpisodeChart() {
  if (!episodeChartRef.value || !filters.dramaId || !episodeChartRows.value.length) {
    episodeVisibleRange.value = undefined
    episodeChart?.clear()
    return
  }
  if (!episodeChart) {
    episodeChart = initChart(episodeChartRef.value)
    resizeObserver = new ResizeObserver(() => episodeChart?.resize())
    resizeObserver.observe(episodeChartRef.value)
  }
  const rows = episodeChartRows.value
  const zoomEnd = rows.length > 42 ? Math.max(28, Math.round((36 / rows.length) * 100)) : 100
  updateEpisodeVisibleRange(0, zoomEnd, rows.length)
  const series = []
  if (visibleEpisodeMetrics.playUv) {
    series.push({
      name: '播放人数（UV）',
      type: 'bar',
      yAxisIndex: 0,
      barMaxWidth: 28,
      itemStyle: {
        color: '#4b83f1',
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: { focus: 'series' },
      data: rows.map((row) => row.playUv),
    })
  }
  series.push({
    name: '广告曝光量',
    type: 'bar',
    yAxisIndex: 0,
    barMaxWidth: 18,
    itemStyle: {
      color: '#f0a040',
      borderRadius: [4, 4, 0, 0],
    },
    emphasis: { focus: 'series' },
    data: rows.map((row) => row.adPlayPv),
  })
  if (visibleEpisodeMetrics.bounceRate) {
    series.push({
      name: '单集跳出率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3, color: '#9c27b0' },
      itemStyle: { color: '#9c27b0', borderWidth: 2, borderColor: '#ffffff' },
      data: rows.map((row) => Number(row.bounceRate.toFixed(2))),
    })
  }
  if (visibleEpisodeMetrics.adUnlockSuccessRate) {
    series.push({
      name: '广告解锁成功率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      symbol: 'triangle',
      symbolSize: 8,
      lineStyle: { width: 2, color: '#f0a040' },
      itemStyle: { color: '#f0a040', borderWidth: 2, borderColor: '#ffffff' },
      data: rows.map((row) => Number(row.adUnlockSuccessRate.toFixed(2))),
    })
  }
  episodeChart.off('datazoom', handleEpisodeDataZoom)
  episodeChart.on('datazoom', handleEpisodeDataZoom)
  episodeChart.setOption({
    color: ['#4b83f1', '#f0a040', '#9c27b0', '#36d399'],
    grid: { top: 54, right: 58, bottom: rows.length > 20 ? 92 : 62, left: 64 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: 'rgba(226,232,240,0.45)' } },
      backgroundColor: 'rgba(8, 12, 20, 0.96)',
      borderColor: 'rgba(148, 163, 184, 0.22)',
      textStyle: { color: '#f2f6ff' },
      formatter: (params: any[]) => {
        const index = params?.[0]?.dataIndex ?? 0
        const row = rows[index]
        if (!row) return ''
        const lines = [
          `<strong>第 ${row.episodeNumber} 集</strong>`,
          `是否为广告卡点剧集：${row.isAdCheckpoint ? '是' : '否'}`,
        ]
        if (visibleEpisodeMetrics.playUv) lines.push(`播放人数（UV）：${formatNumber(row.playUv)} 人`)
        lines.push(`广告曝光量：${formatNumber(row.adPlayPv)} 次`)
        if (visibleEpisodeMetrics.bounceRate) lines.push(`单集跳出率：${formatPercent(row.bounceRate)}`)
        if (visibleEpisodeMetrics.adUnlockSuccessRate) lines.push(`广告解锁成功率：${formatPercent(row.adUnlockSuccessRate)}`)
        if (row.isPoisonPoint) lines.push(`<span style="color:#e0486d">毒点预警：跳出率超过 ${poisonThreshold}%</span>`)
        return lines.join('<br/>')
      },
    },
    legend: {
      type: 'scroll',
      top: 0,
      right: 0,
      width: 420,
      textStyle: { color: 'rgba(226,232,240,0.72)' },
      pageIconColor: 'rgba(226,232,240,0.72)',
      pageIconInactiveColor: 'rgba(148,163,184,0.28)',
      pageTextStyle: { color: 'rgba(226,232,240,0.56)' },
      data: series.map((item) => item.name),
    },
    dataZoom: rows.length > 20 ? [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        start: 0,
        end: zoomEnd,
        minSpan: 12,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 18,
        bottom: 18,
        start: 0,
        end: zoomEnd,
        minSpan: 12,
        borderColor: 'rgba(148,163,184,0.18)',
        fillerColor: 'rgba(75,131,241,0.18)',
        backgroundColor: 'rgba(15,23,42,0.62)',
        handleStyle: { color: '#4b83f1' },
        textStyle: { color: 'rgba(226,232,240,0.54)' },
        dataBackground: {
          lineStyle: { color: 'rgba(148,163,184,0.32)' },
          areaStyle: { color: 'rgba(148,163,184,0.08)' },
        },
      },
    ] : [],
    xAxis: {
      type: 'category',
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.22)' } },
      axisLabel: {
        interval: (index: number, value: string) => shouldShowEpisodeAxisLabel(index, value, rows),
        margin: 14,
        lineHeight: 16,
        color: (value: string) => {
          const row = rowFromAxisValue(value, rows)
          if (row?.isPoisonPoint) return '#e0486d'
          if (row?.isAdCheckpoint) return '#f0a040'
          return 'rgba(226,232,240,0.62)'
        },
        fontWeight: (value: string) => rowFromAxisValue(value, rows)?.isAdCheckpoint ? 700 : 400,
      },
      data: rows.map(episodeAxisLabel),
    },
    yAxis: [
      {
        type: 'value',
        name: '人数',
        axisLabel: { color: 'rgba(226,232,240,0.62)' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
      },
      {
        type: 'value',
        name: '百分比',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%', color: 'rgba(226,232,240,0.62)' },
        splitLine: { show: false },
      },
    ],
    series,
  }, true)
}

function exportEpisodeData() {
  if (!episodeChartRows.value.length) {
    Message.warning('暂无可导出的剧集流失数据')
    return
  }
  const header = '集数,是否广告卡点,播放人数UV,完播人数UV,单集跳出率,留存率,广告播放PV,广告解锁成功PV,广告解锁成功率,是否毒点预警'
  const rows = episodeChartRows.value.map((row) => [
    row.episodeNumber,
    row.isAdCheckpoint ? '是' : '否',
    row.playUv,
    row.completedUv,
    `${row.bounceRate.toFixed(2)}%`,
    `${row.retentionRate.toFixed(2)}%`,
    row.adPlayPv,
    row.adUnlockSuccessPv,
    `${row.adUnlockSuccessRate.toFixed(2)}%`,
    row.isPoisonPoint ? '是' : '否',
  ].join(','))
  const blob = new Blob([`\ufeff${[header, ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `episode-churn-${filters.dramaId || 'drama'}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function scoreFromRate(value: number, healthyValue: number) {
  if (healthyValue <= 0) return 0
  return Math.max(0, Math.min(100, (value / healthyValue) * 100))
}

function scoreFromInverseRate(value: number, healthyMax: number) {
  if (value <= healthyMax) return 100
  return Math.max(0, Math.min(100, 100 - ((value - healthyMax) / Math.max(healthyMax, 1)) * 100))
}

function buildSignal(
  key: string,
  label: string,
  value: number,
  unit: string,
  thresholds: Array<{ min: number; tone: SignalTone; status: string; hint: string }>,
  max = 100
): DecisionSignal {
  const threshold = thresholds.find((item) => value >= item.min) || thresholds[thresholds.length - 1]
  const width = `${Math.max(4, Math.min(100, (value / max) * 100))}%`
  return {
    key,
    label,
    value: unit === '%' ? formatPercent(value) : `${formatCompactValue(value)}${unit}`,
    status: threshold.status,
    hint: threshold.hint,
    width,
    tone: threshold.tone,
  }
}

function action(
  key: string,
  title: string,
  badge: string,
  value: string,
  description: string,
  tone: SignalTone
): OperatorAction {
  const colorMap: Record<SignalTone, string> = {
    good: 'green',
    warn: 'orange',
    bad: 'red',
    neutral: 'blue',
  }
  return { key, title, badge, value, description, tone, color: colorMap[tone] }
}

function hasMetricHelp(metric: Pick<AnalyticsMetric | FunnelStep, 'description' | 'formula'>) {
  return Boolean(metric.description || metric.formula)
}

function sourceClass(source?: string) {
  return source?.includes('TikTok') ? 'source-tiktok' : 'source-platform'
}

function sourceLabel(source?: string) {
  if (!source) return '平台'
  if (source.includes('TikTok')) return 'TikTok'
  if (source === '平台行为/归因数据') return '平台'
  return source
}

function goReport() {
  router.push({ path: '/ad/report', query: buildQuery() as Record<string, string | number | undefined> })
}

onMounted(async () => {
  try {
    await Promise.all([loadDramas(), loadAdPushRules()])
  } catch (error) {
    console.warn('[AnalyticsDashboard] base data load failed:', error)
  }
  await loadDashboard()
})

watch(
  () => [
    episodeChartRows.value,
    visibleEpisodeMetrics.playUv,
    visibleEpisodeMetrics.bounceRate,
    visibleEpisodeMetrics.adUnlockSuccessRate,
  ],
  () => {
    if (activeDashboardTab.value === 'content') {
      nextTick(renderEpisodeChart)
    }
  },
  { deep: true }
)

watch(activeDashboardTab, async (tab) => {
  await loadDashboard()
  if (tab === 'content') {
    nextTick(renderEpisodeChart)
  } else if (episodeChart) {
    episodeChart.resize()
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  episodeChart?.dispose()
  episodeChart = null
})
</script>

<style scoped>
.analytics-dashboard-page {
  min-height: 100%;
  color: #f2f6ff;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.page-subtitle,
.panel-subtitle {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.58);
  font-size: 13px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-panel {
  display: grid;
  grid-template-columns: 260px 190px repeat(3, minmax(140px, 1fr)) 130px 130px 40px;
  gap: 10px;
  align-items: center;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid rgba(92, 189, 197, 0.14);
  border-radius: 8px;
  background: rgba(12, 17, 28, 0.72);
}

.dashboard-tabs {
  min-width: 0;
}

.dashboard-tabs :deep(.arco-tabs-nav) {
  margin-bottom: 14px;
}

.dashboard-tabs :deep(.arco-tabs-nav-tab) {
  gap: 6px;
}

.dashboard-tabs :deep(.arco-tabs-tab) {
  padding: 8px 14px;
  color: rgba(226, 232, 240, 0.68);
  font-weight: 600;
}

.dashboard-tabs :deep(.arco-tabs-tab-active) {
  color: #f2f6ff;
}

.dashboard-tabs :deep(.arco-tabs-content) {
  padding-top: 0;
}

.dashboard-tab-content {
  width: 100%;
  max-width: none;
  min-width: 0;
  overflow: visible;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-tile,
.panel {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(18, 24, 38, 0.94), rgba(11, 15, 25, 0.94));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}

.metric-tile {
  min-height: 104px;
  padding: 14px;
}

.metric-topline,
.panel-header,
.funnel-meta,
.episode-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-topline {
  min-height: 22px;
  color: rgba(226, 232, 240, 0.68);
  font-size: 13px;
}

.metric-label-with-help {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.metric-label-with-help > span {
  min-width: 0;
}

.metric-help-icon {
  flex: none;
  color: rgba(226, 232, 240, 0.46);
  font-size: 14px;
  cursor: help;
  transition: color 0.16s ease;
}

.metric-help-icon:hover {
  color: #5cbdc5;
}

.metric-help-content {
  max-width: 280px;
  line-height: 1.55;
}

.metric-help-formula {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.72);
}

.metric-value {
  margin-top: 18px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.source-badge {
  flex: none;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
}

.scope-pill {
  flex: none;
  max-width: 360px;
  overflow: hidden;
  padding: 6px 10px;
  border: 1px solid rgba(92, 189, 197, 0.22);
  border-radius: 999px;
  color: #5cbdc5;
  background: rgba(92, 189, 197, 0.1);
  font-size: 12px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-platform {
  color: #5cbdc5;
  background: rgba(92, 189, 197, 0.12);
}

.source-tiktok {
  color: #f0a040;
  background: rgba(240, 160, 64, 0.13);
}

.decision-board {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.55fr);
  gap: 16px;
  margin-bottom: 16px;
}

.decision-hero {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  min-height: 156px;
}

.decision-score-ring {
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background:
    radial-gradient(circle at center, rgba(18, 24, 38, 0.98) 58%, transparent 60%),
    conic-gradient(#64748b 0deg, rgba(100, 116, 139, 0.2) 0deg);
}

.decision-score-ring--good {
  background:
    radial-gradient(circle at center, rgba(18, 24, 38, 0.98) 58%, transparent 60%),
    conic-gradient(#36d399 280deg, rgba(54, 211, 153, 0.18) 0deg);
}

.decision-score-ring--warn {
  background:
    radial-gradient(circle at center, rgba(18, 24, 38, 0.98) 58%, transparent 60%),
    conic-gradient(#f0a040 230deg, rgba(240, 160, 64, 0.18) 0deg);
}

.decision-score-ring--bad {
  background:
    radial-gradient(circle at center, rgba(18, 24, 38, 0.98) 58%, transparent 60%),
    conic-gradient(#e0486d 175deg, rgba(224, 72, 109, 0.18) 0deg);
}

.decision-score-ring span {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.decision-score-ring small {
  margin-top: -24px;
  color: rgba(226, 232, 240, 0.52);
  font-size: 11px;
}

.decision-copy {
  min-width: 0;
}

.decision-eyebrow {
  color: rgba(92, 189, 197, 0.86);
  font-size: 12px;
  font-weight: 700;
}

.decision-title {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

.decision-desc {
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.68);
  font-size: 13px;
  line-height: 1.65;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  min-height: 132px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(18, 24, 38, 0.82);
}

.action-card--good {
  border-color: rgba(54, 211, 153, 0.24);
  background: rgba(54, 211, 153, 0.07);
}

.action-card--warn {
  border-color: rgba(240, 160, 64, 0.24);
  background: rgba(240, 160, 64, 0.07);
}

.action-card--bad {
  border-color: rgba(224, 72, 109, 0.24);
  background: rgba(224, 72, 109, 0.07);
}

.action-card-header,
.signal-item-head,
.signal-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.action-card-header span {
  color: rgba(226, 232, 240, 0.7);
  font-size: 13px;
  font-weight: 600;
}

.action-card strong {
  display: block;
  margin-top: 14px;
  font-size: 22px;
  line-height: 1.1;
}

.action-card p {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
  line-height: 1.55;
}

.signal-panel {
  margin-bottom: 16px;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.signal-item {
  min-height: 112px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.signal-item-head span {
  color: rgba(226, 232, 240, 0.68);
  font-size: 13px;
}

.signal-item-head strong,
.signal-meta em {
  font-size: 12px;
  font-style: normal;
}

.signal-status--good {
  color: #36d399;
}

.signal-status--warn {
  color: #f0a040;
}

.signal-status--bad {
  color: #e0486d;
}

.signal-status--neutral {
  color: #5cbdc5;
}

.signal-track {
  height: 8px;
  margin: 14px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.signal-fill {
  height: 100%;
  border-radius: inherit;
}

.signal-fill--good {
  background: #36d399;
}

.signal-fill--warn {
  background: #f0a040;
}

.signal-fill--bad {
  background: #e0486d;
}

.signal-fill--neutral {
  background: #5cbdc5;
}

.signal-meta span {
  font-size: 16px;
  font-weight: 700;
}

.signal-meta em {
  color: rgba(226, 232, 240, 0.48);
  text-align: right;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.acquisition-panel,
.activation-panel,
.content-consumption-panel,
.ad-monetization-panel {
  grid-column: 1 / -1;
}

.content-grid
  > .panel:not(.acquisition-panel):not(.activation-panel):not(.content-consumption-panel):not(.ad-monetization-panel) {
  grid-column: span 6;
}

.content-grid.dashboard-tab-content > .panel.panel-wide,
.monetization-grid > .panel {
  grid-column: 1 / -1;
}

.panel {
  padding: 16px;
}

.panel-wide {
  min-width: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
}

.rate-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 999px;
  color: #36d399;
  background: rgba(54, 211, 153, 0.11);
  font-size: 12px;
}

.acquisition-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.42fr) minmax(280px, 0.58fr);
  gap: 16px;
  margin-top: 16px;
}

.acquisition-main {
  min-width: 0;
  padding: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.acquisition-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.acquisition-summary-card {
  display: flex;
  min-height: 96px;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.52);
}

.acquisition-summary-card span,
.content-metric-label,
.content-flow-copy > span {
  color: rgba(226, 232, 240, 0.58);
  font-size: 12px;
}

.acquisition-summary-card strong {
  margin-top: 10px;
  font-size: 22px;
  line-height: 1.1;
}

.acquisition-summary-card small {
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.acquisition-summary-card--good,
.content-primary-card--good,
.content-flow-card--good {
  border-color: rgba(54, 211, 153, 0.24);
  background: rgba(54, 211, 153, 0.06);
}

.acquisition-summary-card--warn,
.content-primary-card--warn,
.content-flow-card--warn {
  border-color: rgba(240, 160, 64, 0.26);
  background: rgba(240, 160, 64, 0.06);
}

.acquisition-summary-card--bad,
.content-primary-card--bad,
.content-flow-card--bad {
  border-color: rgba(224, 72, 109, 0.28);
  background: rgba(224, 72, 109, 0.06);
}

.acquisition-path {
  display: grid;
  grid-template-columns: minmax(190px, 1fr) 120px minmax(190px, 1fr);
  gap: 12px;
  align-items: stretch;
}

.acquisition-node {
  min-height: 108px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.62);
}

.acquisition-node-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(226, 232, 240, 0.66);
  font-size: 13px;
}

.acquisition-node strong {
  display: block;
  margin-top: 18px;
  font-size: 28px;
  line-height: 1;
}

.acquisition-node small {
  display: block;
  margin-top: 8px;
  color: rgba(226, 232, 240, 0.5);
  font-size: 12px;
}

.acquisition-connector {
  display: grid;
  place-items: center;
  color: #f0a040;
  font-size: 12px;
  text-align: center;
}

.acquisition-connector::before {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, rgba(240, 160, 64, 0), rgba(240, 160, 64, 0.8), rgba(240, 160, 64, 0));
}

.acquisition-connector span {
  margin-top: 8px;
}

.acquisition-progress {
  height: 12px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.acquisition-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5cbdc5, #36d399);
}

.acquisition-progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: rgba(226, 232, 240, 0.52);
  font-size: 12px;
}

.acquisition-diagnostics,
.activation-diagnostics,
.content-diagnosis-list {
  display: grid;
  gap: 10px;
}

.activation-health-pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.activation-health-pill--good {
  color: #36d399;
  background: rgba(54, 211, 153, 0.11);
}

.activation-health-pill--warn {
  color: #f0a040;
  background: rgba(240, 160, 64, 0.12);
}

.activation-health-pill--bad {
  color: #e0486d;
  background: rgba(224, 72, 109, 0.12);
}

.activation-health-pill--neutral {
  color: #5cbdc5;
  background: rgba(92, 189, 197, 0.12);
}

.activation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 16px;
  margin-top: 16px;
}

.activation-main {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.activation-primary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.activation-primary-card {
  display: flex;
  min-width: 0;
  min-height: 128px;
  flex-direction: column;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.52);
}

.activation-metric-label {
  color: rgba(226, 232, 240, 0.58);
  font-size: 12px;
}

.activation-primary-card strong {
  display: block;
  margin-top: 14px;
  font-size: 24px;
  line-height: 1.1;
}

.activation-primary-card small {
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 12px;
  line-height: 1.45;
}

.activation-primary-card .source-badge {
  width: fit-content;
  margin-top: auto;
}

.activation-primary-card--good {
  border-color: rgba(54, 211, 153, 0.24);
  background: rgba(54, 211, 153, 0.06);
}

.activation-primary-card--warn {
  border-color: rgba(240, 160, 64, 0.26);
  background: rgba(240, 160, 64, 0.06);
}

.activation-primary-card--bad {
  border-color: rgba(224, 72, 109, 0.28);
  background: rgba(224, 72, 109, 0.06);
}

.activation-primary-card--neutral {
  border-color: rgba(92, 189, 197, 0.2);
  background: rgba(92, 189, 197, 0.045);
}

.activation-quality-strip {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(92, 189, 197, 0.16);
  border-radius: 8px;
  background: rgba(92, 189, 197, 0.055);
}

.activation-quality-head,
.activation-quality-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 62px;
  gap: 10px;
  align-items: center;
}

.activation-quality-head {
  grid-template-columns: 1fr auto;
}

.activation-quality-head span,
.activation-quality-row span {
  color: rgba(226, 232, 240, 0.58);
  font-size: 12px;
}

.activation-quality-head strong,
.activation-quality-row strong {
  font-size: 13px;
  text-align: right;
}

.activation-quality-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.activation-quality-fill {
  height: 100%;
  border-radius: inherit;
}

.activation-quality-fill--good {
  background: linear-gradient(90deg, #5cbdc5, #36d399);
}

.activation-quality-fill--warn {
  background: linear-gradient(90deg, #f0a040, #e0486d);
}

.diagnostic-group-title {
  color: rgba(226, 232, 240, 0.78);
  font-size: 13px;
  font-weight: 700;
}

.diagnostic-item,
.content-diagnosis-item {
  min-height: 82px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.diagnostic-item span,
.content-diagnosis-item span {
  color: rgba(226, 232, 240, 0.58);
  font-size: 12px;
}

.diagnostic-item strong,
.content-diagnosis-item strong {
  display: block;
  margin-top: 7px;
  font-size: 20px;
  line-height: 1.1;
}

.diagnostic-item small,
.content-diagnosis-item small {
  display: block;
  margin-top: 7px;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.diagnostic-item--good,
.content-diagnosis-item--good {
  border-color: rgba(54, 211, 153, 0.22);
}

.diagnostic-item--warn,
.content-diagnosis-item--warn {
  border-color: rgba(240, 160, 64, 0.24);
}

.diagnostic-item--bad,
.content-diagnosis-item--bad {
  border-color: rgba(224, 72, 109, 0.26);
}

.funnel-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.funnel-row {
  display: grid;
  grid-template-columns: 170px minmax(120px, 1fr) 130px;
  gap: 14px;
  align-items: center;
}

.funnel-label {
  font-weight: 600;
}

.funnel-bar,
.episode-bar {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
}

.funnel-fill,
.episode-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5cbdc5, #36d399);
}

.funnel-value {
  display: grid;
  gap: 2px;
  justify-items: end;
}

.funnel-value span,
.compact-metric strong,
.strip-item strong,
.report-item strong {
  font-weight: 700;
}

.funnel-value small,
.episode-meta,
.compact-metric span,
.strip-item span,
.report-item span {
  color: rgba(226, 232, 240, 0.56);
  font-size: 12px;
}

.compact-metrics,
.metric-strip,
.report-grid {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.compact-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric-strip {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.metric-groups {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.metric-group-title {
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  font-weight: 600;
}

.metric-group .metric-strip {
  margin-top: 8px;
}

.report-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.compact-metric,
.strip-item,
.report-item {
  min-height: 76px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.compact-metric {
  display: grid;
  gap: 6px;
}

.compact-metric em {
  font-style: normal;
  font-size: 12px;
}

.strip-item,
.report-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.guidance-box {
  margin-top: 14px;
  padding: 18px;
  border: 1px dashed rgba(92, 189, 197, 0.28);
  border-radius: 8px;
  color: rgba(226, 232, 240, 0.68);
  background: rgba(92, 189, 197, 0.06);
  text-align: center;
}

.content-insight-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.content-consumption-main {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.content-primary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.content-primary-card,
.content-flow-card {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.content-primary-card {
  display: flex;
  min-height: 132px;
  flex-direction: column;
  padding: 12px;
}

.content-primary-card strong {
  display: block;
  margin-top: 14px;
  font-size: 24px;
  line-height: 1.1;
}

.content-primary-card small {
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 12px;
  line-height: 1.45;
}

.content-primary-card .source-badge {
  width: fit-content;
  margin-top: auto;
}

.content-flow-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.content-flow-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  min-height: 104px;
  padding: 12px;
}

.content-flow-step {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: rgba(226, 232, 240, 0.72);
  background: rgba(148, 163, 184, 0.14);
  font-size: 12px;
  font-weight: 800;
}

.content-flow-copy {
  min-width: 0;
}

.content-flow-copy strong {
  display: block;
  margin-top: 10px;
  font-size: 22px;
  line-height: 1.1;
}

.content-flow-copy small {
  display: block;
  margin-top: 8px;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.ad-monetization-panel {
  min-height: 0;
}

.ad-unlock-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.ad-unlock-summary-item {
  position: relative;
  display: grid;
  min-height: 128px;
  align-content: space-between;
  overflow: hidden;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.68);
}

.ad-unlock-summary-item::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: rgba(92, 189, 197, 0.72);
}

.ad-unlock-summary-item--good {
  border-color: rgba(54, 211, 153, 0.28);
  background: linear-gradient(180deg, rgba(54, 211, 153, 0.11), rgba(10, 14, 23, 0.68));
}

.ad-unlock-summary-item--good::before {
  background: #36d399;
}

.ad-unlock-summary-item--warn {
  border-color: rgba(240, 160, 64, 0.3);
  background: linear-gradient(180deg, rgba(240, 160, 64, 0.11), rgba(10, 14, 23, 0.68));
}

.ad-unlock-summary-item--warn::before {
  background: #f0a040;
}

.ad-unlock-summary-item--bad {
  border-color: rgba(224, 72, 109, 0.3);
  background: linear-gradient(180deg, rgba(224, 72, 109, 0.11), rgba(10, 14, 23, 0.68));
}

.ad-unlock-summary-item--bad::before {
  background: #e0486d;
}

.ad-unlock-summary-item--neutral {
  border-color: rgba(92, 189, 197, 0.24);
  background: linear-gradient(180deg, rgba(92, 189, 197, 0.1), rgba(10, 14, 23, 0.68));
}

.ad-unlock-summary-label {
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
  font-weight: 700;
}

.ad-unlock-summary-item strong {
  display: block;
  margin-top: 18px;
  font-size: 28px;
  line-height: 1.05;
}

.ad-unlock-summary-item small {
  display: block;
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.ad-monetization-board {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.ad-monetization-section {
  padding: 15px;
  border: 1px solid rgba(148, 163, 184, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.028);
}

.ad-monetization-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.ad-monetization-section-head span {
  color: rgba(226, 232, 240, 0.84);
  font-size: 14px;
  font-weight: 700;
}

.ad-monetization-section-head small {
  display: block;
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 12px;
}

.ad-monetization-section-head em {
  flex: none;
  padding: 4px 9px;
  border-radius: 999px;
  color: rgba(226, 232, 240, 0.56);
  background: rgba(148, 163, 184, 0.1);
  font-size: 12px;
  font-style: normal;
}

.ad-monetization-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ad-monetization-card {
  display: flex;
  min-width: 0;
  min-height: 126px;
  flex-direction: column;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.62);
  transition:
    border-color 0.16s ease,
    background 0.16s ease,
    transform 0.16s ease;
}

.ad-monetization-card:hover {
  border-color: rgba(92, 189, 197, 0.3);
  background: rgba(13, 19, 31, 0.78);
  transform: translateY(-1px);
}

.ad-monetization-card strong {
  display: block;
  margin-top: 12px;
  font-size: 22px;
  line-height: 1.1;
}

.ad-monetization-card small {
  display: block;
  margin-top: 8px;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.ad-monetization-card em {
  width: fit-content;
  margin-top: auto;
  font-style: normal;
  font-size: 12px;
}

.ad-monetization-card--good {
  border-color: rgba(54, 211, 153, 0.24);
  background: rgba(54, 211, 153, 0.055);
}

.ad-monetization-card--warn {
  border-color: rgba(240, 160, 64, 0.28);
  background: rgba(240, 160, 64, 0.055);
}

.ad-monetization-card--bad {
  border-color: rgba(224, 72, 109, 0.28);
  background: rgba(224, 72, 109, 0.055);
}

.ad-monetization-card--neutral {
  border-color: rgba(92, 189, 197, 0.18);
}

.ad-unlock-behavior-strip {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(240, 160, 64, 0.16);
  border-radius: 8px;
  background: rgba(240, 160, 64, 0.045);
}

.ad-unlock-behavior-title {
  color: rgba(226, 232, 240, 0.78);
  font-size: 13px;
  font-weight: 700;
}

.ad-unlock-behavior-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ad-unlock-behavior-card {
  display: grid;
  align-content: start;
  min-height: 96px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(10, 14, 23, 0.58);
}

.ad-unlock-behavior-card strong {
  display: block;
  margin-top: 12px;
  font-size: 23px;
  line-height: 1.1;
}

.ad-unlock-behavior-card small {
  display: block;
  margin-top: 8px;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  line-height: 1.45;
}

.ad-unlock-behavior-card--good {
  border-color: rgba(54, 211, 153, 0.24);
}

.ad-unlock-behavior-card--warn {
  border-color: rgba(240, 160, 64, 0.28);
}

.ad-unlock-behavior-card--bad {
  border-color: rgba(224, 72, 109, 0.28);
}

.content-metric-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.content-metric-card {
  min-height: 98px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.content-metric-card--good {
  border-color: rgba(54, 211, 153, 0.22);
}

.content-metric-card--warn {
  border-color: rgba(240, 160, 64, 0.24);
}

.content-metric-card--bad {
  border-color: rgba(224, 72, 109, 0.26);
}

.content-metric-label {
  color: rgba(226, 232, 240, 0.58);
  font-size: 12px;
}

.content-metric-card strong {
  display: block;
  margin-top: 12px;
  font-size: 22px;
  line-height: 1.1;
}

.content-metric-card small {
  display: block;
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 12px;
  line-height: 1.45;
}

.content-diagnosis-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(92, 189, 197, 0.16);
  border-radius: 8px;
  background: rgba(92, 189, 197, 0.055);
}

.content-diagnosis-title {
  margin-bottom: 12px;
  color: rgba(226, 232, 240, 0.78);
  font-size: 13px;
  font-weight: 700;
}

.content-diagnosis-card .content-diagnosis-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.episode-funnel-module {
  margin-top: 14px;
}

.episode-toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto 240px auto;
  gap: 12px;
  align-items: center;
  padding: 12px 0 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.episode-filter-group {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.episode-filter-label {
  flex: none;
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
  font-weight: 600;
}

.episode-refresh-time {
  justify-self: end;
  color: rgba(226, 232, 240, 0.48);
  font-size: 12px;
  white-space: nowrap;
}

.episode-empty {
  padding: 44px 0 28px;
}

.episode-chart-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.episode-chart-metric {
  min-height: 92px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
}

.episode-chart-metric strong {
  display: block;
  margin-top: 12px;
  font-size: 22px;
  line-height: 1.1;
}

.episode-chart-metric small {
  display: block;
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.46);
  font-size: 12px;
  line-height: 1.45;
}

.episode-chart-metric .source-badge {
  width: fit-content;
  margin-top: auto;
}

.episode-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.025);
}

.episode-kpi-card {
  position: relative;
  display: grid;
  min-height: 88px;
  padding: 12px 14px;
  border: 0;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  color: #f2f6ff;
  background: transparent;
  text-align: left;
}

.episode-kpi-card:last-child {
  border-right: 0;
}

.episode-kpi-card--toggle {
  cursor: pointer;
}

.episode-kpi-card:disabled {
  cursor: default;
}

.episode-kpi-card--active.episode-kpi-card--blue {
  background: #4b83f1;
}

.episode-kpi-card--active.episode-kpi-card--purple {
  background: #8f24aa;
}

.episode-kpi-card--active.episode-kpi-card--green {
  background: #198f67;
}

.episode-kpi-card--active.episode-kpi-card--orange {
  background: #b46b12;
}

.episode-kpi-check {
  position: absolute;
  top: 10px;
  left: 12px;
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(226, 232, 240, 0.72);
  border-radius: 2px;
  color: #fff;
  font-size: 12px;
}

.episode-kpi-card:not(.episode-kpi-card--toggle) .episode-kpi-check {
  display: none;
}

.episode-kpi-label {
  margin-left: 20px;
  color: rgba(226, 232, 240, 0.74);
  font-size: 12px;
  line-height: 18px;
}

.episode-kpi-card--active .episode-kpi-label {
  color: rgba(255, 255, 255, 0.92);
}

.episode-kpi-card strong {
  align-self: end;
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.episode-chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.episode-chart-title {
  font-size: 15px;
  font-weight: 700;
}

.episode-chart-subtitle {
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.5);
  font-size: 12px;
}

.episode-chart {
  width: 100%;
  height: 420px;
  margin-top: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.empty-state {
  padding: 72px 0;
}

@media (max-width: 1280px) {
  .filter-panel,
  .overview-grid,
  .decision-board,
  .action-grid,
  .signal-grid,
  .episode-toolbar,
  .episode-kpi-grid,
  .metric-strip,
  .report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .acquisition-panel,
  .activation-panel,
  .content-consumption-panel,
  .ad-monetization-panel {
    grid-column: 1 / -1;
  }

  .content-grid
    > .panel:not(.acquisition-panel):not(.activation-panel):not(.content-consumption-panel):not(.ad-monetization-panel) {
    grid-column: span 1;
  }

  .acquisition-layout,
  .activation-layout,
  .content-insight-layout {
    grid-template-columns: 1fr;
  }

  .content-metric-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .acquisition-summary-grid,
  .activation-primary-grid,
  .content-primary-grid,
  .ad-unlock-behavior-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ad-unlock-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ad-monetization-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .content-flow-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-panel :deep(.arco-picker),
  .filter-panel :deep(.arco-select),
  .filter-panel :deep(.arco-input-wrapper) {
    width: 100% !important;
  }
}

@media (max-width: 760px) {
  .page-header,
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-panel,
  .overview-grid,
  .content-grid,
  .compact-metrics,
  .decision-board,
  .decision-hero,
  .action-grid,
  .signal-grid,
  .episode-toolbar,
  .episode-kpi-grid,
  .metric-strip,
  .report-grid,
  .funnel-row {
    grid-template-columns: 1fr;
  }

  .content-grid > .panel,
  .acquisition-panel,
  .activation-panel,
  .content-consumption-panel,
  .ad-monetization-panel {
    grid-column: 1 / -1 !important;
  }

  .acquisition-layout,
  .acquisition-summary-grid,
  .acquisition-path,
  .activation-layout,
  .activation-primary-grid,
  .content-insight-layout,
  .content-primary-grid,
  .content-flow-strip,
  .ad-unlock-summary,
  .ad-monetization-grid,
  .ad-unlock-behavior-grid,
  .content-metric-board {
    grid-template-columns: 1fr;
  }

  .ad-monetization-section-head {
    display: grid;
    gap: 4px;
  }

  .episode-filter-group,
  .episode-chart-head {
    flex-direction: column;
    align-items: stretch;
  }

  .content-diagnosis-card .content-diagnosis-list {
    grid-template-columns: 1fr;
  }

  .episode-refresh-time {
    justify-self: start;
  }

  .episode-kpi-card {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  }

  .episode-kpi-card:last-child {
    border-bottom: 0;
  }

  .funnel-value {
    justify-items: start;
  }
}
</style>
