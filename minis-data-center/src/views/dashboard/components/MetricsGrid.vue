<template>
  <div class="metrics-grid">
    <div
      v-for="metric in visibleMetrics"
      :key="metric.key"
      class="metric-card"
      :style="{ '--accent': metric.color, '--accent-rgb': metric.rgb }"
    >
      <div class="metric-top">
        <span class="metric-label">{{ metric.label }}</span>
        <div class="metric-icon">
          <component :is="metric.icon" />
        </div>
      </div>
      <div class="metric-value">{{ metric.display }}</div>
      <div class="metric-bottom">
        <span v-if="metric.suffix" class="metric-suffix">{{ metric.suffix }}</span>
        <div class="metric-bar" ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { DashboardData } from '@/types/dashboard.ts'
import {
  IconUserGroup,
  IconUserAdd,
  IconCalendar,
  IconThunderbolt,
  IconPlayCircle,
  IconEye,
  IconDesktop,
  IconCheckCircle,
  IconBarChart,
  IconLock,
} from '@arco-design/web-vue/es/icon'

const props = defineProps<{
  data: DashboardData | null
  appType: string
}>()

function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n.toLocaleString()
}

interface MetricDef {
  key: string
  label: string
  display: string
  suffix: string
  color: string
  rgb: string
  icon: Component
  category: 'common' | 'iaa' | 'iap'
}

const allMetrics = computed<MetricDef[]>(() => {
  if (!props.data) return []
  const d = props.data
  const adShowCount = d.adShowCount ?? 0
  const adCompleteCount = d.adCompleteCount ?? 0
  const adCompletionRate = adShowCount > 0
    ? (adCompleteCount / adShowCount * 100).toFixed(1) + '%'
    : '—'

  return [
    { key: 'dau',             label: 'DAU',         display: fmt(d.dau),              suffix: '',  color: '#4c9de4', rgb: '92,189,197',  icon: IconUserGroup,    category: 'common' },
    { key: 'mau',             label: 'MAU',         display: fmt(d.mau),              suffix: '',  color: '#2FBF87', rgb: '54,211,153',  icon: IconUserAdd,      category: 'common' },
    { key: 'newUsers',        label: '新增用户',     display: fmt(d.newUsers),          suffix: '',  color: '#3498DB', rgb: '52,152,219',  icon: IconCalendar,      category: 'common' },
    { key: 'totalLaunch',     label: '启动次数',     display: fmt(d.totalLaunchCount),  suffix: '',  color: '#93A6F0', rgb: '155,126,196', icon: IconThunderbolt,    category: 'common' },
    { key: 'completionRate',  label: '完播率',       display: d.completionRate != null ? Number(d.completionRate).toFixed(1) + '%' : '—', suffix: '', color: '#E5A046', rgb: '240,160,64', icon: IconPlayCircle, category: 'common' },
    { key: 'iaaUnlock',       label: 'IAA 解锁',    display: fmt(d.iaaUnlockCount),    suffix: '',  color: '#E8A0BF', rgb: '232,160,191', icon: IconEye,            category: 'iaa' },
    { key: 'adShow',          label: '广告展示',     display: fmt(adShowCount),         suffix: '',  color: '#7EC8E3', rgb: '126,200,227', icon: IconDesktop,        category: 'iaa' },
    { key: 'adComplete',      label: '广告完播',     display: fmt(adCompleteCount),     suffix: '',  color: '#C4A77D', rgb: '196,167,125', icon: IconCheckCircle,   category: 'iaa' },
    { key: 'adCompletionRate',label: '广告完播率',   display: adCompletionRate,         suffix: '',  color: '#D4A5A5', rgb: '212,165,165', icon: IconBarChart,     category: 'iaa' },
    { key: 'iapUnlock',       label: 'IAP 解锁',    display: fmt(d.iapUnlockCount),    suffix: '',  color: '#E5A046', rgb: '240,160,64',  icon: IconLock,           category: 'iap' },
    { key: 'iapRevenue',      label: 'IAP 收入',    display: '$' + ((d.iapRevenue ?? 0) / 100).toFixed(2), suffix: '', color: '#4c9de4', rgb: '224,72,109', icon: IconPlayCircle, category: 'iap' },
  ]
})

const visibleMetrics = computed(() => {
  const type = props.appType || 'IAA'
  return allMetrics.value.filter(m => {
    if (m.category === 'common') return true
    if (type === 'IAA_IAP') return true
    if (type === 'IAA' && m.category === 'iaa') return true
    if (type === 'IAP' && m.category === 'iap') return true
    return false
  })
})
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric-card {
  position: relative;
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 12px;
  padding: 18px 16px 14px;
  overflow: hidden;
  cursor: default;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}
.metric-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.6), transparent);
}
.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--accent-rgb), 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(var(--accent-rgb), 0.12);
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
.metric-icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  background: rgba(var(--accent-rgb), 0.12);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  color: var(--accent);
}

.metric-value {
  font-size: 26px;
  font-weight: 800;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  line-height: 1;
  letter-spacing: -0.5px;
  margin-bottom: 10px;
}

.metric-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-suffix {
  font-size: 11px;
  color: color-mix(in srgb, var(--mc-text-primary) 50%, transparent);
  font-weight: 500;
}
.metric-bar {
  height: 2px;
  width: 40%;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(var(--accent-rgb), 0.6), transparent);
}
</style>
