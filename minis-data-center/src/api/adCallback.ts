import request from '@/utils/request.ts'
import type { DramaCallbackConfig, AdCallbackLog } from '@/types/adCallback.ts'

/** 查询某部剧的回传配置 */
export function fetchDramaCallbackConfig(dramaId: string) {
  return request.get<DramaCallbackConfig[]>(`/drama/callback/config/${dramaId}`)
}

/** 查询已配置回传规则的短剧ID列表 */
export function fetchConfiguredDramaIds(clientKey: string) {
  return request.get<string[]>('/drama/callback/configured-dramas', { params: { clientKey } })
}

/** 批量保存某部剧的回传配置 */
export function saveDramaCallbackConfig(dramaId: string, clientKey: string, configs: DramaCallbackConfig[]) {
  return request.post<void>(`/drama/callback/config/${dramaId}`, configs, {
    params: { clientKey },
  })
}

/** 分页查询回传日志 */
export function fetchCallbackLogList(params?: {
  clientKey?: string
  eventType?: string
  status?: number
  pageNum?: number
  pageSize?: number
}) {
  return request.get<{ total: number; rows: AdCallbackLog[] }>('/drama/callback/log/list', { params })
}

/** 手动触发重试补偿 */
export function triggerManualRetry() {
  return request.post<void>('/drama/callback/retry')
}
