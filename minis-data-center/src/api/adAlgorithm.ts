import request from '@/utils/request.ts'
import type {
  AdAnalyticsVo,
  AdAlgorithmStatusVo,
  AdPushLogVo,
  AdAlgorithmConfigVo,
  AdAlgorithmConfigUpdateBo,
  PushLogQuery,
} from '@/types/adAlgorithm.ts'

// ==================== 广告效果分析 ====================

export function fetchAdAnalytics(window: string = '24H') {
  return request.get<AdAnalyticsVo[]>('/system/ad/analytics', { params: { window } })
}

// ==================== 算法运行状态 ====================

export function fetchAlgorithmStatus() {
  return request.get<AdAlgorithmStatusVo>('/system/ad/algorithm/status')
}

// ==================== 推送日志查询 ====================

export function fetchPushLogs(query: PushLogQuery) {
  return request.get<{ rows: AdPushLogVo[]; total: number }>('/system/ad/push-logs', { params: query })
}

// ==================== 算法参数配置 ====================

export function fetchAlgorithmConfig() {
  return request.get<AdAlgorithmConfigVo>('/system/ad/algorithm/config')
}

export function updateAlgorithmConfig(data: AdAlgorithmConfigUpdateBo) {
  return request.put<void>('/system/ad/algorithm/config', data)
}
