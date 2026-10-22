<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">推送日志</div>
        <div class="page-subtitle">广告推送执行记录与用户解锁详情</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-input v-model="query.openId" placeholder="用户 openId" allow-clear style="width: 180px" />
      <a-input-number v-model="query.adId" placeholder="广告 ID" allow-clear style="width: 140px" />
      <a-range-picker v-model="dateRange" style="width: 260px" @change="onDateChange" />
      <a-select v-model="query.isSuspect" placeholder="可疑状态" allow-clear style="width: 130px">
        <a-option :value="0">正常</a-option>
        <a-option :value="1">完全可疑</a-option>
        <a-option :value="2">半可信</a-option>
      </a-select>
      <a-select v-model="query.unlockSuccess" placeholder="是否解锁" allow-clear style="width: 120px">
        <a-option :value="1">已解锁</a-option>
        <a-option :value="0">未解锁</a-option>
      </a-select>
      <a-button type="primary" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <!-- 表格 -->
    <a-table
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      stripe
      @page-change="onPageChange"
    >
      <template #columns>
        <a-table-column title="推送时间" data-index="createTime" :width="160" />
        <a-table-column title="用户" data-index="openId" :width="140" ellipsis />
        <a-table-column title="广告ID" data-index="adId" :width="100" />
        <a-table-column title="短剧" data-index="dramaId" :width="100" />
        <a-table-column title="集数" data-index="episodeNumber" :width="60" align="center" />
        <a-table-column title="状态" data-index="watchStatus" :width="120">
          <template #cell="{ record }">
            <a-tag v-if="record.watchStatus === 'COMPLETED'" color="green" size="small">完播</a-tag>
            <a-tag v-else-if="record.watchStatus === 'SKIPPED'" color="orange" size="small">用户跳过</a-tag>
            <a-tag v-else-if="record.watchStatus === 'FAILED'" color="red" size="small">播放失败</a-tag>
            <a-tag v-else-if="record.watchStatus === 'STARTED'" color="cyan" size="small">已推送</a-tag>
            <a-tag v-else size="small">{{ record.watchStatus }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="观看(秒)" data-index="watchedSeconds" :width="80" align="right" />
        <a-table-column title="可疑" :width="100">
          <template #cell="{ record }">
            <a-tooltip v-if="record.isSuspect === 1" :content="record.suspectReason ?? '完全可疑'">
              <a-tag color="red" size="small">可疑</a-tag>
            </a-tooltip>
            <a-tooltip v-else-if="record.isSuspect === 2" :content="record.suspectReason ?? '半可信'">
              <a-tag color="orange" size="small">半可信</a-tag>
            </a-tooltip>
            <span v-else class="text-normal">—</span>
          </template>
        </a-table-column>
        <a-table-column title="解锁" :width="60" align="center">
          <template #cell="{ record }">
            <icon-check-circle v-if="record.unlockSuccess === 1" style="color: #2FBF87" />
            <span v-else>—</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { fetchPushLogs } from '@/api/adAlgorithm.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'
import type { AdPushLogVo, PushLogQuery } from '@/types/adAlgorithm.ts'

const defaultDateRange = yesterdayTodayRange()
const query = reactive<PushLogQuery>({
  pageNum: 1,
  pageSize: 20,
  startTime: defaultDateRange[0],
  endTime: defaultDateRange[1],
})
const dateRange = ref<string[]>(defaultDateRange)
const tableData = ref<AdPushLogVo[]>([])
const loading = ref(false)
const pagination = reactive({ current: 1, pageSize: 20, total: 0 })

function onDateChange(_value: unknown, _date: unknown, dateString: (string | undefined)[] | undefined) {
  if (dateString && dateString.length === 2 && dateString[0] && dateString[1]) {
    query.startTime = dateString[0]
    query.endTime = dateString[1]
  } else {
    query.startTime = undefined
    query.endTime = undefined
  }
}

function onPageChange(page: number) {
  pagination.current = page
  query.pageNum = page
  loadData()
}

function handleSearch() {
  pagination.current = 1
  query.pageNum = 1
  loadData()
}

function handleReset() {
  query.openId = undefined
  query.adId = undefined
  const [startTime, endTime] = yesterdayTodayRange()
  query.startTime = startTime
  query.endTime = endTime
  query.isSuspect = undefined
  query.unlockSuccess = undefined
  dateRange.value = [startTime, endTime]
  handleSearch()
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchPushLogs(query)
    tableData.value = res?.rows ?? []
    pagination.total = res?.total ?? 0
  } catch (e) {
    console.error('加载推送日志失败', e)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
onActivated(() => loadData())
</script>

<style scoped>
.page-container { padding: 0; }
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 18px; font-weight: 700; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); }
.page-subtitle { font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent); margin-top: 2px; }
.filter-bar {
  display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
  align-items: center;
}
.text-normal { color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent); font-size: 12px; }
</style>
