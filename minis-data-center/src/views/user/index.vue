<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">用户列表</div>
        <div class="page-subtitle">查看和分析注册用户数据</div>
      </div>
    </div>

    <div class="toolbar">
      <a-input
        v-model="filters.keyword"
        placeholder="搜索昵称 / 用户ID..."
        allow-clear
        style="width: 240px"
        @keyup.enter="handleSearch"
      >
        <template #prefix><icon-search /></template>
      </a-input>
      <a-select v-model="filters.valueTier" placeholder="价值分层" allow-clear style="width: 130px" @change="handleSearch">
        <a-option value="WHALE">🐋 鲸鱼</a-option>
        <a-option value="HIGH">⭐ 高价值</a-option>
        <a-option value="GROWING">📈 成长</a-option>
        <a-option value="ACTIVE">✅ 活跃</a-option>
        <a-option value="NEW">🆕 新用户</a-option>
        <a-option value="SILENT">😴 沉默</a-option>
        <a-option value="CHURNED">💀 流失</a-option>
      </a-select>
      <a-select v-model="filters.churnRisk" placeholder="流失风险" allow-clear style="width: 120px" @change="handleSearch">
        <a-option value="SAFE">安全</a-option>
        <a-option value="WATCH">关注</a-option>
        <a-option value="WARNING">预警</a-option>
        <a-option value="CRITICAL">高危</a-option>
        <a-option value="LOST">已流失</a-option>
      </a-select>
      <a-select v-model="filters.orderBy" placeholder="排序" allow-clear style="width: 130px" @change="handleSearch">
        <a-option value="lastActiveTime">最近活跃</a-option>
        <a-option value="totalIapAmount">消费金额</a-option>
        <a-option value="valueScore">价值评分</a-option>
      </a-select>
      <a-range-picker
        v-model="filters.registeredAtRange"
        :placeholder="['开始时间', '结束时间']"
        style="width: 280px"
        format="YYYY-MM-DD"
      />
      <a-button type="primary" @click="handleSearch">搜索</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <div class="table-card">
      <ResizableTable>
      <a-table
        :columns="columns"
        :data="userStore.list"
        :loading="loading"
        :pagination="{
          total: userStore.total,
          current: userStore.currentPage,
          pageSize: userStore.pageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="userId"
        :bordered="false"
        :row-class="() => 'clickable-row'"
        @page-change="handlePageChange"
        @row-click="(record: any) => goDetail(record.openId)"
      >
        <template #avatar="{ record }">
          <a-avatar :image-url="record.avatarUrl" :size="30" style="flex-shrink: 0; text-align: center; line-height: 30px;">
            {{ record.nickname?.[0] }}
          </a-avatar>
        </template>
        <template #nickname="{ record }">
          <div class="user-cell">
            <span class="user-name">{{ record.nickname }}</span>
            <span class="user-id">{{ record.openId }}</span>
          </div>
        </template>
        <template #gender="{ record }">
          <span>{{ record.gender === 1 ? '男' : record.gender === 2 ? '女' : '未知' }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '正常' : '禁用' }}</a-tag>
        </template>
        <template #adWhitelist="{ record }">
          <!-- stop 阻止冒泡到行点击跳详情；开关值以后端返回为准，失败时回滚 -->
          <span @click.stop>
            <a-switch
              :model-value="!!record.adWhitelist"
              size="small"
              :loading="whitelistToggling.has(record.openId)"
              @change="(val: boolean | (string | number | boolean)) => handleToggleWhitelist(record, val as boolean)"
            />
          </span>
        </template>
        <template #valueTier="{ record }">
          <span v-if="record.valueTier" class="tier-badge" :class="getTierClass(record.valueTier)">{{ getTierLabel(record.valueTier) }}</span>
          <span v-else class="tier-badge tier-low">未评估</span>
        </template>
        <template #churnRisk="{ record }">
          <a-tag v-if="record.churnRisk" :color="getRiskColor(record.churnRisk)">{{ getRiskLabel(record.churnRisk) }}</a-tag>
        </template>
        <template #iapAmount="{ record }">
          <span>{{ record.totalIapAmount ? (record.totalIapAmount / 100).toFixed(2) : '0.00' }}</span>
        </template>
        <template #operations="{ record }">
          <a-button type="primary" size="small" @click.stop="goDetail(record.openId)">
            查看详情
          </a-button>
        </template>
      </a-table>
      </ResizableTable>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserList' })
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user.ts'
import { useAppStore } from '@/stores/app.ts'
import { yesterdayTodayRange } from '@/utils/date-range.ts'
import { toggleForceWhitelist } from '@/api/ad.ts'
import ResizableTable from "@/components/ResizableTable/index.vue";

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const loading = ref(false)
// 正在切换白名单的 openId 集合，用于开关行级 loading 防重复提交。
const whitelistToggling = reactive(new Set<string>())

