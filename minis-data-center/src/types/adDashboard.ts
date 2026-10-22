/**
 * 平台归因漏斗数据
 * 数据源：平台事件归因系统
 */
export interface AttributionFunnelData {
  dataSource: 'platform_attribution'
  /** 曝光数（ad_push_log 推送记录） */
  impressions: number
  /** 点击数（event_log ad_click 事件） */
  clicks: number
  /** 转化数（user_unlock_record IAA 解锁） */
  conversion: number
  /** 付费数（pay_order SUCCESS 订单） */
  purchase: number
  /** 留存数（次日 app_open 事件） */
  retention: number
  /** 点击率 (%) */
  ctr: number
  /** 点击→转化率 (%) */
  clickToConversion: number
  /** 转化→付费率 (%) */
  conversionToPurchase: number
  /** 付费→留存率 (%) */
  purchaseToRetention: number
}

/**
 * 平台视频播放指标
 * 数据源：平台事件归因系统
 */
export interface AttributionVideoMetrics {
  dataSource: 'platform_attribution'
  /** 总播放量 */
  totalPlays: number
  /** 完播数 */
  completedViews: number
  /** 完播率 (%) */
  completionRate: number
}

/**
 * 归因历史记录
 * 数据源：B 端归因流水查询接口
 */
export interface AttributionHistoryVo {
  id: number
  clientKey: string
  openId: string
  entrySource: string
  isFirst: number
  linkCode: string
  promoterId: number | null
  promoterName: string
  channel: string
  campaignId: string
  adgroupId: string
  creativeId: string
  targetDramaId: string
  extParams: string
  rawParams: string
  attrTime: string
}

/**
 * 归因历史分页结果
 */
export interface AttributionHistoryPageResult {
  rows: AttributionHistoryVo[]
  total: number
}

/**
 * TikTok 广告报表汇总
 * 数据源：TikTok Business API
 */
export interface AdReportOverview {
  dataSource: 'tiktok_business_api'
  /** 总花费（美元） */
  totalSpend: number
  /** 总曝光数 */
  totalImpressions: number
  /** 总点击数 */
  totalClicks: number
  /** 总转化数 */
  totalConversions: number
}

/**
 * TikTok 广告报表 ROAS
 * 数据源：TikTok Business API
 */
export interface AdReportRoas {
  dataSource: 'tiktok_business_api'
  /** 综合 ROAS；无可计算消耗时为 null */
  roas: number | null
  /** D0 ROAS（查询时间段内 D0 总收入 / 总消耗） */
  day0Roas: number | null
  /** D13 ROAS（查询时间段内 D13 总收入 / 总消耗） */
  day13Roas: number | null
}

/**
 * 短剧广告数据列表项
 * 数据源：TikTok Business API
 */
export interface AdReportDramaItem {
  /** 短剧 ID */
  dramaId: number | string
  /** 短剧名称 */
  dramaName?: string | null
  /** 花费（美元） */
  spend: number
  /** 曝光数 */
  impressions: number
  /** 点击数 */
  clicks: number
  /** 转化数 */
  conversions: number
  /** 收入 */
  revenue: number
  /** 点击率 (%) */
  ctr: number
  /** 单次点击成本 */
  cpc: number
  /** 千次展示成本 */
  cpm: number
  /** ROAS */
  roas: number | null
  /** D0 ROAS */
  day0Roas?: number | null
  /** D13 ROAS */
  day13Roas?: number | null
}

/**
 * 短剧广告数据列表响应
 * 数据源：TikTok Business API
 */
export interface AdReportDramaList {
  dataSource: 'tiktok_business_api'
  list: AdReportDramaItem[]
}

/**
 * TikTok 广告报表分天 ROAS 行
 */
export interface AdReportDailyRoasItem {
  date: string
  dataSource: string
  revenueDataSource?: string | null
  trafficDataSource?: string | null
  spend: number | null
  partner?: string | null
  dramaId?: number | string | null
  minisName?: string | null
  dramaName?: string | null
  optimizationName?: string | null
  advertiserId?: string | null
  adId?: string | null
  day0Revenue?: number | null
  day0Roas?: number | null
  day13Revenue?: number | null
  day13Roas?: number | null
  roas0?: number | null
  roasDay0?: number | null
  roasDay6?: number | null
  roasDay7?: number | null
  roasDay13?: number | null
  purchaseRoasDay0?: number | null
  purchaseRoasDay7?: number | null
  purchaseRoasDay13?: number | null
  adRevenueRoasDay0?: number | null
  adRevenueRoasDay7?: number | null
  adRevenueRoasDay13?: number | null
  totalRoasDay0?: number | null
  totalRoasDay7?: number | null
  totalRoasDay13?: number | null
  conversionCost?: number | null
  cpa?: number | null
  conversionRate?: number | null
  conversion?: number | null
  conversions?: number | null
  clickCost?: number | null
  cpc?: number | null
  clickRate?: number | null
  ctr?: number | null
  clicks?: number | null
  impressions?: number | null
  cpm?: number | null
}

/**
 * TikTok 广告报表分天 ROAS 响应
 */
export interface AdReportDailyRoas {
  dataSource: 'tiktok_business_api'
  list: AdReportDailyRoasItem[]
}

/**
 * 短剧 ROI 行
 * 数据源：TikTok Business API + Native growth
 */
export interface DramaRoiItem {
  dramaId: number | string
  dramaName: string
  appName?: string
  dataSource: 'tiktok_business_api'
  revenueDataSource?: 'tiktok_native_growth'
  trafficDataSource?: 'tiktok_business_api'
  spend: number
  iaaRevenue: number
  iapRevenue: number
  totalRevenue: number
  totalRoas: number
  day0Revenue: number
  day0Roas: number
  day13Revenue: number
  day13Roas: number
  conversionCost: number
  conversionRate: number
  conversion: number
  conversions: number
  clickCost: number
  clickRate: number
  clicks: number
  impressions: number
  cpm: number
}
