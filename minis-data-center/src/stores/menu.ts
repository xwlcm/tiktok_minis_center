/**
 * 工作区菜单布局 Store
 *
 * 职责：持有完整的菜单配置树（含被隐藏的项）与顶部菜单，对外提供可渲染视图。
 * 二级菜单可随时「提升为一级」或「移到顶部」，顶部项也能一键还原。
 * 所有变更立即写入 localStorage，刷新后保持用户自己的布局。
 */
import { defineStore } from 'pinia'
import {
  buildVisibleMenu,
  buildVisibleTopItems,
  DEFAULT_MENU,
  type MenuGroupDef,
  type MenuItemDef,
  type TopMenuItem,
} from '@/config/menu.ts'
import type { MenuPermissions } from '@/stores/account.ts'

const STORAGE_KEY = 'mc.menu.layout.v1'
const STORAGE_VERSION = 2

interface MenuLayoutState {
  groups: MenuGroupDef[]
  topItems: TopMenuItem[]
}

function cloneGroups(groups: MenuGroupDef[]): MenuGroupDef[] {
  return JSON.parse(JSON.stringify(groups)) as MenuGroupDef[]
}

function cloneTopItems(items: TopMenuItem[]): TopMenuItem[] {
  return JSON.parse(JSON.stringify(items)) as TopMenuItem[]
}

function loadState(): MenuLayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { groups: cloneGroups(DEFAULT_MENU), topItems: [] }

    const parsed = JSON.parse(raw) as {
      version?: number
      groups?: MenuGroupDef[]
      topItems?: TopMenuItem[]
    }
    if (!Array.isArray(parsed?.groups)) {
      return { groups: cloneGroups(DEFAULT_MENU), topItems: [] }
    }
    // v1 只有侧边栏布局：保留用户已有配置，顶部菜单从空开始
    return {
      groups: parsed.groups,
      topItems: Array.isArray(parsed.topItems) ? parsed.topItems : [],
    }
  } catch {
    return { groups: cloneGroups(DEFAULT_MENU), topItems: [] }
  }
}

function moveInArray<T>(list: T[], index: number, delta: number): void {
  const target = index + delta
  if (index < 0 || target < 0 || target >= list.length) return
  const [moved] = list.splice(index, 1)
  list.splice(target, 0, moved)
}

/** 提升为一级菜单时生成不与现有分组冲突的 key */
function uniqueGroupKey(groups: MenuGroupDef[], base: string): string {
  let key = base
  let n = 2
  while (groups.some(group => group.key === key)) {
    key = `${base}-${n}`
    n += 1
  }
  return key
}

