# Skill: 短剧详情

## 功能描述

展示单部短剧的完整信息：基本信息卡片（名称 / 集数 / 免费集数 / 解锁模式 / 价格 / 推荐 / 标签 / 描述 / 时间）、集数列表（Tab 切换 + 原生 `<video>` 播放）、编辑短剧、编辑单集。

## 路由

- 路径：`/drama/:id`（路由名 `DramaDetail`）
- 视图：`src/views/drama/detail.vue`

## 页面结构

```
detail-header
  ├─ 返回列表按钮
  ├─ detail-title drama.name
  └─ 编辑信息 按钮 → 打开 edit-drama modal
a-spin[loading]
  └─ detail-body（drama 存在时）
       ├─ info-card         基本信息 Grid
       └─ episodes-card     集数 Tabs + 播放器
  └─ EmptyState（drama 不存在时）
```

## 数据获取

```ts
onMounted(async () => {
  loading.value = true
  try {
    drama.value   = await fetchDramaDetail(id)
    episodes.value = await fetchEpisodeList(id)
    adUnlockRules.value = await fetchAdUnlockRuleList()
  } finally { loading.value = false }
})

const currentAdUnlockRule = computed(() =>
  adUnlockRules.value.find(r => r.id === drama.value?.adUnlockRuleId)
)
```

## 基本信息字段

| 字段 | 展示方式 |
|------|----------|
| 短剧名称 | `drama.name` |
| 集数 | `badge-count` + 单位 |
| 免费集数 | `badge-count` + 单位 |
| 解锁模式 | `a-tag[color=unlockModeColor]` + `unlockModeDesc` 描述（含 HTML 粗体） + 规则公式 |
| 单集价格 | `episodePrice / 100` → `X.XX 元` |
| 整剧价格 | 同上 |
| 创建时间 | `drama.createTime` |
| 排序权重 | `drama.sortWeight` |
| 是否推荐 | `a-tag[color=green]` 或 `未推荐` |
| 标签 | `parseTags(drama.tags)` → `a-tag` 列表 |
| 描述 | 文本 |

## 集数列表

- `episode-tabs` 横向按钮组，点击切换 `activeEpisode`。
- 每个按钮显示集号，免费集附加 `ep-free-badge "免"`。
- 内容区：`<video>` 原生播放器 + `video-meta`（时长 + 免费/付费徽标 + 编辑按钮）。
- 无 `videoUrl` 时显示 `video-locked` 占位（icon-lock + "该集未上传视频"）。

## 编辑短剧 Modal

字段与上传页类似，包含：`name / freeEpisodes / unlockMode / adUnlockRuleId / episodePrice / bundlePrice / sortWeight / isRecommended / description / coverUrl / tags`。

保存通过 `updateDrama(id, payload)` → 成功后刷新 `fetchDramaDetail`。

## 编辑集数 Modal

修改 `name / description / duration / isFree / status / videoUrl`，保存通过 `updateEpisode(id, payload)`。

## 工具函数

```ts
formatDuration(seconds) // 使用 utils/format.ts 的 formatDurationLong 或 formatDurationShort
```

## 组件依赖

- `EmptyState`（胶片空态）
- Arco：`a-spin / a-tag / a-image / a-modal / a-form / a-input / a-input-number / a-select / a-radio-group / a-textarea / a-button`
