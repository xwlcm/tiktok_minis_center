import { defineStore } from 'pinia'
import { fetchAdInventoryList, fetchAdPushRuleList } from '@/api/ad.ts'
import type { AdInventory, AdPushRule } from '@/types/drama.ts'

export const useAdStore = defineStore('ad', {
  state: () => ({
    inventoryList: [] as AdInventory[],
    pushRuleList: [] as AdPushRule[],
  }),
  actions: {
    async fetchInventoryList() {
      try {
        const res = await fetchAdInventoryList()
        this.inventoryList = Array.isArray(res) ? res : []
      } catch {
        this.inventoryList = []
      }
    },
    async fetchPushRuleList() {
      try {
        const res = await fetchAdPushRuleList()
        this.pushRuleList = Array.isArray(res) ? res : []
      } catch {
        this.pushRuleList = []
      }
    },
    async fetchAll() {
      await Promise.all([this.fetchInventoryList(), this.fetchPushRuleList()])
    },
  },
})
