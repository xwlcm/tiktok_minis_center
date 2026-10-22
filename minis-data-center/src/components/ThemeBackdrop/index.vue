<template>
  <div
    v-if="visible"
    class="backdrop"
    :class="`backdrop--${themeStore.motion}`"
    aria-hidden="true"
  >
    <!-- 壁纸素材：图片/GIF 用 img，动态视频用 video，均自动等比铺满窗口 -->
    <div v-if="wallpaper && displayUrl" class="bd-wall">
      <video
        v-if="isVideo"
        class="bd-wall-img"
        :src="displayUrl"
        autoplay
        muted
        loop
        playsinline
        @error="handleImageError"
      />
      <img
        v-else
        class="bd-wall-img"
        :class="`bd-wall-img--${wallpaper.motion}`"
        :src="displayUrl"
        alt=""
        referrerpolicy="no-referrer"
        @error="handleImageError"
      />
      <span class="bd-dim" :style="{ opacity: (wallpaper.mask ?? 32) / 100 }" />
    </div>

    <!-- 未设置壁纸时显示纯 CSS 动态背景 -->
    <template v-else>
      <span class="bd bd--a" />
      <span class="bd bd--b" />
      <span class="bd bd--c" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme.ts'

const themeStore = useThemeStore()
const failedPrimary = ref(false)

const wallpaper = computed(() => themeStore.wallpaper)
const isVideo = computed(() => wallpaper.value?.kind === 'video')
const visible = computed(() => Boolean(wallpaper.value) || themeStore.motion !== 'none')
/** 图片读取失败时回退到原始图片地址 */
const displayUrl = computed(() => {
  if (!wallpaper.value) return ''
  if (failedPrimary.value && wallpaper.value.sourceUrl) return wallpaper.value.sourceUrl
  return wallpaper.value.url
})

watch(wallpaper, () => {
  failedPrimary.value = false
})

function handleImageError() {
  if (wallpaper.value?.sourceUrl && !failedPrimary.value) {
    failedPrimary.value = true
  }
}
</script>

<style scoped>
/*
 * 背景层：铺在侧边栏与内容之下，不遮挡交互。
 * 有图片壁纸时显示图片，否则显示由 --mc-motion-1/2 生成的 CSS 动画。
 */
.backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  contain: strict;
}

.bd {
  position: absolute;
  display: block;
  will-change: transform, opacity;
}

/* ─── 图片壁纸 ─────────────────────────────────────── */
.bd-wall {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.bd-wall-img {
  display: block;
  width: 100%;
  height: 100%;
  /* cover = 自动适配任意窗口尺寸，裁掉多余部分而不变形 */
  object-fit: cover;
  object-position: center;
  transform-origin: 50% 50%;
  will-change: transform;
}
.bd-wall-img--kenburns {
  animation: bd-kenburns 52s ease-in-out infinite alternate;
}
.bd-wall-img--float {
  animation: bd-float 38s ease-in-out infinite alternate;
}
.bd-dim {
  position: absolute;
  inset: 0;
  background: var(--mc-bg-page);
  transition: opacity 0.2s ease;
}

/* ─── 极光：三团柔光缓慢漂移 ───────────────────────── */
.backdrop--aurora .bd--a,
.backdrop--aurora .bd--b,
.backdrop--aurora .bd--c {
  inset: -25%;
  filter: blur(90px);
}
.backdrop--aurora .bd--a {
  background: radial-gradient(circle at 28% 30%, var(--mc-motion-1) 0%, transparent 58%);
  opacity: 0.5;
  animation: bd-drift-a 24s ease-in-out infinite alternate;
}
.backdrop--aurora .bd--b {
  background: radial-gradient(circle at 74% 26%, var(--mc-motion-2) 0%, transparent 55%);
  opacity: 0.4;
  animation: bd-drift-b 30s ease-in-out infinite alternate;
}
.backdrop--aurora .bd--c {
  background: radial-gradient(circle at 50% 88%, var(--mc-motion-1) 0%, transparent 60%);
  opacity: 0.32;
  animation: bd-drift-c 36s ease-in-out infinite alternate;
}

/* ─── 波纹：三圈涟漪向外扩散 ───────────────────────── */
.backdrop--ripple .bd {
  left: 50%;
  top: 46%;
  width: 92vmin;
  height: 92vmin;
  margin: -46vmin 0 0 -46vmin;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--mc-motion-2) 42%, transparent);
  background: radial-gradient(circle, color-mix(in srgb, var(--mc-motion-1) 20%, transparent) 0%, transparent 68%);
  opacity: 0;
  animation: bd-ripple 10s cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
}
.backdrop--ripple .bd--b { animation-delay: 3.3s; }
.backdrop--ripple .bd--c { animation-delay: 6.6s; }

