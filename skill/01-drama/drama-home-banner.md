# Skill: 首页轮播管理

## 功能描述

管理 TikTok Minis App 首页轮播位（`slotType = 'BANNER'`）。支持新增、编辑标题、切换展示状态、上下移调整排序、删除。

## 路由

- 路径：`/drama/home-banner`（路由名 `HomeBanner`）
- 视图：`src/views/drama/home-banner.vue`

## 页面结构

```
page-header
  ├─ page-title "首页轮播管理"
  └─ 添加轮播 按钮
preview-tip
  └─ icon-info-circle + "轮播图按排序值从小到大展示…"
table-card
  └─ ResizableTable > a-table[pagination=false]
```

## 列定义

| 列 | 内容 |
|----|------|
| 封面 | `a-image` 80×44，圆角 6 px；缺省使用 `cover-placeholder--lg` |
| 信息 | `item-title`（标题 / 短剧名） + `item-drama-id`（"关联短剧：xxx"） |
| 排序 | `sort-num` + 上下移按钮（`moveHomeSlotSort(id, 'UP'|'DOWN')`） |
| 状态 | `a-switch`（`enabled === 1`），联动 `toggleHomeSlotEnabled` |
| 操作 | 编辑 / 删除 |

## 表单字段（Modal）

| 字段 | 组件 | 备注 |
|------|------|------|
| 选择短剧 `dramaId` | `a-select[allow-search]` | 编辑时禁用；选项来自 `fetchDramaList` |
| 轮播标题 `title` | `a-input` | 留空使用短剧名称 |
| 展示状态 `enabled` | `a-switch` | `1 / 0` |

## 接口

所有通过 `src/api/drama.ts` 导出：
- `fetchHomeSlots('BANNER')` 拉取当前类型列表
- `createHomeSlot({ slotType: 'BANNER', dramaId, title, enabled, sort })`
- `updateHomeSlot(id, payload)`
- `toggleHomeSlotEnabled(id, enabled)`
- `moveHomeSlotSort(id, 'UP' | 'DOWN')`
- `deleteHomeSlot(id)`
- `fetchDramaList()` 加载候选短剧下拉选项

## 关键逻辑

```ts
async function loadList() {
  loading.value = true
  try {
    list.value = await fetchHomeSlots('BANNER') || []
  } finally { loading.value = false }
}

async function moveUp(record: HomeSlot) {
  await moveHomeSlotSort(record.id, 'UP')
  loadList()
}

async function handleToggle(record: HomeSlot, enabled: boolean) {
  togglingId.value = record.id
  try {
    await toggleHomeSlotEnabled(record.id, enabled ? 1 : 0)
    record.enabled = enabled ? 1 : 0
  } finally { togglingId.value = null }
}
```

## UI 约定

- 操作提示条 `preview-tip`：浅青色背景 + `icon-info-circle` + 文案，强调业务规则。
- 切换应用（`appStore.currentClientKey`）自动刷新。
