import request from '@/utils/request.ts'
import type {
  AttributionFunnelData,
  AttributionHistoryPageResult,
  AttributionVideoMetrics,
  DramaRoiItem,
} from '@/types/adDashboard.ts'

export function fetchAttributionFunnel(params: { startDate: string; endDate: string; dramaId?: number }) {
  return request.get<AttributionFunnelData>('/system/ad-dashboard/attribution-funnel', { params })
}

export function fetchAttributionVideoMetrics(params: { startDate: string; endDate: string; dramaId?: number }) {
  return request.get<AttributionVideoMetrics>('/system/ad-dashboard/attribution-video-metrics', { params })
}

export function fetchAttributionHistoryList(params: {
  clientKey: string
  startTime: string
  endTime: string
  promoterId?: number
  channel?: string
  linkCode?: string
  openId?: string
  campaignId?: string
  adgroupId?: string
  creativeId?: string
  targetDramaId?: string
  pageNum?: number
  pageSize?: number
}) {
  return request.get<AttributionHistoryPageResult>('/system/attribution/history/list', { params })
}

export function fetchFunnelData(startDate: string, endDate: string, dramaId?: number) {
  return request.get<any>('/system/ad-dashboard/funnel', { params: { startDate, endDate, dramaId } })
}

export function fetchVideoMetrics(startDate: string, endDate: string, dramaId?: number) {
  return request.get<any>('/system/ad-dashboard/video-metrics', { params: { startDate, endDate, dramaId } })
}

export function fetchDramaRoiList(params: {
  startDate: string
  endDate: string
  dramaId?: string
  advertiserId?: string
  campaignId?: string
  adgroupId?: string
  includeUnmapped?: boolean
}) {
  return request.get<DramaRoiItem[]>('/system/ad-analytics/drama-roi', { params })
}

export function fetchDramaRoiTrend(dramaId: number, startDate: string, endDate: string) {
  return request.get<any[]>(`/system/ad-analytics/drama-roi/${dramaId}/trend`, { params: { startDate, endDate } })
}

export function fetchDramaChurn(dramaId: number) {
  return request.get<any[]>(`/system/ad-analytics/drama-churn/${dramaId}`)
}

export function fetchAnalyticsAlerts(startDate: string, endDate: string) {
  return request.get<any[]>('/system/ad-analytics/alerts', { params: { startDate, endDate } })
}

export function fetchAlertRuleList() {
  return request.get<any[]>('/system/ad-alert-rule/list')
}

export function createAlertRule(data: {
  ruleName: string
  ruleType: string
  threshold: number
  compareWindow: string
  notifyType: string
}) {
  return request.post<void>('/system/ad-alert-rule', data)
}

export function updateAlertRule(data: {
  id: number
  ruleName: string
  ruleType: string
  threshold: number
  compareWindow: string
  notifyType: string
}) {
  return request.put<void>('/system/ad-alert-rule', data)
}

export function deleteAlertRule(id: number) {
  return request.delete<void>(`/system/ad-alert-rule/${id}`)
}

export function changeAlertRuleStatus(id: number, status: number) {
  return request.put<void>(`/system/ad-alert-rule/${id}/status/${status}`)
}
