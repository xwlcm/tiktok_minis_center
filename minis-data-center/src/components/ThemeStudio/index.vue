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
              动态背景
              <em>{{ currentMotionName }}</em>
            </div>
            <div class="ts-motions">
              <button
                v-for="item in MOTION_PRESETS"
                :key="item.id"
                type="button"
                class="ts-motion"
                :class="{ 'ts-motion--active': themeStore.motion === item.id }"
                @click="themeStore.setMotion(item.id)"
              >
                <span class="ts-motion-preview" :class="`ts-motion-preview--${item.id}`">
                  <i /><i /><i />
                </span>
                <span class="ts-motion-name">{{ item.name }}</span>
                <span class="ts-motion-tip">{{ item.tip }}</span>
              </button>
            </div>
            <p class="ts-motion-hint">
              动画只铺在背景层，不遮挡内容；颜色跟随背景与主色自动变化，低配设备建议选「无」。
            </p>
          </section>

          <section class="ts-section">
            <div class="ts-label">
              背景壁纸
              <em>{{ themeStore.wallpaper ? '已启用' : '未设置' }}</em>
            </div>
            <div class="ts-wall-search">
              <a-input
                v-model="wallpaperKeyword"
                size="small"
                placeholder="搜索全网壁纸：星空 / 极光 / 波纹…"
                allow-clear
                @press-enter="runWallpaperSearch()"
              />
              <a-button type="primary" size="small" :loading="wallpaperLoading" @click="runWallpaperSearch()">
                搜索
              </a-button>
            </div>
            <div class="ts-wall-tags">
              <button
                v-for="tag in WALLPAPER_TAGS"
                :key="tag"
                type="button"
                class="ts-wall-tag"
                @click="runWallpaperSearch(tag)"
              >
                {{ tag }}
              </button>
            </div>

            <div v-if="wallpaperLoading" class="ts-wall-loading">正在搜索壁纸，请稍候…</div>
            <div v-else-if="wallpaperResults.length" class="ts-wall-grid">
              <button
                v-for="item in wallpaperResults"
                :key="item.id"
                type="button"
                class="ts-wall-item"
                :disabled="Boolean(applyingId)"
                @click="useWallpaper(item)"
              >
                <img :src="item.thumb" alt="" loading="lazy" referrerpolicy="no-referrer" />
                <span v-if="applyingId === item.id" class="ts-wall-badge">应用中…</span>
                <span v-else class="ts-wall-badge">一键使用</span>
                <span class="ts-wall-size">{{ item.width }}×{{ item.height }}</span>
              </button>
            </div>
            <p v-else-if="wallpaperSearched" class="ts-wall-empty">没有找到合适的横图，换个关键词试试</p>

            <div v-if="themeStore.wallpaper" class="ts-wall-current">
              <div class="ts-wall-current-head">
                <img :src="themeStore.wallpaper.url" alt="" referrerpolicy="no-referrer" />
                <div class="ts-wall-current-meta">
                  <p class="ts-wall-current-title">{{ themeStore.wallpaper.title || '当前壁纸' }}</p>
                  <p class="ts-wall-current-sub">已下载并转存，换设备登录同样生效</p>
                </div>
                <button type="button" class="ts-wall-remove" @click="removeWallpaper">移除</button>
              </div>
              <div class="ts-wall-row">
                <span class="ts-wall-row-label">遮罩</span>
                <a-slider
                  class="ts-wall-slider"
                  :model-value="maskDraft"
                  :min="0"
                  :max="80"
                  :step="2"
                  @change="onMaskInput"
                  @change-end="onMaskEnd"
                />
                <span class="ts-wall-row-value">{{ maskDraft }}%</span>
              </div>
              <div class="ts-wall-row">
                <span class="ts-wall-row-label">动效</span>
                <a-radio-group
                  :model-value="themeStore.wallpaper.motion"
                  type="button"
                  size="mini"
                  @change="onMotionChange"
                >
                  <a-radio value="none">静止</a-radio>
                  <a-radio value="kenburns">缓慢缩放</a-radio>
                  <a-radio value="float">漂浮</a-radio>
                </a-radio-group>
              </div>
              <p class="ts-wall-hint">壁纸自动等比铺满窗口；遮罩越高文字越清晰。</p>
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
import { Message } from '@arco-design/web-vue'
import { IconCheck, IconClose, IconPalette } from '@arco-design/web-vue/es/icon'
import {
  BG_SWATCHES,
  MOTION_PRESETS,
  TEXT_SWATCHES,
  contrastRatio,
  luminance,
} from '@/config/themes.ts'
import {
  applyWallpaper as applyWallpaperApi,
  loadWallpaperBlob,
  removeWallpaper as removeWallpaperApi,
  searchWallpaper,
  updateWallpaperConfig,
  type WallpaperItem,
  type WallpaperMotion,
} from '@/api/wallpaper.ts'
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
const currentMotionName = computed(
  () => MOTION_PRESETS.find(item => item.id === themeStore.motion)?.name ?? '无',
)
const ratio = computed(() => contrastRatio(themeStore.bg, themeStore.text))
const darkBg = computed(() => BG_SWATCHES.filter(item => item.tone === 'dark'))
const lightBg = computed(() => BG_SWATCHES.filter(item => item.tone === 'light'))
const lightText = computed(() => TEXT_SWATCHES.filter(item => luminance(item.color) > 0.45))
const darkText = computed(() => TEXT_SWATCHES.filter(item => luminance(item.color) <= 0.45))
const accountLabel = computed(() =>
  themeStore.userId === null ? '未登录 · 访客配色' : `账号 #${themeStore.userId} · 独立配色`,
)

