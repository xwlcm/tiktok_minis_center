# Skill: 安装与初始化

## 依赖

`package.json`：

```json
"dependencies": {
  "@byteplus/uploader": "^1.1.3"
}
```

安装：

```bash
npm install @byteplus/uploader
```

## 初始化（项目实际用法）

```ts
import BytePlusUploader from '@byteplus/uploader'
import { useAccountStore } from '@/stores/account'

const region = (data.region && data.region.trim()) || 'ap-southeast-1'
const accountStore = useAccountStore()

const uploader = new BytePlusUploader({
  region,                                             // 必填，仅 ap-southeast-1 / ap-singapore-1
  userId: String(accountStore.current?.userId ?? 'anonymous'),
  appId: Number(import.meta.env.VITE_VOD_APP_ID) || 0, // Number
  videoConfig: { spaceName: data.spaceName },
} as any)
```

## 初始化参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `region` | string | ✅ | **BytePlus 的约束**：仅接受 `ap-southeast-1` 或 `ap-singapore-1`；项目默认回退 `ap-southeast-1`；由后端 `/vod/upload-session` 下发 |
| `userId` | string | ✅ | 仅 ASCII；项目使用登录用户的 `userId` 字符串，匿名场景使用 `'anonymous'` |
| `appId` | number | ✅ | VOD 控制台应用 ID，`Number(import.meta.env.VITE_VOD_APP_ID)` |
| `videoConfig.spaceName` | string | ✅（视频） | VOD 空间名，默认 `tiktok-minis-video` |
| `useLocalStorage` | boolean | — | 断点续传依赖；未显式设置，走 SDK 默认（开启） |
| `taskParallelLimit` | number | — | 并行任务数；未显式设置 |
| `useServerCurrentTime` | boolean | — | 是否使用服务端当前时间避免本地时钟偏差 |

## STS Token 结构

```ts
// 来自 /vod/upload-session 响应（驼峰，注意与 SDK 所需 PascalCase 不同）
interface UploadSessionData {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  currentTime: string        // ISO 字符串
  expiredTime: string        // ISO 字符串
  spaceName: string
  storagePath: string        // 例如 "minis/drama/<dramaId>/"
  region: string
}

// 传给 SDK 时需要转 PascalCase
const stsToken = {
  AccessKeyId: data.accessKeyId,
  SecretAccessKey: data.secretAccessKey,
  SessionToken: data.sessionToken,
  CurrentTime: data.currentTime,
  ExpiredTime: data.expiredTime,
}
```

## 环境变量

`.env`：

```
VITE_VOD_APP_ID=<AppID>
VITE_VOD_SPACE_NAME=tiktok-minis-video
```

## 注意事项

1. `region` 在项目中是由**后端**决定并下发的（响应字段 `region`），前端仅做兜底。避免硬编码地域。
2. `appId` 必须是 Number；字符串会导致监控统计错乱。
3. 同一页面多次批量上传时，项目使用 `composables/useVideoUpload` 按需创建新实例，每个页面生命周期销毁一次。
4. 若 Token 过期，使用 `uploader.refreshStsToken(newStsToken)` 更新凭证，无需 `new` 新实例（参考 `upload-flow.md`）。
