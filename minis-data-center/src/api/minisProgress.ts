import request from '@/utils/request.ts'

/** 看板行数据 */
export interface MinisProgressDashboardItem {
  /** 雪花 ID 超出 JS 安全整数范围，后端序列化为字符串 */
  id: number | string
  clientKey: string
  minisName: string
  teamName: string | null
  targetSpend: number
  periodStart: string
  periodEnd: string
  totalDays: number
  elapsedDays: number
  timeProgress: number
  actualSpend: number
  completionRate: number
  estimatedDailySpend: number
  roi: number
  roiTarget: number | null
  completionStatus: 'COMPLETED' | 'IN_PROGRESS' | 'AT_RISK' | 'FAILED'
  completionLabel: string
}

/** 剧消耗表现行数据 */
export interface DramaPerformanceItem {
  dramaName: string
  campaignName: string
  spend: number
  reportDate: string
  roi: number
  day0Revenue: number
  day13Revenue: number
}

/** 看板响应数据 */
export interface MinisProgressDashboardResponse {
  progressList: MinisProgressDashboardItem[]
  dramaPerformanceList: DramaPerformanceItem[]
}

/** 广告帐户（下拉选项） */
export interface AdAccountItem {
  /** 雪花 ID 超出 JS 安全整数范围，后端序列化为字符串 */
  id: number | string
  clientKey: string
  authUserName: string | null
  appName: string | null
  minisName: string | null
  teamName: string | null
  targetSpend: number | null
  periodStart: string | null
  periodEnd: string | null
  roiTarget: number | null
  status: number
}

/** 目标配置表单 */
export interface TargetConfigForm {
  minisName?: string
  teamName?: string
  targetSpend: number
  periodStart: string
  periodEnd: string
  roiTarget?: number
}

/** 获取看板数据 */
export function fetchMinisProgressDashboard(params?: { startDate?: string; endDate?: string }) {
  return request.get<MinisProgressDashboardResponse>('/system/ad-minis-progress/dashboard', { params })
}

/** 获取广告帐户列表（配置目标下拉用，不做 clientKey 隔离） */
export function fetchAdAccountList() {
  return request.get<AdAccountItem[]>('/system/ad-minis-progress/account-list')
}

/** 设置/更新目标配置 */
export function updateAccountTargetConfig(accountId: number | string, data: TargetConfigForm) {
  return request.put<void>(`/system/ad-account/${accountId}/target`, data)
}

/** 清除目标配置 */
export function clearAccountTargetConfig(accountId: number | string) {
  return request.delete<void>(`/system/ad-account/${accountId}/target`)
}
