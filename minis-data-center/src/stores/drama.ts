import { defineStore } from 'pinia'
import { fetchDramaList } from '@/api/drama.ts'
import type { Drama } from '@/types/drama.ts'

export const useDramaStore = defineStore('drama', {
  state: () => ({
    list: [] as Drama[],
    total: 0,
    currentPage: 1,
    pageSize: 20,
    searchKeyword: '',
    filterTag: '',
  }),
  actions: {
    async fetchList(params?: { name?: string; tagIds?: (number | string)[] }) {
      const res = await fetchDramaList({
        name: params?.name ?? (this.searchKeyword || undefined),
        tagIds: params?.tagIds,
        pageNum: this.currentPage,
        pageSize: this.pageSize,
      })
      this.list = res.rows || []
      this.total = res.total || 0
    },
  },
})