const filters = reactive({
  keyword: '',
  registeredAtRange: yesterdayTodayRange() as (string | number | Date)[] | undefined,
  valueTier: undefined as string | undefined,
  churnRisk: undefined as string | undefined,
  orderBy: undefined as string | undefined,
})

const columns = ref([
  { title: '头像', slotName: 'avatar', width: 52, resizable: true, minWidth: 40 },
  { title: '用户', slotName: 'nickname', width: 180, resizable: true, minWidth: 120 },
  { title: '价值分层', slotName: 'valueTier', width: 100, resizable: true, minWidth: 80 },
  { title: '流失风险', slotName: 'churnRisk', width: 90, resizable: true, minWidth: 70 },
  { title: '最后活跃', dataIndex: 'lastActiveTime', width: 140, resizable: true, minWidth: 110 },
  { title: 'IAP消费(元)', slotName: 'iapAmount', width: 110, resizable: true, minWidth: 80 },
  { title: '状态', slotName: 'status', width: 70, resizable: true, minWidth: 60 },
  { title: '广告白名单', slotName: 'adWhitelist', width: 95, resizable: true, minWidth: 80 },
  { title: '注册时间', dataIndex: 'createTime', width: 140, resizable: true, minWidth: 120 },
  { title: '操作', slotName: 'operations', width: 100, resizable: true, minWidth: 80 },
])

async function fetchList() {
  loading.value = true
  try {
    const range = filters.registeredAtRange
    await userStore.fetchList({
      keyword: filters.keyword,
      startDate: range?.[0] != null ? String(range[0]) : undefined,
      endDate: range?.[1] != null ? String(range[1]) : undefined,
      valueTier: filters.valueTier,
      churnRisk: filters.churnRisk,
      orderBy: filters.orderBy,
    })
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  userStore.currentPage = 1
  fetchList()
}

function handleReset() {
  filters.keyword = ''
  filters.registeredAtRange = yesterdayTodayRange()
  filters.valueTier = undefined
  filters.churnRisk = undefined
  filters.orderBy = undefined
  handleSearch()
}

function handlePageChange(page: number) {
  userStore.currentPage = page
  fetchList()
}

function goDetail(openId: string) {
  router.push(`/user/${openId}`)
}

async function handleToggleWhitelist(record: { openId: string; adWhitelist?: boolean }, enabled: boolean) {
  if (!record.openId || whitelistToggling.has(record.openId)) return
  whitelistToggling.add(record.openId)
  try {
    await toggleForceWhitelist(record.openId, enabled)
    record.adWhitelist = enabled
    Message.success(enabled ? '已加入广告白名单，用户下次登录后不再强弹广告' : '已移出广告白名单')
  } catch {
    // 错误提示由 request 拦截器统一弹窗，失败不改开关状态，等待后端返回值。
  } finally {
    whitelistToggling.delete(record.openId)
  }
}

function getTierLabel(tier: string): string {
  const map: Record<string, string> = { WHALE: '🐋 鲸鱼', HIGH: '⭐ 高价值', GROWING: '📈 成长', ACTIVE: '✅ 活跃', NEW: '🆕 新用户', SILENT: '😴 沉默', CHURNED: '💀 流失' }
  return map[tier] || tier
}

function getTierClass(tier: string): string {
  if (tier === 'WHALE' || tier === 'HIGH') return 'tier-high'
  if (tier === 'GROWING' || tier === 'ACTIVE') return 'tier-medium'
  if (tier === 'CHURNED') return 'tier-churned'
  return 'tier-low'
}

function getRiskColor(risk: string): string {
  const map: Record<string, string> = { SAFE: 'green', WATCH: 'blue', WARNING: 'orange', CRITICAL: 'red', LOST: 'gray' }
  return map[risk] || 'gray'
}

function getRiskLabel(risk: string): string {
  const map: Record<string, string> = { SAFE: '安全', WATCH: '关注', WARNING: '预警', CRITICAL: '高危', LOST: '已流失' }
  return map[risk] || risk
}

watch(() => appStore.currentClientKey, () => {
  userStore.currentPage = 1
  fetchList()
})

onMounted(fetchList)
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}
.page-subtitle {
  font-size: 12px;
  color: var(--mc-text-tertiary);
  margin-top: 2px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  overflow: clip;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--mc-text-primary);
}
.user-id {
  font-size: 11px;
  color: var(--mc-text-tertiary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.tier-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.tier-high { background: rgba(0,180,100,0.12); color: #00B464; }
.tier-medium { background: rgba(76, 157, 228, 0.12); color: #4c9de4; }
.tier-low { background: rgba(22, 41, 63, 0.08); color: rgba(22, 41, 63, 0.54); }
.tier-churned { background: rgba(224, 87, 110,0.12); color: #4c9de4; }
</style>
