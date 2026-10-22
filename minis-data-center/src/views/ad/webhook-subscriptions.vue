<template>
  <div class="page-shell webhook-page">
    <div class="hero-panel">
      <div>
        <div class="page-title">数据订阅</div>
        <div class="page-subtitle">按 tenant + clientKey 管理 TikTok webhook 订阅、事件日志和幂等处理结果</div>
      </div>
      <div class="page-actions">
        <a-button @click="reloadAll" :loading="pageLoading">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
        <a-button type="primary" @click="openCreateModal">
          <template #icon><icon-plus /></template>
          创建订阅
        </a-button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">授权记录</div>
        <div class="summary-value">{{ accountList.length }}</div>
        <div class="summary-hint">当前应用可用于创建订阅的来源账号</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">订阅总数</div>
        <div class="summary-value">{{ subscriptionTotal }}</div>
        <div class="summary-hint">当前筛选条件下的订阅结果数</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">事件总数</div>
        <div class="summary-value">{{ eventTotal }}</div>
        <div class="summary-hint">当前筛选条件下的 webhook 事件数</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">当前 clientKey</div>
        <div class="summary-value">{{ appStore.currentClientKey || '—' }}</div>
        <div class="summary-hint">所有查询都自动受 tenant + clientKey 隔离</div>
      </div>
    </div>

    <div class="hint-card">
      <div class="hint-title">支持的订阅对象</div>
      <div class="support-grid">
        <div v-for="item in supportItems" :key="item.key" class="support-item">
          <strong>{{ item.label }}</strong>
          <span>{{ item.hint }}</span>
        </div>
      </div>
    </div>

    <a-tabs v-model:active-key="activeTab" class="view-tabs" type="line">
      <a-tab-pane key="subscriptions" title="订阅列表">
        <div class="toolbar">
          <a-select
            v-model="subscriptionEntityFilter"
            placeholder="订阅类型"
            allow-clear
            style="width: 220px"
            @change="handleSubscriptionFilter"
          >
            <a-option v-for="item in entityOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-option>
          </a-select>
          <a-select
            v-model="subscriptionStatusFilter"
            placeholder="订阅状态"
            allow-clear
            style="width: 160px"
            @change="handleSubscriptionFilter"
          >
            <a-option v-for="item in subscriptionStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-option>
          </a-select>
          <a-button @click="handleSubscriptionFilter">筛选</a-button>
          <a-button @click="resetSubscriptionFilter">重置</a-button>
        </div>

        <div class="table-card">
          <a-table
            :columns="subscriptionColumns"
            :data="subscriptionRows"
            :loading="subscriptionLoading"
            :pagination="{
              total: subscriptionTotal,
              current: subscriptionPage,
              pageSize: subscriptionPageSize,
              showTotal: true,
              showPageSize: true,
            }"
            :scroll="{ x: 1680 }"
            row-key="id"
            :bordered="false"
            @page-change="handleSubscriptionPageChange"
          >
            <template #entity="{ record }">
              <div class="cell-stack">
                <strong>{{ entityLabel(record.subscribeEntity) }}</strong>
                <span class="cell-subtitle">{{ record.subscribeEntity }}</span>
              </div>
            </template>
            <template #status="{ record }">
              <a-tag :color="subscriptionStatusMeta(record.status).color" size="small">
                {{ subscriptionStatusMeta(record.status).label }}
              </a-tag>
            </template>
            <template #sourceAccount="{ record }">
              <div class="cell-stack">
                <strong>{{ sourceAccountLabel(record.sourceAccountId) }}</strong>
                <span class="cell-subtitle">sourceAccountId：{{ record.sourceAccountId ?? '—' }}</span>
              </div>
            </template>
            <template #scope="{ record }">
              <a-tooltip :content="subscriptionScopeDetail(record)" position="top">
                <span class="ellipsis-cell">{{ subscriptionScopeSummary(record) }}</span>
              </a-tooltip>
            </template>
            <template #notifyFrequency="{ record }">
              <span>{{ record.notifyFrequency || '—' }}</span>
            </template>
            <template #externalSubscriptionId="{ record }">
              <span class="mono-cell">{{ record.externalSubscriptionId || '—' }}</span>
            </template>
            <template #callbackUrl="{ record }">
              <a-tooltip :content="record.callbackUrl || ''" position="top">
                <span class="mono-cell ellipsis-cell">{{ truncate(record.callbackUrl, 42) }}</span>
              </a-tooltip>
            </template>
            <template #lastWebhookAt="{ record }">
              <span>{{ formatDateTime(record.lastWebhookAt) }}</span>
            </template>
            <template #lastSyncedAt="{ record }">
              <span>{{ formatDateTime(record.lastSyncedAt) }}</span>
            </template>
            <template #operations="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="openDetail('subscription', record)">
                  <template #icon><icon-eye /></template>
                  详情
                </a-button>
                <a-popconfirm
                  v-if="record.status !== 2"
                  content="确定取消该订阅？平台会先取消外部订阅，再更新本地状态。"
                  @ok="handleCancelSubscription(record)"
                >
                  <a-button type="text" size="small" status="danger">取消</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <a-tab-pane key="events" title="事件日志">
        <div class="toolbar">
          <a-select
            v-model="eventSubscriptionFilter"
            placeholder="订阅 ID"
            allow-clear
            allow-search
            style="width: 280px"
            @change="handleEventFilter"
          >
            <a-option v-for="item in subscriptionOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-option>
          </a-select>
          <a-select
            v-model="eventStatusFilter"
            placeholder="处理状态"
            allow-clear
            style="width: 160px"
            @change="handleEventFilter"
          >
            <a-option v-for="item in eventStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-option>
          </a-select>
          <a-button @click="handleEventFilter">筛选</a-button>
          <a-button @click="resetEventFilter">重置</a-button>
        </div>

        <div class="table-card">
          <a-table
            :columns="eventColumns"
            :data="eventRows"
            :loading="eventLoading"
            :pagination="{
              total: eventTotal,
              current: eventPage,
              pageSize: eventPageSize,
              showTotal: true,
              showPageSize: true,
            }"
            :scroll="{ x: 1560 }"
            row-key="id"
            :bordered="false"
            @page-change="handleEventPageChange"
          >
            <template #entity="{ record }">
              <div class="cell-stack">
                <strong>{{ entityLabel(record.subscribeEntity) }}</strong>
                <span class="cell-subtitle">{{ record.subscribeEntity || '—' }}</span>
              </div>
            </template>
            <template #processingStatus="{ record }">
              <a-tag :color="processingStatusMeta(record.processingStatus).color" size="small">
                {{ processingStatusMeta(record.processingStatus).label }}
              </a-tag>
            </template>
            <template #effectStatus="{ record }">
              <a-tag :color="effectStatusMeta(record.effectStatus).color" size="small">
                {{ effectStatusMeta(record.effectStatus).label }}
              </a-tag>
            </template>
            <template #eventTime="{ record }">
              <span>{{ formatUnixTime(record.eventTime) }}</span>
            </template>
            <template #processedAt="{ record }">
              <span>{{ formatDateTime(record.processedAt) }}</span>
            </template>
            <template #errorMsg="{ record }">
              <a-tooltip v-if="record.errorMsg" :content="record.errorMsg" position="top">
                <span class="ellipsis-cell error-text">{{ record.errorMsg }}</span>
              </a-tooltip>
              <span v-else>—</span>
            </template>
            <template #operations="{ record }">
              <a-button type="text" size="small" @click="openDetail('event', record)">
                <template #icon><icon-eye /></template>
                详情
              </a-button>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
    </a-tabs>

    <a-modal
      v-model:visible="createVisible"
      title="创建订阅"
      width="1040px"
      :body-style="{ maxHeight: '76vh', overflow: 'auto' }"
      :ok-loading="createSubmitting"
      @ok="handleCreateSubscription"
      @cancel="closeCreateModal"
    >
      <a-form ref="createFormRef" :model="createForm" layout="vertical">
        <a-alert type="info" class="modal-hint" :show-icon="false">
          先选择来源授权记录，再按订阅对象填写范围字段。平台说明里的 AD/AD_GROUP 在系统内统一按 AD_GROUP 处理。
        </a-alert>
        <div class="entity-guide">
          <div class="entity-guide-header">
            <div>
              <div class="entity-guide-title">{{ currentEntityGuide.title }}</div>
              <div class="entity-guide-summary">{{ currentEntityGuide.summary }}</div>
            </div>
            <a-tag size="small" color="arcoblue">{{ currentEntityGuide.badge }}</a-tag>
          </div>
          <div class="entity-guide-grid">
            <div v-for="tip in currentEntityGuide.tips" :key="tip.label" class="entity-guide-item">
              <strong>{{ tip.label }}</strong>
              <span>{{ tip.text }}</span>
            </div>
          </div>
        </div>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="subscribeEntity" label="订阅类型（必选）" :rules="[{ required: true, message: '请选择订阅类型' }]">
              <a-select v-model="createForm.subscribeEntity" placeholder="请选择订阅类型" @change="handleEntityChange">
                <a-option v-for="item in entityOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="sourceAccountId" label="来源授权记录（必选）" :rules="[{ required: true, message: '请选择来源授权记录' }]">
              <a-select v-model="createForm.sourceAccountId" placeholder="请选择已绑定的广告帐户">
                <a-option v-for="account in accountOptions" :key="account.value" :value="account.value">
                  {{ account.label }}
                </a-option>
              </a-select>
              <template #extra>该授权记录必须包含可用 access_token，后端会据此创建/取消订阅。</template>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="sourceAdvertiserId" label="来源 advertiser_id（可选）">
              <a-input v-model="createForm.sourceAdvertiserId" placeholder="可用于补充来源广告主 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="notifyFrequency" label="通知频率（仅报表变更生效）">
              <a-select v-model="createForm.notifyFrequency" placeholder="仅报表变更订阅会使用">
                <a-option value="5_MINUTE">5_MINUTE</a-option>
                <a-option value="15_MINUTE">15_MINUTE</a-option>
                <a-option value="30_MINUTE">30_MINUTE</a-option>
                <a-option value="60_MINUTE">60_MINUTE</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-if="createForm.subscribeEntity === 'REPORT_DATA_CHANGE'">
          <a-col :span="24">
            <a-form-item label="advertiser_ids（至少 1 个）">
              <a-textarea
                v-model="createForm.advertiserIdsText"
                :auto-size="{ minRows: 3, maxRows: 5 }"
                placeholder="每行或每个逗号分隔一个 advertiser_id。至少填写一个。"
              />
              <template #extra>支持逗号、分号或换行分隔，系统会自动去重并按广告主批量订阅。</template>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-else-if="createForm.subscribeEntity === 'LEAD'">
          <a-col :span="12">
            <a-form-item label="advertiser_id（可选）">
              <a-input v-model="createForm.advertiserId" placeholder="即时表单或私信线索的广告主 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="library_id（可选）">
              <a-input v-model="createForm.libraryId" placeholder="可选：表单库 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="createForm.leadSource !== 'DIRECT_MESSAGE'">
            <a-form-item label="page_id（仅 INSTANT_FORM）">
              <a-input v-model="createForm.pageId" placeholder="可选：即时表单页面 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="lead_source（可选）">
              <a-select v-model="createForm.leadSource" placeholder="可选：线索来源" @change="handleLeadSourceChange">
                <a-option v-for="item in leadSourceOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <div class="field-hint">
              DIRECT_MESSAGE 不支持 page_id；如果你要订阅即时表单线索，可保持 INSTANT_FORM 并按需填写 page_id。
            </div>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-else-if="createForm.subscribeEntity === 'AD_GROUP'">
          <a-col :span="12">
            <a-form-item label="advertiser_id（必填）">
              <a-input v-model="createForm.advertiserId" placeholder="广告主 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="adgroup_id（必填）">
              <a-input v-model="createForm.adgroupId" placeholder="广告组 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="ad_id（可选）">
              <a-input v-model="createForm.adId" placeholder="可选：广告 ID" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-else-if="createForm.subscribeEntity === 'CREATIVE_FATIGUE'">
          <a-col :span="12">
            <a-form-item label="advertiser_id（必填）">
              <a-input v-model="createForm.advertiserId" placeholder="广告主 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="adgroup_id（可选）">
              <a-input v-model="createForm.adgroupId" placeholder="可选：广告组 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="ad_id（可选）">
              <a-input v-model="createForm.adId" placeholder="可选：广告 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <div class="field-hint">
              该类型可以只订阅 advertiser 级别，也可以继续细化到 adgroup 或 ad 粒度。
            </div>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-else-if="createForm.subscribeEntity === 'AD_ACCOUNT_SUSPENSION'">
          <a-col :span="12">
            <a-form-item label="订阅范围（必选）">
              <a-select v-model="createForm.suspensionScopeMode" placeholder="请选择订阅范围" @change="handleSuspensionScopeChange">
                <a-option v-for="item in suspensionScopeOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </a-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="createForm.suspensionScopeMode === 'bc'">
            <a-form-item label="bc_id（必填）">
              <a-input v-model="createForm.bcId" placeholder="商务中心 ID" />
            </a-form-item>
          </a-col>
          <a-col :span="12" v-else>
            <a-form-item label="advertiser_ids（必填）">
              <a-input v-model="createForm.advertiserIdsText" placeholder="可选：逗号分隔的 advertiser_id 列表" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <div class="field-hint">
              只能选择一个范围：bc_id 用于订阅某个商务中心下的全部账号，advertiser_ids 用于订阅分散在不同商务中心的指定账号。
            </div>
          </a-col>
        </a-row>

        <a-row :gutter="16" v-else-if="createForm.subscribeEntity === 'API_SERVICE_STATUS'">
          <a-col :span="24">
            <a-form-item label="product_filters（可选）">
              <a-textarea
                v-model="createForm.productFiltersText"
                :auto-size="{ minRows: 3, maxRows: 5 }"
                placeholder="每行或每个逗号分隔一个产品名，例如 REPORTING_API / CAMPAIGN_API / EVENTS_API。留空表示全部产品。"
              />
              <template #extra>
                仅支持 {{ apiServiceProductOptions.join('、') }}。留空表示订阅所有 API 产品。
              </template>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="扩展字段 JSON（可选）">
              <a-textarea
                v-model="createForm.extraDetailText"
                :auto-size="{ minRows: 3, maxRows: 6 }"
                placeholder='{"custom_key":"value"}'
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-drawer
      v-model:visible="detailVisible"
      :width="920"
      :footer="false"
      unmount-on-close
      :title="detailMode === 'subscription' ? '订阅详情' : '事件详情'"
    >
      <template v-if="selectedSubscriptionDetail">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="订阅 ID">{{ selectedSubscriptionDetail.id }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="subscriptionStatusMeta(selectedSubscriptionDetail.status).color" size="small">
              {{ subscriptionStatusMeta(selectedSubscriptionDetail.status).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="订阅类型">{{ entityLabel(selectedSubscriptionDetail.subscribeEntity) }}</a-descriptions-item>
          <a-descriptions-item label="外部订阅 ID">{{ selectedSubscriptionDetail.externalSubscriptionId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="来源账号">{{ sourceAccountLabel(selectedSubscriptionDetail.sourceAccountId) }}</a-descriptions-item>
          <a-descriptions-item label="来源 advertiser_id">{{ selectedSubscriptionDetail.sourceAdvertiserId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="通知频率">{{ selectedSubscriptionDetail.notifyFrequency || '—' }}</a-descriptions-item>
          <a-descriptions-item label="callback_token">{{ selectedSubscriptionDetail.callbackToken || '—' }}</a-descriptions-item>
          <a-descriptions-item label="回调地址" :span="2">
            <span class="mono-cell">{{ selectedSubscriptionDetail.callbackUrl || '—' }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="最近回调">{{ formatDateTime(selectedSubscriptionDetail.lastWebhookAt) }}</a-descriptions-item>
          <a-descriptions-item label="最近同步">{{ formatDateTime(selectedSubscriptionDetail.lastSyncedAt) }}</a-descriptions-item>
          <a-descriptions-item label="最近错误码">{{ selectedSubscriptionDetail.lastErrorCode || '—' }}</a-descriptions-item>
          <a-descriptions-item label="最近错误信息">{{ selectedSubscriptionDetail.lastErrorMsg || '—' }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatDateTime(selectedSubscriptionDetail.createTime) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDateTime(selectedSubscriptionDetail.updateTime) }}</a-descriptions-item>
          <a-descriptions-item label="订阅详情" :span="2">
            <pre class="json-block">{{ prettyJson(selectedSubscriptionDetail.subscriptionDetail) }}</pre>
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-else-if="selectedEventDetail">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="事件 ID">{{ selectedEventDetail.id }}</a-descriptions-item>
          <a-descriptions-item label="订阅 ID">{{ selectedEventDetail.subscriptionId ?? '—' }}</a-descriptions-item>
          <a-descriptions-item label="订阅类型">{{ entityLabel(selectedEventDetail.subscribeEntity) }}</a-descriptions-item>
          <a-descriptions-item label="外部订阅 ID">{{ selectedEventDetail.externalSubscriptionId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="request_id">{{ selectedEventDetail.requestId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="object">{{ selectedEventDetail.objectType ?? '—' }}</a-descriptions-item>
          <a-descriptions-item label="处理状态">
            <a-tag :color="processingStatusMeta(selectedEventDetail.processingStatus).color" size="small">
              {{ processingStatusMeta(selectedEventDetail.processingStatus).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="副作用状态">
            <a-tag :color="effectStatusMeta(selectedEventDetail.effectStatus).color" size="small">
              {{ effectStatusMeta(selectedEventDetail.effectStatus).label }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="事件时间">{{ formatUnixTime(selectedEventDetail.eventTime) }}</a-descriptions-item>
          <a-descriptions-item label="处理时间">{{ formatDateTime(selectedEventDetail.processedAt) }}</a-descriptions-item>
          <a-descriptions-item label="错误码">{{ selectedEventDetail.errorCode || '—' }}</a-descriptions-item>
          <a-descriptions-item label="错误信息">{{ selectedEventDetail.errorMsg || '—' }}</a-descriptions-item>
          <a-descriptions-item label="回调 token">{{ selectedEventDetail.callbackToken || '—' }}</a-descriptions-item>
          <a-descriptions-item label="幂等键">{{ selectedEventDetail.dedupKey || '—' }}</a-descriptions-item>
          <a-descriptions-item label="原始 payload" :span="2">
            <pre class="json-block">{{ prettyJson(selectedEventDetail.rawPayload) }}</pre>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'WebhookSubscriptions' })

import { computed, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useAppStore } from '@/stores/app.ts'
import { fetchAdAccountList } from '@/api/adAccount.ts'
import {
  cancelTikTokWebhookSubscription,
  createTikTokWebhookSubscription,
  fetchTikTokWebhookEvents,
  fetchTikTokWebhookSubscriptions,
  type TikTokWebhookEventRecord,
  type TikTokWebhookSubscriptionPayload,
  type TikTokWebhookSubscriptionRecord,
} from '@/api/tiktokWebhook.ts'

type DetailMode = 'subscription' | 'event'

interface CreateFormState {
  subscribeEntity: string
  sourceAccountId: number | undefined
  sourceAdvertiserId: string
  notifyFrequency: string
  advertiserId: string
  advertiserIdsText: string
  libraryId: string
  pageId: string
  adId: string
  adgroupId: string
  bcId: string
  leadSource: string
  suspensionScopeMode: 'bc' | 'advertisers'
  productFiltersText: string
  extraDetailText: string
}

interface SelectOption {
  value: string | number
  label: string
}

const appStore = useAppStore()

const activeTab = ref<'subscriptions' | 'events'>('subscriptions')
const pageLoading = ref(false)

const accountList = ref<{ id: number; authUserName?: string | null; clientKey?: string | null; status?: number | null }[]>([])

const subscriptionRows = ref<TikTokWebhookSubscriptionRecord[]>([])
const subscriptionLoading = ref(false)
const subscriptionTotal = ref(0)
const subscriptionPage = ref(1)
const subscriptionPageSize = ref(10)
const subscriptionEntityFilter = ref<string | undefined>(undefined)
const subscriptionStatusFilter = ref<number | undefined>(undefined)

const eventRows = ref<TikTokWebhookEventRecord[]>([])
const eventLoading = ref(false)
const eventTotal = ref(0)
const eventPage = ref(1)
const eventPageSize = ref(10)
const eventSubscriptionFilter = ref<number | undefined>(undefined)
const eventStatusFilter = ref<string | undefined>(undefined)

const createVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref()
const createForm = reactive<CreateFormState>({
  subscribeEntity: 'REPORT_DATA_CHANGE',
  sourceAccountId: undefined,
  sourceAdvertiserId: '',
  notifyFrequency: '5_MINUTE',
  advertiserId: '',
  advertiserIdsText: '',
  libraryId: '',
  pageId: '',
  adId: '',
  adgroupId: '',
  bcId: '',
  leadSource: 'INSTANT_FORM',
  suspensionScopeMode: 'bc',
  productFiltersText: '',
  extraDetailText: '{}',
})

const detailVisible = ref(false)
const detailMode = ref<DetailMode>('subscription')
const selectedDetail = ref<TikTokWebhookSubscriptionRecord | TikTokWebhookEventRecord | null>(null)
const selectedSubscriptionDetail = computed(() =>
  detailMode.value === 'subscription' ? (selectedDetail.value as TikTokWebhookSubscriptionRecord | null) : null,
)
const selectedEventDetail = computed(() =>
  detailMode.value === 'event' ? (selectedDetail.value as TikTokWebhookEventRecord | null) : null,
)

const supportItems = [
  { key: 'REPORT_DATA_CHANGE', label: '报表指标变动', hint: 'advertiser_ids + notify_frequency，支持按广告主批量订阅' },
  { key: 'LEAD', label: '新线索', hint: 'advertiser_id / library_id / page_id / lead_source' },
  { key: 'AD_GROUP', label: '广告审核状态', hint: '系统内统一按 AD_GROUP 处理 AD/AD_GROUP' },
  { key: 'CREATIVE_FATIGUE', label: '广告疲劳状态', hint: 'advertiser_id + adgroup_id / ad_id' },
  { key: 'AD_ACCOUNT_SUSPENSION', label: '广告账户暂时停用', hint: 'bc_id 或 advertiser_ids 二选一' },
  { key: 'API_SERVICE_STATUS', label: 'API 服务状态', hint: 'product_filters 可限定监控产品' },
]

const entityOptions: SelectOption[] = [
  { value: 'REPORT_DATA_CHANGE', label: '报表指标变动' },
  { value: 'LEAD', label: '新线索' },
  { value: 'AD_GROUP', label: '广告审核状态（AD/AD_GROUP）' },
  { value: 'CREATIVE_FATIGUE', label: '广告疲劳状态' },
  { value: 'AD_ACCOUNT_SUSPENSION', label: '广告账户暂时停用' },
  { value: 'API_SERVICE_STATUS', label: 'API 服务状态' },
]

const leadSourceOptions: SelectOption[] = [
  { value: 'INSTANT_FORM', label: 'INSTANT_FORM' },
  { value: 'DIRECT_MESSAGE', label: 'DIRECT_MESSAGE' },
]

const suspensionScopeOptions: SelectOption[] = [
  { value: 'bc', label: '按商务中心 bc_id' },
  { value: 'advertisers', label: '按 advertiser_ids' },
]

const subscriptionStatusOptions: SelectOption[] = [
  { value: 0, label: '待创建' },
  { value: 1, label: '已启用' },
  { value: 2, label: '已取消' },
  { value: 3, label: '失败' },
]

const eventStatusOptions: SelectOption[] = [
  { value: 'PENDING', label: '待处理' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'SUCCESS', label: '已处理' },
  { value: 'FAILED', label: '失败' },
  { value: 'IGNORED', label: '已忽略' },
]

const apiServiceProductOptions = [
  'BUSINESS_CENTER_API',
  'CREATIVES_API',
  'CATALOG_API',
  'TIKTOK_STORE_API',
  'CAMPAIGN_API',
  'REPORTING_API',
  'AUDIENCE_API',
  'STREAMING_API',
  'EVENTS_API',
  'ACCOUNTS_API',
  'MENTIONS_API',
  'TIKTOK_ONE_API',
  'DISCOVERY_API',
  'SPARK_RECOMMEND_API',
  'BUSINESS_MESSAGING_API',
] as const

const apiServiceProductSet = new Set<string>(apiServiceProductOptions)

const entityGuideMap = {
  REPORT_DATA_CHANGE: {
    title: '报表指标变动',
    summary: '订阅 advertiser 维度的 spend、impressions、clicks 或 video_play_actions 变化。',
    badge: '按广告主批量订阅',
    tips: [
      { label: '必填', text: 'advertiser_ids 至少 1 个，支持逗号或换行分隔。' },
      { label: '频率', text: 'notify_frequency 可选，默认 5_MINUTE。' },
      { label: '联动', text: '收到变更后会触发 advertiser 维度报表刷新。' },
    ],
  },
  LEAD: {
    title: '新线索',
    summary: '订阅即时表单或私信线索的新增事件，支持 advertiser_id 或 library_id 入口。',
    badge: 'CRM / 线索同步',
    tips: [
      { label: '必填', text: 'advertiser_id 或 library_id 至少填写一个。' },
      { label: '来源', text: 'INSTANT_FORM 可填写 page_id；DIRECT_MESSAGE 不支持 page_id。' },
      { label: '可选', text: 'lead_source 可用于缩小线索来源范围。' },
    ],
  },
  AD_GROUP: {
    title: '广告审核状态',
    summary: '订阅广告组或广告级审核状态变化，后端会将 AD/AD_GROUP 统一映射处理。',
    badge: '审核回调',
    tips: [
      { label: '必填', text: 'advertiser_id 和 adgroup_id 都需要填写。' },
      { label: '可选', text: 'ad_id 可用于进一步缩小到单个广告。' },
      { label: '说明', text: '订阅时平台字段按 AD/AD_GROUP 约定处理。' },
    ],
  },
  CREATIVE_FATIGUE: {
    title: '广告疲劳状态',
    summary: '订阅广告账户、广告组或广告粒度的创意疲劳状态变化。',
    badge: '疲劳监控',
    tips: [
      { label: '必填', text: 'advertiser_id 必填。' },
      { label: '范围', text: 'adgroup_id / ad_id 可以不填，也可以按更细粒度收窄。' },
      { label: '说明', text: '触发条件是 TikTok 检测到创意疲劳。' },
    ],
  },
  AD_ACCOUNT_SUSPENSION: {
    title: '广告账户暂时停用',
    summary: '订阅商务中心或广告账户维度的暂时停用/解除停用状态。',
    badge: '账号风控',
    tips: [
      { label: '二选一', text: '只能选择 bc_id 或 advertiser_ids 其中一种范围。' },
      { label: '商务中心', text: 'bc_id 适合订阅某个商务中心下的所有广告账户。' },
      { label: '广告账户', text: 'advertiser_ids 适合不同商务中心下的指定账户。' },
    ],
  },
  API_SERVICE_STATUS: {
    title: 'API 服务状态',
    summary: '订阅 TikTok API 产品的突发事件、更新与恢复状态。',
    badge: '平台健康',
    tips: [
      { label: '可选', text: 'product_filters 为空时表示订阅全部 API 产品。' },
      { label: '限制', text: `只允许填写 ${apiServiceProductOptions.join('、')}。` },
      { label: '说明', text: '适合监控报表、广告、素材和消息通道的可用性。' },
    ],
  },
} as const

const currentEntityGuide = computed(
  () => entityGuideMap[createForm.subscribeEntity as keyof typeof entityGuideMap] ?? entityGuideMap.REPORT_DATA_CHANGE,
)

const subscriptionColumns = [
  { title: '订阅类型', slotName: 'entity', width: 190 },
  { title: '状态', slotName: 'status', width: 100, align: 'center' as const },
  { title: '来源账号', slotName: 'sourceAccount', width: 220 },
  { title: '订阅范围', slotName: 'scope', width: 340, ellipsis: true },
  { title: '通知频率', slotName: 'notifyFrequency', width: 110, align: 'center' as const },
  { title: '外部订阅 ID', slotName: 'externalSubscriptionId', width: 180 },
  { title: '回调地址', slotName: 'callbackUrl', width: 260, ellipsis: true },
  { title: '最近回调', slotName: 'lastWebhookAt', width: 160 },
  { title: '最近同步', slotName: 'lastSyncedAt', width: 160 },
  { title: '操作', slotName: 'operations', width: 140, fixed: 'right' as const },
]

const eventColumns = [
  { title: '对象', slotName: 'entity', width: 170 },
  { title: '处理状态', slotName: 'processingStatus', width: 100, align: 'center' as const },
  { title: '副作用', slotName: 'effectStatus', width: 88, align: 'center' as const },
  { title: '订阅 ID', dataIndex: 'subscriptionId', width: 120 },
  { title: 'request_id', dataIndex: 'requestId', width: 160 },
  { title: '事件时间', slotName: 'eventTime', width: 170 },
  { title: '处理时间', slotName: 'processedAt', width: 170 },
  { title: '错误信息', slotName: 'errorMsg', width: 260, ellipsis: true },
  { title: '操作', slotName: 'operations', width: 96, fixed: 'right' as const },
]

const accountOptions = computed<SelectOption[]>(() =>
  accountList.value.map(account => ({
    value: account.id,
    label: `${account.authUserName || '未命名授权'} · ${account.clientKey || '—'} · #${account.id}`,
  })),
)

const subscriptionOptions = computed<SelectOption[]>(() =>
  subscriptionRows.value.map(item => ({
    value: item.id,
    label: `#${item.id} · ${entityLabel(item.subscribeEntity)} · ${subscriptionStatusMeta(item.status).label}`,
  })),
)

const entityMap: Record<string, string> = {
  REPORT_DATA_CHANGE: '报表指标变动',
  LEAD: '新线索',
  AD_GROUP: '广告审核状态',
  CREATIVE_FATIGUE: '广告疲劳状态',
  AD_ACCOUNT_SUSPENSION: '广告账户暂时停用',
  API_SERVICE_STATUS: 'API 服务状态',
}

function entityLabel(entity?: string | null) {
  if (!entity) return '—'
  return entityMap[entity] || entity
}

function subscriptionStatusMeta(status: number) {
  return (
    {
      0: { label: '待创建', color: 'gray' },
      1: { label: '已启用', color: 'green' },
      2: { label: '已取消', color: 'orangered' },
      3: { label: '失败', color: 'red' },
    }[status] || { label: '未知', color: 'gray' }
  )
}

function processingStatusMeta(status: number) {
  return (
    {
      0: { label: '待处理', color: 'gray' },
      1: { label: '处理中', color: 'arcoblue' },
      2: { label: '已处理', color: 'green' },
      3: { label: '失败', color: 'red' },
      4: { label: '忽略', color: 'orange' },
    }[status] || { label: '未知', color: 'gray' }
  )
}

function effectStatusMeta(status: number) {
  return (
    {
      0: { label: '未触发', color: 'gray' },
      1: { label: '已触发', color: 'green' },
    }[status] || { label: '未知', color: 'gray' }
  )
}

function sourceAccountLabel(accountId?: number | null) {
  if (!accountId) return '—'
  const account = accountList.value.find(item => item.id === accountId)
  if (!account) return `#${accountId}`
  return `${account.authUserName || '未命名授权'} · #${account.id}`
}

function normalizeTextList(raw: string) {
  return raw
    .split(/[\n,，;]/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter((item, index, self) => self.indexOf(item) === index)
}

function parseExtraDetail(raw: string) {
  const value = raw.trim()
  if (!value || value === '{}') return undefined
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    throw new Error('扩展字段 JSON 格式不正确')
  }
  throw new Error('扩展字段 JSON 必须是对象')
}

function subscriptionScopeSummary(record: TikTokWebhookSubscriptionRecord) {
  const detail = parseJsonObject(record.subscriptionDetail)
  const parts: string[] = []
  if (detail.advertiser_ids?.length) parts.push(`advertiser_ids=${detail.advertiser_ids.join(',')}`)
  if (detail.advertiser_id) parts.push(`advertiser_id=${detail.advertiser_id}`)
  if (detail.library_id) parts.push(`library_id=${detail.library_id}`)
  if (detail.page_id) parts.push(`page_id=${detail.page_id}`)
  if (detail.adgroup_id) parts.push(`adgroup_id=${detail.adgroup_id}`)
  if (detail.ad_id) parts.push(`ad_id=${detail.ad_id}`)
  if (detail.bc_id) parts.push(`bc_id=${detail.bc_id}`)
  if (detail.product_filters?.length) parts.push(`product_filters=${detail.product_filters.join(',')}`)
  return parts.length ? parts.join(' · ') : '—'
}

function subscriptionScopeDetail(record: TikTokWebhookSubscriptionRecord) {
  const detail = parseJsonObject(record.subscriptionDetail)
  return prettyJson(detail)
}

function parseJsonObject(raw?: string | null): Record<string, any> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
  } catch {
    return { raw }
  }
  return { raw }
}

function prettyJson(raw?: string | Record<string, unknown> | null) {
  if (!raw) return '—'
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(raw)
  }
}

function truncate(value?: string | null, max = 60) {
  if (!value) return '—'
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return value
}

function formatUnixTime(value?: number | null) {
  if (value == null) return '—'
  return new Date(value * 1000).toLocaleString('zh-CN', { hour12: false })
}

function resetSubscriptionFilter() {
  subscriptionEntityFilter.value = undefined
  subscriptionStatusFilter.value = undefined
  subscriptionPage.value = 1
  loadSubscriptions()
}

function resetEventFilter() {
  eventSubscriptionFilter.value = undefined
  eventStatusFilter.value = undefined
  eventPage.value = 1
  loadEvents()
}

function handleSubscriptionFilter() {
  subscriptionPage.value = 1
  loadSubscriptions()
}

function handleEventFilter() {
  eventPage.value = 1
  loadEvents()
}

function handleSubscriptionPageChange(page: number) {
  subscriptionPage.value = page
  loadSubscriptions()
}

function handleEventPageChange(page: number) {
  eventPage.value = page
  loadEvents()
}

async function loadAccounts() {
  try {
    const rows = await fetchAdAccountList()
    accountList.value = Array.isArray(rows) ? rows : []
  } catch {
    accountList.value = []
  }
}

async function loadSubscriptions() {
  subscriptionLoading.value = true
  try {
    const res = await fetchTikTokWebhookSubscriptions({
      subscribeEntity: subscriptionEntityFilter.value,
      status: subscriptionStatusFilter.value,
      pageNum: subscriptionPage.value,
      pageSize: subscriptionPageSize.value,
    })
    subscriptionRows.value = res.rows || []
    subscriptionTotal.value = res.total || 0
  } catch {
    subscriptionRows.value = []
    subscriptionTotal.value = 0
  } finally {
    subscriptionLoading.value = false
  }
}

async function loadEvents() {
  eventLoading.value = true
  try {
    const res = await fetchTikTokWebhookEvents({
      subscriptionId: eventSubscriptionFilter.value,
      processingStatus: eventStatusFilter.value,
      pageNum: eventPage.value,
      pageSize: eventPageSize.value,
    })
    eventRows.value = res.rows || []
    eventTotal.value = res.total || 0
  } catch {
    eventRows.value = []
    eventTotal.value = 0
  } finally {
    eventLoading.value = false
  }
}

async function reloadAll() {
  pageLoading.value = true
  try {
    await Promise.all([loadAccounts(), loadSubscriptions(), loadEvents()])
  } finally {
    pageLoading.value = false
  }
}

function handleEntityChange() {
  createForm.notifyFrequency = createForm.subscribeEntity === 'REPORT_DATA_CHANGE' ? '5_MINUTE' : createForm.notifyFrequency
  if (createForm.subscribeEntity === 'LEAD' && !createForm.leadSource) {
    createForm.leadSource = 'INSTANT_FORM'
  }
  if (createForm.subscribeEntity === 'AD_ACCOUNT_SUSPENSION' && !createForm.suspensionScopeMode) {
    createForm.suspensionScopeMode = 'bc'
  }
}

function handleLeadSourceChange() {
  if (createForm.leadSource === 'DIRECT_MESSAGE') {
    createForm.pageId = ''
  }
}

function handleSuspensionScopeChange() {
  if (createForm.suspensionScopeMode === 'bc') {
    createForm.advertiserIdsText = ''
  } else {
    createForm.bcId = ''
  }
}

function openCreateModal() {
  createForm.subscribeEntity = 'REPORT_DATA_CHANGE'
  createForm.sourceAccountId = accountOptions.value[0]?.value ? Number(accountOptions.value[0].value) : undefined
  createForm.sourceAdvertiserId = ''
  createForm.notifyFrequency = '5_MINUTE'
  createForm.advertiserId = ''
  createForm.advertiserIdsText = ''
  createForm.libraryId = ''
  createForm.pageId = ''
  createForm.adId = ''
  createForm.adgroupId = ''
  createForm.bcId = ''
  createForm.leadSource = 'INSTANT_FORM'
  createForm.suspensionScopeMode = 'bc'
  createForm.productFiltersText = ''
  createForm.extraDetailText = '{}'
  createVisible.value = true
}

function closeCreateModal() {
  createVisible.value = false
}

async function handleCreateSubscription() {
  const errors = await createFormRef.value?.validate()
  if (errors) return

  const advertiserIds = normalizeTextList(createForm.advertiserIdsText)
  const productFilters = normalizeTextList(createForm.productFiltersText)
  const invalidProducts = productFilters.filter(item => !apiServiceProductSet.has(item))

  let extraDetail: Record<string, unknown> | undefined
  try {
    extraDetail = parseExtraDetail(createForm.extraDetailText)
  } catch (error) {
    Message.error(error instanceof Error ? error.message : '扩展字段 JSON 解析失败')
    return
  }

  if (!createForm.sourceAccountId) {
    Message.warning('请选择来源授权记录')
    return
  }

  try {
    validateSubscriptionDraft(advertiserIds, productFilters, invalidProducts)
  } catch (error) {
    Message.warning(error instanceof Error ? error.message : '请检查订阅参数')
    return
  }

  createSubmitting.value = true
  try {
    const payload: TikTokWebhookSubscriptionPayload = {
      subscribeEntity: createForm.subscribeEntity,
      sourceAccountId: Number(createForm.sourceAccountId),
      ...(createForm.sourceAdvertiserId ? { sourceAdvertiserId: createForm.sourceAdvertiserId } : {}),
      ...(createForm.subscribeEntity === 'REPORT_DATA_CHANGE' ? { notifyFrequency: createForm.notifyFrequency } : {}),
      ...(createForm.advertiserId ? { advertiserId: createForm.advertiserId } : {}),
      ...(advertiserIds.length ? { advertiserIds } : {}),
      ...(createForm.libraryId ? { libraryId: createForm.libraryId } : {}),
      ...(createForm.pageId ? { pageId: createForm.pageId } : {}),
      ...(createForm.adId ? { adId: createForm.adId } : {}),
      ...(createForm.adgroupId ? { adgroupId: createForm.adgroupId } : {}),
      ...(createForm.bcId ? { bcId: createForm.bcId } : {}),
      ...(createForm.leadSource ? { leadSource: createForm.leadSource } : {}),
      ...(productFilters.length ? { productFilters } : {}),
      ...(extraDetail ? { extraDetail } : {}),
    }
    await createTikTokWebhookSubscription(payload)
    Message.success('订阅创建成功')
    createVisible.value = false
    await loadSubscriptions()
  } catch {
    // 请求层已经给出错误提示，这里只保持对话框状态和按钮状态可恢复。
  } finally {
    createSubmitting.value = false
  }
}

function validateSubscriptionDraft(advertiserIds: string[], productFilters: string[], invalidProducts: string[]) {
  switch (createForm.subscribeEntity) {
    case 'REPORT_DATA_CHANGE':
      if (advertiserIds.length === 0) {
        throw new Error('报表指标变动订阅至少需要一个 advertiser_id')
      }
      break
    case 'LEAD':
      if (!createForm.advertiserId && !createForm.libraryId) {
        throw new Error('新线索订阅至少需要 advertiser_id 或 library_id')
      }
      if (createForm.leadSource === 'DIRECT_MESSAGE' && createForm.pageId) {
        throw new Error('DIRECT_MESSAGE 不支持 page_id')
      }
      break
    case 'AD_GROUP':
      if (!createForm.advertiserId) {
        throw new Error('广告审核状态订阅需要 advertiser_id')
      }
      if (!createForm.adgroupId) {
        throw new Error('广告审核状态订阅需要 adgroup_id')
      }
      break
    case 'CREATIVE_FATIGUE':
      if (!createForm.advertiserId) {
        throw new Error('广告疲劳状态订阅需要 advertiser_id')
      }
      break
    case 'AD_ACCOUNT_SUSPENSION':
      if (createForm.suspensionScopeMode === 'bc') {
        if (!createForm.bcId) {
          throw new Error('商务中心模式需要 bc_id')
        }
        if (advertiserIds.length > 0) {
          throw new Error('商务中心模式下不要填写 advertiser_ids')
        }
      } else {
        if (advertiserIds.length === 0) {
          throw new Error('advertiser_ids 模式至少需要一个 advertiser_id')
        }
        if (createForm.bcId) {
          throw new Error('advertiser_ids 模式下不要填写 bc_id')
        }
      }
      break
    case 'API_SERVICE_STATUS':
      if (invalidProducts.length > 0) {
        throw new Error(`product_filters 包含不支持的产品：${invalidProducts.join('、')}`)
      }
      break
    default:
      throw new Error('请选择有效的订阅类型')
  }
}

async function handleCancelSubscription(record: TikTokWebhookSubscriptionRecord) {
  try {
    await cancelTikTokWebhookSubscription(record.id)
    Message.success('已取消订阅')
    await loadSubscriptions()
  } catch {
    // 请求层已经给出错误提示。
  }
}

function openDetail(mode: DetailMode, record: TikTokWebhookSubscriptionRecord | TikTokWebhookEventRecord) {
  detailMode.value = mode
  selectedDetail.value = record
  detailVisible.value = true
}

watch(
  () => appStore.currentClientKey,
  async (clientKey) => {
    if (!clientKey) {
      accountList.value = []
      subscriptionRows.value = []
      eventRows.value = []
      subscriptionTotal.value = 0
      eventTotal.value = 0
      return
    }
    await reloadAll()
  },
  { immediate: true },
)
</script>

<style scoped>
.webhook-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-panel,
.hint-card,
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
}

.hero-panel {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mc-text-primary);
}

.page-subtitle,
.summary-hint,
.cell-subtitle,
.support-item span {
  color: var(--mc-text-tertiary);
  font-size: 12px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.summary-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-card {
  padding: 18px 20px;
  border-radius: var(--mc-radius-md);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(76, 157, 228, 0.1);
}

.summary-label {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.summary-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--mc-text-primary);
}

.hint-card {
  padding: 16px 18px;
}

.entity-guide {
  margin: 0 0 16px;
  padding: 16px 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(76, 157, 228, 0.14);
}

.entity-guide-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.entity-guide-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--mc-text-primary);
}

.entity-guide-summary {
  margin-top: 4px;
  color: var(--mc-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.entity-guide-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.entity-guide-item {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(76, 157, 228, 0.08);
}

.entity-guide-item strong {
  display: block;
  margin-bottom: 4px;
  color: var(--mc-text-primary);
  font-size: 12px;
}

.entity-guide-item span,
.field-hint {
  color: var(--mc-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.field-hint {
  margin-top: 8px;
}

.hint-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text-primary);
}

.support-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.support-item {
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(76, 157, 228, 0.04);
  border: 1px solid rgba(76, 157, 228, 0.08);
}

.support-item strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--mc-text-primary);
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.table-card {
  overflow: clip;
}

.cell-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ellipsis-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono-cell {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.error-text {
  color: var(--color-danger-6);
}

.modal-hint {
  margin-bottom: 16px;
}

.json-block {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--mc-text-primary);
  border: 1px solid rgba(76, 157, 228, 0.08);
  overflow: auto;
  max-height: 320px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1280px) {
  .summary-grid,
  .support-grid,
  .entity-guide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-panel,
  .toolbar {
    flex-direction: column;
  }

  .summary-grid,
  .support-grid,
  .entity-guide-grid {
    grid-template-columns: 1fr;
  }
}
</style>
