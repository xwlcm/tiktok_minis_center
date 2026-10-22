export interface AnalyticsMetric {
  key: string
  label: string
  value: number | string
  unit?: string
  dataSource: string
  description?: string
  formula?: string
}

export interface FunnelStep {
  key: string
  label: string
  pv?: number
  uv?: number
  rate?: number | string
  dataSource: string
  description?: string
  formula?: string
}

export interface AnalyticsDashboardQuery {
  startDate?: string
  endDate?: string
  dramaId?: string
  campaignId?: string
  adgroupId?: string
  creativeId?: string
  channel?: string
  userScope?: string
}

export interface AnalyticsOverview {
  refreshedAt: string
  kpis: AnalyticsMetric[]
  summaries: AnalyticsMetric[]
}

export interface AcquisitionFunnel {
  steps: FunnelStep[]
  arrivalRate: number | string
}

export interface ActivationMetrics {
  kpis: AnalyticsMetric[]
}

export interface ContentConsumption {
  kpis: AnalyticsMetric[]
  episodeChurnAvailable: boolean
  guidance?: string
}

export interface AdUnlockBehavior {
  kpis: AnalyticsMetric[]
}

export interface EpisodeChurn {
  dramaId: string
  episodes: FunnelStep[]
  adUnlocks?: FunnelStep[]
  warnings: string[]
}

export interface IaaMonetization {
  kpis: AnalyticsMetric[]
}

export interface TikTokReportSummary {
  kpis: AnalyticsMetric[]
  dataSource: string
  drillDownPath: string
}
