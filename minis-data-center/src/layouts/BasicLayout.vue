<template>
  <div class="shell" :class="{ 'shell--mobile': isMobile }">
    <div class="shell-aurora" aria-hidden="true" />

    <!-- ═══ 侧边导航：一级菜单 + 侧边栏内下拉展开 ═════════════ -->
    <aside
      class="sider"
      :class="{ 'sider--collapsed': sidebarCollapsed, 'sider--open': mobileNavOpen }"
    >
      <div class="sider-brand">
        <button type="button" class="brand-btn" title="Minis 数据中台" @click="go('/dashboard')">
          <AppLogo size="sm" :collapsed="sidebarCollapsed" />
        </button>
        <button
          type="button"
          class="sider-collapse"
          :title="isMobile ? '关闭菜单' : (sidebarCollapsed ? '展开侧栏' : '收起侧栏')"
          @click="toggleNav"
        >
          <IconMenuUnfold v-if="sidebarCollapsed" />
          <IconMenuFold v-else />
        </button>
      </div>

      <nav class="sider-nav">
        <div v-for="group in groups" :key="group.key" class="nav-group">
          <button
            type="button"
            class="nav-parent"
            :class="{
              'nav-parent--active': group.key === activeGroupKey,
              'nav-parent--open': isExpanded(group.key),
            }"
            :title="sidebarCollapsed && !isMobile ? group.label : undefined"
            @click="onGroupClick(group)"
          >
            <component :is="resolveMenuIcon(group.icon)" class="nav-parent-icon" />
            <span class="nav-parent-label">{{ group.label }}</span>
            <span v-if="group.children.length > 1" class="nav-parent-count">
              {{ group.children.length }}
            </span>
            <IconDown v-if="group.children.length > 1" class="nav-parent-arrow" />
          </button>

          <transition name="submenu">
            <ul
              v-if="group.children.length > 1 && isExpanded(group.key) && (!sidebarCollapsed || isMobile)"
              class="nav-sub"
            >
              <li v-for="item in group.children" :key="item.key">
                <button
                  type="button"
                  class="nav-leaf"
                  :class="{ 'nav-leaf--active': item.key === activeMenuKey }"
                  @click="go(item.key)"
                  @mouseenter="prefetchOnHover(item.key)"
                  @mouseleave="cancelHoverPrefetch"
                >
                  <span class="nav-leaf-dot" />
                  <span class="nav-leaf-label">{{ item.label }}</span>
                </button>
              </li>
            </ul>
          </transition>
        </div>
      </nav>

      <div class="sider-foot">
        <button
          type="button"
          class="sider-manage"
          :title="sidebarCollapsed && !isMobile ? '模块管理' : undefined"
          @click="go('/system/modules')"
        >
          <IconApps />
          <span v-if="!sidebarCollapsed || isMobile">模块管理</span>
        </button>
      </div>
    </aside>

    <!-- 移动端抽屉遮罩 -->
    <div v-if="isMobile && mobileNavOpen" class="sider-mask" @click="mobileNavOpen = false" />

    <!-- ═══ 工作区 ═══════════════════════════════════════════ -->
    <main class="workspace">
      <header class="commandbar">
        <button type="button" class="cmd-ghost" title="展开模块菜单" @click="toggleNav">
          <IconMenuUnfold v-if="sidebarCollapsed || (isMobile && !mobileNavOpen)" />
          <IconMenuFold v-else />
        </button>

        <div class="cmd-trail">
          <span class="cmd-trail-group">{{ activeGroup?.label ?? '工作区' }}</span>
          <IconRight class="cmd-trail-sep" />
          <span class="cmd-trail-page">{{ currentTitle }}</span>
        </div>

        <div class="cmd-spacer" />

        <button type="button" class="cmd-search" @click="openPalette">
          <IconSearch />
          <span class="cmd-search-text">搜索模块</span>
          <kbd>Ctrl K</kbd>
        </button>

        <span class="cmd-divider" />

        <AppSwitcher v-if="perms.canSwitchApp" />
        <div v-else class="cmd-app">
          <span class="cmd-app-dot" />
          <span class="cmd-app-name">{{ appStore.currentApp?.appName ?? '—' }}</span>
        </div>

        <a-dropdown trigger="click" position="br">
          <button type="button" class="cmd-user">
            <span class="cmd-avatar" :style="{ background: roleColor }">{{ userInitial }}</span>
            <span class="cmd-user-meta">
              <span class="cmd-user-name">{{ userName }}</span>
              <span class="cmd-user-role">{{ roleLabel }}</span>
            </span>
            <IconDown class="cmd-user-caret" />
          </button>
          <template #content>
            <a-doption @click="go('/system/modules')">
              <template #icon><IconApps /></template>
              模块管理
            </a-doption>
            <a-doption @click="handleLogout">
              <template #icon><IconExport /></template>
              退出登录
            </a-doption>
          </template>
        </a-dropdown>
      </header>

      <div class="canvas">
        <router-view v-slot="{ Component, route: current }">
          <keep-alive v-if="Component && !current.meta.refreshOnMenuSwitch" :include="/./">
            <component :is="Component" :key="current.path" />
          </keep-alive>
          <component
            v-else-if="Component && current.meta.refreshOnMenuSwitch"
            :is="Component"
            :key="current.fullPath"
          />
        </router-view>
      </div>
    </main>

    <!-- ═══ 命令面板 ═════════════════════════════════════════ -->
    <div v-if="paletteOpen" class="palette-mask" @click.self="closePalette">
      <div class="palette">
        <div class="palette-input-row">
          <IconSearch class="palette-search-icon" />
          <input
            ref="paletteInputRef"
            v-model="paletteQuery"
            class="palette-input"
            placeholder="搜索模块、页面或路径…"
            @keydown.down.prevent="movePaletteCursor(1)"
            @keydown.up.prevent="movePaletteCursor(-1)"
            @keydown.enter.prevent="runPaletteCursor"
            @keydown.esc.prevent="closePalette"
          />
          <kbd class="palette-esc">Esc</kbd>
        </div>

        <div class="palette-results">
          <button
            v-for="(entry, index) in paletteResults"
            :key="entry.key"
            type="button"
            class="palette-item"
            :class="{ 'palette-item--active': index === paletteCursor }"
            @mouseenter="paletteCursor = index"
            @click="runPalette(entry.key)"
          >
            <span class="palette-item-main">
              <component :is="resolveMenuIcon(entry.icon)" class="palette-item-icon" />
              <span class="palette-item-label">{{ entry.label }}</span>
            </span>
            <span class="palette-item-group">{{ entry.groupLabel }}</span>
          </button>

          <p v-if="!paletteResults.length" class="palette-empty">没有匹配的模块</p>
        </div>

        <footer class="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span class="palette-foot-tip">布局可在「模块管理」中调整</span>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconApps,
  IconDown,
  IconExport,
  IconMenuFold,
  IconMenuUnfold,
  IconRight,
  IconSearch,
} from '@arco-design/web-vue/es/icon'

