import { defineStore } from 'pinia'
import { fetchUserList } from '@/api/user.ts'
import type { User } from '@/types/user.ts'

export const useUserStore = defineStore('user', {
  state: () => ({
    list: [] as User[],
    total: 0,
    currentPage: 1,
    pageSize: 20,
    filters: {
      keyword: '',
      registeredAtRange: undefined as (string | number | Date)[] | undefined,
    },
  }),
  actions: {
    async fetchList(params?: {
      keyword?: string
      startDate?: string
      endDate?: string
      valueTier?: string
      churnRisk?: string
      orderBy?: string
    }) {
      const res = await fetchUserList({
        keyword: params?.keyword,
        startDate: params?.startDate,
        endDate: params?.endDate,
        valueTier: params?.valueTier,
        churnRisk: params?.churnRisk,
        orderBy: params?.orderBy,
        pageNum: this.currentPage,
        pageSize: this.pageSize,
      })
      this.list = res.rows || []
      this.total = res.total || 0
    },
  },
})
