<template>
  <div class="layout" :class="{ 'layout--mobile': isMobile, 'layout--overlay': isMobile && !collapsed }">
    <!-- ── 移动端遮罩 ─────────────────────────────── -->
    <transition name="mask-fade">
      <div v-if="isMobile && !collapsed" class="mobile-mask" @click="collapsed = true" />
    </transition>

    <!-- ── 侧边栏 ─────────────────────────────────── -->
    <aside
      class="sider"
      :class="{ 'sider--collapsed': collapsed, 'sider--mobile': isMobile }"
      :style="{
        width: collapsed ? 'var(--mc-sider-collapsed-width)' : 'var(--mc-sider-width)',
        transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
      }"
    >
      <!-- Logo -->
      <AppLogo size="sm" :collapsed="collapsed" class="sider-logo" />

      <!-- ═══ 展开态菜单（正常 inline 模式） ═══ -->
      <nav v-if="!collapsed" class="sider-menu-wrap">
        <a-menu
          v-model:selected-keys="selectedKeys"
          v-model:open-keys="openKeys"
          class="sider-menu"
          @menu-item-click="handleMenuClick"
          @mouseleave="handleMenuLeave"
        >
          <!-- 仪表盘 -->
          <a-menu-item v-if="perms.canViewDashboard" key="/dashboard" @mouseenter="handleMenuHover('/dashboard')">
            <template #icon><icon-dashboard /></template>
            仪表盘
          </a-menu-item>

          <!-- 短剧管理 -->
          <a-sub-menu v-if="perms.canManageDrama" key="drama">
            <template #icon><icon-video-camera /></template>
            <template #title>短剧管理</template>
            <a-menu-item key="/drama/list" @mouseenter="handleMenuHover('/drama/list')">短剧列表</a-menu-item>
            <a-menu-item key="/drama/tags" @mouseenter="handleMenuHover('/drama/tags')">短剧标签</a-menu-item>
            <a-menu-item key="/drama/home-banner" @mouseenter="handleMenuHover('/drama/home-banner')">首页轮播</a-menu-item>
            <a-menu-item key="/drama/home-hot" @mouseenter="handleMenuHover('/drama/home-hot')">热播短剧</a-menu-item>
            <a-menu-item key="/drama/home-rank" @mouseenter="handleMenuHover('/drama/home-rank')">分类排行榜</a-menu-item>
            <a-menu-item key="/drama/home-explore" @mouseenter="handleMenuHover('/drama/home-explore')">更多短剧</a-menu-item>
          </a-sub-menu>

          <!-- 用户列表 -->
          <a-menu-item v-if="perms.canViewUser" key="/user/list" @mouseenter="handleMenuHover('/user/list')">
            <template #icon><icon-user /></template>
            用户列表
          </a-menu-item>

          <!-- 广告投放 -->
          <a-sub-menu v-if="perms.canManageAd" key="ad-delivery">
            <template #icon><icon-send /></template>
            <template #title>广告投放</template>
            <a-menu-item key="/ad/accounts" @mouseenter="handleMenuHover('/ad/accounts')">
              广告账户
            </a-menu-item>
            <a-menu-item key="/ad/report" @mouseenter="handleMenuHover('/ad/report')">
              投放报表
            </a-menu-item>
            <a-menu-item key="/ad/webhook-subscriptions" v-if="FEATURE_DATA_SUBSCRIPTION" @mouseenter="handleMenuHover('/ad/webhook-subscriptions')">
              数据订阅
            </a-menu-item>
            <a-menu-item key="/ad/campaign-mapping" @mouseenter="handleMenuHover('/ad/campaign-mapping')">关联管理</a-menu-item>
            <a-menu-item key="/ad/naming-template" @mouseenter="handleMenuHover('/ad/naming-template')">命名模板</a-menu-item>
          </a-sub-menu>

          <!-- 数据分析 -->
          <a-sub-menu v-if="perms.canManageAd" key="ad-analytics">
            <template #icon><icon-bar-chart /></template>
            <template #title>数据分析</template>
            <a-menu-item key="/ad/analytics-dashboard" @mouseenter="handleMenuHover('/ad/analytics-dashboard')">数据看板</a-menu-item>
            <a-menu-item key="/ad/alerts" v-if="FEATURE_ALERT_CENTER" @mouseenter="handleMenuHover('/ad/alerts')">预警中心</a-menu-item>
            <a-menu-item key="/ad/alert-rules" v-if="FEATURE_ALERT_RULES" @mouseenter="handleMenuHover('/ad/alert-rules')">预警规则</a-menu-item>
          </a-sub-menu>

          <!-- 广告变现 -->
          <a-sub-menu v-if="perms.canManageAd" key="ad-monetize">
            <template #icon><icon-thunderbolt /></template>
            <template #title>广告变现</template>
            <a-menu-item key="/ad/list" @mouseenter="handleMenuHover('/ad/list')">广告列表</a-menu-item>
            <a-menu-item key="/ad/push-settings" @mouseenter="handleMenuHover('/ad/push-settings')">推送规则</a-menu-item>
            <a-menu-item key="/ad/force-rule" @mouseenter="handleMenuHover('/ad/force-rule')">强弹规则</a-menu-item>
            <a-menu-item key="/ad/force-whitelist" @mouseenter="handleMenuHover('/ad/force-whitelist')">强弹白名单</a-menu-item>
            <a-menu-item key="/ad/callback-rules" v-if="FEATURE_CALLBACK_RULES" @mouseenter="handleMenuHover('/ad/callback-rules')">回传规则</a-menu-item>
            <a-menu-item key="/ad/callback-logs" v-if="FEATURE_CALLBACK_LOGS" @mouseenter="handleMenuHover('/ad/callback-logs')">回传日志</a-menu-item>
          </a-sub-menu>

          <!-- 智能算法 -->
          <a-sub-menu v-if="perms.canManageAd" key="ad-algorithm">
            <template #icon><icon-robot /></template>
            <template #title>智能算法</template>
            <a-menu-item key="/ad/analytics" @mouseenter="handleMenuHover('/ad/analytics')">算法分析</a-menu-item>
            <a-menu-item key="/ad/algorithm-status" @mouseenter="handleMenuHover('/ad/algorithm-status')">算法状态</a-menu-item>
            <a-menu-item key="/ad/push-logs" @mouseenter="handleMenuHover('/ad/push-logs')">推送日志</a-menu-item>
            <a-menu-item key="/ad/algorithm-config" @mouseenter="handleMenuHover('/ad/algorithm-config')">参数配置</a-menu-item>
          </a-sub-menu>

          <!-- 系统管理 -->
          <a-sub-menu v-if="perms.canManageAccounts" key="system">
            <template #icon><icon-settings /></template>
            <template #title>系统管理</template>
            <a-menu-item key="/system/user" @mouseenter="handleMenuHover('/system/user')">用户管理</a-menu-item>
            <a-menu-item key="/system/role" @mouseenter="handleMenuHover('/system/role')">角色管理</a-menu-item>
            <a-menu-item key="/system/app" @mouseenter="handleMenuHover('/system/app')">应用管理</a-menu-item>
            <a-menu-item key="/system/data-init" @mouseenter="handleMenuHover('/system/data-init')">数据初始化</a-menu-item>
          </a-sub-menu>
        </a-menu>
      </nav>

      <!-- ═══ 折叠态菜单（图标 + Popover 弹出子菜单） ═══ -->
      <nav v-else class="sider-menu-wrap sider-menu-wrap--collapsed">
        <div class="collapsed-menu">
          <!-- 仪表盘 -->
          <a-tooltip v-if="perms.canViewDashboard" position="right" :mini="true" background-color="rgba(10,13,22,0.97)">
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': selectedKeys.includes('/dashboard') }"
              @click="handleMenuClick('/dashboard')"
              @mouseenter="handleMenuHover('/dashboard')"
            >
              <icon-dashboard />
            </div>
            <template #content>仪表盘</template>
          </a-tooltip>

          <!-- 短剧管理 -->
          <a-popover
            v-if="perms.canManageDrama"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('drama') }"
            >
              <icon-video-camera />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">短剧管理</div>
                <div
                  v-for="item in dramaChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>

          <!-- 用户列表 -->
          <a-tooltip v-if="perms.canViewUser" position="right" :mini="true" background-color="rgba(10,13,22,0.97)">
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': selectedKeys.includes('/user/list') }"
              @click="handleMenuClick('/user/list')"
              @mouseenter="handleMenuHover('/user/list')"
            >
              <icon-user />
            </div>
            <template #content>用户列表</template>
          </a-tooltip>

          <!-- 广告投放 -->
          <a-popover
            v-if="perms.canManageAd"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('ad-delivery') }"
            >
              <icon-send />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">广告投放</div>
                <div
                  v-for="item in adDeliveryChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>

          <!-- 数据分析 -->
          <a-popover
            v-if="perms.canManageAd"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('ad-analytics') }"
            >
              <icon-bar-chart />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">数据分析</div>
                <div
                  v-for="item in adAnalyticsChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>

          <!-- 广告变现 -->
          <a-popover
            v-if="perms.canManageAd"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('ad-monetize') }"
            >
              <icon-thunderbolt />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">广告变现</div>
                <div
                  v-for="item in adMonetizeChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>

          <!-- 智能算法 -->
          <a-popover
            v-if="perms.canManageAd"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('ad-algorithm') }"
            >
              <icon-robot />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">智能算法</div>
                <div
                  v-for="item in adAlgorithmChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>

          <!-- 系统管理 -->
          <a-popover
            v-if="perms.canManageAccounts"
            position="right"
            trigger="hover"
            :show-arrow="false"
            :arrow-style="{ display: 'none' }"
            :content-style="POPOVER_CONTENT_STYLE"
          >
            <div
              class="collapsed-item"
              :class="{ 'collapsed-item--active': isGroupActive('system') }"
            >
              <icon-settings />
            </div>
            <template #content>
              <div class="popover-submenu">
                <div class="popover-submenu-title">系统管理</div>
                <div
                  v-for="item in systemChildren"
                  :key="item.key"
                  class="popover-submenu-item"
                  :class="{ 'popover-submenu-item--active': selectedKeys.includes(item.key) }"
                  @click="handleMenuClick(item.key)"
                  @mouseenter="handleMenuHover(item.key)"
                >
                  {{ item.label }}
                </div>
              </div>
            </template>
          </a-popover>
        </div>
      </nav>

      <!-- 折叠按钮 -->
      <div class="sider-footer">
        <button class="collapse-btn" @click="toggleCollapse">
          <icon-menu-fold v-if="!collapsed" />
          <icon-menu-unfold v-else />
        </button>
      </div>
    </aside>

    <!-- ── 主内容区 ────────────────────────────────── -->
    <main
      class="main"
      :style="{
        marginLeft: isMobile ? '0' : (collapsed ? 'var(--mc-sider-collapsed-width)' : 'var(--mc-sider-width)'),
      }"
    >
      <!-- 顶部导航 -->
      <header class="header">
        <div class="header-left">
          <!-- 移动端汉堡按钮 -->
          <button v-if="isMobile" class="mobile-menu-btn" @click="collapsed = false">
            <icon-menu />
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-home">首页</span>
            <span class="breadcrumb-sep">/</span>
            <span class="breadcrumb-current">{{ currentTitle }}</span>
          </div>
        </div>

        <div class="header-right">
          <!-- 应用切换（仅 admin） -->
          <AppSwitcher v-if="perms.canSwitchApp" />
          <!-- 非 admin 显示当前应用名（只读） -->
          <div v-else class="app-readonly">
            <div class="app-readonly-dot" ></div>
            <span class="app-readonly-name">{{ appStore.currentApp?.appName ?? '—' }}</span>
          </div>

          <div class="header-divider" ></div>

          <!-- 用户信息 + 角色 -->
          <a-dropdown>
            <div class="user-btn">
              <a-avatar :size="28" class="user-avatar" :style="{ background: roleColor }">
                {{ accountStore.current?.nickName?.[0]?.toUpperCase() ?? accountStore.current?.userName?.[0]?.toUpperCase() ?? 'A' }}
              </a-avatar>
              <div class="user-info">
                <span class="user-name">{{ accountStore.current?.nickName ?? accountStore.current?.userName ?? 'Admin' }}</span>
                <span class="user-role-tag text-center" :class="`user-role-tag--${accountStore.role}`">
                  {{ roleLabel }}
                </span>
              </div>
              <icon-down class="user-arrow" />
            </div>
            <template #content>
              <a-doption @click="handleLogout">
                <template #icon><icon-export /></template>退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="content">
        <router-view v-slot="{ Component, route }">
          <keep-alive v-if="Component && !route.meta.refreshOnMenuSwitch" :include="/./">
            <component
              :is="Component"
              :key="route.path"
            />
          </keep-alive>
          <component
            v-else-if="Component && route.meta.refreshOnMenuSwitch"
            :is="Component"
            :key="route.fullPath"
          />
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import AppSwitcher from '@/components/AppSwitcher/index.vue'
import AppLogo from '@/components/AppLogo/index.vue'
import { useAccountStore } from '@/stores/account.ts'
import { useAppStore } from '@/stores/app.ts'
import { logout } from '@/api/auth.ts'
import { prefetchOnHover, cancelHoverPrefetch } from '@/utils/route-prefetch.ts'

