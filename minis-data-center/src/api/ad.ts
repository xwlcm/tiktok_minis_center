import request from '@/utils/request.ts'
import type { AdInventory, AdPushRule, ForceAdRule } from '@/types/drama.ts'

// ==================== 广告库存 API ====================

export function fetchAdInventoryList() {
  return request.get<AdInventory[]>('/drama/ad/inventory/list')
}

export function createAdInventory(data: Partial<AdInventory>) {
  return request.post<void>('/drama/ad/inventory', data)
}

export function updateAdInventory(id: string, data: Partial<AdInventory>) {
  return request.put<void>('/drama/ad/inventory', { ...data, id })
}

export function deleteAdInventory(id: string) {
  return request.delete<void>(`/drama/ad/inventory/${id}`)
}

export function enableAdInventory(id: string) {
  return request.put<void>(`/drama/ad/inventory/${id}/enable`)
}

export function disableAdInventory(id: string) {
  return request.put<void>(`/drama/ad/inventory/${id}/disable`)
}

// ==================== 广告推送规则 API ====================

export function fetchAdPushRuleList() {
  return request.get<AdPushRule[]>('/drama/ad/push-rule/list')
}

export function createAdPushRule(data: Partial<AdPushRule>) {
  return request.post<void>('/drama/ad/push-rule', data)
}

export function updateAdPushRule(id: string, data: Partial<AdPushRule>) {
  return request.put<void>('/drama/ad/push-rule', { ...data, id })
}

export function deleteAdPushRule(id: string) {
  return request.delete<void>(`/drama/ad/push-rule/${id}`)
}

export function enableAdPushRule(id: string) {
  return request.put<void>(`/drama/ad/push-rule/${id}/enable`)
}

export function disableAdPushRule(id: string) {
  return request.put<void>(`/drama/ad/push-rule/${id}/disable`)
}

// ==================== 强弹广告规则 API ====================

export function fetchForceAdRuleList() {
  return request.get<ForceAdRule[]>('/drama/ad/force-rule/list')
}

export function createForceAdRule(data: Partial<ForceAdRule>) {
  return request.post<string>('/drama/ad/force-rule', data)
}

export function updateForceAdRule(id: string, data: Partial<ForceAdRule>) {
  return request.put<void>('/drama/ad/force-rule', { ...data, id })
}

export function deleteForceAdRule(id: string) {
  return request.delete<void>(`/drama/ad/force-rule/${id}`)
}

export function enableForceAdRule(id: string) {
  return request.put<void>(`/drama/ad/force-rule/${id}/enable`)
}

export function disableForceAdRule(id: string) {
  return request.put<void>(`/drama/ad/force-rule/${id}/disable`)
}

export function bindForceAdRuleApps(id: string, clientKeys: string[]) {
  return request.put<void>(`/drama/ad/force-rule/${id}/bind-apps`, clientKeys)
}

// ==================== 强弹广告白名单 API ====================

/** 白名单列表行（与后端 ForceAdWhitelistVo 对齐） */
export interface ForceAdWhitelistItem {
  id: string
  openId: string
  reason?: string
  status: number
  createTime?: string
}

/** 白名单分页结果（与后端 TableDataInfo 对齐） */
export interface ForceAdWhitelistPage {
  total: number
  rows: ForceAdWhitelistItem[]
}

/** 白名单表单数据（与后端 ForceAdWhitelistDto 对齐） */
export interface ForceAdWhitelistForm {
  id?: string
  openId: string
  reason?: string
  status?: number
}

export function fetchForceWhitelistPage(params: {
  openId?: string
  status?: number
  pageNum?: number
  pageSize?: number
}) {
  return request.get<ForceAdWhitelistPage>('/drama/ad/force-whitelist/list', { params })
}

export function createForceWhitelist(data: ForceAdWhitelistForm) {
  return request.post<void>('/drama/ad/force-whitelist', data)
}

export function updateForceWhitelist(data: ForceAdWhitelistForm) {
  return request.put<void>('/drama/ad/force-whitelist', data)
}

export function deleteForceWhitelist(id: string) {
  return request.delete<void>(`/drama/ad/force-whitelist/${id}`)
}

/** 用户列表开关：按 openId 加入/移出强弹白名单（幂等） */
export function toggleForceWhitelist(openId: string, enabled: boolean) {
  return request.put<void>('/drama/ad/force-whitelist/toggle', null, {
    params: { openId, enabled },
  })
}
