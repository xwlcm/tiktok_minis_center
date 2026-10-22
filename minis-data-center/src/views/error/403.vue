<template>
  <div class="error-page">
    <!-- 背景装饰光晕 -->
    <div class="error-glow error-glow--red"></div>
    <div class="error-glow error-glow--cyan"></div>

    <div class="error-content">
      <!-- Logo -->
      <AppLogo size="lg" class="error-logo" />

      <div class="error-code">403</div>
      <div class="error-title">无访问权限</div>
      <div class="error-desc">
        您的账号没有访问该页面的权限。<br />
        如需开通权限，请联系管理员。
      </div>
      <div class="error-actions">
        <a-button type="primary" @click="$router.push('/dashboard')">
          返回首页
        </a-button>
        <a-button @click="$router.back()">返回上一页</a-button>
      </div>
      <div class="error-role">
        当前角色：
        <span class="role-badge" :class="`role-badge--${accountStore.role}`">
          {{ roleLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccountStore } from '@/stores/account.ts'
import AppLogo from '@/components/AppLogo/index.vue'

const accountStore = useAccountStore()
const roleLabel = computed(() => {
  return { admin: '管理员', operator: '运营', viewer: '观察者' }[accountStore.role] ?? accountStore.role
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mc-bg-page);
  position: relative;
  overflow: hidden;
}

/* 品牌光晕装饰 */
.error-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.error-glow--red {
  width: 400px; height: 400px;
  background: rgba(224, 87, 110, 0.08);
  top: -80px; left: -80px;
}
.error-glow--cyan {
  width: 400px; height: 400px;
  background: rgba(76, 157, 228, 0.06);
  bottom: -80px; right: -80px;
}

.error-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 48px;
}

/* Logo */
.error-logo {
  margin-bottom: 24px;
  display: inline-flex;
}
.error-logo :deep(.app-logo__name) {
  font-size: 18px;
  font-weight: 700;
  color: rgba(22, 41, 63, 0.92);
  font-family: var(--mc-font-family);
}
.error-logo :deep(.app-logo__sub) {
  font-size: 11px;
  color: rgba(22, 41, 63, 0.41);
}

.error-code {
  font-size: 72px;
  font-weight: 800;
  background: linear-gradient(135deg, rgba(224, 87, 110, 0.5) 0%, rgba(76, 157, 228, 0.5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 12px;
  letter-spacing: -4px;
  font-family: var(--mc-font-family);
}

.error-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--mc-text-primary);
  margin-bottom: 10px;
  font-family: var(--mc-font-family);
}

.error-desc {
  font-size: 14px;
  color: var(--mc-text-tertiary);
  line-height: 1.8;
  margin-bottom: 28px;
  font-family: var(--mc-font-cn);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.error-role {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.role-badge--admin { background: var(--mc-primary-light); color: var(--mc-primary); }
.role-badge--operator { background: var(--mc-success-light); color: var(--mc-success); }
.role-badge--viewer { background: var(--mc-info-light); color: var(--mc-info); }
</style>