const router = useRouter()
const route = useRoute()

// ── 功能开关：暂未完善的模块默认隐藏，设为 true 即可开启 ──
const FEATURE_DATA_SUBSCRIPTION = false   // 数据订阅
const FEATURE_ALERT_CENTER = false        // 预警中心
const FEATURE_ALERT_RULES = false         // 预警规则
const FEATURE_CALLBACK_RULES = false      // 回传规则
const FEATURE_CALLBACK_LOGS = false       // 回传日志

// ── 错误边界：捕获 Arco Design <a-sub-menu> 在 keep-alive 路由切换时的内部 slot 错误 ──
// 注意：只对已知的 Arco Menu 内部错误返回 false（阻止传播），
// 其他错误正常抛出，避免页面静默失败没有任何提示。
onErrorCaptured((err, _instance, info) => {
  const msg = err?.message ?? ''
  if (
    msg.includes('parentNode') ||
    msg.includes('__vnode') ||
    msg.includes('expand-icon') ||
    (msg.includes('slot') && msg.includes('invoked outside'))
  ) {
    console.warn('[BasicLayout] Arco Menu slot error suppressed:', msg)
    return false
  }
  // 非 Arco 内部错误：打印日志并继续传播，让全局错误处理能感知
  console.error('[BasicLayout] Unhandled error:', err, 'info:', info)
})
const accountStore = useAccountStore()
const appStore = useAppStore()

