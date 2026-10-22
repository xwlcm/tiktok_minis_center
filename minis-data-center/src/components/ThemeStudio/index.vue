<template>
  <button
    type="button"
    class="theme-trigger"
    title="更换风格"
    @click="open = true"
  >
    <IconPalette />
    <span class="theme-trigger-text">风格</span>
    <span class="theme-trigger-dot" :style="{ background: themeStore.bg }" />
  </button>

  <Teleport to="body">
    <transition name="ts-fade">
      <div v-if="open" class="ts-mask" @click.self="open = false">
        <aside class="ts-panel" role="dialog" aria-label="更换风格">
          <div class="ts-hero" :style="{ background: currentSwatch }" />

          <header class="ts-head">
            <div class="ts-head-text">
              <h3 class="ts-title">空间风格</h3>
              <p class="ts-sub">配色仅保存在当前账号，换号互不影响</p>
            </div>
            <button type="button" class="ts-close" aria-label="关闭" @click="open = false">
              <IconClose />
            </button>
          </header>

          <section class="ts-section">
            <div class="ts-label">
              背景色
              <em>{{ currentBgName }}</em>
            </div>
            <div class="ts-group">
              <span class="ts-group-title">深色系 <em>{{ darkBg.length }}</em></span>
              <div class="ts-grid">
                <button
                  v-for="item in darkBg"
                  :key="item.id"
                  type="button"
                  class="ts-swatch"
                  :class="{ 'ts-swatch--active': item.color === themeStore.bg }"
                  @click="themeStore.setBg(item.color)"
                >
                  <span class="ts-swatch-chip" :style="{ background: item.swatch }">
                    <IconCheck v-if="item.color === themeStore.bg" />
                  </span>
                  <span class="ts-swatch-name">{{ item.name }}</span>
                  <span v-if="item.tip" class="ts-swatch-tip">{{ item.tip }}</span>
                </button>
              </div>
            </div>

            <div class="ts-group">
              <span class="ts-group-title">浅色系 <em>{{ lightBg.length }}</em></span>
              <div class="ts-grid">
                <button
                  v-for="item in lightBg"
                  :key="item.id"
                  type="button"
                  class="ts-swatch"
                  :class="{ 'ts-swatch--active': item.color === themeStore.bg }"
                  @click="themeStore.setBg(item.color)"
                >
                  <span class="ts-swatch-chip" :style="{ background: item.swatch }">
                    <IconCheck v-if="item.color === themeStore.bg" />
                  </span>
                  <span class="ts-swatch-name">{{ item.name }}</span>
                  <span v-if="item.tip" class="ts-swatch-tip">{{ item.tip }}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="ts-section">
            <div class="ts-label">
              文字色
              <em>{{ currentTextName }}</em>
            </div>
            <span class="ts-group-title">浅色字 <em>{{ lightText.length }}</em></span>
            <div class="ts-dots">
              <button
                v-for="item in lightText"
                :key="item.id"
                type="button"
                class="ts-dot"
                :class="{ 'ts-dot--active': item.color === themeStore.text }"
                :style="{ background: item.color }"
                :title="item.name"
                @click="themeStore.setText(item.color)"
              >
                <IconCheck v-if="item.color === themeStore.text" />
              </button>
            </div>
            <span class="ts-group-title">深色字 <em>{{ darkText.length }}</em></span>
            <div class="ts-dots">
              <button
                v-for="item in darkText"
                :key="item.id"
                type="button"
                class="ts-dot"
                :class="{ 'ts-dot--active': item.color === themeStore.text }"
                :style="{ background: item.color }"
                :title="item.name"
                @click="themeStore.setText(item.color)"
              >
                <IconCheck v-if="item.color === themeStore.text" />
              </button>
            </div>
            <p v-if="ratio < 3" class="ts-warn">
              当前对比度约 {{ ratio.toFixed(1) }}:1，文字可能不易辨读，建议换一组搭配
            </p>
          </section>

          <section class="ts-section">
            <div class="ts-label">预览</div>
            <div class="ts-preview">
              <div class="ts-preview-card">
                <div class="ts-preview-head">
                  <span>示例卡片</span>
                  <span class="ts-preview-tag">Tag</span>
                </div>
                <p class="ts-preview-main">正文文字 Aa 123</p>
                <p class="ts-preview-sub">次要说明文字，用于描述字段与提示</p>
                <div class="ts-preview-actions">
                  <span class="ts-preview-btn">主按钮</span>
                  <span class="ts-preview-ghost">次按钮</span>
                </div>
              </div>
            </div>
          </section>

          <footer class="ts-foot">
            <span class="ts-account">{{ accountLabel }}</span>
            <button type="button" class="ts-reset" @click="themeStore.reset()">恢复默认</button>
          </footer>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconCheck, IconClose, IconPalette } from '@arco-design/web-vue/es/icon'
