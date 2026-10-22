<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">数据初始化</div>
        <div class="page-subtitle">手动触发数据聚合与报表同步，用于历史数据回补</div>
      </div>
    </div>

    <div class="table-card">
      <a-card title="一键全量初始化" :bordered="false">
        <template #extra>
          <a-tag color="red">推荐</a-tag>
        </template>
        <div class="init-form">
          <a-button type="primary" :loading="fullLoading" @click="handleFullInit" status="danger">
            一键全量初始化
          </a-button>
          <span class="init-hint">
            请求提交后由后端异步执行，不再等待 HTTP 响应完成；系统会自动按历史全量区间回填基础表与分析看板数据
          </span>
        </div>
        <div v-if="fullResult" class="init-result">
          <a-alert type="success">
            {{ fullResult.message }}，任务类型：{{ fullResult.taskName ?? '全量历史初始化任务' }}，任务 ID：{{ fullResult.taskId }}，日期范围：{{ fullResult.startDate }} ~
            {{ fullResult.endDate }}，提交时间：{{ fullResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>

      <a-card title="用户每日数据聚合（播放记录）" :bordered="false" style="margin-top: 16px">
        <template #extra>
          <a-tag color="blue">T+1 定时：每日 02:00 自动执行</a-tag>
        </template>
        <a-form :model="aggForm" layout="inline" class="init-form">
          <a-form-item label="开始日期">
            <a-date-picker v-model="aggForm.startDate" style="width: 200px" />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-date-picker v-model="aggForm.endDate" style="width: 200px" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="aggLoading" @click="handleAggregate">
              开始聚合
            </a-button>
          </a-form-item>
        </a-form>
        <div v-if="aggResult" class="init-result">
          <a-alert type="success">
            {{ aggResult.message }}，任务类型：{{ aggResult.taskName ?? '用户日聚合任务' }}，任务 ID：{{ aggResult.taskId }}，日期范围：{{ aggResult.startDate }} ~
            {{ aggResult.endDate }}，提交时间：{{ aggResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>

      <a-card title="事件日志聚合（变现+归因）" :bordered="false" style="margin-top: 16px">
        <template #extra>
          <a-tag color="blue">T+1 定时：每日 02:00 自动执行</a-tag>
        </template>
        <a-form :model="eventForm" layout="inline" class="init-form">
          <a-form-item label="开始日期">
            <a-date-picker v-model="eventForm.startDate" style="width: 200px" />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-date-picker v-model="eventForm.endDate" style="width: 200px" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="eventLoading" @click="handleEventAggregate">
              开始聚合
            </a-button>
          </a-form-item>
        </a-form>
        <div class="init-hint" style="margin-top: 8px">
          从 event_log 聚合变现字段（付费墙触达/解锁/广告/IAP收入）和归因字段（entry_source/ad_campaign_id）
        </div>
        <div v-if="eventResult" class="init-result">
          <a-alert type="success">
            {{ eventResult.message }}，任务类型：{{ eventResult.taskName ?? '事件日志聚合任务' }}，任务 ID：{{ eventResult.taskId }}，日期范围：{{ eventResult.startDate }} ~
            {{ eventResult.endDate }}，提交时间：{{ eventResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>

      <a-card title="App 维度聚合" :bordered="false" style="margin-top: 16px">
        <template #extra>
          <a-tag color="blue">T+1 定时：每日 02:00 自动执行</a-tag>
        </template>
        <a-form :model="appForm" layout="inline" class="init-form">
          <a-form-item label="开始日期">
            <a-date-picker v-model="appForm.startDate" style="width: 200px" />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-date-picker v-model="appForm.endDate" style="width: 200px" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="appLoading" @click="handleAppAggregate">
              开始聚合
            </a-button>
          </a-form-item>
        </a-form>
        <div class="init-hint" style="margin-top: 8px">
          从 user_profile_daily 聚合到 app_daily_stats（DAU/MAU/新增/完播率/解锁/收入等）
        </div>
        <div v-if="appResult" class="init-result">
          <a-alert type="success">
            {{ appResult.message }}，任务类型：{{ appResult.taskName ?? 'App维度聚合任务' }}，任务 ID：{{ appResult.taskId }}，日期范围：{{ appResult.startDate }} ~
            {{ appResult.endDate }}，提交时间：{{ appResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>

      <a-card title="广告报表同步" :bordered="false" style="margin-top: 16px">
        <template #extra>
          <a-tag color="blue">定时：每小时第 10 分钟自动执行</a-tag>
        </template>
        <div class="init-form">
          <a-button type="primary" :loading="syncLoading" @click="handleSyncReport">
            立即同步
          </a-button>
          <span class="init-hint">从 TikTok Business API 拉取最新广告报表数据</span>
        </div>
        <div v-if="syncResult" class="init-result">
          <a-alert type="success">
            {{ syncResult.message }}，任务类型：{{ syncResult.taskName ?? '广告报表同步任务' }}，任务 ID：{{ syncResult.taskId }}，状态：{{ syncResult.status }}，提交时间：{{ syncResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>

      <a-card title="自定义报表同步" :bordered="false" style="margin-top: 16px">
        <template #extra>
          <a-tag color="orange">手动同步</a-tag>
        </template>
        <a-form :model="backfillForm" layout="inline" class="init-form">
          <a-form-item label="开始日期">
            <a-date-picker v-model="backfillForm.startDate" style="width: 200px" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item label="结束日期">
            <a-date-picker v-model="backfillForm.endDate" style="width: 200px" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" status="danger" :loading="backfillLoading" @click="handleBackfillReport">
              开始同步
            </a-button>
          </a-form-item>
        </a-form>
        <div class="init-hint" style="margin-top: 8px">
          从 TikTok Business API 拉取自定义时间内的广告报表数据（最多支持 180 天）
        </div>
        <div v-if="backfillResult" class="init-result">
          <a-alert type="success">
            {{ backfillResult.message }}，任务类型：{{ backfillResult.taskName ?? '自定义报表同步任务' }}，任务 ID：{{ backfillResult.taskId }}，日期范围：{{ backfillResult.startDate }} ~
            {{ backfillResult.endDate }}，提交时间：{{ backfillResult.submittedAt }}
          </a-alert>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  aggregateUserDaily,
  aggregateEventLog,
  aggregateAppDaily,
  fullInit,
  syncAdReport,
  backfillAdReport,
} from '@/api/dataInit.ts'
import type {
  AdReportSyncResult,
  AsyncTaskResult,
} from '@/api/dataInit.ts'

const aggForm = ref({ startDate: '', endDate: '' })
const aggLoading = ref(false)
const aggResult = ref<AsyncTaskResult | null>(null)

const eventForm = ref({ startDate: '', endDate: '' })
const eventLoading = ref(false)
const eventResult = ref<AsyncTaskResult | null>(null)

const appForm = ref({ startDate: '', endDate: '' })
const appLoading = ref(false)
const appResult = ref<AsyncTaskResult | null>(null)

const fullLoading = ref(false)
const fullResult = ref<AsyncTaskResult | null>(null)

const syncLoading = ref(false)
const syncResult = ref<AdReportSyncResult | null>(null)

const backfillForm = ref({ startDate: '', endDate: '' })
const backfillLoading = ref(false)
const backfillResult = ref<AsyncTaskResult | null>(null)

async function handleAggregate() {
  if (!aggForm.value.startDate || !aggForm.value.endDate) {
    Message.warning('请选择开始日期和结束日期')
    return
  }
  aggLoading.value = true
  aggResult.value = null
  try {
    const res = await aggregateUserDaily(aggForm.value.startDate, aggForm.value.endDate)
    aggResult.value = res
    Message.success('用户日聚合已提交，后台异步执行中')
  } catch {
    Message.error('聚合失败')
  } finally {
    aggLoading.value = false
  }
}

async function handleEventAggregate() {
  if (!eventForm.value.startDate || !eventForm.value.endDate) {
    Message.warning('请选择开始日期和结束日期')
    return
  }
  eventLoading.value = true
  eventResult.value = null
  try {
    const res = await aggregateEventLog(eventForm.value.startDate, eventForm.value.endDate)
    eventResult.value = res
    Message.success('事件日志聚合已提交，后台异步执行中')
  } catch {
    Message.error('事件聚合失败')
  } finally {
    eventLoading.value = false
  }
}

async function handleAppAggregate() {
  if (!appForm.value.startDate || !appForm.value.endDate) {
    Message.warning('请选择开始日期和结束日期')
    return
  }
  appLoading.value = true
  appResult.value = null
  try {
    const res = await aggregateAppDaily(appForm.value.startDate, appForm.value.endDate)
    appResult.value = res
    Message.success('App维度聚合已提交，后台异步执行中')
  } catch {
    Message.error('App维度聚合失败')
  } finally {
    appLoading.value = false
  }
}

async function handleFullInit() {
  fullLoading.value = true
  fullResult.value = null
  try {
    const res = await fullInit()
    fullResult.value = res
    Message.success('全量历史初始化已提交，后台异步执行中')
  } catch {
    Message.error('全量历史初始化失败')
  } finally {
    fullLoading.value = false
  }
}

async function handleSyncReport() {
  syncLoading.value = true
  syncResult.value = null
  try {
    const res = await syncAdReport()
    syncResult.value = res
    Message.success('广告报表同步已提交，后台异步执行中')
  } catch {
    Message.error('同步失败')
  } finally {
    syncLoading.value = false
  }
}

async function handleBackfillReport() {
  if (!backfillForm.value.startDate || !backfillForm.value.endDate) {
    Message.warning('请选择开始日期和结束日期')
    return
  }
  backfillLoading.value = true
  backfillResult.value = null
  try {
    const res = await backfillAdReport(backfillForm.value.startDate, backfillForm.value.endDate)
    backfillResult.value = res
    Message.success('自定义报表同步已提交，后台异步执行中')
  } catch {
    Message.error('同步失败')
  } finally {
    backfillLoading.value = false
  }
}
</script>

<style scoped>
.init-form {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.init-hint {
  color: var(--color-text-3);
  font-size: 13px;
}

.init-result {
  margin-top: 12px;
}
</style>
