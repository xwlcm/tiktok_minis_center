import request from '@/utils/request.ts'
import type { User, UserTrendVO } from '@/types/user.ts'
import { useAppStore } from '@/stores/app.ts'

export interface UserPageResult {
  total: number
  rows: User[]
}

export function fetchUserList(params: {
  keyword?: string
  startDate?: string
  endDate?: string
  valueTier?: string
  churnRisk?: string
  orderBy?: string
  pageNum?: number
  pageSize?: number
}) {
  const appStore = useAppStore()
  return request.get<UserPageResult>('/user/list', {
    params: { ...params, clientKey: appStore.currentClientKey },
  })
}

export function fetchAllUsers() {
  const appStore = useAppStore()
  return request.get<User[]>('/user/all', {
    params: { clientKey: appStore.currentClientKey },
  })
}

export function fetchUserDetail(userId: number | string) {
  return request.get<User>(`/user/${userId}`)
}

export function fetchUserProfile(openId: string) {
  const appStore = useAppStore()
  return request.get<User>(`/user/${openId}/profile`, {
    params: { clientKey: appStore.currentClientKey },
  })
}

export function fetchUserTrend(openId: string) {
  const appStore = useAppStore()
  return request.get<UserTrendVO>(`/user/${openId}/trend`, {
    params: { clientKey: appStore.currentClientKey },
  })
}

export function updateUser(data: Partial<User>) {
  return request.put<void>('/user', data)
}

export function deleteUser(userId: number | string) {
  return request.delete<void>(`/user/${userId}`)
}
