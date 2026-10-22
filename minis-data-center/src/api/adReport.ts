import request from '@/utils/request.ts'
import type { AdReportDailyRoas, AdReportDramaList, AdReportOverview, AdReportRoas } from '@/types/adDashboard.ts'

export interface AdReportQueryParams {
  startDate: string
  endDate: string
  appClientKey?: string
  dramaId?: number
  optimizerName?: string
  adAccountId?: number | string
  appName?: string
}

export function fetchAdReportOverview(params: AdReportQueryParams) {
  return request.get<AdReportOverview>('/system/ad-dashboard/ad-report-overview', { params })
}

export function fetchAdReportRoas(params: AdReportQueryParams) {
  return request.get<AdReportRoas>('/system/ad-dashboard/ad-report-roas', { params })
}

export function fetchAdReportDramaList(params: AdReportQueryParams) {
  return request.get<AdReportDramaList>('/system/ad-dashboard/ad-report-drama-list', { params })
}


// ... 修改前端传参 ...
export function fetchAdReportDailyRoas(params: AdReportQueryParams) {
  return request.get<AdReportDailyRoas>('/system/ad-dashboard/ad-report-daily-roas', { params })
}


export function fetchDramaOverview(startDate: string, endDate: string) {
  return request.get<any[]>('/system/ad-dashboard/drama-overview', { params: { startDate, endDate } })
}

export function fetchDramaDetail(dramaId: string, startDate: string, endDate: string) {
  return request.get<any>(`/system/ad-dashboard/drama/${dramaId}/detail`, { params: { startDate, endDate } })
}

export function fetchCampaignAdgroups(campaignId: string, startDate: string, endDate: string) {
  return request.get<any[]>(`/system/ad-dashboard/campaign/${campaignId}/adgroups`, { params: { startDate, endDate } })
}

export function fetchAdgroupAds(adgroupId: string, startDate: string, endDate: string) {
  return request.get<any[]>(`/system/ad-dashboard/adgroup/${adgroupId}/ads`, { params: { startDate, endDate } })
}

export function fetchDramaRoas(dramaId: string, startDate: string, endDate: string) {
  return request.get<number>(`/system/ad-dashboard/drama/${dramaId}/roas`, { params: { startDate, endDate } })
}

export function fetchDailyRoas(
  startDate: string,
  optimizerName: string,
  appName: string, 
  endDate: string,
  adAccountId?: number,
   dramaId?: number
) {
  return request.get<any[]>('/system/ad-dashboard/daily-roas', { params: { startDate, endDate, dramaId } })
}

export function fetchCreativeFatigue(startDate: string, endDate: string) {
  return request.get<any[]>('/system/ad-analytics/creative-fatigue', { params: { startDate, endDate } })
}

export function fetchEcpmTrend(startDate: string, endDate: string, dramaId?: number) {
  return request.get<any[]>('/system/ad-analytics/ecpm', { params: { startDate, endDate, dramaId } })
}

export function fetchRoasSummary(startDate: string, endDate: string, dramaId?: number) {
  return request.get<any>('/system/ad-analytics/roas', { params: { startDate, endDate, dramaId } })
}

export function fetchGeoAnalysis(startDate: string, endDate: string) {
  return request.get<any[]>('/system/ad-analytics/geo', { params: { startDate, endDate } })
}

/**
 * 获取当前应用下所有合作商列表（从 drama 表去重）。
 */
export function fetchPartnerList() {
  return request.get<string[]>('/system/ad-dashboard/partner-list')
}
