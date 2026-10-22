/**
 * 工作区菜单布局 Store
 *
 * 职责：持有完整的菜单配置树（含被隐藏的项），对外提供可渲染视图。
 * 所有变更立即写入 localStorage，刷新后保持用户自己的布局。
 */
import { defineStore } from 'pinia'
import {
  buildVisibleMenu,
  DEFAULT_MENU,
  type MenuGroupDef,
  type MenuItemDef,
} from '@/config/menu.ts'
import type { MenuPermissions } from '@/stores/account.ts'

const STORAGE_KEY = 'mc.menu.layout.v1'
const STORAGE_VERSION = 1

function cloneGroups(groups: MenuGroupDef[]): MenuGroupDef[] {
  return JSON.parse(JSON.stringify(groups)) as MenuGroupDef[]
}

function loadGroups(): MenuGroupDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneGroups(DEFAULT_MENU)

    const parsed = JSON.parse(raw) as { version?: number; groups?: MenuGroupDef[] }
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.groups)) {
      return cloneGroups(DEFAULT_MENU)
    }
    return parsed.groups
  } catch {
    return cloneGroups(DEFAULT_MENU)
  }
}

function moveInArray<T>(list: T[], index: number, delta: number): void {
  const target = index + delta
  if (index < 0 || target < 0 || target >= list.length) return
  const [moved] = list.splice(index, 1)
  list.splice(target, 0, moved)
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    groups: loadGroups(),
  }),

  getters: {
    /** 按当前账号权限收敛后的菜单树 */
    visibleGroups: state => (perms: MenuPermissions): MenuGroupDef[] =>
      buildVisibleMenu(state.groups, perms),

    totalGroups: state => state.groups.length,

    totalItems: state => state.groups.reduce((sum, group) => sum + group.children.length, 0),

    hiddenCount: state =>
      state.groups.filter(group => group.hidden && !group.locked).length
      + state.groups.reduce(
        (sum, group) => sum + group.children.filter(item => item.hidden).length,
        0,
      ),

    customCount: state =>
      state.groups.filter(group => group.custom).length
      + state.groups.reduce(
        (sum, group) => sum + group.children.filter(item => item.custom).length,
        0,
      ),

    /** 某个页面是否已经挂在任意一级菜单下，避免重复添加 */
    usedPaths: state => new Set(
      state.groups.flatMap(group => group.children.map(item => item.key)),
    ),
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: STORAGE_VERSION, groups: this.groups }),
        )
      } catch {
        // 存储不可用（隐私模式/配额超限）时保持内存态，不影响本次会话
      }
    },

    /* ── 一级菜单 ─────────────────────────────────────── */

    toggleGroup(key: string) {
      const group = this.groups.find(item => item.key === key)
      if (!group || group.locked) return
      group.hidden = !group.hidden
      this.persist()
    },

    renameGroup(key: string, label: string) {
      const group = this.groups.find(item => item.key === key)
      if (!group || group.locked) return
      group.label = label
      this.persist()
    },

    setGroupIcon(key: string, icon: string) {
      const group = this.groups.find(item => item.key === key)
      if (!group) return
      group.icon = icon
      this.persist()
    },

    addGroup(label: string, icon: string) {
      const trimmed = label.trim()
      if (!trimmed) return
      this.groups.push({
        key: `custom-${Date.now().toString(36)}`,
        label: trimmed,
        icon,
        custom: true,
        children: [],
      })
      this.persist()
    },

    removeGroup(key: string) {
      const index = this.groups.findIndex(item => item.key === key)
      if (index < 0) return
      if (this.groups[index].locked) return
      this.groups.splice(index, 1)
      this.persist()
    },

    moveGroup(key: string, delta: number) {
      const index = this.groups.findIndex(item => item.key === key)
      if (index < 0) return
      moveInArray(this.groups, index, delta)
      this.persist()
    },

    /* ── 二级菜单 ─────────────────────────────────────── */

    toggleItem(groupKey: string, itemKey: string) {
      const group = this.groups.find(item => item.key === groupKey)
      if (!group) return
      const target = group.children.find(item => item.key === itemKey)
      if (!target) return
      target.hidden = !target.hidden
      this.persist()
    },

    renameItem(groupKey: string, itemKey: string, label: string) {
      const group = this.groups.find(item => item.key === groupKey)
      const target = group?.children.find(item => item.key === itemKey)
      if (!target) return
      target.label = label
      this.persist()
    },

    addItem(groupKey: string, item: MenuItemDef) {
      const group = this.groups.find(entry => entry.key === groupKey)
      if (!group) return
      if (group.children.some(entry => entry.key === item.key)) return
      group.children.push({ ...item, custom: true })
      this.persist()
    },

    removeItem(groupKey: string, itemKey: string) {
      const group = this.groups.find(item => item.key === groupKey)
      if (!group) return
      const index = group.children.findIndex(item => item.key === itemKey)
      if (index < 0) return
      group.children.splice(index, 1)
      this.persist()
    },

    moveItem(groupKey: string, itemKey: string, delta: number) {
      const group = this.groups.find(item => item.key === groupKey)
      if (!group) return
      const index = group.children.findIndex(item => item.key === itemKey)
      if (index < 0) return
      moveInArray(group.children, index, delta)
      this.persist()
    },

    /* ── 重置 ─────────────────────────────────────────── */

    reset() {
      this.groups = cloneGroups(DEFAULT_MENU)
      this.persist()
    },
  },
})
