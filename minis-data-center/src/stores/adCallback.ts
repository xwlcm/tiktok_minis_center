import { defineStore } from 'pinia'
import { fetchCallbackLogList } from '@/api/adCallback.ts'
import type { AdCallbackLog } from '@/types/adCallback.ts'

export const useAdCallbackStore = defineStore('adCallback', {
  state: () => ({
    logList: [] as AdCallbackLog[],
    logTotal: 0,
    logCurrentPage: 1,
    logPageSize: 20,
  }),
  actions: {
    async fetchLogList(params?: { eventType?: string; status?: number }) {
      const res = await fetchCallbackLogList({
        ...params,
        pageNum: this.logCurrentPage,
        pageSize: this.logPageSize,
      })
      if (res && typeof res === 'object' && 'rows' in res) {
        const data = res as { rows: AdCallbackLog[]; total: number }
        this.logList = data.rows || []
        this.logTotal = data.total || 0
      } else {
        this.logList = []
        this.logTotal = 0
      }
    },
  },
})
