import { defineStore } from 'pinia'
import type { UserInfo, GetInfoResponse } from '@/types/account.ts'
import type { App } from '@/types/app.ts'
import { fetchCurrentAccount } from '@/api/account.ts'

export interface MenuPermissions {
  canViewDashboard: boolean
  canManageDrama: boolean
  canViewUser: boolean
  canManageAd: boolean
  canSwitchApp: boolean
  canManageAccounts: boolean
}

function computePermissions(permissions: string[], roles: string[]): MenuPermissions {
  const isSuperAdmin = permissions.includes('*:*:*') || roles.includes('superadmin')
  if (isSuperAdmin) {
    return {
      canViewDashboard: true,
      canManageDrama: true,
      canViewUser: true,
      canManageAd: true,
      canSwitchApp: true,
      canManageAccounts: true,
    }
  }
  return {
    canViewDashboard: permissions.some(p => p.startsWith('dashboard:') || p === '*:*:*'),
    canManageDrama: permissions.some(p => p.startsWith('drama:') || p === '*:*:*'),
    canViewUser: permissions.some(p => p.startsWith('user:') || p === '*:*:*'),
    canManageAd: permissions.some(p => p.startsWith('ad:') || p === '*:*:*'),
    canSwitchApp: permissions.some(p => p.startsWith('system:application:') || p === '*:*:*'),
    // 系统管理（用户管理 + 应用管理）仅超级管理员可见
    canManageAccounts: false,
  }
}

function deriveRole(roles: string[], permissions: string[]): string {
  if (permissions.includes('*:*:*') || roles.includes('superadmin')) return 'admin'
  if (roles.some(r => r.includes('admin'))) return 'admin'
  if (roles.some(r => r.includes('operator'))) return 'operator'
  return 'viewer'
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    userInfo: null as UserInfo | null,
    permissions: [] as string[],
    roleKeys: [] as string[],
    applications: [] as App[],
    menuPerms: {
      canViewDashboard: false,
      canManageDrama: false,
      canViewUser: false,
      canManageAd: false,
      canSwitchApp: false,
      canManageAccounts: false,
    } as MenuPermissions,
  }),
  getters: {
    current: (state): UserInfo | null => state.userInfo,
    role: (state): string => deriveRole(state.roleKeys, state.permissions),
    isAdmin: (state): boolean => state.permissions.includes('*:*:*') || state.roleKeys.includes('superadmin'),
    hasAllApps: (state): boolean => state.permissions.includes('*:*:*') || state.roleKeys.includes('superadmin'),
    allowedClientKeys: (state): string[] => state.applications.map(a => a.clientKey),
    isLoggedIn: (state): boolean => !!state.userInfo,
  },
  actions: {
    async loadFromServer() {
      const data: GetInfoResponse = await fetchCurrentAccount()
      this.setInfo(data)
    },
    setInfo(data: GetInfoResponse) {
      this.userInfo = data.user
      this.permissions = data.permissions ?? []
      this.roleKeys = data.roles ?? []
      this.applications = data.applications ?? []
      this.menuPerms = computePermissions(this.permissions, this.roleKeys)
    },
    setCurrent(_account: any) {
      if (_account && typeof _account === 'object' && 'user' in _account) {
        this.setInfo(_account as GetInfoResponse)
      } else if (_account && typeof _account === 'object' && 'userId' in _account) {
        this.userInfo = _account as UserInfo
      }
    },
    clear() {
      this.userInfo = null
      this.permissions = []
      this.roleKeys = []
      this.applications = []
      this.menuPerms = {
        canViewDashboard: false,
        canManageDrama: false,
        canViewUser: false,
        canManageAd: false,
        canSwitchApp: false,
        canManageAccounts: false,
      }
    },
  },
})
