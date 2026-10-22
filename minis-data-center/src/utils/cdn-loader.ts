/**
 * CDN 智能加载器 — CDN 优先 + 本地兜底
 *
 * 工作原理：
 * 1. 先尝试从 CDN 加载（带超时检测）
 * 2. CDN 失败或超时 → 自动降级到本地打包文件
 * 3. 缓存加载结果，避免重复请求
 *
 * 使用方式：
 *   const VePlayer = await loadVePlayer()
 */

interface CDNConfig {
  /** CDN URL */
  cdn: string
  /** CDN 加载后挂载到 window 上的全局变量名 */
  globalVar: string
  /** CDN CSS URL（可选） */
  cdnCss?: string
  /** 超时时间(ms)，默认 5000 */
  timeout?: number
  /** 本地 fallback 的动态 import 函数 */
  localImport: () => Promise<any>
  /** 本地 CSS import 函数（可选） */
  localCssImport?: () => Promise<any>
}

const cache = new Map<string, any>()

/**
 * 通过 script 标签加载 CDN 资源
 */
function loadScript(url: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.crossOrigin = 'anonymous'

    const timer = setTimeout(() => {
      script.remove()
      reject(new Error(`CDN timeout: ${url}`))
    }, timeout)

    script.onload = () => {
      clearTimeout(timer)
      resolve()
    }

    script.onerror = () => {
      clearTimeout(timer)
      script.remove()
      reject(new Error(`CDN load failed: ${url}`))
    }

    document.head.appendChild(script)
  })
}

/**
 * 加载 CDN CSS
 */
function loadCss(url: string): void {
  if (document.querySelector(`link[href="${url}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

/**
 * 智能加载：CDN 优先 + 本地兜底
 */
async function smartLoad(config: CDNConfig): Promise<any> {
  const { cdn, globalVar, cdnCss, timeout = 5000, localImport, localCssImport } = config

  // 命中缓存直接返回
  if (cache.has(globalVar)) {
    return cache.get(globalVar)
  }

  try {
    // 尝试 CDN 加载
    await loadScript(cdn, timeout)
    const module = (window as any)[globalVar]
    if (!module) throw new Error(`Global var "${globalVar}" not found after CDN load`)

    // CDN CSS
    if (cdnCss) loadCss(cdnCss)

    cache.set(globalVar, module)
    return module
  } catch (e) {
    // CDN 失败，降级到本地
    if (import.meta.env.DEV) {
      console.warn(`[CDN Loader] CDN 加载失败，降级本地:`, (e as Error).message)
    }

    // 加载本地 CSS
    if (localCssImport) {
      await localCssImport()
    }

    // 加载本地 JS
    const localModule = await localImport()
    const result = localModule.default || localModule
    cache.set(globalVar, result)
    return result
  }
}

// ─── 预定义的库加载器 ───────────────────────────────────────

/**
 * 加载 VePlayer — CDN 优先，本地兜底
 * CDN: unpkg (版本锁定 1.17.0)
 */
export async function loadVePlayer(): Promise<any> {
  return smartLoad({
    cdn: 'https://lf-cdn-tos.bytegoofy.com/obj/goofy/byteplus/sdk/veplayer/1.17.0/veplayer.min.js',
    globalVar: 'VePlayer',
    cdnCss: 'https://lf-cdn-tos.bytegoofy.com/obj/goofy/byteplus/sdk/veplayer/1.17.0/index.min.css',
    timeout: 5000,
    localImport: () => import('@byteplus/veplayer'),
    localCssImport: () => import('@byteplus/veplayer/index.min.css'),
  })
}

/**
 * 探测 CDN 网络是否可达（用于预判断）
 * 可在应用启动时调用，提前确定加载策略
 */
export async function probeCDN(timeout = 3000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    await fetch('https://lf-cdn-tos.bytegoofy.com/obj/goofy/byteplus/sdk/veplayer/1.17.0/veplayer.min.js', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    })
    clearTimeout(timer)
    return true
  } catch {
    return false
  }
}
