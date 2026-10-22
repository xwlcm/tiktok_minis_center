<template>
    <div class="page-shell minis-progress">
        <div class="page-header">
            <div>
                <div class="page-title">小程序 by 时间进度</div>
                <div class="page-subtitle">SA 项目小程序消耗目标进度看板</div>
            </div>
            <div class="page-actions">
                <a-button type="primary" @click="openConfigModal()">
                    <template #icon><icon-plus /></template>
                    配置目标
                </a-button>
                <a-button :loading="loading" @click="loadDashboard">
                    <template #icon><icon-refresh /></template>
                    刷新
                </a-button>
            </div>
        </div>

        <!-- 汇总卡片 -->
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-label">小程序数</div>
                <div class="summary-value">{{ dashboardData.length }}</div>
                <div class="summary-hint">已配置目标的小程序</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">完成率</div>
                <div class="summary-value">{{ overallCompletionRate }}%</div>
                <div class="summary-hint">达标小程序占比</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">总消耗</div>
                <div class="summary-value">${{ fmtMoney(totalSpend) }}</div>
                <div class="summary-hint">所有小程序累计消耗</div>
            </div>
        </div>

        <!-- 日期筛选 -->
        <div class="filter-bar">
            <a-range-picker v-model="dateRange" class="filter-date" @change="loadDashboard" />
            <a-button type="primary" size="small" @click="loadDashboard">查询</a-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-card">
            <a-table
                    :columns="columns"
                    :data="dashboardData"
                    :loading="loading"
                    :pagination="false"
                    :bordered="false"
                    :scroll="{ x: 1200 }"
                    row-key="id"
            >
                <template #minisInfo="{ record }">
                    <div class="minis-cell">
                        <div class="cell-title">{{ record.minisName || record.clientKey }}</div>
                        <div class="mono-text">{{ record.clientKey }}</div>
                    </div>
                </template>

                <template #spend="{ record }">
                    <div class="spend-cell">
                        <div class="cell-title">${{ fmtMoney(record.actualSpend) }}</div>
                        <div class="cell-subtitle">目标 ${{ fmtMoney(record.targetSpend) }}</div>
                    </div>
                </template>

                <template #timeProgress="{ record }">
                    <div class="progress-cell">
                        <a-progress
                                :percent="Number((record.completionRate / 100).toFixed(4))"
                                :show-text="false"
                                size="small"
                                :color="progressColor(record)"
                        />
                        <span class="progress-text">{{ record.timeProgress }}%</span>
                    </div>
                </template>

                <template #period="{ record }">
                    <span class="period-text">{{ record.periodStart }} ~ {{ record.periodEnd }}</span>
                </template>

                <template #estimatedDaily="{ record }">
                    ${{ fmtMoney(record.estimatedDailySpend) }}
                </template>

                <template #roi="{ record }">
                    <span :class="roiClass(record)">{{ record.roi != null ? Number(record.roi).toFixed(2) : '—' }}</span>
                </template>

                <template #completionStatus="{ record }">
                    <a-tag :color="statusColor(record.completionStatus)" size="small">
                        {{ record.completionLabel }}
                    </a-tag>
                </template>

                <template #operations="{ record }">
                    <div class="row-actions">
                        <a-button type="text" size="small" @click="openConfigModal(record)">编辑</a-button>
                        <a-popconfirm content="确定清除该帐户的目标配置？" @ok="handleDelete(record.id)">
                            <a-button type="text" size="small" status="danger">删除</a-button>
                        </a-popconfirm>
                    </div>
                </template>

                <template #empty>
                    <a-empty description="暂无目标配置，请点击「配置目标」选择广告帐户并设置" />
                </template>
            </a-table>
        </div>

        <!-- 剧消耗表现表 -->
        <div class="table-card drama-performance-card">
            <div class="card-header">
                <div class="card-title">剧消耗表现表</div>
            </div>
            <a-table
                    :columns="dramaColumns"
                    :data="dramaPerformanceData"
                    :loading="loading"
                    :pagination="{ pageSize: 20, showTotal: true, showPageSize: true }"
                    :bordered="false"
                    :scroll="{ x: 1000 }"
                    row-key="campaignName-reportDate"
            >
                <template #dramaName="{ record }">
                    <span class="drama-name">{{ record.dramaName }}</span>
                </template>

                <template #campaignName="{ record }">
                    <span class="campaign-name" :title="record.campaignName">{{ record.campaignName }}</span>
                </template>

                <template #spend="{ record }">
                    <span class="spend-value">${{ fmtMoney(record.spend) }}</span>
                </template>

                <template #roi="{ record }">
                    <span :class="roiClass(record)">{{ record.roi != null ? Number(record.roi).toFixed(2) : '—' }}</span>
                </template>

                <template #day0Revenue="{ record }">
                    <span>${{ fmtMoney(record.day0Revenue) }}</span>
                </template>

                <template #day13Revenue="{ record }">
                    <span>${{ fmtMoney(record.day13Revenue) }}</span>
                </template>

                <template #empty>
                    <a-empty description="暂无剧消耗数据" />
                </template>
            </a-table>
        </div>

        <!-- 配置目标弹窗 -->
        <a-modal
                v-model:visible="showModal"
                :title="modalTitle"
                :ok-loading="submitLoading"
                @ok="handleSubmit"
                @cancel="resetForm"
        >
            <a-form :model="form" layout="vertical">
                <a-form-item label="选择广告帐户" required>
                    <a-select
                            v-model="form.accountId"
                            placeholder="请选择广告帐户"
                            :disabled="isEditing"
                            allow-search
                            @change="handleAccountChange"
                    >
                        <a-option
                                v-for="acc in accountList"
                                :key="acc.id"
                                :value="acc.id"
                                :label="accountLabel(acc)"
                        >
                            <div class="account-option">
                                <span>{{ acc.authUserName || acc.clientKey }}</span>
                                <a-tag v-if="acc.targetSpend != null" size="small" color="arcoblue">已配置</a-tag>
                            </div>
                        </a-option>
                    </a-select>
                    <div v-if="accountList.length === 0" class="form-tip">
                        当前应用下无广告帐户，请先在「广告帐户管理」中绑定帐户
                    </div>
                </a-form-item>
                <a-form-item label="小程序名称">
                    <a-input v-model="form.minisName" placeholder="选择帐户后自动填充" disabled />
                </a-form-item>
                <a-form-item label="负责团队">
                    <a-input v-model="form.teamName" placeholder="输入负责人/团队（如：景霞、聪哥、玉哥）" />
                </a-form-item>
                <a-form-item label="目标消耗 ($)" required>
                    <a-input-number v-model="form.targetSpend" :min="0" :precision="2" placeholder="0.00" style="width: 100%" />
                </a-form-item>
                <a-form-item label="考核周期" required>
                    <a-range-picker v-model="formPeriod" style="width: 100%" />
                </a-form-item>
                <a-form-item label="目标 ROI">
                    <a-input-number v-model="form.roiTarget" :min="0" :precision="4" placeholder="可选" style="width: 100%" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup lang="ts">
    defineOptions({ name: 'MinisProgress' })
    import { ref, reactive, computed, onMounted } from 'vue'
    import { Message } from '@arco-design/web-vue'
    import {
      fetchMinisProgressDashboard,
      fetchAdAccountList,
      updateAccountTargetConfig,
      clearAccountTargetConfig,
      type MinisProgressDashboardItem,
      type DramaPerformanceItem,
      type AdAccountItem,
      type TargetConfigForm,
    } from '@/api/minisProgress.ts'

    const loading = ref(false)
    const submitLoading = ref(false)
    const showModal = ref(false)
    const isEditing = ref(false)
    const dashboardData = ref<MinisProgressDashboardItem[]>([])
    const dramaPerformanceData = ref<DramaPerformanceItem[]>([])
    const accountList = ref<AdAccountItem[]>([])
    const dateRange = ref<string[]>()

    // 表单
    const form = reactive({
      accountId: undefined as number | string | undefined,
      minisName: '',
      teamName: '',
      targetSpend: 0,
      roiTarget: undefined as number | undefined,
    })
    const formPeriod = ref<string[]>()

    const modalTitle = computed(() => (isEditing.value ? '编辑目标配置' : '配置目标'))

    const columns = [
      { title: '小程序名称', slotName: 'minisInfo', width: 180, fixed: 'left' as const },
      { title: 'by 时间消耗', slotName: 'spend', width: 150 },
      { title: 'by 时间进度', slotName: 'timeProgress', width: 160 },
      { title: 'by 团队', dataIndex: 'teamName', width: 100 },
      { title: '考核周期', slotName: 'period', width: 160 },
      { title: '预估日消耗', slotName: 'estimatedDaily', width: 130 },
      { title: 'ROI 表现', slotName: 'roi', width: 100 },
      { title: '完成表现', slotName: 'completionStatus', width: 100 },
      { title: '操作', slotName: 'operations', width: 120, fixed: 'right' as const },
    ]

    const dramaColumns = [
      { title: '剧名', slotName: 'dramaName', width: 150 },
      { title: '推广系列名', slotName: 'campaignName', width: 250 },
      { title: '消耗', slotName: 'spend', width: 120 },
      { title: '日期', dataIndex: 'reportDate', width: 110 },
      { title: 'ROI', slotName: 'roi', width: 100 },
      { title: 'DAY0 收入', slotName: 'day0Revenue', width: 120 },
      { title: 'DAY13 收入', slotName: 'day13Revenue', width: 120 },
    ]

    // 汇总计算
    const overallCompletionRate = computed(() => {
      if (dashboardData.value.length === 0) return '0.00'
      const completed = dashboardData.value.filter((r) => r.completionStatus === 'COMPLETED').length
      return ((completed / dashboardData.value.length) * 100).toFixed(2)
    })

    const totalSpend = computed(() => {
      return dashboardData.value.reduce((sum, r) => sum + Number(r.actualSpend || 0), 0)
    })

    function fmtMoney(val: number | string | null | undefined): string {
      if (val == null) return '0.00'
      const num = Number(val)
      if (isNaN(num)) return '0.00'
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    function progressColor(record: MinisProgressDashboardItem): string {
      if (record.completionStatus === 'COMPLETED') return '#00b42a'
      if (record.completionStatus === 'AT_RISK') return '#ff7d00'
      if (record.completionStatus === 'FAILED') return '#f53f3f'
      return '#165dff'
    }

    function roiClass(record: MinisProgressDashboardItem | DramaPerformanceItem): string {
      if ('roiTarget' in record && record.roiTarget && Number(record.roi) >= Number(record.roiTarget)) return 'roi-good'
      if (Number(record.roi) > 0) return 'roi-normal'
      return 'roi-bad'
    }

    function statusColor(status: string): string {
      switch (status) {
        case 'COMPLETED': return 'green'
        case 'AT_RISK': return 'orangered'
        case 'FAILED': return 'red'
        default: return 'arcoblue'
      }
    }

    function accountLabel(acc: AdAccountItem): string {
      const name = acc.authUserName || acc.clientKey
      return acc.targetSpend != null ? `${name}（已配置）` : name
    }

    /** 选择广告帐户后自动回填小程序名称 */
    function handleAccountChange(value: string | number | boolean | Record<string, any> | (string | number | boolean | Record<string, any>)[]) {
      // 雪花 ID 超出 JS 安全整数范围，后端序列化为字符串，这里统一按字符串比较，避免 Number() 丢精度导致匹配失败
      const accountId = String(value)
      const acc = accountList.value.find((a) => String(a.id) === accountId)
      if (acc) {
        form.minisName = acc.appName || acc.clientKey || ''
      } else {
        form.minisName = ''
      }
    }

    async function loadDashboard() {
      loading.value = true
      try {
        const params: { startDate?: string; endDate?: string } = {}
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0]
          params.endDate = dateRange.value[1]
        }
        const res = await fetchMinisProgressDashboard(params)
        const data = (res as any)?.data ?? res
        dashboardData.value = data?.progressList ?? []
        dramaPerformanceData.value = data?.dramaPerformanceList ?? []
      } catch (e: any) {
        Message.error(e?.message || '加载看板失败')
      } finally {
        loading.value = false
      }
    }

    async function loadAccountList() {
      try {
        const res = await fetchAdAccountList()
        accountList.value = ((res as any)?.data ?? res ?? []).filter((a: AdAccountItem) => a.status === 1)
      } catch (e: any) {
        console.warn('加载广告帐户列表失败', e)
        accountList.value = []
      }
    }

    /** 打开配置弹窗。传入 record 时为编辑模式，否则为新建 */
    function openConfigModal(record?: MinisProgressDashboardItem) {
      resetForm()
      if (record) {
        // 编辑模式：锁定帐户选择，预填数据
        isEditing.value = true
        form.accountId = record.id
        form.minisName = record.minisName || ''
        form.teamName = record.teamName || ''
        form.targetSpend = Number(record.targetSpend)
        form.roiTarget = record.roiTarget != null ? Number(record.roiTarget) : undefined
        formPeriod.value = [record.periodStart, record.periodEnd]
      } else {
        isEditing.value = false
      }
      showModal.value = true
      // 每次打开都刷新帐户列表
      loadAccountList()
    }

    function resetForm() {
      form.accountId = undefined
      form.minisName = ''
      form.teamName = ''
      form.targetSpend = 0
      form.roiTarget = undefined
      formPeriod.value = undefined
    }

    async function handleSubmit() {
      if (!form.accountId) {
        Message.warning('请选择广告帐户')
        return
      }
      if (!formPeriod.value || formPeriod.value.length !== 2) {
        Message.warning('请选择考核周期')
        return
      }
      if (!form.targetSpend || form.targetSpend <= 0) {
        Message.warning('请输入有效的目标消耗')
        return
      }

      const data: TargetConfigForm = {
        minisName: form.minisName || undefined,
        teamName: form.teamName || undefined,
        targetSpend: form.targetSpend,
        periodStart: formPeriod.value[0],
        periodEnd: formPeriod.value[1],
        roiTarget: form.roiTarget,
      }

      submitLoading.value = true
      try {
        await updateAccountTargetConfig(form.accountId, data)
        Message.success(isEditing.value ? '保存成功' : '配置成功')
        showModal.value = false
        resetForm()
        await loadDashboard()
      } catch (e: any) {
        Message.error(e?.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }

    async function handleDelete(accountId: number | string) {
      try {
        await clearAccountTargetConfig(accountId)
        Message.success('已清除目标配置')
        await loadDashboard()
      } catch (e: any) {
        Message.error(e?.message || '删除失败')
      }
    }

    onMounted(() => {
      loadDashboard()
    })
</script>

<style scoped>
    .minis-progress {
      padding: 20px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--color-text-1);
    }
    .page-subtitle {
      font-size: 13px;
      color: var(--color-text-3);
      margin-top: 4px;
    }
    .page-actions {
      display: flex;
      gap: 8px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .summary-card {
      background: var(--color-bg-2);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid var(--color-border-2);
    }
    .summary-label {
      font-size: 13px;
      color: var(--color-text-3);
    }
    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-1);
      margin: 4px 0;
    }
    .summary-hint {
      font-size: 12px;
      color: var(--color-text-4);
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .filter-date {
      width: 280px;
    }
    .table-card {
      background: var(--color-bg-2);
      border-radius: 8px;
      padding: 16px;
      border: 1px solid var(--color-border-2);
      margin-bottom: 20px;
    }
    .drama-performance-card {
      margin-bottom: 0;
    }
    .card-header {
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-1);
    }
    .minis-cell .cell-title {
      font-weight: 500;
      color: var(--color-text-1);
    }
    .mono-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--color-text-3);
    }
    .spend-cell .cell-title {
      font-weight: 600;
    }
    .spend-cell .cell-subtitle {
      font-size: 12px;
      color: var(--color-text-3);
    }
    .progress-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .progress-cell :deep(.arco-progress) {
      flex: 1;
    }
    .progress-text {
      font-size: 12px;
      color: var(--color-text-2);
      white-space: nowrap;
    }
    .roi-good { color: #00b42a; font-weight: 600; }
    .roi-normal { color: var(--color-text-1); }
    .roi-bad { color: #f53f3f; }
    .row-actions {
      display: flex;
      gap: 4px;
    }
    .account-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }
    .form-tip {
      margin-top: 4px;
      font-size: 12px;
      color: var(--color-text-3);
    }
    .drama-name {
      font-weight: 500;
      color: var(--color-text-1);
    }
    .campaign-name {
      font-size: 12px;
      color: var(--color-text-2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 250px;
      display: inline-block;
    }
    .spend-value {
      font-weight: 600;
      color: var(--color-text-1);
    }
    .period-text {
      font-size: 12px;
      color: var(--color-text-2);
      white-space: nowrap;
    }
</style>
