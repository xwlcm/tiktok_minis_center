<template>
  <div class="app-logo" :class="[`app-logo--${size}`, { 'app-logo--collapsed': collapsed }]">
    <div class="app-logo__icon">
      <svg :width="iconSize" :height="iconSize" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 外框六边形 — 渐变填充 -->
        <path d="M16 3L28.66 9.5V22.5L16 29L3.34 22.5V9.5L16 3Z" fill="url(#logo-fill)" />
        <!-- 内部高光边缘 -->
        <path d="M16 5.5L26.16 10.75V21.25L16 26.5L5.84 21.25V10.75L16 5.5Z" fill="none" stroke="url(#logo-stroke)" stroke-width="0.6" opacity="0.4" />
        <!-- 中心 M 字母 — 品牌标识 -->
        <path d="M12 11L16 21L20 11" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <line x1="10.5" y1="15" x2="21.5" y2="15" stroke="white" stroke-width="1.4" stroke-linecap="round" opacity="0.7" />
        <defs>
          <linearGradient id="logo-fill" x1="3.34" y1="3" x2="28.66" y2="29" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7CC3F0" />
            <stop offset="0.5" stop-color="#4C9DE4" />
            <stop offset="1" stop-color="#3285CE" />
          </linearGradient>
          <linearGradient id="logo-stroke" x1="5.84" y1="5.5" x2="26.16" y2="26.5" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A8CCF0" />
            <stop offset="1" stop-color="#FFFFFF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <transition name="app-logo-fade">
      <div v-if="showText" class="app-logo__text">
        <span class="app-logo__name">{{ brandName }}</span>
        <span v-if="size !== 'xs' && size !== 'sm'" class="app-logo__sub">{{ brandSub }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg'
  collapsed?: boolean
  brandName?: string
  brandSub?: string
}>(), {
  size: 'md',
  collapsed: false,
  brandName: 'Minis',
  brandSub: '数据中台',
})

const iconSize = computed(() => {
  return { xs: 22, sm: 28, md: 32, lg: 40 }[props.size]
})

const showText = computed(() => !props.collapsed)
</script>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  white-space: nowrap;
}

.app-logo--xs { gap: 6px; }
.app-logo--sm { gap: 8px; }
.app-logo--md { gap: 10px; }
.app-logo--lg { gap: 12px; }

.app-logo--collapsed {
  justify-content: center;
}

.app-logo__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(76, 157, 228, 0.28));
}

.app-logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.app-logo__name {
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  letter-spacing: 0.2px;
}

.app-logo__sub {
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

/* ── 各尺寸字体 ── */
.app-logo--xs .app-logo__name { font-size: 11px; }
.app-logo--xs .app-logo__sub  { font-size: 8px; }

.app-logo--sm .app-logo__name { font-size: 13px; }
.app-logo--sm .app-logo__sub  { font-size: 9px; }

.app-logo--md .app-logo__name { font-size: 14px; }
.app-logo--md .app-logo__sub  { font-size: 10px; }

.app-logo--lg .app-logo__name { font-size: 18px; }
.app-logo--lg .app-logo__sub  { font-size: 11px; }

/* ── 过渡动画 ── */
.app-logo-fade-enter-active { transition: opacity 0.18s ease 0.05s; }
.app-logo-fade-leave-active { transition: opacity 0.12s ease; }
.app-logo-fade-enter-from,
.app-logo-fade-leave-to { opacity: 0; }
</style>
