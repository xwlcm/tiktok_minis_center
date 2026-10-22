<template>
  <div class="upload-page">
    <div class="page-header">
      <a-button type="text" class="back-btn" @click="$router.back()">
        <template #icon><icon-arrow-left /></template>
        返回
      </a-button>
      <div>
        <div class="page-title">{{ isAppendMode ? '追加剧集' : '上传短剧' }}</div>
        <div class="page-subtitle">
          <template v-if="isAppendMode && appendDrama">
            为「{{ appendDrama.name }}」追加剧集（已有 {{ appendExistingEpisodes.length }} 集）
          </template>
          <template v-else>
            填写短剧信息并上传视频集数
          </template>
        </div>
      </div>
    </div>

    <div class="form-card">
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        @submit="handleSubmit"
      >
        <div v-if="!isAppendMode" class="form-section">
          <div class="form-section-title">基本信息</div>
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item field="name" label="短剧名称">
                <a-input v-model="form.name" placeholder="请输入短剧名称，2–150 字符" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="tagIds" label="标签">
                <a-select
                  v-model="form.tagIds"
                  multiple
                  allow-search
                  allow-clear
                  placeholder="选择标签（建议不超过5个）"
                  :options="tagOptions"
                  :loading="tagsLoading"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item field="description" label="短剧描述">
            <a-textarea
              v-model="form.description"
              placeholder="请输入短剧描述（选填）"
              :max-length="500"
              show-word-limit
              :auto-size="{ minRows: 3, maxRows: 5 }"
            />
          </a-form-item>
          <a-row :gutter="20">
            <a-col :span="12">
              <a-form-item field="coverUrl" label="封面图片">
                <div class="cover-upload-area">
                  <div v-if="coverPreviewUrl || form.coverUrl" class="cover-preview">
                    <img :src="coverPreviewUrl || form.coverUrl" alt="封面" class="cover-img" />
                    <div class="cover-actions">
                      <a-button type="text" size="small" status="danger" @click="removeCover">
                        <template #icon><icon-delete /></template>
                        移除
                      </a-button>
                    </div>
                  </div>
                  <div v-else class="cover-placeholder" @click="triggerCoverUpload">
                    <icon-plus style="font-size: 24px; color: var(--mc-text-tertiary)" />
                    <span class="cover-placeholder-text">点击上传封面</span>
                    <span class="cover-placeholder-hint">支持 JPG/PNG，建议 3:4 比例</span>
                  </div>
                  <div v-if="coverUploading" class="cover-loading">
                    <a-spin :size="20" />
                    <span>上传中...</span>
                  </div>
                </div>
                <input
                  ref="coverInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style="display: none"
                  @change="handleCoverFileChange"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <template v-if="!isAppendMode">
        <div class="form-divider" ></div>

        <div class="form-section">
          <div class="form-section-title">解锁与价格配置</div>
          <a-row :gutter="20">
            <a-col :span="8">
              <a-form-item field="freeEpisodes" label="免费集数" extra="前 N 集免费">
                <a-input-number
                  v-model="form.freeEpisodes"
                  :min="0"
                  :max="9999"
                  placeholder="0"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="unlockMode" label="解锁模式">
                <a-select v-model="form.unlockMode" placeholder="请选择解锁模式" style="width: 100%">
                  <a-option value="IAA_ONLY">仅广告解锁</a-option>
                  <a-option value="IAP_ONLY">仅付费解锁</a-option>
                  <a-option value="IAA_IAP">广告或付费解锁</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col v-if="showAdRuleSelect" :span="8">
              <a-form-item field="adPushRuleId" label="广告推送规则" extra="选择该短剧关联的广告推送规则">
                <a-select
                  v-model="form.adPushRuleId"
                  placeholder="请选择广告推送规则"
                  allow-clear
                  style="width: 100%"
                >
                  <a-option v-for="rule in adPushRules" :key="rule.id" :value="rule.id">
                    {{ rule.ruleName }}（{{ unlockRuleDesc(rule) }}）
                  </a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row v-if="showPriceFields" :gutter="20">
            <a-col :span="8">
              <a-form-item field="episodePrice" label="单集价格（分）" extra="例如：300 表示 3元">
                <a-input-number
                  v-model="form.episodePrice"
                  :min="0"
                  placeholder="0"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="bundlePrice" label="整剧价格（分）" extra="0 表示不支持整剧购买">
                <a-input-number
                  v-model="form.bundlePrice"
                  :min="0"
                  placeholder="0"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item field="sortWeight" label="排序权重" extra="数值越大越靠前">
                <a-input-number
                  v-model="form.sortWeight"
                  :min="0"
                  placeholder="100"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row v-else :gutter="20">
            <a-col :span="8">
              <a-form-item field="sortWeight" label="排序权重" extra="数值越大越靠前">
                <a-input-number
                  v-model="form.sortWeight"
                  :min="0"
                  placeholder="100"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item field="isRecommended" label="是否推荐">
            <a-radio-group v-model="form.isRecommended" direction="horizontal">
              <a-radio :value="1">推荐</a-radio>
              <a-radio :value="0">不推荐</a-radio>
            </a-radio-group>
          </a-form-item>
        </div>

        <div class="form-divider" ></div>
        </template>

        <!-- 共享的文件选择 input（不受阶段切换影响） -->
        <input
          ref="fileInput"
          type="file"
          accept="video/mp4,video/quicktime"
          multiple
          style="display: none"
          @change="onFileChange"
        />

        <!-- ═══ 阶段一：组织文件 ═══ -->
        <div v-if="phase === 'organize'" class="form-section">
          <div class="form-section-title">
            视频集数
            <span v-if="pendingFiles.length" class="section-count">共 {{ pendingFiles.length }} 个文件</span>
          </div>

          <div
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
          >
            <icon-upload class="drop-zone-icon" />
            <div class="drop-zone-text">点击或拖拽视频文件到此处</div>
            <div class="drop-zone-hint">支持 mp4 / mov，单文件不超过 2GB，添加后按文件名自动排序</div>
          </div>

          <div v-if="pendingFiles.length" class="pending-list">
            <div class="pending-toolbar">
              <span class="pending-tip">拖拽行可调整顺序，确认无误后点击下方按钮开始上传</span>
              <div class="pending-toolbar-actions">
                <a-button type="text" size="mini" @click="fileInput?.click()">
                  <template #icon><icon-plus /></template>
                  继续添加
                </a-button>
                <a-button type="text" size="mini" status="danger" @click="clearPending">清空全部</a-button>
              </div>
            </div>
            <div
              v-for="(pf, idx) in pendingFiles"
              :key="pf.id"
              class="pending-item"
              draggable="true"
              @dragstart="dragStart(idx)"
              @dragover.prevent="dragOver(idx)"
              @drop.prevent="dropItem(idx)"
              @dragend="dragEnd"
            >
              <span class="pending-drag" title="拖拽排序"><icon-drag-dot-vertical /></span>
              <span class="pending-ep">EP{{ String((isAppendMode ? appendEpisodeOffset : 0) + idx + 1).padStart(2, '0') }}</span>
              <span class="pending-name">{{ pf.file.name }}</span>
              <span class="pending-size">{{ formatSize(pf.size) }}</span>
              <a-button type="text" size="mini" @click="movePending(idx, idx - 1)" :disabled="idx === 0">
                <template #icon><icon-arrow-up /></template>
              </a-button>
              <a-button type="text" size="mini" @click="movePending(idx, idx + 1)" :disabled="idx === pendingFiles.length - 1">
                <template #icon><icon-arrow-down /></template>
              </a-button>
              <a-button type="text" size="mini" status="danger" @click="removePending(pf.id)">
                <template #icon><icon-delete /></template>
              </a-button>
            </div>
          </div>

          <div class="form-footer">
            <a-button @click="$router.back()">取消</a-button>
            <a-button
              type="primary"
              :disabled="pendingFiles.length === 0"
              :loading="starting"
              @click="handleStartUpload"
            >
              确认顺序，开始上传
            </a-button>
          </div>
        </div>

        <!-- ═══ 阶段二：上传中 ═══ -->
        <div v-else class="form-section">
          <div class="form-section-title">
            上传进度
            <span class="section-count">
              {{ uploadItems.filter(i => i.stage === 'complete').length }} / {{ uploadItems.length }} 已完成
            </span>
          </div>

          <div v-if="session" class="upload-session-info">
            <span class="upload-session-label">存储路径</span>
            <span class="upload-session-path">{{ session.storagePath }}</span>
          </div>

          <div class="upload-list">
            <div
              v-for="(item, idx) in uploadItems"
              :key="item.fileKey"
              class="upload-item"
            >
              <div class="upload-item-row">
                <div class="upload-item-left">
                  <span class="upload-item-ep">EP{{ String((isAppendMode ? appendEpisodeOffset : 0) + idx + 1).padStart(2, '0') }}</span>
                  <span class="upload-item-name">{{ item.file.name }}</span>
                  <span class="upload-item-size">{{ formatSize(item.file.size) }}</span>
                </div>
                <div class="upload-item-actions">
                  <span
                    class="upload-item-stage"
                    :class="{
                      'upload-item-stage--active': item.stage === 'uploading',
                      'upload-item-stage--complete': item.stage === 'complete',
                      'upload-item-stage--error': item.stage === 'error',
                      'upload-item-stage--paused': item.stage === 'paused',
                    }"
                  >
                    <template v-if="item.stage === 'uploading'">{{ item.progress }}% · {{ formatSpeed(item.speed) }}</template>
                    <template v-else-if="item.stage === 'paused'">已暂停 {{ item.progress }}%</template>
                    <template v-else-if="item.stage === 'complete'">✓ 完成</template>
                    <template v-else-if="item.stage === 'error'">上传失败</template>
                    <template v-else>{{ item.stageLabel }}</template>
                  </span>
                  <a-button
                    v-if="item.stage === 'uploading'"
                    type="text"
                    size="mini"
                    @click="pause(item.fileKey)"
                  >
                    <template #icon><icon-pause /></template>
                  </a-button>
                  <a-button
                    v-if="item.stage === 'paused'"
                    type="text"
                    size="mini"
                    @click="resume(item.fileKey)"
                  >
                    <template #icon><icon-play-arrow /></template>
                  </a-button>
                  <a-button
                    v-if="item.stage === 'error'"
                    type="text"
                    size="mini"
                    status="warning"
                    @click="retryItem(item)"
                  >
                    <template #icon><icon-refresh /></template>
                  </a-button>
                  <a-button
                    v-if="item.stage !== 'complete'"
                    type="text"
                    size="mini"
                    status="danger"
                    @click="cancel(item.fileKey)"
                    title="取消上传"
                  >
                    <template #icon><icon-close /></template>
                  </a-button>
                </div>
              </div>
              <div class="upload-item-progress-row">
                <div class="upload-progress-bar">
                  <div
                    class="upload-progress-fill"
                    :class="{
                      'upload-progress-fill--complete': item.stage === 'complete',
                      'upload-progress-fill--error': item.stage === 'error',
                      'upload-progress-fill--paused': item.stage === 'paused',
                    }"
                    :style="{ width: item.progress + '%' }"
                  ></div>
                </div>
                <span v-if="item.stage === 'complete' && item.vid" class="upload-item-vid">Vid: {{ item.vid }}</span>
                <span v-if="item.stage === 'error'" class="upload-item-error-msg">{{ item.error }}</span>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <a-button @click="handleResetUpload">重新选择文件</a-button>
            <a-button @click="fileInput?.click()">
              <template #icon><icon-plus /></template>
              追加上传
            </a-button>
            <a-button
              type="primary"
              :loading="submitting"
              :disabled="uploadItems.length === 0 || uploadItems.some(i => i.stage !== 'complete')"
              @click="handleSubmit"
            >
              {{ isAppendMode ? '提交追加剧集' : '提交短剧' }}
            </a-button>
          </div>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import BytePlusUploader from '@byteplus/uploader'
