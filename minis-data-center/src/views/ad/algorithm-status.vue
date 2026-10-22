<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">算法状态</div>
        <div class="page-subtitle">多臂老虎机算法运行状态与冷启动池监控</div>
      </div>
      <a-button size="small" @click="loadData">刷新</a-button>
    </div>

    <a-spin :loading="loading" class="w-full">
      <template v-if="status">
        <!-- 状态概览 -->
        <div class="status-cards">
          <div class="status-card">
            <span class="card-label">当前阶段</span>
            <a-tag :color="status.phase === 'COLD_START' ? 'orange' : 'green'" size="large">
              {{ status.phase === 'COLD_START' ? '冷启动期' : '正常期' }}
            </a-tag>
          </div>
          <div class="status-card">
            <span class="card-label">冷启动阈值</span>
            <span class="card-value">{{ status.coldStartThreshold }}</span>
          </div>
          <div class="status-card">
            <span class="card-label">当前 ε</span>
            <span class="card-value">{{ status.currentEpsilon }}</span>
          </div>
        </div>

        <!-- 冷启动池 -->
        <div v-if="status.coldStartAds.length > 0" class="section">
          <h3 class="section-title">冷启动池（需要更多曝光）</h3>
          <a-table :data="status.coldStartAds" :pagination="false" size="small" row-key="adId">
            <template #columns>
              <a-table-column title="广告名称" data-index="adName" />
              <a-table-column title="7D 曝光数" data-index="pushCount7d" align="right" />
            </template>
          </a-table>
        </div>

        <!-- TOP10 排行 -->
        <div class="section">
          <h3 class="section-title">TOP10 评分排行</h3>
          <a-table :data="status.top10" :pagination="false" size="small" row-key="adId">
            <template #columns>
              <a-table-column title="排名" :width="60" align="center">
                <template #cell="{ rowIndex }">
                  <a-tag v-if="rowIndex < 3" color="gold" size="small">{{ rowIndex + 1 }}</a-tag>
                  <span v-else>{{ rowIndex + 1 }}</span>
                </template>
              </a-table-column>
              <a-table-column title="广告名称" data-index="adName" />
              <a-table-column title="最终分数" :width="120" align="right">
                <template #cell="{ record }">
                  {{ record.finalScore != null ? Number(record.finalScore).toFixed(4) : '—' }}
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </template>

      <a-empty v-else description="暂无算法状态数据" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAlgorithmStatus } from '@/api/adAlgorithm.ts'
import type { AdAlgorithmStatusVo } from '@/types/adAlgorithm.ts'

const status = ref<AdAlgorithmStatusVo | null>(null)
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAlgorithmStatus()
    status.value = res ?? null
  } catch (e) {
    console.error('加载算法状态失败', e)
    status.value = null
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
.status-cards {
  display: flex; gap: 16px; margin-bottom: 24px;
}
.status-card {
  flex: 1; padding: 16px; border-radius: 8px;
  background: rgba(76, 157, 228, 0.04); border: 1px solid rgba(76, 157, 228, 0.09);
  display: flex; flex-direction: column; gap: 8px;
}
.card-label { font-size: 12px; color: color-mix(in srgb, var(--mc-text-primary) 74%, transparent); }
.card-value { font-size: 20px; font-weight: 600; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); }
.section { margin-bottom: 24px; }
.section-title { font-size: 14px; font-weight: 500; color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent); margin-bottom: 12px; }
.w-full { width: 100%; }
</style>