// ── 响应式断点 ──
const MOBILE_BREAKPOINT = 768
const isMobile = ref(window.innerWidth < MOBILE_BREAKPOINT)

// 侧边栏折叠状态持久化到 localStorage，避免组件重新创建时重置
const SIDER_COLLAPSED_KEY = 'sider_collapsed'
const savedCollapsed = localStorage.getItem(SIDER_COLLAPSED_KEY)
const collapsed = ref(savedCollapsed !== null ? savedCollapsed === 'true' : window.innerWidth < 1024)

// 侧边栏当前宽度（用于主内容区 width 计算）
const siderWidth = computed(() => {
  if (isMobile.value) return '0px'
  return collapsed.value ? '56px' : '220px'
})

// 菜单展开状态持久化到 localStorage
const SIDER_OPEN_KEYS_KEY = 'sider_open_keys'
const savedOpenKeys = localStorage.getItem(SIDER_OPEN_KEYS_KEY)

function parseSavedOpenKeys(value: string | null, fallback: string[]): string[] {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : fallback
  } catch {
    return fallback
  }
}

// ── 子菜单数据（折叠态 Popover 用） ──
const dramaChildren = [
  { key: '/drama/list', label: '短剧列表' },
  { key: '/drama/tags', label: '短剧标签' },
  { key: '/drama/home-banner', label: '首页轮播' },
  { key: '/drama/home-hot', label: '热播短剧' },
  { key: '/drama/home-rank', label: '分类排行榜' },
  { key: '/drama/home-explore', label: '更多短剧' },
]

