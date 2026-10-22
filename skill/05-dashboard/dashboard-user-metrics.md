# Skill: 用户指标面板（UserMetrics）

## 定位

`src/views/dashboard/components/UserMetrics.vue`：仪表盘用户区域，渲染 6 张指标卡。

## Props

```ts
defineProps<{ data: DashboardData | null }>()
```

## 指标卡配置

| 卡片 | 数据源 | 色值 | 图标 |
|------|--------|------|------|
| DAU | `totalDau` | `#5BA8B0` 青 | `icon-user-group` |
| 启动次数 | `totalLaunchCount` | `#3DB87A` 绿 | `icon-user-add` |
| 新增用户 | `newUserCount` | `#3498DB` 蓝 | `icon-calendar` |
| IAA 解锁 | `iaaUnlockCount` | `#8B6AAE` 紫 | `icon-fire` |
| IAP 解锁 | `iapUnlockCount` | `#D4913A` 橙 | `icon-clock-circle` |
| IAP 收入 | `'$' + totalIapRevenue.toFixed(2)` | `#D94466` 红 | `icon-play-circle` |

## 数字格式化

```ts
function fmt(n?: number): string {
  if (n == null) return '—'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n.toLocaleString()
}
```

## 布局

- Grid：`repeat(6, 1fr)`，响应式：
  - `≤1400px` → 3 列
  - `≤900px` → 2 列
  - `≤480px` → 1 列
- 每张卡片：
  - 顶部：标签 + 图标徽章（按色系调透明度）。
  - 中部：主数值（26px，粗体，负字距 `-0.5px`）。
  - 底部：`metric-bar` 渐变光带。
  - Hover：轻微上浮 + 发光边框。

## 卡片色变量

使用 CSS 自定义属性 `--accent / --accent-rgb` 支持按卡片动态换色；卡片顶部有 `::before` 伪元素绘制发光边线：

```css
background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.6), transparent);
```
