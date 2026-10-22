<template>
  <div class="oauth-callback">
    <!-- 背景装饰光晕 -->
    <div class="oauth-glow oauth-glow--red"></div>
    <div class="oauth-glow oauth-glow--cyan"></div>

    <div class="oauth-content">
      <!-- Logo -->
      <AppLogo size="lg" class="oauth-logo" />

      <a-spin :loading="loading" tip="正在绑定广告帐户..." :size="36">
        <div class="callback-content">
          <template v-if="error">
            <a-result status="error" :title="error">
              <template #extra>
                <a-space>
                  <a-button type="primary" @click="handleRetry">重新授权</a-button>
                  <a-button @click="goBack">返回</a-button>
                </a-space>
              </template>
            </a-result>
          </template>
          <template v-else-if="success">
            <a-result status="success" title="广告帐户绑定成功">
              <template #extra>
                <a-button type="primary" @click="goBack">返回广告帐户页</a-button>
              </template>
            </a-result>
          </template>
          <template v-else>
            <div class="loading-text">正在处理 TikTok 授权回调...</div>
          </template>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { bindByOAuth, fetchAuthUrl } from '@/api/adAccount.ts'
import AppLogo from '@/components/AppLogo/index.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const success = ref(false)
const redirectTimer = ref<number | null>(null)

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return atob(normalized + padding)
}

function sanitizeReturnPath(path: string): string {
  if (!path) return '/ad/accounts'
  if (!path.startsWith('/') || path.startsWith('//')) return '/ad/accounts'
  return path
}

/** 解析 state 中的 returnPath（处理 base64url 编码） */
function parseReturnPath(state: string): string {
  try {
    const dotIndex = state.lastIndexOf('.')
    if (dotIndex <= 0) return '/ad/accounts'
    const encoded = state.substring(0, dotIndex)
    const json = decodeBase64Url(encoded)
    const payload = JSON.parse(json)
    return sanitizeReturnPath(payload.ret || '/ad/accounts')
  } catch {
    return '/ad/accounts'
  }
}

const returnPath = computed(() => parseReturnPath(String(route.query.state ?? '')))

function goBack() {
  router.replace(returnPath.value)
}

async function handleRetry() {
  try {
    const { authUrl } = await fetchAuthUrl(returnPath.value)
    window.location.href = authUrl
  } catch {
    Message.error('获取授权链接失败')
  }
}

onMounted(async () => {
  const authCode = route.query.auth_code as string
  const state = route.query.state as string

  if (!authCode || !state) {
    error.value = '缺少授权参数（auth_code 或 state）'
    loading.value = false
    return
  }

  try {
    await bindByOAuth(authCode, state)
    success.value = true
    Message.success('广告帐户绑定成功')
    redirectTimer.value = window.setTimeout(() => {
      router.replace(returnPath.value)
    }, 800)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e || '绑定失败')
    error.value = `绑定失败: ${msg}`
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (redirectTimer.value !== null) {
    window.clearTimeout(redirectTimer.value)
  }
})
</script>

<style scoped>
.oauth-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--mc-bg-page);
  position: relative;
  overflow: hidden;
}

/* 品牌光晕装饰 */
.oauth-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.oauth-glow--red {
  width: 400px; height: 400px;
  background: rgba(224, 87, 110, 0.08);
  top: -80px; left: -80px;
}
.oauth-glow--cyan {
  width: 400px; height: 400px;
  background: rgba(76, 157, 228, 0.06);
  bottom: -80px; right: -80px;
}

.oauth-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

/* Logo */
.oauth-logo {
  margin-bottom: 24px;
  display: inline-flex;
}
.oauth-logo :deep(.app-logo__name) {
  font-size: 18px;
  font-weight: 700;
  color: rgba(22, 41, 63, 0.92);
  font-family: var(--mc-font-family);
}
.oauth-logo :deep(.app-logo__sub) {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.41);
}

.callback-content {
  padding: 40px;
}
.loading-text {
  color: rgba(22, 41, 63, 0.74);
  font-size: 14px;
  margin-top: 16px;
  font-family: var(--mc-font-cn);
}
</style>
