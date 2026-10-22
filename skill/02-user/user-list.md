# Skill: C 端用户列表

## 功能描述

分页展示当前应用（`appStore.currentClientKey`）下的 C 端用户，支持按关键字（昵称 / openId）和注册时间范围过滤。

## 路由

- 路径：`/user/list`（路由名 `UserList`，被 `keep-alive` 缓存）
- 视图：`src/views/user/index.vue`

## 页面结构

```
page-header
  ├─ page-title "用户列表"
  └─ page-subtitle "查看 TK Minis 终端用户"
toolbar
  ├─ a-input-search keyword
  └─ a-range-picker 注册时间
table-card
  └─ ResizableTable > a-table + 分页
```

## 列定义

| 列 | 内容 |
|----|------|
| 用户 | `a-avatar(avatarUrl)` + 昵称 + `@openId` |
| 性别 | `gender` → 图标 / "—" |
| 手机 / 邮箱 | 文本 |
| 注册时间 | `createTime` |
| 操作 | 详情 |

## 关键逻辑

```ts
async function fetchList() {
  loading.value = true
  try {
    const res = await fetchUserList({
      keyword: keyword.value,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    list.value = res.rows ?? []
    total.value = res.total ?? 0
  } finally { loading.value = false }
}
```

## 交互

- `watch(() => appStore.currentClientKey, () => { pageNum.value = 1; fetchList() })`
- 点击行 → `router.push('/user/' + openId)`
- 日期过滤用 `a-range-picker`，绑定 `dateRange: [startDate, endDate]`。