const adDeliveryChildren = [
  { key: '/ad/accounts', label: '广告账户' },
  { key: '/ad/report', label: '投放报表' },
  ...(FEATURE_DATA_SUBSCRIPTION ? [{ key: '/ad/webhook-subscriptions', label: '数据订阅' }] : []),
  { key: '/ad/campaign-mapping', label: '关联管理' },
  { key: '/ad/naming-template', label: '命名模板' },
]

const adAnalyticsChildren = [
  { key: '/ad/analytics-dashboard', label: '数据看板' },
  ...(FEATURE_ALERT_CENTER ? [{ key: '/ad/alerts', label: '预警中心' }] : []),
  ...(FEATURE_ALERT_RULES ? [{ key: '/ad/alert-rules', label: '预警规则' }] : []),
]

const adMonetizeChildren = [
  { key: '/ad/list', label: '广告列表' },
  { key: '/ad/push-settings', label: '推送规则' },
  { key: '/ad/force-rule', label: '强弹规则' },
  { key: '/ad/force-whitelist', label: '强弹白名单' },
  ...(FEATURE_CALLBACK_RULES ? [{ key: '/ad/callback-rules', label: '回传规则' }] : []),
  ...(FEATURE_CALLBACK_LOGS ? [{ key: '/ad/callback-logs', label: '回传日志' }] : []),
]