import AppLogo from '@/components/AppLogo/index.vue'
import AppSwitcher from '@/components/AppSwitcher/index.vue'
import { useAccountStore } from '@/stores/account.ts'
import { useAppStore } from '@/stores/app.ts'
import { useMenuStore } from '@/stores/menu.ts'
import { resolveMenuIcon, type MenuGroupDef } from '@/config/menu.ts'
import { logout } from '@/api/auth.ts'
import { cancelHoverPrefetch, prefetchOnHover } from '@/utils/route-prefetch.ts'

const route = useRoute()
const router = useRouter()

const accountStore = useAccountStore()
const appStore = useAppStore()
const menuStore = useMenuStore()

/* ── 布局状态 ─────────────────────────────────────────── */

const MOBILE_BREAKPOINT = 768
const SIDEBAR_KEY = 'mc.sidebar.collapsed.v1'

const isMobile = ref(window.innerWidth < MOBILE_BREAKPOINT)
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')
const mobileNavOpen = ref(false)
const expandedGroupKeys = ref<string[]>([])
const paletteOpen = ref(false)
const paletteQuery = ref('')
const paletteCursor = ref(0)
const paletteInputRef = ref<HTMLInputElement | null>(null)

const perms = computed(() => accountStore.menuPerms)
const groups = computed<MenuGroupDef[]>(() => menuStore.visibleGroups(perms.value))

