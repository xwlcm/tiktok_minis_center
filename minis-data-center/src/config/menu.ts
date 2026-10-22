/**
 * 工作区菜单模型
 *
 * 一级菜单（group）= 左侧面板中的分组
 * 二级菜单（item） = 分组内的页面入口
 * 顶部菜单（topItem）= 横向展示在命令栏下方的页面入口
 *
 * 这份配置是菜单的唯一数据源：布局渲染与「模块管理」页面共用同一份结构，
 * 用户对显示/隐藏/顺序/层级/位置的调整由 stores/menu.ts 持久化到浏览器。
 */
import type { Component } from 'vue'
import {
  IconApps,
  IconBarChart,
  IconBranch,
  IconCommand,
  IconCompass,
  IconDashboard,
  IconFire,
  IconFolder,
  IconLayers,
  IconMindMapping,
  IconRobot,
  IconSend,
  IconSettings,
  IconStorage,
  IconThunderbolt,
  IconTrophy,
  IconUser,
  IconVideoCamera,
} from '@arco-design/web-vue/es/icon'
import type { MenuPermissions } from '@/stores/account.ts'

/** 功能开关：未完成模块默认关闭，关闭时对应菜单项不出现在工作区 */
export const FEATURES = {
  dataSubscription: false,
  alertCenter: false,
  alertRules: false,
  callbackRules: false,
  callbackLogs: false,
} as const

export type FeatureKey = keyof typeof FEATURES

export interface MenuItemDef {
  /** 路由路径，同时作为唯一标识 */
  key: string
  label: string
  /** 二级菜单自己的图标，缺省时跟随所属分组 */
  icon?: string
  permission?: keyof MenuPermissions
  feature?: FeatureKey
  hidden?: boolean
  /** 停用：保留配置但不参与渲染 */
  disabled?: boolean
  custom?: boolean
}

export interface MenuGroupDef {
  key: string
  label: string
  icon: string
  permission?: keyof MenuPermissions
  hidden?: boolean
  /** 停用：保留配置但不参与渲染 */
  disabled?: boolean
  custom?: boolean
  /** 固定模块：不允许隐藏或删除，避免把自己关在门外 */
  locked?: boolean
  children: MenuItemDef[]
}

/** 顶部菜单项：由某个二级菜单提升而来，可随时还原回原分组 */
export interface TopMenuItem {
  /** 路由路径，唯一标识 */
  key: string
  label: string
  icon: string
  permission?: keyof MenuPermissions
  feature?: FeatureKey
  /** 停用：保留配置但不参与渲染 */
  disabled?: boolean
  /** 来源一级菜单，还原时回到这里 */
  fromGroupKey?: string
  custom?: boolean
}

/* ── 图标注册表 ─────────────────────────────────────────── */

export const MENU_ICONS: Record<string, Component> = {
  apps: IconApps,
  dashboard: IconDashboard,
  'video-camera': IconVideoCamera,
  user: IconUser,
  send: IconSend,
  'bar-chart': IconBarChart,
  thunderbolt: IconThunderbolt,
  robot: IconRobot,
  settings: IconSettings,
  layers: IconLayers,
  folder: IconFolder,
  'mind-mapping': IconMindMapping,
  storage: IconStorage,
  compass: IconCompass,
  trophy: IconTrophy,
  fire: IconFire,
  branch: IconBranch,
  command: IconCommand,
}

/** 供「模块管理」选图标用 */
export const ICON_OPTIONS: string[] = Object.keys(MENU_ICONS)

export function resolveMenuIcon(key?: string): Component {
  return (key && MENU_ICONS[key]) || IconApps
}

/* ── 默认菜单 ───────────────────────────────────────────── */

export const DEFAULT_MENU: MenuGroupDef[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: 'dashboard',
    permission: 'canViewDashboard',
    children: [{ key: '/dashboard', label: '仪表盘' }],
  },
  {
    key: 'drama',
    label: '短剧管理',
    icon: 'video-camera',
    permission: 'canManageDrama',
    children: [
      { key: '/drama/list', label: '短剧列表' },
      { key: '/drama/tags', label: '短剧标签' },
      { key: '/drama/home-banner', label: '首页轮播' },
      { key: '/drama/home-hot', label: '热播短剧' },
      { key: '/drama/home-rank', label: '分类排行榜' },
      { key: '/drama/home-explore', label: '更多短剧' },
    ],
  },
  {
    key: 'user',
    label: '用户列表',
    icon: 'user',
    permission: 'canViewUser',
    children: [{ key: '/user/list', label: '用户列表' }],
  },
  {
    key: 'ad-delivery',
    label: '广告投放',
    icon: 'send',
    permission: 'canManageAd',
    children: [
      { key: '/ad/accounts', label: '广告账户' },
      { key: '/ad/report', label: '投放报表' },
      { key: '/ad/webhook-subscriptions', label: '数据订阅', feature: 'dataSubscription' },
      { key: '/ad/campaign-mapping', label: '关联管理' },
      { key: '/ad/naming-template', label: '命名模板' },
    ],
  },
  {
    key: 'ad-analytics',
    label: '数据分析',
    icon: 'bar-chart',
    permission: 'canManageAd',
    children: [
      { key: '/ad/analytics-dashboard', label: '数据看板' },
      { key: '/ad/alerts', label: '预警中心', feature: 'alertCenter' },
      { key: '/ad/alert-rules', label: '预警规则', feature: 'alertRules' },
    ],
  },
  {
    key: 'ad-monetize',
    label: '广告变现',
    icon: 'thunderbolt',
    permission: 'canManageAd',
    children: [
      { key: '/ad/list', label: '广告列表' },
      { key: '/ad/push-settings', label: '推送规则' },
      { key: '/ad/force-rule', label: '强弹规则' },
      { key: '/ad/force-whitelist', label: '强弹白名单' },
      { key: '/ad/callback-rules', label: '回传规则', feature: 'callbackRules' },
      { key: '/ad/callback-logs', label: '回传日志', feature: 'callbackLogs' },
    ],
  },
  {
    key: 'ad-algorithm',
    label: '智能算法',
    icon: 'robot',
    permission: 'canManageAd',
    children: [
      { key: '/ad/analytics', label: '算法分析' },
      { key: '/ad/algorithm-status', label: '算法状态' },
      { key: '/ad/push-logs', label: '推送日志' },
      { key: '/ad/algorithm-config', label: '参数配置' },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: 'settings',
    permission: 'canManageAccounts',
    children: [
      { key: '/system/user', label: '用户管理' },
      { key: '/system/role', label: '角色管理' },
      { key: '/system/app', label: '应用管理' },
      { key: '/system/data-init', label: '数据初始化' },
    ],
  },
  {
    key: 'modules',
    label: '模块管理',
    icon: 'apps',
    locked: true,
    children: [{ key: '/system/modules', label: '模块管理' }],
  },
]

