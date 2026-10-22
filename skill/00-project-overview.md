# Minis Data Center 数据管理中台 — 项目总览

> 本文档根据 `minis-data-center/` 当前源码实际分析生成，已替换掉早期的 Mock 驱动方案，反映真实后端对接与 VOD 直传的架构。

## 项目简介

TK Minis 数据管理中台是基于 **Vue 3 + TypeScript + Arco Design** 的多租户后台管理系统，采用 **TikTok 风格深色主题（红青双色霓虹）**。系统对接 RuoYi-Vue-Plus 风格的 Java 后端（JWT + `clientid` + 多租户 `tenantId`），提供短剧内容管理、广告解锁规则、首页推荐位编排、用户行为分析、仪表盘指标、系统用户/应用管理等能力。短剧视频通过 **火山引擎视频点播（VOD）** 直传，不经应用服务器。

## 技术栈

### 运行时依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5.33 | 核心框架（Composition API + `<script setup>`） |
| Vue Router | 4.4.5 | 路由管理（`createWebHistory`） |
| Pinia | 2.2.6 | 状态管理（Options API 风格 Store） |
| @arco-design/web-vue | 2.58.0 | UI 组件库（深色主题全覆盖） |
| Axios | 1.7.9 | HTTP 请求（拦截器 + Bearer Token + clientid + clientKey 注入） |
| ECharts | 6.0.0 | 图表可视化（按需引入） |
| @byteplus/uploader | ^1.1.3 | **实际使用**的火山引擎 Web 上传 SDK（用于 VOD 直传） |
| tt-uploader | ^1.6.1 | 保留依赖但未实际使用（早期方案遗留） |

### 开发依赖

| 依赖 | 用途 |
|------|------|
| Vite | 5.4.11 | 构建工具（路径别名 `@` → `src/`，端口 **5174**，API 代理 `/api` → `VITE_API_PROXY_TARGET`） |
| @tailwindcss/vite + tailwindcss | ^4.2.4 | **Tailwind CSS v4**（通过 Vite 插件引入，与 Arco 深色主题共存） |
| autoprefixer | ^10.5.0 | CSS 前缀 |
| TypeScript | 5.6.3 | 类型检查 |
| vue-tsc | 2.1.10 | Vue TS 类型检查 |
| unplugin-auto-import | 0.18.6 | API 自动导入（ArcoResolver） |
| unplugin-vue-components | 0.27.4 | 组件自动导入（ArcoResolver + sideEffect 样式） |
| mockjs | ^1.1.0 | 依赖保留但 `main.ts` **未再调用** `setupMock()`，mock 文件仅作参考 |
| ESLint + @typescript-eslint + eslint-plugin-vue + eslint-plugin-minis | — | 代码规范（含 8 条项目自定义规则） |

### 环境变量（`.env`）

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 留空则使用 vite proxy 转发到 `/api` |
| `VITE_API_PROXY_TARGET` | Vite 代理目标（默认 `http://192.168.88.50:8080/`） |
| `VITE_VOD_APP_ID` | 火山视频点播 App ID |
| `VITE_VOD_SPACE_NAME` | 火山视频点播空间名（默认 `tiktok-minis-video`） |

## 项目目录结构

