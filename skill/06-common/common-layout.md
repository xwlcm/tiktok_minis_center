# Skill: 基础布局（BasicLayout）

## 位置

`src/layouts/BasicLayout.vue`

## 结构

```
a-layout.layout
├─ a-layout-sider（220 px；折叠 56 px；xl 断点自动折叠）
│   ├─ logo：M 标识 + "Minis 数据中台"（折叠时隐藏文字）
│   ├─ a-menu（按权限渲染）
│   │   ├─ /dashboard                                canViewDashboard
│   │   ├─ drama 子菜单（list/tags/home-*/ad-settings） canManageDrama
│   │   ├─ /user/list                                canViewUser
│   │   ├─ ad 子菜单（list）                          canManageAd
│   │   └─ system 子菜单（user/app）                  canManageAccounts
│   └─ sider-footer（折叠按钮）
└─ a-layout.main（margin-left 随 collapsed 切换）
    ├─ a-layout-header
    │   ├─ header-left  面包屑 "首页 / <route.meta.title>"
    │   └─ header-right
    │        ├─ AppSwitcher（canSwitchApp 时）或 app-readonly
    │        ├─ header-divider
    │        └─ 用户 Dropdown（头像按角色染色 + nickname + 角色徽标 + 退出）
    └─ a-layout-content
         └─ router-view + transition + keep-alive[include=cachedViews]
```

## 缓存页面

```ts
const cachedViews = ['DramaList', 'UserList', 'AdList', 'DramaAdSettings']
```

## 角色染色

```ts
roleLabel = { admin: '管理员', operator: '运营', viewer: '观察者' }[role] ?? role
roleColor = { admin: '#D94466', operator: '#5BA8B0', viewer: '#8B6AAE' }[role] ?? '#86909c'
```

## 退出登录

```ts
async function handleLogout() {
  try { await logout() } catch {}
  localStorage.removeItem('token')
  localStorage.removeItem('client_id')
  accountStore.clear()
  appStore.clear()
  Message.success('已退出登录')
  router.push('/login')
}
```

## 页面切换动画

```
transition[name="page-fade"] mode="out-in" appear
```

配合 `global.css` 中的淡入淡出动画定义。

## 深色主题强制

```css
.layout :deep(.arco-layout)       { background: #0C0D12 !important; }
.layout :deep(.arco-layout-content){ background: #0C0D12 !important; }
```

## 关键交互

- `watch(() => route.path, path => selectedKeys.value = [path])` 保持菜单选中态。
- `handleMenuClick(key) → router.push(key)`。
