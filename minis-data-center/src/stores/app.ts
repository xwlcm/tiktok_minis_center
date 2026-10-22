import { defineStore } from 'pinia'
import type { App } from '@/types/app.ts'
import { useAccountStore } from '@/stores/account.ts'
import { switchApplication } from '@/api/app.ts'

const APP_STORAGE_KEY = 'current_client_key'

export const useAppStore = defineStore('app', {
  state: () => ({
    appList: [] as App[],
    currentClientKey: localStorage.getItem(APP_STORAGE_KEY) || '',
  }),
  getters: {
    currentApp: (state): App | undefined => {
      if (!state.appList.length) return undefined
      return state.appList.find(a => a.clientKey === state.currentClientKey) ?? state.appList[0]
    },
  },
  actions: {
    setAppList(apps: App[]) {
      this.appList = apps
      if (!this.currentClientKey && apps.length > 0) {
        this.currentClientKey = apps[0].clientKey
        localStorage.setItem(APP_STORAGE_KEY, this.currentClientKey)
      }
      const exists = apps.some(a => a.clientKey === this.currentClientKey)
      if (!exists && apps.length > 0) {
        this.currentClientKey = apps[0].clientKey
        localStorage.setItem(APP_STORAGE_KEY, this.currentClientKey)
      }
    },

    /**
     * 切换应用 — 调用后端接口将 clientKey 写入 Sa-Token Session。
     * 后续所有请求后端从 Session 读取 clientKey，不再依赖前端传参。
     */
    async switchApp(clientKey: string) {
      await switchApplication(clientKey)
      this.currentClientKey = clientKey
      localStorage.setItem(APP_STORAGE_KEY, clientKey)
    },

    /**
     * 登录后初始化：设置应用列表并自动切换到第一个应用（同步后端 Session）
     */
    async loadFromAccountStore() {
      const accountStore = useAccountStore()
      const apps = accountStore.applications
      this.appList = apps
      const savedKey = this.currentClientKey
      const exists = apps.some(a => a.clientKey === savedKey)
      if (apps.length > 0) {
        const targetKey = (savedKey && exists) ? savedKey : apps[0].clientKey
        if (targetKey !== this.currentClientKey) {
          this.currentClientKey = targetKey
          localStorage.setItem(APP_STORAGE_KEY, targetKey)
        }
        try {
          await switchApplication(targetKey)
        } catch {
          if (targetKey !== apps[0].clientKey) {
            this.currentClientKey = apps[0].clientKey
            localStorage.setItem(APP_STORAGE_KEY, apps[0].clientKey)
            await switchApplication(apps[0].clientKey).catch(() => {})
          }
        }
      }
    },

    clear() {
      this.appList = []
      this.currentClientKey = ''
      localStorage.removeItem(APP_STORAGE_KEY)
    },

    /**
     * 刷新应用列表（新增/编辑/删除应用后调用）
     */
    async refreshAppList() {
      const accountStore = useAccountStore()
      await accountStore.loadFromServer()
      this.setAppList(accountStore.applications)
    },
  },
})
