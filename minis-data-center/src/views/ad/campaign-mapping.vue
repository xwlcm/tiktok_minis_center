<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">推广系列关联管理</div>
        <div class="page-subtitle">将 TikTok 推广系列与短剧进行关联，支持自动匹配和手动绑定</div>
      </div>
    </div>

    <div class="table-card">
      <a-tabs v-model:active-key="activeTab" type="line">
        <!-- 已关联 -->
        <a-tab-pane key="mapped" title="已关联">
          <a-table
            :columns="mappedColumns"
            :data="mappedList"
            :loading="loadingMapped"
            :pagination="false"
            row-key="id"
            :bordered="false"
          >
            <template #matchType="{ record }">
              <a-tag :color="record.matchType === 'auto' ? 'arcoblue' : 'orange'" size="small">
                {{ record.matchType === 'auto' ? '自动匹配' : '手动绑定' }}
              </a-tag>
            </template>
            <template #operations="{ record }">
              <a-popconfirm content="确认解绑该推广系列？" @ok="handleUnbind(record.id)">
                <a-button type="text" size="small" status="danger">解绑</a-button>
              </a-popconfirm>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- 未关联 -->
        <a-tab-pane key="unmapped" title="未关联">
          <div class="tab-toolbar">
            <a-button
              type="primary"
              size="small"
              :loading="autoBinding"
              :disabled="unmappedList.length === 0"
              @click="handleAutoBindAll"
            >
              一键关联
            </a-button>
            <span class="hint-text">（根据推广系列名称中的 {剧名}-drama_{短剧ID}_{日期} 规则自动匹配）</span>
            
            <a-divider direction="vertical" />
            
            <a-upload
              :custom-request="handleFileUpload"
              :show-file-list="false"
              accept=".csv,.xlsx,.xls"
            >
              <template #upload-button>
                <a-button type="outline" size="small">
                  <icon-upload />
                  批量导入
                </a-button>
              </template>
            </a-upload>
            <span class="hint-text">（支持 CSV/Excel）</span>
            
            <a-button type="text" size="small" @click="downloadTemplate">
              下载模板
            </a-button>
          </div>
          <a-table
            :columns="unmappedColumns"
            :data="unmappedList"
            :loading="loadingUnmapped"
            :pagination="false"
            row-key="campaignId"
            :bordered="false"
          >
            <template #operations="{ record }">
              <a-button type="primary" size="small" @click="openBindModal(record)">
                关联
              </a-button>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- 关联弹窗 -->
    <a-modal
      v-model:visible="showBindModal"
      title="关联短剧"
      :ok-loading="binding"
      @ok="handleBindCampaign"
      @cancel="showBindModal = false"
    >
      <a-form :model="bindForm" layout="vertical">
        <a-form-item label="推广系列ID">
          <a-input v-model="bindForm.campaignId" disabled />
        </a-form-item>
        <a-form-item label="推广系列名称">
          <a-input v-model="bindForm.campaignName" placeholder="请输入推广系列名称" />
        </a-form-item>
        <a-form-item label="广告主ID">
          <a-input v-model="bindForm.advertiserId" placeholder="请输入广告主ID" />
        </a-form-item>
        <a-form-item label="关联短剧">
          <a-select
            v-model="bindForm.dramaId"
            placeholder="选择短剧"
            allow-search
          >
            <a-option v-for="d in dramaOptions" :key="d.id" :value="d.id">
              {{ d.name }}
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { IconUpload } from '@arco-design/web-vue/es/icon'
import { fetchMappingList, fetchUnmappedCampaigns, bindCampaignManual, unbindCampaign, autoBindAllCampaigns, batchImportMappings, type CampaignMappingImport } from '@/api/adAccount.ts'
import { fetchDramaList } from '@/api/drama.ts'
import * as XLSX from 'xlsx' // 导入XLSX插件

interface MappedItem {
  id: string
  campaignName: string
  advertiserId: string
  dramaName: string
  matchType: string
}

interface UnmappedItem {
  campaignId: string
}

interface DramaOption {
  id: number
  name: string
}

const activeTab = ref('mapped')
const loadingMapped = ref(false)
const loadingUnmapped = ref(false)
const mappedList = ref<MappedItem[]>([])
const unmappedList = ref<UnmappedItem[]>([])
const dramaOptions = ref<DramaOption[]>([])
const showBindModal = ref(false)
const binding = ref(false)
const autoBinding = ref(false)
const bindForm = ref({
  campaignId: '',
  campaignName: '',
  advertiserId: '',
  dramaId: undefined as number | undefined,
})

const mappedColumns = [
  { title: '推广系列名称', dataIndex: 'campaignName', width: 220 },
  { title: '广告主', dataIndex: 'advertiserId', width: 160 },
  { title: '关联短剧', dataIndex: 'dramaName', width: 180 },
  { title: '匹配方式', slotName: 'matchType', width: 120 },
  { title: '操作', slotName: 'operations', width: 100 },
]