```
minis-data-center/
├── src/
│   ├── api/                    # 接口请求层（10 个模块）
│   │   ├── auth.ts             # 登录/登出/租户（JWT + refresh_token）
│   │   ├── account.ts          # 系统用户/角色/部门/岗位（RuoYi 体系）
│   │   ├── app.ts              # 应用管理（/system/application）
│   │   ├── dashboard.ts        # 仪表盘 RESTful 端点（overview / dau / mau / new-users / completion-rate / iap-revenue）
│   │   ├── drama.ts            # 短剧 + 集数 + 标签 + 首页槽位 + 广告解锁规则 + IAA/IAP 解锁
│   │   ├── ad.ts               # 广告规则 CRUD（/drama/ad）
│   │   ├── user.ts             # C 端用户列表/画像/趋势
│   │   ├── event.ts            # 事件上报 + DAU/事件计数查询（X-Client-Key 头）
│   │   ├── file.ts             # 通用文件上传/删除（/system/file）
│   │   └── vod.ts              # 火山 VOD 凭证/签名播放地址
│   ├── components/             # 公共组件
│   │   ├── AppSwitcher/        # 顶栏应用切换下拉（按权限过滤可见应用）
│   │   ├── EmptyState/         # 胶片风格空态（SVG 图标 + 描述）
│   │   ├── GlobalLoading/      # TikTok 双色渐变进度条（Teleport）
│   │   └── ResizableTable/     # 通用表格列拖拽调整组件（MutationObserver + 手柄挂载）
│   ├── composables/            # 组合式函数
│   │   ├── useVideoUpload.ts   # 批量视频上传（@byteplus/uploader + STS 刷新 + 签名播放）
│   │   └── useResizableColumns.ts  # 列宽手动拖拽（含最小宽度保护）
│   ├── layouts/
│   │   └── BasicLayout.vue     # 侧边栏（按权限渲染菜单）+ 顶栏（应用切换 + 用户下拉）+ keep-alive
│   ├── mock/                   # Mock 数据（保留但 main.ts 未注册）
│   ├── router/
│   │   └── index.ts            # 路由 + beforeEach 守卫（Token → 账号 → 放行）
│   ├── stores/
│   │   ├── account.ts          # 用户信息 + permissions[] + roles[] + menuPerms
│   │   ├── app.ts              # appList + currentClientKey（持久化）
│   │   ├── drama.ts / ad.ts / user.ts  # 列表缓存（total / currentPage / pageSize）
│   │   └── loading.ts          # 全局进度（requestAnimationFrame 缓动到 80%）
│   ├── styles/
│   │   ├── tokens.css          # 设计 Token（TikTok 双色 + 语义色 + 深色背景层次）
│   │   └── global.css          # Arco 深色覆盖 + 工具类
│   ├── types/                  # 类型定义（account / ad / app / dashboard / drama / user）
│   ├── utils/
│   │   ├── request.ts          # Axios 封装（Bearer + clientid + clientKey 自动注入）
│   │   ├── format.ts           # 时长格式化（mm:ss / Xh Ym）
│   │   ├── echarts.ts          # ECharts 按需引入 + initChart（复用实例）
│   │   └── vod-uploader.ts     # BytePlusUploader 单例（备用）
│   ├── views/                  # 页面（8 大模块）
│   │   ├── login/              # Canvas 粒子登录页
│   │   ├── dashboard/          # 仪表盘（UserMetrics / AdMetrics / TrendChart）
│   │   ├── drama/              # 短剧管理（8 个页面，含 ad-settings）
│   │   ├── user/               # C 端用户
│   │   ├── ad/                 # 广告规则
│   │   ├── account/            # 系统用户管理（含修改密码、分配角色）
│   │   ├── app/                # 应用管理
│   │   └── error/              # 403
│   ├── App.vue                 # GlobalLoading + router-view
│   ├── main.ts                 # Pinia + Router + ArcoVue + ArcoVueIcon（未再 setupMock）
│   └── env.d.ts
├── eslint-rules/               # 自定义 ESLint 插件（8 条规则）
├── .env / package.json / vite.config.ts / tsconfig.json
```

## 一级模块清单

| 模块 | 路由前缀 | Skill 文件 | 菜单权限 Key |
|------|----------|------------|--------------|
| 登录 | `/login` | `00-login/` | public |
| 仪表盘 | `/dashboard` | `05-dashboard/` | `canViewDashboard` |
| 短剧管理 | `/drama/*` | `01-drama/` | `canManageDrama` |
| C 端用户 | `/user/*` | `02-user/` | `canViewUser` |
| 广告管理 | `/ad/*` | `04-ad/` | `canManageAd` |
| 系统用户 | `/system/user` | `07-account/` | `canManageAccounts` |
| 应用管理 | `/system/app` | `03-app/` | `canSwitchApp`（admin 可切换应用亦可管理） |
| 公共基础 | — | `06-common/` | — |
| 上传 SDK | — | `08-upload-sdk/` | — |

## 核心架构

### 1. 请求层（`utils/request.ts`）

- `axios.create({ baseURL: '/api', timeout: 30000 })`。
- **请求拦截器**：
  - 从 localStorage 读取 `token` → `Authorization: Bearer <token>`。
  - 读取 `client_id` → `clientid` 头。
  - 除 `/api/auth/`、`/api/system/`、`/api/vod/`、`/api/dashboard/`、`/api/event/`、`/api/episode/`、`/api/user/` 前缀外，自动注入 `clientKey` 到 query（GET）或 body（非 GET）。
