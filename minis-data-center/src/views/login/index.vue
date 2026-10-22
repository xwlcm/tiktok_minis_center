<template>
  <div class="lw">
    <canvas ref="cvs" class="lw__canvas" ></canvas>

    <!-- 背景装饰光晕 -->
    <div class="lw__glow lw__glow--red" ></div>
    <div class="lw__glow lw__glow--cyan" ></div>

    <AppLogo size="md" brand-name="Minis" brand-sub="Data Center" class="lw__brand-mark" />

    <div
      class="lc"
      :class="{ 'lc--shake': shaking, 'lc--success': loginSucceeded }"
      :style="cardStyle"
      @pointermove="onCardPointerMove"
      @pointerleave="onCardPointerLeave"
    >
      <!-- ── Logo ── -->
      <AppLogo size="lg" brand-sub="Data Center" class="lc__brand" />

      <!-- ── 标题 ── -->
      <div class="lc__heading">
        <h1 class="lc__title">欢迎回来</h1>
        <p class="lc__desc">登录您的管理账号</p>
      </div>

      <!-- ── 表单 ── -->
      <form class="lf" @submit.prevent="handleLogin">
        <!-- 用户名 -->
        <div class="lf__field" :class="{ 'lf__field--focus': focus.username, 'lf__field--filled': !!formData.username || autofilled.username, 'lf__field--error': hasError && !formData.username }">
          <label class="lf__label" :class="{ 'lf__label--up': focus.username || formData.username || autofilled.username }">
            用户名 / 邮箱
          </label>
          <div class="lf__row">
            <svg class="lf__icon" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <input
              ref="usernameInput"
              v-model="formData.username"
              type="text"
              class="lf__input"
              placeholder=" "
              autocomplete="username"
              @focus="onFocus('username')"
              @blur="onBlur('username')"
              @input="hasError = false"
              @animationstart="onAutofill('username', $event)"
            />
          </div>
          <div class="lf__line" ></div>
        </div>

        <!-- 密码 -->
        <div class="lf__field" :class="{ 'lf__field--focus': focus.password, 'lf__field--filled': !!formData.password || autofilled.password, 'lf__field--error': hasError && !formData.password }">
          <label class="lf__label" :class="{ 'lf__label--up': focus.password || formData.password || autofilled.password }">
            密码
          </label>
          <div class="lf__row">
            <svg class="lf__icon" viewBox="0 0 20 20" fill="none">
              <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
            </svg>
            <input
              ref="passwordInput"
              v-model="formData.password"
              :type="showPwd ? 'text' : 'password'"
              class="lf__input"
              placeholder=" "
              autocomplete="current-password"
              @focus="onFocus('password')"
              @blur="onBlur('password')"
              @input="hasError = false"
              @animationstart="onAutofill('password', $event)"
            />
            <button type="button" class="lf__eye" :aria-label="showPwd ? '隐藏密码' : '显示密码'" @click="showPwd = !showPwd">
              <!-- eye open -->
              <svg v-if="showPwd" viewBox="0 0 20 20" fill="none">
                <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" stroke-width="1.4"/>
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              <!-- eye closed -->
              <svg v-else viewBox="0 0 20 20" fill="none">
                <path d="M3 3l14 14M8.5 8.7A2.5 2.5 0 0012.3 12M6.2 6.4C3.8 7.7 2 10 2 10s3 5 8 5c1.5 0 2.9-.4 4.1-1.1M10 5c4.5.3 7.5 5 7.5 5a13 13 0 01-2.2 2.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="lf__line" ></div>
        </div>

        <!-- 错误提示 -->
        <transition name="err">
          <div v-if="errorMsg" class="lf__error" role="alert" aria-live="polite">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#4c9de4" stroke-width="1.2"/>
              <path d="M8 5v4M8 11v.5" stroke="#4c9de4" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            {{ errorMsg }}
          </div>
        </transition>

        <!-- 登录按钮 -->
        <button
          type="submit"
          class="lf__btn"
          :class="{ 'lf__btn--loading': loading, 'lf__btn--success': loginSucceeded }"
          :disabled="loading || loginSucceeded"
          :aria-busy="loading"
        >
          <span v-if="!loading && !loginSucceeded" class="lf__btn-text">登录</span>
          <span v-else-if="loginSucceeded" class="lf__btn-text lf__btn-text--done">进入中</span>
          <span v-else class="lf__loading">
            <span class="lf__spinner" ></span>
            <span>登录中</span>
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth.ts'
import AppLogo from '@/components/AppLogo/index.vue'
import { useAccountStore } from '@/stores/account.ts'
import { useAppStore } from '@/stores/app.ts'
import { setLoginInitializing } from '@/utils/request.ts'

