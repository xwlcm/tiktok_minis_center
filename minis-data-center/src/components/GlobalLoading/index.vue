<template>
  <Teleport to="body">
    <div v-if="loadingStore.active || leaving" class="tiktok-bar-wrap">
      <div
        class="tiktok-bar"
        :class="{ 'tiktok-bar--complete': loadingStore.progress >= 100 }"
        :style="{
          width: loadingStore.progress + '%',
          opacity: leaving ? 0 : 1,
        }"
      ></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLoadingStore } from '@/stores/loading.ts'

const loadingStore = useLoadingStore()
const leaving = ref(false)

watch(() => loadingStore.progress, (val) => {
  if (val >= 100) {
    leaving.value = true
    setTimeout(() => { leaving.value = false }, 300)
  }
})
</script>

<style scoped>
.tiktok-bar-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 9999;
  pointer-events: none;
}

.tiktok-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    #4c9de4 0%,
    #4c9de4 50%,
    #4c9de4 100%
  );
  background-size: 200% 100%;
  animation: tiktok-shimmer 1.2s linear infinite;
  border-radius: 0 2px 2px 0;
  box-shadow:
    0 0 8px rgba(76, 157, 228, 0.5),
    0 0 16px rgba(76, 157, 228, 0.3);
  transition:
    width 0.1s linear,
    opacity 0.25s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;
}

.tiktok-bar--complete {
  background: #4c9de4;
  box-shadow:
    0 0 12px rgba(76, 157, 228, 0.6),
    0 0 24px rgba(76, 157, 228, 0.3);
  animation: none;
}

@keyframes tiktok-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