const unmappedColumns = [
  { title: '推广系列ID', dataIndex: 'campaignId', width: 300 },
  { title: '操作', slotName: 'operations', width: 100 },
]

async function loadMapped() {
  loadingMapped.value = true
  try {
    const res = await fetchMappingList()
    mappedList.value = (res as MappedItem[]) || []
  } catch {
    mappedList.value = []
  } finally {
    loadingMapped.value = false
  }
}

async function loadUnmapped() {
  loadingUnmapped.value = true
  try {
    const res = await fetchUnmappedCampaigns()
    unmappedList.value = ((res as string[]) || []).map(id => ({ campaignId: id }))
  } catch {
    unmappedList.value = []
  } finally {
    loadingUnmapped.value = false
  }
}

async function loadDramas() {
  try {
    const res = await fetchDramaList({ status: 1, pageNum: 1, pageSize: 200 })
    if (res && 'rows' in res) {
      dramaOptions.value = (res as unknown as { rows: DramaOption[] }).rows || []
    }
  } catch {
    dramaOptions.value = []
  }
}

function openBindModal(record: UnmappedItem) {
  bindForm.value = {
    campaignId: record.campaignId,
    campaignName: '',
    advertiserId: '',
    dramaId: undefined,
  }
  showBindModal.value = true
}

async function handleBindCampaign() {
  if (!bindForm.value.dramaId) {
    Message.warning('请选择关联短剧')
    return
  }
  binding.value = true
  try {
    await bindCampaignManual({
      campaignId: bindForm.value.campaignId,
      campaignName: bindForm.value.campaignName,
      advertiserId: bindForm.value.advertiserId,
      dramaId: bindForm.value.dramaId,
    })
    Message.success('关联成功')
    showBindModal.value = false
    await loadMapped()
    await loadUnmapped()
  } finally {
    binding.value = false
  }
}

async function handleUnbind(id: string) {
  try {
    await unbindCampaign(id)
    Message.success('已解绑')
    await Promise.all([loadMapped(), loadUnmapped()])
  } catch {
    // handled by interceptor
  }
}

async function handleAutoBindAll() {
  if (unmappedList.value.length === 0) {
    Message.warning('没有未关联的广告计划')
    return
  }

  Modal.confirm({
    title: '一键关联确认',
    content: `将对 ${unmappedList.value.length} 个未关联的推广系列进行自动匹配，是否继续？`,
    okText: '开始关联',
    cancelText: '取消',
    onOk: async () => {
      autoBinding.value = true
      try {
        const tipMsg = await autoBindAllCampaigns()
        Message.success(`自动关联完成！${tipMsg}`)
        await Promise.all([loadMapped(), loadUnmapped()])
      } catch (error: any) {
        Message.error(error?.message || '自动关联失败')
      } finally {
        autoBinding.value = false
      }
    },
  })
}

function handleFileUpload(option: any): Record<string, any> {
  const { fileItem, onSuccess, onError } = option
  const file = fileItem.file as File
  
  // 启动异步处理任务
  ;(async () => {
  if (!file) {
    Message.error('请选择文件')
    onError?.(new Error('未选择文件'))
    return
  }
  
  // 检查文件类型
  const fileName = file.name.toLowerCase()
  const isCSV = fileName.endsWith('.csv')
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
  
  if (!isCSV && !isExcel) {
    Message.error('只支持 CSV 或 Excel 文件')
    onError?.(new Error('不支持的文件格式'))
    return
  }
  
  try {
    let mappings: CampaignMappingImport[] = []
    
    if (isCSV) {
      // 解析 CSV 文件
      mappings = await parseCSV(file)
    } else {
      // 解析 Excel 文件（使用 FileReader 兼容性更好）
      const data = await readFileAsArrayBuffer(file)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        Message.error('Excel 文件中没有工作表')
        onSuccess?.(null)
        return
      }
      const worksheet = workbook.Sheets[sheetName]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: undefined }) as Record<string, any>[]
      mappings = rawRows.map(row => ({
        campaignId: String(row.campaignId ?? row.campaign_id ?? '').trim(),
        campaignName: String(row.campaignName ?? row.campaign_name ?? '').trim(),
        dramaId: String(row.dramaId ?? row.drama_id ?? '').trim(),
      })).filter(m => m.campaignId && m.dramaId)
    }
    
    if (mappings.length === 0) {
      Message.warning('文件中没有有效的映射数据')
      onSuccess?.(null)
      return
    }
    
    // 检查是否有精度丢失的数据
    const hasPrecisionLoss = mappings.some(m => {
      // 如果 dramaId 以多个 0 结尾，可能是精度丢失
      return m.dramaId.match(/^\d*0{10,}$/)
    })
    
    if (hasPrecisionLoss) {
      Message.error({
        content: '检测到数据精度丢失！可能是用 Excel 打开过 CSV 文件。请使用文本编辑器重新创建 CSV 文件，或从数据库直接导出数据。',
        duration: 5000,
      })
      onSuccess?.(null)
      return
    }
    
    // 确认导入
    Modal.confirm({
      title: '批量导入确认',
      content: `将导入 ${mappings.length} 条映射关系，是否继续？`,
      okText: '开始导入',
      cancelText: '取消',
      onOk: async () => {
        try {
          const successCount = await batchImportMappings(mappings)
          Message.success(`批量导入完成！成功绑定 ${successCount} 个广告计划`)
          await Promise.all([loadMapped(), loadUnmapped()])
          onSuccess?.(null)
        } catch (error: any) {
          Message.error(error?.message || '批量导入失败')
          onError?.(error)
        }
      },
    })
  } catch (error: any) {
    Message.error(error?.message || '文件解析失败')
    onError?.(error)
  }
  })()
  return {}
}

