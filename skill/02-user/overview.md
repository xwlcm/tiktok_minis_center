# C 端用户管理模块 — 概览

## 模块职责

查询 TK Minis C 端用户（最终观看短剧的普通用户），查看用户画像（注册信息、观看量、时长、广告完成率、价值分层）及近 30 天活跃趋势图。

> 该模块针对**终端消费者用户**。系统管理员（登录本管理后台的人员）在 `07-account/` 模块维护。

## 二级功能

| 功能 | 路由 | 视图文件 | Skill 文件 |
|------|------|----------|------------|
| 用户列表（关键字 + 日期过滤） | `/user/list` | `views/user/index.vue` | `user-list.md` |
| 用户详情（画像 + 趋势） | `/user/:id` | `views/user/detail.vue` | `user-detail.md` |

## 数据模型（`src/types/user.ts`）

```ts
interface User {
  userId: number
  appId?: string
  tenantId?: string
  openId: string
  nickname: string
  avatarUrl: string
  gender?: number
  phone?: string
  email?: string
  status?: number
  createTime?: string
  updateTime?: string
}

interface UserProfile {
  openId: string
  nickname: string
  avatarUrl: string
  registeredAt: string
  lastActiveAt: string
  valueTier: string                 // 价值分层（高/中/低）
  totalEpisodesWatched: number
  totalWatchDurationMs: number
  totalDramasWatched: number
  totalAdsWatched: number
  totalAdsCompleted: number
  totalDramasCompleted: number
  totalEpisodesCompleted: number
  adCompletionRate: number
}

interface UserTrendPoint {
  date: string
  durationMinutes: number
  episodes: number
}

interface UserTrendVO { points: UserTrendPoint[] }
```

## 状态管理（`stores/user.ts`）

列表缓存同其他模块（`list / total / currentPage / pageSize`）。

## API 端点（`src/api/user.ts`）

这些接口**不经拦截器自动注入 clientKey**（路径含 `/api/user/`），改为显式在参数里传 `tenantId: appStore.currentClientKey`。

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/user/list` | `keyword, startDate, endDate, pageNum, pageSize, tenantId` | 分页列表 |
| GET | `/user/all` | `tenantId` | 全量（非分页） |
| GET | `/user/:userId` | — | 按内部 userId 取详情 |
| GET | `/user/:openId/profile` | `tenantId` | 按 openId 取画像 |
| GET | `/user/:openId/trend` | `tenantId` | 取近期趋势点 |
| PUT | `/user` | User | 更新用户 |
| DELETE | `/user/:userId` | — | 删除用户 |

## 搭配模块

- 列表页点击行跳转详情。
- 详情页使用 `utils/echarts.ts` 绘制活跃趋势图（时长 + 集数双 Y 轴）。
