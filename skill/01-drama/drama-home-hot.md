# Skill: 首页热播短剧

## 功能描述

管理 App 首页"热播"模块（`slotType = 'HOT'`）的短剧条目，按排序展示。支持添加、编辑、切换展示、上下移调整排序、移除。

## 路由

- 路径：`/drama/home-hot`（路由名 `HomeHot`）
- 视图：`src/views/drama/home-hot.vue`

## 页面结构

```
page-header
  ├─ page-title "首页热播短剧"
  └─ 添加热播 按钮
preview-tip
  └─ icon-fire + "热播短剧按排序值展示…"
table-card
  └─ ResizableTable > a-table[pagination=false]
```

## 列定义

| 列 | 内容 |
|----|------|
| 排名 | `rank-badge`（TOP 3 高亮色）+ `rowIndex + 1` |
| 封面 | `a-image` 56×38 |
| 信息 | `item-title` = `dramaName` |
| 排序 | `sort-num` + 上下移按钮 |
| 状态 | `a-switch`（`enabled === 1`） |
| 操作 | 编辑 / 移除 |

## 表单字段

| 字段 | 组件 | 备注 |
|------|------|------|
| 选择短剧 `dramaId` | `a-select[allow-search]` | 编辑时禁用 |
| 标题 `title` | `a-input` | 选填，默认使用短剧名 |
| 展示状态 `enabled` | `a-switch` | |

## 接口

同 `drama-home-banner.md`，只是 `slotType = 'HOT'`：
- `fetchHomeSlots('HOT')`
- `createHomeSlot({ slotType: 'HOT', dramaId, title, enabled })`
- `updateHomeSlot(id, payload)`
- `toggleHomeSlotEnabled(id, enabled)`
- `moveHomeSlotSort(id, 'UP' | 'DOWN')`
- `deleteHomeSlot(id)`

## UI 细节

- `rankClass(n)`：1 / 2 / 3 返回金 / 银 / 铜风格的 `rank-badge--gold|silver|bronze`，其他返回普通色。
- `preview-tip` 使用 `icon-fire`（红色 `#D94466`）。
