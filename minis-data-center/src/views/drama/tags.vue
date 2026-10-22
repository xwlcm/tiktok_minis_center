<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">标签管理</div>
        <div class="page-subtitle">管理短剧标签，每个标签对应 C 端的一个分类</div>
      </div>
      <a-button type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>
        新增标签
      </a-button>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="allTags"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="false"
      >
        <template #name="{ record }">
          <span class="tag-name">{{ record.name }}</span>
        </template>
        <template #sortWeight="{ record }">
          <span class="sort-weight">{{ record.sortWeight }}</span>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="启用"
            unchecked-text="禁用"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
        </template>
        <template #refCount="{ record }">
          <span class="ref-count">{{ record.refCount ?? 0 }} 部短剧</span>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm
              :content="record.refCount > 0 ? `该标签关联了 ${record.refCount} 部短剧，确认删除？` : '确认删除该标签？'"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
      </ResizableTable>
    </div>

    <a-modal
      v-model:visible="modalVisible"
      :title="editingTag ? '编辑标签' : '新增标签'"
      :ok-loading="submitting"
      width="400px"
      @ok="handleSave"
      @cancel="modalVisible = false"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="name" label="标签名称">
          <a-input v-model="form.name" placeholder="如：Romance、Action、Fantasy" :max-length="20" />
        </a-form-item>
        <a-form-item field="sortWeight" label="排序权重">
          <a-input-number v-model="form.sortWeight" :min="0" :max="9999" style="width: 100%" placeholder="数值越大越靠前" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { fetchTagList, createTag, updateTag, deleteTag } from '@/api/drama.ts'
import type { Tag } from '@/types/drama.ts'
import ResizableTable from '@/components/ResizableTable/index.vue'

const loading = ref(false)
const submitting = ref(false)
const togglingId = ref<number | string | null>(null)
const allTags = ref<Tag[]>([])
const modalVisible = ref(false)
const editingTag = ref<Tag | null>(null)
const formRef = ref()

const form = reactive({
  name: '',
  sortWeight: 0,
})

const formRules = {
  name: [
    { required: true, message: '请输入标签名称' },
    { maxLength: 20, message: '标签名称不超过 20 字符' },
  ],
}

const columns = ref([
  { title: '标签名称', slotName: 'name', width: 200, resizable: true, minWidth: 120 },
  { title: '排序', slotName: 'sortWeight', width: 80, resizable: true, minWidth: 60 },
  { title: '状态', slotName: 'status', width: 100, resizable: true, minWidth: 80 },
  { title: '关联短剧', slotName: 'refCount', width: 110, resizable: true, minWidth: 80 },
  { title: '操作', slotName: 'operations', width: 130, resizable: true, minWidth: 100 },
])

async function loadTags() {
  loading.value = true
  try {
    const res = await fetchTagList()
    if (res && typeof res === 'object' && 'rows' in res) {
      allTags.value = res.rows || []
    } else if (Array.isArray(res)) {
      allTags.value = res
    } else {
      allTags.value = []
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingTag.value = null
  Object.assign(form, { name: '', sortWeight: 0 })
  modalVisible.value = true
}

function openEdit(tag: Tag) {
  editingTag.value = tag
  Object.assign(form, { name: tag.name, sortWeight: tag.sortWeight })
  modalVisible.value = true
}

async function handleSave() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    if (editingTag.value) {
      await updateTag(editingTag.value.id, { name: form.name, sortWeight: form.sortWeight })
      Message.success('更新成功')
    } else {
      await createTag({ name: form.name, groupName: form.name, color: null, icon: null, sortWeight: form.sortWeight, status: 1 })
      Message.success('创建成功')
    }
    modalVisible.value = false
    loadTags()
  } finally {
    submitting.value = false
  }
}

async function handleToggleStatus(tag: Tag, enabled: boolean) {
  togglingId.value = tag.id
  try {
    const newStatus = enabled ? 1 : 0
    await updateTag(tag.id, { status: newStatus })
    tag.status = newStatus
    Message.success(enabled ? '已启用' : '已禁用')
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(tag: Tag) {
  await deleteTag(tag.id)
  Message.success('删除成功')
  loadTags()
}

onMounted(loadTags)
</script>

<style scoped>
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;
}
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.table-card {
  background: var(--mc-bg-card); border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md); box-shadow: var(--mc-shadow-xs); overflow: clip;
}
.tag-name { font-size: 13px; font-weight: 600; color: rgba(22, 41, 63, 0.92); }
.sort-weight { font-size: 13px; font-weight: 600; color: rgba(22, 41, 63, 0.81); }
.ref-count { font-size: 13px; color: rgba(22, 41, 63, 0.68); }
.row-actions { display: flex; gap: 4px; }
</style>
