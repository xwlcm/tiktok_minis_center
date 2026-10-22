<template>
  <a-modal
    v-model:visible="visibleProxy"
    :title="title"
    width="820px"
    :footer="false"
    unmount-on-close
    @open="refresh"
  >
    <div class="picker-header">
      <div class="scene-summary">
        <span class="scene-chip">{{ sceneName }}</span>
        <span class="summary-item">已添加 <strong>{{ currentCount }}</strong> 个</span>
        <span v-if="recommendedCount" class="summary-item">推荐 {{ recommendedCount }} 个</span>
      </div>
      <a-checkbox v-model="includeAdded">显示已添加</a-checkbox>
    </div>

    <div class="picker-search">
      <a-input-search
        v-model="keyword"
        placeholder="搜索短剧名称"
        allow-clear
        search-button
        @search="refresh"
      />
    </div>

    <a-spin :loading="loading" class="picker-spin">
      <div v-if="candidates.length" class="candidate-list" role="list">
        <div
          v-for="item in candidates"
          :key="item.dramaId"
          role="button"
          :tabindex="item.selectable ? 0 : -1"
          :aria-disabled="!item.selectable"
          class="candidate-item"
          :class="{ disabled: !item.selectable }"
          @click="selectCandidate(item)"
          @keydown.enter.prevent="selectCandidate(item)"
          @keydown.space.prevent="selectCandidate(item)"
        >
          <a-image
            v-if="item.coverUrl"
            :src="item.coverUrl"
            width="72"
            height="48"
            fit="cover"
            class="candidate-cover"
          />
          <div v-else class="candidate-cover placeholder">
            <icon-video-camera />
          </div>
          <div class="candidate-main">
            <div class="candidate-title-row">
              <span class="candidate-title">{{ item.dramaName }}</span>
              <span class="status-pill" :class="item.addedInCurrent ? 'status-added' : 'status-ready'">
                {{ item.addedInCurrent ? '已添加' : '可添加' }}
              </span>
            </div>
            <div class="candidate-meta">
              <span v-if="item.totalEpisodes">共 {{ item.totalEpisodes }} 集</span>
              <span v-if="item.sortWeight !== undefined">权重 {{ item.sortWeight }}</span>
            </div>
            <div v-if="item.addedScenes.length" class="scene-tags">
              <span v-for="scene in item.addedScenes" :key="scene" class="usage-chip">{{ scene }}</span>
            </div>
          </div>
          <div class="candidate-action">
            <a-button class="select-button" type="outline" size="small" :disabled="!item.selectable">
              {{ item.selectable ? '选择' : item.disabledReason || '不可选' }}
            </a-button>
          </div>
        </div>
      </div>
      <div v-else class="empty-panel">
        <a-empty description="暂无可添加短剧" />
      </div>
    </a-spin>

    <div class="picker-footer">
      <a-pagination
        :current="pageNum"
        :page-size="pageSize"
        :total="total"
        size="small"
        show-total
        @change="handlePageChange"
      />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchHomeSlotCandidates } from '@/api/drama.ts'
import type { HomeSlotCandidate } from '@/types/drama.ts'

const props = defineProps<{
  visible: boolean
  title: string
  sceneName: string
  slotType: 'BANNER' | 'HOT' | 'RANK'
  tagId?: number | null
  currentCount: number
  recommendedCount?: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [value: HomeSlotCandidate]
}>()

const visibleProxy = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
})

const loading = ref(false)
const includeAdded = ref(false)
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(8)
const total = ref(0)
const candidates = ref<HomeSlotCandidate[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadCandidates() {
  if (!props.visible) return
  loading.value = true
  try {
    const res = await fetchHomeSlotCandidates({
      slotType: props.slotType,
      tagId: props.tagId,
      name: keyword.value.trim() || undefined,
      includeAdded: includeAdded.value,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    candidates.value = res.rows ?? []
    total.value = res.total ?? 0
  } finally {
    loading.value = false
  }
}

function refresh() {
  pageNum.value = 1
  loadCandidates()
}

function handlePageChange(page: number) {
  pageNum.value = page
  loadCandidates()
}

function selectCandidate(item: HomeSlotCandidate) {
  if (!item.selectable) return
  emit('select', item)
  visibleProxy.value = false
}

watch(
  () => [props.visible, props.slotType, props.tagId],
  () => {
    if (props.visible) refresh()
  },
)

watch(includeAdded, refresh)

watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(refresh, 300)
})
</script>

<style scoped>
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.13);
  border-radius: 8px;
}