import { appendEpisodes, createFullDrama, fetchTagList, fetchDramaDetail, fetchEpisodeList } from '@/api/drama.ts'
import { fetchAdPushRuleList } from '@/api/ad.ts'
import { fetchUploadSession } from '@/api/vod.ts'
import type { AdPushRule, Drama, Episode } from '@/types/drama.ts'
import { unlockRuleDesc } from '@/types/drama.ts'
import { useVideoUpload } from '@/composables/useVideoUpload.ts'
import type { UploadFileItem } from '@/composables/useVideoUpload.ts'
import type { EpisodeCreateInfo } from '@/types/drama.ts'
import { useAppStore } from '@/stores/app.ts'
import { useAccountStore } from '@/stores/account.ts'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const accountStore = useAccountStore()
const formRef = ref()
const submitting = ref(false)
const starting = ref(false)
const tagsLoading = ref(false)
const tagOptions = ref<{ label: string; value: string }[]>([])
const adPushRules = ref<AdPushRule[]>([])
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const coverInput = ref<HTMLInputElement>()
const coverUploading = ref(false)
const coverPreviewUrl = ref('')

let dragFrom = -1

// ─── 追加模式（从详情页跳转过来） ─────────────────────────────
const appendDramaId = ref<string>('')
const appendDrama = ref<Drama | null>(null)
const appendExistingEpisodes = ref<Episode[]>([])
const isAppendMode = computed(() => !!appendDramaId.value)
const appendEpisodeOffset = computed(() =>
  appendExistingEpisodes.value.reduce(
    (max, episode) => Math.max(max, Number(episode.episodeNumber) || 0),
    0,
  ),
)

