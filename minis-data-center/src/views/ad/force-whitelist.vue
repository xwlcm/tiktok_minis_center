<template>
  <div class="faw-page">
    <!-- 页头 -->
    <div class="faw-header">
      <div>
        <div class="faw-title">强弹白名单</div>
        <div class="faw-subtitle">
          白名单用户不触发任何全局强弹（激励视频/插屏），判定优先级高于
          ttclid；在用户下次登录时生效，已登录用户需重新登录才会刷新
        </div>
      </div>
      <a-button type="primary" size="large" @click="openForm()">
        <template #icon><icon-plus /></template>
        新增白名单
      </a-button>
    </div>

    <!-- 搜索栏 -->
    <div class="faw-toolbar">
      <a-input
        v-model="query.openId"
        placeholder="按 openId 搜索"
        allow-clear
        style="width: 320px"
        @press-enter="handleSearch"
      >
        <template #prefix><icon-search /></template>
      </a-input>
      <a-select
        v-model="query.status"
        placeholder="状态"
        allow-clear
        style="width: 140px"
        :options="statusOptions"
      />
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <!-- 白名单列表 -->
    <div class="table-card">
      <a-table
        :columns="columns"
        :data="list"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="pagination"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #openId="{ record }">
          <div class="openid-cell">
            <span class="openid-text">{{ record.openId }}</span>
            <a-tooltip content="复制 openId">
              <a-button type="text" size="mini" @click="handleCopy(record.openId)">
                <template #icon><icon-copy /></template>
              </a-button>
            </a-tooltip>
          </div>
        </template>
        <template #reason="{ record }">
          <span v-if="record.reason">{{ record.reason }}</span>
          <span v-else class="empty-text">-</span>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="生效"
            unchecked-text="失效"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
        </template>
        <template #createTime="{ record }">
          <span>{{ record.createTime || '-' }}</span>
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openForm(record)">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
            <a-popconfirm
              content="确定要移除该白名单用户吗？移除后该用户下次登录将恢复强弹判定。"
              type="warning"
              @ok="handleDelete(record)"
            >
              <a-button type="text" size="small" status="danger">
                <template #icon><icon-delete /></template>
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="editingId ? '编辑白名单' : '新增白名单'"
      :ok-loading="submitting"
      width="520px"
      @ok="handleSave"
      @cancel="resetForm"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item field="openId" label="TikTok openId">
          <a-input v-model="form.openId" placeholder="用户的 TikTok openId" :max-length="128" allow-clear />
        </a-form-item>
        <a-form-item field="reason" label="加入原因（备注）">
          <a-textarea
            v-model="form.reason"
            placeholder="如：内部测试账号 / 合作方账号"
            :max-length="256"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="form.status">
            <a-radio :value="1">生效</a-radio>
            <a-radio :value="0">失效</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { TableColumnData, FormInstance } from '@arco-design/web-vue'
import {
  fetchForceWhitelistPage,
  createForceWhitelist,
  updateForceWhitelist,
  deleteForceWhitelist,
} from '@/api/ad.ts'
import type { ForceAdWhitelistItem } from '@/api/ad.ts'

// ==================== 列表与查询 ====================

const loading = ref(false)
const list = ref<ForceAdWhitelistItem[]>([])
const togglingId = ref<string>('')

const query = reactive<{ openId: string; status: number | undefined }>({
  openId: '',
  status: undefined,
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

const statusOptions = [
  { label: '生效', value: 1 },
  { label: '失效', value: 0 },
]

const columns: TableColumnData[] = [
  { title: 'openId', slotName: 'openId', width: 320 },
  { title: '加入原因', slotName: 'reason' },
  { title: '状态', slotName: 'status', width: 120 },
  { title: '加入时间', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 160, align: 'right' },
]

async function loadList() {
  loading.value = true
  try {
    const res = await fetchForceWhitelistPage({
      openId: query.openId.trim() || undefined,
      status: query.status,
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
    list.value = res.rows || []
    pagination.total = res.total || 0
  } catch {
    // 错误提示由 request 拦截器统一弹出，这里只负责收尾。
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  loadList()
}

function handleReset() {
  query.openId = ''
  query.status = undefined
  pagination.current = 1
  loadList()
}

function handlePageChange(page: number) {
  pagination.current = page
  loadList()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.current = 1
  loadList()
}

async function handleCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('已复制 openId')
  } catch {
    Message.error('复制失败，请手动选择复制')
  }
}

// ==================== 状态切换 ====================

async function handleToggleStatus(record: ForceAdWhitelistItem, enabled: boolean) {
  togglingId.value = record.id
  try {
    await updateForceWhitelist({
      id: record.id,
      openId: record.openId,
      reason: record.reason,
      status: enabled ? 1 : 0,
    })
    record.status = enabled ? 1 : 0
    Message.success(enabled ? '已生效' : '已失效')
  } catch {
    // 失败提示由拦截器弹出，这里不做本地回滚（状态未被修改）。
  } finally {
    togglingId.value = ''
  }
}

// ==================== 新增/编辑 ====================

const formVisible = ref(false)
const submitting = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()

const form = reactive<{ openId: string; reason: string; status: number }>({
  openId: '',
  reason: '',
  status: 1,
})

const formRules = {
  openId: [{ required: true, message: '请输入 TikTok openId' }],
}

function openForm(record?: ForceAdWhitelistItem) {
  editingId.value = record?.id || ''
  form.openId = record?.openId || ''
  form.reason = record?.reason || ''
  form.status = record ? record.status : 1
  formVisible.value = true
}

function resetForm() {
  editingId.value = ''
  form.openId = ''
  form.reason = ''
  form.status = 1
}

async function handleSave() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    const payload = {
      openId: form.openId.trim(),
      reason: form.reason.trim() || undefined,
      status: form.status,
    }
    if (editingId.value) {
      await updateForceWhitelist({ ...payload, id: editingId.value })
      Message.success('白名单已更新')
    } else {
      await createForceWhitelist(payload)
      Message.success('白名单已添加，用户下次登录生效')
    }
    formVisible.value = false
    resetForm()
    loadList()
  } catch {
    // 错误提示由拦截器统一弹出，保留弹窗供用户修正后重试。
  } finally {
    submitting.value = false
  }
}

async function handleDelete(record: ForceAdWhitelistItem) {
  try {
    await deleteForceWhitelist(record.id)
    Message.success('已移除白名单用户')
    // 当前页删空且不是第一页时回退一页，避免停留在空页。
    if (list.value.length === 1 && pagination.current > 1) {
      pagination.current -= 1
    }
    loadList()
  } catch {
    // 错误提示由拦截器统一弹出。
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.faw-page {
  padding: 20px;
}

.faw-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.faw-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
}

.faw-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--color-text-3);
  max-width: 720px;
  line-height: 1.6;
}

.faw-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.table-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  padding: 12px 16px;
}

.openid-cell {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.openid-text {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  word-break: break-all;
}

.empty-text {
  color: var(--color-text-4);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
</style>
