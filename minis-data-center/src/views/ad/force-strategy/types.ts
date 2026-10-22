/**
 * 强弹规则细粒度策略（strategyConfig）类型定义与解析工具。
 *
 * 策略按功能分为四组，全部挂在每条强弹规则上（随规则编辑弹窗一起保存）：
 * A 首页场景 / B 短剧页场景 / C 广告结果处理 / D 计算时间配置。
 * 表单层统一用「秒」，落库与下发统一用「毫秒」。
 *
 * 强弹规则只对广告链接进入的用户（ttclid）生效：
 * - A 组插屏固定 userScope=ttclid_only，不再提供用户范围选项；
 * - 普通用户不受强弹规则影响，走原有正常广告逻辑（代码固定，无需配置）。
 */

export interface HomeForm {
  rewardedEnabled: boolean
  rewardPreloadEnabled: boolean
  /** 广告首次预加载时间（秒）。 */
  rewardPreloadDelaySec: number
  resetOnRouteChange: boolean
  interstitialEnabled: boolean
  /** 首次弹出时间（秒），仅对广告链接进入的用户生效。 */
  firstDelaySec: number
  /** 间隔多久再弹（秒），仅对广告链接进入的用户生效。 */
  periodSec: number
}

export interface DramaForm {
  /** 每隔多久再弹一次（秒），0=看剧期间只弹一次。 */
  dramaForceIntervalSec: number
  /** 短剧页强弹计数重置时间（小时），0=永不重置；与首页重置周期相互隔离。 */
  dramaResetHours: number
  /** 未解锁剧集倒计时时长（秒），倒计时结束自动弹广告（代码固定自动弹）。 */
  unlockCountdownSec: number
}

export interface ResultForm {
  /** 广告没看完就关掉的处理方式：自动继续弹 / 本轮不再弹（固定不提供询问用户）。 */
  interruptAction: 'auto_repull' | 'stop'
  interruptRepullDelaySec: number
  retryEnabled: boolean
  maxRetryCount: number
  afterRetryExhausted: 'wait_next_cycle' | 'stop_all'
}

/**
 * D 计算时间配置：激励广告与插屏广告各自独立一组生命周期处理。
 * 上限次数与首页场景/短剧页的次数上限完全隔离，单独计数；
 * 重置周期复用首页「重置时间（小时）」口径，只借用周期不共用计数。
 */
export interface TimingForm {
  rewardedOnShow: 'continue' | 'restart_delay' | 'immediate'
  rewardedOnHide: 'pause' | 'destroy'
  rewardedStuckResetSec: number
  /** 激励广告上限次数：0=不限次数；达到后停止激励强弹（独立于首页次数上限）。 */
  rewardedMaxForceCount: number
  /** 激励广告全局触发计时器（秒）：每 N 秒强制触发一次弹出；0=关闭。 */
  rewardedGlobalTriggerSec: number
  interstitialOnShow: 'continue' | 'restart_delay' | 'immediate'
  interstitialOnHide: 'pause' | 'destroy'
  interstitialStuckResetSec: number
  /** 插屏广告上限次数：0=不限次数；达到后停止插屏强弹（独立于首页次数上限）。 */
  interstitialMaxForceCount: number
  /** 插屏广告全局触发计时器（秒）：每 N 秒强制触发一次弹出；0=关闭。 */
  interstitialGlobalTriggerSec: number
}

/** 默认值与现网行为完全一致：规则未配置策略时，C 端表现不变。 */
export const DEFAULT_HOME: HomeForm = {
  rewardedEnabled: true,
  rewardPreloadEnabled: true,
  rewardPreloadDelaySec: 15,
  resetOnRouteChange: false,
  interstitialEnabled: true,
  firstDelaySec: 5,
  periodSec: 60,
}

export const DEFAULT_DRAMA: DramaForm = {
  dramaForceIntervalSec: 0,
  dramaResetHours: 0,
  unlockCountdownSec: 0,
}

export const DEFAULT_RESULT: ResultForm = {
  interruptAction: 'auto_repull',
  interruptRepullDelaySec: 0,
  retryEnabled: true,
  maxRetryCount: 5,
  afterRetryExhausted: 'wait_next_cycle',
}

// 重试等待（SDK报错/弹出失败/程序异常）已从配置项移除，C 端按内置默认值（500/5000/1000ms）执行。
export const DEFAULT_TIMING: TimingForm = {
  rewardedOnShow: 'continue',
  rewardedOnHide: 'pause',
  rewardedStuckResetSec: 300,
  rewardedMaxForceCount: 0,
  rewardedGlobalTriggerSec: 0,
  interstitialOnShow: 'continue',
  interstitialOnHide: 'pause',
  interstitialStuckResetSec: 300,
  interstitialMaxForceCount: 0,
  interstitialGlobalTriggerSec: 0,
}