import {
  BG_SWATCHES,
  TEXT_SWATCHES,
  contrastRatio,
  luminance,
} from '@/config/themes.ts'
import { useThemeStore } from '@/stores/theme.ts'

const themeStore = useThemeStore()
const open = ref(false)

const currentBgName = computed(
  () => BG_SWATCHES.find(item => item.color === themeStore.bg)?.name ?? '自定义',
)
const currentTextName = computed(
  () => TEXT_SWATCHES.find(item => item.color === themeStore.text)?.name ?? '自定义',
)
const currentSwatch = computed(
  () => BG_SWATCHES.find(item => item.color === themeStore.bg)?.swatch ?? themeStore.bg,
)
const ratio = computed(() => contrastRatio(themeStore.bg, themeStore.text))
const darkBg = computed(() => BG_SWATCHES.filter(item => item.tone === 'dark'))
const lightBg = computed(() => BG_SWATCHES.filter(item => item.tone === 'light'))
const lightText = computed(() => TEXT_SWATCHES.filter(item => luminance(item.color) > 0.45))
const darkText = computed(() => TEXT_SWATCHES.filter(item => luminance(item.color) <= 0.45))
const accountLabel = computed(() =>
  themeStore.userId === null ? '未登录 · 访客配色' : `账号 #${themeStore.userId} · 独立配色`,
)

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})
</script>

<style scoped>
.theme-trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 15%, transparent);
  border-radius: 9px;
  background: var(--mc-bg-card);
  color: color-mix(in srgb, var(--mc-text-primary) 62%, transparent);
  font-size: 12px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
  flex-shrink: 0;
}
.theme-trigger:hover {
  border-color: var(--mc-border-accent);
  background: color-mix(in srgb, var(--mc-primary) 8%, transparent);
  color: var(--mc-primary);
}
.theme-trigger-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mc-text-primary) 30%, transparent);
}

/* ── 抽屉 ─────────────────────────────────────────────── */
.ts-mask {
  position: fixed;
  inset: 0;
  z-index: 520;
  display: flex;
  justify-content: flex-end;
  background: rgba(4, 10, 18, 0.5);
  backdrop-filter: blur(3px);
}
.ts-panel {
  position: relative;
  width: min(420px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 22px 20px;
  overflow-y: auto;
  background: var(--mc-bg-card);
  border-left: 1px solid var(--mc-border);
  box-shadow: -24px 0 70px rgba(0, 0, 0, 0.42);
  animation: ts-slide 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ts-slide {
  from { transform: translateX(28px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.ts-hero {
  height: 92px;
  margin: 0 -22px;
  background-size: 200% 200%;
  animation: ts-aurora 9s ease-in-out infinite alternate;
}
@keyframes ts-aurora {
  0% { background-position: 0% 30%; }
  100% { background-position: 100% 70%; }
}

.ts-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: -46px;
}
.ts-head-text { flex: 1; min-width: 0; }
.ts-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
  letter-spacing: 0.01em;
}
.ts-sub {
  margin: 0;
  font-size: 11.5px;
  color: var(--mc-text-secondary);
}
.ts-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--mc-border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--mc-bg-card) 88%, transparent);
  color: var(--mc-text-secondary);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: color 0.16s ease, border-color 0.16s ease;
}
.ts-close:hover { color: var(--mc-text-primary); border-color: var(--mc-border-strong); }

.ts-section { display: flex; flex-direction: column; gap: 10px; }
.ts-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--mc-text-primary);
  letter-spacing: 0.02em;
}
.ts-label em {
  font-style: normal;
  font-weight: 500;
  font-size: 11px;
  color: var(--mc-text-tertiary);
}

