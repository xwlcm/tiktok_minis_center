# Skill: 广告指标面板（AdMetrics）

## 定位

`src/views/dashboard/components/AdMetrics.vue`：仪表盘广告区域，渲染 4 张卡片。

## Props

```ts
defineProps<{ data: DashboardData | null }>()
```

## 指标卡配置

| 卡片 | 数据 | 副标题 | 色值 | 图标 |
|------|------|--------|------|------|
| IAA 解锁次数 | `iaaUnlockCount` | 广告解锁 | `#5BA8B0` 青 | `icon-eye` |
| IAP 解锁次数 | `iapUnlockCount` | 付费解锁 | `#3DB87A` 绿 | `icon-check-circle` |
| IAP 收入 | `'$' + totalIapRevenue.toFixed(2)` | 美元收益 | `#8B6AAE` 紫 | `icon-bar-chart` |
| 启动次数 | `totalLaunchCount` | 总启动 | `#D4913A` 橙 | `icon-trophy` |

## 数字格式化

与 UserMetrics 保持一致：

```ts
function fmt(n?: number): string {
  if (n == null) return '—'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n.toLocaleString()
}
```

## 布局

- Grid：`repeat(4, 1fr)`，响应式：
  - `≤1024px` → 2 列
  - `≤480px` → 1 列
- 卡片样式：与 UserMetrics 同源，顶部渐变发光线、悬停上浮发光。
- IAP 收入金额前缀 `$` 用 `ad-currency` 类（18 px，60% 透明度）以弱化。
