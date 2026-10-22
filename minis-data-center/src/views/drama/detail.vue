<template>
  <div class="drama-detail">
    <div class="detail-header">
      <a-button type="text" class="back-btn" @click="$router.back()">
        <template #icon><icon-arrow-left /></template>
        返回列表
      </a-button>
      <div v-if="drama" class="detail-title">{{ drama.name }}</div>
      <div v-if="drama" class="header-actions">
        <a-button type="primary" size="small" @click="openEditDrama">
          <template #icon><icon-edit /></template>
          编辑信息
        </a-button>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%" dot>
      <div v-if="drama" class="detail-body">
        <div class="info-card">
          <div class="info-card-header">基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">封面图</div>
              <div class="info-value">
                <div class="cover-inline-wrap">
                  <div class="cover-inline-img">
                    <a-image
                      v-if="drama.coverUrl"
                      :src="drama.coverUrl"
                      width="80"
                      height="107"
                      fit="cover"
                      style="border-radius: 6px"
                    />
                    <span v-else class="empty-text">暂无封面</span>
                    <div v-if="directCoverUploading" class="cover-inline-loading">
                      <a-spin :size="16" />
                    </div>
                  </div>
                  <a-button type="text" size="mini" @click="directCoverInput?.click()">
                    <template #icon><icon-edit /></template>
                    修改封面
                  </a-button>
                  <input ref="directCoverInput" type="file" accept="image/*" style="display: none" @change="handleDirectCoverUpload" />
                </div>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">短剧名称</div>
              <div class="info-value">{{ drama.name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">集数</div>
              <div class="info-value">
                <span class="badge-count">{{ drama.totalEpisodes ?? 0 }}</span> 集
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">免费集数</div>
              <div class="info-value">
                <span class="badge-count">{{ drama.freeEpisodes ?? 0 }}</span> 集
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">解锁模式</div>
              <div class="info-value">
                <a-tag :color="unlockModeColor(drama.unlockMode)">{{ unlockModeLabel(drama.unlockMode) }}</a-tag>
                <div class="rule-summary" v-html="unlockModeDesc(drama.unlockMode, currentAdPushRule)"></div>
                <div v-if="unlockFormulaDesc" class="rule-formula">{{ unlockFormulaDesc }}</div>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">单集价格</div>
              <div class="info-value">{{ drama.episodePrice ? (drama.episodePrice / 100).toFixed(2) + ' 元' : '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">整剧价格</div>
              <div class="info-value">{{ drama.bundlePrice ? (drama.bundlePrice / 100).toFixed(2) + ' 元' : '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建时间</div>
              <div class="info-value">{{ drama.createTime }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">排序权重</div>
              <div class="info-value">{{ drama.sortWeight ?? '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">是否推荐</div>
              <div class="info-value">
                <a-tag :color="drama.isRecommended === 1 ? 'green' : undefined">
                  {{ drama.isRecommended === 1 ? '推荐' : '未推荐' }}
                </a-tag>
              </div>
            </div>
            <div class="info-item info-item--full">
              <div class="info-label">标签</div>
              <div class="info-value">
                <div class="tag-list">
                  <template v-if="dramaTagNames.length">
                    <a-tag v-for="name in dramaTagNames" :key="name">{{ name }}</a-tag>
                  </template>
                  <span v-else class="empty-text">暂无标签</span>
                  <a-button type="text" size="mini" @click="openTagEditor">
                    <template #icon><icon-edit /></template>
                  </a-button>
                </div>
              </div>
            </div>
            <div class="info-item info-item--full">
              <div class="info-label">描述</div>
              <div class="info-value info-desc">{{ drama.description || '暂无描述' }}</div>
            </div>
          </div>
        </div>

        <div class="episodes-card">
          <div class="info-card-header" style="display: flex; align-items: center; justify-content: space-between">
            <span>集数列表 ({{ episodes.length }})</span>
            <a-button type="primary" size="small" @click="goUploadMore">
              <template #icon><icon-plus /></template>
              追加剧集
            </a-button>
          </div>
          <div v-if="episodes.length" class="episodes-body">
            <div class="episode-tabs">
              <button
                v-for="ep in episodes"
                :key="ep.id"
                class="episode-tab"
                :class="{
                  active: activeEpisode === ep.episodeNumber,
                  free: ep.isFree === 1,
                }"
                @click="switchEpisode(ep.episodeNumber)"
              >
                {{ ep.episodeNumber }}
                <span v-if="ep.isFree === 1" class="ep-free-badge">免</span>
              </button>
            </div>
            <div
              v-for="ep in episodes"
              :key="ep.id"
              v-show="activeEpisode === ep.episodeNumber"
              class="player-wrap"
            >
              <!-- 视频预览 -->
              <div v-if="ep.vid" class="video-preview-area">
                <div :id="'player-' + ep.vid" class="video-player-container" ></div>
              </div>
              <div v-else class="video-locked">
                <icon-lock style="font-size: 24px; color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent)" />
                <span>该集未上传视频</span>
              </div>
              <div class="video-meta">
                <div class="meta-left">
                  <icon-clock-circle style="font-size: 12px" />
                  <span>时长：{{ formatDuration(ep.duration) }}</span>
                </div>
                <div class="meta-right">
                  <a-tag v-if="ep.isFree === 1" color="green" size="small">免费</a-tag>
                  <a-tag v-else color="orangered" size="small">付费</a-tag>
                  <a-button type="text" size="mini" @click="openEditEpisode(ep)">
                    <template #icon><icon-edit /></template>
                  </a-button>
                </div>
              </div>
            </div>
          </div>
          <EmptyState v-else description="暂无集数" style="padding: 40px 0" />
        </div>
      </div>

      <EmptyState v-else-if="!loading" description="短剧不存在" style="padding: 80px 0" />
    </a-spin>

    <a-modal
      v-model:visible="editDramaVisible"
      title="编辑短剧信息"
      :ok-loading="editDramaSubmitting"
      width="600px"
      @ok="handleSaveDrama"
      @cancel="editDramaVisible = false"
    >
      <a-form ref="editDramaFormRef" :model="editDramaForm" layout="vertical">
        <a-form-item field="coverUrl" label="封面图片">
          <div class="cover-upload-area">
            <div v-if="coverPreviewUrl || editDramaForm.coverUrl" class="cover-preview">
              <img :src="coverPreviewUrl || (editDramaForm.coverUrl.startsWith('http') ? editDramaForm.coverUrl : '')" alt="封面" class="cover-img" />
              <div class="cover-actions">
                <a-button type="text" size="small" status="danger" @click="removeEditCover">
                  <template #icon><icon-delete /></template>
                </a-button>
              </div>
            </div>
            <div v-else class="cover-placeholder" @click="coverInput?.click()">
              <icon-plus style="font-size: 24px; color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent)" />
              <span class="cover-placeholder-hint">点击上传封面</span>
            </div>
            <div v-if="coverUploading" class="cover-loading">
              <a-spin :size="20" />
              <span>上传中...</span>
            </div>
            <input ref="coverInput" type="file" accept="image/*" style="display: none" @change="handleEditCoverUpload" />
          </div>
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="name" label="短剧名称" :rules="[{ required: true, message: '请输入名称' }]">
              <a-input v-model="editDramaForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="freeEpisodes" label="免费集数">
              <a-input-number v-model="editDramaForm.freeEpisodes" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item field="unlockMode" label="解锁模式">
              <a-select v-model="editDramaForm.unlockMode">
                <a-option value="IAA_ONLY">仅广告</a-option>
                <a-option value="IAP_ONLY">仅付费</a-option>
                <a-option value="IAA_IAP">广告或付费</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col v-if="editDramaForm.unlockMode === 'IAA_ONLY' || editDramaForm.unlockMode === 'IAA_IAP'" :span="8">
            <a-form-item field="adPushRuleId" label="广告解锁规则">
              <a-select v-model="editDramaForm.adPushRuleId" allow-clear placeholder="选择规则">
                <a-option v-for="rule in adPushRules" :key="rule.id" :value="rule.id">
                  {{ rule.ruleName }}（{{ unlockRuleDesc(rule) }}）
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col v-if="editDramaForm.unlockMode === 'IAP_ONLY' || editDramaForm.unlockMode === 'IAA_IAP'" :span="8">
            <a-form-item field="episodePrice" label="单集价格(分)">
              <a-input-number v-model="editDramaForm.episodePrice" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-if="editDramaForm.unlockMode === 'IAP_ONLY' || editDramaForm.unlockMode === 'IAA_IAP'" :gutter="16">
          <a-col :span="8">
            <a-form-item field="bundlePrice" label="整剧价格(分)">
              <a-input-number v-model="editDramaForm.bundlePrice" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item field="sortWeight" label="排序权重">
              <a-input-number v-model="editDramaForm.sortWeight" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row v-else :gutter="16">
          <a-col :span="8">
            <a-form-item field="sortWeight" label="排序权重">
              <a-input-number v-model="editDramaForm.sortWeight" :min="0" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="isRecommended" label="是否推荐">
          <a-radio-group v-model="editDramaForm.isRecommended" direction="horizontal">
            <a-radio :value="1">推荐</a-radio>
            <a-radio :value="0">不推荐</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea v-model="editDramaForm.description" :auto-size="{ minRows: 2, maxRows: 5 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="editEpisodeVisible"
      :title="`编辑第 ${editEpisodeForm.episodeNumber} 集`"
      :ok-loading="editEpisodeSubmitting"
      width="440px"
      @ok="handleSaveEpisode"
      @cancel="editEpisodeVisible = false"
    >
      <a-form ref="editEpisodeFormRef" :model="editEpisodeForm" layout="vertical">
        <a-form-item field="name" label="集名称">
          <a-input v-model="editEpisodeForm.name" />
        </a-form-item>
        <a-form-item field="isFree" label="是否免费">
          <a-radio-group v-model="editEpisodeForm.isFree" direction="horizontal">
            <a-radio :value="1">免费</a-radio>
            <a-radio :value="0">付费</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea v-model="editEpisodeForm.description" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 标签编辑弹窗 -->
    <a-modal
      v-model:visible="tagEditorVisible"
      title="编辑标签"
      width="400px"
      @ok="saveTagEditor"
      @cancel="tagEditorVisible = false"
    >
      <a-select
        v-model="selectedTagIds"
        :options="allTagOptions"
        placeholder="选择标签"
        multiple
        allow-clear
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onActivated, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { fetchDramaDetail, fetchEpisodeList, updateDrama, updateEpisode, getDramaTags, updateDramaTags, fetchTagList } from '@/api/drama.ts'
import { fetchAdPushRuleList } from '@/api/ad.ts'
import { getSignedUrl, fetchUploadSession } from '@/api/vod.ts'
import BytePlusUploader from '@byteplus/uploader'
import { loadVePlayer } from '@/utils/cdn-loader.ts'
import type { Drama, Episode, AdPushRule } from '@/types/drama.ts'
import { unlockModeLabel, unlockModeColor, unlockModeDesc, unlockRuleDesc } from '@/types/drama.ts'
import { useAccountStore } from '@/stores/account.ts'
import EmptyState from '@/components/EmptyState/index.vue'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const loading = ref(false)
const drama = ref<Drama | null>(null)
const activeEpisode = ref<number>(0)
const episodes = ref<Episode[]>([])
const adPushRules = ref<AdPushRule[]>([])
const editDramaVisible = ref(false)
const editDramaSubmitting = ref(false)
const editDramaFormRef = ref()
const editDramaForm = ref({
  name: '',
  description: '',
  coverUrl: '',
  freeEpisodes: 0,
  unlockMode: 'IAA_IAP',
  adPushRuleId: undefined as number | string | undefined,
  episodePrice: 0,
  bundlePrice: 0,
  sortWeight: 100,
  isRecommended: 0,
})

// ─── 封面上传 ────────────────────────────────────────────────────
const coverUploading = ref(false)
const coverPreviewUrl = ref('')
const coverInput = ref<HTMLInputElement>()

// ─── 详情页直接修改封面 ──────────────────────────────────────────
const directCoverUploading = ref(false)
const directCoverInput = ref<HTMLInputElement>()

const editEpisodeVisible = ref(false)
const editEpisodeSubmitting = ref(false)
const editEpisodeFormRef = ref()
const editEpisodeForm = ref<{
  id: number | string
  episodeNumber: number
  name: string
  isFree: number
  description: string
}>({
  id: 0,
  episodeNumber: 1,
  name: '',
  isFree: 0,
  description: '',
})

// ─── 标签编辑 ────────────────────────────────────────────────────
const allTagOptions = ref<{ label: string; value: string }[]>([])
const dramaTagIds = ref<string[]>([])
const dramaTagNames = computed(() => {
  return dramaTagIds.value
    .map(id => allTagOptions.value.find(t => t.value === id)?.label)
    .filter(Boolean) as string[]
})
const tagEditorVisible = ref(false)
const selectedTagIds = ref<string[]>([])

async function loadDramaTags() {
  if (!drama.value) return
  try {
    const ids = await getDramaTags(drama.value.id)
    dramaTagIds.value = (ids || []).map(String)
  } catch { dramaTagIds.value = [] }
}

async function loadAllTags() {
  try {
    const res = await fetchTagList()
    const tags = res && typeof res === 'object' && 'rows' in res ? (res as any).rows : Array.isArray(res) ? res : []
    allTagOptions.value = tags.filter((t: any) => t.status === 1).map((t: any) => ({ label: t.name, value: String(t.id) }))
  } catch { allTagOptions.value = [] }
}

function openTagEditor() {
  selectedTagIds.value = [...dramaTagIds.value]
  tagEditorVisible.value = true
}

async function saveTagEditor() {
  if (!drama.value) return
  try {
    await updateDramaTags(drama.value.id, selectedTagIds.value)
    dramaTagIds.value = [...selectedTagIds.value]
    tagEditorVisible.value = false
    Message.success('标签更新成功')
  } catch { /* axios 拦截器已处理 */ }
}

function parseTags(tags: string | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map((t: string) => t.trim()).filter(Boolean)
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const currentAdPushRule = computed<AdPushRule | null>(() => {
  if (!drama.value?.adPushRuleId) return null
  return adPushRules.value.find(r => r.id == drama.value!.adPushRuleId) ?? null
})

const unlockFormulaDesc = computed<string>(() => {
  if (!drama.value || !currentAdPushRule.value) return ''
  const d = drama.value
  const r = currentAdPushRule.value
  const free = d.freeEpisodes ?? 0
  return `已解锁集数 = ${free}(免费) + (累计广告数 / ${r.adCountPerUnlock}) × ${r.episodesPerUnlock}`
})

async function loadAdPushRules() {
  try {
    const data = await fetchAdPushRuleList()
    adPushRules.value = Array.isArray(data) ? data : []
  } catch {
    adPushRules.value = []
  }
}

async function loadData() {
  loading.value = true
  try {
    disposePlayers()
    drama.value = await fetchDramaDetail(route.params.id as string)
    if (drama.value) {
      const episodeData = await fetchEpisodeList(drama.value.id)
      episodes.value = Array.isArray(episodeData) ? episodeData : (episodeData as any).rows ?? []
      if (episodes.value.length) {
        const hasActiveEpisode = episodes.value.some(ep => ep.episodeNumber === activeEpisode.value)
        activeEpisode.value = hasActiveEpisode ? activeEpisode.value : episodes.value[0].episodeNumber
        // 加载完成后初始化当前集的播放器
        initActivePlayer()
      }
    } else {
      episodes.value = []
      activeEpisode.value = 0
    }
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await loadData()
  await loadDramaTags()
}

function openEditDrama() {
  if (!drama.value) return
  editDramaForm.value = {
    name: drama.value.name ?? '',
    description: drama.value.description ?? '',
    coverUrl: drama.value.coverUrl ?? '',
    freeEpisodes: drama.value.freeEpisodes ?? 0,
    unlockMode: drama.value.unlockMode ?? 'IAA_IAP',
    adPushRuleId: drama.value.adPushRuleId ?? undefined,
    episodePrice: drama.value.episodePrice ?? 0,
    bundlePrice: drama.value.bundlePrice ?? 0,
    sortWeight: drama.value.sortWeight ?? 100,
    isRecommended: drama.value.isRecommended ?? 0,
  }
  coverPreviewUrl.value = ''
  editDramaVisible.value = true
}

async function handleSaveDrama() {
  const errors = await editDramaFormRef.value?.validate()
  if (errors) return
  if (!drama.value) return
  editDramaSubmitting.value = true
  try {
    // 如果 coverUrl 是 http 开头（未重新上传，是解析后的临时 URL），不传给后端
    const payload = { ...editDramaForm.value }
    if (payload.coverUrl && payload.coverUrl.startsWith('http')) {
      delete (payload as any).coverUrl
    }
    await updateDrama(drama.value.id, payload)
    Message.success('更新成功')
    editDramaVisible.value = false
    loadData()
  } finally {
    editDramaSubmitting.value = false
  }
}

function removeEditCover() {
  editDramaForm.value.coverUrl = ''
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
  coverPreviewUrl.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

async function handleEditCoverUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  coverPreviewUrl.value = URL.createObjectURL(file)
  coverUploading.value = true

  try {
    const tokenData = await fetchUploadSession()
    const region = tokenData.region?.trim() || 'ap-southeast-1'

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

    const fileKey = uploader.addFile({ file, stsToken, type: 'media' })

    uploader.on('complete', (info: any) => {
      const vid = (info.uploadResult as Record<string, any> | undefined)?.Vid as string | undefined
      if (vid) {
        editDramaForm.value.coverUrl = vid
      }
      coverUploading.value = false
      Message.success('封面上传成功')
    })

    uploader.on('error', (info: any) => {
      coverUploading.value = false
      if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
      coverPreviewUrl.value = ''
      Message.error(typeof info.extra?.message === 'string' ? info.extra.message : '封面上传失败')
    })

    uploader.start(fileKey)
  } catch (err) {
    coverUploading.value = false
    if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value)
    coverPreviewUrl.value = ''
    Message.error('封面上传失败')
  }
}

async function handleDirectCoverUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !drama.value) return

  directCoverUploading.value = true
  try {
    const tokenData = await fetchUploadSession()
    const region = tokenData.region?.trim() || 'ap-southeast-1'

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

    const fileKey = uploader.addFile({ file, stsToken, type: 'media' })

    uploader.on('complete', async (info: any) => {
      const vid = (info.uploadResult as Record<string, any> | undefined)?.Vid as string | undefined
      if (vid && drama.value) {
        await updateDrama(drama.value.id, { coverUrl: vid })
        Message.success('封面更新成功')
        loadData()
      }
      directCoverUploading.value = false
    })

    uploader.on('error', (info: any) => {
      directCoverUploading.value = false
      Message.error(typeof info.extra?.message === 'string' ? info.extra.message : '封面上传失败')
    })

    uploader.start(fileKey)
  } catch (err) {
    directCoverUploading.value = false
    Message.error('封面上传失败')
  } finally {
    input.value = ''
  }
}

function openEditEpisode(ep: Episode) {
  editEpisodeForm.value = {
    id: ep.id,
    episodeNumber: ep.episodeNumber,
    name: ep.name ?? `第${ep.episodeNumber}集`,
    isFree: ep.isFree ?? 0,
    description: ep.description ?? '',
  }
  editEpisodeVisible.value = true
}

async function handleSaveEpisode() {
  editEpisodeSubmitting.value = true
  try {
    await updateEpisode(editEpisodeForm.value.id, {
      name: editEpisodeForm.value.name,
      isFree: editEpisodeForm.value.isFree,
      description: editEpisodeForm.value.description,
    })
    Message.success('更新成功')
    editEpisodeVisible.value = false
    loadData()
  } finally {
    editEpisodeSubmitting.value = false
  }
}

// ─── 视频预览（通过 PlayAuthToken） ─────────────────────────

let vePlayerLicenseConfigured = false
const playerInstances = new Map<string, any>()

function disposePlayers() {
  playerInstances.forEach((instance) => {
    try { instance.dispose?.() ?? instance.destroy?.() } catch {}
  })
  playerInstances.clear()
}

async function initPlayer(vid: string) {
  if (!vid || playerInstances.has(vid)) return

  const containerId = 'player-' + vid
  const container = document.getElementById(containerId)
  if (!container) return

  try {
    const res = await getSignedUrl({ vid, expireSeconds: 3600 })

    const VePlayer = await loadVePlayer()

    if (!vePlayerLicenseConfigured) {
      VePlayer.setLicenseConfig({
        license: {
          sign: 'QiXcmyi7BZlyy7kkv+aQfC7jh5srxQXtR0Ko0OrNoM081yYFRmtdWAPJeTzd25moCVKgAffOlhPVFUi6q3IN6AIRfVNbY1FwsakAEqgyFFtJBZj3+3ZOPZLMyOos7MrYBQ819ELBg6TLBcAGIjAF7eEihESBKfxOv3rdiU/FCMmlLW2OHfb/9nlk2AWeui/SnRzdHBbpUHhzIuPL503CJtRt0JpvZzJpMUpPOajX/l+zydF9NLxuGm6JZVWxgf0ge4WJjO9xNXHNT5+1yBaa9ldwWi16HGCjXThr2+dWCxI3dbVsJFqobI+NcWUMxkO/6rEZH22L3MjMqYafhiTqHQ==',
          content: 'eyJJZCI6IjE4NTM1ODg2NSIsICJWZXJzaW9uIjoyLCAiQ2hhbm5lbCI6InZvZCIsICJUeXBlIjoyLCAiTW9kdWxlcyI6W3siTmFtZSI6IndlYl92b2RfcGxheSIsICJFZGl0aW9uIjoic3RhbmRhcmRfZWRpdGlvbiIsICJTdGFydFRpbWUiOjE3NzkyODEzNjgwMDAsICJFeHBpcmVUaW1lIjoxODQyNDUxMTk5MDAwfV0sICJGaWxlVmVyc2lvbiI6IjE3NzkyODE1NTg3NTY2MTE2NjAiLCAiV2lsZGNhcmREb21haW4iOiIqLnRpa3Rvay1taW5pcy51cyJ9',
          mainUrl: 'https://sf16-vod-license-multi.byteplusvod.com/obj/vod-license-sgcom/l-185358865-ch-vod-a-1020503.lic',
        },
      })
      vePlayerLicenseConfigured = true
    }

    const instance = new VePlayer({
      id: containerId,
      width: 400,
      height: 680,
      videoFillMode: 'auto' as any,
      autoplay: false,
      getVideoByToken: {
        playAuthToken: res.playAuthToken,
        playDomain: 'https://vod.byteplusapi.com',
      },
      vodLogOpts: {
        line_app_id: 1017452,
        line_user_id: 'admin-preview',
      },
    })
    playerInstances.set(vid, instance)
  } catch (err: any) {
    console.error('[Player] 初始化失败', vid, err)
  }
}

async function initActivePlayer() {
  await nextTick()
  const ep = episodes.value.find(e => e.episodeNumber === activeEpisode.value)
  if (ep?.vid) {
    initPlayer(ep.vid)
  }
}

function switchEpisode(episodeNumber: number) {
  activeEpisode.value = episodeNumber
  initActivePlayer()
}

// ─── 追加剧集 ─────────────────────────────────────────────

function goUploadMore() {
  if (!drama.value) return
  // 跳转到上传页面，带上 dramaId 参数（后续可扩展为追加模式）
  router.push({ path: '/drama/upload', query: { dramaId: drama.value.id } })
}

let hasMounted = false

onMounted(async () => {
  await refreshData()
  hasMounted = true
  loadAdPushRules()
  loadAllTags()
})

onActivated(() => {
  if (hasMounted) {
    refreshData()
  }
})

watch(
  () => route.params.id,
  () => {
    refreshData()
  },
)

onUnmounted(() => {
  // 清理所有 VePlayer 实例，防止内存泄漏
  disposePlayers()
  // 释放 ObjectURL
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value)
  }
})
</script>

<style scoped>
.drama-detail {
  max-width: 960px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.back-btn {
  color: var(--mc-text-tertiary) !important;
  font-size: 13px !important;
  padding: 0 !important;
}
.back-btn:hover {
  color: var(--mc-primary) !important;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
  flex: 1;
}
.header-actions {
  flex-shrink: 0;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card,
.episodes-card {
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 12px;
  overflow: hidden;
}

.info-card-header {
  padding: 14px 20px;
  font-size: 13px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  background: rgba(76, 157, 228, 0.04);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.info-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--mc-border);
  border-right: 1px solid var(--mc-border);
}
.info-item:nth-child(3n) {
  border-right: none;
}
.info-item--full {
  grid-column: 1 / -1;
  border-right: none;
}
.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--mc-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}
.info-value {
  font-size: 13px;
  color: var(--mc-text-primary);
  font-weight: 500;
}
.info-desc {
  font-weight: 400;
  color: var(--mc-text-secondary);
  line-height: 1.6;
}

.badge-count {
  font-size: 16px;
  font-weight: 700;
  color: var(--mc-primary);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.empty-text {
  color: var(--mc-text-disabled);
  font-size: 13px;
}

.rule-summary {
  font-size: 13px;
  color: var(--mc-text-secondary);
}
.rule-summary strong {
  color: #4c9de4;
  font-weight: 600;
}
.rule-formula {
  font-size: 11px;
  color: rgba(76, 157, 228, 0.6);
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-top: 4px;
}

.episodes-body {
  padding: 16px 20px;
}

.episode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.episode-tab {
  position: relative;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: color-mix(in srgb, var(--mc-text-primary) 66%, transparent);
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.episode-tab:hover {
  border-color: rgba(124, 195, 240, 0.44);
  color: #4c9de4;
}
.episode-tab.active {
  background: #4c9de4;
  border-color: #4c9de4;
  color: #f1f6fd;
}
.episode-tab.free {
  border-color: rgba(54,211,153,0.3);
}
.ep-free-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 9px;
  font-weight: 700;
  background: #2FBF87;
  color: #fff;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-wrap {
  border-radius: var(--mc-radius-md);
  overflow: hidden;
  background: var(--mc-bg-sunken);
}

.video-player {
  width: 100%;
  max-height: 460px;
  display: block;
}

.video-preview-area {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mc-bg-sunken);
}

.video-player-container {
  width: 400px;
  height: 680px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}

.video-play-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  min-height: 260px;
  cursor: pointer;
  transition: background 0.2s;
}
.video-play-trigger:hover {
  background: rgba(76, 157, 228, 0.05);
}
.video-play-trigger:hover .play-icon-wrap {
  transform: scale(1.1);
  background: rgba(76, 157, 228, 0.3);
}

.play-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(76, 157, 228, 0.11);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.play-hint {
  font-size: 13px;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
}
.play-vid {
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 41%, transparent);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.video-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 200px;
  color: color-mix(in srgb, var(--mc-text-primary) 41%, transparent);
  font-size: 14px;
}

.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--mc-bg-card);
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
}
.meta-left {
  display: flex;
  align-items: center;
  gap: 5px;
}
.meta-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cover-inline-wrap {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
}
.cover-inline-img {
  position: relative;
}
.cover-inline-loading {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
}

.cover-upload-area { position: relative; width: 120px; height: 160px; }
.cover-preview { position: relative; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; }
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-actions { position: absolute; top: 4px; right: 4px; }
.cover-placeholder {
  width: 100%; height: 100%; border: 1px dashed color-mix(in srgb, var(--mc-text-primary) 24%, transparent);
  border-radius: 8px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 6px; cursor: pointer;
}
.cover-placeholder:hover { border-color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent); }
.cover-placeholder-hint { font-size: 11px; color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent); }
.cover-loading {
  position: absolute; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px; border-radius: 8px;
  font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}
</style>
