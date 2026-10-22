export interface App {
  id: number
  tenantId: string
  appName: string
  appType: string
  clientKey: string
  appDescription: string
  dailyEventQuota: number
  featureFlags: string
  status: string
  sortOrder: number
  remark: string
  createTime: string
  updateTime: string
}

export interface CurrentApplication {
  clientKey: string
}

export interface AppListQuery {
  appName?: string
  clientKey?: string
  appType?: string
  status?: string
  pageNum?: number
  pageSize?: number
}

export interface AppCreatePayload {
  appName: string
  clientKey: string
  clientSecret: string
  appType?: string
  appDescription?: string
  dailyEventQuota?: number
  featureFlags?: string
  sortOrder?: number
  status?: string
  remark?: string
}

export interface AppUpdatePayload extends Partial<AppCreatePayload> {
  id: number
  clientKey: string
}
