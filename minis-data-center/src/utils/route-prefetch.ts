/**
 * 路由预加载策略
 *
 * 1. 登录后空闲时预加载高频页面（requestIdleCallback）
 * 2. 菜单 hover 时预加载对应路由
 * 3. 当前路由的相邻路由自动预加载
 */

// 高频页面 — 登录后立即预加载（按优先级排序）
const HIGH_PRIORITY_ROUTES = [
  () => import('@/views/dashboard/index.vue'),
  () => import('@/views/drama/index.vue'),
  () => import('@/views/ad/analytics-dashboard.vue'),
  () => import('@/views/ad/ad-report.vue'),
]

// 中频页面 — 空闲时预加载
const MEDIUM_PRIORITY_ROUTES = [
  () => import('@/views/drama/detail.vue'),
  () => import('@/views/drama/upload.vue'),
  () => import('@/views/user/index.vue'),
  () => import('@/views/ad/push-settings.vue'),
  () => import('@/views/ad/callback-rules.vue'),
]

// 路由路径 → 动态 import 映射（用于 hover 预加载）
const ROUTE_IMPORT_MAP: Record<string, () => Promise<any>> = {
  '/dashboard': () => import('@/views/dashboard/index.vue'),
  '/drama/list': () => import('@/views/drama/index.vue'),
  '/drama/tags': () => import('@/views/drama/tags.vue'),
  '/drama/home-banner': () => import('@/views/drama/home-banner.vue'),
  '/drama/home-hot': () => import('@/views/drama/home-hot.vue'),
  '/drama/home-rank': () => import('@/views/drama/home-rank.vue'),
  '/drama/home-explore': () => import('@/views/drama/home-explore.vue'),
  '/drama/ad-settings': () => import('@/views/drama/ad-settings.vue'),
  '/user/list': () => import('@/views/user/index.vue'),
  '/ad/list': () => import('@/views/ad/index.vue'),
  '/ad/push-settings': () => import('@/views/ad/push-settings.vue'),
  '/ad/callback-rules': () => import('@/views/ad/callback-rules.vue'),
  '/ad/callback-logs': () => import('@/views/ad/callback-logs.vue'),
  '/ad/analytics': () => import('@/views/ad/analytics.vue'),
  '/ad/algorithm-status': () => import('@/views/ad/algorithm-status.vue'),
  '/ad/push-logs': () => import('@/views/ad/push-logs.vue'),
  '/ad/algorithm-config': () => import('@/views/ad/algorithm-config.vue'),
  '/ad/accounts': () => import('@/views/ad/ad-accounts.vue'),
  '/ad/naming-template': () => import('@/views/ad/naming-template.vue'),
  '/ad/campaign-mapping': () => import('@/views/ad/campaign-mapping.vue'),
  '/ad/report': () => import('@/views/ad/ad-report.vue'),
  '/ad/analytics-dashboard': () => import('@/views/ad/analytics-dashboard.vue'),
  '/ad/drama-roi': () => import('@/views/ad/drama-roi.vue'),
  '/ad/creative-fatigue': () => import('@/views/ad/creative-fatigue.vue'),
  '/ad/geo-analysis': () => import('@/views/ad/geo-analysis.vue'),
  '/ad/alerts': () => import('@/views/ad/alerts.vue'),
  '/ad/alert-rules': () => import('@/views/ad/alert-rules.vue'),
  '/system/user': () => import('@/views/account/index.vue'),
  '/system/role': () => import('@/views/account/role.vue'),
  '/system/app': () => import('@/views/app/index.vue'),
  '/system/data-init': () => import('@/views/system/data-init.vue'),
}

// 已预加载的路由（避免重复加载）
const prefetched = new Set<string>()

/**
 * 使用 requestIdleCallback 在空闲时预加载
 */
function idleLoad(importFn: () => Promise<any>, label?: string): void {
  const key = label || importFn.toString().slice(0, 50)
  if (prefetched.has(key)) return
  prefetched.add(key)

  const load = () => {
    importFn().catch(() => {
      // 预加载失败不影响正常使用
      prefetched.delete(key)
    })
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 5000 })
  } else {
    setTimeout(load, 2000)
  }
}

/**
 * 登录成功后调用 — 预加载高频页面
 * 仅在生产/预发布环境执行，开发环境跳过（HMR 已足够快）
 */
export function prefetchAfterLogin(): void {
  if (import.meta.env.DEV) return

  // 高优先级：立即空闲加载
  HIGH_PRIORITY_ROUTES.forEach((fn, i) => {
    setTimeout(() => idleLoad(fn, `high-${i}`), i * 200)
  })

  // 中优先级：延迟 3 秒后空闲加载
  setTimeout(() => {
    MEDIUM_PRIORITY_ROUTES.forEach((fn, i) => {
      setTimeout(() => idleLoad(fn, `medium-${i}`), i * 300)
    })
  }, 3000)
}

/**
 * 菜单项 hover 时调用 — 预加载对应路由
 * 使用 100ms 防抖避免快速划过时触发
 */
let hoverTimer: ReturnType<typeof setTimeout> | null = null

export function prefetchOnHover(routePath: string): void {
  if (import.meta.env.DEV) return
  if (hoverTimer) clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    const importFn = ROUTE_IMPORT_MAP[routePath]
    if (importFn && !prefetched.has(routePath)) {
      prefetched.add(routePath)
      importFn().catch(() => prefetched.delete(routePath))
    }
  }, 100)
}

/**
 * 取消 hover 预加载（鼠标移出时）
 */
export function cancelHoverPrefetch(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}