/** 用 FileReader 读取文件为 ArrayBuffer，兼容性优于 file.arrayBuffer() */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

function parseCSV(file: File): Promise<CampaignMappingImport[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) {
          reject(new Error('文件内容为空'))
          return
        }
        
        const lines = text.split(/\r?\n/).filter(line => line.trim())
        const mappings: CampaignMappingImport[] = []
        
        // 跳过表头（如果有）
        const startIndex = lines[0]?.toLowerCase().includes('campaign') ? 1 : 0
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          // 支持逗号或制表符分隔
          const parts = line.split(/[,\t]/).map(p => p.trim())
          
          if (parts.length >= 2) {
            let campaignId = parts[0]
            let campaignName = parts[1]
            let dramaIdStr = parts[2]
            
            // 处理科学计数法（Excel 自动转换导致）
            campaignId = convertScientificNotation(campaignId)
            campaignName = convertScientificNotation(campaignName)
            dramaIdStr = convertScientificNotation(dramaIdStr)
            
            // 验证数据格式
            if (campaignId && dramaIdStr) {
              // 使用 BigInt 避免精度丢失
              try {
                const dramaId = BigInt(dramaIdStr)
                if (dramaId > 0n) {
                  mappings.push({
                    campaignId,
                    campaignName,
                    dramaId: dramaId.toString(),  // 转为字符串发送，避免 JSON 序列化时的科学计数法
                  })
                }
              } catch (e) {
                console.warn(`无效的数字格式: ${dramaIdStr}`)
              }
            }
          }
        }
        
        resolve(mappings)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 将科学计数法字符串转换为完整数字字符串
 * 例如: "1.86969E+15" -> "1869690000000000"
 */
function convertScientificNotation(value: string): string {
  value = value.trim()
  
  // 检查是否为科学计数法
  if (/^[+-]?\d*\.?\d+[eE][+-]?\d+$/.test(value)) {
    try {
      // 使用 BigDecimal.js 的替代方案：手动解析
      const [mantissa, exponent] = value.split(/[eE]/)
      const exp = parseInt(exponent)
      
      // 移除小数点，获取纯数字部分
      const mantissaWithoutDot = mantissa.replace('.', '')
      
      // 计算小数点后的位数
      const decimalPlaces = mantissa.includes('.') ? mantissa.split('.')[1].length : 0
      
      // 实际需要补的 0 的数量
      const zerosNeeded = exp - decimalPlaces
      
      console.log(`转换科学计数法: ${value} -> mantissa=${mantissa}, exp=${exp}, decimalPlaces=${decimalPlaces}, zerosNeeded=${zerosNeeded}`)
      
      if (zerosNeeded >= 0) {
        // 需要补 0
        const result = mantissaWithoutDot + '0'.repeat(zerosNeeded)
        console.log(`转换结果: ${result}`)
        return result
      } else {
        // 需要截断（小数情况）
        const insertPos = mantissaWithoutDot.length + zerosNeeded
        const intPart = mantissaWithoutDot.substring(0, insertPos)
        const decPart = mantissaWithoutDot.substring(insertPos)
        return intPart + '.' + decPart
      }
    } catch (e) {
      console.warn(`无法转换科学计数法: ${value}`, e)
      return value
    }
  }
  
  return value
}

function downloadTemplate() {
  // 创建 CSV 内容（包含 campaign_id, campaign_name, drama_id）
  const csvContent = 'campaign_id,campaign_name,drama_id\n1869690744270898,测试推广系列1,2055258654442790914\n1869690743858210,测试推广系列2,2055925535628189698'
  
  // 创建 Blob 对象
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 创建下载链接
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'campaign-mapping-template.csv')
  link.style.visibility = 'hidden'
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  Message.success('模板已下载')
}

watch(activeTab, (tab) => {
  if (tab === 'mapped') loadMapped()
  else loadUnmapped()
})

onMounted(() => {
  loadMapped()
  loadUnmapped()
  loadDramas()
})
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
.table-card {
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  box-shadow: var(--mc-shadow-xs);
  padding: 16px;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.hint-text {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}
</style>