/* ── 路由 → 菜单归属 ──────────────────────────────────── */

// 详情页、上传页等非菜单路由，回指到对应的列表菜单项
const routeAliasMap: Array<{ pattern: RegExp; menuKey: string }> = [
  { pattern: /^\/user\/.+$/, menuKey: '/user/list' },
  { pattern: /^\/drama\/\d+$/, menuKey: '/drama/list' },
  { pattern: /^\/drama\/upload$/, menuKey: '/drama/list' },
  { pattern: /^\/drama\/ad-settings$/, menuKey: '/drama/list' },
]

function resolveMenuKey(path: string): string {
  for (const { pattern, menuKey } of routeAliasMap) {
    if (pattern.test(path)) return menuKey
  }
  return path
}

const activeMenuKey = computed(() => resolveMenuKey(route.path))

const activeGroup = computed<MenuGroupDef | null>(() => {
  const current = activeMenuKey.value
  return groups.value.find(group => group.children.some(item => item.key === current)) ?? null
})

const activeGroupKey = computed(() => activeGroup.value?.key ?? '')

const currentTitle = computed(() => (route.meta?.title as string) ?? '')

/* ── 交互 ─────────────────────────────────────────────── */

function isExpanded(key: string) {
  return expandedGroupKeys.value.includes(key)
}

/** 手风琴：同时只展开一个一级菜单 */
function expandGroup(key: string) {
  expandedGroupKeys.value = [key]
}

function onGroupClick(group: MenuGroupDef) {
  const items = group.children
  if (!items.length) return

  // 折叠态下先展开侧栏，否则下拉内容无处展示
  if (sidebarCollapsed.value && !isMobile.value) {
    sidebarCollapsed.value = false
    localStorage.setItem(SIDEBAR_KEY, '0')
  }

  // 单页面模块没有二级菜单，直接进入
  if (items.length === 1) {
    go(items[0].key)
    return
  }

  if (isExpanded(group.key)) {
    expandedGroupKeys.value = expandedGroupKeys.value.filter(key => key !== group.key)
    return
  }
  expandGroup(group.key)
}

/** 桌面端：收起/展开侧边栏；移动端：开合描屉 */
function toggleNav() {
  if (isMobile.value) {
    mobileNavOpen.value = !mobileNavOpen.value
    return
  }
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
  if (sidebarCollapsed.value) {
    expandedGroupKeys.value = []
  } else if (activeGroupKey.value) {
    // 重新展开时恢复当前路由所属分组
    expandGroup(activeGroupKey.value)
  }
}

function go(key: string) {
  if (!key.startsWith('/')) return
  mobileNavOpen.value = false
  if (route.path === key) return
  router.push(key)
}

/* ── 命令面板 ─────────────────────────────────────────── */

interface PaletteEntry {
  key: string
  label: string
  groupLabel: string
  icon: string
}

const paletteSource = computed<PaletteEntry[]>(() => {
  const seen = new Set<string>()
  const entries: PaletteEntry[] = []
  for (const group of groups.value) {
    for (const item of group.children) {
      if (seen.has(item.key)) continue
      seen.add(item.key)
      entries.push({
        key: item.key,
        label: item.label,
        groupLabel: group.label,
        icon: group.icon,
      })
    }
  }
  return entries
})

