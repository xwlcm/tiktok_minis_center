# Skill: 完整上传流程

## 业务流程（项目实际实现）

```
[用户选文件] → addFiles(files)            Composable 内按文件名排序
     ↓
[startUpload()]
     ├─ POST /vod/upload-session           获取 STS（含 storagePath / region）
     ├─ new BytePlusUploader({ region, userId, appId, videoConfig })
     ├─ bindEvents()                        progress / complete / error
     └─ for each pending file:
          uploader.addFile({
            file, stsToken, type: 'video',
            fileName: `${storagePath}ep${idx}.mp4`,
            processAction: [ { name: 'GetMeta' },
                             { name: 'Snapshot', input: { SnapshotTime: 1 } } ],
          })
     └─ uploader.start()
     ↓
[事件回调]
     ├─ progress → 更新 percent / speed
     ├─ complete:
     │     ├─ 从 uploadResult 取 Vid / PosterUri / VideoMeta.Uri / VideoMeta.Duration
     │     ├─ POST /vod/signed-url  { vid, expireSeconds: 3600 }  → 得到签名播放地址
     │     └─ POST /vod/file-info  { vid, storeUri, durationSeconds, fileName, fileSize, posterUrl }
     └─ error:
          ├─ 判断 Token 过期（100026 / "token expired" / "secret token"）
          │     ├─ POST /vod/upload-session/refresh → 新凭证
          │     ├─ uploader.refreshStsToken({ AccessKeyId,... })
          │     └─ uploader.start(fileKey)   逐个续传未完成任务
          └─ 其他错误：标记该 item 为 error
     ↓
[getBatchResult()] → [POST /drama/create-with-episodes-and-tags]
```

## 关键代码片段

### 获取 STS 并创建实例

```ts
const data = await fetchUploadSession()         // /vod/upload-session
session.value = data

const region = data.region?.trim() || 'ap-southeast-1'
uploader = new BytePlusUploader({
  region,
  userId: String(accountStore.current?.userId ?? 'anonymous'),
  appId: Number(import.meta.env.VITE_VOD_APP_ID) || 0,
  videoConfig: { spaceName: data.spaceName },
} as any)

bindEvents()

const stsToken = {
  AccessKeyId: data.accessKeyId,
  SecretAccessKey: data.secretAccessKey,
  SessionToken: data.sessionToken,
  CurrentTime: data.currentTime,
  ExpiredTime: data.expiredTime,
}
```

### 批量添加文件

```ts
for (let i = 0; i < pendingFiles.value.length; i++) {
  const pf = pendingFiles.value[i]
  const episodeIndex = i + 1
  const fileName = buildFileName(data.storagePath, episodeIndex, pf.file.name)
  // buildFileName → `${storagePath}ep${'01'}.mp4`

  const fileKey = uploader.addFile({
    file: pf.file,
    stsToken,
    type: 'video',
    fileName,
    processAction: [
      { name: 'GetMeta' },
      { name: 'Snapshot', input: { SnapshotTime: 1 } },
    ],
  })
  items.push({ pendingId: pf.id, file: pf.file, fileKey, fileName, progress: 0, stage: 'pending', stageLabel: '等待上传', speed: 0 })
}
uploader.start()
```

### 事件：完成

```ts
uploader.on('complete', async (info) => {
  const idx = findIndexByKey(info.key)
  const result = info.uploadResult as Record<string, any>
  const vid = result?.Vid
  const posterUri = result?.PosterUri
  const videoMeta = result?.VideoMeta
  const storeUri = videoMeta?.Uri ?? result?.StoreUri
  const durationSeconds = typeof videoMeta?.Duration === 'number' ? videoMeta.Duration : undefined

  let videoUrl: string | undefined
  if (vid) {
    const signed = await getSignedUrl({ vid, expireSeconds: 3600 })
    videoUrl = signed.playUrl
  }

  updateItem(idx, { stage: 'complete', progress: 100, vid, storeUri, posterUri, durationSeconds, videoUrl })

  if (vid) {
    await saveFileInfo({
      vid, storeUri, durationSeconds,
      fileName: item.file.name, fileSize: item.file.size, posterUrl: posterUri,
    })
  }
})
```

### 事件：错误 + 自动刷新 Token

```ts
uploader.on('error', (info) => {
  const errMsg = typeof info.extra === 'string' ? info.extra : (info.extra as any)?.message
  if (errMsg && (errMsg.includes('token expired') || errMsg.includes('100026') || errMsg.includes('secret token'))) {
    handleTokenExpired()
  } else {
    updateItem(findIndexByKey(info.key), { stage: 'error', error: String(errMsg) })
  }
})

async function handleTokenExpired() {
  const data = await refreshUploadSession()          // /vod/upload-session/refresh
  uploader.refreshStsToken({
    AccessKeyId: data.accessKeyId,
    SecretAccessKey: data.secretAccessKey,
    SessionToken: data.sessionToken,
    CurrentTime: data.currentTime,
    ExpiredTime: data.expiredTime,
  })
  // 未完成任务逐个 start
  for (const item of uploadItems.value.filter(i => i.stage !== 'complete')) {
    uploader.start(item.fileKey)
  }
}
```

### 控制方法

```ts
pause(fileKey)     // uploader.pause(fileKey)
resume(fileKey)    // uploader.start(fileKey)
cancel(fileKey)    // uploader.cancel(fileKey)
reset()            // uploader.cancel() + 清空状态
```

## 输出：`BatchUploadResult`

```ts
getBatchResult() => {
  episodes: [
    {
      index: 1,
      fileName: 'minis/drama/xxx/ep01.mp4',
      vid: 'v0f1g20000abc...',
      storeUri: 'video/m/xxxxxx',
      posterUri: 'image/m/xxxxxx',
      durationSeconds: 125,
      videoUrl: 'https://... 签名播放地址',
      fileSize: 5242880,
    },
    ...
  ]
}
```

这个结果被 `views/drama/upload.vue` 的 `handleSubmit` 转成 `EpisodeCreateInfo[]`，最终调用 `POST /drama/create-with-episodes-and-tags`。
