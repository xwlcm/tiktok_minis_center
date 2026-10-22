import request from '@/utils/request.ts'

export interface TableListResponse<T> {
  rows: T[]
  total: number
}

export interface TikTokWebhookSubscriptionRecord {
  id: number
  tenantId?: string
  clientKey?: string
  callbackToken?: string
  subscribeEntity: string
  callbackUrl?: string
  externalSubscriptionId?: string | null
  notifyFrequency?: string | null
  status: number
  sourceAccountId?: number | null
  sourceAdvertiserId?: string | null
  subscriptionDetail?: string | null
  lastWebhookAt?: string | null
  lastSyncedAt?: string | null
  lastErrorCode?: string | null
  lastErrorMsg?: string | null
  createTime?: string | null
  updateTime?: string | null
}

export interface TikTokWebhookEventRecord {
  id: number
  tenantId?: string
  clientKey?: string
  subscriptionId?: number | null
  externalSubscriptionId?: string | null
  callbackToken?: string | null
  dedupKey?: string | null
  requestId?: string | null
  objectType?: number | null
  subscribeEntity?: string | null
  eventTime?: number | null
  rawPayload?: string | null
  processingStatus: number
  effectStatus: number
  errorCode?: string | null
  errorMsg?: string | null
  processedAt?: string | null
  createTime?: string | null
  updateTime?: string | null
}

export interface TikTokWebhookSubscriptionPayload {
  subscribeEntity: string
  sourceAccountId: number
  sourceAdvertiserId?: string
  notifyFrequency?: string
  advertiserId?: string
  advertiserIds?: string[]
  libraryId?: string
  pageId?: string
  adId?: string
  adgroupId?: string
  bcId?: string
  leadSource?: string
  productFilters?: string[]
  extraDetail?: Record<string, unknown>
}

export interface TikTokWebhookSubscriptionQuery {
  subscribeEntity?: string
  status?: number
  pageNum?: number
  pageSize?: number
}

export interface TikTokWebhookEventQuery {
  subscriptionId?: number
  processingStatus?: string
  pageNum?: number
  pageSize?: number
}

export function fetchTikTokWebhookSubscriptions(params?: TikTokWebhookSubscriptionQuery) {
  return request.get<TableListResponse<TikTokWebhookSubscriptionRecord>>('/system/tiktok-webhook/subscriptions', {
    params,
  })
}

export function fetchTikTokWebhookEvents(params?: TikTokWebhookEventQuery) {
  return request.get<TableListResponse<TikTokWebhookEventRecord>>('/system/tiktok-webhook/events', {
    params,
  })
}

export function createTikTokWebhookSubscription(data: TikTokWebhookSubscriptionPayload) {
  return request.post<TikTokWebhookSubscriptionRecord>('/system/tiktok-webhook/subscribe', data)
}

export function cancelTikTokWebhookSubscription(id: number) {
  return request.post<void>(`/system/tiktok-webhook/${id}/cancel`)
}