const paletteResults = computed<PaletteEntry[]>(() => {
  const keyword = paletteQuery.value.trim().toLowerCase()
  const source = paletteSource.value
  if (!keyword) return source.slice(0, 30)
  return source
    .filter(entry =>
      entry.label.toLowerCase().includes(keyword)
      || entry.groupLabel.toLowerCase().includes(keyword)
      || entry.key.toLowerCase().includes(keyword),
    )
    .slice(0, 30)
})

function openPalette() {
  paletteOpen.value = true
  paletteQuery.value = ''
  paletteCursor.value = 0
  nextTick(() => paletteInputRef.value?.focus())
}

function closePalette() {
  paletteOpen.value = false
}

function movePaletteCursor(delta: number) {
  const total = paletteResults.value.length
  if (!total) return
  paletteCursor.value = (paletteCursor.value + delta + total) % total
}

function runPaletteCursor() {
  const entry = paletteResults.value[paletteCursor.value]
  if (entry) runPalette(entry.key)
}

function runPalette(key: string) {
  closePalette()
  go(key)
}

watch(paletteQuery, () => {
  paletteCursor.value = 0
})

/* ── 账号信息 ─────────────────────────────────────────── */

const userName = computed(
  () => accountStore.current?.nickName ?? accountStore.current?.userName ?? 'Admin',
)
const userInitial = computed(() => (userName.value[0] ?? 'A').toUpperCase())
const roleLabel = computed(
  () => ({ admin: '管理员', operator: '运营', viewer: '观察者' } as Record<string, string>)[accountStore.role]
    ?? accountStore.role,
)
const roleColor = computed(
  () => ({ admin: '#E0576E', operator: '#4C9DE4', viewer: '#7B8FE0' } as Record<string, string>)[accountStore.role]
    ?? '#86909c',
)

async function handleLogout() {
  try {
    await logout()
  } catch {
    // 接口失败也继续清理本地状态，避免卡在登录态
  }
  localStorage.removeItem('token')
  localStorage.removeItem('client_id')
  accountStore.clear()
  appStore.clear()
  Message.success('已退出登录')
  router.push('/login')
}

/* ── 响应式 ───────────────────────────────────────────── */

function handleResize() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
  // 回到桌面尺寸时关闭移动端抽屉
  if (!isMobile.value) mobileNavOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  const isPaletteHotkey = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
  if (isPaletteHotkey) {
    event.preventDefault()
    if (paletteOpen.value) closePalette()
    else openPalette()
    return
  }
  if (event.key !== 'Escape') return
  if (paletteOpen.value) {
    closePalette()
    return
  }
  if (mobileNavOpen.value) mobileNavOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
  cancelHoverPrefetch()
})

// 路由变化：自动展开所属分组，并收起移动端描屉
watch(activeGroupKey, (key) => {
  if (key) expandGroup(key)
  mobileNavOpen.value = false
}, { immediate: true })
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   外壳：侧边导航 + 悬浮工作区
   ═══════════════════════════════════════════════════════════ */
.shell {
  position: relative;
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--mc-bg-page);
}

.shell-aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(56% 42% at 4% 0%, rgba(124, 195, 240, 0.09) 0%, transparent 64%),
    radial-gradient(52% 46% at 98% 2%, rgba(168, 204, 240, 0.07) 0%, transparent 68%),
    radial-gradient(64% 44% at 50% 110%, rgba(203, 225, 247, 0.16) 0%, transparent 72%);
}

/* ─── 侧边导航 ──────────────────────────────────────────── */
.sider {
  position: relative;
  z-index: 3;
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 10px 12px;
  background: rgba(255, 255, 255, 0.86);
  border-right: 1px solid rgba(31, 80, 132, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: width 0.22s var(--mc-ease-out), padding 0.22s ease;
}

.sider--collapsed {
  width: 72px;
  padding-left: 8px;
  padding-right: 8px;
}

/* 品牌区 */
.sider-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px 14px;
  flex-shrink: 0;
}

.brand-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 2px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
}

.sider-collapse {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(22, 41, 63, 0.38);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
  flex-shrink: 0;
}
.sider-collapse:hover {
  background: rgba(76, 157, 228, 0.10);
  color: #2269AE;
}

