# 应用管理模块 — 概览

## 模块职责

管理多个 TK Minis 应用（多租户 / 多项目），提供：
- 顶栏应用切换下拉（`AppSwitcher` 组件）
- 独立的"切换应用"页面（卡片式）
- 系统管理员可新增 / 编辑 / 启停应用
- 应用切换后所有业务请求自动切换 `clientKey` 作用域

## 二级功能

| 功能 | 路由 | 视图 | Skill 文件 |
|------|------|------|------------|
| 切换应用（仪表盘式视图） | `/system/app` | `views/app/index.vue` | `app-switcher.md` |
| 顶栏应用切换下拉 | 所有布局页 | `components/AppSwitcher/index.vue` | `app-switcher.md` |

## 数据模型（`src/types/app.ts`）

```ts
interface App {
  id: number
  tenantId: string
  appName: string
  appType: string
  clientKey: string           // 业务隔离键
  appDescription: string
  dailyEventQuota: number     // 每日事件配额
  featureFlags: string
  status: string              // '0' 运行中, '1' 未激活
  sortOrder: number
  remark: string
  createTime: string
}
```

## 状态管理（`stores/app.ts`）

```ts
state: {
  appList: App[]              // 由 accountStore.applications 同步而来
  currentClientKey: string    // 持久化：localStorage['current_client_key']
}

getters: {
  currentApp: 按 currentClientKey 在 appList 中查找，找不到则回退到第一个
}

actions: {
  setAppList(apps)                 // 登录后或切换账号时注入
  switchApp(clientKey)             // 持久化
  loadFromAccountStore()           // accountStore.applications → setAppList
  clear()                          // 登出时清理
}
```

## API 端点（`src/api/app.ts`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/system/application/list` | 应用列表（分页格式 `{ rows, total }`） |
| POST | `/system/application` | 新增应用 |
| PUT | `/system/application` | 更新应用 / 更新状态 |
| DELETE | `/system/application/:id` | 删除 |

## 权限控制

- 顶栏 AppSwitcher 仅当 `accountStore.menuPerms.canSwitchApp === true` 时渲染；否则只显示当前应用名（只读）。
- 可见应用：`isAdmin / hasAllApps` 为 true 时看全部，否则按 `allowedClientKeys` 过滤（当前实现返回全部应用）。

## 与其他模块的协作

- **请求拦截器**：`utils/request.ts` 默认向非 `auth / system / vod / dashboard / event / episode / user` 前缀的接口自动注入 `clientKey`（GET 参数或非 GET body），实现数据隔离。
- **Dashboard / User API**：路径落在"豁免前缀"中，需要在参数里显式传 `clientKey` 或 `tenantId = appStore.currentClientKey`。
- **路由守卫**：切换应用不触发守卫，只通过 `watch` 驱动页面重新拉取。
