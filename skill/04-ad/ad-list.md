# Skill: 广告规则列表

## 功能描述

展示当前应用下的广告解锁规则，支持新增、编辑、切换启停、删除。使用 `ResizableTable` 允许列宽拖拽。

## 路由

- 路径：`/ad/list`（路由名 `AdList`，被 `keep-alive` 缓存）
- 视图：`src/views/ad/index.vue`

## 页面结构

```
page-header
  ├─ page-title "广告列表"
  ├─ page-subtitle "管理 TK Minis 广告资源"
  └─ 新增广告 按钮 → 打开 AdFormModal
table-card
  └─ ResizableTable > a-table + 分页
AdFormModal（components: ad/form.vue，v-model:visible + @saved）
```

## 列定义

```ts
[
  { title: '广告',    slotName: 'name',       width: 200, resizable: true, minWidth: 150 },
  { title: '类型',    slotName: 'type',       width: 110, resizable: true, minWidth: 80  },
  { title: '激活状态', slotName: 'status',    width: 120, resizable: true, minWidth: 90  },
  { title: '更新时间', dataIndex: 'updateTime', width: 160, resizable: true, minWidth: 120 },
  { title: '操作',    slotName: 'operations', width: 120, resizable: true, minWidth: 90  },
]
```

## 列模板

- **广告**：`ruleName` + `adUnitId`（小号等宽字体展示）。
- **类型**：`type-badge` 徽标：
  - `RewardedVideoAd` → '激励视频'
  - `InterstitialAd`  → '插屏广告'
- **激活状态**：`a-switch`（`status === 1`），调用 `updateAd(id, { status: 1|0 })`。
- **操作**：编辑（打开 Modal） / 删除（popconfirm）。

## 关键逻辑

```ts
const adStore = useAdStore()
const appStore = useAppStore()

async function handleToggleStatus(ad: Ad, active: boolean) {
  await updateAd(ad.id, { status: active ? 1 : 0 })
  ad.status = active ? 1 : 0
  Message.success(`广告已${active ? '激活' : '停用'}`)
}

watch(() => appStore.currentClientKey, () => {
  adStore.currentPage = 1
  fetchList()
})
```

## 搭配

- `ad/form.vue` 作为新增 / 编辑 Modal（见 `ad-form.md`）。
- 切换应用时重新拉取列表。