/* 一级菜单 */
.sider-nav {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(31, 80, 132, 0.16) transparent;
}
.sider-nav::-webkit-scrollbar { width: 4px; }
.sider-nav::-webkit-scrollbar-thumb {
  background: rgba(31, 80, 132, 0.16);
  border-radius: 4px;
}

.nav-group {
  display: flex;
  flex-direction: column;
}

.nav-parent {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(22, 41, 63, 0.66);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--mc-font-family);
  text-align: left;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}
.nav-parent:hover {
  background: rgba(76, 157, 228, 0.08);
  color: #2269AE;
}

.nav-parent--active {
  color: #1F63A6;
  background: linear-gradient(150deg, rgba(111, 182, 242, 0.20) 0%, rgba(76, 157, 228, 0.12) 100%);
  box-shadow: inset 0 0 0 1px rgba(76, 157, 228, 0.16);
}

.nav-parent-icon {
  font-size: 16px;
  flex-shrink: 0;
  transition: transform 0.2s var(--mc-ease-spring);
}
.nav-parent--active .nav-parent-icon {
  filter: drop-shadow(0 2px 6px rgba(76, 157, 228, 0.28));
}

.nav-parent-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-parent-count {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(76, 157, 228, 0.12);
  color: #3285CE;
  font-size: 9px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  font-family: var(--mc-font-mono);
  flex-shrink: 0;
}

.nav-parent-arrow {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.30);
  flex-shrink: 0;
  transition: transform 0.22s var(--mc-ease-out);
}
.nav-parent--open .nav-parent-arrow {
  transform: rotate(180deg);
}

/* 二级菜单：侧栏内下拉展开 */
.nav-sub {
  list-style: none;
  margin: 2px 0 6px 18px;
  padding: 2px 0 2px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-left: 1px solid rgba(31, 80, 132, 0.10);
}

.nav-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 33px;
  padding: 0 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(22, 41, 63, 0.62);
  font-size: 12.5px;
  font-family: var(--mc-font-family);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.nav-leaf:hover {
  background: rgba(76, 157, 228, 0.08);
  color: #2269AE;
}

.nav-leaf--active {
  background: rgba(76, 157, 228, 0.14);
  color: #1F63A6;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(76, 157, 228, 0.14);
}

.nav-leaf-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(22, 41, 63, 0.22);
  flex-shrink: 0;
  transition: background 0.16s ease, transform 0.18s var(--mc-ease-spring);
}
.nav-leaf--active .nav-leaf-dot {
  background: #4C9DE4;
  transform: scale(1.4);
}

.nav-leaf-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展开 / 收起过渡 */
.submenu-enter-active,
.submenu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 底部：模块管理 */
.sider-foot {
  flex-shrink: 0;
  padding-top: 10px;
  margin-top: 6px;
  border-top: 1px solid rgba(31, 80, 132, 0.08);
}

.sider-manage {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px dashed rgba(31, 80, 132, 0.16);
  border-radius: 10px;
  background: transparent;
  color: rgba(22, 41, 63, 0.5);
  font-size: 12px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}
.sider-manage:hover {
  border-color: rgba(76, 157, 228, 0.4);
  background: rgba(76, 157, 228, 0.07);
  color: #2269AE;
}

/* 折叠态：仅保留图标 */
.sider--collapsed .sider-brand {
  flex-direction: column;
  gap: 4px;
  padding-bottom: 12px;
}
.sider--collapsed .brand-btn {
  justify-content: center;
}
.sider--collapsed .nav-parent {
  justify-content: center;
  gap: 0;
  padding: 0;
}
.sider--collapsed .nav-parent-label,
.sider--collapsed .nav-parent-count,
.sider--collapsed .nav-parent-arrow {
  display: none;
}
.sider--collapsed .sider-manage {
  justify-content: center;
  padding: 0;
}

