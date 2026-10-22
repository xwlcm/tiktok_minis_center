import { onMounted, onUnmounted } from 'vue'
import { Notification } from '@arco-design/web-vue'

const STORAGE_KEY = '__APP_VERSION__'
/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 60_000
/** 用户关闭通知后，再次弹出的间隔（毫秒） */
const RE_NOTIFY_INTERVAL = 5 * 60_000

let pollTimer: ReturnType<typeof setInterval> | null = null
let reNotifyTimer: ReturnType<typeof setTimeout> | null = null
let activeNotification: ReturnType<typeof Notification.info> | null = null

/**
 * 全局版本检测 composable
 *
 * 工作原理：
 * 1. 构建时 Vite 将 BUILD_TIME 写入 HTML <meta name="app-version"> 和 dist/version.json
 * 2. 页面加载时从 meta 读取版本号存入 localStorage
 * 3. 定时轮询 /version.json（带 cache-busting），比对版本号
 * 4. 发现不一致时弹出通知，引导用户刷新页面获取最新版本
 *
 * 仅在 App.vue 的 setup 中调用一次即可。
 */
export function useVersionCheck() {
  /** 从 HTML meta 标签读取构建时写入的版本号 */
  function getMetaVersion(): string {
    const meta = document.querySelector('meta[name="app-version"]')
    return meta?.getAttribute('content') ?? ''
  }

  /** 弹出更新通知 */
  function showUpdateNotification() {
    // 避免重复弹窗
    if (activeNotification) return

    // Arco Notification 运行时支持 btn 属性，但 TS 类型定义未包含
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notifyConfig: any = {
      title: '发现新版本',
      content: '网站已更新，请刷新页面获取最新版本。',
      duration: 0, // 不自动关闭，等待用户操作
      closable: true,
      btn: {
        text: '立即刷新',
        type: 'primary',
        onClick: () => {
          window.location.reload()
        },
      },
      onClose: () => {
        activeNotification = null
        // 用户关闭后，过一段时间再次提醒
        scheduleReNotify()
      },
    }
    activeNotification = Notification.info(notifyConfig)
  }

  /** 用户关闭通知后，定时再次提醒 */
  function scheduleReNotify() {
    if (reNotifyTimer) clearTimeout(reNotifyTimer)
    reNotifyTimer = setTimeout(() => {
      showUpdateNotification()
    }, RE_NOTIFY_INTERVAL)
  }

  /** 检查版本 */
  async function checkVersion(): Promise<void> {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (!res.ok) return

      const data = await res.json()
      const remoteVersion: string = data.version || data.buildTime || ''
      if (!remoteVersion) return

      const localVersion = localStorage.getItem(STORAGE_KEY)
      if (localVersion && remoteVersion !== localVersion) {
        showUpdateNotification()
      }
    } catch {
      // 静默失败 — 开发环境可能不存在 version.json
    }
  }

  /** 启动轮询 */
  function startPolling() {
    stopPolling()
    pollTimer = setInterval(checkVersion, POLL_INTERVAL)
  }

  /** 停止轮询 */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (reNotifyTimer) {
      clearTimeout(reNotifyTimer)
      reNotifyTimer = null
    }
  }

  onMounted(() => {
    // 首次加载：从 HTML meta 读取构建时版本并持久化
    const version = getMetaVersion()
    if (version) {
      localStorage.setItem(STORAGE_KEY, version)
    }
    // 启动定时轮询
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })
}