const adAlgorithmChildren = [
  { key: '/ad/analytics', label: '算法分析' },
  { key: '/ad/algorithm-status', label: '算法状态' },
  { key: '/ad/push-logs', label: '推送日志' },
  { key: '/ad/algorithm-config', label: '参数配置' },
]

const systemChildren = [
  { key: '/system/user', label: '用户管理' },
  { key: '/system/role', label: '角色管理' },
  { key: '/system/app', label: '应用管理' },
  { key: '/system/data-init', label: '数据初始化' },
]

// ── Popover 公共样式常量 ──
const POPOVER_CONTENT_STYLE = {
  padding: '4px',
  background: 'rgba(10, 13, 22, 0.97)',
  border: '1px solid rgba(92, 189, 197, 0.10)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(92,189,197,0.04)',
  backdropFilter: 'blur(24px)',
  minWidth: '160px',
}

// ── 分组 → 子路径映射（从 menu children 数据派生，避免硬编码重复） ──
const groupPathMap: Record<string, string[]> = {
  drama: dramaChildren.map(c => c.key),
  'ad-delivery': adDeliveryChildren.map(c => c.key),
  'ad-analytics': adAnalyticsChildren.map(c => c.key),
  'ad-monetize': adMonetizeChildren.map(c => c.key),
  'ad-algorithm': adAlgorithmChildren.map(c => c.key),
  system: systemChildren.map(c => c.key),
}

// 路径 → 分组反向索引 (O(1) 查找)
const pathGroupIndex: Record<string, string> = {}
for (const [group, paths] of Object.entries(groupPathMap)) {
  for (const p of paths) {
    pathGroupIndex[p] = group
  }
}

function getOpenKeys(path: string): string[] {
  return pathGroupIndex[path] ? [pathGroupIndex[path]] : []
}

// ── 非菜单路由 → 父级菜单 key 映射 ──
// 当用户导航到详情页等非菜单路由时，将菜单选中态映射到其父级菜单项
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

