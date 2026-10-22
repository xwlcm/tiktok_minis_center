# Skill: 权限体系

## 概念

- **角色（Role）**：后端返回的 `roles[]` 字符串（如 `superadmin / admin_minis / operator_xx`），前端派生为 `admin / operator / viewer` 三种展示层角色。
- **权限（Permission）**：后端返回的 `permissions[]` 字符串，遵循 `资源:操作:实体` 的 RuoYi 风格（如 `drama:list:query`、`dashboard:view`、`system:user:add`）。
- **`*:*:*`**：超级权限通配。

## Store 逻辑（`stores/account.ts`）

```ts
function computePermissions(permissions: string[], roles: string[]): MenuPermissions {
  const isSuperAdmin = permissions.includes('*:*:*') || roles.includes('superadmin')
  if (isSuperAdmin) {
    return {
      canViewDashboard: true,  canManageDrama: true,  canViewUser: true,
      canManageAd: true,       canSwitchApp: true,    canManageAccounts: true,
    }
  }
  return {
    canViewDashboard:  permissions.some(p => p.startsWith('dashboard:')         || p === '*:*:*'),
    canManageDrama:    permissions.some(p => p.startsWith('drama:')             || p === '*:*:*'),
    canViewUser:       permissions.some(p => p.startsWith('user:')              || p === '*:*:*'),
    canManageAd:       permissions.some(p => p.startsWith('ad:')                || p === '*:*:*'),
    canSwitchApp:      permissions.some(p => p.startsWith('system:application:')|| p === '*:*:*'),
    canManageAccounts: permissions.some(p => p.startsWith('system:user:')       || p === '*:*:*'),
  }
}
```

## 角色派生

```ts
function deriveRole(roles: string[], permissions: string[]): string {
  if (permissions.includes('*:*:*') || roles.includes('superadmin')) return 'admin'
  if (roles.some(r => r.includes('admin')))    return 'admin'
  if (roles.some(r => r.includes('operator'))) return 'operator'
  return 'viewer'
}
```

仅用于 UI 染色和徽标文案，真正的控制走 `permissions[]` 派生。

## 层级控制

| 层级 | 位置 | 实现 |
|------|------|------|
| 路由 | `router/index.ts` | 仅校验登录态，暂未绑定 `meta.permission` |
| 菜单 | `BasicLayout.vue` | `v-if="perms.canXxx"` 决定侧边栏项显隐 |
| 按钮 | 各页面 | 条件渲染 AppSwitcher / 新增按钮等 |
| 数据 | `utils/request.ts` | 自动注入 `clientKey` 实现应用隔离 |

## 登出清理

`logout` 后调用 `accountStore.clear() + appStore.clear()` 将 `menuPerms` 重置为全 false。

## 扩展方式

若需要对单个路由做拒绝访问，按如下方式扩展 `beforeEach`：

```ts
if (to.meta?.permission) {
  const key = to.meta.permission as keyof MenuPermissions
  if (!accountStore.menuPerms[key]) { next('/403'); return }
}
```

并在路由定义上追加：

```ts
{ path: 'drama/upload', component: ..., meta: { title: '上传短剧', permission: 'canManageDrama' } }
```
