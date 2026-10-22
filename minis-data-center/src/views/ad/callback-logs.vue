<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">回传日志</div>
        <div class="page-subtitle">查看广告投放回传执行记录，支持手动重试补偿</div>
      </div>
      <a-button type="primary" :loading="retrying" @click="handleManualRetry">
        <template #icon><icon-sync /></template>
        手动重试补偿
      </a-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-select
        v-model="filterEventType"
        placeholder="事件类型"
        allow-clear
        style="width: 180px"
        @change="handleFilter"
      >
        <a-option v-for="et in eventTypeOptions" :key="et.value" :value="et.value">
          {{ et.label }}
        </a-option>
      </a-select>
      <a-select
        v-model="filterStatus"
        placeholder="状态"
        allow-clear
        style="width: 120px"
        @change="handleFilter"
      >
        <a-option :value="0">待执行</a-option>
        <a-option :value="1">成功</a-option>
        <a-option :value="2">失败</a-option>
        <a-option :value="3">重试中</a-option>
        <a-option :value="4">已放弃</a-option>
      </a-select>
    </div>

    <!-- 日志列表 -->
    <div class="table-card">
      <a-table
        :columns="columns"
        :data="store.logList"
        :loading="loading"
        :pagination="{
          total: store.logTotal,
          current: store.logCurrentPage,
          pageSize: store.logPageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="id"
        :bordered="false"
        @page-change="handlePageChange"
      >
        <template #status="{ record }">
          <a-tag :color="statusColorMap[record.status]" size="small">
            {{ statusMap[record.status] }}
          </a-tag>
        </template>
        <template #responseCode="{ record }">
          <span v-if="record.responseCode" :class="record.responseCode < 300 ? 'code-ok' : 'code-err'">
            {{ record.responseCode }}
          </span>
          <span v-else class="code-na">-</span>
        </template>
        <template #costMs="{ record }">
          <span v-if="record.costMs != null">{{ record.costMs }}ms</span>
          <span v-else>-</span>
        </template>
        <template #retryCount="{ record }">
          <span>{{ record.retryCount }}</span>
        </template>
        <template #callbackUrl="{ record }">
          <a-tooltip :content="record.callbackUrl" position="top">
            <span class="url-cell">{{ truncateUrl(record.callbackUrl) }}</span>
          </a-tooltip>
        </template>
        <template #errorMessage="{ record }">
          <a-tooltip v-if="record.errorMessage" :content="record.errorMessage" position="top">
            <span class="error-cell">{{ truncate(record.errorMessage, 40) }}</span>
          </a-tooltip>
          <span v-else>-</span>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAdCallbackStore } from '@/stores/adCallback.ts'
import { useAppStore } from '@/stores/app.ts'
import { triggerManualRetry } from '@/api/adCallback.ts'
import { CallbackLogStatusMap, CallbackLogStatusColorMap } from '@/types/adCallback.ts'

const store = useAdCallbackStore()
const appStore = useAppStore()
const loading = ref(false)
const retrying = ref(false)
const filterEventType = ref<string | undefined>(undefined)
const filterStatus = ref<number | undefined>(undefined)

const statusMap = CallbackLogStatusMap
const statusColorMap = CallbackLogStatusColorMap

const eventTypeOptions = [
  { label: '广告观看完成', value: 'ad_watch_result' },
  { label: '广告展示', value: 'minis_ad_show' },
  { label: '剧集完播', value: 'ep_complete' },
  { label: '解锁成功', value: 'unlock_success' },
  { label: '支付完成', value: 'payment_result' },
]

const columns = ref([
  { title: '事件类型', dataIndex: 'eventType', width: 140 },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '响应码', slotName: 'responseCode', width: 80, align: 'center' as const },
  { title: '耗时', slotName: 'costMs', width: 80, align: 'center' as const },
  { title: '重试', slotName: 'retryCount', width: 60, align: 'center' as const },
  { title: '回传 URL', slotName: 'callbackUrl', width: 200, ellipsis: true },
  { title: '错误信息', slotName: 'errorMessage', width: 180 },
  { title: '执行时间', dataIndex: 'executeTime', width: 160 },
  { title: '创建时间', dataIndex: 'createTime', width: 160 },
])

async function fetchList() {
  loading.value = true
  try {
    await store.fetchLogList({
      eventType: filterEventType.value,
      status: filterStatus.value,
    })
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  store.logCurrentPage = 1
  fetchList()
}

function handlePageChange(page: number) {
  store.logCurrentPage = page
  fetchList()
}

async function handleManualRetry() {
  retrying.value = true
  try {
    await triggerManualRetry()
    Message.success('重试补偿已触发')
    fetchList()
  } finally {
    retrying.value = false
  }
}

function truncateUrl(url: string) {
  if (!url) return '-'
  try {
    const u = new URL(url)
    return u.pathname.length > 30 ? u.host + u.pathname.substring(0, 30) + '...' : u.host + u.pathname
  } catch {
    return url.length > 50 ? url.substring(0, 50) + '...' : url
  }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.substring(0, max) + '...' : str
}

watch(() => appStore.currentClientKey, () => {
  store.logCurrentPage = 1
  fetchList()
}, { immediate: true })
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}
.page-subtitle {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 2px;
}
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}
.url-cell {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--mc-text-secondary);
}
.error-cell {
  font-size: 11px;
  color: var(--color-danger-6);
}
.code-ok {
  color: var(--color-success-6);
  font-weight: 600;
}
.code-err {
  color: var(--color-danger-6);
  font-weight: 600;
}
.code-na {
  color: var(--mc-text-tertiary);
}
</style>