const SPACE_NAME = import.meta.env.VITE_VOD_SPACE_NAME || 'tiktok-minis-video'
const {
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
} = useVideoUpload(SPACE_NAME)

const form = ref({
  name: '',
  description: '',
  tagIds: [] as string[],
  coverUrl: '',
  freeEpisodes: 3,
  unlockMode: 'IAA_ONLY',
  adPushRuleId: undefined as string | undefined,
  episodePrice: 0,
  bundlePrice: 0,
  sortWeight: 100,
  isRecommended: 0,
})

const showAdRuleSelect = computed(() => form.value.unlockMode === 'IAA_ONLY' || form.value.unlockMode === 'IAA_IAP')
const showPriceFields = computed(() => form.value.unlockMode === 'IAP_ONLY' || form.value.unlockMode === 'IAA_IAP')

const rules = {
  name: [
    { required: true, message: '请输入短剧名称' },
    { minLength: 2, maxLength: 150, message: '名称长度 2–150 字符' }
  ],
  coverUrl: [
    { required: true, message: '请上传短剧封面' },
  ],
  adPushRuleId: [
    { required: true, message: '请选择广告解锁规则' },
  ],
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function formatSpeed(kbPerSec: number): string {
  if (!kbPerSec || kbPerSec <= 0) return ''
  if (kbPerSec < 1024) return kbPerSec.toFixed(0) + ' KB/s'
  return (kbPerSec / 1024).toFixed(1) + ' MB/s'
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const fileList = Array.from(files)
  // 上传阶段：追加到 uploader 直接开始上传
  if (phase.value === 'uploading') {
    appendFiles(fileList)
  } else {
    addFiles(fileList)
  }
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files) return
  addFiles(Array.from(files))
}

