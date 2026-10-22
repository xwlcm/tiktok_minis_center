<template>
  <a-dropdown trigger="click" @select="handleSelect">
    <div class="switcher-trigger">
      <div class="switcher-dot" :class="{ active: !!appStore.currentApp }" ></div>
      <span class="switcher-name">{{ appStore.currentApp?.appName ?? '选择应用' }}</span>
      <icon-down class="switcher-arrow" />
    </div>
    <template #content>
      <div class="switcher-header">切换应用</div>
      <a-doption
        v-for="app in visibleApps"
        :key="app.clientKey"
        :value="app.clientKey"
      >
        <div class="switcher-option" :class="{ 'switcher-option--active': app.clientKey === appStore.currentClientKey }">
          <span class="switcher-option-check">
            <icon-check v-if="app.clientKey === appStore.currentClientKey" />
          </span>
          <span class="switcher-option-name">{{ app.appName }}</span>
          <span
            class="switcher-option-status"
            :class="app.status === '0' ? 'switcher-option-status--active' : 'switcher-option-status--inactive'"
          >{{ app.status === '0' ? '运行中' : '未激活' }}</span>
        </div>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import { useAccountStore } from '@/stores/account.ts'

const appStore = useAppStore()
const accountStore = useAccountStore()
const router = useRouter()

const visibleApps = computed(() => {
  if (accountStore.isAdmin || accountStore.hasAllApps) {
    return appStore.appList
  }
  return appStore.appList.filter(a => accountStore.allowedClientKeys.includes(a.clientKey))
})

function handleSelect(value: string | number | Record<string, unknown> | undefined) {
  const clientKey = String(value)
  if (!clientKey || clientKey === appStore.currentClientKey) return
  const app = appStore.appList.find(a => a.clientKey === clientKey)
  appStore.switchApp(clientKey).then(() => {
    Message.success(`已切换到 ${app?.appName ?? clientKey}`)
    router.push('/dashboard')
  }).catch(() => {
    Message.error('切换应用失败，请重试')
  })
}
</script>

<style scoped>
.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
}
.switcher-trigger:hover {
  background: rgba(92,189,197,0.08);
  border-color: rgba(92,189,197,0.3);
}

.switcher-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  flex-shrink: 0;
}
.switcher-dot.active {
  background: #36D399;
  box-shadow: 0 0 6px rgba(54,211,153,0.5);
}

.switcher-name {
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
  max-width: 140px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.switcher-arrow {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  flex-shrink: 0;
}
</style>

<style>
.switcher-header {
  padding: 8px 12px 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.25) !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  pointer-events: none;
}

.switcher-option {
  display: flex !important;
  align-items: center !important;
  gap: 8px;
  width: 100%;
  min-width: 200px;
  color: rgba(255,255,255,0.75) !important;
  margin: 6px 0;
}

.switcher-option-check {
  width: 16px; height: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #5CBDC5 !important;
  font-size: 12px;
  flex-shrink: 0;
}

.switcher-option-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px !important;
  color: rgba(255,255,255,0.75) !important;
}

.switcher-option--active .switcher-option-name {
  color: #5CBDC5 !important;
  font-weight: 500 !important;
}

.switcher-option-status {
  font-size: 10px !important;
  font-weight: 600 !important;
  padding: 1px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.switcher-option-status--active {
  background: rgba(54,211,153,0.15) !important;
  color: #36D399 !important;
}
.switcher-option-status--inactive {
  background: rgba(255,255,255,0.06) !important;
  color: rgba(255,255,255,0.30) !important;
}
</style>