- **响应拦截器**：统一解包 `{ code, data, rows, total, msg }`，`code === 200` 返回 `data`（或 `{ rows, total }`）；`401` 清理本地 Token + 跳登录；其他状态码 `Message.error` 弹出。
- 对外暴露 `request.get/post/put/delete`（均为泛型 `<T>`）。

### 2. 认证 + 多租户

- 登录请求体 `LoginRequest`：`clientId='pc' + grantType='password' + tenantId='000000' + username + password`。
- 登录响应：`access_token` + `refresh_token` + `expire_in` + `client_id` 存入 localStorage。
- 首次进入非 public 路由时，`router.beforeEach` → `accountStore.loadFromServer()` → `GET /system/user/getInfo` 拉取 `user + permissions[] + roles[] + applications[]`。
- **应用（租户/项目）切换**：`appStore.currentClientKey` 持久化到 localStorage（键 `current_client_key`），所有业务请求自动携带。

### 3. 权限体系（RBAC，基于 `permissions[]` 字符串）

```ts
// stores/account.ts → computePermissions()
canViewDashboard  = permissions.some(p => p.startsWith('dashboard:') || p === '*:*:*')
canManageDrama    = permissions.some(p => p.startsWith('drama:')     || p === '*:*:*')
canViewUser       = permissions.some(p => p.startsWith('user:')      || p === '*:*:*')
canManageAd       = permissions.some(p => p.startsWith('ad:')        || p === '*:*:*')
canSwitchApp      = permissions.some(p => p.startsWith('system:application:') || p === '*:*:*')
canManageAccounts = permissions.some(p => p.startsWith('system:user:')         || p === '*:*:*')
```

- `permissions` 含 `*:*:*` 或 `roles` 含 `superadmin` → 全部权限开启。
- 角色派生：`admin`（超管或 `*admin*`）/ `operator`（`*operator*`）/ `viewer`（其他）。
- 层级控制：路由 `meta`（预留） + 菜单 `v-if="perms.xxx"` + 组件 AppSwitcher 可见应用过滤 + 请求拦截器 `clientKey` 数据隔离。

### 4. 视频上传（VOD 直传）

1. `POST /vod/upload-session` 获取 STS（accessKeyId / secretAccessKey / sessionToken / expiredTime / spaceName / storagePath / region）。
2. 创建 `BytePlusUploader` 实例（region 必填，仅接受 `ap-southeast-1` / `ap-singapore-1`）。
3. `addFile({ file, stsToken, type: 'video', fileName, processAction: [GetMeta, Snapshot] })` → 批量加入。
4. `start()` 开始上传，监听 `progress / complete / error` 事件。
5. 完成后 `result.Vid` → `POST /vod/signed-url` 换签名播放地址 → `POST /vod/file-info` 保存文件元数据。
6. Token 过期（`100026` / `token expired`）自动调 `refreshUploadSession()` → `uploader.refreshStsToken()` 不重建实例。

详见 `08-upload-sdk/` 与 `01-drama/drama-upload.md`。

### 5. 事件上报

`api/event.ts` 提供：
- `reportEvent({ eventName, params, sessionId, timestamp })` — 单条上报，带 `X-Client-Key` 头。
- `batchReportEvents([...])` — 批量上报。
- `fetchEventDau / fetchEventCount` — 查询当日活跃 / 事件次数。

## 设计模式

### 1. 单例模式 — Pinia Store / BytePlusUploader 单例
- Store 均为单例（`useXxxStore()` 返回同一实例）。
- `utils/vod-uploader.ts` 通过模块级 `let _instance` 实现上传器单例（可选备用，`useVideoUpload` 则按页面实例化）。

### 2. 观察者模式 — Vue 响应式 + watch
- `watch(() => appStore.currentClientKey, fetchList)` — 切换应用自动刷新列表。
- `loadingStore` 使用 rAF 观察进度变化驱动动画。

### 3. 策略模式 — 角色权限映射 + 解锁模式映射
```ts
const roleColor = { admin: '#D94466', operator: '#5BA8B0', viewer: '#8B6AAE' }[role]
unlockModeLabel('IAA_ONLY') // '仅广告'
unlockModeLabel('IAP_ONLY') // '仅付费'
unlockModeLabel('IAA_IAP')  // '广告或付费'
```

### 4. 适配器模式 — Axios 请求封装
`request.ts` 统一处理 Token、clientid、clientKey、响应解包，上层 API 无需关心底层协议。

