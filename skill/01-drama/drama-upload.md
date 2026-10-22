# Skill: 上传短剧（批量 VOD 直传）

## 功能描述

一个表单页完成：填写短剧信息（名称 / 描述 / 封面 / 标签 / 免费集数 / 解锁模式 / 广告规则 / 价格 / 排序 / 推荐）、批量选择视频文件、拖拽排序、批量直传到火山 VOD、完成后一次性写入后端。

## 路由

- 路径：`/drama/upload`
- 视图：`src/views/drama/upload.vue`
- 关键依赖：`useVideoUpload(spaceName)`、`fetchTagGrouped`、`fetchAdUnlockRuleList`、`createFullDrama`

## 页面阶段（`phase`）

1. `phase === 'organize'` 阶段一：选择 / 拖拽排序文件；提交按钮显示「确认顺序，开始上传」。
2. `phase === 'uploading'` 阶段二：展示每个文件的进度、状态（pending / uploading / paused / complete / error）、速度；提交按钮显示「提交短剧」。

## 表单字段

| 字段 | 组件 | 说明 / 校验 |
|------|------|-------------|
| 短剧名称 `name` | `a-input` | 必填，2–50 字符 |
| 标签 `tagIds` | `a-tree-select`（多选，按 `groupName` 分组） | 建议不超过 5 个；`tagTreeData` 来自 `fetchTagGrouped` |
| 描述 `description` | `a-textarea` | 选填，最多 500 字符 |
| 封面 URL `coverUrl` | `a-input` | 选填 |
| 免费集数 `freeEpisodes` | `a-input-number` | 默认 0；前 N 集免费 |
| 解锁模式 `unlockMode` | `a-select` | `IAA_ONLY / IAP_ONLY / IAA_IAP`（默认 `IAA_IAP`） |
| 广告解锁规则 `adUnlockRuleId` | `a-select` | 仅当模式含 IAA 时显示；选项来自 `fetchAdUnlockRuleList` |
| 单集价格 `episodePrice` | `a-input-number` | 仅当模式含 IAP 时显示（单位：分） |
| 整剧价格 `bundlePrice` | `a-input-number` | 0 表示不支持整剧购买 |
| 排序权重 `sortWeight` | `a-input-number` | 默认 100 |
| 是否推荐 `isRecommended` | `a-radio-group` | 1=推荐 / 0=不推荐 |

## 视频文件区

### 阶段一：组织文件

- 拖拽区 `drop-zone` 支持点击 / 拖拽多文件，接受 `video/mp4, video/quicktime`。
- `addFiles(files)` 内部按文件名（带 `numeric: true` 的 `localeCompare`）排序。
- `pending-list` 每项展示 `EPxx` 徽标 + 文件名 + 大小 + 上/下移 + 删除。
- 支持 HTML5 原生 `draggable` 拖拽调整顺序（`movePending(from, to)`）。

### 阶段二：上传进度

- 展示 `session.storagePath`。
- 每项：进度条 + 状态徽标（active / complete / error / paused）+ 速度 + 控制按钮（暂停 / 继续 / 重试）。
- 完成时显示 `Vid: xxx`；失败时显示错误消息。

## 关键代码

```ts
const SPACE_NAME = import.meta.env.VITE_VOD_SPACE_NAME || 'tiktok-minis-video'
const {
  pendingFiles, uploadItems, session, phase,
  addFiles, removePending, movePending, clearPending,
  startUpload, retryFailed, pause, resume, getBatchResult, reset,
} = useVideoUpload(SPACE_NAME)
```

### 提交流程

```ts
async function handleStartUpload() {
  const errors = await formRef.value.validate()
  if (errors) return
  starting.value = true
  try {
    await startUpload()   // 内部：fetchUploadSession → new BytePlusUploader → addFile * n → start
  } finally {
    starting.value = false
  }
}

async function handleSubmit() {
  const errors = await formRef.value.validate()
  if (errors) return
  const result = getBatchResult()            // 每项含 { index, fileName, vid, storeUri, posterUri, durationSeconds, videoUrl, fileSize }
  if (!result || result.episodes.length === 0) return

  const episodes: EpisodeCreateInfo[] = result.episodes.map(ep => ({
    episodeNumber: ep.index,
    name: `第${ep.index}集`,
    duration: ep.durationSeconds,
    videoUrl: ep.vid,       // 写回 vid（字符串），后端负责维护签名播放地址
    vid: ep.vid,
    isFree: ep.index <= form.value.freeEpisodes ? 1 : 0,
    status: 1,
  }))

  await createFullDrama({
    drama: {
      name: form.value.name, description: form.value.description, coverUrl: form.value.coverUrl,
      totalEpisodes: episodes.length,
      freeEpisodes: form.value.freeEpisodes,
      unlockMode: form.value.unlockMode,
      adUnlockRuleId: form.value.adUnlockRuleId,
      episodePrice: form.value.episodePrice,
      bundlePrice: form.value.bundlePrice,
      sortWeight: form.value.sortWeight,
      status: 1,
      isRecommended: form.value.isRecommended,
    },
    episodes,
    tagIds: form.value.tagIds.filter(id => typeof id === 'number'),
  })
  router.push('/drama/list')
}
```

## 关键特性

1. **免费集数由前端按集号推导**（`episodeNumber <= freeEpisodes ? 1 : 0`），后端保存即可。
2. **标签树**：`fetchTagGrouped()` 失败时回退到 `fetchTagList` 按 `groupName` 手动分组。
3. **广告规则选项**：仅当解锁模式含 IAA 时显示；`unlockRuleDesc(rule)` 生成提示。
4. **上传依赖 `useVideoUpload`**：详见 `08-upload-sdk/vue3-integration.md`。
5. **取消上传**：`reset()` 调用 `uploader.cancel()` 并清空 `pendingFiles / uploadItems`。