/** 解析规则下发的 strategyConfig JSON 到四组表单；缺失/损坏字段回落默认值。 */
export function parseStrategyForms(json?: string | null) {
  const home = { ...DEFAULT_HOME }
  const drama = { ...DEFAULT_DRAMA }
  const result = { ...DEFAULT_RESULT }
  const timing = { ...DEFAULT_TIMING }
  if (!json) return { home, drama, result, timing }
  try {
    const cfg = JSON.parse(json) as Record<string, any>
    const a = cfg.A_home ?? {}
    const aRewarded = a.rewarded ?? {}
    const aInterstitial = a.interstitial ?? {}
    if (typeof aRewarded.enabled === 'boolean') home.rewardedEnabled = aRewarded.enabled
    if (typeof aRewarded.preloadEnabled === 'boolean') home.rewardPreloadEnabled = aRewarded.preloadEnabled
    if (typeof aRewarded.preloadDelayMs === 'number') home.rewardPreloadDelaySec = Math.round(aRewarded.preloadDelayMs / 1000)
    if (typeof aRewarded.countPolicy?.resetOnRouteChange === 'boolean') home.resetOnRouteChange = aRewarded.countPolicy.resetOnRouteChange
    if (typeof aInterstitial.enabled === 'boolean') home.interstitialEnabled = aInterstitial.enabled
    if (typeof aInterstitial.normalFirstDelayMs === 'number') home.firstDelaySec = Math.round(aInterstitial.normalFirstDelayMs / 1000)
    if (typeof aInterstitial.normalPeriodMs === 'number') home.periodSec = Math.round(aInterstitial.normalPeriodMs / 1000)

    const b = cfg.B_drama ?? {}
    const bRewarded = b.rewarded ?? {}
    const bUnlock = b.unlockCountdown ?? {}
    if (typeof bRewarded.intervalMs === 'number') drama.dramaForceIntervalSec = Math.round(bRewarded.intervalMs / 1000)
    if (typeof bRewarded.resetHoursMs === 'number') drama.dramaResetHours = Math.round(bRewarded.resetHoursMs / 3600000)
    if (typeof bUnlock.countdownMs === 'number') drama.unlockCountdownSec = Math.round(bUnlock.countdownMs / 1000)

    const c = cfg.C_result ?? {}
    const cInterrupt = c.onInterrupt ?? {}
    const cFail = c.onFail ?? {}
    if (cInterrupt.action === 'auto_repull' || cInterrupt.action === 'stop') result.interruptAction = cInterrupt.action
    if (typeof cInterrupt.repullDelayMs === 'number') result.interruptRepullDelaySec = Math.round(cInterrupt.repullDelayMs / 1000)
    // 历史规则里的三类重试等待字段（onErrorDelayMs/showFailDelayMs/exceptionDelayMs）不再回显，
    // 配置项已下线，C 端统一按内置默认值执行。
    if (typeof cFail.retryEnabled === 'boolean') result.retryEnabled = cFail.retryEnabled
    if (typeof cFail.maxRetry === 'number') result.maxRetryCount = cFail.maxRetry
    if (cFail.afterExhausted === 'wait_next_cycle' || cFail.afterExhausted === 'stop_all') result.afterRetryExhausted = cFail.afterExhausted

    const d = cfg.D_lifecycle ?? {}
    const dRewarded = d.rewarded ?? {}
    const dInterstitial = d.interstitial ?? {}
    // 旧结构（平铺字段）兼容：双组缺失时回落到平铺值，保证历史规则可编辑。
    const flatOnShow = d.onShowAction
    const flatOnHide = d.onHideAction
    const flatStuck = typeof d.stuckResetMs === 'number' ? Math.round(d.stuckResetMs / 1000) : undefined
    if (dRewarded.onShowAction === 'continue' || dRewarded.onShowAction === 'restart_delay' || dRewarded.onShowAction === 'immediate') {
      timing.rewardedOnShow = dRewarded.onShowAction
    } else if (flatOnShow === 'continue' || flatOnShow === 'restart_delay' || flatOnShow === 'immediate') {
      timing.rewardedOnShow = flatOnShow
    }
    if (dRewarded.onHideAction === 'pause' || dRewarded.onHideAction === 'destroy') timing.rewardedOnHide = dRewarded.onHideAction
    else if (flatOnHide === 'pause' || flatOnHide === 'destroy') timing.rewardedOnHide = flatOnHide
    if (typeof dRewarded.stuckResetMs === 'number') timing.rewardedStuckResetSec = Math.round(dRewarded.stuckResetMs / 1000)
    else if (flatStuck != null) timing.rewardedStuckResetSec = flatStuck
    if (typeof dRewarded.maxForceCount === 'number' && dRewarded.maxForceCount >= 0) timing.rewardedMaxForceCount = dRewarded.maxForceCount
    if (typeof dRewarded.globalTriggerMs === 'number' && dRewarded.globalTriggerMs >= 0) {
      timing.rewardedGlobalTriggerSec = Math.round(dRewarded.globalTriggerMs / 1000)
    }
    if (dInterstitial.onShowAction === 'continue' || dInterstitial.onShowAction === 'restart_delay' || dInterstitial.onShowAction === 'immediate') {
      timing.interstitialOnShow = dInterstitial.onShowAction
    } else if (flatOnShow === 'continue' || flatOnShow === 'restart_delay' || flatOnShow === 'immediate') {
      timing.interstitialOnShow = flatOnShow
    }
    if (dInterstitial.onHideAction === 'pause' || dInterstitial.onHideAction === 'destroy') timing.interstitialOnHide = dInterstitial.onHideAction
    else if (flatOnHide === 'pause' || flatOnHide === 'destroy') timing.interstitialOnHide = flatOnHide
    if (typeof dInterstitial.stuckResetMs === 'number') timing.interstitialStuckResetSec = Math.round(dInterstitial.stuckResetMs / 1000)
    else if (flatStuck != null) timing.interstitialStuckResetSec = flatStuck
    if (typeof dInterstitial.maxForceCount === 'number' && dInterstitial.maxForceCount >= 0) {
      timing.interstitialMaxForceCount = dInterstitial.maxForceCount
    }
    if (typeof dInterstitial.globalTriggerMs === 'number' && dInterstitial.globalTriggerMs >= 0) {
      timing.interstitialGlobalTriggerSec = Math.round(dInterstitial.globalTriggerMs / 1000)
    }
  } catch {
    // 配置损坏时整体回落默认值，避免表单半填充造成误编辑。
  }
  return { home, drama, result, timing }
}