### 5. 门面模式 — ECharts / useVideoUpload
- `utils/echarts.ts` 封装按需引入 + `initChart(el)` 复用实例。
- `composables/useVideoUpload.ts` 将 STS 获取、上传器创建、事件绑定、进度管理、Token 刷新、签名播放地址、后端元数据保存整合为一个对外简洁接口。

### 6. 模板方法模式 — 列表页结构
所有列表页（DramaList / UserList / AdList / AccountList / AppList / AdSettings）遵循：
```
page-header（标题 + 副标题 + 操作按钮）
  ↓
toolbar（搜索 + 筛选 + 按钮）
  ↓
table-card（ResizableTable > a-table + a-pagination）
```

### 7. 管道式中间件 — 路由守卫
`router.beforeEach` 三步：`to.meta.public` 放行 → 无 Token 跳 `/login` → 未登录时拉 `getInfo` → 失败清理并回登录 → `next()`。

## UI 主题色体系

### TikTok 品牌双色

| 变量 | 色值 | 说明 |
|------|------|------|
| `--tt-red` | `#D94466` | 红色主色 |
| `--tt-cyan` | `#5BA8B0` | 青色主色（等同 `--mc-primary`） |

### 语义色

| 变量 | 色值 | 说明 |
|------|------|------|
| `--mc-primary` | `#5BA8B0` | 主色 |
| `--mc-success` | `#3DB87A` | 成功 |
| `--mc-warning` | `#D4913A` | 警告 |
| `--mc-danger` | `#D94466` | 危险（同红） |
| `--mc-info` | `#8B6AAE` | 紫色 |

### 深色背景层次

| 变量 | 色值 | 说明 |
|------|------|------|
| `--mc-bg-page` | `#0C0D12` | 页面底色 |
| `--mc-bg-card` | `#131620` | 卡片 |
| `--mc-bg-card-2` | `#1A1D28` | 二级卡片 |
| `--mc-bg-hover` | `rgba(255,255,255,0.04)` | 悬停 |
| `--mc-bg-active` | `rgba(91,168,176,0.08)` | 激活 |

### 核心渐变

| 渐变 | 用途 |
|------|------|
| `linear-gradient(135deg, #D94466 0%, #5BA8B0 100%)` | 主按钮 |
| `linear-gradient(90deg, #D94466, #5BA8B0)` | 进度条 / 趋势图 |
| `linear-gradient(90deg, #D94466, #D4913A)` | 热度条 |

## 自定义 ESLint 插件（`eslint-plugin-minis`）

| 规则 | 作用 |
|------|------|
| `no-statistic-string-value` | 防止 `a-statistic` 绑定字符串值 |
| `no-statistic-prefix-prop` | 防止 statistic 前缀属性误用 |
| `require-pagination-list-destructure` | 强制分页返回 `{ rows, total }` 解构 |
| `no-badge-invalid-status` | 防止不合法的 badge 状态 |
| `require-mock-regex-query-compat` | Mock 正则兼容 query string |
| `require-mock-url-split-query` | Mock URL 拆分查询参数 |
| `no-range-picker-string-placeholder` | 防止 RangePicker 字符串占位符 |
| `no-invalid-arco-icon` | 防止使用无效的 Arco 图标名 |

## 全局约定

- 所有业务页面通过 `BasicLayout`（侧边栏 + 顶栏）渲染，深色主题。
- 登录 / 认证通过 RuoYi-Vue-Plus 风格后端完成（JWT Bearer + clientid + tenantId）。
- 当前选中应用的 `clientKey` 存于 `appStore.currentClientKey`（localStorage 持久化），业务接口经拦截器自动携带。
- 接口层 `src/api/` 严格按模块拆分，所有 API 使用 `request.get<T>()` 泛型标注返回类型。
- 列表页（DramaList / UserList / AdList / DramaAdSettings）启用 `keep-alive` 缓存。
- 图表统一通过 `utils/echarts.ts` 按需引入，`initChart(el)` 复用已有实例。
- 视频上传走火山 VOD 直传，前端不经过业务服务器转发视频流。
- **不再使用 mockjs**：所有接口对接真实后端（vite proxy → `VITE_API_PROXY_TARGET`）；`mock/` 目录文件保留作参考，但 `main.ts` 已无 `setupMock()` 调用。
