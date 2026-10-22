export interface TrendPoint {
  date: string
  newUsers: number
  activeUsers: number
  adImpressions: number
  adCompletions: number
  iapRevenue?: number
  watchDuration?: number
}

export interface DashboardData {
  dau?: number
  mau?: number
  newUsers?: number
  completionRate?: number
  iapRevenue?: number
  iaaUnlockCount?: number
  iapUnlockCount?: number
  totalLaunchCount?: number
  adShowCount?: number
  adCompleteCount?: number
  dauTrend?: TrendPoint[]
}
