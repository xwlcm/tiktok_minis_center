<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">参数配置</div>
        <div class="page-subtitle">配置多臂老虎机算法的核心参数</div>
      </div>
      <div class="header-actions">
        <a-button @click="handleReset" status="warning" size="small">重置默认值</a-button>
        <a-button type="primary" size="small" :loading="saving" @click="handleSave">保存</a-button>
      </div>
    </div>

    <a-spin :loading="loading" class="w-full">
      <a-tabs v-if="config" default-active-key="basic">
        <!-- 基础配置 -->
        <a-tab-pane key="basic" title="基础配置">
          <a-form :model="config" layout="vertical" class="config-form">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="启用算法">
                  <a-switch v-model="config.isEnabled" :checked-value="1" :unchecked-value="0" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="ε 冷启动期">
                  <a-input-number v-model="config.epsilonColdStart" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="ε 正常期">
                  <a-input-number v-model="config.epsilonNormal" :min="0" :max="1" :step="0.01" :precision="4" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="冷启动基础阈值">
                  <a-input-number v-model="config.coldStartMinExposureBase" :min="1" :step="1" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="冷启动倍数">
                  <a-input-number v-model="config.coldStartFactor" :min="1" :step="1" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider>时间窗口权重（合计必须 = 1）</a-divider>
            <a-row :gutter="16">
              <a-col :span="4">
                <a-form-item label="5分钟">
                  <a-input-number v-model="config.weightWindow5m" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item label="30分钟">
                  <a-input-number v-model="config.weightWindow30m" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item label="2小时">
                  <a-input-number v-model="config.weightWindow2h" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item label="24小时">
                  <a-input-number v-model="config.weightWindow24h" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="4">
                <a-form-item label="7天">
                  <a-input-number v-model="config.weightWindow7d" :min="0" :max="1" :step="0.05" :precision="4" />
                </a-form-item>
              </a-col>
              <a-col :span="4" class="weight-sum">
                <span :class="{ 'sum-ok': windowSumOk, 'sum-error': !windowSumOk }">
                  合计: {{ windowSum.toFixed(4) }}
                </span>
              </a-col>
            </a-row>
          </a-form>
        </a-tab-pane>

        <!-- 维度配置 -->
        <a-tab-pane key="dimensions" title="维度配置">
          <a-table :data="config.dimensions" :pagination="false" size="small" row-key="id">
            <template #columns>
              <a-table-column title="维度名称" data-index="dimensionName" :width="140" />
              <a-table-column title="编码" data-index="dimensionCode" :width="140" />
              <a-table-column title="权重" :width="140">
                <template #cell="{ record }">
                  <a-input-number v-model="record.weight" :min="0" :max="1" :step="0.05" :precision="4" size="small" />
                </template>
              </a-table-column>
              <a-table-column title="启用" :width="80" align="center">
                <template #cell="{ record }">
                  <a-switch v-model="record.isEnabled" :checked-value="1" :unchecked-value="0" size="small" />
                </template>
              </a-table-column>
              <a-table-column title="计算器 Bean" data-index="calculatorBean" :width="200">
                <template #cell="{ record }">
                  <a-tag size="small" color="arcoblue">{{ record.calculatorBean }}</a-tag>
                </template>
              </a-table-column>
            </template>
          </a-table>
          <div class="dim-sum" :class="{ 'sum-ok': dimSumOk, 'sum-error': !dimSumOk }">
            维度权重合计: {{ dimSum.toFixed(4) }}
          </div>
        </a-tab-pane>
      </a-tabs>

      <a-empty v-else description="暂无配置数据，请先初始化算法配置" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { fetchAlgorithmConfig, updateAlgorithmConfig } from '@/api/adAlgorithm.ts'
import type { AdAlgorithmConfigVo, AdAlgorithmConfigUpdateBo } from '@/types/adAlgorithm.ts'

const config = ref<AdAlgorithmConfigVo | null>(null)
const loading = ref(false)
const saving = ref(false)

const windowSum = computed(() => {
  if (!config.value) return 0
  return (config.value.weightWindow5m ?? 0) + (config.value.weightWindow30m ?? 0)
    + (config.value.weightWindow2h ?? 0) + (config.value.weightWindow24h ?? 0)
    + (config.value.weightWindow7d ?? 0)
})
const windowSumOk = computed(() => Math.abs(windowSum.value - 1) < 0.001)

