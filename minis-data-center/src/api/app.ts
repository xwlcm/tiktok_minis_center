import request from '@/utils/request.ts'
import type { App, AppCreatePayload, AppListQuery, AppUpdatePayload, CurrentApplication } from '@/types/app.ts'

export function fetchAppList(params?: AppListQuery) {
  return request.get<{ total: number; rows: App[] }>('/system/application/list', { params })
}

export function fetchAppListAll(params?: AppListQuery) {
  return request.get<App[]>('/system/application/listAll', { params })
}

export function switchApplication(clientKey: string) {
  return request.post<void>('/system/application/switch', null, {
    params: { clientKey },
  })
}

export function getCurrentClientKey() {
  return request.get<CurrentApplication>('/system/application/current')
}

export function addApp(data: AppCreatePayload) {
  return request.post<void>('/system/application', data)
}

export function updateApp(data: AppUpdatePayload) {
  return request.put<void>('/system/application', data)
}

export function updateAppStatus(clientKey: string, status: string) {
  return request.put<void>('/system/application/changeStatus', { clientKey, status })
}

export function deleteApp(ids: number[]) {
  return request.delete<void>(`/system/application/${ids.join(',')}`)
}

export function getAppById(id: number) {
  return request.get<App>(`/system/application/${id}`)
}

export function getAppByClientKey(clientKey: string) {
  return request.get<App>(`/system/application/byClientKey/${clientKey}`)
}
