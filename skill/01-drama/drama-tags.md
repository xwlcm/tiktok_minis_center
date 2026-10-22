# Skill: 标签管理

## 功能描述

管理短剧标签：按分组（题材 / 风格 / 受众 …）浏览、新增 / 编辑 / 删除标签、配置颜色与排序权重、启停标签。

## 路由

- 路径：`/drama/tags`
- 视图：`src/views/drama/tags.vue`

## 页面结构

```
page-header
  ├─ page-title "标签管理"
  └─ 新增标签 按钮
group-tabs（tab 切换当前分组过滤）
  ├─ 全部 + total 计数
  └─ 各 groupName + groupCountMap[groupName] 计数
table-card
  └─ ResizableTable > a-table
        列：名称 | 分组 | 颜色 | 排序权重 | 状态 | 关联数 | 操作
a-modal 新增/编辑
```

## 列模板

- **名称**：`tag-dot`（填充 `record.color`）+ `record.name`。
- **分组**：`group-badge` 徽标。
- **颜色**：`color-swatch` + HEX 文本。
- **排序权重**：数值。
- **状态**：`a-switch`，`status === 1` 启用、`0` 禁用（`isTagEnabled(status)`）。
- **关联数**：`refCount` + "部短剧"。
- **操作**：编辑 / 删除（`refCount > 0` 时 popconfirm 文案提示"该标签关联了 N 部短剧"）。

## 表单字段

| 字段 | 组件 | 校验 |
|------|------|------|
| 标签名称 `name` | `a-input` | 必填，≤16 字符 |
| 标签分组 `groupName` | `a-select[allow-create]` | 必填；默认选项 `['题材','风格','受众']` ∪ 已有分组 |
| 颜色 `color` | `a-input`（含色块前缀） | 选填 HEX，默认 `#5BA8B0` |
| 排序权重 `sortWeight` | `a-input-number` | 0–9999 |

## 关键逻辑

```ts
const activeGroup = ref('')
const allTags = ref<Tag[]>([])
const filteredTags = computed(() =>
  activeGroup.value
    ? allTags.value.filter(t => t.groupName === activeGroup.value)
    : allTags.value
)

async function loadTags() {
  const res = await fetchTagList({ pageSize: 999 })
  allTags.value = res.rows ?? []
  // 重建 allGroupNames / groupCountMap
}

async function handleSave() {
  await (editingTag.value
    ? updateTag(editingTag.value.id, form)
    : createTag({ ...form, status: 1 }))
  loadTags()
}
```

## API

- `fetchTagList({ groupName?, pageNum, pageSize })`
- `createTag / updateTag / deleteTag`
- 见 `01-drama/overview.md` API 表。

## 自定义组件

- `ResizableTable`（见 `06-common/common-components.md`）。
