<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">应用管理</div>
        <div class="page-subtitle">管理 TK Minis 应用，配置应用信息与状态</div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增应用
        </a-button>
      </div>
    </div>

    <div class="toolbar">
      <a-input
        v-model="filters.appName"
        placeholder="搜索应用名称..."
        allow-clear
        style="width: 200px"
        @keyup.enter="handleSearch"
      >
        <template #prefix><icon-search /></template>
      </a-input>
      <a-input
        v-model="filters.clientKey"
        placeholder="Client Key"
        allow-clear
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
      <a-select
        v-model="filters.status"
        placeholder="状态"
        allow-clear
        style="width: 110px"
        :options="statusOptions"
        @change="handleSearch"
      />
      <a-select
        v-model="filters.appType"
        placeholder="变现模式"
        allow-clear
        style="width: 140px"
        :options="appTypeOptions"
        @change="handleSearch"
      />
      <a-button type="primary" @click="handleSearch">搜索</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <div class="table-card">
      <a-table
        :columns="columns"
        :data="appList"
        :loading="loading"
        :pagination="{
          total,
          current: pageNum,
          pageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="id"
        :bordered="false"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #appName="{ record }">
          <div class="app-cell">
            <a-avatar :size="28" shape="square" class="app-avatar">
              {{ record.appName?.[0]?.toUpperCase() }}
            </a-avatar>
            <div>
              <div class="app-name">{{ record.appName }}</div>
              <div class="app-key">{{ record.clientKey }}</div>
            </div>
          </div>
        </template>

        <template #appType="{ record }">
          <a-tag :color="appTypeColor(record.appType)" size="small">
            {{ appTypeLabel(record.appType) }}
          </a-tag>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="record.status === '0'"
            :disabled="record.clientKey === appStore.currentClientKey"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
        </template>

        <template #dailyEventQuota="{ record }">
          {{ record.dailyEventQuota ? (record.dailyEventQuota / 10000).toFixed(0) + ' 万' : '—' }}
        </template>

        <template #createTime="{ record }">
          {{ formatDate(record.createTime) }}
        </template>

        <template #operations="{ record }">
          <a-button type="text" size="mini" @click="openDetail(record)">
            <template #icon><icon-eye /></template>
            详情
          </a-button>
          <a-button type="text" size="mini" @click="openEdit(record)">
            <template #icon><icon-edit /></template>
            编辑
          </a-button>
          <a-button
            v-if="record.clientKey !== appStore.currentClientKey"
            type="text"
            size="mini"
            @click="handleSwitch(record)"
          >
            <template #icon><icon-swap /></template>
            切换
          </a-button>
          <a-popconfirm content="确认删除该应用？删除后不可恢复" @ok="handleDelete(record)">
            <a-button
              type="text"
              size="mini"
              status="danger"
              :disabled="record.clientKey === appStore.currentClientKey"
            >
              <template #icon><icon-delete /></template>
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑应用 -->
    <a-modal
      v-model:visible="formVisible"
      :title="isEdit ? `编辑应用 — ${editingApp?.appName}` : '新增应用'"
      :ok-loading="submitting"
      width="600px"
      @ok="handleSubmit"
      @cancel="formVisible = false"
    >
      <a-form ref="formRef" :model="appForm" :rules="formRules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="appName" label="应用名称">
              <a-input v-model="appForm.appName" placeholder="如：FlareGalaxy" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="clientKey" label="Client Key">
              <a-input
                v-model="appForm.clientKey"
                placeholder="TikTok 开放平台签发的 clientKey"
                :disabled="isEdit"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="clientSecret" label="Client Secret">
              <a-input-password
                v-model="appForm.clientSecret"
                :placeholder="isEdit ? '留空则不修改' : 'TikTok 开放平台签发的 clientSecret'"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="appType" label="变现模式">
              <a-select v-model="appForm.appType" placeholder="选择变现模式">
                <a-option value="IAA">IAA（广告变现）</a-option>
                <a-option value="IAP">IAP（内购变现）</a-option>
                <a-option value="IAA_IAP">IAA + IAP（混合变现）</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="dailyEventQuota" label="日事件配额">
              <a-input-number
                v-model="appForm.dailyEventQuota"
                :min="0"
                :step="10000"
                placeholder="默认 10000000"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="sortOrder" label="排序">
              <a-input-number
                v-model="appForm.sortOrder"
                :min="0"
                placeholder="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="status" label="状态">
              <a-radio-group
                v-model="appForm.status"
                type="button"
                :disabled="isEditingCurrentApp"
              >
                <a-radio value="0">启用</a-radio>
                <a-radio value="1">停用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="featureFlags" label="功能开关 JSON">
              <a-input v-model="appForm.featureFlags" placeholder='如 {"debug": false}' />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="appDescription" label="应用描述">
          <a-textarea
            v-model="appForm.appDescription"
            placeholder="简要描述应用用途（选填）"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea
            v-model="appForm.remark"
            placeholder="备注信息（选填）"
            :auto-size="{ minRows: 2, maxRows: 3 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:visible="detailVisible"
      :title="detailApp ? `应用详情 — ${detailApp.appName}` : '应用详情'"
      width="520px"
      :footer="false"
    >
      <a-descriptions v-if="detailApp" :column="1" bordered>
        <a-descriptions-item label="应用名称">{{ detailApp.appName }}</a-descriptions-item>
        <a-descriptions-item label="Client Key">{{ detailApp.clientKey }}</a-descriptions-item>
        <a-descriptions-item label="租户编号">{{ detailApp.tenantId }}</a-descriptions-item>
        <a-descriptions-item label="变现模式">{{ appTypeLabel(detailApp.appType) }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="detailApp.status === '0' ? 'green' : 'red'">
            {{ statusLabel(detailApp.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="日事件配额">{{ formatQuota(detailApp.dailyEventQuota) }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ detailApp.sortOrder ?? 0 }}</a-descriptions-item>
        <a-descriptions-item label="功能开关">{{ detailApp.featureFlags || '—' }}</a-descriptions-item>
        <a-descriptions-item label="应用描述">{{ detailApp.appDescription || '—' }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ detailApp.remark || '—' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(detailApp.createTime) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ formatDate(detailApp.updateTime) }}</a-descriptions-item>
      </a-descriptions>
      <a-empty v-else description="暂无应用详情" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import { fetchAppList, addApp, updateApp, updateAppStatus, deleteApp, getAppById } from '@/api/app.ts'
import type { App, AppCreatePayload, AppUpdatePayload } from '@/types/app.ts'

const appStore = useAppStore()
const router = useRouter()
const loading = ref(false)
const submitting = ref(false)

const appList = ref<App[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  appName: '',
  clientKey: '',
  appType: undefined as string | undefined,
  status: undefined as string | undefined,
})

const statusOptions = [
  { label: '运行中', value: '0' },
  { label: '未激活', value: '1' },
]

const appTypeOptions = [
  { label: 'IAA', value: 'IAA' },
  { label: 'IAP', value: 'IAP' },
  { label: 'IAA + IAP', value: 'IAA_IAP' },
]

const columns = [
  { title: '应用', dataIndex: 'appName', slotName: 'appName', width: 220 },
  { title: '变现模式', dataIndex: 'appType', slotName: 'appType', width: 120 },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100 },
  { title: '日事件配额', dataIndex: 'dailyEventQuota', slotName: 'dailyEventQuota', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime', width: 170 },
  { title: '操作', slotName: 'operations', width: 250, fixed: 'right' as const },
]

function appTypeLabel(type: string) {
  const map: Record<string, string> = { IAA: 'IAA', IAP: 'IAP', IAA_IAP: 'IAA + IAP' }
  return map[type] || type || '—'
}

function appTypeColor(type: string) {
  const map: Record<string, string> = { IAA: 'arcoblue', IAP: 'green', IAA_IAP: 'orangered' }
  return map[type] || 'gray'
}

function statusLabel(status: string) {
  return status === '0' ? '运行中' : '已停用'
}

function formatQuota(quota?: number) {
  if (!quota) return '—'
  return quota >= 10000 ? `${(quota / 10000).toLocaleString()} 万` : quota.toLocaleString()
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function fetchList() {
  loading.value = true
  try {
    const res = await fetchAppList({
      appName: filters.appName || undefined,
      clientKey: filters.clientKey || undefined,
      appType: filters.appType || undefined,
      status: filters.status || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    appList.value = res.rows || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchList()
}

function handleReset() {
  filters.appName = ''
  filters.clientKey = ''
  filters.appType = undefined
  filters.status = undefined
  pageNum.value = 1
  fetchList()
}

function handlePageChange(page: number) {
  pageNum.value = page
  fetchList()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  pageNum.value = 1
  fetchList()
}

async function handleToggleStatus(app: App, active: boolean) {
  if (app.clientKey === appStore.currentClientKey) {
    Message.warning('不能停用当前正在使用的应用')
    return
  }
  const newStatus = active ? '0' : '1'
  const oldStatus = app.status
  app.status = newStatus
  try {
    await updateAppStatus(app.clientKey, newStatus)
    Message.success(active ? '已启用' : '已停用')
  } catch {
    app.status = oldStatus
    Message.error('状态更新失败')
  }
}

async function handleSwitch(app: App) {
  await appStore.switchApp(app.clientKey)
  Message.success(`已切换到 ${app.appName}`)
  router.push('/dashboard')
}

async function handleDelete(app: App) {
  if (app.clientKey === appStore.currentClientKey) {
    Message.warning('不能删除当前正在使用的应用')
    return
  }
  try {
    await deleteApp([app.id])
    Message.success('应用已删除')
    await appStore.refreshAppList()
    fetchList()
  } catch {
    Message.error('应用删除失败')
  }
}

// ── 新增/编辑 ──
const formVisible = ref(false)
const isEdit = ref(false)
const editingApp = ref<App | null>(null)
const formRef = ref()
const detailVisible = ref(false)
const detailApp = ref<App | null>(null)
const isEditingCurrentApp = computed(() => (
  isEdit.value && editingApp.value?.clientKey === appStore.currentClientKey
))

const appForm = reactive({
  appName: '',
  clientKey: '',
  clientSecret: '',
  appType: 'IAA',
  appDescription: '',
  dailyEventQuota: 10000000,
  featureFlags: '',
  status: '0',
  sortOrder: 0,
  remark: '',
})

const formRules = computed(() => ({
  appName: [
    { required: true, message: '请输入应用名称' },
    { maxLength: 64, message: '应用名称不能超过 64 个字符' },
  ],
  clientKey: [
    { required: true, message: '请输入 Client Key' },
    { maxLength: 64, message: 'Client Key 不能超过 64 个字符' },
  ],
  clientSecret: isEdit.value
    ? [{ maxLength: 256, message: 'Client Secret 不能超过 256 个字符' }]
    : [
        { required: true, message: '请输入 Client Secret' },
        { maxLength: 256, message: 'Client Secret 不能超过 256 个字符' },
      ],
  appType: [{ required: true, message: '请选择变现模式' }],
  dailyEventQuota: [{ required: true, message: '请输入日事件配额' }],
  status: [{ required: true, message: '请选择状态' }],
  featureFlags: [
    {
      validator: (value: string | undefined, callback: (error?: string) => void) => {
        if (!value) {
          callback()
          return
        }
        try {
          JSON.parse(value)
          callback()
        } catch {
          callback('功能开关必须是合法 JSON')
        }
      },
    },
  ],
}))

function openCreate() {
  isEdit.value = false
  editingApp.value = null
  Object.assign(appForm, {
    appName: '', clientKey: '', clientSecret: '', appType: 'IAA',
    appDescription: '', dailyEventQuota: 10000000, featureFlags: '', status: '0', sortOrder: 0, remark: '',
  })
  formVisible.value = true
}

function openEdit(app: App) {
  isEdit.value = true
  editingApp.value = app
  Object.assign(appForm, {
    appName: app.appName,
    clientKey: app.clientKey,
    clientSecret: '',
    appType: app.appType || 'IAA',
    appDescription: app.appDescription || '',
    dailyEventQuota: app.dailyEventQuota || 10000000,
    featureFlags: app.featureFlags || '',
    status: app.status || '0',
    sortOrder: app.sortOrder || 0,
    remark: app.remark || '',
  })
  formVisible.value = true
}

async function openDetail(app: App) {
  try {
    detailApp.value = await getAppById(app.id)
  } catch {
    detailApp.value = app
  }
  detailVisible.value = true
}

async function handleSubmit() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    if (isEdit.value && editingApp.value) {
      const updateData: AppUpdatePayload = {
        id: editingApp.value.id,
        clientKey: editingApp.value.clientKey,
        appName: appForm.appName.trim(),
        appType: appForm.appType,
        appDescription: appForm.appDescription || undefined,
        dailyEventQuota: appForm.dailyEventQuota,
        featureFlags: appForm.featureFlags || undefined,
        status: appForm.status,
        sortOrder: appForm.sortOrder,
        remark: appForm.remark || undefined,
      }
      if (appForm.clientSecret) {
        updateData.clientSecret = appForm.clientSecret
      }
      await updateApp(updateData)
      Message.success('应用更新成功')
    } else {
      const createData: AppCreatePayload = {
        appName: appForm.appName.trim(),
        clientKey: appForm.clientKey.trim(),
        clientSecret: appForm.clientSecret.trim(),
        appType: appForm.appType,
        appDescription: appForm.appDescription || undefined,
        dailyEventQuota: appForm.dailyEventQuota,
        featureFlags: appForm.featureFlags || undefined,
        status: appForm.status,
        sortOrder: appForm.sortOrder,
        remark: appForm.remark || undefined,
      }
      await addApp(createData)
      Message.success('应用创建成功')
    }
    formVisible.value = false
    await appStore.refreshAppList()
    fetchList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
}
.page-subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  margin-top: 2px;
}
.header-actions { display: flex; gap: 8px; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.table-card {
  background: #12151F;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 16px;
}

.app-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.app-avatar {
  border-radius: 8px !important;
  background: linear-gradient(135deg, #E0486D, #5CBDC5) !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #fff !important;
  flex-shrink: 0;
}
.app-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.app-key {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  font-family: monospace;
}
</style>