const dimSum = computed(() => {
  if (!config.value?.dimensions) return 0
  return config.value.dimensions.reduce((sum, d) => sum + (d.weight ?? 0), 0)
})
const dimSumOk = computed(() => Math.abs(dimSum.value - 1) < 0.001)

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAlgorithmConfig()
    if (res) {
      // 后端 BigDecimal 序列化为字符串，需转为 number 供 InputNumber 使用
      res.epsilonColdStart = Number(res.epsilonColdStart) || 0
      res.epsilonNormal = Number(res.epsilonNormal) || 0
      res.weightWindow5m = Number(res.weightWindow5m) || 0
      res.weightWindow30m = Number(res.weightWindow30m) || 0
      res.weightWindow2h = Number(res.weightWindow2h) || 0
      res.weightWindow24h = Number(res.weightWindow24h) || 0
      res.weightWindow7d = Number(res.weightWindow7d) || 0
      if (res.dimensions) {
        res.dimensions.forEach((d: any) => { d.weight = Number(d.weight) || 0 })
      }
    }
    config.value = res ?? null
  } catch (e) {
    console.error('加载算法配置失败', e)
    config.value = null
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!config.value) return
  if (!windowSumOk.value) {
    Message.error('时间窗口权重合计必须等于 1')
    return
  }
  if (!dimSumOk.value) {
    Message.error('维度权重合计必须等于 1')
    return
  }

  saving.value = true
  try {
    const bo: AdAlgorithmConfigUpdateBo = {
      isEnabled: config.value.isEnabled,
      epsilonColdStart: config.value.epsilonColdStart,
      epsilonNormal: config.value.epsilonNormal,
      coldStartMinExposureBase: config.value.coldStartMinExposureBase,
      coldStartFactor: config.value.coldStartFactor,
      weightWindow5m: config.value.weightWindow5m,
      weightWindow30m: config.value.weightWindow30m,
      weightWindow2h: config.value.weightWindow2h,
      weightWindow24h: config.value.weightWindow24h,
      weightWindow7d: config.value.weightWindow7d,
      dimensions: config.value.dimensions.map(d => ({
        id: d.id,
        weight: d.weight,
        isEnabled: d.isEnabled,
      })),
    }
    await updateAlgorithmConfig(bo)
    Message.success('配置已保存')
  } catch (e: any) {
    Message.error(e?.response?.data?.msg ?? '保存失败')
  } finally {
    saving.value = false
  }
}

function handleReset() {
  Modal.confirm({
    title: '确认重置',
    content: '将回滚到 V3 方案默认值（ε=0.5/0.05、窗口 45/25/15/10/5、维度 40/25/15/10/10），确定？',
    onOk: () => {
      if (!config.value) return
      config.value.epsilonColdStart = 0.5
      config.value.epsilonNormal = 0.05
      config.value.coldStartMinExposureBase = 10
      config.value.coldStartFactor = 3
      config.value.weightWindow5m = 0.45
      config.value.weightWindow30m = 0.25
      config.value.weightWindow2h = 0.15
      config.value.weightWindow24h = 0.10
      config.value.weightWindow7d = 0.05
      if (config.value.dimensions && config.value.dimensions.length >= 5) {
        config.value.dimensions[0].weight = 0.40
        config.value.dimensions[1].weight = 0.25
        config.value.dimensions[2].weight = 0.15
        config.value.dimensions[3].weight = 0.10
        config.value.dimensions[4].weight = 0.10
      }
      Message.info('已重置为默认值，请点击保存生效')
    },
  })
}

onMounted(() => loadData())
</script>

<style scoped>
.page-container { padding: 0; }
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.92); }
.page-subtitle { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }
.config-form { max-width: 900px; }
.weight-sum { display: flex; align-items: flex-end; padding-bottom: 24px; font-size: 13px; font-weight: 500; }
.dim-sum { margin-top: 12px; font-size: 13px; font-weight: 500; }
.sum-ok { color: #36D399; }
.sum-error { color: #E0486D; }
.w-full { width: 100%; }
</style>
