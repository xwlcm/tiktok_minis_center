# Skill: 应用切换（页面 + 顶栏组件）

## 两种入口

### 1. 顶栏下拉（`components/AppSwitcher/index.vue`）

嵌入 `BasicLayout` 的 `header-right`，仅当 `accountStore.menuPerms.canSwitchApp` 为 true 时渲染。

```
switcher-trigger（点击展开）
  ├─ switcher-dot（当前应用存在时变绿色）
  ├─ switcher-name（当前应用名，最大 140 px 截断）
  └─ icon-down
switcher-header "切换应用"
a-doption * visibleApps
  ├─ check 图标（活跃项）
  ├─ app-name
  └─ 状态徽标（运行中 / 未激活）
```

- `visibleApps = isAdmin || hasAllApps ? appList : appList.filter(...)`.
- 选中后 `appStore.switchApp(clientKey)` → `Message.success` → `router.push('/dashboard')`。

### 2. 全屏卡片页（`views/app/index.vue`，路由 `/system/app`）

```
page-header "切换应用"
a-spin
  ├─ EmptyState（appList 空）
  └─ app-grid（auto-fill minmax(220px, 1fr)，gap 16）
        └─ app-card
             ├─ active-badge（当前应用显示 "当前" + check）
             ├─ app-icon（首字母 avatar 52px，圆角 square）
             └─ app-info（app-name + status-dot + 状态文案）
```

- 点击卡片：`appStore.switchApp(clientKey)` → `router.push('/dashboard')`。
- 当前活跃卡片高亮边框（`app-card--active`）。

## 状态切换 UI

| `status` | 文案 | 色值 |
|----------|------|------|
| `'0'` | 运行中 | `#3DB87A`（成功色） |
| `'1'` | 未激活 | 低对比灰 |

## 关键 API

```ts
const appStore = useAppStore()
const accountStore = useAccountStore()

// 可见应用
const visibleApps = computed(() =>
  accountStore.isAdmin || accountStore.hasAllApps
    ? appStore.appList
    : appStore.appList.filter(a => accountStore.allowedClientKeys.includes(a.clientKey))
)

// 切换
function handleSelect(val) {
  const clientKey = String(val)
  if (clientKey && clientKey !== appStore.currentClientKey) {
    appStore.switchApp(clientKey)
    Message.success(`已切换到 ${app?.appName ?? clientKey}`)
    router.push('/dashboard')
  }
}
```

## 切换带来的副作用

- `localStorage['current_client_key']` 更新，刷新页面后生效。
- 所有业务列表页通过 `watch(() => appStore.currentClientKey, fetchList)` 触发刷新（DramaList / UserList / AdList / Dashboard）。
- 请求拦截器自动在新请求上注入新的 `clientKey`。
