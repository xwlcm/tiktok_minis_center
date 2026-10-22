# 火山 VOD 上传 SDK — 概览

## 实际选型

- 项目代码中实际使用的是 **`@byteplus/uploader`**（国际版 BytePlus，`package.json` 版本 `^1.1.3`）。
- `package.json` 还保留 `tt-uploader ^1.6.1` 依赖，但代码中未使用，可视为历史遗留。
- 本目录以下内容均以 `@byteplus/uploader` 实际调用为准；与国内版 `tt-uploader` 的 API 形状基本一致，仅 region / 初始化参数命名略有差别。

## 文档入口

- BytePlus Web Uploader：https://docs.byteplus.com/en/docs/vod/web-uploader
- 国内版 tt-uploader（参考）：https://www.volcengine.com/docs/4/1222537

## SDK 能力

- 分片上传 + 断点续传（依赖 `localStorage`）
- 并行多文件上传（默认 3）
- 实时进度、完成、错误事件
- 上传后处理动作：截图（`Snapshot`）、元信息（`GetMeta`）、工作流等
- 支持 `refreshStsToken()` 动态更新凭证，无需重建实例

## 前置条件

1. 在火山视频点播控制台**创建空间** → `spaceName`。
2. 创建**应用** → 得到 `App ID`（`VITE_VOD_APP_ID`）。
3. **后端** 通过 VOD 服务端 SDK 签发**临时 STS Token** → 前端 `POST /vod/upload-session` 获取。

## 子模块

| Skill 文件 | 内容 |
|------------|------|
| `install-and-init.md` | 依赖安装、`BytePlusUploader` 参数与 region 约束 |
| `upload-flow.md` | 完整上传流程：STS → addFile → start → 事件 → 签名播放地址 |
| `api-reference.md` | 常用方法 / 事件签名 / 返回值 |
| `vue3-integration.md` | 本项目 `useVideoUpload` composable 的落地实践 |
