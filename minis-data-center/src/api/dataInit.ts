import request from '@/utils/request.ts'

export interface AsyncTaskResult {
  taskId: string
  status: 'accepted'
  message: string
  taskName?: string
  startDate?: string
  endDate?: string
  submittedAt: string
}

export type AggregateResult = AsyncTaskResult
export type EventLogAggregateResult = AsyncTaskResult
export type AdReportSyncResult = AsyncTaskResult

export function aggregateUserDaily(startDate: string, endDate: string) {
  return request.post<AsyncTaskResult>('/system/data-init/aggregate-user-daily', null, {
    params: { startDate, endDate },
  })
}

export function aggregateEventLog(startDate: string, endDate: string) {
  return request.post<AsyncTaskResult>('/system/data-init/aggregate-event-log', null, {
    params: { startDate, endDate },
  })
}

export function aggregateAppDaily(startDate: string, endDate: string) {
  return request.post<AsyncTaskResult>('/system/data-init/aggregate-app-daily', null, {
    params: { startDate, endDate },
  })
}

export function fullInit() {
  return request.post<AsyncTaskResult>('/system/data-init/full-init')
}

export function syncAdReport() {
  return request.post<AdReportSyncResult>('/system/data-init/sync-ad-report')
}

/**
 * 自定义日期范围广告报表同步（回填）
 * @param startDate 开始日期 yyyy-MM-dd
 * @param endDate 结束日期 yyyy-MM-dd
 */
export function backfillAdReport(startDate: string, endDate: string) {
  return request.post<AsyncTaskResult>('/system/data-init/backfill-ad-report', null, {
    params: { startDate, endDate },
  })
}