/* 背景色块 */
.ts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.ts-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ts-group + .ts-group { margin-top: 4px; }
.ts-group-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--mc-text-tertiary);
  letter-spacing: 0.06em;
}
.ts-group-title em {
  font-style: normal;
  padding: 0 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--mc-text-primary) 8%, transparent);
  font-weight: 500;
  font-size: 9.5px;
}
.ts-swatch {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
}
.ts-swatch-chip {
  position: relative;
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 4px 12px rgba(0, 0, 0, 0.18);
  transition: transform 0.18s var(--mc-ease-spring), box-shadow 0.18s ease;
}
.ts-swatch-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 46%);
  pointer-events: none;
}
.ts-swatch:hover .ts-swatch-chip {
  transform: translateY(-3px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.24),
    0 10px 22px rgba(0, 0, 0, 0.26);
}
.ts-swatch--active .ts-swatch-chip {
  box-shadow:
    0 0 0 2px var(--mc-bg-card),
    0 0 0 4px var(--mc-primary),
    0 10px 22px rgba(0, 0, 0, 0.24);
}
.ts-swatch-chip :deep(svg) {
  position: relative;
  z-index: 1;
  font-size: 15px;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45));
}
.ts-swatch-name {
  font-size: 10.5px;
  color: var(--mc-text-secondary);
  line-height: 1;
}
.ts-swatch--active .ts-swatch-name { color: var(--mc-text-primary); font-weight: 600; }
.ts-swatch-tip {
  position: absolute;
  top: 4px;
  right: 5px;
  z-index: 2;
  padding: 1px 5px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.34);
  color: #fff;
  font-size: 9px;
  line-height: 1.5;
  backdrop-filter: blur(4px);
}

/* 文字色点 */
.ts-dots {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
}
.ts-dot {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.62);
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.16),
    0 2px 6px rgba(0, 0, 0, 0.16);
  transition: transform 0.16s var(--mc-ease-spring);
}
.ts-dot:hover { transform: scale(1.12); }
.ts-dot--active {
  box-shadow:
    0 0 0 2px var(--mc-bg-card),
    0 0 0 4px var(--mc-primary);
}
.ts-dot :deep(svg) { font-size: 12px; }

.ts-warn {
  margin: 0;
  padding: 8px 10px;
  border-radius: 9px;
  background: var(--mc-warning-light);
  border: 1px solid color-mix(in srgb, var(--mc-warning) 30%, transparent);
  color: var(--mc-warning);
  font-size: 11px;
  line-height: 1.5;
}

/* 预览 */
.ts-preview {
  padding: 14px;
  border-radius: 14px;
  background: var(--mc-bg-page);
  border: 1px solid var(--mc-border);
}
.ts-preview-card {
  padding: 14px;
  border-radius: 12px;
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  box-shadow: var(--mc-shadow-sm);
}
.ts-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--mc-text-tertiary);
}
.ts-preview-tag {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--mc-primary-light);
  color: var(--mc-primary);
  font-size: 10px;
}
.ts-preview-main {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text-primary);
}
.ts-preview-sub {
  margin: 0 0 12px;
  font-size: 11.5px;
  color: var(--mc-text-secondary);
}
.ts-preview-actions { display: flex; gap: 8px; }
.ts-preview-btn,
.ts-preview-ghost {
  padding: 4px 12px;
  border-radius: 7px;
  font-size: 11px;
}
.ts-preview-btn {
  background: var(--mc-primary);
  color: #fff;
}
.ts-preview-ghost {
  border: 1px solid var(--mc-border-strong);
  color: var(--mc-text-secondary);
}

.ts-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--mc-border);
}
.ts-account {
  font-size: 11px;
  color: var(--mc-text-tertiary);
}
.ts-reset {
  padding: 6px 12px;
  border: 1px solid var(--mc-border);
  border-radius: 8px;
  background: transparent;
  color: var(--mc-text-secondary);
  font-size: 11.5px;
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease;
}
.ts-reset:hover { color: var(--mc-text-primary); border-color: var(--mc-border-strong); }

@media (max-width: 768px) {
  .theme-trigger-text { display: none; }
  .theme-trigger { padding: 0 8px; }
  .ts-panel { padding: 0 16px 16px; }
  .ts-hero { margin: 0 -16px; height: 76px; }
  .ts-dots { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; }
}
</style>
