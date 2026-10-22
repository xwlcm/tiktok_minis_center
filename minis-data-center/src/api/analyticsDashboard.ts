import request from '@/utils/request.ts'
import type {
  AcquisitionFunnel,
  ActivationMetrics,
  AdUnlockBehavior,
  AnalyticsDashboardQuery,
  AnalyticsOverview,
  ContentConsumption,
  EpisodeChurn,
  IaaMonetization,
  TikTokReportSummary,
} from '@/types/analyticsDashboard.ts'

const BASE_URL = '/system/analytics-dashboard'

/**
 * 正式数据分析看板接口。
 *
 * @deprecated 旧的 /system/ad-dashboard/funnel、/system/ad-dashboard/video-metrics 仅保留兼容，
 * 新看板请使用本文件中的接口。
 */
export function fetchAnalyticsOverview(params: AnalyticsDashboardQuery) {
  return request.get<AnalyticsOverview>(`${BASE_URL}/overview`, { params })
}

export function fetchAcquisitionFunnel(params: AnalyticsDashboardQuery) {
  return request.get<AcquisitionFunnel>(`${BASE_URL}/acquisition-funnel`, { params })
}

export function fetchActivationMetrics(params: AnalyticsDashboardQuery) {
  return request.get<ActivationMetrics>(`${BASE_URL}/activation-metrics`, { params })
}

export function fetchContentConsumption(params: AnalyticsDashboardQuery) {
  return request.get<ContentConsumption>(`${BASE_URL}/content-consumption`, { params })
}

export function fetchAdUnlockBehavior(params: AnalyticsDashboardQuery) {
  return request.get<AdUnlockBehavior>(`${BASE_URL}/ad-unlock-behavior`, { params })
}

export function fetchEpisodeChurn(params: AnalyticsDashboardQuery) {
  return request.get<EpisodeChurn>(`${BASE_URL}/episode-churn`, { params })
}

export function fetchIaaMonetization(params: AnalyticsDashboardQuery) {
  return request.get<IaaMonetization>(`${BASE_URL}/iaa-monetization`, { params })
}

export function fetchTikTokReportSummary(params: AnalyticsDashboardQuery) {
  return request.get<TikTokReportSummary>(`${BASE_URL}/tiktok-report-summary`, { params })
}
