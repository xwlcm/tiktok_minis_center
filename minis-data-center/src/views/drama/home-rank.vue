<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">首页分类排行榜</div>
        <div class="page-subtitle">配置各分类短剧排行榜，建议每个分类 8-10 部</div>
      </div>
      <a-button type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>
        添加排行
      </a-button>
    </div>

    <div class="cat-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        class="cat-tab"
        :class="{ active: activeCategory === cat }"
        @click="switchCategory(cat)"
      >
        {{ cat }}
        <span class="cat-count">{{ getCatCount(cat) }}</span>
      </button>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="currentList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="false"
      >
        <template #rank="{ rowIndex }">
          <div class="rank-badge" :class="rankClass(rowIndex + 1)">
            {{ rowIndex + 1 }}
          </div>
        </template>

        <template #cover="{ record }">
          <a-image
            v-if="record.coverUrl"
            :src="record.coverUrl"
            width="56"
            height="38"
            fit="cover"
            style="border-radius: 5px; display: block"
          />
          <div v-else class="cover-placeholder">
            <icon-video-camera style="font-size: 16px; color: rgba(22, 41, 63, 0.27)" />
          </div>
        </template>

        <template #info="{ record }">
          <div class="item-info">
            <div class="item-title">{{ record.dramaName }}</div>
          </div>
        </template>

        <template #sort="{ record }">
          <div class="sort-cell">
            <span class="sort-num">{{ record.sort }}</span>
            <div class="sort-btns">
              <a-button type="text" size="mini" :disabled="record.sort <= 1" @click="moveUp(record)">
                <icon-arrow-up />
              </a-button>
              <a-button type="text" size="mini" :disabled="record.sort >= currentList.length" @click="moveDown(record)">
                <icon-arrow-down />
              </a-button>
            </div>
          </div>
        </template>

        <template #enabled="{ record }">
          <a-switch
            :model-value="record.enabled === 1"
            :loading="togglingId === record.id"
            checked-text="展示"
            unchecked-text="隐藏"
            @change="(val: string | number | boolean) => handleToggle(record, !!val)"
          />
        </template>

        <template #operations="{ record }">
          <div class="row-actions">
            <a-popconfirm content="确认从排行榜移除？" @ok="handleDelete(record.id)">
              <a-button type="text" size="small" status="danger">移除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      title="添加排行短剧"
      :ok-loading="submitting"
      width="480px"
      @ok="handleSave"
      @cancel="modalVisible = false"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="dramaId" label="选择短剧">
          <div class="drama-select-card">
            <div class="selected-drama">
              {{ selectedDramaName || '未选择短剧' }}
            </div>
            <a-button @click="pickerVisible = true">选择短剧</a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <DramaPickerModal
      v-model:visible="pickerVisible"
      title="选择排行短剧"
      :scene-name="rankSceneName"
      slot-type="RANK"
      :tag-id="activeTagId"
      :current-count="currentList.length"
      :recommended-count="10"
      @select="handleCandidateSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchHomeSlots, toggleHomeSlotEnabled,
  moveHomeSlotSort, fetchTagList,
  addDramaTag, removeDramaTag,
} from '@/api/drama.ts'
import type { HomeSlot, HomeSlotCandidate, Tag } from '@/types/drama.ts'
import { useAppStore } from '@/stores/app.ts'
import ResizableTable from "@/components/ResizableTable/index.vue";
import DramaPickerModal from './components/DramaPickerModal.vue'

const appStore = useAppStore()
const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<number | null>(null)
const currentList = ref<HomeSlot[]>([])
const tagList = ref<Tag[]>([])
const categories = ref<string[]>([])
const activeCategory = ref('')
const activeTagId = ref<number | null>(null)
const modalVisible = ref(false)
const pickerVisible = ref(false)
const formRef = ref()
const selectedDramaName = ref('')
const rankSceneName = computed(() => activeCategory.value ? `分类排行榜：${activeCategory.value}` : '分类排行榜')

const columns = ref([
  { title: '排名', slotName: 'rank', width: 60, resizable: true, minWidth: 50 },
  { title: '封面', slotName: 'cover', width: 76, resizable: true, minWidth: 60 },
  { title: '短剧', slotName: 'info', width: 200, resizable: true, minWidth: 100 },
  { title: '排序', slotName: 'sort', width: 100, resizable: true, minWidth: 80 },
  { title: '展示', slotName: 'enabled', width: 100, resizable: true, minWidth: 80 },
  { title: '操作', slotName: 'operations', width: 100, resizable: true, minWidth: 80 },
])

const form = reactive({
  dramaId: '',
})

const formRules = {
  dramaId: [{ required: true, message: '请选择短剧' }],
}

