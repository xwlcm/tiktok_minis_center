/** 短剧-事件回传配置 */
export interface DramaCallbackConfig {
  id?: number | string
  clientKey?: string
  dramaId?: string
  eventType: string
  enabled: number
  callbackRatio: number
}

/** 广告投放回传日志 */
export interface AdCallbackLog {
  id: number | string
  clientKey?: string
  dramaId?: string
  eventLogId?: number | string
  eventType: string
  openId?: string
  callbackUrl: string
  requestBody?: string
  responseCode?: number
  responseBody?: string
  status: number
  retryCount: number
  nextRetryTime?: string
  errorMessage?: string
  executeTime?: string
  costMs?: number
  createTime?: string
}

/** 回传日志状态映射 */
export const CallbackLogStatusMap: Record<number, string> = {
  0: '待执行',
  1: '成功',
  2: '失败',
  3: '重试中',
  4: '已放弃',
}

export const CallbackLogStatusColorMap: Record<number, string> = {
  0: 'orangered',
  1: 'green',
  2: 'red',
  3: 'orange',
  4: 'gray',
}

/** IAP 标准事件（9 个） */
export const IAP_EVENTS = [
  { key: 'video_play_request', label: '尝试视频播放' },
  { key: 'ep_play', label: '每集播放' },
  { key: 'add_to_wishlist', label: '加入愿望清单' },
  { key: 'start_unlock', label: '开始解锁' },
  { key: 'complete_watching', label: '完成观看' },
  { key: 'unlock_panel_show_request', label: '消费面板吊起请求' },
  { key: 'unlock_panel_show', label: '消费面板成功展示' },
  { key: 'unlock_panel_click', label: '消费面板点击' },
  { key: 'unlock_success', label: '成功解锁' },
]

/** IAA 标准事件（3 个） */
export const IAA_EVENTS = [
  { key: 'video_play_request', label: '尝试视频播放' },
  { key: 'ep_play', label: '每集播放' },
  { key: 'minis_ad_show', label: '广告展示' },
]
