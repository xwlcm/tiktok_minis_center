# Skill: 短剧列表

## 功能描述

列出当前应用（`clientKey`）下的短剧，支持按名称搜索、按标签过滤、分页。点击行进入详情，可删除、跳转上传页、跳转标签管理。

## 路由

- 路径：`/drama/list`
- 路由名：`DramaList`（被 `BasicLayout` `keep-alive` 缓存）
- 视图：`src/views/drama/index.vue`

## 页面结构

```
page-header
  ├─ page-title "短剧列表"
  ├─ page-subtitle "管理平台内所有短剧内容"
  └─ page-actions
       ├─ a-button "标签管理" → /drama/tags
       └─ a-button[type=primary] "上传短剧" → /drama/upload
toolbar
  └─ a-input-search keyword
tag-filter（当 tagList 非空时渲染）
  ├─ 全部
  └─ 彩色圆点 + 标签名按钮组
table-card
  └─ ResizableTable
       └─ a-table (columns: 封面 | 名称 | 标签 | 集数 | 解锁模式 | 操作)
```

## 列定义

```ts
const columns = ref([
  { title: '封面',     slotName: 'cover',     width: 76,  resizable: true, minWidth: 60 },
  { title: '名称',     slotName: 'name',      width: 200, resizable: true, minWidth: 120 },
  { title: '标签',     slotName: 'tags',      width: 180, resizable: true, minWidth: 100 },
  { title: '集数',     slotName: 'episodes',  width: 160, resizable: true, minWidth: 120 },
  { title: '解锁模式', slotName: 'unlockMode', width: 120, resizable: true, minWidth: 90 },
  { title: '操作',     slotName: 'operations', width: 140, resizable: true, minWidth: 100 },
])
```

## 核心交互

- 数据：`useDramaStore()` 缓存列表、总数、分页、当前搜索关键字与标签。
- 切换应用（`watch(() => appStore.currentClientKey)`）时重新拉取。
- 删除：`a-popconfirm` 确认 → `deleteDrama(id)` → 成功 `Message.success` + 重新拉取。
- 封面列：`a-image` 承载 `coverUrl`，缺省时用 `cover-placeholder` + `icon-video-camera` 占位。
- 标签列：将 `record.tags`（逗号拼接字符串）拆分为 `a-tag` 列表；空值展示 `—`。
- 集数列：展示总集数 + 免费集数。
- 解锁模式列：`unlockModeLabel / unlockModeColor` 派生文案与色值。
- 点击名称：`goDetail(id)` → `router.push('/drama/' + id)`。

## 关键逻辑

```ts
function parseTags(tags: string | undefined): string[] {
  return (tags ?? '').split(',').map(t => t.trim()).filter(Boolean)
}

async function fetchList() {
  loading.value = true
  try {
    await dramaStore.fetchList({ name: keyword.value, tag: activeTag.value })
  } finally { loading.value = false }
}

watch(() => appStore.currentClientKey, () => {
  dramaStore.currentPage = 1
  fetchList()
})
```

## 搭配组件

- `ResizableTable`（`components/ResizableTable/index.vue`）：为 `<th>` 挂载拖拽手柄并冻结列宽。
- 页面 `keep-alive` 缓存由 `BasicLayout` 的 `cachedViews = ['DramaList', 'UserList', 'AdList', 'DramaAdSettings']` 声明。