/* ─── 移动端抽屉遮罩 ──────────────────────────────────── */
.sider-mask {
  position: fixed;
  inset: 0;
  z-index: 320;
  background: rgba(19, 41, 66, 0.24);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* ─── 工作区 ─────────────────────────────────────────────── */
.workspace {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 14px 0;
  gap: 12px;
}

.commandbar {
  height: 54px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(31, 80, 132, 0.08);
  backdrop-filter: blur(20px) saturate(1.1);
  -webkit-backdrop-filter: blur(20px) saturate(1.1);
  box-shadow: 0 8px 24px rgba(23, 54, 92, 0.07);
}

.cmd-ghost {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: rgba(76, 157, 228, 0.07);
  color: rgba(22, 41, 63, 0.55);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
  flex-shrink: 0;
}
.cmd-ghost:hover {
  background: rgba(76, 157, 228, 0.14);
  color: #1F63A6;
}

.cmd-trail {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.cmd-trail-group {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.42);
  white-space: nowrap;
}

.cmd-trail-sep {
  font-size: 10px;
  color: rgba(22, 41, 63, 0.2);
  flex-shrink: 0;
}

.cmd-trail-page {
  font-size: 14px;
  font-weight: 600;
  color: #16293F;
  letter-spacing: 0.005em;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd-spacer {
  flex: 1;
  min-width: 8px;
}

.cmd-search {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 9px 0 11px;
  border: 1px solid rgba(31, 80, 132, 0.10);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.7);
  color: rgba(22, 41, 63, 0.45);
  font-size: 12px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
  flex-shrink: 0;
}
.cmd-search:hover {
  border-color: rgba(76, 157, 228, 0.4);
  background: rgba(76, 157, 228, 0.07);
  color: #2269AE;
}

.cmd-search kbd {
  font-family: var(--mc-font-mono);
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid rgba(31, 80, 132, 0.12);
  background: rgba(76, 157, 228, 0.06);
  color: rgba(22, 41, 63, 0.42);
  letter-spacing: 0.04em;
}

.cmd-divider {
  width: 1px;
  height: 20px;
  background: rgba(31, 80, 132, 0.10);
  flex-shrink: 0;
}

.cmd-app {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid rgba(31, 80, 132, 0.09);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}
.cmd-app-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22A06B;
  box-shadow: 0 0 0 3px rgba(34, 160, 107, 0.14);
}
.cmd-app-name {
  font-size: 12px;
  color: rgba(22, 41, 63, 0.62);
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease;
  flex-shrink: 0;
}
.cmd-user:hover {
  background: rgba(76, 157, 228, 0.08);
  border-color: rgba(31, 80, 132, 0.10);
}

.cmd-avatar {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0;
  flex-shrink: 0;
}

.cmd-user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.15;
  text-align: left;
}
.cmd-user-name {
  font-size: 12px;
  font-weight: 600;
  color: #16293F;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cmd-user-role {
  font-size: 10px;
  color: rgba(22, 41, 63, 0.42);
}
.cmd-user-caret {
  font-size: 10px;
  color: rgba(22, 41, 63, 0.3);
}

.canvas {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px var(--mc-content-padding) var(--mc-content-padding);
  scrollbar-width: thin;
  scrollbar-color: rgba(31, 80, 132, 0.16) transparent;
}
.canvas::-webkit-scrollbar { width: 6px; }
.canvas::-webkit-scrollbar-thumb {
  background: rgba(31, 80, 132, 0.16);
  border-radius: 6px;
}

/* ─── 命令面板 ───────────────────────────────────────────── */
.palette-mask {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
  background: rgba(19, 41, 66, 0.28);
  backdrop-filter: blur(6px);
}

.palette {
  width: min(620px, calc(100vw - 32px));
  max-height: 66vh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid rgba(31, 80, 132, 0.10);
  background: rgba(255, 255, 255, 0.99);
  box-shadow: 0 30px 80px rgba(23, 54, 92, 0.22), 0 2px 10px rgba(23, 54, 92, 0.06);
  overflow: hidden;
  animation: palette-in 0.16s var(--mc-ease-out);
}

