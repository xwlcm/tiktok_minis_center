import request from '@/utils/request.ts'
import { useAppStore } from '@/stores/app.ts'

export interface EventRequest {
  eventName: string
  params?: Record<string, any>
  sessionId?: string
  timestamp?: number
}

export function reportEvent(data: EventRequest) {
  const appStore = useAppStore()
  return request.post<void>('/event/report', data, {
    headers: { 'X-Client-Key': appStore.currentClientKey || '' },
  })
}

export function batchReportEvents(events: EventRequest[]) {
  const appStore = useAppStore()
  return request.post<void>('/event/batch-report', events, {
    headers: { 'X-Client-Key': appStore.currentClientKey || '' },
  })
}

export function fetchEventDau(params: { clientKey: string; statDate: string }) {
  return request.get<number>('/event/dau', { params })
}

export function fetchEventCount(params: { clientKey: string; statDate: string }) {
  return request.get<number>('/event/count', { params })
}
