<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">首页轮播管理</div>
        <div class="page-subtitle">配置 TikTok Minis 首页轮播推荐短剧，建议 6-8 张</div>
      </div>
      <a-button type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>
        添加轮播
      </a-button>
    </div>

    <div class="preview-tip">
      <icon-info-circle style="color: #4c9de4; font-size: 14px; flex-shrink: 0" />
      <span>轮播图按排序值从小到大展示，点击上移/下移可调整顺序。建议保持 6-8 张高质量短剧。</span>
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
        <template #cover="{ record }">
          <a-image
            v-if="record.coverUrl"
            :src="record.coverUrl"
            width="80"
            height="44"
            fit="cover"
            style="border-radius: 6px; display: block"
          />
          <div v-else class="cover-placeholder cover-placeholder--lg">
            <icon-video-camera style="font-size: 20px; color: color-mix(in srgb, var(--mc-text-primary) 33%, transparent)" />
          </div>
        </template>

        <template #info="{ record }">
          <div class="item-info">
            <div class="item-title">{{ record.title || record.dramaName }}</div>
            <div class="item-drama-id">关联短剧：{{ record.dramaName }}</div>
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
            <a-popconfirm content="确认删除该轮播项？" @ok="handleDelete(record.id)">
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="editingItem ? '编辑轮播' : '添加轮播'"
      :ok-loading="submitting"
      width="560px"
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
        <a-form-item field="title" label="轮播标题">
          <a-input v-model="form.title" placeholder="默认使用短剧名称" />
        </a-form-item>
        <a-form-item field="enabled" label="展示状态">
          <a-switch v-model="form.enabled" checked-text="展示" unchecked-text="隐藏" />
        </a-form-item>
      </a-form>
    </a-modal>

    <DramaPickerModal
      v-model:visible="pickerVisible"
      title="选择轮播短剧"
      scene-name="首页轮播"
      slot-type="BANNER"
      :current-count="list.length"
      :recommended-count="8"
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
  { title: '封面', slotName: 'cover', width: 100, resizable: true, minWidth: 80 },
  { title: '标题 / 描述', slotName: 'info', width: 220, resizable: true, minWidth: 120 },
  { title: '排序', slotName: 'sort', width: 100, resizable: true, minWidth: 80 },
  { title: '展示状态', slotName: 'enabled', width: 110, resizable: true, minWidth: 90 },
  { title: '创建时间', dataIndex: 'createTime', width: 160, resizable: true, minWidth: 120 },
  { title: '操作', slotName: 'operations', width: 110, resizable: true, minWidth: 80 },
])

const form = reactive({
  dramaId: '',
  title: '',
  enabled: true,
})

const formRules = {
  dramaId: [{ required: true, message: '请选择短剧' }],
}

async function loadList() {
  loading.value = true
  try {
    list.value = await fetchHomeSlots('BANNER') as HomeSlot[]
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
        slotType: 'BANNER',
        dramaId: editingItem.value.dramaId,
        title: form.title || null,
        enabled: form.enabled ? 1 : 0,
      })
      Message.success('更新成功')
    } else {
      await createHomeSlot({
        slotType: 'BANNER',
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
  Message.success('删除成功')
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
  border-radius: 4px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-placeholder--lg {
  width: 80px;
  height: 44px;
  border-radius: 6px;
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
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  border-radius: 8px;
}
.selected-drama {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 16px;
}
.page-title { font-size: 18px; font-weight: 700; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); }
.page-subtitle { font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent); margin-top: 2px; }

.preview-tip {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: rgba(76, 157, 228, 0.06);
  border: 1px solid rgba(124, 195, 240, 0.19);
  border-radius: 8px;
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
  margin-bottom: 16px;
}

.item-info { display: flex; flex-direction: column; gap: 3px; }
.item-title { font-size: 13px; font-weight: 600; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); }
.item-sub { font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 74%, transparent); }
.item-drama-id { font-size: 11px; color: rgba(76, 157, 228, 0.7); }

.sort-cell { display: flex; align-items: center; gap: 6px; }
.sort-num {
  width: 28px; height: 28px;
  border-radius: 6px;
  background: rgba(76, 157, 228, 0.07);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}
.sort-btns { display: flex; flex-direction: column; gap: 1px; }

.row-actions { display: flex; gap: 4px; }
</style>
