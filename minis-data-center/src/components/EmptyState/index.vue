<template>
  <div class="empty-state" :style="style">
    <div class="empty-icon">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="14" width="56" height="36" rx="4" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
        <rect x="4" y="18" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="4" y="29" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="4" y="40" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="52" y="18" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="52" y="29" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="52" y="40" width="8" height="6" rx="1" fill="currentColor" opacity="0.35"/>
        <rect x="16" y="19" width="32" height="26" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.4"/>
        <path d="M28 25 L28 39 L40 32 Z" fill="currentColor" opacity="0.5"/>
        <line x1="20" y1="52" x2="44" y2="52" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.2"/>
        <line x1="26" y1="56" x2="38" y2="56" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.12"/>
      </svg>
    </div>
    <div class="empty-desc">{{ description }}</div>
    <div v-if="ctaText" class="empty-cta">
      <a-button type="primary" size="small" @click="$emit('cta-click')">
        {{ ctaText }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string
  style?: string | Record<string, string>
  ctaText?: string
}>()

defineEmits<{
  'cta-click': []
}>()
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
}

.empty-icon {
  color: rgba(22, 41, 63, 0.27);
  line-height: 0;
  animation: empty-breathe 3s ease-in-out infinite;
}

@keyframes empty-breathe {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
}

.empty-desc {
  font-size: 13px;
  color: rgba(22, 41, 63, 0.41);
}

.empty-cta {
  margin-top: 8px;
}
</style>
