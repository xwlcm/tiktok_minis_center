import { createRouter, createWebHistory } from 'vue-router'
import { useAccountStore } from '@/stores/account.ts'
import { useAppStore } from '@/stores/app.ts'
import { useLoadingStore } from '@/stores/loading.ts'
import { cancelAllPendingRequests } from '@/utils/request.ts'

const DRAMA_MENU_META = { refreshOnMenuSwitch: true }

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '无权限', public: true },
    },
    {
      path: '/oauth-callback',
      name: 'OAuthCallback',
      component: () => import('@/views/ad/oauth-callback.vue'),
      meta: { title: 'OAuth 授权中...', public: false },
    },
    {
      path: '/',
      component: () => import('@/layouts/BasicLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'drama/list',
          name: 'DramaList',
          component: () => import('@/views/drama/index.vue'),
          meta: { title: '短剧列表', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/upload',
          name: 'DramaUpload',
          component: () => import('@/views/drama/upload.vue'),
          meta: { title: '上传短剧' },
        },
        {
          path: 'drama/:id',
          name: 'DramaDetail',
          component: () => import('@/views/drama/detail.vue'),
          meta: { title: '短剧详情' },
        },
        {
          path: 'drama/tags',
          name: 'DramaTags',
          component: () => import('@/views/drama/tags.vue'),
          meta: { title: '短剧标签', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/home-banner',
          name: 'HomeBanner',
          component: () => import('@/views/drama/home-banner.vue'),
          meta: { title: '首页轮播', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/home-hot',
          name: 'HomeHot',
          component: () => import('@/views/drama/home-hot.vue'),
          meta: { title: '热播短剧', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/home-rank',
          name: 'HomeRank',
          component: () => import('@/views/drama/home-rank.vue'),
          meta: { title: '分类排行榜', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/home-explore',
          name: 'HomeExplore',
          component: () => import('@/views/drama/home-explore.vue'),
          meta: { title: '更多短剧', ...DRAMA_MENU_META },
        },
        {
          path: 'drama/ad-settings',
          name: 'DramaAdSettings',
          component: () => import('@/views/drama/ad-settings.vue'),
          meta: { title: '广告推送设置' },
        },
        {
          path: 'user/list',
          name: 'UserList',
          component: () => import('@/views/user/index.vue'),
          meta: { title: '用户列表' },
        },
        {
          path: 'user/:id',
          name: 'UserDetail',
          component: () => import('@/views/user/detail.vue'),
          meta: { title: '用户详情' },
        },
        {
          path: 'ad/report',
          name: 'AdReport',
          component: () => import('@/views/ad/ad-report.vue'),
          meta: { title: '投放报表' },
        },
        {
          path: 'ad/analytics-dashboard',
          name: 'AnalyticsDashboard',
          component: () => import('@/views/ad/analytics-dashboard.vue'),
          meta: { title: '数据看板' },
        },
        {
          path: 'ad/list',
          name: 'AdList',
          component: () => import('@/views/ad/index.vue'),
          meta: { title: '广告列表' },
        },
        {
          path: 'ad/push-settings',
          name: 'AdPushSettings',
          component: () => import('@/views/ad/push-settings.vue'),
          meta: { title: '推送设置' },
        },
        {
          path: 'ad/force-rule',
          name: 'AdForceRule',
          component: () => import('@/views/ad/force-ad-rule.vue'),
          meta: { title: '强弹规则' },
        },
        {
          path: 'ad/force-whitelist',
          name: 'AdForceWhitelist',
          component: () => import('@/views/ad/force-whitelist.vue'),
          meta: { title: '强弹白名单' },
        },
        {
          path: 'ad/callback-rules',
          name: 'AdCallbackRules',
          component: () => import('@/views/ad/callback-rules.vue'),
          meta: { title: '回传规则' },
        },
        {
          path: 'ad/callback-logs',
          name: 'AdCallbackLogs',
          component: () => import('@/views/ad/callback-logs.vue'),
          meta: { title: '回传日志' },
        },
        {
          path: 'ad/analytics',
          name: 'AdAnalytics',
          component: () => import('@/views/ad/analytics.vue'),
          meta: { title: '算法分析' },
        },
        {
          path: 'ad/algorithm-status',
          name: 'AdAlgorithmStatus',
          component: () => import('@/views/ad/algorithm-status.vue'),
          meta: { title: '算法状态' },
        },
        {
          path: 'ad/push-logs',
          name: 'AdPushLogs',
          component: () => import('@/views/ad/push-logs.vue'),
          meta: { title: '推送日志' },
        },
        {
          path: 'ad/algorithm-config',
          name: 'AdAlgorithmConfig',
          component: () => import('@/views/ad/algorithm-config.vue'),
          meta: { title: '参数配置' },
        },

        {
          path: 'ad/webhook-subscriptions',
          name: 'AdWebhookSubscriptions',
          component: () => import('@/views/ad/webhook-subscriptions.vue'),
          meta: { title: '数据订阅' },
        },
        {
          path: 'ad/naming-template',
          name: 'AdNamingTemplate',
          component: () => import('@/views/ad/naming-template.vue'),
          meta: { title: '命名模板' },
        },
        {
          path: 'ad/campaign-mapping',
          name: 'AdCampaignMapping',
          component: () => import('@/views/ad/campaign-mapping.vue'),
          meta: { title: '关联管理' },
        },
        {
          path: 'system/user',
          name: 'SystemUser',
          component: () => import('@/views/account/index.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'system/role',
          name: 'SystemRole',
          component: () => import('@/views/account/role.vue'),
          meta: { title: '角色管理' },
        },
        {
          path: 'system/app',
          name: 'SystemApp',
          component: () => import('@/views/app/index.vue'),
          meta: { title: '应用管理' },
        },
        {
          path: 'system/data-init',
          name: 'DataInit',
          component: () => import('@/views/system/data-init.vue'),
          meta: { title: '数据初始化' },
        },
        {
          path: 'system/modules',
          name: 'SystemModules',
          component: () => import('@/views/system/modules/index.vue'),
          meta: { title: '模块管理' },
        },

        {
          path: 'ad/drama-roi',
          name: 'AdDramaRoi',
          component: () => import('@/views/ad/drama-roi.vue'),
          meta: { title: '剧 ROI' },
        },
        {
          path: 'ad/creative-fatigue',
          name: 'AdCreativeFatigue',
          component: () => import('@/views/ad/creative-fatigue.vue'),
          meta: { title: '素材疲劳度' },
        },
        {
          path: 'ad/geo-analysis',
          name: 'AdGeoAnalysis',
          component: () => import('@/views/ad/geo-analysis.vue'),
          meta: { title: '地域分析' },
        },
        {
          path: 'ad/alerts',
          name: 'AdAlerts',
          component: () => import('@/views/ad/alerts.vue'),
          meta: { title: '预警中心' },
        },
        {
          path: 'ad/alert-rules',
          name: 'AdAlertRules',
          component: () => import('@/views/ad/alert-rules.vue'),
          meta: { title: '预警规则' },
        },
        {
          path: 'ad/accounts',
          name: 'AdAccounts',
          component: () => import('@/views/ad/ad-accounts.vue'),
          meta: { title: '广告账户' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  // 路由切换时取消上一页面的所有未完成请求
  cancelAllPendingRequests()

  const loadingStore = useLoadingStore()
  loadingStore.start()

  if (to.query.auth_code || to.query.code) {
    const authCode = (to.query.auth_code || to.query.code) as string
    const state = to.query.state as string
    if (authCode && state && to.path !== '/oauth-callback') {
      next({ path: '/oauth-callback', query: { auth_code: authCode, state }, replace: true })
      return
    }
  }

  if (to.meta.public) {
    next()
    return
  }

  const token = localStorage.getItem('token')
  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  const accountStore = useAccountStore()
  const appStore = useAppStore()

  if (!accountStore.isLoggedIn) {
    try {
      await accountStore.loadFromServer()
      await appStore.loadFromAccountStore()
      import('@/utils/route-prefetch.ts').then(({ prefetchAfterLogin }) => prefetchAfterLogin())
    } catch (err) {
      console.error('[Router Guard] 初始化失败:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('client_id')
      accountStore.clear()
      appStore.clear()
      loadingStore.finish()
      next('/login')
      return
    }
  }

  next()
})

router.afterEach(() => {
  const loadingStore = useLoadingStore()
  loadingStore.finish()
})

export default router
