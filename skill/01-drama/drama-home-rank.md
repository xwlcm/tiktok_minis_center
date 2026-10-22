# Skill: 分类排行榜管理

## 功能描述

管理 App 首页多分类排行榜（`slotType = 'RANK'`）。通过分类 Tabs 切换查看不同类别榜单，支持添加短剧到指定分类、调整排序、切换展示、移除。

## 路由

- 路径：`/drama/home-rank`（路由名 `HomeRank`）
- 视图：`src/views/drama/home-rank.vue`

## 分类枚举

```ts
const CATEGORIES = ['甜宠', '霸总', '逆袭', '玄幻', '都市', '古装', '悬疑', '喜剧']
```

> 具体列表以后端返回为准，前端以 `title` 字段承载分类名称。

## 页面结构

```
page-header
  ├─ page-title "首页分类排行榜"
  └─ 添加排行 按钮
cat-tabs（分类按钮组，活跃项着色）
table-card
  └─ ResizableTable > a-table（当前分类的条目）
a-modal  添加排行
```

## 列定义

| 列 | 内容 |
|----|------|
| 排名 | `rank-badge` + `rowIndex + 1` |
| 封面 | `a-image` 56×38 |
| 信息 | `dramaName` |
| 排序 | `sort-num` + 上下移按钮（基于 `currentList.length`） |
| 状态 | `a-switch` |
| 操作 | 移除 |

## 表单字段

| 字段 | 组件 | 备注 |
|------|------|------|
| 选择短剧 `dramaId` | `a-select[allow-search]` | |
| 标题 `title` | `a-input` | 选填；用于承载分类标签或自定义标题 |
| 展示状态 `enabled` | `a-switch` | |

## 关键逻辑

```ts
const activeCategory = ref<string>(CATEGORIES[0])
const allList = ref<HomeSlot[]>([])

const currentList = computed(() =>
  allList.value
    .filter(item => item.title === activeCategory.value)   // 以 title 匹配分类
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
)

function getCatCount(cat: string) {
  return allList.value.filter(item => item.title === cat).length
}

async function loadList() {
  allList.value = await fetchHomeSlots('RANK') || []
}

function switchCategory(cat: string) {
  activeCategory.value = cat
}
```

## API

- `fetchHomeSlots('RANK')`
- `createHomeSlot({ slotType: 'RANK', dramaId, title: <分类>, enabled })`
- `moveHomeSlotSort(id, 'UP' | 'DOWN')`
- `toggleHomeSlotEnabled / deleteHomeSlot`

## UI 细节

- `cat-tabs`：活跃项带青色下划线 + 加粗。
- `rankClass(n)`：前 3 名金银铜徽章。
- 页面顶部 `preview-tip` 可省略（当前实现未包含）。