const selectedKeys = ref<string[]>([resolveMenuKey(route.path)])
const openKeys = ref<string[]>(parseSavedOpenKeys(savedOpenKeys, getOpenKeys(resolveMenuKey(route.path))))

// 折叠态下判断当前路由是否属于某个分组（用于父级图标高亮）
function isGroupActive(group: string): boolean {
  const paths = groupPathMap[group]
  if (!paths) return false
  return paths.includes(resolveMenuKey(route.path))
}

const currentTitle = computed(() => (route.meta?.title as string) ?? '')
const perms = computed(() => accountStore.menuPerms)

const roleLabel = computed(() => {
  return { admin: '管理员', operator: '运营', viewer: '观察者' }[accountStore.role] ?? accountStore.role
})
const roleColor = computed(() => {
  return { admin: '#E0486D', operator: '#5CBDC5', viewer: '#9B7EC4' }[accountStore.role] ?? '#86909c'
})

watch(() => route.path, (path) => {
  const menuKey = resolveMenuKey(path)
  selectedKeys.value = [menuKey]
})

// 持久化折叠状态
watch(collapsed, (val) => {
  localStorage.setItem(SIDER_COLLAPSED_KEY, String(val))
})

// 持久化展开状态
watch(openKeys, (val) => {
  localStorage.setItem(SIDER_OPEN_KEYS_KEY, JSON.stringify(val))
}, { deep: true })

function handleMenuClick(key: string) {
  if (!key.startsWith('/')) return
  if (route.path === key) return
  router.push(key)
  // 移动端点击后自动收起侧边栏
  if (isMobile.value) {
    collapsed.value = true
  }
}

function handleMenuHover(key: string) {
  prefetchOnHover(key)
}

function handleMenuLeave() {
  cancelHoverPrefetch()
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

async function handleLogout() {
  try {
    await logout()
  } catch {
    // 即使 API 调用失败也继续清理本地状态
  }
  localStorage.removeItem('token')
  localStorage.removeItem('client_id')
  accountStore.clear()
  appStore.clear()
  Message.success('已退出登录')
  router.push('/login')
}

// ─── 响应式处理 ─────────────────────────────────────
let lastWidth = window.innerWidth
function handleResize() {
  const w = window.innerWidth
  const wasMobile = isMobile.value
  isMobile.value = w < MOBILE_BREAKPOINT

  // 只在跨越断点时自动调整折叠状态，避免每次 resize 都强制重置
  const crossedMobile = wasMobile !== isMobile.value
  const crossedTablet = (lastWidth < 1024) !== (w < 1024)

  if (crossedMobile || crossedTablet) {
    if (w < MOBILE_BREAKPOINT) {
      collapsed.value = true
    } else if (w < 1024) {
      collapsed.value = true
    } else {
      // 桌面端（>1024px）自动展开侧边栏
      collapsed.value = false
    }
  }
  lastWidth = w
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   整体布局
   ═══════════════════════════════════════════════════════════ */
.layout {
  height: 100%;
  width: 100%;
  min-height: 100vh;
  background: var(--mc-bg-page);
  display: flex;
}

/* ═══════════════════════════════════════════════════════════
   移动端遮罩
   ═══════════════════════════════════════════════════════════ */
.mobile-mask {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.mask-fade-enter-active { transition: opacity 0.25s ease; }
.mask-fade-leave-active { transition: opacity 0.2s ease; }
.mask-fade-enter-from,
.mask-fade-leave-to { opacity: 0; }

/* ═══════════════════════════════════════════════════════════
   侧边栏 — 深空玻璃风格
   ═══════════════════════════════════════════════════════════ */
.sider {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 200;
  background: linear-gradient(
    180deg,
    rgba(10, 13, 22, 0.97) 0%,
    rgba(8, 10, 18, 0.95) 50%,
    rgba(10, 13, 22, 0.97) 100%
  );
  backdrop-filter: blur(24px) saturate(1.1);
  -webkit-backdrop-filter: blur(24px) saturate(1.1);
  border-right: 1px solid rgba(92, 189, 197, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.sider::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(92, 189, 197, 0.12) 30%,
    rgba(92, 189, 197, 0.08) 70%,
    transparent 100%
  );
  pointer-events: none;
}

/* 移动端侧边栏浮层 */
.sider--mobile {
  box-shadow: 4px 0 32px rgba(0, 0, 0, 0.6), 0 0 60px rgba(92, 189, 197, 0.04);
}

/* ═══════════════════════════════════════════════════════════
   Logo（侧边栏）
   ═══════════════════════════════════════════════════════════ */
.sider-logo {
  height: var(--mc-header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(92, 189, 197, 0.06);
  flex-shrink: 0;
  overflow: hidden;
  background: rgba(92, 189, 197, 0.02);
  transition: padding 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sider-logo:deep(.app-logo--collapsed) {
  padding: 0;
}
.sider-logo:deep(.app-logo__icon) {
  filter: drop-shadow(0 1px 6px rgba(92, 189, 197, 0.3));
}

/* ═══════════════════════════════════════════════════════════
   菜单容器
   ═══════════════════════════════════════════════════════════ */
.sider-menu-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── 展开态 Arco 菜单样式 ── */
.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu) {
  background: transparent !important;
  border-right: none !important;
}
.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-light) {
  background: transparent !important;
}
.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-inner) {
  background: transparent !important;
  padding: 10px 0 !important;
}

.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-item) {
  background-color: transparent !important;
  border-radius: 8px !important;
  margin: 2px 10px !important;
  font-size: 13px !important;
  font-family: var(--mc-font-family) !important;
  letter-spacing: 0.01em !important;
  position: relative !important;
}

.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-inline-header) {
  background-color: transparent !important;
  border-radius: 8px !important;
  margin: 2px 10px !important;
  font-size: 13px !important;
  font-family: var(--mc-font-family) !important;
  letter-spacing: 0.01em !important;
  position: relative !important;
}

