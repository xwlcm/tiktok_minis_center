<template>
  <div class="user-detail">
    <div class="detail-header">
      <a-button type="text" class="back-btn" @click="$router.back()">
        <template #icon><icon-arrow-left /></template>
        返回列表
      </a-button>
    </div>

    <a-spin :loading="loading" style="width: 100%" dot>
      <template v-if="user">
        <div class="profile-card">
          <a-avatar :image-url="user.avatarUrl" :size="56" class="profile-avatar">
            {{ user.nickname?.[0] }}
          </a-avatar>
          <div class="profile-info">
            <div class="profile-name">
              {{ user.nickname }}
              <a-tag :color="user.status === 1 ? 'green' : 'red'">{{ user.status === 1 ? '正常' : '禁用' }}</a-tag>
            </div>
            <div class="profile-meta">
              <span>OpenID：{{ user.openId }}</span>
              <template v-if="user.gender">
                <span class="meta-sep">·</span>
                <span>{{ user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知' }}</span>
              </template>
              <template v-if="user.createTime">
                <span class="meta-sep">·</span>
                <span>注册：{{ user.createTime }}</span>
              </template>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">用户信息</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">用户ID</div>
              <div class="info-value">{{ user.userId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">昵称</div>
              <div class="info-value">{{ user.nickname }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">性别</div>
              <div class="info-value">{{ user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">手机号</div>
              <div class="info-value">{{ user.phone || '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">邮箱</div>
              <div class="info-value">{{ user.email || '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">注册时间</div>
              <div class="info-value">{{ user.createTime || '—' }}</div>
            </div>
          </div>
        </div>
      </template>
      <EmptyState v-else-if="!loading" description="用户不存在" style="padding: 80px 0" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUserProfile } from '@/api/user.ts'
import type { User } from '@/types/user.ts'
import EmptyState from '@/components/EmptyState/index.vue'

const route = useRoute()
const loading = ref(false)
const user = ref<User | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const openId = route.params.id as string
    user.value = await fetchUserProfile(openId)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-detail { max-width: 1100px; }

.detail-header { margin-bottom: 16px; }
.back-btn {
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent) !important;
  padding: 0 !important;
  font-size: 13px !important;
}
.back-btn:hover { color: #4c9de4 !important; }

.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}
.profile-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, #4c9de4, #4c9de4);
  opacity: 0.5;
}
.profile-avatar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #4c9de4, #4c9de4) !important;
  font-size: 20px !important;
  font-weight: 700 !important;
}
.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.profile-meta {
  font-size: 12px;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  display: flex;
  align-items: center;
  gap: 6px;
}
.meta-sep { color: color-mix(in srgb, var(--mc-text-primary) 24%, transparent); }

.info-card {
  background: var(--mc-bg-card);
  border: 1px solid color-mix(in srgb, var(--mc-text-primary) 20%, transparent);
  border-radius: 12px;
  padding: 20px 24px;
}
.info-card-header {
  font-size: 14px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--mc-text-primary) 17%, transparent);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.info-label {
  font-size: 11px;
  font-weight: 600;
  color: color-mix(in srgb, var(--mc-text-primary) 57%, transparent);
  margin-bottom: 4px;
}
.info-value {
  font-size: 14px;
  font-weight: 500;
  color: color-mix(in srgb, var(--mc-text-primary) 96%, transparent);
}
</style>
