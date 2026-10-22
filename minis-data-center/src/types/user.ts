export interface User {
  userId: number
  clientKey?: string
  tenantId?: string
  openId: string
  nickname: string
  avatarUrl: string
  gender?: number
  phone?: string
  email?: string
  status?: number
  createTime?: string
  updateTime?: string
  // 用户价值分层字段
  firstLoginTime?: string
  lastLoginTime?: string
  lastActiveTime?: string
  consecutiveActiveDays?: number
  totalActiveDays?: number
  totalWatchDurationMs?: number
  totalEpisodesWatched?: number
  totalDramasWatched?: number
  totalDramasCompleted?: number
  totalAdsWatched?: number
  totalAdsCompleted?: number
  totalUnlocks?: number
  totalIapAmount?: number
  valueTier?: string
  valueScore?: string | number
  churnRisk?: string
  /** 是否处于强弹广告白名单（用户列表开关用） */
  adWhitelist?: boolean
}

export interface UserProfile {
  openId: string
  nickname: string
  avatarUrl: string
  registeredAt: string
  lastActiveAt: string
  valueTier: string
  totalEpisodesWatched: number
  totalWatchDurationMs: number
  totalDramasWatched: number
  totalAdsWatched: number
  totalAdsCompleted: number
  totalDramasCompleted: number
  totalEpisodesCompleted: number
  adCompletionRate: number
}

export interface UserTrendPoint {
  date: string
  durationMinutes: number
  episodes: number
}

export interface UserTrendVO {
  points: UserTrendPoint[]
}
