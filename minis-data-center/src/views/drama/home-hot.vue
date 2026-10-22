<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">首页热播短剧</div>
        <div class="page-subtitle">配置 TikTok Minis 首页热播短剧模块，建议 8-12 部</div>
      </div>
      <a-button type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>
        添加热播
      </a-button>
    </div>

    <div class="preview-tip">
      <icon-fire style="color: #4c9de4; font-size: 14px; flex-shrink: 0" />
      <span>热播短剧按排序值展示，启用状态关闭的短剧不会在 App 中展示。建议保持 8-12 部。</span>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="list"
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
              <a-button type="text" size="mini" :disabled="record.sort >= list.length" @click="moveDown(record)">
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
            <a-button type="primary" size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm content="确认从热播列表移除？" @ok="handleDelete(record.id)">
              <a-button type="text" size="small" status="danger">移除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="editingItem ? '编辑热播' : '添加热播短剧'"
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
            <a-button :disabled="!!editingItem" @click="pickerVisible = true">选择短剧</a-button>
          </div>
        </a-form-item>
        <a-form-item field="title" label="标题">
          <a-input v-model="form.title" placeholder="默认使用短剧名称" />
        </a-form-item>
        <a-form-item field="enabled" label="展示状态">
          <a-switch v-model="form.enabled" checked-text="展示" unchecked-text="隐藏" />
        </a-form-item>
      </a-form>
    </a-modal>

    <DramaPickerModal
      v-model:visible="pickerVisible"
      title="选择热播短剧"
      scene-name="热播短剧"
      slot-type="HOT"
      :current-count="list.length"
      :recommended-count="12"
      @select="handleCandidateSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchHomeSlots, createHomeSlot, updateHomeSlot, toggleHomeSlotEnabled,
  deleteHomeSlot, moveHomeSlotSort,
} from '@/api/drama.ts'
import type { HomeSlot, HomeSlotCandidate } from '@/types/drama.ts'
import ResizableTable from "@/components/ResizableTable/index.vue";
import DramaPickerModal from './components/DramaPickerModal.vue'

const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<number | null>(null)
const list = ref<HomeSlot[]>([])
const modalVisible = ref(false)
const pickerVisible = ref(false)
const editingItem = ref<HomeSlot | null>(null)
const formRef = ref()
const selectedDramaName = ref('')

const columns = ref([
  { title: '#', slotName: 'rank', width: 52, resizable: true, minWidth: 40 },
  { title: '封面', slotName: 'cover', width: 76, resizable: true, minWidth: 60 },
  { title: '短剧', slotName: 'info', width: 200, resizable: true, minWidth: 100 },
  { title: '排序', slotName: 'sort', width: 100, resizable: true, minWidth: 80 },
  { title: '展示', slotName: 'enabled', width: 100, resizable: true, minWidth: 80 },
  { title: '操作', slotName: 'operations', width: 100, resizable: true, minWidth: 80 },
])

const form = reactive({
  dramaId: '',
  title: '',
  enabled: true,
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

async function loadList() {
  loading.value = true
  try {
    list.value = await fetchHomeSlots('HOT') as HomeSlot[]
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingItem.value = null
  selectedDramaName.value = ''
  Object.assign(form, { dramaId: '', title: '', enabled: true })
  modalVisible.value = true
}

function openEdit(item: HomeSlot) {
  editingItem.value = item
  Object.assign(form, {
    dramaId: item.dramaId,
    title: item.title ?? '',
    enabled: item.enabled === 1,
  })
  selectedDramaName.value = item.dramaName ?? ''
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
    if (editingItem.value) {
      await updateHomeSlot(editingItem.value.id, {
        slotType: 'HOT',
        dramaId: editingItem.value.dramaId,
        title: form.title || null,
        enabled: form.enabled ? 1 : 0,
      })
      Message.success('更新成功')
    } else {
      await createHomeSlot({
        slotType: 'HOT',
        dramaId: form.dramaId,
        title: form.title || null,
        enabled: form.enabled ? 1 : 0,
      })
      Message.success('添加成功')
    }
    modalVisible.value = false
    loadList()
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
  await deleteHomeSlot(id)
  Message.success('已移除')
  loadList()
}

async function moveUp(item: HomeSlot) {
  await moveHomeSlotSort(item.id, 'UP')
  loadList()
}

async function moveDown(item: HomeSlot) {
  await moveHomeSlotSort(item.id, 'DOWN')
  loadList()
}

onMounted(loadList)
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

.preview-tip {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: rgba(224, 68, 102,0.05);
  border: 1px solid rgba(224, 68, 102,0.12);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(22, 41, 63, 0.68);
  margin-bottom: 16px;
}

.rank-badge {
  width: 26px; height: 26px;
  border-radius: 6px;
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
