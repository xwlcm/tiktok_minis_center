<template>
  <div class="page-shell ad-account-console">
    <div class="page-header">
      <div>
        <div class="page-title">广告帐户</div>
        <div class="page-subtitle">管理 TikTok 授权与广告主同步状态</div>
      </div>
      <div class="page-actions">
        <a-button :loading="pageLoading" @click="loadAllData">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="handleBindClick">
          <template #icon><icon-plus /></template>
          绑定广告帐户
        </a-button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">广告主</div>
        <div class="summary-value">{{ advertiserList.length }}</div>
        <div class="summary-hint">当前应用下已识别的同步对象</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">可同步</div>
        <div class="summary-value">{{ syncableAdvertiserCount }}</div>
        <div class="summary-hint">授权和来源均可用</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">授权正常</div>
        <div class="summary-value">{{ normalAccountCount }}</div>
        <div class="summary-hint">已启用的 TikTok 授权来源</div>
      </div>
      <div class="summary-card summary-card--attention">
        <div class="summary-label">需要处理</div>
        <div class="summary-value">{{ needsAttentionCount }}</div>
        <div class="summary-hint">停用、失效、无来源或同步异常</div>
      </div>
    </div>

    <div class="table-card">
      <div class="toolbar">
        <a-input
          v-model="advertiserKeyword"
          placeholder="搜索广告主名称或 ID"
          allow-clear
          class="toolbar-search"
          @keyup.enter="handleAdvertiserSearch"
        >
          <template #prefix><icon-search /></template>
        </a-input>
        <a-select
          v-model="statusFilter"
          placeholder="状态"
          allow-clear
          class="toolbar-select"
          :options="statusFilterOptions"
          @change="handleAdvertiserSearch"
        />
        <a-button type="primary" @click="handleAdvertiserSearch">筛选</a-button>
        <a-button @click="resetAdvertiserFilter">重置</a-button>
      </div>

      <a-table
        :columns="advertiserColumns"
        :data="filteredAdvertisers"
        :loading="pageLoading"
        :pagination="false"
        :bordered="false"
        :scroll="{ x: 1120 }"
        row-key="id"
      >
        <template #advertiserInfo="{ record }">
          <div class="advertiser-cell">
            <div class="cell-title">{{ record.advertiserName || '未命名广告主' }}</div>
            <div class="mono-text">{{ record.advertiserId }}</div>
          </div>
        </template>

        <template #displayStatus="{ record }">
          <a-space direction="vertical" size="mini">
            <a-tag :color="advertiserStatusMeta(record).color" size="small">
              {{ advertiserStatusMeta(record).label }}
            </a-tag>
            <span
              v-if="advertiserIssueSummary(record)"
              class="cell-subtitle ellipsis-text"
              :title="advertiserIssueSummary(record)"
            >
              {{ advertiserIssueSummary(record) }}
            </span>
          </a-space>
        </template>

        <template #currentSource="{ record }">
          <div class="source-summary">
            <div class="cell-title">{{ primarySource(record)?.authUserName || record.primaryAccountName || '—' }}</div>
            <div class="cell-subtitle">Account ID：{{ record.primaryAccountId || '—' }}</div>
          </div>
        </template>

        <template #syncResult="{ record }">
          <div class="sync-summary">
            <div class="cell-title">{{ latestSyncTime(record) }}</div>
            <div
              v-if="record.lastErrorMsg"
              class="cell-error ellipsis-text"
              :title="record.lastErrorMsg"
            >
              {{ record.lastErrorMsg }}
            </div>
            <div v-else class="cell-subtitle">
              最近成功：{{ formatDateTime(record.lastSuccessAt) }}
            </div>
          </div>
        </template>

        <template #sourceCount="{ record }">
          <a-tag color="arcoblue" size="small">{{ record.sourceCount || record.sources?.length || 0 }} 个来源</a-tag>
        </template>

        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="text" size="small" @click="openAdvertiserDrawer(record)">
              <template #icon><icon-eye /></template>
              详情
            </a-button>
            <a-button
              v-if="record.syncStatus === 1"
              type="text"
              size="small"
              status="warning"
              @click="handleToggleAdvertiserSyncStatus(record, 0)"
            >
              停用
            </a-button>
            <a-button
              v-else
              type="text"
              size="small"
              status="success"
              @click="handleToggleAdvertiserSyncStatus(record, 1)"
            >
              启用
            </a-button>
            <a-button
              v-if="primarySource(record)"
              type="text"
              size="small"
              :loading="healthCheckingId === primarySource(record)?.accountId"
              @click="handleCheckHealth(primarySource(record)!)"
            >
              检查授权
            </a-button>
            <a-button
              v-if="primarySource(record)?.accountStatus === 2"
              type="text"
              size="small"
              status="danger"
              @click="handleReAuth"
            >
              重新授权
            </a-button>
          </div>
        </template>

        <template #empty>
          <a-empty description="暂无广告主同步数据" />
        </template>
      </a-table>
    </div>

    <a-drawer
      v-model:visible="detailDrawerVisible"
      :width="1080"
      :footer="false"
      unmount-on-close
      title="广告主详情"
    >
      <div v-if="selectedAdvertiser" class="drawer-stack">
        <section class="detail-section">
          <div class="section-header">
            <div>
              <div class="section-title">{{ selectedAdvertiser.advertiserName || '未命名广告主' }}</div>
              <div class="mono-text">{{ selectedAdvertiser.advertiserId }}</div>
            </div>
            <a-space>
              <a-tag :color="advertiserStatusMeta(selectedAdvertiser).color" size="small">
                {{ advertiserStatusMeta(selectedAdvertiser).label }}
              </a-tag>
              <a-button
                size="small"
                :status="selectedAdvertiser.syncStatus === 1 ? 'warning' : 'success'"
                @click="handleToggleAdvertiserSyncStatus(selectedAdvertiser, selectedAdvertiser.syncStatus === 1 ? 0 : 1)"
              >
                {{ selectedAdvertiser.syncStatus === 1 ? '停用同步' : '启用同步' }}
              </a-button>
            </a-space>
          </div>

          <a-descriptions :column="2" bordered size="small">
            <a-descriptions-item label="租户">{{ selectedAdvertiser.tenantId }}</a-descriptions-item>
            <a-descriptions-item label="clientKey">{{ selectedAdvertiser.clientKey }}</a-descriptions-item>
            <a-descriptions-item label="币种">{{ selectedAdvertiser.currency || '—' }}</a-descriptions-item>
            <a-descriptions-item label="时区">{{ selectedAdvertiser.timezone || '—' }}</a-descriptions-item>
            <a-descriptions-item label="当前来源">
              {{ selectedPrimarySource?.authUserName || selectedAdvertiser.primaryAccountName || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="Account ID">
              {{ selectedAdvertiser.primaryAccountId || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="最近同步">{{ formatDateTime(selectedAdvertiser.lastSyncAt) }}</a-descriptions-item>
            <a-descriptions-item label="最近成功">{{ formatDateTime(selectedAdvertiser.lastSuccessAt) }}</a-descriptions-item>
            <a-descriptions-item label="同步错误" :span="2">
              <span class="cell-error">{{ selectedAdvertiser.lastErrorMsg || '—' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="来源缓存" :span="2">
              <div class="tag-list">
                <a-tag
                  v-for="source in selectedAdvertiser?.sources || []"
                  :key="source.id"
                  color="arcoblue"
                  size="small"
                >
                  {{ source.advertiserId }}
                </a-tag>
                <span v-if="!selectedAdvertiser?.sources?.length" class="empty-text">—</span>
              </div>
            </a-descriptions-item>
          </a-descriptions>
        </section>

        <section class="detail-section">
          <div class="section-header">
            <div>
              <div class="section-title">授权来源</div>
              <div class="section-subtitle">用于排查授权、访问范围和同步来源状态</div>
            </div>
            <a-button size="small" :loading="pageLoading" @click="reloadSelectedAdvertiser">
              <template #icon><icon-refresh /></template>
              刷新
            </a-button>
          </div>

          <a-table
            :columns="sourceColumns"
            :data="selectedAdvertiser.sources || []"
            :pagination="false"
            :bordered="false"
            :scroll="{ x: 1160 }"
            size="small"
            row-key="id"
          >
            <template #sourceInfo="{ record }">
              <div class="source-cell">
                <div class="cell-title">{{ record.authUserName || '未命名授权' }}</div>
                <div class="cell-subtitle">Account ID：{{ record.accountId }}</div>
                <div class="cell-subtitle">广告主：{{ record.advertiserName || record.advertiserId }}</div>
              </div>
            </template>

            <template #sourceState="{ record }">
              <a-space direction="vertical" size="mini">
                <div class="tag-list">
                  <a-tag v-if="record.isPrimary === 1" color="green" size="small">当前来源</a-tag>
                  <a-tag :color="record.syncEnabled === 1 ? 'green' : 'gray'" size="small">
                    {{ record.syncEnabled === 1 ? '同步启用' : '同步停用' }}
                  </a-tag>
                  <a-tag :color="accountStatusMeta(record.accountStatus).color" size="small">
                    {{ accountStatusMeta(record.accountStatus).label }}
                  </a-tag>
                </div>
                <span class="cell-subtitle">来源：{{ sourceTypeLabel(record.sourceType) }}</span>
              </a-space>
            </template>

            <template #access="{ record }">
              <a-space direction="vertical" size="mini">
                <a-tag :color="accessStatusMeta(record.accessStatus).color" size="small">
                  {{ accessStatusMeta(record.accessStatus).label }}
                </a-tag>
                <span
                  v-if="sourceIssueSummary(record)"
                  class="cell-subtitle ellipsis-text"
                  :title="sourceIssueSummary(record)"
                >
                  {{ sourceIssueSummary(record) }}
                </span>
              </a-space>
            </template>

            <template #checkTime="{ record }">
              <div class="sync-summary">
                <div class="cell-subtitle">看到：{{ formatDateTime(record.lastSeenAt) }}</div>
                <div class="cell-subtitle">范围：{{ formatDateTime(record.lastScopeCheckAt) }}</div>
                <div class="cell-subtitle">健康：{{ formatDateTime(record.lastHealthCheckAt) }}</div>
              </div>
            </template>

            <template #diagnostics="{ record }">
              <div class="diagnostic-list">
                <div>停用原因：{{ record.disabledReason || '—' }}</div>
                <div>停用错误：{{ record.disabledErrorCode || '—' }}</div>
                <div class="ellipsis-text" :title="record.disabledErrorMsg || ''">
                  停用消息：{{ record.disabledErrorMsg || '—' }}
                </div>
                <div>停用时间：{{ formatDateTime(record.disabledAt) }}</div>
                <div>失效原因：{{ record.invalidReason || '—' }}</div>
                <div>失效错误：{{ record.invalidErrorCode || '—' }}</div>
                <div class="ellipsis-text" :title="record.invalidErrorMsg || ''">
                  失效消息：{{ record.invalidErrorMsg || '—' }}
                </div>
              </div>
            </template>

            <template #operations="{ record }">
              <div class="row-actions">
                <a-button
                  v-if="record.isPrimary !== 1 && record.syncEnabled === 1"
                  type="text"
                  size="small"
                  @click="handleSetPrimaryAccount(record)"
                >
                  设为当前
                </a-button>
                <a-button
                  type="text"
                  size="small"
                  :loading="healthCheckingId === record.accountId"
                  @click="handleCheckHealth(record)"
                >
                  检查授权
                </a-button>
                <a-button
                  v-if="record.accountStatus === 2"
                  type="text"
                  size="small"
                  status="danger"
                  @click="handleReAuth"
                >
                  重新授权
                </a-button>
                <a-button
                  v-if="record.syncEnabled === 1"
                  type="text"
                  size="small"
                  status="warning"
                  @click="handleToggleSourceSyncEnabled(record, 0)"
                >
                  停用
                </a-button>
                <a-button
                  v-else
                  type="text"
                  size="small"
                  status="success"
                  @click="handleToggleSourceSyncEnabled(record, 1)"
                >
                  启用
                </a-button>
              </div>
            </template>

            <template #empty>
              <a-empty description="暂无授权来源" />
            </template>
          </a-table>
        </section>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  checkAdAccountHealth,
  fetchAdAccountList,
  fetchAdvertiserList,
  fetchAuthUrl,
  updateAdvertiserPrimaryAccount,
  updateAdvertiserSourceSyncEnabled,
  updateAdvertiserSyncStatus,
  type AdAccountAdvertiserRecord,
  type AdAccountRecord,
  type AdvertiserRecord,
} from '@/api/adAccount.ts'

type StatusMeta = { label: string; color: string; attention?: boolean }
type AdvertiserStatusKey =
  | 'syncable'
  | 'disabled'
  | 'noSource'
  | 'authInvalid'
  | 'sourceDisabled'
  | 'accessIssue'
  | 'syncIssue'

const pageLoading = ref(false)
const healthCheckingId = ref<number | null>(null)
const accountList = ref<AdAccountRecord[]>([])
const advertiserList = ref<AdvertiserRecord[]>([])
const selectedAdvertiser = ref<AdvertiserRecord | null>(null)
const detailDrawerVisible = ref(false)
const advertiserKeyword = ref('')
const statusFilter = ref<AdvertiserStatusKey | 'attention' | undefined>(undefined)

const advertiserColumns = [
  { title: '广告主', slotName: 'advertiserInfo', width: 300 },
  { title: '状态', slotName: 'displayStatus', width: 170 },
  { title: '当前授权', slotName: 'currentSource', width: 220 },
  { title: '最近同步', slotName: 'syncResult', width: 260 },
  { title: '来源', slotName: 'sourceCount', width: 120 },
  { title: '操作', slotName: 'operations', width: 320 },
]

const sourceColumns = [
  { title: '授权来源', slotName: 'sourceInfo', width: 250 },
  { title: '来源状态', slotName: 'sourceState', width: 220 },
  { title: '访问状态', slotName: 'access', width: 190 },
  { title: '检查时间', slotName: 'checkTime', width: 230 },
  { title: '排障信息', slotName: 'diagnostics', width: 280 },
  { title: '操作', slotName: 'operations', width: 280 },
]

const statusFilterOptions = [
  { label: '全部', value: undefined },
  { label: '可同步', value: 'syncable' },
  { label: '需要处理', value: 'attention' },
  { label: '已停用', value: 'disabled' },
  { label: '无可用来源', value: 'noSource' },
  { label: '授权失效', value: 'authInvalid' },
  { label: '访问异常', value: 'accessIssue' },
  { label: '同步异常', value: 'syncIssue' },
]

const advertiserStatusMetaMap: Record<AdvertiserStatusKey, StatusMeta> = {
  syncable: { label: '可同步', color: 'green' },
  disabled: { label: '已停用', color: 'gray', attention: true },
  noSource: { label: '无可用来源', color: 'orange', attention: true },
  authInvalid: { label: '授权失效', color: 'red', attention: true },
  sourceDisabled: { label: '来源停用', color: 'gray', attention: true },
  accessIssue: { label: '访问异常', color: 'red', attention: true },
  syncIssue: { label: '同步异常', color: 'orange', attention: true },
}

const accountStatusMetaMap: Record<number, StatusMeta> = {
  0: { label: '已停用', color: 'gray' },
  1: { label: '已启用', color: 'green' },
  2: { label: '授权失效', color: 'red' },
}

const accessStatusMetaMap: Record<string, StatusMeta> = {
  ACTIVE: { label: '可访问', color: 'green' },
  SCOPE_MISSING: { label: '范围缺失', color: 'orange' },
  ACCESS_REVOKED: { label: '访问撤销', color: 'red' },
  TOKEN_INVALIDATED: { label: '授权失效', color: 'red' },
  CURRENT_SOURCE_REPLACED: { label: '已被替换', color: 'gray' },
  MANUAL_DISABLED: { label: '手动停用', color: 'gray' },
}

const syncableAdvertiserCount = computed(
  () => advertiserList.value.filter((item) => advertiserStatusKey(item) === 'syncable').length,
)
const normalAccountCount = computed(() => accountList.value.filter((item) => item.status === 1).length)
const needsAttentionCount = computed(
  () => advertiserList.value.filter((item) => advertiserStatusMeta(item).attention).length,
)

const filteredAdvertisers = computed(() => {
  const keyword = advertiserKeyword.value.trim().toLowerCase()
  return advertiserList.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.advertiserId.toLowerCase().includes(keyword) ||
      (item.advertiserName ?? '').toLowerCase().includes(keyword)
    const key = advertiserStatusKey(item)
    const matchStatus =
      !statusFilter.value ||
      key === statusFilter.value ||
      (statusFilter.value === 'attention' && advertiserStatusMetaMap[key].attention)
    return matchKeyword && matchStatus
  })
})

const selectedPrimarySource = computed(() =>
  selectedAdvertiser.value ? primarySource(selectedAdvertiser.value) : null,
)

const selectedPrimaryAccount = computed(() => {
  const accountId = selectedPrimarySource.value?.accountId ?? selectedAdvertiser.value?.primaryAccountId
  return accountList.value.find((account) => account.id === accountId) ?? null
})

function primarySource(record: AdvertiserRecord): AdAccountAdvertiserRecord | null {
  const sources = record.sources || []
  return (
    sources.find((source) => source.accountId === record.primaryAccountId) ||
    sources.find((source) => source.isPrimary === 1) ||
    null
  )
}

function advertiserStatusKey(record: AdvertiserRecord): AdvertiserStatusKey {
  if (record.syncStatus === 0) {
    return 'disabled'
  }
  if (!record.primaryAccountId) {
    return 'noSource'
  }
  const source = primarySource(record)
  if (!source) {
    return 'noSource'
  }
  if (source.accountStatus === 2) {
    return 'authInvalid'
  }
  if (source.syncEnabled === 0) {
    return 'sourceDisabled'
  }
  if (!isAccessActive(source.accessStatus)) {
    return 'accessIssue'
  }
  if (record.lastErrorMsg) {
    return 'syncIssue'
  }
  return 'syncable'
}

function advertiserStatusMeta(record: AdvertiserRecord): StatusMeta {
  return advertiserStatusMetaMap[advertiserStatusKey(record)]
}

function isAccessActive(status?: string | null): boolean {
  if (!status) {
    return true
  }
  return status.toUpperCase() === 'ACTIVE'
}

function accountStatusMeta(status?: number | null): StatusMeta {
  return accountStatusMetaMap[status ?? 0] ?? { label: '未知', color: 'gray' }
}

function accessStatusMeta(status?: string | null): StatusMeta {
  if (!status) {
    return { label: '未记录', color: 'gray' }
  }
  return accessStatusMetaMap[status.toUpperCase()] ?? { label: status, color: 'orange' }
}

function advertiserIssueSummary(record: AdvertiserRecord): string {
  const key = advertiserStatusKey(record)
  if (key === 'syncable') {
    return ''
  }
  if (key === 'disabled') {
    return '该广告主已停用同步'
  }
  if (key === 'noSource') {
    return '缺少可用授权来源'
  }
  const source = primarySource(record)
  return (
    sourceIssueSummary(source) ||
    record.lastErrorMsg ||
    advertiserStatusMetaMap[key].label
  )
}

function sourceIssueSummary(source?: AdAccountAdvertiserRecord | null): string {
  if (!source) {
    return ''
  }
  if (source.accountStatus === 2) {
    return source.invalidReason || source.invalidErrorMsg || '授权已失效'
  }
  if (source.syncEnabled === 0) {
    return source.disabledReason || '来源同步已停用'
  }
  if (!isAccessActive(source.accessStatus)) {
    return source.disabledReason || source.disabledErrorMsg || accessStatusMeta(source.accessStatus).label
  }
  return source.disabledReason || source.invalidReason || ''
}

function sourceTypeLabel(sourceType?: string | null): string {
  const value = (sourceType || 'AUTH').toUpperCase()
  const map: Record<string, string> = {
    AUTH: '授权',
    MIGRATION: '迁移',
    MANUAL: '人工',
  }
  return map[value] || sourceType || '授权'
}

function latestSyncTime(record: AdvertiserRecord): string {
  return formatDateTime(record.lastSuccessAt || record.lastSyncAt)
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

async function loadAllData() {
  pageLoading.value = true
  try {
    const [accountRes, advertiserRes] = await Promise.allSettled([
      fetchAdAccountList(),
      fetchAdvertiserList(),
    ])
    accountList.value = accountRes.status === 'fulfilled' ? accountRes.value || [] : []
    advertiserList.value = advertiserRes.status === 'fulfilled' ? advertiserRes.value || [] : []
    syncSelectedAdvertiser()
  } finally {
    pageLoading.value = false
  }
}

function syncSelectedAdvertiser() {
  if (!selectedAdvertiser.value) {
    return
  }
  selectedAdvertiser.value =
    advertiserList.value.find((item) => item.id === selectedAdvertiser.value?.id) ??
    selectedAdvertiser.value
}

async function reloadSelectedAdvertiser() {
  await loadAllData()
}

function handleAdvertiserSearch() {
  // Filtering is computed locally; this method keeps toolbar events explicit.
}

function resetAdvertiserFilter() {
  advertiserKeyword.value = ''
  statusFilter.value = undefined
}

function openAdvertiserDrawer(record: AdvertiserRecord) {
  selectedAdvertiser.value = record
  detailDrawerVisible.value = true
}

function handleBindClick() {
  Modal.confirm({
    title: '绑定广告帐户',
    content: '即将跳转 TikTok 授权页面，请在 10 分钟内完成操作。授权完成后将自动返回本页面。',
    okText: '前往授权',
    cancelText: '取消',
    onOk: () => doRedirectToAuth(),
  })
}

function handleReAuth() {
  Modal.confirm({
    title: '重新授权',
    content: '当前授权可能已失效，即将跳转 TikTok 重新授权。授权成功后会刷新可同步广告主。',
    okText: '前往授权',
    cancelText: '取消',
    onOk: () => doRedirectToAuth(),
  })
}

async function doRedirectToAuth() {
  try {
    const res = await fetchAuthUrl('/ad/accounts')
    if (res?.authUrl) {
      window.location.href = res.authUrl
    } else {
      Message.error('获取授权链接失败')
    }
  } catch (error) {
    Message.error(getErrorMessage(error, '获取授权链接失败，请重试'))
  }
}

async function handleCheckHealth(record: AdAccountAdvertiserRecord) {
  healthCheckingId.value = record.accountId
  try {
    await checkAdAccountHealth(record.accountId)
    Message.success('授权检查通过')
  } catch (error) {
    Message.error(getErrorMessage(error, '授权检查失败，请重新授权'))
  } finally {
    healthCheckingId.value = null
    await loadAllData()
  }
}

async function handleToggleAdvertiserSyncStatus(record: AdvertiserRecord, syncStatus: number) {
  Modal.confirm({
    title: syncStatus === 1 ? '启用同步' : '停用同步',
    content: `确认${syncStatus === 1 ? '启用' : '停用'}「${record.advertiserName || record.advertiserId}」的报表同步？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await updateAdvertiserSyncStatus(record.id, syncStatus)
      Message.success(syncStatus === 1 ? '已启用同步' : '已停用同步')
      await loadAllData()
    },
  })
}

async function handleSetPrimaryAccount(record: AdAccountAdvertiserRecord) {
  if (!selectedAdvertiser.value) return
  Modal.confirm({
    title: '设为当前来源',
    content: `将 Account ID ${record.accountId} 设为「${selectedAdvertiser.value.advertiserName || selectedAdvertiser.value.advertiserId}」的当前同步来源？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await updateAdvertiserPrimaryAccount(selectedAdvertiser.value!.id, record.accountId)
      Message.success('当前来源已更新')
      await loadAllData()
    },
  })
}

async function handleToggleSourceSyncEnabled(
  record: AdAccountAdvertiserRecord,
  syncEnabled: number,
) {
  const label = syncEnabled === 1 ? '启用' : '停用'
  Modal.confirm({
    title: `${label}来源`,
    content: `确认${label} Account ID ${record.accountId} 的同步来源？`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      await updateAdvertiserSourceSyncEnabled(record.id, syncEnabled)
      Message.success(`${label}成功`)
      await loadAllData()
    },
  })
}

onMounted(loadAllData)
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--mc-text-primary);
}

.page-subtitle {
  margin-top: 6px;
  color: var(--mc-text-secondary);
  font-size: 13px;
}

.page-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: var(--mc-radius-md);
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  box-shadow: var(--mc-shadow-xs);
}

.summary-card--attention {
  border-color: rgba(240, 160, 64, 0.28);
}

.summary-label {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.summary-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 800;
  color: var(--mc-text-primary);
}

.summary-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px;
  border-bottom: 1px solid var(--mc-border);
}

.toolbar-search {
  width: 280px;
}

.toolbar-select {
  width: 150px;
}

.advertiser-cell,
.source-summary,
.sync-summary,
.source-cell {
  min-width: 0;
}

.cell-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--mc-text-primary);
}

.cell-subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.mono-text {
  margin-top: 3px;
  font-family: var(--mc-font-mono);
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.cell-error {
  color: #db8a24;
  font-size: 12px;
}

.ellipsis-text {
  display: block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.empty-text {
  color: var(--mc-text-disabled);
  font-size: 13px;
}

.drawer-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--mc-text-primary);
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.diagnostic-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  color: var(--mc-text-secondary);
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-search,
  .toolbar-select {
    width: 100%;
  }
}
</style>
