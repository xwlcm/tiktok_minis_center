<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">推广系列命名模板</div>
        <div class="page-subtitle">配置推广系列的自动命名规则，点击变量按钮插入到模板中</div>
      </div>
    </div>

    <a-card class="template-card">
      <a-form :model="form" layout="vertical">
        <!-- 模板输入 -->
        <a-form-item label="模板字符串">
          <a-input
            v-model="form.template"
            placeholder="点击下方变量按钮插入，例如：{dramaName}-drama_{dramaId}_{startDate}"
            allow-clear
          />
        </a-form-item>

        <!-- 变量按钮 -->
        <a-form-item label="可用变量">
          <a-space wrap>
            <a-button
              v-for="v in variables"
              :key="v.code"
              size="small"
              @click="insertVariable(v.code)"
            >
              {{ v.label }} {{ formatVariable(v.code) }}
            </a-button>
          </a-space>
        </a-form-item>

        <!-- 分隔符 -->
        <a-form-item label="分隔符">
          <a-radio-group v-model="form.separator">
            <a-radio value="_">下划线 _</a-radio>
            <a-radio value="-">短横线 -</a-radio>
            <a-radio value=" ">空格</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 日期格式 -->
        <a-form-item label="日期格式">
          <a-select v-model="form.dateFormat" style="width: 200px">
            <a-option value="yyyyMMdd">yyyyMMdd</a-option>
            <a-option value="yyyy-MM-dd">yyyy-MM-dd</a-option>
            <a-option value="yyyy/MM/dd">yyyy/MM/dd</a-option>
          </a-select>
        </a-form-item>

        <!-- 预览 -->
        <a-form-item label="预览效果">
          <div class="preview-box">
            {{ previewText || '（请输入模板后查看预览）' }}
          </div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="saving" @click="handleSave">
            保存模板
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { fetchNamingTemplate, saveNamingTemplate } from '@/api/adAccount.ts'

const variables = [
  { label: '短剧名称', code: 'dramaName' },
  { label: '短剧ID', code: 'dramaId' },
  { label: '推广目标', code: 'promotionGoal' },
  { label: '创意组名称', code: 'creativeGroupName' },
  { label: '开始日期', code: 'startDate' },
  { label: '创建日期', code: 'createDate' },
  { label: '广告主名称', code: 'advertiserName' },
  { label: '投手名称', code: 'operatorName' },
  { label: '自定义标签', code: 'customTag' },
]

const form = ref({
  template: '',
  separator: '_',
  dateFormat: 'yyyyMMdd',
})

const saving = ref(false)

const variableSeparatorPattern = /(\})(?:_|-|\s+)(?=\{)/g
const trackingTokenPattern = /drama[_\-\s]*\{dramaId\}/
const trackingToken = 'drama_{dramaId}'
const variableAliases: Record<string, string> = {
  短剧名称: 'dramaName',
  短剧ID: 'dramaId',
  推广目标: 'promotionGoal',
  创意组名称: 'creativeGroupName',
  开始日期: 'startDate',
  创建日期: 'createDate',
  广告主名称: 'advertiserName',
  投手名称: 'operatorName',
  自定义标签: 'customTag',
}

function formatVariable(code: string) {
  return `{${code}}`
}

function normalizeVariableAliases(template: string) {
  return Object.entries(variableAliases).reduce(
    (result, [legacyName, code]) => result.split(`{${legacyName}}`).join(formatVariable(code)),
    template,
  )
}

function enforceTrackingToken(template: string, separator: string) {
  if (trackingTokenPattern.test(template)) {
    return template
  }
  if (template.includes('{dramaId}')) {
    return template.replace('{dramaId}', trackingToken)
  }
  return `${trackingToken}${separator}${template}`
}

function normalizeTemplateSeparator(template: string, separator: string) {
  if (!template.trim()) {
    return ''
  }
  return enforceTrackingToken(normalizeVariableAliases(template), separator).replace(
    variableSeparatorPattern,
    `$1${separator}`,
  )
}

function insertVariable(variable: string) {
  const current = form.value.template
  const placeholder = formatVariable(variable)
  if (current && !current.endsWith(form.value.separator)) {
    form.value.template = current + form.value.separator + placeholder
  } else {
    form.value.template = current + placeholder
  }
}

watch(
  () => form.value.separator,
  (separator) => {
    form.value.template = normalizeTemplateSeparator(form.value.template, separator || '_')
  },
)

const previewText = computed(() => {
  if (!form.value.template) return ''
  const now = new Date()
  let dateStr: string
  if (form.value.dateFormat === 'yyyyMMdd') {
    dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  } else if (form.value.dateFormat === 'yyyy-MM-dd') {
    dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  } else {
    dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
  }

  const sampleValues: Record<string, string> = {
    '{dramaName}': 'The Young Lords Witchy Wife',
    '{dramaId}': '2064398057835388930',
    '{promotionGoal}': 'IAP',
    '{creativeGroupName}': 'CreativeGroupA',
    '{startDate}': dateStr,
    '{createDate}': dateStr,
    '{advertiserName}': 'AdvertiserX',
    '{operatorName}': 'OperatorA',
    '{customTag}': 'V1',
  }

  let result = form.value.template
  for (const [key, val] of Object.entries(sampleValues)) {
    result = result.split(key).join(val)
  }
  return result
})

async function loadTemplate() {
  try {
    const res = await fetchNamingTemplate()
    if (res) {
      const separator = res.separator || '_'
      form.value.separator = separator
      form.value.template = normalizeTemplateSeparator(res.template || '', separator)
      form.value.dateFormat = res.dateFormat || 'yyyyMMdd'
    }
  } catch {
    // use defaults
  }
}

async function handleSave() {
  if (!form.value.template.trim()) {
    Message.warning('请输入模板字符串')
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form.value,
      template: normalizeTemplateSeparator(form.value.template.trim(), form.value.separator || '_'),
    }
    form.value.template = payload.template
    await saveNamingTemplate(payload)
    Message.success('模板保存成功')
  } finally {
    saving.value = false
  }
}

onMounted(loadTemplate)
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
.template-card {
  max-width: 720px;
}
.preview-box {
  padding: 12px 16px;
  background: var(--mc-bg-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius-md);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: var(--mc-text-primary);
  min-height: 40px;
  word-break: break-all;
}
</style>
