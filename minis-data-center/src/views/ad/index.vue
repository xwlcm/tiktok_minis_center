<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">广告列表</div>
        <div class="page-subtitle">管理 C 端用户可投放的广告资源</div>
      </div>
      <a-button type="primary" @click="openAddInventory">
        <template #icon><icon-plus /></template>
        新增广告
      </a-button>
    </div>

    <div class="table-card">
      <a-table
        :columns="inventoryColumns"
        :data="adStore.inventoryList"
        :loading="loading"
        row-key="id"
        :bordered="false"
        :pagination="false"
      >
        <template #adName="{ record }">
          <span class="ad-name">{{ record.adName }}</span>
        </template>
        <template #adType="{ record }">
          <span class="type-badge">{{ typeNameMap[record.adType] || record.adType }}</span>
        </template>
        <template #adUnitId="{ record }">
          <span class="ad-unit-id">{{ record.adUnitId }}</span>
        </template>
        <template #pushCount="{ record }">
          <span>{{ record.pushCount ?? 0 }}</span>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.status === 1"
            :loading="togglingId === record.id"
            checked-text="启用"
            unchecked-text="禁用"
            @change="(val: string | number | boolean) => handleToggleInventory(record, !!val)"
          />
        </template>
        <template #operations="{ record }">
          <div class="row-actions">
            <a-button type="primary" size="small" @click="openEditInventory(record)">编辑</a-button>
            <a-popconfirm content="确定删除该广告？" @ok="handleDeleteInventory(record)">
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="inventoryModalVisible"
      :title="editingInventory ? '编辑广告' : '新增广告'"
      :ok-loading="submitting"
      width="480px"
      @ok="handleSaveInventory"
      @cancel="inventoryModalVisible = false"
    >
      <a-form ref="inventoryFormRef" :model="inventoryForm" :rules="inventoryFormRules" layout="vertical">
        <a-form-item field="adName" label="广告名称">
          <a-input v-model="inventoryForm.adName" placeholder="如：首页激励视频A" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="adType" label="广告类型">
              <a-select v-model="inventoryForm.adType" placeholder="选择广告类型">
                <a-option value="RewardedVideoAd">激励视频</a-option>
                <a-option value="InterstitialAd">插屏广告</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="adUnitId" label="广告位 ID">
              <a-input v-model="inventoryForm.adUnitId" placeholder="广告平台分配的 ID" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdList' })
import { ref, reactive, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAdStore } from '@/stores/ad.ts'
import { useAppStore } from '@/stores/app.ts'
import {
  createAdInventory, updateAdInventory, deleteAdInventory, enableAdInventory, disableAdInventory,
} from '@/api/ad.ts'
import type { AdInventory } from '@/types/drama.ts'

const adStore = useAdStore()
const appStore = useAppStore()
const loading = ref(false)
const togglingId = ref<string | null>(null)
const submitting = ref(false)

const inventoryModalVisible = ref(false)
const editingInventory = ref<AdInventory | null>(null)
const inventoryFormRef = ref()

const typeNameMap: Record<string, string> = {
  RewardedVideoAd: '激励视频',
  InterstitialAd: '插屏广告',
}

const inventoryForm = reactive({
  adName: '',
  adType: 'RewardedVideoAd',
  adUnitId: '',
})

const inventoryFormRules = {
  adName: [{ required: true, message: '请输入广告名称' }],
  adType: [{ required: true, message: '请选择广告类型' }],
  adUnitId: [{ required: true, message: '请输入广告位 ID' }],
}

const inventoryColumns = [
  { title: '广告名称', slotName: 'adName', width: 180 },
  { title: '广告类型', slotName: 'adType', width: 120 },
  { title: '广告位 ID', slotName: 'adUnitId', width: 200 },
  { title: '推送次数', slotName: 'pushCount', width: 100 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'operations', width: 120 },
]

function openAddInventory() {
  editingInventory.value = null
  Object.assign(inventoryForm, { adName: '', adType: 'RewardedVideoAd', adUnitId: '' })
  inventoryModalVisible.value = true
}

function openEditInventory(record: AdInventory) {
  editingInventory.value = record
  Object.assign(inventoryForm, {
    adName: record.adName,
    adType: record.adType,
    adUnitId: record.adUnitId,
  })
  inventoryModalVisible.value = true
}

async function handleSaveInventory() {
  const errors = await inventoryFormRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    if (editingInventory.value) {
      await updateAdInventory(editingInventory.value.id, { ...inventoryForm })
      Message.success('更新成功')
    } else {
      await createAdInventory({ ...inventoryForm, status: 1 })
      Message.success('创建成功')
    }
    inventoryModalVisible.value = false
    fetchList()
  } finally { submitting.value = false }
}

async function handleToggleInventory(record: AdInventory, enabled: boolean) {
  togglingId.value = record.id
  try {
    if (enabled) {
      await enableAdInventory(record.id)
    } else {
      await disableAdInventory(record.id)
    }
    record.status = enabled ? 1 : 0
    Message.success(enabled ? '已启用' : '已禁用')
  } catch {
    // 错误由拦截器处理
  } finally { togglingId.value = null }
}

async function handleDeleteInventory(record: AdInventory) {
  try {
    await deleteAdInventory(record.id)
    Message.success('已删除')
    fetchList()
  } catch {
    // 错误由拦截器处理
  }
}

async function fetchList() {
  if (!appStore.currentClientKey) {
    return
  }
  loading.value = true
  try {
    await adStore.fetchInventoryList()
  } catch {
    // 接口异常时静默处理
  } finally {
    loading.value = false
  }
}

watch(() => appStore.currentClientKey, (newVal) => {
  if (newVal) {
    fetchList()
  }
}, { immediate: true })
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.table-card { background: var(--mc-bg-card); border: 1px solid var(--mc-border); border-radius: var(--mc-radius-md); overflow: clip; }
.ad-name { font-size: 13px; font-weight: 600; color: var(--mc-text-primary); }
.type-badge { font-size: 12px; font-weight: 500; color: #5CBDC5; }
.ad-unit-id { font-size: 11px; color: var(--mc-text-tertiary); font-family: monospace; }
.row-actions { display: flex; gap: 4px; }
</style>
