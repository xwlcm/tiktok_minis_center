<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">角色管理</div>
        <div class="page-subtitle">管理系统角色、菜单权限及应用关联</div>
      </div>
      <div class="header-actions">
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增角色
        </a-button>
      </div>
    </div>

    <div class="toolbar">
      <a-input
        v-model="filters.roleName"
        placeholder="搜索角色名称..."
        allow-clear
        style="width: 200px"
        @keyup.enter="handleSearch"
      >
        <template #prefix><icon-search /></template>
      </a-input>
      <a-input
        v-model="filters.roleKey"
        placeholder="权限标识"
        allow-clear
        style="width: 160px"
        @keyup.enter="handleSearch"
      />
      <a-select
        v-model="filters.status"
        placeholder="状态"
        allow-clear
        style="width: 110px"
        :options="statusOptions"
      />
      <a-button type="primary" @click="handleSearch">搜索</a-button>
      <a-button @click="handleReset">重置</a-button>
    </div>

    <div class="table-card">
      <a-table
        :columns="columns"
        :data="roleList"
        :loading="loading"
        :pagination="{
          total,
          current: pageNum,
          pageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="roleId"
        :bordered="false"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #roleName="{ record }">
          <div class="role-cell">
            <a-avatar :size="28" class="role-avatar" :style="{ background: '#4c9de4' }">
              {{ record.roleName?.[0] }}
            </a-avatar>
            <div>
              <div class="role-name">{{ record.roleName }}</div>
              <div class="role-key">{{ record.roleKey }}</div>
            </div>
          </div>
        </template>

        <template #dataScope="{ record }">
          <a-tag :color="dataScopeColor(record.dataScope)">{{ dataScopeLabel(record.dataScope) }}</a-tag>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="record.status === '0'"
            :loading="togglingId === record.roleId"
            :disabled="record.roleKey === 'admin' || record.roleKey === 'superadmin'"
            checked-text="正常"
            unchecked-text="停用"
            @change="(val: string | number | boolean) => handleToggleStatus(record, !!val)"
          />
        </template>

        <template #createTime="{ record }">
          <span>{{ record.createTime || '—' }}</span>
        </template>

        <template #operations="{ record }">
          <div class="row-actions">
            <a-button
              type="primary"
              size="small"
              :disabled="record.roleKey === 'superadmin'"
              @click="openEdit(record)"
            >编辑</a-button>
            <a-button
              type="primary"
              size="small"
              :disabled="record.roleKey === 'superadmin'"
              @click="openMenuAssign(record)"
            >菜单权限</a-button>
            <a-button
              type="primary"
              size="small"
              :disabled="record.roleKey === 'superadmin'"
              @click="openAppAssign(record)"
            >应用关联</a-button>
            <a-popconfirm
              v-if="record.roleKey !== 'admin' && record.roleKey !== 'superadmin'"
              content="确认删除该角色？"
              @ok="handleDelete(record.roleId)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑角色 -->
    <a-modal
      v-model:visible="formVisible"
      :title="isEdit ? `编辑角色 — ${editingRole?.roleName}` : '新增角色'"
      :ok-loading="submitting"
      width="520px"
      :footer="false"
      @cancel="handleModalCancel"
    >
      <div v-if="isWizardMode && !isEdit">
        <!-- 步骤指示器 -->
        <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px">
          <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', color: wizardStep >= 1 ? 'var(--mc-text-primary)' : 'var(--mc-text-tertiary)' }">
            <span :style="{ width: '24px', height: '24px', borderRadius: '50%', background: wizardStep >= 1 ? 'var(--mc-color-primary)' : 'var(--mc-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }">1</span>
            <span style="font-size: 13px">基本信息</span>
          </div>
          <span :style="{ width: '24px', height: '2px', background: wizardStep >= 2 ? 'var(--mc-color-primary)' : 'var(--mc-border)' }"></span>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', color: wizardStep >= 2 ? 'var(--mc-text-primary)' : 'var(--mc-text-tertiary)' }">
            <span :style="{ width: '24px', height: '24px', borderRadius: '50%', background: wizardStep >= 2 ? 'var(--mc-color-primary)' : 'var(--mc-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }">2</span>
            <span style="font-size: 13px">菜单权限</span>
          </div>
          <span :style="{ width: '24px', height: '2px', background: wizardStep >= 3 ? 'var(--mc-color-primary)' : 'var(--mc-border)' }"></span>
          <div :style="{ display: 'flex', alignItems: 'center', gap: '4px', color: wizardStep >= 3 ? 'var(--mc-text-primary)' : 'var(--mc-text-tertiary)' }">
            <span :style="{ width: '24px', height: '24px', borderRadius: '50%', background: wizardStep >= 3 ? 'var(--mc-color-primary)' : 'var(--mc-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }">3</span>
            <span style="font-size: 13px">应用权限</span>
          </div>
        </div>

        <!-- 步骤 1：基本信息 -->
        <div v-if="wizardStep === 1">
          <a-form ref="formRef" :model="roleForm" :rules="formRules" layout="vertical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item field="roleName" label="角色名称">
                  <a-input v-model="roleForm.roleName" placeholder="如：运营主管" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="roleKey" label="权限标识">
                  <a-input
                    v-model="roleForm.roleKey"
                    placeholder="如：operator"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item field="roleSort" label="排序">
                  <a-input-number v-model="roleForm.roleSort" :min="0" :max="999" style="width: 100%" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="status" label="状态">
                  <a-radio-group v-model="roleForm.status">
                    <a-radio value="0">正常</a-radio>
                    <a-radio value="1">停用</a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item field="remark" label="备注">
              <a-textarea v-model="roleForm.remark" placeholder="备注（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
            </a-form-item>
            <div style="margin-top: 24px; display: flex; justify-content: flex-end">
              <a-button type="primary" @click="handleWizardNext">下一步</a-button>
            </div>
          </a-form>
        </div>

        <!-- 步骤 2：菜单权限 -->
        <div v-if="wizardStep === 2">
          <div style="margin-bottom: 8px; display: flex; gap: 12px">
            <a-checkbox v-model="menuCheckStrictly">父子联动</a-checkbox>
            <a-button size="mini" @click="handleCheckAll">全选</a-button>
            <a-button size="mini" @click="handleUncheckAll">全不选</a-button>
          </div>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid rgba(22, 41, 63, 0.11); border-radius: 6px; padding: 8px">
            <a-tree
              ref="menuTreeRef"
              :checked-keys="menuCheckedKeys"
              :data="menuTreeData"
              checkable
              :check-strictly="!menuCheckStrictly"
              default-expand-all
              @check="handleMenuCheck"
            />
          </div>
          <div style="margin-top: 24px; display: flex; justify-content: space-between">
            <a-button @click="handleWizardPrev">上一步</a-button>
            <a-button type="primary" @click="handleWizardNext">下一步</a-button>
          </div>
        </div>

        <!-- 步骤 3：应用权限 -->
        <div v-if="wizardStep === 3">
          <div style="margin-bottom: 12px; color: rgba(22, 41, 63, 0.68); font-size: 12px">
            选择该角色可访问的应用（用户切换应用时需要角色关联）
          </div>
          <a-checkbox-group v-model="appCheckedKeys" direction="vertical">
            <a-checkbox v-for="app in allApps" :key="app.clientKey" :value="app.clientKey">
              <div style="display: flex; align-items: center; gap: 8px">
                <a-avatar :size="24" shape="square" :style="{ background: '#4c9de4', fontSize: '11px', fontWeight: 700 }">
                  {{ app.appName[0] }}
                </a-avatar>
                <span>{{ app.appName }}</span>
                <span style="color: rgba(22, 41, 63, 0.41); font-size: 11px">{{ app.clientKey }}</span>
              </div>
            </a-checkbox>
          </a-checkbox-group>
          <div style="margin-top: 24px; display: flex; justify-content: space-between">
            <a-button @click="handleWizardPrev">上一步</a-button>
            <a-button type="primary" :disabled="appCheckedKeys.length === 0" @click="handleWizardSubmit">确定</a-button>
          </div>
        </div>
      </div>

      <!-- 编辑角色：保持原有表单 -->
      <div v-else>
        <a-form ref="formRef" :model="roleForm" :rules="formRules" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="roleName" label="角色名称">
                <a-input v-model="roleForm.roleName" placeholder="如：运营主管" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="roleKey" label="权限标识">
                <a-input
                  v-model="roleForm.roleKey"
                  placeholder="如：operator"
                  :disabled="isEdit && (editingRole?.roleKey === 'admin')"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="roleSort" label="排序">
                <a-input-number v-model="roleForm.roleSort" :min="0" :max="999" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="status" label="状态">
                <a-radio-group v-model="roleForm.status">
                  <a-radio value="0">正常</a-radio>
                  <a-radio value="1">停用</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item field="dataScope" label="数据范围">
            <a-select v-model="roleForm.dataScope" :options="dataScopeOptions" />
          </a-form-item>
          <a-form-item v-if="roleForm.dataScope === '2'" field="deptIds" label="部门权限">
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid rgba(22, 41, 63, 0.11); border-radius: 6px; padding: 8px">
              <div style="margin-bottom: 8px; display: flex; gap: 12px">
                <a-checkbox v-model="deptCheckStrictly">父子联动</a-checkbox>
                <a-button size="mini" @click="handleDeptCheckAll">全选</a-button>
                <a-button size="mini" @click="handleDeptUncheckAll">全不选</a-button>
              </div>
              <a-tree
                ref="deptTreeRef"
                :checked-keys="deptCheckedKeys"
                :data="deptTreeData"
                checkable
                :check-strictly="!deptCheckStrictly"
                default-expand-all
                @check="handleDeptCheck"
              />
            </div>
          </a-form-item>
          <a-form-item field="remark" label="备注">
            <a-textarea v-model="roleForm.remark" placeholder="备注（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
          </a-form-item>
        </a-form>
        <div style="margin-top: 24px; display: flex; justify-content: flex-end">
          <a-button @click="formVisible = false">取消</a-button>
          <a-button type="primary" :loading="submitting" @click="handleSubmitRole">确定</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 菜单权限分配 -->
    <a-modal
      v-model:visible="menuVisible"
      :title="`菜单权限 — ${menuRole?.roleName}`"
      :ok-loading="submitting"
      width="520px"
      @ok="handleSubmitMenu"
      @cancel="menuVisible = false"
    >
      <div style="margin-bottom: 8px; display: flex; gap: 12px">
        <a-checkbox v-model="menuCheckStrictly">父子联动</a-checkbox>
        <a-button size="mini" @click="handleCheckAll">全选</a-button>
        <a-button size="mini" @click="handleUncheckAll">全不选</a-button>
      </div>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid rgba(22, 41, 63, 0.11); border-radius: 6px; padding: 8px">
        <a-tree
          ref="menuTreeRef"
          :checked-keys="menuCheckedKeys"
          :data="menuTreeData"
          checkable
          :check-strictly="!menuCheckStrictly"
          default-expand-all
          @check="handleMenuCheck"
        />
      </div>
    </a-modal>

    <!-- 应用关联 -->
    <a-modal
      v-model:visible="appVisible"
      :title="`应用关联 — ${appRole?.roleName}`"
      :ok-loading="submitting"
      width="480px"
      @ok="handleSubmitApp"
      @cancel="appVisible = false"
    >
      <div style="margin-bottom: 12px; color: rgba(22, 41, 63, 0.68); font-size: 12px">
        选择该角色可访问的应用（用户切换应用时需要角色关联）
      </div>
      <a-checkbox-group v-model="appCheckedKeys" direction="vertical">
        <a-checkbox v-for="app in allApps" :key="app.clientKey" :value="app.clientKey">
          <div style="display: flex; align-items: center; gap: 8px">
            <a-avatar :size="24" shape="square" :style="{ background: '#4c9de4', fontSize: '11px', fontWeight: 700 }">
              {{ app.appName[0] }}
            </a-avatar>
            <span>{{ app.appName }}</span>
            <span style="color: rgba(22, 41, 63, 0.41); font-size: 11px">{{ app.clientKey }}</span>
          </div>
        </a-checkbox>
      </a-checkbox-group>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchRoleList,
  createRole,
  updateRole,
  deleteRole,
  changeRoleStatus,
  fetchRoleMenuTree,
  fetchMenuTree,
  updateRoleMenu,
  fetchRoleApps,
  updateRoleApps,
  fetchDeptList,
} from '@/api/account.ts'
import { fetchAppList } from '@/api/app.ts'
import type { SysRole, SysDept } from '@/types/account.ts'