function dragStart(idx: number) { dragFrom = idx }
function dragOver(_idx: number) {}
function dropItem(idx: number) {
  if (dragFrom >= 0 && dragFrom !== idx) {
    movePending(dragFrom, idx)
  }
  dragFrom = -1
}
function dragEnd() { dragFrom = -1 }

// ─── 封面上传 ─────────────────────────────────────────────

function triggerCoverUpload() {
  coverInput.value?.click()
}

function removeCover() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
  }
  form.value.coverUrl = ''
  coverPreviewUrl.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

async function handleCoverFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 本地预览
  coverPreviewUrl.value = URL.createObjectURL(file)
  coverUploading.value = true

  try {
    // 获取 STS Token
    const tokenData = await fetchUploadSession()
    const region = tokenData.region?.trim() || 'ap-southeast-1'

    // 创建 uploader 实例
    const uploader = new BytePlusUploader({
      region,
      userId: String(accountStore.current?.userId ?? 'anonymous'),
      appId: Number(import.meta.env.VITE_VOD_APP_ID) || 0,
      videoConfig: { spaceName: tokenData.spaceName },
    } as any)

    const stsToken = {
      AccessKeyId: tokenData.accessKeyId,
      SecretAccessKey: tokenData.secretAccessKey,
      SessionToken: tokenData.sessionToken,
      CurrentTime: tokenData.currentTime,
      ExpiredTime: tokenData.expiredTime,
    }

    const fileKey = uploader.addFile({
      file,
      stsToken,
      type: 'media',
    })

    // 监听完成
    uploader.on('complete', async (info: any) => {
      const result = info.uploadResult as Record<string, any> | undefined
      // media 类型返回 Vid，存 vid 到 coverUrl，后端返回列表时动态解析为 CDN URL
      const vid = result?.Vid as string | undefined
      if (vid) {
        form.value.coverUrl = vid
      }
      coverUploading.value = false
      Message.success('封面上传成功')
    })

    uploader.on('error', (info: any) => {
      coverUploading.value = false
      if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
      const errMsg = info.extra?.message ?? '封面上传失败'
      Message.error(typeof errMsg === 'string' ? errMsg : '封面上传失败')
    })

    uploader.start(fileKey)
  } catch (err) {
    coverUploading.value = false
    if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = ''
    Message.error('封面上传失败')
    console.error('[Cover] 上传失败', err)
  }
}

