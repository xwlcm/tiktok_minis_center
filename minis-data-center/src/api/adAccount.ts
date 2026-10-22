import request from '@/utils/request.ts'

export interface AdAccountRecord {
  id: number
  tenantId?: string
  clientKey?: string
  appId?: string
  accessToken?: string
  authUserId?: string
  authUserName?: string
  status: number
  invalidatedAt?: string | null
  createTime?: string
  updateTime?: string
}

export interface AdAccountAdvertiserRecord {
  id: number
  accountId: number
  advertiserId: string
  advertiserName?: string
  sourceType?: string
  isPrimary: number
  syncEnabled: number
  lastSeenAt?: string | null
  accessStatus?: string | null
  disabledReason?: string | null
  disabledErrorCode?: string | null
  disabledErrorMsg?: string | null
  disabledAt?: string | null
  lastScopeCheckAt?: string | null
  accountStatus?: number | null
  authUserName?: string | null
  accountUpdateTime?: string | null
  lastHealthCheckAt?: string | null
  invalidReason?: string | null
  invalidErrorCode?: string | null
  invalidErrorMsg?: string | null
}

export interface AdvertiserRecord {
  id: number
  tenantId: string
  clientKey: string
  advertiserId: string
  advertiserName?: string | null
  currency?: string | null
  timezone?: string | null
  syncStatus: number
  primaryAccountId?: number | null
  primaryAccountName?: string | null
  sourceCount: number
  lastSyncAt?: string | null
  lastSuccessAt?: string | null
  lastErrorCode?: string | null
  lastErrorMsg?: string | null
  sources: AdAccountAdvertiserRecord[]
}

export function fetchAdAccountList() {
  return request.get<AdAccountRecord[]>('/system/ad-account/list')
}

export function fetchAdAccountAdvertisers(accountId: number) {
  return request.get<AdAccountAdvertiserRecord[]>(`/system/ad-account/${accountId}/advertisers`)
}

export function updateAdAccountStatus(id: number, status: number) {
  return request.put<void>(`/system/ad-account/${id}/status`, { status })
}

export function checkAdAccountHealth(accountId: number) {
  return request.post<void>(`/system/ad-account/${accountId}/check-health`)
}

export function fetchAuthUrl(returnPath?: string) {
  return request.get<{ authUrl: string }>('/system/ad-account/auth-url', { params: { returnPath } })
}

export function bindByOAuth(authCode: string, state: string) {
  return request.post<any>('/system/ad-account/bindByAuthCode', { authCode, state })
}

export function fetchAdvertiserList() {
  return request.get<AdvertiserRecord[]>('/system/ad-account/advertisers')
}

export function updateAdvertiserSyncStatus(advertiserId: number, syncStatus: number) {
  return request.put<void>(`/system/ad-account/advertisers/${advertiserId}/sync-status`, {
    syncStatus,
  })
}

export function updateAdvertiserPrimaryAccount(advertiserId: number, primaryAccountId: number) {
  return request.put<void>(`/system/ad-account/advertisers/${advertiserId}/primary-account`, {
    primaryAccountId,
  })
}

export function updateAdvertiserSourceSyncEnabled(relationId: number, syncEnabled: number) {
  return request.put<void>(`/system/ad-account/advertisers/sources/${relationId}/sync-enabled`, {
    syncEnabled,
  })
}

export function fetchNamingTemplate() {
  return request.get<NamingTemplateConfig>('/system/ad-naming-template')
}

export interface NamingTemplateConfig {
  template: string
  separator: string
  dateFormat: string
}

export function saveNamingTemplate(data: NamingTemplateConfig) {
  return request.put<void>('/system/ad-naming-template', data)
}

export interface NamingTemplateRenderResult {
  renderedName: string
}

export interface NamingTemplateRenderVariables {
  dramaName?: string
  dramaId?: string
  promotionGoal?: string
  creativeGroupName?: string
  startDate?: string
  createDate?: string
  advertiserName?: string
  operatorName?: string
  customTag?: string
}

export function renderNamingTemplate(variables: NamingTemplateRenderVariables) {
  return request.post<NamingTemplateRenderResult>('/system/ad-naming-template/render', variables)
}

export function fetchMappingList() {
  return request.get<any[]>('/system/ad-mapping/list')
}

export function fetchUnmappedCampaigns() {
  return request.get<string[]>('/system/ad-mapping/unmapped')
}

export function bindCampaignManual(data: { campaignId: string; campaignName: string; advertiserId: string; dramaId: number }) {
  return request.post<void>('/system/ad-mapping/bindManual', data)
}

export function unbindCampaign(id: string) {
  return request.delete<void>(`/system/ad-mapping/${id}`)
}

export function autoBindAllCampaigns() {
  return request.post<string>('/system/ad-mapping/auto-bind-all')
}

export interface CampaignMappingImport {
  campaignId: string
  campaignName: string
  dramaId: string  // 使用字符串避免 JavaScript 数字精度丢失和科学计数法
}

export function batchImportMappings(mappings: CampaignMappingImport[]) {
  return request.post<number>('/system/ad-mapping/batch-import', mappings)
}