export const useMenuStore = defineStore('menu', {
  state: () => loadState(),

  getters: {
    /** 按当前账号权限收敛后的侧边栏菜单树 */
    visibleGroups: state => (perms: MenuPermissions): MenuGroupDef[] =>
      buildVisibleMenu(state.groups, perms),

    /** 按当前账号权限收敛后的顶部菜单 */
    visibleTopItems: state => (perms: MenuPermissions): TopMenuItem[] =>
      buildVisibleTopItems(state.topItems, perms),

    totalGroups: state => state.groups.length,

    totalItems: state => state.groups.reduce((sum, group) => sum + group.children.length, 0),

    totalTop: state => state.topItems.length,

    disabledCount: state =>
      state.groups.filter(group => group.disabled).length
      + state.groups.reduce(
        (sum, group) => sum + group.children.filter(item => item.disabled).length,
        0,
      )
      + state.topItems.filter(item => item.disabled).length,

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
      )
      + state.topItems.filter(item => item.custom).length,

    /** 某个页面是否已经挂在侧边栏或顶部，避免重复添加 */
    usedPaths: state => new Set([
      ...state.groups.flatMap(group => group.children.map(item => item.key)),
      ...state.topItems.map(item => item.key),
    ]),
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            version: STORAGE_VERSION,
            groups: this.groups,
            topItems: this.topItems,
          }),
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

    /* ── 编辑：名称 / 图标 / 显示 / 状态 ──────────────── */

    updateGroup(
      key: string,
      patch: Partial<Pick<MenuGroupDef, 'label' | 'icon' | 'hidden' | 'disabled'>>,
    ) {
      const group = this.groups.find(item => item.key === key)
      if (!group) return
      if (group.locked) {
        Object.assign(group, { hidden: patch.hidden, disabled: patch.disabled })
        this.persist()
        return
      }
      Object.assign(group, patch)
      this.persist()
    },

    updateItem(
      groupKey: string,
      itemKey: string,
      patch: Partial<Pick<MenuItemDef, 'label' | 'icon' | 'hidden' | 'disabled'>>,
    ) {
      const group = this.groups.find(item => item.key === groupKey)
      const target = group?.children.find(item => item.key === itemKey)
      if (!target) return
      Object.assign(target, patch)
      this.persist()
    },

    updateTopItem(
      key: string,
      patch: Partial<Pick<TopMenuItem, 'label' | 'icon' | 'disabled'>>,
    ) {
      const target = this.topItems.find(item => item.key === key)
      if (!target) return
      Object.assign(target, patch)
      this.persist()
    },

    /* ── 排序：按显示序号移动到目标位置 ──────────────── */

    setGroupOrder(key: string, order: number) {
      const index = this.groups.findIndex(item => item.key === key)
      if (index < 0) return
      const target = Math.min(Math.max(Math.round(order) - 1, 0), this.groups.length - 1)
      if (target === index) return
      const [moved] = this.groups.splice(index, 1)
      this.groups.splice(target, 0, moved)
      this.persist()
    },

    setItemOrder(groupKey: string, itemKey: string, order: number) {
      const group = this.groups.find(item => item.key === groupKey)
      if (!group) return
      const index = group.children.findIndex(item => item.key === itemKey)
      if (index < 0) return
      const target = Math.min(Math.max(Math.round(order) - 1, 0), group.children.length - 1)
      if (target === index) return
      const [moved] = group.children.splice(index, 1)
      group.children.splice(target, 0, moved)
      this.persist()
    },

    setTopOrder(key: string, order: number) {
      const index = this.topItems.findIndex(item => item.key === key)
      if (index < 0) return
      const target = Math.min(Math.max(Math.round(order) - 1, 0), this.topItems.length - 1)
      if (target === index) return
      const [moved] = this.topItems.splice(index, 1)
      this.topItems.splice(target, 0, moved)
      this.persist()
    },

    /* ── 层级调整：二级 ⇄ 一级 ⇄ 顶部 ─────────────────── */

    /**
     * 把二级菜单搬到指定上级：
     * parent = '0' 成为一级菜单；'top' 进入顶部菜单；其他值为目标一级菜单 key
     */
    relocateItem(groupKey: string, itemKey: string, parent: string) {
      const groupIndex = this.groups.findIndex(item => item.key === groupKey)
      if (groupIndex < 0) return
      const group = this.groups[groupIndex]
      const itemIndex = group.children.findIndex(item => item.key === itemKey)
      if (itemIndex < 0) return
      const item = group.children[itemIndex]

      if (parent === groupKey) return

      if (parent === 'top') {
        if (this.topItems.some(entry => entry.key === itemKey)) return
        group.children.splice(itemIndex, 1)
        this.topItems.push({
          key: item.key,
          label: item.label,
          icon: item.icon ?? group.icon,
          permission: item.permission ?? group.permission,
          feature: item.feature,
          disabled: item.disabled,
          fromGroupKey: groupKey,
          custom: item.custom,
        })
        this.persist()
        return
      }

      if (parent === '0') {
        group.children.splice(itemIndex, 1)
        // 复用同名且已空的提升分组，避免反复切换堆出一堆空卡片
        const existing = this.groups.find(entry =>
          entry.custom && !entry.locked && !entry.children.length && entry.label === item.label,
        )
        if (existing) {
          existing.children.push({ ...item })
        } else {
          const base = `promoted-${(item.key.replace(/[^a-z0-9]+/gi, '-')).replace(/^-+|-+$/g, '')}`
          // 插在原分组之后，保证保存后立刻能看到
          this.groups.splice(groupIndex + 1, 0, {
            key: uniqueGroupKey(this.groups, base),
            label: item.label,
            icon: item.icon ?? group.icon,
            permission: group.permission,
            disabled: group.disabled,
            custom: true,
            children: [{ ...item }],
          })
        }
        this.persist()
        return
      }

      const target = this.groups.find(entry => entry.key === parent)
      if (!target) return
      if (target.children.some(child => child.key === itemKey)) return
      group.children.splice(itemIndex, 1)
      target.children.push(item)
      this.persist()
    },

    /** 二级菜单提升为独立的一级菜单，插入在原分组之后 */
    promoteItemToGroup(groupKey: string, itemKey: string) {
      const groupIndex = this.groups.findIndex(item => item.key === groupKey)
      if (groupIndex < 0) return
      const group = this.groups[groupIndex]
      const itemIndex = group.children.findIndex(item => item.key === itemKey)
      if (itemIndex < 0) return

      const [item] = group.children.splice(itemIndex, 1)
      const base = `promoted-${(item.key.replace(/[^a-z0-9]+/gi, '-')).replace(/^-+|-+$/g, '')}`
      this.groups.splice(groupIndex + 1, 0, {
        key: uniqueGroupKey(this.groups, base),
        label: item.label,
        icon: item.icon ?? group.icon,
        permission: group.permission,
        custom: true,
        children: [{ ...item, custom: true }],
      })
      this.persist()
    },

    /** 二级菜单移到顶部菜单，可随时还原回原分组 */
    moveItemToTop(groupKey: string, itemKey: string) {
      const group = this.groups.find(item => item.key === groupKey)
      if (!group) return
      const itemIndex = group.children.findIndex(item => item.key === itemKey)
      if (itemIndex < 0) return
      if (this.topItems.some(entry => entry.key === itemKey)) return

      const [item] = group.children.splice(itemIndex, 1)
      this.topItems.push({
        key: item.key,
        label: item.label,
        icon: group.icon,
        permission: item.permission ?? group.permission,
        feature: item.feature,
        fromGroupKey: groupKey,
        custom: item.custom,
      })
      this.persist()
    },

    /** 顶部菜单还原：默认回到原一级菜单，可指定目标上级（'0' 或分组 key） */
    restoreTopItem(key: string, parent?: string) {
      const index = this.topItems.findIndex(item => item.key === key)
      if (index < 0) return
      const [item] = this.topItems.splice(index, 1)

      const payload: MenuItemDef = {
        key: item.key,
        label: item.label,
        icon: item.icon,
        permission: item.permission,
        feature: item.feature,
        disabled: item.disabled,
        custom: item.custom,
      }

      const targetKey = parent ?? item.fromGroupKey
      const target = targetKey && targetKey !== '0'
        ? this.groups.find(group => group.key === targetKey)
        : undefined

      if (target) {
        if (!target.children.some(child => child.key === item.key)) {
          target.children.push(payload)
        }
      } else {
        const existing = this.groups.find(entry =>
          entry.custom && !entry.locked && !entry.children.length && entry.label === item.label,
        )
        if (existing) {
          existing.children.push(payload)
        } else {
          const anchor = item.fromGroupKey
            ? this.groups.findIndex(group => group.key === item.fromGroupKey)
            : -1
          const group = {
            key: uniqueGroupKey(this.groups, `top-${item.key.replace(/[^a-z0-9]+/gi, '-')}`),
            label: item.label,
            icon: item.icon,
            custom: true,
            children: [payload],
          }
          if (anchor >= 0) this.groups.splice(anchor + 1, 0, group)
          else this.groups.push(group)
        }
      }
      this.persist()
    },

    moveTopItem(key: string, delta: number) {
      const index = this.topItems.findIndex(item => item.key === key)
      if (index < 0) return
      moveInArray(this.topItems, index, delta)
      this.persist()
    },

    /* ── 重置 ─────────────────────────────────────────── */

    reset() {
      this.groups = cloneGroups(DEFAULT_MENU)
      this.topItems = cloneTopItems([])
      this.persist()
    },
  },
})