/* ── 背景壁纸：全网搜索 + 一键下载应用 ─────────────── */
const WALLPAPER_TAGS = ['唯美壁纸', '极光', '星空', '波纹', '赛博朋克', '山川', '海洋']
const wallpaperKeyword = ref('唯美壁纸')
const wallpaperResults = ref<WallpaperItem[]>([])
const wallpaperLoading = ref(false)
const wallpaperSearched = ref(false)
const applyingId = ref('')
const maskDraft = ref(32)

async function runWallpaperSearch(keyword?: string) {
  if (keyword) wallpaperKeyword.value = keyword
  const word = wallpaperKeyword.value.trim()
  if (!word || wallpaperLoading.value) return
  wallpaperLoading.value = true
  try {
    wallpaperResults.value = await searchWallpaper(word)
    wallpaperSearched.value = true
  } catch {
    wallpaperResults.value = []
  } finally {
    wallpaperLoading.value = false
  }
}

async function useWallpaper(item: WallpaperItem) {
  if (applyingId.value) return
  applyingId.value = item.id
  try {
    // 服务端下载原图并存入数据库，再把图片读回来转成 blob 地址展示
    const config = await applyWallpaperApi(item)
    try {
      config.url = await loadWallpaperBlob()
    } catch {
      // 读取失败时直接用外部原图地址兜底，仍然能看到背景
      config.url = item.original
    }
    themeStore.setWallpaper(config)
    maskDraft.value = config.mask ?? 32
    Message.success('壁纸已应用')
  } catch {
    // 请求层已统一提示错误
  } finally {
    applyingId.value = ''
  }
}

function readSliderValue(value: number | number[]) {
  return Array.isArray(value) ? value[0] : value
}

function onMaskInput(value: number | number[]) {
  const next = readSliderValue(value)
  maskDraft.value = next
  themeStore.patchWallpaper({ mask: next })
}

async function onMaskEnd(value: number | number[]) {
  const next = readSliderValue(value)
  try {
    const config = await updateWallpaperConfig(next, themeStore.wallpaper?.motion ?? 'kenburns')
    // 只同步服务端字段，保留本地图片地址
    themeStore.patchWallpaper({ mask: config.mask, motion: config.motion })
  } catch {
    // 保存失败时保留本地值，下次打开面板会重新同步
  }
}

async function onMotionChange(value: unknown) {
  const motion = value as WallpaperMotion
  themeStore.patchWallpaper({ motion })
  try {
    const config = await updateWallpaperConfig(themeStore.wallpaper?.mask ?? 32, motion)
    themeStore.patchWallpaper({ mask: config.mask, motion: config.motion })
  } catch {
    // 请求层已统一提示错误
  }
}

