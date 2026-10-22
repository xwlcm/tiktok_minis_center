# Skill: 广告推送设置（占位页）

## 说明

`src/views/ad/push-settings.vue` 目前仅为占位页，显示 `EmptyState` 文案「广告推送规则功能开发中，敬请期待」。

## 路由

- 路径：`/ad/push-settings`（路由名 `AdPushSettings`）

## 页面结构

```
page-header
  ├─ page-title "广告推送设置"
  └─ page-subtitle "配置广告触发策略"
empty-card
  └─ EmptyState description="广告推送规则功能开发中，敬请期待"
```

## 迁移提示

- 逐部短剧的推送策略已在 `/drama/ad-settings`（`01-drama/drama-ad-settings.md`）实现。
- 全局推送策略（时间窗口、设备白名单、触发上限等）规划中。
