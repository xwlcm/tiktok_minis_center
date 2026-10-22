# 短剧管理模块 — 概览

## 模块职责

管理 TK Minis 平台内所有短剧内容：短剧及集数 CRUD、标签维护、首页推荐位（轮播 / 热播 / 分类排行榜）编排、单剧广告推送策略配置、火山 VOD 视频直传。

## 二级功能

| 功能 | 路由 | 视图文件 | Skill 文件 |
|------|------|----------|------------|
| 短剧列表（搜索 + 标签过滤） | `/drama/list` | `views/drama/index.vue` | `drama-list.md` |
| 上传短剧（多集批量上传 + 基本信息） | `/drama/upload` | `views/drama/upload.vue` | `drama-upload.md` |
| 短剧详情（信息 + 集数播放 + 编辑） | `/drama/:id` | `views/drama/detail.vue` | `drama-detail.md` |
| 标签管理（分组 + 颜色 + 排序） | `/drama/tags` | `views/drama/tags.vue` | `drama-tags.md` |
| 首页轮播（BANNER 槽位） | `/drama/home-banner` | `views/drama/home-banner.vue` | `drama-home-banner.md` |
| 首页热播（HOT 槽位） | `/drama/home-hot` | `views/drama/home-hot.vue` | `drama-home-hot.md` |
| 分类排行榜（RANK 槽位） | `/drama/home-rank` | `views/drama/home-rank.vue` | `drama-home-rank.md` |
| 广告推送设置（逐剧配置解锁模式） | `/drama/ad-settings` | `views/drama/ad-settings.vue` | `drama-ad-settings.md` |

## 数据模型（来自 `src/types/drama.ts`）

```ts
interface Drama {
  id: string
  name: string
  description?: string
  coverUrl?: string
  tags?: string              // 逗号拼接的标签名
  totalEpisodes?: number
  freeEpisodes?: number
  unlockMode?: 'IAA_ONLY' | 'IAP_ONLY' | 'IAA_IAP'
  adUnlockRuleId?: number
  episodePrice?: number       // 分
  bundlePrice?: number        // 分
  sortWeight?: number
  status?: number
  isRecommended?: 0 | 1
  createTime?: string
  updateTime?: string
}

interface Episode {
  id: number
  dramaId?: string
  episodeNumber: number
  name?: string
  description?: string
  duration?: number
  videoUrl?: string           // 通常是签名播放 URL
  vid?: string                // 火山 VOD 视频 ID
  isFree?: 0 | 1
  status?: number
}

interface Tag {
  id: number
  clientKey?: string
  name: string
  groupName: string           // 题材 / 风格 / 受众 …
  color: string | null
  icon: string | null
  sortWeight: number
  status: number
  refCount: number
}

interface HomeSlot {
  id: number
  slotType: 'BANNER' | 'HOT' | 'RANK'
  dramaId: string
  dramaName?: string
  coverUrl?: string
  title?: string | null
  sort?: number
  enabled: 0 | 1
  tenantId?: string
}

interface AdUnlockRule {
  id: number
  clientKey?: string
  ruleName: string
  adCountPerUnlock: number    // 累积多少广告解锁
  episodesPerUnlock: number   // 每次解锁多少集
  maxAdCountPerDay: number    // 每日上限
  adType: string              // 如 RewardedVideoAd
  adUnitId: string
  status: 0 | 1
}

interface DramaCreateRequest {
  drama: DramaCreateInfo
  episodes: EpisodeCreateInfo[]
  tagIds: number[]
}
```

## 工具函数

```ts
unlockModeLabel(mode)          // IAA_ONLY → '仅广告'
unlockModeColor(mode)          // IAA_ONLY → 'green'
unlockModeDesc(mode, rule?)    // 带 HTML 粗体的人类可读描述
unlockRuleDesc(rule)           // 每 N 广告解锁 M 集，每日上限 K 广告
```

## 状态管理（`stores/drama.ts`）

```ts
state: {
  list: Drama[]
  total: number
  currentPage: number
  pageSize: number         // 默认 20
  searchKeyword: string
  filterTag: string
}

actions: {
  fetchList(params?: { name?, tag? })   // 调用 fetchDramaList，自动带 clientKey
}
```

## API 端点（`src/api/drama.ts`）

所有业务接口经 `request` 拦截器自动注入 `clientKey`（GET 参数 / 非 GET body）。

### 短剧

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/list` | 分页列表（`name/tag/status/pageNum/pageSize`） |
| GET | `/drama/recommended` | 推荐短剧 |
| GET | `/drama/hot` | 热门短剧 |
| GET | `/drama/:id` | 短剧详情 |
| POST | `/drama` | 新增短剧（仅信息） |
| POST | `/drama/create-with-episodes-and-tags` | 批量创建：短剧 + 集数 + 标签 |
| PUT | `/drama` | 更新短剧 |
| DELETE | `/drama/:id` | 删除短剧 |

### 集数

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/episode/list/:dramaId` | 集数列表 |
| GET | `/episode/:dramaId/:episodeNumber` | 集数详情 |
| GET | `/episode/free/:dramaId` | 免费集数 |
| GET | `/episode/count/:dramaId` | 集数数量 |
| POST | `/episode` | 新增集数 |
| PUT | `/episode` | 更新集数 |
| DELETE | `/episode/:id` | 删除 |

### 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/tag/list` | 分页标签列表 |
| GET | `/drama/tag/all` | 全量启用标签 |
| GET | `/drama/tag/grouped` | 按 `groupName` 分组 |
| GET | `/drama/tag/:id` | 标签详情 |
| POST | `/drama/tag` | 新增 |
| PUT | `/drama/tag` | 更新 |
| DELETE | `/drama/tag/:id` | 删除 |

### 首页槽位

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/home/slots?slotType=BANNER|HOT|RANK` | 按类型查询 |
| GET | `/drama/home/slots/all` | 全部槽位 |
| GET | `/drama/home/slots/:id` | 详情 |
| POST | `/drama/home/slots` | 新增 |
| PUT | `/drama/home/slots/:id` | 更新 |
| PUT | `/drama/home/slots/:id/enabled` | 启用/禁用 |
| PUT | `/drama/home/slots/sort` | 上移/下移（`{ id, direction: 'UP'|'DOWN' }`） |
| DELETE | `/drama/home/slots/:id` | 删除 |

### 广告解锁规则

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/ad/unlock-rule/list` | 规则列表 |
| GET | `/drama/ad/unlock-rule/:id` | 规则详情 |
| POST | `/drama/ad/unlock-rule` | 新增 |
| PUT | `/drama/ad/unlock-rule` | 更新 |
| DELETE | `/drama/ad/unlock-rule/:id` | 删除 |
| PUT | `/drama/ad/unlock-rule/:id/enable` | 启用 |
| PUT | `/drama/ad/unlock-rule/:id/disable` | 禁用 |
| GET | `/drama/ad/unlock-rule/default?clientKey=` | 默认规则 |

### 解锁能力（C 端使用，后台可调试）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/:dramaId/episode/:n/unlock-status` | 查询解锁状态（`openId + clientKey`） |
| POST | `/drama/:dramaId/episode/:n/unlock-by-ad` | 通过广告解锁 |
| POST | `/drama/:dramaId/episode/:n/ad-watched` | 上报广告观看结果 |
| POST | `/drama/:dramaId/episode/:n/unlock-by-iap` | 通过付费解锁 |
