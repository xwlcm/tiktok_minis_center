# 仪表盘模块 — 概览

## 模块职责

集中展示当前应用（`appStore.currentClientKey`）的核心运营指标：用户（DAU / 启动次数 / 新增 / 解锁 / 收入）、广告（IAA / IAP 指标）、趋势图（新增用户 / 活跃用户 / 广告展示 / 广告完成）。

## 二级功能

| 组件 | 文件 | Skill 文件 |
|------|------|------------|
| 用户指标面板 | `views/dashboard/components/UserMetrics.vue` | `dashboard-user-metrics.md` |
| 广告指标面板 | `views/dashboard/components/AdMetrics.vue` | `dashboard-ad-metrics.md` |
| 指标趋势折线 | `views/dashboard/components/TrendChart.vue` | `dashboard-trend-chart.md` |

## 页面路由

- `/dashboard`（路由名 `Dashboard`，权限 `canViewDashboard`）
- 视图：`src/views/dashboard/index.vue`

## 页面结构

```
dashboard
  ├─ dash-header
  │   ├─ dash-header-left   标题 + 应用徽标（绿点 + appName）
  │   └─ dash-header-right  实时数据徽标（红色脉冲点）
  └─ a-spin[loading]
       └─ dashboard-body
            ├─ section "用户指标" + UserMetrics
            ├─ section "广告指标" + AdMetrics
            └─ section 趋势图 TrendChart
```

## 数据模型（`src/types/dashboard.ts`）

```ts
interface TrendPoint {
  date: string
  newUsers: number
  activeUsers: number
  adImpressions: number
  adCompletions: number
  watchDuration: number
}

interface DashboardData {
  totalLaunchCount?: number
  totalDau?: number
  newUserCount?: number
  iaaUnlockCount?: number
  iapUnlockCount?: number
  totalIapRevenue?: number
  sourceDistribution?: Record<string, number>
  valueTierDistribution?: Record<string, number>
  dauTrend?: TrendPoint[]
}
```

## API 端点（`src/api/dashboard.ts`）

所有接口显式带 `clientKey = appStore.currentClientKey`（不走拦截器自动注入）：

| 方法 | 路径 | 参数 |
|------|------|------|
| GET | `/dashboard/overview` | `startDate, endDate, clientKey` |
| GET | `/dashboard/dau` | `statDate, clientKey` |
| GET | `/dashboard/mau` | `clientKey` |
| GET | `/dashboard/new-users` | `statDate, clientKey` |
| GET | `/dashboard/completion-rate` | `startDate, endDate, clientKey` |
| GET | `/dashboard/iap-revenue` | `startDate, endDate, clientKey` |

## 数据加载时机

```ts
async function loadDashboard() {
  if (!appStore.currentClientKey) return
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  dashboardData.value = await fetchDashboard({
    startDate: dateRange.value.startDate || thirtyDaysAgo.toISOString().slice(0, 10),
    endDate:   dateRange.value.endDate   || today.toISOString().slice(0, 10),
  })
}

watch(() => appStore.currentClientKey, loadDashboard)
onMounted(loadDashboard)
```

趋势图子组件通过 `@range-change` 上抛时间区间，父组件重新请求概览。

## 交互

- 应用切换 → 自动重新加载。
- TrendChart 内部时间段 Tab：7 天 / 30 天 / 自定义（`a-range-picker`）。