function rankClass(rank: number) {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

function getCatCount(cat: string): number {
  const tag = tagList.value.find(t => t.name === cat)
  return tag?.refCount ?? 0
}

async function loadCategories() {
  try {
    const res = await fetchTagList()
    const tags: Tag[] = res && typeof res === 'object' && 'rows' in res ? (res as any).rows : Array.isArray(res) ? res : []
    tagList.value = tags.filter(t => t.status === 1)
    categories.value = tagList.value.map(t => t.name)
    if (tagList.value.length > 0 && !activeCategory.value) {
      activeCategory.value = tagList.value[0].name
      activeTagId.value = tagList.value[0].id
    }
  } catch {
    tagList.value = []
    categories.value = []
  }
}

async function loadList() {
  loading.value = true
  try {
    if (activeTagId.value) {
      // 按标签查询，后端返回该标签下所有已上线短剧（排序从1开始）
      currentList.value = await fetchHomeSlots('RANK', activeTagId.value) as HomeSlot[]
    } else {
      currentList.value = await fetchHomeSlots('RANK') as HomeSlot[]
    }
  } finally {
    loading.value = false
  }
}

function switchCategory(cat: string) {
  activeCategory.value = cat
  const tag = tagList.value.find(t => t.name === cat)
  activeTagId.value = tag?.id ?? null
  loadList()
}

function openAdd() {
  if (!activeTagId.value) {
    Message.warning('请先选择分类')
    return
  }
  selectedDramaName.value = ''
  Object.assign(form, { dramaId: '' })
  modalVisible.value = true
}

function handleCandidateSelect(item: HomeSlotCandidate) {
  form.dramaId = item.dramaId
  selectedDramaName.value = item.dramaName
}

async function handleSave() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    // 建立短剧与当前标签的关联（后端幂等：已存在则跳过）
    if (activeTagId.value) {
      await addDramaTag(form.dramaId, activeTagId.value)
    }
    Message.success('添加成功')
    modalVisible.value = false
    loadList()
    loadCategories()
  } finally {
    submitting.value = false
  }
}

async function handleToggle(item: HomeSlot, enabled: boolean) {
  togglingId.value = item.id
  try {
    await toggleHomeSlotEnabled(item.id, enabled ? 1 : 0)
    item.enabled = enabled ? 1 : 0
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(id: number) {
  // 从当前标签的排行榜移除 = 解除该短剧与当前标签的关联
  if (activeTagId.value) {
    await removeDramaTag(String(id), activeTagId.value)
  }
  Message.success('已移除')
  loadList()
  loadCategories()
}

async function moveUp(item: HomeSlot) {
  await moveHomeSlotSort(item.id, 'UP')
  loadList()
}

async function moveDown(item: HomeSlot) {
  await moveHomeSlotSort(item.id, 'DOWN')
  loadList()
}

onMounted(async () => {
  await loadCategories()
  loadList()
})

watch(() => appStore.currentClientKey, async () => {
  activeCategory.value = ''
  activeTagId.value = null
  await loadCategories()
  loadList()
})
</script>

<style scoped>
.cover-placeholder {
  width: 56px;
  height: 38px;
  border-radius: 5px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drama-select-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.14);
  border-radius: 8px;
}
.selected-drama {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(22, 41, 63, 0.92);
}

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 16px;
}
.page-title { font-size: 18px; font-weight: 700; color: rgba(22, 41, 63, 0.92); }
.page-subtitle { font-size: 12px; color: rgba(22, 41, 63, 0.47); margin-top: 2px; }

.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}
.cat-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  font-size: 13px; font-weight: 500;
  color: rgba(22, 41, 63, 0.61);
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.14);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-tab:hover {
  color: rgba(22, 41, 63, 0.92);
  border-color: rgba(31, 80, 132, 0.27);
}
.cat-tab.active {
  color: #4c9de4;
  background: rgba(76, 157, 228, 0.10);
  border-color: rgba(76, 157, 228, 0.30);
}
.cat-count {
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 3px;
  background: rgba(76, 157, 228, 0.09);
  color: rgba(22, 41, 63, 0.54);
}
.cat-tab.active .cat-count {
  background: rgba(76, 157, 228, 0.15);
  color: #4c9de4;
}

.rank-badge {
  width: 26px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
  background: rgba(76, 157, 228, 0.07);
  color: rgba(22, 41, 63, 0.54);
}
.rank-gold   { background: rgba(255,215,0,0.15);  color: #FFD700; }
.rank-silver { background: rgba(192,192,192,0.15); color: #C0C0C0; }
.rank-bronze { background: rgba(205,127,50,0.15);  color: #CD7F32; }

.item-info { display: flex; flex-direction: column; gap: 4px; }
.item-title { font-size: 13px; font-weight: 600; color: rgba(22, 41, 63, 0.92); }

.sort-cell { display: flex; align-items: center; gap: 6px; }
.sort-num {
  width: 28px; height: 28px; border-radius: 6px;
  background: rgba(76, 157, 228, 0.07); border: 1px solid rgba(76, 157, 228, 0.09);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: rgba(22, 41, 63, 0.92);
}
.sort-btns { display: flex; flex-direction: column; gap: 1px; }
.row-actions { display: flex; gap: 4px; }
</style>