@keyframes palette-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.palette-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(31, 80, 132, 0.08);
}

.palette-search-icon {
  font-size: 16px;
  color: rgba(22, 41, 63, 0.36);
  flex-shrink: 0;
}

.palette-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  color: #16293F;
  font-size: 15px;
  font-family: var(--mc-font-family);
  letter-spacing: 0.005em;
}
.palette-input::placeholder {
  color: rgba(22, 41, 63, 0.32);
}

.palette-esc {
  font-family: var(--mc-font-mono);
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(31, 80, 132, 0.12);
  background: rgba(76, 157, 228, 0.06);
  color: rgba(22, 41, 63, 0.36);
  flex-shrink: 0;
}

.palette-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(31, 80, 132, 0.16) transparent;
}

.palette-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(22, 41, 63, 0.7);
  font-size: 13px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  text-align: left;
  transition: background 0.14s ease, color 0.14s ease;
}

.palette-item--active {
  background: linear-gradient(90deg, rgba(76, 157, 228, 0.16) 0%, rgba(76, 157, 228, 0.06) 100%);
  color: #1F63A6;
}

.palette-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.palette-item-icon {
  font-size: 15px;
  color: #3285CE;
  flex-shrink: 0;
}

.palette-item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.palette-item-group {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.36);
  flex-shrink: 0;
}

.palette-empty {
  padding: 28px 12px;
  text-align: center;
  font-size: 13px;
  color: rgba(22, 41, 63, 0.36);
}

.palette-foot {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-top: 1px solid rgba(31, 80, 132, 0.08);
  font-size: 10px;
  color: rgba(22, 41, 63, 0.36);
}

.palette-foot kbd {
  font-family: var(--mc-font-mono);
  font-size: 9px;
  padding: 1px 5px;
  margin-right: 3px;
  border-radius: 3px;
  border: 1px solid rgba(31, 80, 132, 0.12);
  background: rgba(76, 157, 228, 0.06);
  color: rgba(22, 41, 63, 0.44);
}

.palette-foot-tip {
  margin-left: auto;
  color: rgba(22, 41, 63, 0.3);
}

/* ═══════════════════════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .cmd-search-text {
    display: none;
  }
  .cmd-user-meta {
    display: none;
  }
}

@media (max-width: 768px) {
  /* 移动端：侧栏改为抽屉，展开时从左侧滑入 */
  .sider,
  .sider--collapsed {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 252px;
    padding: 12px 10px;
    transform: translateX(-100%);
    transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 330;
    box-shadow: 0 18px 44px rgba(23, 54, 92, 0.18);
  }
  .sider--open,
  .sider--collapsed.sider--open {
    transform: translateX(0);
  }

  /* 抽屉内始终展示完整菜单，不受折叠态影响 */
  .sider--collapsed .sider-brand {
    flex-direction: row;
    padding-bottom: 12px;
  }
  .sider--collapsed .brand-btn {
    justify-content: flex-start;
  }
  .sider--collapsed .nav-parent {
    justify-content: flex-start;
    gap: 10px;
    padding: 0 10px;
  }
  .sider--collapsed .nav-parent-label {
    display: block;
  }
  .sider--collapsed .nav-parent-count {
    display: inline-block;
  }
  .sider--collapsed .nav-parent-arrow {
    display: block;
  }
  .sider--collapsed .sider-manage {
    justify-content: flex-start;
    padding: 0 10px;
  }

  .workspace {
    padding: 8px 8px 0;
    gap: 8px;
  }
  .commandbar {
    height: 48px;
    padding: 0 8px;
    border-radius: 13px;
  }
  .canvas {
    padding: 2px 10px 14px;
  }
  .cmd-trail-group,
  .cmd-trail-sep {
    display: none;
  }
  .cmd-trail-page {
    max-width: 140px;
    font-size: 13px;
  }
  .cmd-app-name {
    max-width: 70px;
  }
}
</style>
