# Skill: C 端用户详情

## 功能描述

根据 `openId` 展示用户画像和近期观看趋势。包含基本信息、观看汇总指标、价值分层徽标，以及时长 / 集数双轴趋势图。

## 路由

- 路径：`/user/:id`（路由名 `UserDetail`，`:id` 为 `openId`）
- 视图：`src/views/user/detail.vue`

## 页面结构

```
detail-header       返回按钮 + 标题（昵称）
info-card          画像基本信息（头像 + 昵称 + openId + 注册时间 + 最近活跃）
metrics-grid       总观看时长 / 集数 / 短剧数 / 广告完成率 / 价值分层徽标
trend-card         ECharts 双轴折线图（时长 vs 集数）
```

## 数据获取

```ts
const profile = ref<User | null>(null)
const trend   = ref<UserTrendVO | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    profile.value = await fetchUserProfile(openId)
    trend.value   = await fetchUserTrend(openId)
    drawTrend()
  } finally { loading.value = false }
})
```

## 核心指标

| 指标 | 来源 | 展示 |
|------|------|------|
| 总观看时长 | `totalWatchDurationMs` | `formatDurationDisplay` → `Xm Ys` |
| 观看集数 | `totalEpisodesWatched` | 数字 |
| 观看短剧数 | `totalDramasWatched` | 数字 |
| 广告观看 | `totalAdsWatched` | 数字 |
| 广告完成率 | `adCompletionRate` | 百分比 |
| 价值分层 | `valueTier` | 徽标（高 / 中 / 低 → 不同色） |

## 趋势图（ECharts）

```ts
import { initChart } from '@/utils/echarts'

function drawTrend() {
  const chart = initChart(trendRef.value!)
  chart.setOption({
    xAxis: { type: 'category', data: trend.value!.points.map(p => p.date) },
    yAxis: [
      { type: 'value', name: '时长(分)' },
      { type: 'value', name: '集数' },
    ],
    series: [
      { name: '观看时长', type: 'line', data: trend.value!.points.map(p => p.durationMinutes) },
      { name: '观看集数', type: 'line', yAxisIndex: 1, data: trend.value!.points.map(p => p.episodes) },
    ],
  })
}
```

## API

- `fetchUserProfile(openId)`（自动携带 `tenantId`）
- `fetchUserTrend(openId)`
