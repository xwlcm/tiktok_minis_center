# 广告管理模块 — 概览

## 模块职责

维护广告"解锁规则"（实体名 `Ad`，对应后端 `drama.ad`）：广告规则名称、广告位 ID（AdUnitId）、类型（激励视频 / 插屏）、启停状态。短剧通过 `adUnlockRuleId` 引用这些规则实现"看广告解锁集数"能力。

> 单独的 `drama/ad-settings` 页面负责把这些规则配置到单部短剧，见 `01-drama/drama-ad-settings.md`。

## 二级功能

| 功能 | 路由 | 视图 | Skill 文件 |
|------|------|------|------------|
| 广告规则列表 | `/ad/list` | `views/ad/index.vue` | `ad-list.md` |
| 新增 / 编辑广告规则 | `/ad/create`、`/ad/:id/edit`（也由列表页 Modal 触发） | `views/ad/form.vue` | `ad-form.md` |
| 推送设置（占位） | `/ad/push-settings` | `views/ad/push-settings.vue` | `ad-push-settings.md` |

## 数据模型（`src/types/ad.ts`）

```ts
interface Ad {
  id: number | string
  clientKey?: string
  ruleName: string
  adType: string          // RewardedVideoAd / InterstitialAd
  adUnitId: string
  status: 0 | 1
  createTime?: string
  updateTime?: string
}
```

> 注意：短剧详情中类型 `AdUnlockRule` 字段更全（`adCountPerUnlock / episodesPerUnlock / maxAdCountPerDay`），`Ad` 类型是简版。实际接口返回由后端决定；UI 字段按当前 `views/ad/form.vue` 呈现。

## 状态管理（`stores/ad.ts`）

```ts
state: { list, total, currentPage, pageSize, searchKeyword, filterStatus }
actions: { fetchList(params) }
```

## API 端点（`src/api/ad.ts`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/drama/ad/list` | 分页列表（`status / pageNum / pageSize`） |
| GET | `/drama/ad/all` | 全量启用规则 |
| GET | `/drama/ad/:id` | 详情 |
| POST | `/drama/ad` | 新增 |
| PUT | `/drama/ad` | 更新（带 `id` body） |
| DELETE | `/drama/ad/:id` | 删除 |