.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-icon) {
  color: inherit !important;
  font-size: 16px !important;
}
.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-icon-suffix) {
  color: rgba(92, 189, 197, 0.25) !important;
}

.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-inline-content) {
  background: transparent !important;
}

.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-item.arco-menu-selected) {
  background: rgba(92, 189, 197, 0.08) !important;
  box-shadow: inset 3px 0 0 #5CBDC5 !important;
}
.sider-menu-wrap:not(.sider-menu-wrap--collapsed) :deep(.arco-menu-item.arco-menu-selected)::after {
  content: '';
  position: absolute;
  left: 2px; top: 4px; bottom: 4px;
  width: 2px;
  background: #5CBDC5;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 10px rgba(92,189,197,0.5), 0 0 20px rgba(92,189,197,0.25);
  opacity: 0.6;
  pointer-events: none;
}

/* ═══════════════════════════════════════════════════════════
   折叠态菜单
   ═══════════════════════════════════════════════════════════ */
.collapsed-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  gap: 6px;
}

.collapsed-item {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.40);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
}
.collapsed-item:hover {
  background: rgba(92, 189, 197, 0.06);
  color: rgba(255, 255, 255, 0.85);
  transform: scale(1.05);
}
.collapsed-item--active {
  background: rgba(92, 189, 197, 0.10);
  color: #5CBDC5;
  box-shadow: 0 0 12px rgba(92, 189, 197, 0.35);
}
.collapsed-item--active::before {
  content: '';
  position: absolute;
  left: -9px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px;
  background: linear-gradient(180deg, #5CBDC5, rgba(92, 189, 197, 0.4));
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 10px rgba(92, 189, 197, 0.4);
}

/* ═══════════════════════════════════════════════════════════
   Popover 子菜单（折叠态弹出）
   ═══════════════════════════════════════════════════════════ */
.popover-submenu {
  padding: 4px 0;
}
.popover-submenu-title {
  padding: 6px 12px 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(92, 189, 197, 0.50);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.popover-submenu-item {
  padding: 7px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 1px 4px;
  position: relative;
}
.popover-submenu-item:hover {
  background: rgba(92, 189, 197, 0.06);
  color: rgba(255, 255, 255, 0.90);
}
.popover-submenu-item--active {
  color: #5CBDC5;
  font-weight: 500;
  background: rgba(92, 189, 197, 0.08);
  box-shadow: inset 2px 0 0 #5CBDC5;
}

/* ═══════════════════════════════════════════════════════════
   折叠按钮
   ═══════════════════════════════════════════════════════════ */
.sider-footer {
  height: 48px;
  display: flex; align-items: center; justify-content: center;
  border-top: 1px solid rgba(92, 189, 197, 0.06);
  background: rgba(92, 189, 197, 0.02);
  flex-shrink: 0;
}
.collapse-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(92, 189, 197, 0.30);
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapse-btn:hover {
  background: rgba(92, 189, 197, 0.08);
  color: rgba(92, 189, 197, 0.70);
}

/* ═══════════════════════════════════════════════════════════
   主内容区
   ═══════════════════════════════════════════════════════════ */
.main {
  flex: 1;
  height: 100%;
  min-height: 100vh;
  background: var(--mc-bg-page);
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: auto;
  max-width: calc(100% - v-bind(siderWidth));
}

/* ── 顶部导航 ── */
.header {
  height: var(--mc-header-height);
  background: rgba(10, 13, 22, 0.88);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border-bottom: 1px solid rgba(92, 189, 197, 0.06);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  position: sticky; top: 0; z-index: 100;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 10px; }

/* 移动端汉堡按钮 */
.mobile-menu-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.65);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.18s, color 0.18s;
  flex-shrink: 0;
}
.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.90);
}

