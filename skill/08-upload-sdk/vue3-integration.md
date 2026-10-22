# Skill: Vue 3 + Vite 项目集成实践

本项目已经完成 BytePlus Uploader 的集成，集中在 `src/composables/useVideoUpload.ts`；本文是对该 composable 的落地说明，可直接套用或按场景裁剪。

## 目录结构

```
src/
├── api/
│   ├── vod.ts          # 后端凭证 / 签名播放地址接口
│   └── file.ts         # 通用文件上传（非视频场景）
├── composables/
│   └── useVideoUpload.ts
├── utils/
│   └── vod-uploader.ts # 备用单例创建封装
└── views/drama/upload.vue
```

## `api/vod.ts`

```ts
export function fetchUploadSession()                       { return request.post('/vod/upload-session') }
export function refreshUploadSession()                     { return request.post('/vod/upload-session/refresh') }
export function applyUpload(params)                        { return request.post('/vod/apply-upload', params) }
export function saveFileInfo(data: FileInfoRequest)        { return request.post('/vod/file-info', data) }
export function getSignedUrl(data: SignedUrlRequest)       { return request.post('/vod/signed-url', data) }
```

## `composables/useVideoUpload.ts` 对外 API

```ts
const {
  pendingFiles,     // Ref<PendingFile[]> 组织阶段的待上传文件（含 id / file / size）
  uploadItems,      // Ref<UploadFileItem[]> 上传阶段的条目（含 progress / stage / vid / …）
  session,          // Ref<UploadSessionData | null>
  phase,            // Ref<'organize' | 'uploading'>

  addFiles,         // (files: File[]) => void     按文件名自然排序加入
  removePending,    // (id: string) => void
  movePending,      // (from: number, to: number) => void
  clearPending,     // () => void

  startUpload,      // () => Promise<boolean>      触发后端凭证 + SDK 创建 + start
  refreshStsToken,  // () => Promise<boolean>
  retryFailed,      // () => Promise<void>
  pause,            // (fileKey: string) => void
  resume,           // (fileKey: string) => void
  cancel,           // (fileKey: string) => void
  getBatchResult,   // () => BatchUploadResult | null
  reset,            // () => void
} = useVideoUpload(spaceName)
```

## 类型

```ts
interface UploadFileItem {
  pendingId: string
  file: File
  fileKey: string           // SDK 返回
  fileName: string          // `${storagePath}ep${idx}${ext}`
  progress: number          // 0..99 / 100
  stage: 'pending' | 'uploading' | 'complete' | 'error' | 'paused'
  stageLabel: string
  speed: number             // KB/s
  vid?: string
  storeUri?: string
  posterUri?: string
  durationSeconds?: number
  videoUrl?: string         // 签名播放地址（1 小时）
  error?: string
}

interface BatchUploadResult {
  episodes: {
    index: number
    fileName: string
    vid: string
    storeUri?: string
    posterUri?: string
    durationSeconds?: number
    videoUrl?: string
    fileSize: number
  }[]
}
```

## 页面使用示例

```vue
<script setup lang="ts">
import { useVideoUpload } from '@/composables/useVideoUpload'
import { createFullDrama } from '@/api/drama'

const SPACE_NAME = import.meta.env.VITE_VOD_SPACE_NAME || 'tiktok-minis-video'
const {
  pendingFiles, uploadItems, session, phase,
  addFiles, movePending, removePending, clearPending,
  startUpload, pause, resume, retryFailed, getBatchResult, reset,
} = useVideoUpload(SPACE_NAME)

async function handleStart() {
  await startUpload()
}

async function handleSubmit() {
  const result = getBatchResult()
  if (!result) return
  await createFullDrama({ drama, episodes: mapEpisodes(result), tagIds })
}
</script>
```

## 生命周期

- `onUnmounted` 内部调用 `uploader?.cancel()`，清空 `uploadItems`，避免离开页面后仍持有 SDK 实例 / Token。
- `reset()` 手动重置（例如用户选择重新组织文件时）。

## 备用：单例 `utils/vod-uploader.ts`

对于"单次文件上传"的场景（例如上传封面图），可以使用简版单例：

```ts
import BytePlusUploader from '@byteplus/uploader'
import { useAccountStore } from '@/stores/account'

let _instance: BytePlusUploader | null = null
export function getUploader(spaceName: string, region = 'ap-southeast-1') {
  if (_instance) return _instance
  const accountStore = useAccountStore()
  _instance = new BytePlusUploader({
    region,
    userId: String(accountStore.current?.userId ?? 'anonymous'),
    appId: Number(import.meta.env.VITE_VOD_APP_ID) || 0,
    videoConfig: { spaceName },
  } as any)
  return _instance
}
```

批量上传场景仍建议用 `useVideoUpload`，每页实例化一次，生命周期清晰。

## 关键注意事项

| 注意点 | 说明 |
|--------|------|
| Region 白名单 | `@byteplus/uploader` 仅接受 `ap-southeast-1 / ap-singapore-1`，其他值会抛初始化错误 |
| Token 有效期 | 默认 1 小时；大文件或多文件批量时通过 `error` → `refreshStsToken` 续传 |
| 事件注册时机 | 必须在 `start()` 之前调用 `uploader.on(...)`，否则会错过早期事件 |
| Vid 的使用 | 播放地址必须通过后端 `/vod/signed-url` 签名，不直接使用 `Uri` |
| 并发控制 | 项目依赖 SDK 默认并发（3）；超大批量可设置 `taskParallelLimit: 2` |
| 断点续传 | 依赖 `localStorage`；隐私模式 / 清缓存后需重新上传 |
| 类型问题 | SDK 类型声明较严格，项目内 `new BytePlusUploader({...} as any)` 规避；生产可写更严格的局部 d.ts |