const loading = ref(false)
const roleList = ref<SysRole[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const togglingId = ref<number | null>(null)
const submitting = ref(false)

const filters = reactive({
  roleName: '',
  roleKey: '',
  status: undefined as string | undefined,
})

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

const dataScopeOptions = [
  { label: '全部数据权限', value: '1' },
  { label: '自定数据权限', value: '2' },
  { label: '本部门数据权限', value: '3' },
  { label: '部门及以下', value: '4' },
  { label: '仅本人', value: '5' },
  { label: '部门及以下或本人', value: '6' },
]

const columns = [
  { title: '角色', slotName: 'roleName', width: 200 },
  { title: '数据范围', slotName: 'dataScope', width: 130 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', slotName: 'createTime', width: 160 },
  { title: '操作', slotName: 'operations', width: 280 },
]

function dataScopeLabel(scope: string | undefined) {
  const map: Record<string, string> = {
    '1': '全部', '2': '自定义', '3': '本部门',
    '4': '部门及以下', '5': '仅本人', '6': '部门及以下或本人',
  }
  return map[scope || ''] || '未知'
}

function dataScopeColor(scope: string | undefined) {
  const map: Record<string, string> = {
    '1': 'green', '2': 'blue', '3': 'orange',
    '4': 'orangered', '5': 'red', '6': 'purple',
  }
  return map[scope || ''] || 'gray'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await fetchRoleList({
      roleName: filters.roleName || undefined,
      roleKey: filters.roleKey || undefined,
      status: filters.status,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    if (res && typeof res === 'object' && 'rows' in res) {
      roleList.value = (res as { rows?: SysRole[]; total?: number }).rows || []
      total.value = (res as { rows?: SysRole[]; total?: number }).total || 0
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() { pageNum.value = 1; fetchList() }
function handleReset() {
  filters.roleName = ''
  filters.roleKey = ''
  filters.status = undefined
  pageNum.value = 1
  fetchList()
}
function handlePageChange(page: number) { pageNum.value = page; fetchList() }
function handlePageSizeChange(size: number) { pageSize.value = size; pageNum.value = 1; fetchList() }

async function handleToggleStatus(role: SysRole, active: boolean) {
  const newStatus = active ? '0' : '1'
  togglingId.value = role.roleId
  try {
    await changeRoleStatus(role.roleId, newStatus)
    role.status = newStatus
    Message.success(active ? '已启用' : '已停用')
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(roleId: number) {
  await deleteRole(roleId)
  Message.success('删除成功')
  fetchList()
}

// ── 向导流程控制 ──
const wizardStep = ref(1)
const isWizardMode = ref(false)

// ── 新增/编辑角色 ──
const formVisible = ref(false)
const isEdit = ref(false)
const editingRole = ref<SysRole | null>(null)
const formRef = ref()

const roleForm = reactive({
  roleName: '',
  roleKey: '',
  roleSort: 0,
  dataScope: '1',
  status: '0',
  remark: '',
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  menuIds: [] as number[],
  deptIds: [] as number[],
  clientKeys: [] as string[],
})

const formRules = {
  roleName: [{ required: true, message: '请输入角色名称' }],
  roleKey: [{ required: true, message: '请输入权限标识' }],
}

// 部门树选择相关
const deptTreeData = ref<SysDept[]>([])
const deptCheckedKeys = ref<(string | number)[]>([])
const deptCheckStrictly = ref(true)
const deptTreeRef = ref()

function transformDeptTree(nodes: SysDept[]): SysDept[] {
  return nodes.map(node => {
    const item: SysDept = {
      deptId: node.deptId,
      parentId: node.parentId,
      deptName: node.deptName,
      orderNum: node.orderNum,
      status: node.status,
      children: node.children ? transformDeptTree(node.children) : undefined,
    }
    return item
  })
}

async function loadDeptTree() {
  try {
    const res: SysDept[] = await fetchDeptList()
    deptTreeData.value = transformDeptTree(res)
  } catch {
  }
}

function handleDeptCheck(checkedKeys: (string | number)[] | { checked: (string | number)[]; halfChecked: (string | number)[] }) {
  if (Array.isArray(checkedKeys)) {
    deptCheckedKeys.value = checkedKeys
  } else {
    deptCheckedKeys.value = checkedKeys.checked || []
  }
}

function handleDeptCheckAll() {
  const allKeys: number[] = []
  function collect(nodes: SysDept[]) {
    for (const node of nodes) {
      allKeys.push(node.deptId)
      if (node.children) collect(node.children)
    }
  }
  collect(deptTreeData.value)
  deptCheckedKeys.value = allKeys
}

function handleDeptUncheckAll() {
  deptCheckedKeys.value = []
}

// ── 向导流程控制 ──
function handleWizardPrev() {
  if (wizardStep.value === 3) {
    wizardStep.value = 2
  } else if (wizardStep.value === 2) {
    wizardStep.value = 1
  }
}

async function handleWizardNext() {
  if (wizardStep.value === 1) {
    const errors = await formRef.value?.validate()
    if (errors) return
    wizardStep.value = 2
    await loadMenuTree()
  } else if (wizardStep.value === 2) {
    roleForm.menuIds = menuCheckedKeys.value.map(Number)
    wizardStep.value = 3
    await loadApps()
  }
}

async function loadMenuTree() {
  try {
    if (isEdit.value && editingRole.value?.roleId) {
      // 编辑模式，加载已有角色的菜单
      const res: any = await fetchRoleMenuTree(editingRole.value.roleId)
      menuTreeData.value = transformMenuTree(res?.menus || [])
      menuCheckedKeys.value = (res?.checkedKeys || []).map(String)
    } else {
      // 新建模式，只加载菜单树
      const res: any = await fetchMenuTree()
      menuTreeData.value = transformMenuTree(res || [])
      menuCheckedKeys.value = []
    }
  } catch {
  }
}

async function loadApps() {
  try {
    const apps: any = await fetchAppList()
    allApps.value = ((apps as any)?.rows || apps || []).map((a: any) => ({
      clientKey: a.clientKey,
      appName: a.appName,
    }))
  } catch {
  }
}

async function handleWizardSubmit() {
  roleForm.clientKeys = appCheckedKeys.value.map(String)
  submitting.value = true
  try {
    await createRole(roleForm)
    Message.success('角色创建成功')
    formVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

function openCreate() {
  isEdit.value = false
  editingRole.value = null
  isWizardMode.value = true
  wizardStep.value = 1
  Object.assign(roleForm, {
    roleName: '',
    roleKey: '',
    roleSort: 0,
    dataScope: '1',
    status: '0',
    remark: '',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    menuIds: [],
    deptIds: [],
    clientKeys: [],
  })
  formVisible.value = true
}

function openEdit(role: SysRole) {
  isEdit.value = true
  editingRole.value = role
  Object.assign(roleForm, {
    roleName: role.roleName,
    roleKey: role.roleKey,
    roleSort: role.roleSort,
    dataScope: role.dataScope || '1',
    status: role.status,
    remark: role.remark || '',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    menuIds: [],
    deptIds: [],
    clientKeys: [],
  })
  formVisible.value = true
}

async function handleSubmitRole() {
  const errors = await formRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    if (isEdit.value && editingRole.value) {
      await updateRole({
        roleId: editingRole.value.roleId,
        ...roleForm,
      })
      Message.success('角色更新成功')
    } else {
      await createRole(roleForm)
      Message.success('角色创建成功')
    }
    formVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

// ── 菜单权限 ──
const menuVisible = ref(false)
const menuRole = ref<SysRole | null>(null)
const menuTreeData = ref<any[]>([])
const menuCheckedKeys = ref<(string | number)[]>([])
const menuCheckStrictly = ref(true)
const menuTreeRef = ref()

async function openMenuAssign(role: SysRole) {
  menuRole.value = role
  menuCheckedKeys.value = []
  menuTreeData.value = []
  menuVisible.value = true
  try {
    const res: any = await fetchRoleMenuTree(role.roleId)
    menuTreeData.value = transformMenuTree(res?.menus || [])
    menuCheckedKeys.value = (res?.checkedKeys || []).map(String)
  } catch {
  }
}

/**
 * 将后端 Hutool Tree 数据转换为 Arco Tree 标准格式
 */
function transformMenuTree(nodes: any[]): any[] {
  return nodes.map(node => {
    const item: any = {
      key: String(node.id),
      title: node.label || '未命名',
    }
    if (node.children && node.children.length > 0) {
      item.children = transformMenuTree(node.children)
    }
    return item
  })
}

function handleMenuCheck(checkedKeys: (string | number)[] | { checked: (string | number)[]; halfChecked: (string | number)[] }) {
  if (Array.isArray(checkedKeys)) {
    menuCheckedKeys.value = checkedKeys
  } else {
    menuCheckedKeys.value = checkedKeys.checked || []
  }
}

function handleCheckAll() {
  const allKeys: string[] = []
  function collect(nodes: any[]) {
    for (const node of nodes) {
      allKeys.push(node.key)
      if (node.children) collect(node.children)
    }
  }
  collect(menuTreeData.value)
  menuCheckedKeys.value = allKeys
}

function handleUncheckAll() {
  menuCheckedKeys.value = []
}

function handleModalCancel() {
  if (isWizardMode.value && wizardStep.value > 1) {
    Message.warning('当前步骤未完成，确认要关闭吗？')
    return
  }
  formVisible.value = false
}

async function handleSubmitMenu() {
  if (!menuRole.value) return
  submitting.value = true
  try {
    await updateRoleMenu({
      roleId: menuRole.value.roleId,
      roleName: menuRole.value.roleName,
      roleKey: menuRole.value.roleKey,
      roleSort: menuRole.value.roleSort,
      status: menuRole.value.status,
      dataScope: menuRole.value.dataScope || '1',
      menuCheckStrictly: menuCheckStrictly.value,
      deptCheckStrictly: true,
      menuIds: menuCheckedKeys.value.map(Number),
      deptIds: [],
      clientKeys: [],
    })
    Message.success('菜单权限更新成功')
    menuVisible.value = false
  } finally {
    submitting.value = false
  }
}

// ── 应用关联 ──
const appVisible = ref(false)
const appRole = ref<SysRole | null>(null)
const allApps = ref<{ clientKey: string; appName: string }[]>([])
const appCheckedKeys = ref<string[]>([])

async function openAppAssign(role: SysRole) {
  appRole.value = role
  appCheckedKeys.value = []
  appVisible.value = true
  try {
    const [apps, roleApps] = await Promise.all([
      fetchAppList(),
      fetchRoleApps(role.roleId),
    ])
    allApps.value = ((apps as any)?.rows || apps || []).map((a: any) => ({
      clientKey: a.clientKey,
      appName: a.appName,
    }))
    appCheckedKeys.value = roleApps || []
  } catch {
  }
}

async function handleSubmitApp() {
  if (!appRole.value) return
  submitting.value = true
  try {
    await updateRoleApps(appRole.value.roleId, appCheckedKeys.value)
    Message.success('应用关联更新成功')
    appVisible.value = false
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-title { font-size: 18px; font-weight: 700; color: var(--mc-text-primary); }
.page-subtitle { font-size: 12px; color: var(--mc-text-tertiary); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }

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

.role-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.role-avatar {
  flex-shrink: 0;
  font-size: 12px !important;
  font-weight: 700 !important;
}
.role-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--mc-text-primary);
}
.role-key {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.row-actions { display: flex; gap: 4px; flex-wrap: wrap; }
</style>