// ─── 开始上传视频 ─────────────────────────────────────────

async function handleStartUpload() {
  // 追加模式不需要验证完整表单
  if (!isAppendMode.value) {
    const errors = await formRef.value.validate()
    if (errors) {
      const firstErrorField = document.querySelector('.arco-form-item-status-error')
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
  }
  starting.value = true
  try {
    const ok = await startUpload(
      isAppendMode.value ? appendDrama.value?.storagePath : undefined,
      isAppendMode.value ? appendEpisodeOffset.value : 0,
    )
    if (!ok) {
      Message.error('启动上传失败')
    }
  } finally {
    starting.value = false
  }
}

async function retryItem(_item: UploadFileItem) {
  await retryFailed()
}

async function handleSubmit() {
  // 追加模式不需要验证完整表单
  if (!isAppendMode.value) {
    const errors = await formRef.value.validate()
    if (errors) return
  }
  submitting.value = true
  try {
    const result = getBatchResult()
    if (!result || result.episodes.length === 0) {
      Message.error('请确保至少有一个视频上传完成')
      return
    }

    if (isAppendMode.value) {
      // ─── 追加模式：批量提交剧集，后端事务内同步短剧信息 ───
      const startEp = appendEpisodeOffset.value + 1
      const freeEpisodes = appendDrama.value?.freeEpisodes ?? 3
      const episodes: EpisodeCreateInfo[] = result.episodes.map((ep, index) => {
        const episodeNumber = startEp + index
        return {
          episodeNumber,
          name: `第${episodeNumber}集`,
          duration: ep.durationSeconds,
          videoUrl: ep.vid,
          vid: ep.vid,
          posterUrl: ep.posterUri,
          isFree: episodeNumber <= freeEpisodes ? 1 : 0,
          status: 1,
        }
      })

      const successCount = await appendEpisodes({
        dramaId: appendDramaId.value,
        episodes,
        storagePath: session.value?.storagePath,
      })

      Message.success(`成功追加 ${successCount} 集，视频处理中`)

      clearUploadProgress()
      reset()
      router.push(`/drama/${appendDramaId.value}`)
    } else {
      // ─── 新建模式 ───
      const episodes: EpisodeCreateInfo[] = result.episodes.map((ep) => ({
        episodeNumber: ep.index,
        name: `第${ep.index}集`,
        duration: ep.durationSeconds,
        videoUrl: ep.vid,
        vid: ep.vid,
        isFree: ep.index <= form.value.freeEpisodes ? 1 : 0,
        status: 1,
      }))

      const tagIds = form.value.tagIds.filter(Boolean)

      await createFullDrama({
        drama: {
          name: form.value.name,
          description: form.value.description,
          coverUrl: form.value.coverUrl,
          totalEpisodes: episodes.length,
          freeEpisodes: form.value.freeEpisodes,
          unlockMode: form.value.unlockMode,
          adPushRuleId: form.value.adPushRuleId,
          episodePrice: form.value.episodePrice,
          bundlePrice: form.value.bundlePrice,
          sortWeight: form.value.sortWeight,
          status: 1,
          isRecommended: form.value.isRecommended,
          clientKey: appStore.currentClientKey,
          storagePath: session.value?.storagePath,
        },
        episodes,
        tagIds,
      })

      Message.success('短剧创建成功，视频处理中')
      clearUploadProgress()
      reset()
      router.push('/drama/list')
    }
  } finally {
    submitting.value = false
  }
}

function clearUploadProgress() {
  sessionStorage.removeItem(STORAGE_KEY)
}

function handleResetUpload() {
  reset()
  clearUploadProgress()
}

async function loadTags() {
  tagsLoading.value = true
  try {
    const res = await fetchTagList()
    const tags = res && typeof res === 'object' && 'rows' in res ? (res as any).rows : Array.isArray(res) ? res : []
    tagOptions.value = tags
      .filter((t: any) => t.status === 1)
      .map((t: any) => ({ label: t.name, value: String(t.id) }))
  } catch {
    tagOptions.value = []
  } finally {
    tagsLoading.value = false
  }
}

async function loadAdPushRules() {
  try {
    const data = await fetchAdPushRuleList()
    adPushRules.value = Array.isArray(data) ? data : []
  } catch {
    adPushRules.value = []
  }
}

// ─── 防刷新丢失：拦截页面关闭 + sessionStorage 恢复 ─────────

const STORAGE_KEY = 'drama_upload_progress'

function hasActiveUpload(): boolean {
  return phase.value === 'uploading' || uploadItems.value.some(i => i.stage === 'uploading' || i.stage === 'complete')
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (hasActiveUpload()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// 上传结果变化时自动保存到 sessionStorage
watch(uploadItems, (items) => {
  if (isAppendMode.value) {
    return
  }
  const completed = items.filter(i => i.stage === 'complete' && i.vid)
  if (completed.length > 0) {
    const data = {
      form: form.value,
      episodes: completed.map(i => ({
        vid: i.vid,
        fileName: i.fileName,
        durationSeconds: i.durationSeconds,
      })),
      savedAt: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}, { deep: true })

async function loadAppendDramaInfo(dramaId: string) {
  try {
    const [drama, episodes] = await Promise.all([
      fetchDramaDetail(dramaId),
      fetchEpisodeList(dramaId),
    ])
    appendDrama.value = drama as Drama
    appendExistingEpisodes.value = (episodes as Episode[]) || []
  } catch {
    Message.error('加载短剧信息失败')
    appendDramaId.value = ''
    clearUploadProgress()
    reset()
  }
}

function tryRestoreProgress() {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const data = JSON.parse(raw)
    // 超过 2 小时的缓存不恢复
    if (Date.now() - data.savedAt > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    if (data.episodes?.length > 0) {
      Message.info({
        content: `检测到上次未完成的上传（${data.episodes.length} 个视频），已恢复表单数据`,
        duration: 5000,
      })
      // 恢复表单
      if (data.form) {
        Object.assign(form.value, data.form)
      }
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

onMounted(() => {
  loadTags()
  loadAdPushRules()

  // 追加模式：从详情页跳转过来带 dramaId
  const dramaId = route.query.dramaId as string
  if (dramaId) {
    clearUploadProgress()
    reset()
    appendDramaId.value = dramaId
    loadAppendDramaInfo(dramaId)
  } else {
    tryRestoreProgress()
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.upload-page { max-width: 800px; }

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.back-btn { color: var(--mc-text-tertiary) !important; padding: 0 !important; }
.back-btn:hover { color: var(--mc-primary) !important; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }

.form-card {
  background: #ffffff;
  border: 1px solid rgba(31, 80, 132, 0.13);
  border-radius: 12px;
  padding: 24px;
}
.form-section-title {
  font-size: 13px; font-weight: 600;
  color: rgba(22, 41, 63, 0.92);
  margin-bottom: 16px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(31, 80, 132, 0.13);
  display: flex; align-items: center; gap: 10px;
}
.section-count {
  font-size: 11px; font-weight: 400;
  color: rgba(22, 41, 63, 0.47);
}
.form-divider { height: 1px; background: rgba(22, 41, 63, 0.09); margin: 20px 0; }
.form-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding-top: 16px; border-top: 1px solid rgba(22, 41, 63, 0.09); margin-top: 4px;
}

.drop-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 32px 20px;
  border: 1.5px dashed rgba(31, 80, 132, 0.22);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  background: rgba(76, 157, 228, 0.04);
}
.drop-zone:hover, .drop-zone--active {
  border-color: rgba(76, 157, 228, 0.45);
  background: rgba(76, 157, 228, 0.04);
}
.drop-zone-icon { font-size: 28px; color: rgba(22, 41, 63, 0.24); }
.drop-zone-text { font-size: 13px; color: rgba(22, 41, 63, 0.68); font-weight: 500; }
.drop-zone-hint { font-size: 11px; color: rgba(22, 41, 63, 0.34); }

.pending-list { margin-top: 12px; }
.pending-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px; padding: 0 4px;
}
.pending-toolbar-actions {
  display: flex; align-items: center; gap: 4px;
}
.pending-tip { font-size: 11px; color: rgba(22, 41, 63, 0.41); }
.pending-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: grab;
  transition: background 0.12s, border-color 0.12s;
}
.pending-item:hover {
  background: rgba(76, 157, 228, 0.06);
  border-color: rgba(31, 80, 132, 0.18);
}
.pending-drag {
  color: rgba(22, 41, 63, 0.2);
  cursor: grab;
  flex-shrink: 0;
}
.pending-ep {
  font-size: 10px; font-weight: 700;
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.12);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.pending-name {
  flex: 1; min-width: 0;
  font-size: 13px; font-weight: 500; color: rgba(22, 41, 63, 0.92);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pending-size {
  font-size: 11px; color: rgba(22, 41, 63, 0.41);
  flex-shrink: 0; margin-right: 4px;
}

.upload-session-info {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  background: rgba(76, 157, 228, 0.06);
  border: 1px solid rgba(76, 157, 228, 0.12);
  border-radius: 6px;
  margin-bottom: 12px;
}
.upload-session-label {
  font-size: 11px; color: rgba(22, 41, 63, 0.47);
  flex-shrink: 0;
}
.upload-session-path {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px; color: rgba(76, 157, 228, 0.7);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.upload-list { display: flex; flex-direction: column; gap: 6px; }
.upload-item {
  padding: 10px 12px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.11);
  border-radius: 8px;
}
.upload-item-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.upload-item-left {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
}
.upload-item-ep {
  font-size: 10px; font-weight: 700;
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.12);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.upload-item-name {
  font-size: 13px; font-weight: 500; color: rgba(22, 41, 63, 0.92);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  flex: 1; min-width: 0;
}
.upload-item-size {
  font-size: 11px; color: rgba(22, 41, 63, 0.34);
  flex-shrink: 0;
}
.upload-item-actions {
  display: flex; align-items: center; gap: 4px;
  flex-shrink: 0; margin-left: 10px;
}
.upload-item-stage {
  font-size: 11px; font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  color: rgba(22, 41, 63, 0.41);
}
.upload-item-stage--active { color: #4c9de4; }
.upload-item-stage--complete { color: #22a06b; }
.upload-item-stage--error { color: #E0576E; }
.upload-item-stage--paused { color: #db8a24; }

.upload-item-progress-row {
  display: flex; align-items: center; gap: 8px;
}
.upload-progress-bar {
  flex: 1; height: 4px;
  background: rgba(76, 157, 228, 0.07);
  border-radius: 2px;
  overflow: hidden;
}
.upload-progress-fill {
  height: 100%;
  background: #4c9de4;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.2s;
  min-width: 0;
}
.upload-progress-fill--complete { background: #22a06b; }
.upload-progress-fill--error { background: #E0576E; }
.upload-progress-fill--paused { background: #db8a24; }

.upload-item-vid {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 10px; color: rgba(76, 157, 228, 0.5);
  flex-shrink: 0;
}
.upload-item-error-msg {
  font-size: 10px; color: rgba(224, 87, 110,0.7);
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.cover-upload-area {
  position: relative;
}
.cover-preview {
  position: relative;
  width: 120px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--mc-border);
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(19, 41, 66, 0.45);
  display: flex;
  justify-content: center;
  padding: 4px;
}
.cover-placeholder {
  width: 120px;
  height: 160px;
  border: 2px dashed var(--mc-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cover-placeholder:hover {
  border-color: var(--mc-primary);
}
.cover-placeholder-text {
  font-size: 12px;
  color: var(--mc-text-secondary);
}
.cover-placeholder-hint {
  font-size: 10px;
  color: var(--mc-text-tertiary);
}
.cover-loading {
  position: absolute;
  inset: 0;
  width: 120px;
  height: 160px;
  background: rgba(19, 41, 66, 0.375);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 12px;
}
</style>