const router = useRouter()
const route = useRoute()
const accountStore = useAccountStore()
const appStore = useAppStore()

// ── 表单状态 ──────────────────────────────────────────────────
const formData = reactive({ username: '', password: '' })
const focus = reactive({ username: false, password: false })
const autofilled = reactive({ username: false, password: false })
const showPwd = ref(false)
const loading = ref(false)
const loginSucceeded = ref(false)
const hasError = ref(false)
const shaking = ref(false)
const errorMsg = ref('')
const cardStyle = reactive<Record<string, string>>({
  '--tilt-x': '0deg',
  '--tilt-y': '0deg',
  '--spot-x': '50%',
  '--spot-y': '20%',
})
const redirectPath = ref('/dashboard')

const usernameInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)

function sanitizeRedirectPath(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function onFocus(field: 'username' | 'password') { focus[field] = true }
function onBlur(field: 'username' | 'password') { focus[field] = false }

function onAutofill(field: 'username' | 'password', event?: AnimationEvent) {
  // 动画名区分浏览器自动填充的开始与取消
  if (event && event.animationName === 'onAutoFillCancel') {
    autofilled[field] = false
    return
  }
  autofilled[field] = true
  const el = field === 'username' ? usernameInput.value : passwordInput.value
  if (el && !formData[field]) {
    formData[field] = el.value
  }
}

function onCardPointerMove(e: PointerEvent) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const nx = x / rect.width - 0.5
  const ny = y / rect.height - 0.5

  cardStyle['--tilt-x'] = `${(-ny * 5).toFixed(2)}deg`
  cardStyle['--tilt-y'] = `${(nx * 6).toFixed(2)}deg`
  cardStyle['--spot-x'] = `${((x / rect.width) * 100).toFixed(1)}%`
  cardStyle['--spot-y'] = `${((y / rect.height) * 100).toFixed(1)}%`
}

function onCardPointerLeave() {
  cardStyle['--tilt-x'] = '0deg'
  cardStyle['--tilt-y'] = '0deg'
  cardStyle['--spot-x'] = '50%'
  cardStyle['--spot-y'] = '20%'
}

async function goAfterLogin() {
  await router.replace(redirectPath.value)
}

async function handleLogin() {
  // 防止表单 submit 与其他键盘/点击事件在同一时刻重复启动登录流程
  if (loading.value || loginSucceeded.value) return

  // 浏览器自动填充时 v-model 可能未同步，主动从 DOM 读取最新值
  if (usernameInput.value && usernameInput.value.value && !formData.username) {
    formData.username = usernameInput.value.value
  }
  if (passwordInput.value && passwordInput.value.value && !formData.password) {
    formData.password = passwordInput.value.value
  }

  if (!formData.username.trim() || !formData.password.trim()) {
    triggerError('请填写用户名和密码')
    return
  }
  loading.value = true
  loginSucceeded.value = false
  errorMsg.value = ''
  let loginInitializing = false
  try {
    // 调用后端登录接口，使用正确的参数格式
    const res = await login({
      clientId: 'pc',
      grantType: 'password',
      tenantId: '000000',
      username: formData.username,
      password: formData.password,
    })

    localStorage.setItem('token', res.access_token)
    localStorage.setItem('client_id', res.client_id || 'pc')

    if (res.refresh_token) {
      localStorage.setItem('refresh_token', res.refresh_token)
    }

    loginInitializing = true
    setLoginInitializing(true)
    await accountStore.loadFromServer()
    await appStore.loadFromAccountStore()

    loginSucceeded.value = true
    await new Promise(resolve => setTimeout(resolve, 260))
    await goAfterLogin()
  } catch (err: unknown) {
    const msg = (err instanceof Error ? err.message : String(err)) || '登录失败，请重试'
    if (loginInitializing) {
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('client_id')
      accountStore.clear()
      appStore.clear()
      triggerError(msg || '登录初始化失败，请重试')
    } else if (msg.includes('锁定')) {
      triggerError('账户已被锁定，请 30 分钟后再试')
    } else {
      triggerError(msg)
    }
  } finally {
    if (loginInitializing) {
      setLoginInitializing(false)
    }
    loading.value = false
  }
}

