import request from '@/utils/request.ts'
import type { DashboardData } from '@/types/dashboard.ts'

export function fetchDashboard(params?: {
  startDate?: string
  endDate?: string
}) {
  return request.get<DashboardData>('/dashboard/overview', { params })
}

export function fetchDashboardDau(params?: {
  statDate?: string
}) {
  return request.get<number>('/dashboard/dau', { params })
}

export function fetchDashboardMau() {
  return request.get<number>('/dashboard/mau')
}

export function fetchDashboardNewUsers(params?: {
  statDate?: string
}) {
  return request.get<number>('/dashboard/new-users', { params })
}

export function fetchDashboardCompletionRate(params?: {
  startDate?: string
  endDate?: string
}) {
  return request.get<number>('/dashboard/completion-rate', { params })
}

export function fetchDashboardIapRevenue(params?: {
  startDate?: string
  endDate?: string
}) {
  return request.get<number>('/dashboard/iap-revenue', { params })
}
