# Skill: `@byteplus/uploader` 常用 API 参考

> 以项目实际调用为准。SDK 其他能力请查阅官方文档 https://docs.byteplus.com/en/docs/vod/web-uploader。

## 构造函数

```ts
new BytePlusUploader({
  region: 'ap-southeast-1' | 'ap-singapore-1',
  userId: string,              // ASCII only
  appId: number,               // VOD AppID
  videoConfig: { spaceName: string },
  // 可选：useLocalStorage / useServerCurrentTime / taskParallelLimit
} as any)
```

> 项目里使用 `as any` 规避 TS 类型收窄（SDK 类型声明偏严格）。

## 方法

### `addFile(params) → fileKey`

```ts
uploader.addFile({
  file: File,
  stsToken: { AccessKeyId, SecretAccessKey, SessionToken, CurrentTime, ExpiredTime },
  type: 'video' | 'image' | 'common' | 'material',
  fileName: string,             // 形如 `<storagePath>/ep01.mp4`
  processAction?: Array<{ name: string; input?: object }>,
})
```

返回 `fileKey`（SDK 内部唯一），后续所有事件、暂停、重试、取消都靠它寻址。

常用 `processAction`：
- `{ name: 'GetMeta' }` — 获取视频元信息（Duration / Height / Width）
- `{ name: 'Snapshot', input: { SnapshotTime: 1 } }` — 第 1 秒截图作为封面

### `start(fileKey?)`

- 无参 → 启动全部已加入的文件。
- 带 fileKey → 启动单个文件（用于重试 / 续传）。

### `pause(fileKey)` / `cancel(fileKey?)`

- `pause`：暂停指定文件。
- `cancel`：不传 fileKey 时取消全部。

### `refreshStsToken(newToken)`

```ts
uploader.refreshStsToken({
  AccessKeyId, SecretAccessKey, SessionToken, CurrentTime, ExpiredTime,
})
```

用于 Token 过期后续传，无需 `new` 新实例。

## 事件

所有事件回调都接收一个 `info` 对象，项目中用到的字段：

### `progress`

```ts
info = {
  key: string,     // fileKey
  percent: number, // 0-100
  speed?: number,  // KB/s
}
```

### `complete`

```ts
info = {
  key: string,
  uploadResult: {
    Vid?: string,          // 视频 ID（供播放 / 工作流使用）
    PosterUri?: string,    // 封面 URI
    StoreUri?: string,
    VideoMeta?: { Uri?: string; Duration?: number; Height?: number; Width?: number },
  }
}
```

### `error`

```ts
info = {
  key: string,
  extra: string | { message?: string, code?: string|number },
}
```

常见错误码：`100026` 通常为 STS 过期。项目通过判断 `extra` 字符串触发 `refreshUploadSession`。

## `processAction` 产出物

- `GetMeta` 产出 `VideoMeta.Duration` 等字段，由 SDK 合并到 `uploadResult.VideoMeta`。
- `Snapshot` 产出封面图 URI（`PosterUri`）。
- 若开启工作流（`Workflow`），可在 `processAction` 中添加 `{ name: 'RunWorkflow', input: { TemplateId } }` 触发后处理。

## 与项目的映射

| 业务字段 | 来源 |
|----------|------|
| `vid` | `uploadResult.Vid` |
| `posterUri` | `uploadResult.PosterUri` |
| `storeUri` | `uploadResult.VideoMeta?.Uri ?? uploadResult.StoreUri` |
| `durationSeconds` | `uploadResult.VideoMeta?.Duration` |
| `videoUrl` | `POST /vod/signed-url` 接口换取的临时播放地址 |
