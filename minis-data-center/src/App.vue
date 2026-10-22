<template>
  <GlobalLoading />
  <router-view />
</template>

<script setup lang="ts">
import GlobalLoading from '@/components/GlobalLoading/index.vue'
import { useVersionCheck } from '@/composables/useVersionCheck.ts'
import { watch } from 'vue'
import { useAccountStore } from '@/stores/account.ts'
import { useThemeStore } from '@/stores/theme.ts'

// 激活全局版本检测 — 轮询 version.json，发现新版本提示用户刷新
useVersionCheck()

const accountStore = useAccountStore()
const themeStore = useThemeStore()

// 账号切换时加载该账号自己的配色（不同账号完全隔离）
watch(() => accountStore.current?.userId, id => themeStore.bindUser(id), { immediate: true })
</script>

<style>
/* 全局样式已移至 src/styles/global.css */
</style>
