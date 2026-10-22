<template>
  <Transition name="batch-bar">
    <div v-if="visible && count > 0" class="batch-action-bar">
      <div class="batch-bar-gradient"></div>
      <div class="batch-bar-content">
        <span class="batch-bar-count">
          已选 <strong>{{ count }}</strong> 项
        </span>
        <div class="batch-bar-actions">
          <slot></slot>
        </div>
        <a-button type="text" size="mini" @click="$emit('clear')">
          取消选择
        </a-button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  count: number
}>()

defineEmits<{
  clear: []
}>()
</script>

<style scoped>
.batch-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--mc-bg-elevated);
  border-top: 1px solid var(--mc-border);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6);
}

.batch-bar-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--mc-gradient-brand);
}

.batch-bar-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.batch-bar-count {
  font-size: 13px;
  color: var(--mc-text-secondary);
  white-space: nowrap;
}

.batch-bar-count strong {
  color: #4c9de4;
  font-weight: 700;
}

.batch-bar-actions {
  display: flex;
  gap: 8px;
  flex: 1;
}

.batch-bar-enter-active {
  animation: batchBarIn 0.3s var(--mc-ease-out) both;
}

.batch-bar-leave-active {
  animation: batchBarOut 0.2s var(--mc-ease-in) both;
}

@keyframes batchBarIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes batchBarOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
