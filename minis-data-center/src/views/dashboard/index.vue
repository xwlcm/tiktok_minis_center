<template>
  <div class="dashboard">
    <div class="dash-header">
      <div class="dash-header-left">
        <h1 class="dash-title">仪表盘</h1>
        <div class="dash-app-badge">
          <span class="dash-app-dot" ></span>
          {{ appStore.currentApp?.appName ?? '—' }}
        </div>
        <div class="dash-type-badge" :class="'dash-type-badge--' + (appStore.currentApp?.appType || 'IAA').toLowerCase()">
          {{ appTypeLabel }}
        </div>
      </div>
      <div class="dash-header-right">
        <div class="dash-live-badge">
          <span class="dash-live-dot" ></span>
          实时数据
        </div>
      </div>
    </div>

    <a-spin :loading="loading" style="width: 100%" dot>
      <div class="dashboard-body">
        <section>
          <div class="section-label">
            <span class="section-label-line" ></span>
            核心指标
          </div>
          <MetricsGrid :data="dashboardData" :app-type="appStore.currentApp?.appType || 'IAA'" />
        </section>

        <section>
          <TrendChart
            :trend-data="dashboardData?.dauTrend ?? []"
            :app-type="appStore.currentApp?.appType || 'IAA'"
            @range-change="handleRangeChange"
          />
        </section>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Dashboard' })
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useAppStore } from '@/stores/app.ts'
import { fetchDashboard } from '@/api/dashboard.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'
import MetricsGrid from './components/MetricsGrid.vue'
import TrendChart from './components/TrendChart.vue'
import type { DashboardData } from '@/types/dashboard.ts'

const appStore = useAppStore()
const loading = ref(false)
const dashboardData = ref<DashboardData | null>(null)
const [defaultStartDate, defaultEndDate] = yesterdayTodayRange()
const dateRange = ref({ startDate: defaultStartDate, endDate: defaultEndDate })
let loadTimer: ReturnType<typeof setTimeout> | null = null
let lastLoadedKey = ''

const appTypeLabel = computed(() => {
  const type = appStore.currentApp?.appType || 'IAA'
  const map: Record<string, string> = { IAA: 'IAA', IAP: 'IAP', IAA_IAP: 'IAA + IAP' }
  return map[type] || type
})

async function loadDashboard() {
  const key = appStore.currentClientKey
  if (!key) return
  loading.value = true
  try {
    const [fallbackStartDate, fallbackEndDate] = yesterdayTodayRange()
    dashboardData.value = await fetchDashboard({
      startDate: dateRange.value.startDate || fallbackStartDate,
      endDate: dateRange.value.endDate || fallbackEndDate,
    })
    lastLoadedKey = key
  } catch {
    if (lastLoadedKey !== key) {
      dashboardData.value = null
    }
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  if (loadTimer) clearTimeout(loadTimer)
  loadTimer = setTimeout(loadDashboard, 300)
}

function handleRangeChange(range: { startDate: string; endDate: string }) {
  dateRange.value = range
  loadDashboard()
}

watch(() => appStore.currentClientKey, debouncedLoad)
onMounted(loadDashboard)
onUnmounted(() => {
  if (loadTimer) clearTimeout(loadTimer)
})
</script>

<style scoped>
.dashboard {
  width: 100%;
  min-width: 320px;
  max-width: 100%;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 12px;
}
.dash-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.dash-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  letter-spacing: -0.5px;
}

@media (max-width: 640px) {
  .dash-title {
    font-size: 18px;
  }
}

.dash-app-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(76, 157, 228, 0.06);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 21%, transparent);
  border-radius: 20px;
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 83%, transparent);
}
.dash-app-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #2FBF87;
  box-shadow: 0 0 6px rgba(54, 211, 153,0.6);
}

.dash-type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.dash-type-badge--iaa {
  background: rgba(76, 157, 228, 0.12);
  color: #4c9de4;
  border: 1px solid rgba(124, 195, 240, 0.31);
}
.dash-type-badge--iap {
  background: rgba(240, 160, 64, 0.12);
  color: #E5A046;
  border: 1px solid rgba(240, 160, 64, 0.25);
}
.dash-type-badge--iaa_iap {
  background: rgba(224, 87, 110, 0.12);
  color: #F2748A;
  border: 1px solid rgba(224, 87, 110, 0.25);
}

.dash-live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(224, 87, 110,0.08);
  border: 1px solid rgba(224, 87, 110,0.2);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #F2748A;
  letter-spacing: 0.3px;
}
.dash-live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #4c9de4;
  box-shadow: 0 0 6px rgba(76, 157, 228, 0.8);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}
.section-label-line {
  display: inline-block;
  width: 3px; height: 12px;
  border-radius: 2px;
  background: #4c9de4;
  box-shadow: 0 0 8px rgba(76, 157, 228, 0.6);
}

.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

@media (max-width: 768px) {
  .dashboard-body {
    gap: 20px;
  }
  .dash-header {
    margin-bottom: 20px;
  }
}
</style>
