<template>
  <div class="skeleton" :class="{ 'skeleton--animate': animate }">
    <slot>
      <div v-if="type === 'table'" class="skeleton-table">
        <div class="skeleton-toolbar">
          <div class="skeleton-rect" style="width: 200px; height: 32px" ></div>
          <div class="skeleton-rect" style="width: 100px; height: 32px" ></div>
        </div>
        <div class="skeleton-table-header">
          <div v-for="i in columns" :key="i" class="skeleton-rect" :style="{ flex: 1, height: '14px' }" ></div>
        </div>
        <div v-for="row in rows" :key="row" class="skeleton-table-row">
          <div v-for="i in columns" :key="i" class="skeleton-rect" :style="{ flex: 1, height: '14px' }" ></div>
        </div>
      </div>

      <div v-else-if="type === 'card'" class="skeleton-card">
        <div class="skeleton-rect" style="width: 60%; height: 20px; margin-bottom: 16px" ></div>
        <div class="skeleton-rect" style="width: 100%; height: 14px; margin-bottom: 10px" ></div>
        <div class="skeleton-rect" style="width: 80%; height: 14px; margin-bottom: 10px" ></div>
        <div class="skeleton-rect" style="width: 45%; height: 14px" ></div>
      </div>

      <div v-else-if="type === 'stats'" class="skeleton-stats">
        <div v-for="i in 4" :key="i" class="skeleton-stat-item">
          <div class="skeleton-rect" style="width: 60%; height: 12px; margin-bottom: 8px" ></div>
          <div class="skeleton-rect" style="width: 40%; height: 24px" ></div>
        </div>
      </div>

      <div v-else class="skeleton-lines">
        <div v-for="i in rows" :key="i" class="skeleton-rect" :style="{ width: i === rows ? '60%' : '100%', height: '14px', marginBottom: '12px' }" ></div>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'table' | 'card' | 'stats' | 'lines'
  rows?: number
  columns?: number
  animate?: boolean
}>(), {
  type: 'table',
  rows: 6,
  columns: 5,
  animate: true,
})
</script>

<style scoped>
.skeleton {
  padding: 20px;
}

.skeleton-rect {
  background: rgba(76, 157, 228, 0.07);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.skeleton--animate .skeleton-rect::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    color-mix(in srgb, var(--mc-text-primary) 14%, transparent) 40%,
    rgba(76, 157, 228, 0.03) 60%,
    transparent 100%
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}

.skeleton-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.skeleton-table-header {
  display: flex;
  gap: 16px;
  padding: 14px 16px;
  background: rgba(76, 157, 228, 0.04);
  border-radius: 8px 8px 0 0;
  margin-bottom: 2px;
}

.skeleton-table-row {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 11%, transparent);
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-card {
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  border-radius: 12px;
  padding: 24px;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-stat-item {
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
  border-radius: 12px;
  padding: 20px;
}

.skeleton-lines {
  padding: 8px 0;
}
</style>
