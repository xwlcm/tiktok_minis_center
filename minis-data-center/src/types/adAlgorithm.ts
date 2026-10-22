/** 广告效果分析 VO */
export interface AdAnalyticsVo {
  adId: number
  adName: string
  advertiser: string | null
  pushCount: number
  completeCount: number
  completeRate: number
  unlockCount: number
  conversionRate: number
  lastPushTime: string | null
  riskTag: string | null
}

/** 算法运行状态 VO */
export interface AdAlgorithmStatusVo {
  phase: 'COLD_START' | 'NORMAL'
  coldStartThreshold: number
  currentEpsilon: number
  coldStartAds: ColdStartAdVo[]
  top10: TopAdVo[]
}

/** 冷启动广告 VO */
export interface ColdStartAdVo {
  adId: number
  adName: string
  pushCount7d: number
}

/** TOP10 广告 VO */
export interface TopAdVo {
  adId: number
  adName: string
  finalScore: number
  scoreMatrix?: Record<string, Record<string, number>>
}

/** 推送日志 VO */
export interface AdPushLogVo {
  id: number
  openId: string
  adId: number
  adName: string | null
  dramaId: string
  episodeNumber: number
  watchStatus: string
  watchedSeconds: number
  isSuspect: number
  suspectReason: string | null
  unlockSuccess: number
  createTime: string
}

/** 推送日志查询参数 */
export interface PushLogQuery {
  openId?: string
  adId?: number
  startTime?: string
  endTime?: string
  unlockSuccess?: number
  isSuspect?: number
  pageNum?: number
  pageSize?: number
}

/** 算法配置 VO */
export interface AdAlgorithmConfigVo {
  id: number
  isEnabled: number
  epsilonColdStart: number
  epsilonNormal: number
  coldStartMinExposureBase: number
  coldStartFactor: number
  weightWindow5m: number
  weightWindow30m: number
  weightWindow2h: number
  weightWindow24h: number
  weightWindow7d: number
  dimensions: DimensionConfigVo[]
}

/** 维度配置 VO */
export interface DimensionConfigVo {
  id: number
  dimensionCode: string
  dimensionName: string
  weight: number
  isEnabled: number
  calculatorBean: string
}

/** 算法配置更新 BO */
export interface AdAlgorithmConfigUpdateBo {
  isEnabled: number
  epsilonColdStart: number
  epsilonNormal: number
  coldStartMinExposureBase: number
  coldStartFactor: number
  weightWindow5m: number
  weightWindow30m: number
  weightWindow2h: number
  weightWindow24h: number
  weightWindow7d: number
  dimensions: DimensionWeightBo[]
}

/** 维度权重更新 BO */
export interface DimensionWeightBo {
  id: number
  weight: number
  isEnabled: number
}