.scene-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

.scene-chip {
  height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border-radius: 6px;
  color: #78d9df;
  background: rgba(76, 157, 228, 0.12);
  border: 1px solid rgba(76, 157, 228, 0.28);
  font-weight: 600;
}

.summary-item {
  color: rgba(22, 41, 63, 0.7);
}

.summary-item strong {
  color: rgba(22, 41, 63, 0.92);
  font-weight: 700;
}

.picker-search {
  margin-bottom: 14px;
}

.picker-search :deep(.arco-input-wrapper) {
  height: 36px;
  background: rgba(255, 255, 255, 0.58);
  border-color: rgba(31, 80, 132, 0.18);
  border-radius: 8px 0 0 8px;
}

.picker-search :deep(.arco-input-wrapper:hover),
.picker-search :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: rgba(76, 157, 228, 0.45);
}

.picker-search :deep(.arco-btn-primary) {
  width: 42px;
  height: 36px;
  background: rgba(76, 157, 228, 0.88);
  border-color: rgba(76, 157, 228, 0.88);
  box-shadow: none;
}

.picker-spin {
  display: block;
  min-height: 348px;
}

.candidate-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.candidate-item {
  width: 100%;
  min-height: 86px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 72px;
  gap: 12px;
  align-items: center;
  padding: 11px 12px;
  text-align: left;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.14);
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}

.candidate-item:hover {
  background: rgba(76, 157, 228, 0.055);
  border-color: rgba(76, 157, 228, 0.34);
}

.candidate-item:focus-visible {
  border-color: rgba(76, 157, 228, 0.72);
  box-shadow: 0 0 0 2px rgba(76, 157, 228, 0.12);
}

.candidate-item.disabled {
  cursor: not-allowed;
  background: rgba(76, 157, 228, 0.04);
  border-color: rgba(31, 80, 132, 0.1);
  opacity: 0.82;
}

.candidate-item.disabled:hover {
  background: rgba(76, 157, 228, 0.04);
  border-color: rgba(31, 80, 132, 0.1);
}

.candidate-cover {
  width: 72px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(31, 80, 132, 0.14);
}

.candidate-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 157, 228, 0.06);
  color: rgba(22, 41, 63, 0.3);
}

.candidate-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.candidate-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.candidate-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(22, 41, 63, 0.92);
  font-size: 13px;
  font-weight: 650;
  line-height: 18px;
}

.status-pill {
  flex: 0 0 auto;
  min-width: 48px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.status-ready {
  color: #65d6bd;
  background: rgba(56, 180, 151, 0.13);
  border: 1px solid rgba(56, 180, 151, 0.38);
}

.status-added {
  color: #d9829a;
  background: rgba(76, 157, 228, 0.1);
  border: 1px solid rgba(76, 157, 228, 0.26);
}

.candidate-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: rgba(22, 41, 63, 0.57);
  font-size: 12px;
  line-height: 18px;
}

.scene-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.usage-chip {
  height: 21px;
  display: inline-flex;
  align-items: center;
  padding: 0 7px;
  border-radius: 5px;
  color: rgba(22, 41, 63, 0.84);
  background: rgba(76, 157, 228, 0.05);
  border: 1px solid rgba(31, 80, 132, 0.18);
  font-size: 12px;
}

.candidate-action {
  display: flex;
  justify-content: flex-end;
}

.select-button {
  min-width: 62px;
  border-color: rgba(76, 157, 228, 0.45);
  color: #a8ccf0;
  background: rgba(76, 157, 228, 0.08);
}

.select-button:not(.arco-btn-disabled):hover {
  border-color: rgba(76, 157, 228, 0.78);
  color: #ffffff;
  background: rgba(76, 157, 228, 0.22);
}

.candidate-item.disabled .select-button {
  min-width: 104px;
  color: rgba(22, 41, 63, 0.49);
  background: rgba(76, 157, 228, 0.04);
  border-color: rgba(31, 80, 132, 0.14);
}

.empty-panel {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 157, 228, 0.04);
  border: 1px dashed rgba(31, 80, 132, 0.18);
  border-radius: 8px;
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

@media (max-width: 720px) {
  .candidate-list {
    grid-template-columns: 1fr;
  }

  .candidate-item {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .candidate-cover {
    width: 64px;
    height: 46px;
  }

  .candidate-action {
    grid-column: 1 / -1;
  }
}
</style>