function triggerError(msg: string) {
  errorMsg.value = msg
  hasError.value = true
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 600)
}

// ── 粒子系统 ──────────────────────────────────────────────────
const cvs = ref<HTMLCanvasElement | null>(null)
let raf = 0
const mouse = { x: -999, y: -999 }

interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; c: string }

const COLS = ['#4c9de4', '#4c9de4', '#4c9de4', '#4A90D9', '#6FB6F2']
const N = 200
const LINK = 130

function particleCount(w: number, h: number) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 60
  return Math.min(N, Math.max(90, Math.round((w * h) / 6200)))
}

function mkParticles(w: number, h: number): P[] {
  return Array.from({ length: particleCount(w, h) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.55,
    vy: (Math.random() - 0.5) * 0.55,
    r: Math.random() * 1.8 + 0.6,
    a: Math.random() * 0.55 + 0.2,
    c: COLS[Math.floor(Math.random() * COLS.length)],
  }))
}

function hex2rgb(h: string) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)].join(',')
}

function startCanvas() {
  const el = cvs.value
  if (!el) return
  const ctx = el.getContext('2d')!
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  let w = innerWidth
  let h = innerHeight
  const resizeCanvas = () => {
    w = innerWidth
    h = innerHeight
    el.width = Math.floor(w * pixelRatio)
    el.height = Math.floor(h * pixelRatio)
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }
  resizeCanvas()
  let ps = mkParticles(w, h)

  const onResize = () => { resizeCanvas(); ps = mkParticles(w, h) }
  const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
  addEventListener('resize', onResize)
  addEventListener('mousemove', onMove)

  const tick = () => {
    ctx.clearRect(0, 0, w, h)
    for (const p of ps) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y
      const d = Math.hypot(dx, dy)
      if (d > 0 && d < 140) { p.vx += dx/d*0.025; p.vy += dy/d*0.025 }
      const spd = Math.hypot(p.vx, p.vy)
      if (spd > 1.4) { p.vx = p.vx/spd*1.4; p.vy = p.vy/spd*1.4 }
      p.x = (p.x + p.vx + w) % w
      p.y = (p.y + p.vy + h) % h
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
      ctx.fillStyle = `rgba(${hex2rgb(p.c)},${p.a})`
      ctx.fill()
    }
    for (let i = 0; i < ps.length; i++) {
      for (let j = i+1; j < ps.length; j++) {
        const d = Math.hypot(ps[i].x-ps[j].x, ps[i].y-ps[j].y)
        if (d < LINK) {
          ctx.beginPath()
          ctx.moveTo(ps[i].x, ps[i].y)
          ctx.lineTo(ps[j].x, ps[j].y)
          ctx.strokeStyle = `rgba(${hex2rgb(ps[i].c)},${(1-d/LINK)*0.35})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        }
      }
    }
    raf = requestAnimationFrame(tick)
  }
  tick()
  ;(el as HTMLCanvasElement & { _off?: () => void })._off = () => {
    removeEventListener('resize', onResize)
    removeEventListener('mousemove', onMove)
  }
}

onMounted(() => {
  redirectPath.value = sanitizeRedirectPath(route.query.redirect)
  startCanvas()
  setTimeout(() => {
    if (usernameInput.value?.value) {
      formData.username = usernameInput.value.value
      autofilled.username = true
    }
    if (passwordInput.value?.value) {
      formData.password = passwordInput.value.value
      autofilled.password = true
    }
  }, 100)
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  const el = cvs.value as (HTMLCanvasElement & { _off?: () => void }) | null
  el?._off?.()
})
</script>

<style scoped>
/* ── 全屏容器 ─────────────────────────────────────────────── */
.lw {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f6fd;
  overflow: hidden;
  font-family: var(--mc-font-family);
}
.lw::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(22, 41, 63, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 41, 63, 0.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 50% 46%, #000 0%, transparent 72%);
  opacity: 0.55;
  animation: gridDrift 16s linear infinite;
}

.lw__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* TikTok 标志性双色光晕 */
.lw__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.lw__glow--red {
  width: 500px; height: 500px;
  background: rgba(76, 157, 228, 0.12);
  top: -100px; left: -100px;
}
.lw__glow--cyan {
  width: 500px; height: 500px;
  background: rgba(76, 157, 228, 0.10);
  bottom: -100px; right: -100px;
}

.lw__brand-mark {
  position: absolute;
  top: 28px;
  left: 32px;
  z-index: 1;
  padding: 10px 12px;
  border: 1px solid rgba(31, 80, 132, 0.14);
  border-radius: 12px;
  background: rgba(76, 157, 228, 0.04);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 18px 48px rgba(23, 54, 92, 0.182);
  animation: logoEnter 0.55s 0.04s ease both;
}
.lw__brand-mark :deep(.app-logo__name) {
  color: rgba(22, 41, 63, 0.92);
}
.lw__brand-mark :deep(.app-logo__sub) {
  color: rgba(22, 41, 63, 0.57);
  letter-spacing: 1px;
}

/* ── 登录卡片 ─────────────────────────────────────────────── */
.lc {
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  --spot-x: 50%;
  --spot-y: 20%;
  position: relative;
  z-index: 1;
  width: 400px;
  padding: 44px 40px 36px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(31, 80, 132, 0.13);
  border-radius: 16px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 0 0 1px rgba(76, 157, 228, 0.06),
    0 32px 80px rgba(23, 54, 92, 0.18);
  transform: perspective(900px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) translateY(0);
  transform-style: preserve-3d;
  transition: transform 0.18s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: cardEnter 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.lc::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(circle at var(--spot-x) var(--spot-y), rgba(76, 157, 228, 0.15), transparent 38%);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.lc::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  pointer-events: none;
  border: 1px solid rgba(31, 80, 132, 0.07);
}
.lc:hover::before,
.lc:focus-within::before {
  opacity: 1;
}
.lc:focus-within {
  border-color: rgba(76, 157, 228, 0.18);
  box-shadow:
    0 0 0 1px rgba(76, 157, 228, 0.08),
    0 34px 90px rgba(23, 54, 92, 0.22);
}
.lc--success {
  border-color: rgba(76, 157, 228, 0.34);
  box-shadow:
    0 0 0 1px rgba(76, 157, 228, 0.18),
    0 28px 78px rgba(23, 54, 92, 0.20),
    0 0 44px rgba(76, 157, 228, 0.12);
}

@keyframes shake {
  0%,100% { transform: translateX(0) }
  20%      { transform: translateX(-9px) }
  40%      { transform: translateX(9px) }
  60%      { transform: translateX(-5px) }
  80%      { transform: translateX(5px) }
}
.lc--shake { animation: shake 0.5s ease }

/* ── 品牌区 ───────────────────────────────────────────────── */
.lc__brand {
  margin-bottom: 32px;
  animation: itemEnter 0.55s 0.08s ease both;
}
.lc__brand :deep(.app-logo__name) {
  font-size: 16px;
  font-weight: 700;
  color: rgba(22, 41, 63, 0.92);
  letter-spacing: 0.3px;
  font-family: var(--mc-font-family);
}
.lc__brand :deep(.app-logo__sub) {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.47);
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

/* ── 标题 ─────────────────────────────────────────────────── */
.lc__heading {
  margin-bottom: 32px;
  animation: itemEnter 0.55s 0.14s ease both;
}
.lc__title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #16293F;
  letter-spacing: 0;
  font-family: var(--mc-font-family);
}
.lc__desc {
  margin: 0;
  font-size: 13px;
  color: rgba(22, 41, 63, 0.47);
  font-family: var(--mc-font-cn);
}

/* ── 表单 ─────────────────────────────────────────────────── */
.lf {
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: itemEnter 0.55s 0.2s ease both;
}

/* 字段容器 */
.lf__field {
  position: relative;
  padding-top: 18px;
  transition: transform 0.2s ease;
}
.lf__field--focus {
  transform: translateY(-1px);
}

/* 浮动 label */
.lf__label {
  position: absolute;
  top: 22px;
  left: 28px;
  font-size: 14px;
  color: rgba(22, 41, 63, 0.41);
  pointer-events: none;
  transition: top 0.2s ease, font-size 0.2s ease, color 0.2s ease;
  transform-origin: left;
}
.lf__label--up {
  top: 0;
  font-size: 12px;
  color: rgba(22, 41, 63, 0.61);
  letter-spacing: 0.5px;
}
/* 浏览器自动填充时 :placeholder-shown 失效，用 CSS 兜底上浮，避免与值重叠 */
.lf__field:has(.lf__input:not(:placeholder-shown)) .lf__label {
  top: 0;
  font-size: 12px;
  color: rgba(22, 41, 63, 0.61);
  letter-spacing: 0.5px;
}
.lf__field--focus .lf__label--up {
  color: #4c9de4;
}
.lf__field--error .lf__label--up {
  color: #E0576E;
}

/* 输入行 */
.lf__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 10px;
}

/* 图标 */
.lf__icon {
  width: 16px; height: 16px;
  flex-shrink: 0;
  color: rgba(22, 41, 63, 0.34);
  transition: color 0.2s, transform 0.2s;
}
.lf__field--focus .lf__icon { color: #4c9de4; transform: scale(1.08); }
.lf__field--filled:not(.lf__field--focus):not(.lf__field--error) .lf__icon { color: rgba(22, 41, 63, 0.57); }
.lf__field--error .lf__icon { color: #E0576E; }

/* 原生 input — 完全掌控，无任何框架干扰 */
.lf__input {
  flex: 1;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  font-size: 15px !important;
  font-weight: 400 !important;
  font-family: var(--mc-font-family) !important;
  color: #16293F !important;
  caret-color: #4c9de4 !important;
  -webkit-text-fill-color: #16293F !important;
  line-height: 1.4 !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
  transition: none;
}
.lf__input::placeholder {
  color: transparent; /* label 代替 placeholder */
}
/* 自动填充时保持深色文字，背景色贴近卡片底色 */
.lf__input:-webkit-autofill,
.lf__input:-webkit-autofill:hover,
.lf__input:-webkit-autofill:focus,
.lf__input:-webkit-autofill:active {
  -webkit-text-fill-color: #16293F !important;
  -webkit-box-shadow: 0 0 0 1000px #F1F6FD inset !important;
  caret-color: #4c9de4 !important;
  transition: background-color 5000s ease-in-out 0s;
}

@keyframes onAutoFillStart {
  from { /**/ }
  to { /**/ }
}
@keyframes onAutoFillCancel {
  from { /**/ }
  to { /**/ }
}
.lf__input:-webkit-autofill {
  animation-name: onAutoFillStart;
}
.lf__input:not(:-webkit-autofill) {
  animation-name: onAutoFillCancel;
}

/* 底部线条 */
.lf__line {
  position: relative;
  height: 1px;
  background: rgba(76, 157, 228, 0.11);
  overflow: hidden;
  transition: background 0.25s, box-shadow 0.25s;
}
.lf__line::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #4c9de4, #4c9de4);
  transform: translateX(-105%);
  transition: transform 0.28s ease;
}
.lf__field--focus .lf__line::before,
.lf__field--filled .lf__line::before {
  transform: translateX(0);
}
.lf__field--focus .lf__line {
  background: rgba(76, 157, 228, 0.45);
  box-shadow: 0 0 8px rgba(76, 157, 228, 0.5);
}
.lf__field--error .lf__line {
  background: #E0576E;
  box-shadow: 0 0 8px rgba(224, 87, 110,0.4);
}

/* 眼睛按钮 */
.lf__eye {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(22, 41, 63, 0.34);
  transition: color 0.2s, transform 0.2s;
  flex-shrink: 0;
}
.lf__eye svg { width: 18px; height: 18px; }
.lf__eye:hover { color: rgba(22, 41, 63, 0.81); transform: scale(1.08); }
.lf__eye:focus-visible {
  outline: 2px solid rgba(76, 157, 228, 0.7);
  outline-offset: 4px;
  border-radius: 999px;
}

/* 错误提示 */
.lf__error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #E0576E;
  margin-top: -12px;
}
.lf__error svg { width: 14px; height: 14px; flex-shrink: 0; }

.err-enter-active, .err-leave-active { transition: opacity 0.2s, transform 0.2s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── 登录按钮 ─────────────────────────────────────────────── */
.lf__btn {
  margin-top: 4px;
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #fff;
  font-family: var(--mc-font-family);
  background: linear-gradient(90deg, #4c9de4 0%, #4c9de4 100%);
  position: relative;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 24px rgba(76, 157, 228, 0.35);
}
/* 光泽扫光 */
.lf__btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(76, 157, 228, 0.2) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}
.lf__btn:hover::before { transform: translateX(100%); }
.lf__btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(76, 157, 228, 0.45);
}
.lf__btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 12px rgba(76, 157, 228, 0.3);
}
.lf__btn:disabled { cursor: not-allowed; opacity: 0.7; }
.lf__btn:focus-visible {
  outline: 2px solid rgba(22, 41, 63, 0.92);
  outline-offset: 4px;
}
.lf__btn--loading,
.lf__btn--success {
  opacity: 1;
}
.lf__btn--loading::before {
  animation: btnSweep 1.1s ease-in-out infinite;
}
.lf__btn--success {
  background: linear-gradient(90deg, #22a06b 0%, #4c9de4 100%);
  box-shadow: 0 8px 34px rgba(51, 201, 138,0.24);
}
.lf__btn-text--done {
  letter-spacing: 2px;
}
.lf__loading {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* loading spinner */
.lf__spinner {
  display: inline-block;
  width: 20px; height: 20px;
  border: 2px solid rgba(31, 80, 132, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes btnSweep {
  0% { transform: translateX(-110%); }
  55%, 100% { transform: translateX(110%); }
}
@keyframes cardEnter {
  from { opacity: 0; transform: perspective(900px) rotateX(0) rotateY(0) translateY(18px) scale(0.98); }
  to { opacity: 1; transform: perspective(900px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) translateY(0) scale(1); }
}
@keyframes itemEnter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes gridDrift {
  from { background-position: 0 0; }
  to { background-position: 44px 44px; }
}
@keyframes logoEnter {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 520px) {
  .lw {
    align-items: flex-start;
    padding-top: 116px;
  }
  .lw__brand-mark {
    top: 22px;
    right: 0;
    left: 0;
    width: max-content;
    margin: 0 auto;
  }
  .lc {
    width: min(400px, calc(100vw - 32px));
    padding: 36px 28px 32px;
    border-radius: 14px;
  }
  .lc__brand,
  .lc__heading {
    margin-bottom: 26px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lw::before,
  .lc,
  .lc__brand,
  .lw__brand-mark,
  .lc__heading,
  .lf,
  .lf__btn--loading::before,
  .lf__spinner {
    animation: none !important;
  }
  .lc,
  .lf__field,
  .lf__icon,
  .lf__eye,
  .lf__btn,
  .lf__line,
  .lf__line::before {
    transition: none !important;
  }
  .lc {
    transform: none !important;
  }
  .lw__brand-mark {
    transform: none !important;
  }
}

</style>
