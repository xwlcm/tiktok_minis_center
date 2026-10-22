import { ref, onUnmounted } from 'vue'
import BytePlusUploader from '@byteplus/uploader'
import { useAccountStore } from '@/stores/account.ts'
import { fetchUploadSession, refreshUploadSession, getSignedUrl } from '@/api/vod.ts'
import type { UploadSessionData } from '@/api/vod.ts'

export interface PendingFile {
  id: string
  file: File
  size: number
}

export type UploadStage =
  | 'pending'
  | 'uploading'
  | 'complete'
  | 'error'
  | 'paused'

export interface UploadFileItem {
  pendingId: string
  file: File
  fileKey: string
  fileName: string
  progress: number
  stage: UploadStage
  stageLabel: string
  speed: number
  vid?: string
  storeUri?: string
  posterUri?: string
  durationSeconds?: number
  videoUrl?: string
  error?: string
}

export interface BatchUploadResult {
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

const STAGE_LABEL: Record<UploadStage, string> = {
  pending:  '等待上传',
  uploading: '上传中',
  complete: '上传完成',
  error:    '上传失败',
  paused:   '已暂停',
}

let _pendingId = 0
function nextPendingId(): string {
  return `pf-${++_pendingId}`
}

export function useVideoUpload(spaceName: string) {
  const pendingFiles = ref<PendingFile[]>([])
  const uploadItems = ref<UploadFileItem[]>([])
  const session = ref<UploadSessionData | null>(null)
  const phase = ref<'organize' | 'uploading'>('organize')

  let uploader: BytePlusUploader | null = null
  let uploadEpisodeOffset = 0

  // ─── 工具 ────────────────────────────────────────────────

  function findIndexByKey(key: string): number {
    return uploadItems.value.findIndex((i) => i.fileKey === key)
  }

  function updateItem(index: number, patch: Partial<UploadFileItem>) {
    if (index < 0 || index >= uploadItems.value.length) return
    uploadItems.value.splice(index, 1, { ...uploadItems.value[index], ...patch })
  }

  function buildFileName(storagePath: string, index: number, originalName: string): string {
    const ext = originalName.includes('.') ? '.' + originalName.split('.').pop() : '.mp4'
    const idx = String(index).padStart(2, '0')
    return `${storagePath}ep${idx}${ext}`
  }

  // ─── 文件管理 ─────────────────────────────────────────────

  function sortByName(files: File[]): File[] {
    return [...files].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase(), undefined, { numeric: true })
    )
  }

  function addFiles(files: File[]) {
    const sorted = sortByName(files)
    for (const file of sorted) {
      pendingFiles.value.push({ id: nextPendingId(), file, size: file.size })
    }
  }

  /**
   * 追加上传：在上传阶段直接将新文件加入 uploader 并开始上传
   * 用于"追加上传"按钮 — 不回到 organize 阶段
   */
  async function appendFiles(files: File[]) {
    if (!uploader || !session.value) return

    // 保存当前 storagePath（追加模式下可能是覆盖的路径）
    const currentStoragePath = session.value.storagePath

    // 如果 session 过期，先刷新
    if (!isSessionValid()) {
      const ok = await refreshStsToken()
      if (!ok) return
      // 刷新后恢复原始 storagePath（refreshStsToken 会返回新路径）
      if (session.value) {
        session.value = { ...session.value, storagePath: currentStoragePath }
      }
    }

    const data = session.value!
    const stsToken = {
      AccessKeyId: data.accessKeyId,
      SecretAccessKey: data.secretAccessKey,
      SessionToken: data.sessionToken,
      CurrentTime: data.currentTime,
      ExpiredTime: data.expiredTime,
    }

    const sorted = sortByName(files)
    const startIndex = uploadItems.value.length

    for (let i = 0; i < sorted.length; i++) {
      const file = sorted[i]
      const episodeIndex = uploadEpisodeOffset + startIndex + i + 1
      const fileName = buildFileName(data.storagePath, episodeIndex, file.name)

      const fileKey = uploader.addFile({
        file,
        stsToken,
        type: 'video',
        fileName,
        processAction: [
          { name: 'GetMeta' },
          { name: 'Snapshot', input: { SnapshotTime: 1 } },
        ],
      })

      uploadItems.value.push({
        pendingId: nextPendingId(),
        file,
        fileKey,
        fileName,
        progress: 0,
        stage: 'pending',
        stageLabel: STAGE_LABEL.pending,
        speed: 0,
      })

      uploader.start(fileKey)
    }
  }

  function removePending(id: string) {
    pendingFiles.value = pendingFiles.value.filter((f) => f.id !== id)
  }

  function movePending(fromIndex: number, toIndex: number) {
    const arr = [...pendingFiles.value]
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    pendingFiles.value = arr
  }

  function clearPending() {
    pendingFiles.value = []
  }

  // ─── 事件绑定 ─────────────────────────────────────────────

  function bindEvents() {
    if (!uploader) return

    uploader.on('progress', (info: any) => {
      const idx = findIndexByKey(info.key)
      if (idx < 0) return
      const pct = typeof info.percent === 'number' ? info.percent : 0
      updateItem(idx, {
        stage: 'uploading',
        stageLabel: STAGE_LABEL.uploading,
        progress: Math.min(99, Math.round(pct)),
        speed: typeof info.speed === 'number' ? info.speed : 0,
      })
    })

    uploader.on('complete', async (info: any) => {
      const idx = findIndexByKey(info.key)
      if (idx < 0) return

      const result = info.uploadResult as Record<string, any> | undefined
      const vid = result?.Vid as string | undefined
      const posterUri = result?.PosterUri as string | undefined
      const videoMeta = result?.VideoMeta as Record<string, any> | undefined
      const storeUri = (videoMeta?.Uri ?? result?.StoreUri) as string | undefined
      const durationSeconds = typeof videoMeta?.Duration === 'number' ? videoMeta.Duration : undefined

      let videoUrl: string | undefined
      if (vid) {
        try {
          const signed = await getSignedUrl({ vid, expireSeconds: 3600 })
          videoUrl = signed.playAuthToken
        } catch (err) {
          console.error('[VOD] 获取播放凭证失败', err)
        }
      }

      updateItem(idx, {
        stage: 'complete',
        stageLabel: STAGE_LABEL.complete,
        progress: 100,
        vid,
        storeUri,
        posterUri,
        durationSeconds,
        videoUrl,
      })
    })

    uploader.on('error', (info: any) => {
      const idx = findIndexByKey(info.key)
      if (idx < 0) return

      const extra = info.extra
      const errMsg =
        typeof extra === 'string'
          ? extra
          : (extra as any)?.message ?? JSON.stringify(extra)

      // token 过期时尝试自动刷新
      if (
        typeof errMsg === 'string' &&
        (errMsg.includes('token expired') || errMsg.includes('secret token') || errMsg.includes('100026'))
      ) {
        handleTokenExpired()
      } else {
        updateItem(idx, {
          stage: 'error',
          stageLabel: STAGE_LABEL.error,
          error: typeof errMsg === 'string' ? errMsg : '上传失败',
        })
      }
    })
  }

  // ─── Token 过期处理：用 refreshStsToken 方法刷新，无需重建实例 ────────

  async function handleTokenExpired() {
    if (!uploader) return
    console.log('[VOD] Token 过期，刷新凭证...')

    // 保存当前 storagePath
    const currentStoragePath = session.value?.storagePath

    const incompleteItems = uploadItems.value.filter((i) => i.stage === 'uploading' || i.stage === 'error')
    for (const item of incompleteItems) {
      const idx = findIndexByKey(item.fileKey)
      if (idx >= 0) updateItem(idx, { stageLabel: '刷新凭证中...' })
    }

    try {
      const data = await refreshUploadSession()
      session.value = data

      // 恢复原始 storagePath（追加模式下不能用新路径）
      if (currentStoragePath) {
        session.value = { ...session.value, storagePath: currentStoragePath }
      }

      uploader.refreshStsToken({
        AccessKeyId: data.accessKeyId,
        SecretAccessKey: data.secretAccessKey,
        SessionToken: data.sessionToken,
        CurrentTime: data.currentTime,
        ExpiredTime: data.expiredTime,
      })

      // 只恢复正在上传的任务，不恢复用户手动暂停的
      for (const item of incompleteItems) {
        const idx = findIndexByKey(item.fileKey)
        if (idx >= 0) {
          updateItem(idx, { stage: 'uploading', stageLabel: STAGE_LABEL.uploading })
        }
        uploader.start(item.fileKey)
      }

      console.log('[VOD] 凭证刷新成功，继续上传')
    } catch (err) {
      console.error('[VOD] 刷新凭证失败', err)
      for (const item of incompleteItems) {
        const idx = findIndexByKey(item.fileKey)
        if (idx >= 0) {
          updateItem(idx, {
            stage: 'error',
            stageLabel: STAGE_LABEL.error,
            error: '上传凭证过期，刷新失败，请重试',
          })
        }
      }
    }
  }

  // ─── 开始上传 ─────────────────────────────────────────────

  /**
   * 检查 session 是否仍然有效（提前 5 分钟视为过期）
   */
  function isSessionValid(): boolean {
    if (!session.value?.expiredTime) return false
    const expireTime = new Date(session.value.expiredTime).getTime()
    const bufferMs = 5 * 60 * 1000 // 提前 5 分钟刷新
    return Date.now() < expireTime - bufferMs
  }

  async function startUpload(overrideStoragePath?: string, startEpisodeOffset = 0): Promise<boolean> {
    if (pendingFiles.value.length === 0) return false
    uploadEpisodeOffset = startEpisodeOffset

    // 复用未过期的 session，保证同一批次 storagePath 一致
    if (!isSessionValid()) {
      const data = await fetchUploadSession()
      session.value = data
    }

    // 追加模式：使用已有短剧的存储路径，而不是新生成的
    if (overrideStoragePath) {
      session.value = { ...session.value!, storagePath: overrideStoragePath }
    }

    const data = session.value!
    phase.value = 'uploading'

    const accountStore = useAccountStore()

    // 创建 @byteplus/uploader 实例
    // region 为必填项，SDK 仅接受 ap-southeast-1 / ap-singapore-1
    // 若后端未下发（老版本），回退到 ap-southeast-1
    const region = data.region && data.region.trim() ? data.region.trim() : 'ap-southeast-1'
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

    const items: UploadFileItem[] = []

    for (let i = 0; i < pendingFiles.value.length; i++) {
      const pf = pendingFiles.value[i]
      const episodeIndex = startEpisodeOffset + i + 1
      const fileName = buildFileName(data.storagePath, episodeIndex, pf.file.name)

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

      items.push({
        pendingId: pf.id,
        file: pf.file,
        fileKey,
        fileName,
        progress: 0,
        stage: 'pending',
        stageLabel: STAGE_LABEL.pending,
        speed: 0,
      })
    }

    uploadItems.value = items
    uploader.start()
    return true
  }

  // ─── 控制 ─────────────────────────────────────────────────

  function pause(fileKey: string) {
    uploader?.pause(fileKey)
    const idx = findIndexByKey(fileKey)
    if (idx >= 0) updateItem(idx, { stage: 'paused', stageLabel: STAGE_LABEL.paused })
  }

  function resume(fileKey: string) {
    uploader?.start(fileKey)
    const idx = findIndexByKey(fileKey)
    if (idx >= 0) updateItem(idx, { stage: 'uploading', stageLabel: STAGE_LABEL.uploading })
  }

  function cancel(fileKey: string) {
    uploader?.cancel(fileKey)
    uploadItems.value = uploadItems.value.filter((i) => i.fileKey !== fileKey)
  }

  async function retryFailed() {
    const failedItems = uploadItems.value.filter((i) => i.stage === 'error')
    if (!failedItems.length || !uploader || !session.value) return

    // 重试前检查 token 是否过期
    if (!isSessionValid()) {
      const ok = await refreshStsToken()
      if (!ok) return
    }

    for (const item of failedItems) {
      const idx = findIndexByKey(item.fileKey)
      if (idx >= 0) updateItem(idx, { stage: 'uploading', stageLabel: STAGE_LABEL.uploading, progress: 0 })
      uploader.start(item.fileKey)
    }
  }

  function getBatchResult(): BatchUploadResult | null {
    const doneItems = uploadItems.value.filter((i) => i.stage === 'complete' && i.vid)
    if (doneItems.length === 0) return null
    return {
      episodes: doneItems.map((item, idx) => ({
        index: idx + 1,
        fileName: item.fileName,
        vid: item.vid ?? '',
        storeUri: item.storeUri,
        posterUri: item.posterUri,
        durationSeconds: item.durationSeconds,
        videoUrl: item.videoUrl,
        fileSize: item.file.size,
      })),
    }
  }

  function reset() {
    try { uploader?.cancel() } catch {}
    uploader = null
    pendingFiles.value = []
    uploadItems.value = []
    session.value = null
    phase.value = 'organize'
    uploadEpisodeOffset = 0
  }

  async function refreshStsToken(): Promise<boolean> {
    try {
      const data = await refreshUploadSession()
      session.value = data
      if (uploader) {
        uploader.refreshStsToken({
          AccessKeyId: data.accessKeyId,
          SecretAccessKey: data.secretAccessKey,
          SessionToken: data.sessionToken,
          CurrentTime: data.currentTime,
          ExpiredTime: data.expiredTime,
        })
      }
      return true
    } catch {
      return false
    }
  }

  onUnmounted(() => {
    try { uploader?.cancel() } catch {}
    uploader = null
    uploadItems.value = []
  })

  return {
    pendingFiles,
    uploadItems,
    session,
    phase,
    addFiles,
    appendFiles,
    removePending,
    movePending,
    clearPending,
    startUpload,
    refreshStsToken,
    retryFailed,
    pause,
    resume,
    cancel,
    getBatchResult,
    reset,
  }
}