/* ── 可挂载页面目录（新增二级菜单时选择） ────────────────── */

export interface PageCatalogEntry {
  key: string
  label: string
  section: string
}

export const PAGE_CATALOG: PageCatalogEntry[] = [
  { key: '/dashboard', label: '仪表盘', section: '概览' },

  { key: '/drama/list', label: '短剧列表', section: '短剧' },
  { key: '/drama/upload', label: '上传短剧', section: '短剧' },
  { key: '/drama/tags', label: '短剧标签', section: '短剧' },
  { key: '/drama/home-banner', label: '首页轮播', section: '短剧' },
  { key: '/drama/home-hot', label: '热播短剧', section: '短剧' },
  { key: '/drama/home-rank', label: '分类排行榜', section: '短剧' },
  { key: '/drama/home-explore', label: '更多短剧', section: '短剧' },
  { key: '/drama/ad-settings', label: '广告推送设置', section: '短剧' },

  { key: '/user/list', label: '用户列表', section: '用户' },

  { key: '/ad/accounts', label: '广告账户', section: '广告投放' },
  { key: '/ad/report', label: '投放报表', section: '广告投放' },
  { key: '/ad/webhook-subscriptions', label: '数据订阅', section: '广告投放' },
  { key: '/ad/campaign-mapping', label: '关联管理', section: '广告投放' },
  { key: '/ad/naming-template', label: '命名模板', section: '广告投放' },

  { key: '/ad/analytics-dashboard', label: '数据看板', section: '数据分析' },
  { key: '/ad/drama-roi', label: '剧 ROI', section: '数据分析' },
  { key: '/ad/creative-fatigue', label: '素材疲劳度', section: '数据分析' },
  { key: '/ad/geo-analysis', label: '地域分析', section: '数据分析' },
  { key: '/ad/alerts', label: '预警中心', section: '数据分析' },
  { key: '/ad/alert-rules', label: '预警规则', section: '数据分析' },

  { key: '/ad/list', label: '广告列表', section: '广告变现' },
  { key: '/ad/push-settings', label: '推送规则', section: '广告变现' },
  { key: '/ad/force-rule', label: '强弹规则', section: '广告变现' },
  { key: '/ad/force-whitelist', label: '强弹白名单', section: '广告变现' },
  { key: '/ad/callback-rules', label: '回传规则', section: '广告变现' },
  { key: '/ad/callback-logs', label: '回传日志', section: '广告变现' },

  { key: '/ad/analytics', label: '算法分析', section: '智能算法' },
  { key: '/ad/algorithm-status', label: '算法状态', section: '智能算法' },
  { key: '/ad/push-logs', label: '推送日志', section: '智能算法' },
  { key: '/ad/algorithm-config', label: '参数配置', section: '智能算法' },

  { key: '/system/user', label: '用户管理', section: '系统' },
  { key: '/system/role', label: '角色管理', section: '系统' },
  { key: '/system/app', label: '应用管理', section: '系统' },
  { key: '/system/data-init', label: '数据初始化', section: '系统' },
  { key: '/system/modules', label: '模块管理', section: '系统' },
]

export function findPageTitle(path: string): string {
  return PAGE_CATALOG.find(page => page.key === path)?.label ?? path
}

/* ── 权限 / 开关过滤 ────────────────────────────────────── */

/**
 * 按权限、功能开关与用户隐藏设置，把配置树收敛成实际可渲染的菜单。
 * 权限不足或功能关闭的分组会因为子项被全部过滤而自动消失。
 */
export function buildVisibleMenu(
  groups: MenuGroupDef[],
  perms: MenuPermissions,
): MenuGroupDef[] {
  const result: MenuGroupDef[] = []

  for (const group of groups) {
    if (group.locked) {
      result.push({ ...group, children: group.children.map(item => ({ ...item })) })
      continue
    }
    if (group.hidden || group.disabled) continue
    if (group.permission && !perms[group.permission]) continue

    const children = group.children.filter((item) => {
      if (item.hidden || item.disabled) return false
      if (item.permission && !perms[item.permission]) return false
      if (item.feature && !FEATURES[item.feature]) return false
      return true
    })

    if (!children.length) continue
    result.push({ ...group, children })
  }

  return result
}

/** 顶部菜单同样按权限、功能开关过滤 */
export function buildVisibleTopItems(
  items: TopMenuItem[],
  perms: MenuPermissions,
): TopMenuItem[] {
  return items.filter((item) => {
    if (item.disabled) return false
    if (item.permission && !perms[item.permission]) return false
    if (item.feature && !FEATURES[item.feature]) return false
    return true
  })
}
