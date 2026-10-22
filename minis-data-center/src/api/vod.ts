import request from '@/utils/request.ts'

/**
 * VOD 上传会话数据（后端 /vod/upload-session 返回）
 *
 * 对应 BytePlus VOD SDK getUploadSts2WithExpire 签发的临时凭证
 * 前端用于初始化 @byteplus/uploader 的 stsToken 参数
 */
export interface UploadSessionData {
  /** 临时 AccessKey ID */
  accessKeyId: string
  /** 临时 SecretAccessKey */
  secretAccessKey: string
  /** 临时 Session Token */
  sessionToken: string
  /** 凭证过期时间 */
  expiredTime: string
  /** 凭证签发时间 */
  currentTime: string
  /** VOD 空间名称 */
  spaceName: string
  /** 存储路径前缀 */
  storagePath: string
  /** 火山引擎 VOD 区域，如 ap-southeast-1 / ap-singapore-1 */
  region: string
}

export interface FileInfoRequest {
  vid: string
  storeUri?: string
  durationSeconds?: number
  fileName?: string
  fileSize?: number
  posterUrl?: string
}

export interface SignedUrlRequest {
  vid: string
  expireSeconds?: number
}

export interface SignedUrlResponse {
  /** 播放鉴权 Token（传给 Player SDK） */
  playAuthToken: string
  /** 视频 ID */
  vid: string
  /** 凭证过期时间 */
  expiredTime: string
}

/**
 * 获取 VOD 上传临时凭证
 *
 * 前端在上传前调用，拿到 STS Token 后初始化 BytePlusUploader
 */
export function fetchUploadSession() {
  return request.post<UploadSessionData>('/vod/upload-session')
}

/**
 * 刷新 VOD 上传凭证
 *
 * Token 过期时调用，通过 uploader.refreshStsToken() 更新凭证
 */
export function refreshUploadSession() {
  return request.post<UploadSessionData>('/vod/upload-session/refresh')
}

/**
 * 保存上传文件信息（上传完成后回调）
 */
export function saveFileInfo(data: FileInfoRequest) {
  return request.post('/vod/file-info', data)
}

/**
 * 获取临时签名播放 URL
 */
export function getSignedUrl(data: SignedUrlRequest) {
  return request.post<SignedUrlResponse>('/vod/signed-url', data)
}