.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; font-family: var(--mc-font-family); }
.breadcrumb-home { color: rgba(255, 255, 255, 0.30); font-weight: 500; }
.breadcrumb-sep  { color: rgba(255, 255, 255, 0.12); font-size: 11px; }
.breadcrumb-current { color: rgba(255, 255, 255, 0.85); font-weight: 600; letter-spacing: 0.01em; }

.header-right { display: flex; align-items: center; gap: 8px; }
.header-divider { width: 1px; height: 18px; background: rgba(255, 255, 255, 0.08); margin: 0 4px; flex-shrink: 0; }

/* 只读应用名 */
.app-readonly {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
}
.app-readonly-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #36D399;
  box-shadow: 0 0 6px rgba(54, 211, 153, 0.5);
}
.app-readonly-name {
  font-size: 13px; font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  max-width: 140px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 用户按钮 */
.user-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.18s;
}
.user-btn:hover { background: rgba(255, 255, 255, 0.06); }
.user-info { display: flex; flex-direction: column; gap: 1px; }
.user-name { font-size: 13px; color: rgba(255, 255, 255, 0.88); font-weight: 600; line-height: 1.2; font-family: var(--mc-font-family); }
.user-role-tag {
  font-size: 10px; font-weight: 600;
  padding: 0 6px; border-radius: 4px; line-height: 16px;
  letter-spacing: 0.02em;
}
.user-role-tag--admin    { background: rgba(224, 72, 109, 0.18);  color: #E0486D; }
.user-role-tag--operator { background: rgba(92, 189, 197, 0.18); color: #5CBDC5; }
.user-role-tag--viewer   { background: rgba(155, 126, 196, 0.18);  color: #9B7EC4; }
.user-arrow { font-size: 11px; color: rgba(255, 255, 255, 0.25); }

/* ── 内容区 ── */
.content {
  flex: 1;
  padding: var(--mc-content-padding);
  background: var(--mc-bg-page);
  min-width: 0;
  width: 100%;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── 页面切换过渡 ── */


/* ═══════════════════════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  .content {
    padding: 12px;
  }
  .user-info {
    display: none;
  }
  .app-readonly-name {
    max-width: 80px;
  }
}
</style>