/* ─── 星云：锥形渐变缓慢旋转 ───────────────────────── */
.backdrop--nebula .bd--a {
  inset: -40%;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      color-mix(in srgb, var(--mc-motion-1) 70%, transparent) 52deg,
      transparent 128deg,
      color-mix(in srgb, var(--mc-motion-2) 64%, transparent) 220deg,
      transparent 310deg,
      color-mix(in srgb, var(--mc-motion-1) 46%, transparent) 360deg
    );
  filter: blur(72px);
  opacity: 0.38;
  animation: bd-spin 64s linear infinite;
}
.backdrop--nebula .bd--b {
  inset: 8%;
  background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--mc-motion-2) 26%, transparent) 0%, transparent 62%);
  filter: blur(60px);
  animation: bd-breathe 15s ease-in-out infinite;
}

/* ─── 流体：多色光斑交错流动 ───────────────────────── */
.backdrop--mesh .bd--a {
  inset: -30%;
  background:
    radial-gradient(38% 42% at 18% 24%, var(--mc-motion-1) 0%, transparent 62%),
    radial-gradient(44% 48% at 82% 26%, var(--mc-motion-2) 0%, transparent 64%),
    radial-gradient(52% 52% at 52% 86%, var(--mc-motion-1) 0%, transparent 66%);
  filter: blur(64px);
  opacity: 0.4;
  animation: bd-mesh 32s ease-in-out infinite alternate;
}
.backdrop--mesh .bd--b {
  inset: -20%;
  background: radial-gradient(36% 40% at 66% 62%, var(--mc-motion-2) 0%, transparent 62%);
  filter: blur(80px);
  opacity: 0.28;
  animation: bd-mesh 26s ease-in-out infinite alternate-reverse;
}

/* ─── 赛博：扫描线 + 顶部光罩 ─────────────────────── */
.backdrop--scan .bd--a {
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    color-mix(in srgb, var(--mc-motion-1) 13%, transparent) 0 1px,
    transparent 1px 4px
  );
  background-size: 100% 100px;
  opacity: 0.5;
  animation: bd-scan 9s linear infinite;
}
.backdrop--scan .bd--b {
  inset: 0;
  background:
    radial-gradient(62% 44% at 50% 0%, color-mix(in srgb, var(--mc-motion-2) 24%, transparent) 0%, transparent 68%),
    linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--mc-motion-1) 8%, transparent) 50%, transparent 100%);
  animation: bd-pulse 7s ease-in-out infinite;
}

/* ─── 呼吸：单团微光起伏 ─────────────────────────── */
.backdrop--breathe .bd--a {
  inset: -15%;
  background: radial-gradient(46% 46% at 50% 42%, var(--mc-motion-1) 0%, transparent 70%);
  filter: blur(90px);
  animation: bd-breathe 13s ease-in-out infinite;
}
.backdrop--breathe .bd--b {
  inset: -10%;
  background: radial-gradient(32% 32% at 72% 72%, var(--mc-motion-2) 0%, transparent 66%);
  filter: blur(80px);
  opacity: 0.36;
  animation: bd-breathe 17s ease-in-out infinite reverse;
}

/* ─── 关键帧 ─────────────────────────────────────── */
@keyframes bd-kenburns {
  /* 放大倍数控制在 4%~9%，再大就会把原图拉糊 */
  from { transform: scale(1.04) translate3d(-0.8%, -0.5%, 0); }
  to { transform: scale(1.09) translate3d(1%, 0.8%, 0); }
}
@keyframes bd-float {
  from { transform: scale(1.05) translate3d(-1%, 0.5%, 0); }
  to { transform: scale(1.07) translate3d(1.1%, -0.7%, 0); }
}
@keyframes bd-drift-a {
  from { transform: translate3d(-6%, -4%, 0) scale(1); }
  to { transform: translate3d(7%, 5%, 0) scale(1.22); }
}
@keyframes bd-drift-b {
  from { transform: translate3d(5%, 3%, 0) scale(1.1); }
  to { transform: translate3d(-6%, -5%, 0) scale(0.95); }
}
@keyframes bd-drift-c {
  from { transform: translate3d(-4%, 6%, 0) scale(1.15); }
  to { transform: translate3d(6%, -4%, 0) scale(0.98); }
}
@keyframes bd-ripple {
  0% { transform: scale(0.1); opacity: 0; }
  12% { opacity: 0.8; }
  100% { transform: scale(2.3); opacity: 0; }
}
@keyframes bd-spin {
  to { transform: rotate(360deg); }
}
@keyframes bd-mesh {
  from { transform: translate3d(-3%, 2%, 0) rotate(-4deg) scale(1); }
  to { transform: translate3d(4%, -3%, 0) rotate(6deg) scale(1.16); }
}
@keyframes bd-scan {
  to { background-position: 0 100px; }
}
@keyframes bd-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.62; }
}
@keyframes bd-breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.32; }
  50% { transform: scale(1.16); opacity: 0.6; }
}

/* 系统要求减少动态效果时直接静止 */
@media (prefers-reduced-motion: reduce) {
  .bd,
  .bd-wall-img {
    animation: none !important;
  }
}
</style>