/** 将四组表单序列化为 strategyConfig JSON（结构与 C 端 parseStrategyConfig 对齐）。 */
export function buildStrategyJson(home: HomeForm, drama: DramaForm, result: ResultForm, timing: TimingForm): string {
  return JSON.stringify({
    A_home: {
      rewarded: {
        enabled: home.rewardedEnabled,
        preloadEnabled: home.rewardPreloadEnabled,
        preloadDelayMs: home.rewardPreloadDelaySec * 1000,
        countPolicy: { resetOnRouteChange: home.resetOnRouteChange },
      },
      interstitial: {
        enabled: home.interstitialEnabled,
        // 强弹规则只对广告链接进入的用户生效，用户范围固定为 ttclid_only。
        userScope: 'ttclid_only',
        normalFirstDelayMs: home.firstDelaySec * 1000,
        normalPeriodMs: home.periodSec * 1000,
      },
    },
    B_drama: {
      rewarded: {
        intervalMs: drama.dramaForceIntervalSec * 1000,
        resetHoursMs: drama.dramaResetHours * 3600000,
        // 短剧页广告看完固定刷新当前页面、中途关掉固定继续弹（代码实现，不再可配置）。
        onComplete: 'reload',
        onClose: 'auto_repull',
      },
      unlockCountdown: {
        // 倒计时结束固定自动弹广告，无需用户手动点解锁（代码实现）。
        enabled: true,
        countdownMs: drama.unlockCountdownSec * 1000,
      },
    },
    C_result: {
      onComplete: {
        // 引导连看配置已下线：保留下发默认值，C 端 Secret Rewards 诱导弹窗逻辑不变。
        guideEnabled: true,
        maxConsecutive: 2,
        guideOnHome: false,
      },
      onInterrupt: {
        action: result.interruptAction,
        repullDelayMs: result.interruptRepullDelaySec * 1000,
      },
      onFail: {
        // 三类重试等待已从配置项下线：不再下发，C 端按内置默认值（500/5000/1000ms）执行。
        retryEnabled: result.retryEnabled,
        maxRetry: result.maxRetryCount,
        afterExhausted: result.afterRetryExhausted,
      },
    },
    D_lifecycle: {
      rewarded: {
        onShowAction: timing.rewardedOnShow,
        onHideAction: timing.rewardedOnHide,
        stuckResetMs: timing.rewardedStuckResetSec * 1000,
        // 上限次数与首页/短剧页计数隔离；全局触发计时器 0=关闭。
        maxForceCount: timing.rewardedMaxForceCount,
        globalTriggerMs: timing.rewardedGlobalTriggerSec * 1000,
      },
      interstitial: {
        onShowAction: timing.interstitialOnShow,
        onHideAction: timing.interstitialOnHide,
        stuckResetMs: timing.interstitialStuckResetSec * 1000,
        // 上限次数与首页/短剧页计数隔离；全局触发计时器 0=关闭。
        maxForceCount: timing.interstitialMaxForceCount,
        globalTriggerMs: timing.interstitialGlobalTriggerSec * 1000,
      },
    },
  })
}