async function removeWallpaper() {
  try {
    await removeWallpaperApi()
    themeStore.clearWallpaper()
    Message.success('壁纸已移除')
  } catch {
    // 请求层已统一提示错误
  }
}

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) {
    maskDraft.value = themeStore.wallpaper?.mask ?? 32
    if (!wallpaperSearched.value) void runWallpaperSearch()
  }
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

/* ── 动态背景选择 ─────────────────────────────── */
.ts-motions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.ts-motion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 4px 6px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--mc-bg-card) 72%, transparent);
  color: color-mix(in srgb, var(--mc-text-primary) 78%, transparent);
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.ts-motion:hover { border-color: color-mix(in srgb, var(--mc-primary) 45%, transparent); }
.ts-motion--active {
  border-color: var(--mc-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mc-primary) 22%, transparent);
}
.ts-motion-preview {
  position: relative;
  display: block;
  width: 100%;
  height: 38px;
  overflow: hidden;
  border-radius: 7px;
  background: var(--mc-bg-page);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 8%, transparent);
}
.ts-motion-preview i {
  position: absolute;
  display: none;
  border-radius: 50%;
  background: radial-gradient(circle, var(--mc-motion-1) 0%, transparent 70%);
}
.ts-motion-name { font-size: 11px; line-height: 1.3; }
.ts-motion-tip { font-size: 9.5px; opacity: 0.55; line-height: 1.2; }
.ts-motion-hint {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--mc-text-primary) 42%, transparent);
}

/* ── 背景壁纸 ───────────────────────────────── */
.ts-wall-search { display: flex; align-items: center; gap: 8px; }
.ts-wall-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ts-wall-tag {
  height: 22px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 14%, transparent);
  border-radius: 999px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 60%, transparent);
  font-size: 10.5px;
  font-family: var(--mc-font-family);
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease;
}
.ts-wall-tag:hover { border-color: var(--mc-primary); color: var(--mc-primary); }
.ts-wall-loading,
.ts-wall-empty {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: color-mix(in srgb, var(--mc-text-primary) 42%, transparent);
}
.ts-wall-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.ts-wall-item {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 12%, transparent);
  border-radius: 8px;
  background: var(--mc-bg-sunken);
  cursor: pointer;
}
.ts-wall-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
}
.ts-wall-item:hover img { transform: scale(1.06); }
.ts-wall-item:disabled { cursor: progress; opacity: 0.75; }
.ts-wall-badge {
  position: absolute;
  inset: auto 0 0 0;
  padding: 3px 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.58), transparent);
  color: #fff;
  font-size: 10px;
  line-height: 1.4;
  text-align: center;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.ts-wall-item:hover .ts-wall-badge,
