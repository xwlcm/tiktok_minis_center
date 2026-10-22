import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import { useAccountStore } from '@/stores/account.ts'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    skipCancel?: boolean
  }
}

const AXIOS_TIMEOUT = 30_000
const UNAUTHORIZED_COOLDOWN = 3_000

const axiosInstance = axios.create({
  timeout: AXIOS_TIMEOUT,
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

// ── 请求取消管理 ──────────────────────────────────────────
const pendingControllers = new Set<AbortController>()

export function cancelAllPendingRequests(): void {
  pendingControllers.forEach((controller) => controller.abort())
  pendingControllers.clear()
}

function cleanupBySignal(signal: unknown): void {
  if (!signal) return
  for (const controller of pendingControllers) {
    if (controller.signal === signal) {
      pendingControllers.delete(controller)
      return
    }
  }
}

let isRedirectingToLogin = false
let lastUnauthorizedTime = 0
let isLoginInitializing = false

export function setLoginInitializing(value: boolean) {
  isLoginInitializing = value
}

function handleUnauthorized() {
  if (isRedirectingToLogin) return
  if (isLoginInitializing) return
  const now = Date.now()
  if (now - lastUnauthorizedTime < UNAUTHORIZED_COOLDOWN) return
  lastUnauthorizedTime = now
  isRedirectingToLogin = true

  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('client_id')
  const accountStore = useAccountStore()
  const appStore = useAppStore()
  accountStore.clear()
  appStore.clear()
  const redirect =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/dashboard'
  // 使用 window.location.replace 而非 router.push，
  // 确保完全重置 Vue 应用状态，避免残留的异步操作继续触发 401
  Message.error('登录已过期，请重新登录')
  window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const clientId = localStorage.getItem('client_id')
    if (clientId) {
      config.headers.clientid = clientId
    }

    // 自动注入 AbortController，路由切换时可统一取消
    const skipCancel = (config as any).skipCancel === true
    if (!skipCancel && !config.signal) {
      const controller = new AbortController()
      config.signal = controller.signal
      pendingControllers.add(controller)
    }

    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => {
    cleanupBySignal(response.config.signal)

    // 二进制响应（图片等）直接返回 Blob，不参与业务码解包
    if (response.config.responseType === 'blob') {
      return response.data
    }

    const resData = response.data
    const { code, msg, message } = resData
    const errMsg = msg || message
    if (code === 0 || code === 200) {
      if (resData.rows !== undefined && resData.total !== undefined) {
        return { rows: resData.rows, total: resData.total }
      }
      if (resData.data !== undefined) {
        return resData.data
      }
      return resData
    }
    if (code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error(errMsg || '认证失败'))
    }
    const url = response.config.url ?? ''
    const isAuthApi = url.startsWith('/auth/')
    if (!isAuthApi) {
      Message.error(errMsg || '请求失败')
    }
    return Promise.reject(new Error(errMsg))
  },
  (error: any) => {
    const axiosError = error as AxiosError<{ message?: string }>
    // 被取消的请求静默处理，不弹错误提示
    if (axios.isCancel(error)) {
      cleanupBySignal(axiosError.config?.signal)
      return Promise.reject(error)
    }
    cleanupBySignal(axiosError.config?.signal)

    if (axiosError.response) {
      const status = axiosError.response.status
      const url = axiosError.config?.url ?? ''
      const isAuthApi = url.startsWith('/auth/')
      if (status === 401 && !isAuthApi) {
        handleUnauthorized()
      } else if (status === 403) {
        Message.error('无权限访问')
      } else if (status >= 500) {
        Message.error('服务器错误，请稍后重试')
      } else if (!isAuthApi) {
        Message.error(axiosError.response.data?.message ?? '请求失败')
      }
    } else if (axiosError.request) {
      Message.error('网络错误，请检查网络连接')
    } else {
      Message.error(axiosError.message)
    }
    return Promise.reject(error)
  },
)

function request<T>(config: AxiosRequestConfig): Promise<T> {
  return axiosInstance(config) as Promise<T>
}

function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'get', url })
}

function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'post', url, data })
}

function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'put', url, data })
}

function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'delete', url })
}

export default { request, get, post, put, delete: del }
