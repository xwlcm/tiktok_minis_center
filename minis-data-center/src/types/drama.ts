export interface Tag {
  id: number
  clientKey?: string
  name: string
  groupName: string
  color: string | null
  icon: string | null
  sortWeight: number
  status: number
  refCount: number
  createTime?: string
  updateTime?: string
}

export interface Episode {
  id: number
  dramaId?: string
  episodeNumber: number
  name?: string
  description?: string
  duration?: number
  videoUrl?: string
  vid?: string
  posterUrl?: string
  isFree?: number
  status?: number
}

export interface AdInventory {
  id: string
  adName: string
  adType: string
  adUnitId: string
  status: number
  pushCount: number
  createTime?: string
  updateTime?: string
}

export interface AdPushRule {
  id: string
  ruleName: string
  adCountPerUnlock: number
  episodesPerUnlock: number
  maxAdCountPerDay: number
  isDefault: number
  status: number
  createTime?: string
  updateTime?: string
}

export interface ForceAdRule {
  id: string
  ruleName: string
  /** 登录后首次弹激励视频的等待时间（毫秒） */
  showRewardedVideoAdTimeout: number
  /** 激励视频循环弹出及关闭后再次弹出的间隔（毫秒） */
  showRewardedVideoAdInterval: number
  /** 进入首页类页面后首次弹插屏的等待时间（毫秒） */
  showInterstitialAdTimeout: number
  /** 插屏广告循环弹出的时间间隔（毫秒） */
  showInterstitialAdInterval: number
  /** 广告未完整观看时累计展示达到该次数仍进入成功逻辑 */
  adSuccessCount: number
  /** 播放页广告模式：rewarded/interstitial */
  adPattern: string
  /** 强弹激励展示次数上限：0 表示不设上限 */
  maxForceCount: number
  /** 强弹计数重置周期（小时）：0 表示永不重置，强弹规则全局只生效一次 */
  resetIntervalHours: number
  /** 短剧播放页是否强弹：1-是 0-否 */
  forceOnDramaPage: number
  /** 短剧页强弹次数上限：与首页强弹计数隔离单独累计；0 表示不设上限 */
  dramaMaxForceCount: number
  /** 短剧页强弹首次弹出延迟（毫秒）：0 表示立即弹出 */
  dramaForceDelay?: number
  /** 细粒度策略配置（JSON 字符串）：A首页/B短剧页/C广告结果/D生命周期四组开关与枚举；空表示全部使用默认值 */
  strategyConfig?: string
  isDefault: number
  status: number
  /** 绑定的应用 clientKey 列表 */
  clientKeys?: string[]
  createTime?: string
  updateTime?: string
}

export interface Drama {
  id: string
  name: string
  description?: string
  coverUrl?: string
  tags?: string
  totalEpisodes?: number
  freeEpisodes?: number
  unlockMode?: string
  adPushRuleId?: number | string | undefined
  episodePrice?: number
  bundlePrice?: number
  sortWeight?: number
  status?: number
  isRecommended?: number
  storagePath?: string
  createTime?: string
  updateTime?: string
}

export interface DramaCreateInfo {
  name: string
  description?: string
  coverUrl?: string
  totalEpisodes?: number
  freeEpisodes?: number
  unlockMode?: string
  adPushRuleId?: number | string | undefined
  episodePrice?: number
  bundlePrice?: number
  sortWeight?: number
  status?: number
  isRecommended?: number
  clientKey?: string
  storagePath?: string
}

export interface EpisodeCreateInfo {
  episodeNumber: number
  name?: string
  description?: string
  duration?: number
  videoUrl?: string
  vid?: string
  isFree?: number
  status?: number
}

export interface DramaCreateRequest {
  drama: DramaCreateInfo
  episodes: EpisodeCreateInfo[]
  tagIds: (number | string)[]
}

export interface DramaCreateResponse {
  dramaId: string
  episodeCount: number
  tagCount: number
  message: string
}

export interface HomeSlot {
  id: number
  slotType: 'BANNER' | 'HOT' | 'RANK'
  dramaId: string
  dramaName?: string
  coverUrl?: string
  title?: string | null
  sort?: number
  enabled: number
  createTime?: string
}

export interface HomeSlotCandidate {
  dramaId: string
  dramaName: string
  description?: string
  coverUrl?: string
  tags?: string
  totalEpisodes?: number
  sortWeight?: number
  status?: number
  addedInCurrent: boolean
  selectable: boolean
  disabledReason?: string | null
  addedScenes: string[]
  createTime?: string
}

export interface BannerItem extends HomeSlot {
  slotType: 'BANNER'
}

export interface HotDramaItem extends HomeSlot {
  slotType: 'HOT'
}

export interface RankItem extends HomeSlot {
  slotType: 'RANK'
  category?: string
  rank?: number
}

export interface RankCategoryStat {
  category: string
  total_count: number
  enabled_count: number
}

export function unlockModeLabel(mode: string | undefined): string {
  if (mode === 'IAA_ONLY') return '仅广告'
  if (mode === 'IAP_ONLY') return '仅付费'
  if (mode === 'IAA_IAP') return '广告或付费'
  return mode ?? '—'
}

export function unlockModeColor(mode: string | undefined): string {
  if (mode === 'IAA_ONLY') return 'green'
  if (mode === 'IAP_ONLY') return 'orangered'
  if (mode === 'IAA_IAP') return 'blue'
  return ''
}

export function unlockModeDesc(mode: string | undefined, rule?: AdPushRule | null): string {
  if (mode === 'IAA_ONLY') {
    if (rule) return `累积每看<strong>${rule.adCountPerUnlock}</strong>个广告，解锁<strong>${rule.episodesPerUnlock}</strong>集（每日上限${rule.maxAdCountPerDay > 0 ? rule.maxAdCountPerDay : '不限'}个广告）`
    return '看广告累积解锁'
  }
  if (mode === 'IAP_ONLY') return '付费购买'
  if (mode === 'IAA_IAP') {
    if (rule) return `广告累积解锁 或 付费购买（每${rule.adCountPerUnlock}广告解锁${rule.episodesPerUnlock}集）`
    return '广告累积解锁或付费购买'
  }
  return '—'
}

export function unlockRuleDesc(rule: AdPushRule): string {
  return `每${rule.adCountPerUnlock}广告解锁${rule.episodesPerUnlock}集，每日上限${rule.maxAdCountPerDay > 0 ? rule.maxAdCountPerDay : '不限'}广告`
}

export interface UnlockOptionVO {
  type: 'IAA' | 'IAP'
  description: string
  adCountPerUnlock?: number
  episodesPerUnlock?: number
  adWatchedToday?: number
  maxAdCountPerDay?: number
  canUnlock: boolean
  episodePrice?: number
  bundlePrice?: number
}

export interface UnlockStatusVO {
  dramaId: string
  episodeNumber: number
  isUnlocked: boolean
  unlockMode: string
  freeEpisodes: number
  episodePrice?: number
  bundlePrice?: number
  totalEpisodes?: number
  unlockOptions: UnlockOptionVO[]
  unlockedEpisodes?: number[]
  isBundlePurchased?: boolean
}

export interface AdWatchResultVO {
  unlocked: boolean
  totalAdWatchCount: number
  adCountPerUnlock: number
  episodesPerUnlock: number
  freeEpisodes: number
  totalUnlockedEpisodes: number
  unlockedEpisodeRange?: { start: number; end: number }
  unlockedEpisodes?: number[]
  nextUnlockAt: number
  message: string
}