.ts-wall-item:disabled .ts-wall-badge { opacity: 1; }
.ts-wall-size {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.42);
  color: #fff;
  font-size: 9px;
  line-height: 1.4;
}
.ts-wall-current {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 12%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--mc-bg-card) 72%, transparent);
}
.ts-wall-current-head { display: flex; align-items: center; gap: 8px; }
.ts-wall-current-head img {
  flex-shrink: 0;
  width: 52px;
  height: 34px;
  border-radius: 6px;
  object-fit: cover;
}
.ts-wall-current-meta { flex: 1; min-width: 0; }
.ts-wall-current-title {
  margin: 0;
  overflow: hidden;
  color: var(--mc-text-primary);
  font-size: 11.5px;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ts-wall-current-sub {
  margin: 2px 0 0;
  color: color-mix(in srgb, var(--mc-text-primary) 45%, transparent);
  font-size: 9.5px;
  line-height: 1.4;
}
.ts-wall-remove {
  height: 22px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 16%, transparent);
  border-radius: 6px;
  background: transparent;
  color: color-mix(in srgb, var(--mc-text-primary) 62%, transparent);
  font-size: 10.5px;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease;
}
.ts-wall-remove:hover { border-color: #f2748a; color: #f2748a; }
.ts-wall-row { display: flex; align-items: center; gap: 8px; }
.ts-wall-row-label {
  flex-shrink: 0;
  width: 26px;
  color: color-mix(in srgb, var(--mc-text-primary) 55%, transparent);
  font-size: 10.5px;
}
.ts-wall-slider { flex: 1; }
.ts-wall-row-value {
  width: 30px;
  color: color-mix(in srgb, var(--mc-text-primary) 55%, transparent);
  font-size: 10px;
  text-align: right;
}
.ts-wall-hint {
  margin: 0;
  color: color-mix(in srgb, var(--mc-text-primary) 40%, transparent);
  font-size: 9.5px;
  line-height: 1.5;
}

/* 极光缩略图 */
.ts-motion-preview--aurora i:nth-child(1) {
  display: block;
  width: 70%;
  height: 90%;
  left: -12%;
  top: -25%;
  filter: blur(7px);
  animation: ts-drift 5s ease-in-out infinite alternate;
}
.ts-motion-preview--aurora i:nth-child(2) {
  display: block;
  width: 62%;
  height: 80%;
  right: -14%;
  top: -10%;
  background: radial-gradient(circle, var(--mc-motion-2) 0%, transparent 70%);
  filter: blur(7px);
  animation: ts-drift 6.5s ease-in-out infinite alternate-reverse;
}
/* 波纹缩略图 */
.ts-motion-preview--ripple i {
  display: block;
  left: 50%;
  top: 50%;
  width: 58%;
  height: 92%;
  margin: -46% 0 0 -29%;
  border: 1px solid color-mix(in srgb, var(--mc-motion-2) 65%, transparent);
  background: radial-gradient(circle, color-mix(in srgb, var(--mc-motion-1) 26%, transparent) 0%, transparent 70%);
  opacity: 0;
  animation: ts-ripple 3.6s ease-out infinite;
}
.ts-motion-preview--ripple i:nth-child(2) { animation-delay: 1.2s; }
.ts-motion-preview--ripple i:nth-child(3) { animation-delay: 2.4s; }
/* 星云缩略图 */
.ts-motion-preview--nebula i:nth-child(1) {
  display: block;
  inset: -50%;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--mc-motion-1) 60deg,
    transparent 150deg,
    var(--mc-motion-2) 240deg,
    transparent 360deg
  );
  filter: blur(6px);
  animation: ts-spin 9s linear infinite;
}
/* 流体缩略图 */
.ts-motion-preview--mesh i:nth-child(1) {
  display: block;
  width: 62%;
  height: 72%;
  left: -6%;
  top: -6%;
  filter: blur(6px);
  animation: ts-drift 4s ease-in-out infinite alternate;
}
.ts-motion-preview--mesh i:nth-child(2) {
  display: block;
  width: 58%;
  height: 66%;
  right: -8%;
  bottom: -8%;
  background: radial-gradient(circle, var(--mc-motion-2) 0%, transparent 70%);
  filter: blur(6px);
  animation: ts-drift 5s ease-in-out infinite alternate-reverse;
}
/* 赛博缩略图 */
.ts-motion-preview--scan i:nth-child(1) {
  display: block;
  inset: 0;
  border-radius: 0;
  background: repeating-linear-gradient(
    0deg,
    color-mix(in srgb, var(--mc-motion-1) 32%, transparent) 0 1px,
    transparent 1px 4px
  );
  background-size: 100% 24px;
  animation: ts-scan 4s linear infinite;
}
.ts-motion-preview--scan i:nth-child(2) {
  display: block;
  inset: 0;
  border-radius: 0;
  background: radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--mc-motion-2) 46%, transparent), transparent 72%);
  animation: ts-fade 3.5s ease-in-out infinite;
}
/* 呼吸缩略图 */
.ts-motion-preview--breathe i:nth-child(1) {
  display: block;
  inset: 8%;
  filter: blur(7px);
  animation: ts-breathe 4.2s ease-in-out infinite;
}

@keyframes ts-drift {
  from { transform: translate3d(-8%, -6%, 0) scale(1); }
  to { transform: translate3d(10%, 8%, 0) scale(1.2); }
}
@keyframes ts-ripple {
  0% { transform: scale(0.15); opacity: 0; }
  20% { opacity: 0.9; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes ts-spin {
  to { transform: rotate(360deg); }
}
@keyframes ts-scan {
  to { background-position: 0 24px; }
}
@keyframes ts-fade {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.72; }
}
@keyframes ts-breathe {
  0%, 100% { transform: scale(0.85); opacity: 0.4; }
  50% { transform: scale(1.12); opacity: 0.8; }
}
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
