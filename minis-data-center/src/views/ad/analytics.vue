<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">算法分析</div>
        <div class="page-subtitle">广告效果分析与风险标签监控</div>
      </div>
      <div class="header-actions">
        <a-radio-group v-model="currentWindow" type="button" size="small" @change="loadData">
          <a-radio value="5M">5分钟</a-radio>
          <a-radio value="30M">30分钟</a-radio>
          <a-radio value="2H">2小时</a-radio>
          <a-radio value="24H">24小时</a-radio>
          <a-radio value="7D">7天</a-radio>
        </a-radio-group>
      </div>
    </div>

    <a-table
      :data="tableData"
      :loading="loading"
      :pagination="false"
      row-key="adId"
      stripe
    >
      <template #columns>
        <a-table-column title="广告名称" data-index="adName" :width="160" />
        <a-table-column title="曝光数" data-index="pushCount" :width="100" align="right" />
        <a-table-column title="完播数" data-index="completeCount" :width="100" align="right" />
        <a-table-column title="完播率" :width="100" align="right">
          <template #cell="{ record }">
            {{ ((record.completeRate ?? 0) * 100).toFixed(1) }}%
          </template>
        </a-table-column>
        <a-table-column title="解锁数" data-index="unlockCount" :width="100" align="right" />
        <a-table-column title="转化率" :width="100" align="right">
          <template #cell="{ record }">
            {{ (record.conversionRate * 100).toFixed(1) }}%
          </template>
        </a-table-column>
        <a-table-column title="最后曝光" :width="160">
          <template #cell="{ record }">
            {{ record.lastPushTime ?? '—' }}
          </template>
        </a-table-column>
        <a-table-column title="风险标签" :width="120">
          <template #cell="{ record }">
            <a-tag v-if="record.riskTag === '低效'" color="orangered" size="small">低效</a-tag>
            <a-tag v-else-if="record.riskTag === '刷量风险'" color="red" size="small">刷量风险</a-tag>
            <span v-else class="text-success">正常</span>
          </template>
        </a-table-column>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAdAnalytics } from '@/api/adAlgorithm.ts'
import type { AdAnalyticsVo } from '@/types/adAlgorithm.ts'

const currentWindow = ref('24H')
const tableData = ref<AdAnalyticsVo[]>([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAdAnalytics(currentWindow.value)
    tableData.value = res ?? []
  } catch (e) {
    console.error('加载广告效果数据失败', e)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.page-container { padding: 0; }
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 18px; font-weight: 700; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); }
.page-subtitle { font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent); margin-top: 2px; }
.text-success { color: #2FBF87; font-size: 12px; }
</style>
