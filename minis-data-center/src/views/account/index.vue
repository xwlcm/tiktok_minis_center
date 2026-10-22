<template>
  <div>
    <div class="page-header">
      <div>
        <div class="page-title">用户管理</div>
        <div class="page-subtitle">管理系统登录用户及角色分配</div>
      </div>
      <div class="header-actions">
        <a-button @click="openChangePassword">
          <template #icon><icon-lock /></template>
          修改密码
        </a-button>
        <a-button type="primary" @click="openCreate">
          <template #icon><icon-plus /></template>
          新增用户
        </a-button>
      </div>
    </div>

    <div class="toolbar">
      <a-input
        v-model="filters.userName"
        placeholder="搜索用户名..."
        allow-clear
        style="width: 200px"
        @keyup.enter="handleSearch"
      >
        <template #prefix><icon-search /></template>
      </a-input>
      <a-input
        v-model="filters.phonenumber"
        placeholder="手机号"
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
        :data="userList"
        :loading="loading"
        :pagination="{
          total,
          current: pageNum,
          pageSize,
          showTotal: true,
          showPageSize: true,
        }"
        row-key="userId"
        :bordered="false"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <template #userName="{ record }">
          <div class="user-cell">
            <a-avatar :size="28" class="user-avatar" :style="{ background: '#4c9de4' }">
              {{ (record.nickName || record.userName)?.[0]?.toUpperCase() }}
            </a-avatar>
            <div>
              <div class="user-name">{{ record.nickName || record.userName }}</div>
              <div class="user-account">@{{ record.userName }}</div>
            </div>
          </div>
        </template>

        <template #deptName="{ record }">
          <span>{{ record.deptName || '—' }}</span>
        </template>

        <template #phonenumber="{ record }">
          <span>{{ record.phonenumber || '—' }}</span>
        </template>

        <template #status="{ record }">
          <a-switch
            :model-value="record.status === '0'"
            :loading="togglingId === record.userId"
            :disabled="record.userId === currentUserId"
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
            <a-button type="primary" size="small" @click="openEdit(record)">编辑</a-button>
            <a-button type="primary" size="small" @click="openResetPwd(record)">重置密码</a-button>
            <a-button type="primary" size="small" @click="openAuthRole(record)">分配角色</a-button>
            <a-popconfirm
              v-if="record.userId !== currentUserId"
              content="确认删除该用户？"
              @ok="handleDelete(record.userId)"
            >
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </div>
        </template>
      </a-table>
    </div>

    <!-- 新增用户 -->
    <a-modal
      v-model:visible="createVisible"
      title="新增用户"
      :ok-loading="submitting"
      width="600px"
      @ok="handleCreate"
      @cancel="createVisible = false"
    >
      <a-form ref="createFormRef" :model="createForm" :rules="formRules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="userName" label="用户名">
              <a-input v-model="createForm.userName" placeholder="请输入用户名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="nickName" label="昵称">
              <a-input v-model="createForm.nickName" placeholder="请输入昵称" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="password" label="密码">
              <a-input-password v-model="createForm.password" placeholder="请输入密码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="email" label="邮箱">
              <a-input v-model="createForm.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="phonenumber" label="手机号">
              <a-input v-model="createForm.phonenumber" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="sex" label="性别">
              <a-select v-model="createForm.sex" placeholder="请选择">
                <a-option value="0">男</a-option>
                <a-option value="1">女</a-option>
                <a-option value="2">未知</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item field="partnerName" label="合作商">
              <a-input v-model="createForm.partnerName" placeholder="请输入合作商" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item field="deptId" label="部门">
              <a-tree-select
                v-model="createForm.deptId"
                :data="deptTreeData"
                placeholder="请选择部门"
                :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item field="status" label="状态">
              <a-radio-group v-model="createForm.status">
                <a-radio value="0">正常</a-radio>
                <a-radio value="1">停用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="createForm.remark" placeholder="备注（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑用户 -->
    <a-modal
      v-model:visible="editVisible"
      :title="`编辑用户 — ${editingUser?.userName}`"
      :ok-loading="submitting"
      width="600px"
      @ok="handleEdit"
      @cancel="editVisible = false"
    >
      <template v-if="editingUser">
        <a-form ref="editFormRef" :model="editForm" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="nickName" label="昵称">
                <a-input v-model="editForm.nickName" placeholder="请输入昵称" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="email" label="邮箱">
                <a-input v-model="editForm.email" placeholder="请输入邮箱" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="phonenumber" label="手机号">
                <a-input v-model="editForm.phonenumber" placeholder="请输入手机号" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="sex" label="性别">
                <a-select v-model="editForm.sex" placeholder="请选择">
                  <a-option value="0">男</a-option>
                  <a-option value="1">女</a-option>
                  <a-option value="2">未知</a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item field="deptId" label="部门">
                <a-tree-select
                  v-model="editForm.deptId"
                  :data="deptTreeData"
                  placeholder="请选择部门"
                  :field-names="{ key: 'deptId', title: 'deptName', children: 'children' }"
                  allow-clear
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item field="status" label="状态">
                <a-radio-group v-model="editForm.status">
                  <a-radio value="0">正常</a-radio>
                  <a-radio value="1">停用</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item field="remark" label="备注">
            <a-textarea v-model="editForm.remark" placeholder="备注（选填）" :auto-size="{ minRows: 2, maxRows: 4 }" />
          </a-form-item>
        </a-form>
      </template>
    </a-modal>

    <!-- 重置密码 -->
    <a-modal
      v-model:visible="resetPwdVisible"
      :title="`重置密码 — ${resetPwdUser?.userName}`"
      :ok-loading="submitting"
      width="420px"
      @ok="handleResetPwd"
      @cancel="resetPwdVisible = false"
    >
      <a-form :model="resetPwdForm" layout="vertical">
        <a-form-item label="新密码">
          <a-input-password v-model="resetPwdForm.password" placeholder="请输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分配角色 -->
    <a-modal
      v-model:visible="authRoleVisible"
      :title="`分配角色 — ${authRoleUser?.userName}`"
      :ok-loading="submitting"
      width="480px"
      @ok="handleAuthRole"
      @cancel="authRoleVisible = false"
    >
      <div v-if="authRoleUser" style="margin-bottom: 12px">
        <span style="color: rgba(22, 41, 63, 0.68); font-size: 12px">当前角色：</span>
        <a-tag v-for="role in authRoleUser.roles ?? []" :key="role.roleId" color="arcoblue">{{ role.roleName }}</a-tag>
        <span v-if="!authRoleUser.roles?.length" style="color: rgba(22, 41, 63, 0.41); font-size: 12px">无</span>
      </div>
      <a-form :model="authRoleForm" layout="vertical">
        <a-form-item label="选择角色">
          <a-checkbox-group v-model="authRoleForm.roleIds" direction="vertical">
            <a-checkbox v-for="role in allRoles" :key="role.roleId" :value="role.roleId">
              {{ role.roleName }}
              <span style="color: rgba(22, 41, 63, 0.41); font-size: 11px; margin-left: 4px">{{ role.roleKey }}</span>
            </a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改自己的密码 -->
    <a-modal
      v-model:visible="changePwdVisible"
      title="修改密码"
      :ok-loading="submitting"
      width="420px"
      @ok="handleChangePassword"
      @cancel="changePwdVisible = false"
    >
      <a-form :model="changePwdForm" layout="vertical">
        <a-form-item label="旧密码">
          <a-input-password v-model="changePwdForm.oldPassword" placeholder="请输入旧密码" />
        </a-form-item>
        <a-form-item label="新密码">
          <a-input-password v-model="changePwdForm.newPassword" placeholder="请输入新密码" />
        </a-form-item>
        <a-form-item label="确认新密码">
          <a-input-password v-model="changePwdForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  fetchUserList,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  resetUserPwd,
  authUserRole,
  fetchAllRoles,
  fetchDeptList,
} from '@/api/account.ts'
import { useAccountStore } from '@/stores/account.ts'
import type { SysUser, SysRole, SysDept } from '@/types/account.ts'

const accountStore = useAccountStore()
const currentUserId = computed(() => accountStore.current?.userId)

const loading = ref(false)
const userList = ref<SysUser[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const togglingId = ref<number | null>(null)

const allRoles = ref<SysRole[]>([])
const deptList = ref<SysDept[]>([])

const filters = reactive({
  userName: '',
  phonenumber: '',
  status: undefined as string | undefined,
})

const statusOptions = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
]

const columns = ref([
  { title: '用户', slotName: 'userName', width: 200, resizable: true, minWidth: 150 },
  { title: '部门', slotName: 'deptName', width: 130, resizable: true, minWidth: 100 },
  { title: '手机号', slotName: 'phonenumber', width: 130, resizable: true, minWidth: 100 },
  { title: '状态', slotName: 'status', width: 100, resizable: true, minWidth: 80 },
  { title: '创建时间', slotName: 'createTime', width: 160, resizable: true, minWidth: 120 },
  { title: '操作', slotName: 'operations', width: 230, resizable: true, minWidth: 180 },
])

const deptTreeData = computed(() => deptList.value)

async function fetchList() {
  loading.value = true
  try {
    const res = await fetchUserList({
      userName: filters.userName || undefined,
      phonenumber: filters.phonenumber || undefined,
      status: filters.status,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    })
    if (res && typeof res === 'object' && 'rows' in res) {
      userList.value = res.rows || []
      total.value = res.total || 0
    } else {
      userList.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    const res = await fetchAllRoles()
    if (Array.isArray(res)) {
      allRoles.value = res
    } else if (res && typeof res === 'object' && 'rows' in res) {
      allRoles.value = (res as any).rows || []
    }
  } catch {}
}

async function loadDepts() {
  try {
    deptList.value = await fetchDeptList() || []
  } catch {}
}

function handleSearch() { pageNum.value = 1; fetchList() }
function handleReset() {
  filters.userName = ''
  filters.phonenumber = ''
  filters.status = undefined
  pageNum.value = 1
  fetchList()
}
function handlePageChange(page: number) { pageNum.value = page; fetchList() }
function handlePageSizeChange(size: number) { pageSize.value = size; pageNum.value = 1; fetchList() }

async function handleToggleStatus(user: SysUser, active: boolean) {
  const newStatus = active ? '0' : '1'
  const oldStatus = user.status
  user.status = newStatus
  togglingId.value = user.userId
  try {
    await changeUserStatus(user.userId, newStatus)
    Message.success(active ? '已启用' : '已停用')
  } catch {
    user.status = oldStatus
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(userId: number) {
  await deleteUser(userId)
  Message.success('删除成功')
  fetchList()
}

// ── 新增用户 ──
const createVisible = ref(false)
const submitting = ref(false)
const createFormRef = ref()

const createForm = reactive({
  userName: '',
  nickName: '',
  password: '',
  email: '',
  phonenumber: '',
  sex: '0',
  deptId: undefined as number | undefined,
  status: '0',
  remark: '',
  partnerName: ''
})

const formRules = {
  userName: [{ required: true, message: '请输入用户名' }],
  nickName: [{ required: true, message: '请输入昵称' }],
  password: [{ required: true, message: '请输入密码' }],
}

function openCreate() {
  Object.assign(createForm, {
    userName: '', nickName: '', password: '', email: '',
    phonenumber: '', sex: '0', deptId: undefined, status: '0', remark: '',partnerName: ''
  })
  createVisible.value = true
}

async function handleCreate() {
  const errors = await createFormRef.value?.validate()
  if (errors) return
  submitting.value = true
  try {
    await createUser({
      userName: createForm.userName,
      nickName: createForm.nickName,
      password: createForm.password,
      email: createForm.email || undefined,
      phonenumber: createForm.phonenumber || undefined,
      sex: createForm.sex,
      deptId: createForm.deptId,
      status: createForm.status,
      remark: createForm.remark || undefined,
      partnerName: createForm.partnerName
    })
    Message.success('用户创建成功')
    createVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

// ── 编辑用户 ──
const editVisible = ref(false)
const editingUser = ref<SysUser | null>(null)
const editForm = reactive({
  nickName: '',
  email: '',
  phonenumber: '',
  sex: '0',
  deptId: undefined as number | undefined,
  status: '0',
  remark: '',
})

function openEdit(user: SysUser) {
  editingUser.value = user
  Object.assign(editForm, {
    nickName: user.nickName ?? '',
    email: user.email ?? '',
    phonenumber: user.phonenumber ?? '',
    sex: user.sex ?? '0',
    deptId: user.deptId,
    status: user.status ?? '0',
    remark: user.remark ?? '',
  })
  editVisible.value = true
}

async function handleEdit() {
  if (!editingUser.value) return
  submitting.value = true
  try {
    await updateUser({
      userId: editingUser.value.userId,
      nickName: editForm.nickName,
      email: editForm.email || undefined,
      phonenumber: editForm.phonenumber || undefined,
      sex: editForm.sex,
      deptId: editForm.deptId,
      status: editForm.status,
      remark: editForm.remark || undefined,
    })
    Message.success('用户更新成功')
    editVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

// ── 重置密码 ──
const resetPwdVisible = ref(false)
const resetPwdUser = ref<SysUser | null>(null)
const resetPwdForm = reactive({ password: '' })

function openResetPwd(user: SysUser) {
  resetPwdUser.value = user
  resetPwdForm.password = ''
  resetPwdVisible.value = true
}

async function handleResetPwd() {
  if (!resetPwdUser.value) return
  if (!resetPwdForm.password) {
    Message.error('请输入新密码')
    return
  }
  submitting.value = true
  try {
    await resetUserPwd(resetPwdUser.value.userId, resetPwdForm.password)
    Message.success('密码重置成功')
    resetPwdVisible.value = false
  } finally {
    submitting.value = false
  }
}

// ── 分配角色 ──
const authRoleVisible = ref(false)
const authRoleUser = ref<SysUser | null>(null)
const authRoleForm = reactive({ roleIds: [] as number[] })

function openAuthRole(user: SysUser) {
  authRoleUser.value = user
  authRoleForm.roleIds = user.roles?.map(r => r.roleId) ?? user.roleIds ?? []
  authRoleVisible.value = true
}

async function handleAuthRole() {
  if (!authRoleUser.value) return
  submitting.value = true
  try {
    await authUserRole(authRoleUser.value.userId, authRoleForm.roleIds)
    Message.success('角色分配成功')
    authRoleVisible.value = false
    fetchList()
  } finally {
    submitting.value = false
  }
}

// ── 修改自己的密码 ──
const changePwdVisible = ref(false)
const changePwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

function openChangePassword() {
  changePwdForm.oldPassword = ''
  changePwdForm.newPassword = ''
  changePwdForm.confirmPassword = ''
  changePwdVisible.value = true
}

async function handleChangePassword() {
  if (!changePwdForm.oldPassword) {
    Message.error('请输入旧密码')
    return
  }
  if (!changePwdForm.newPassword) {
    Message.error('请输入新密码')
    return
  }
  if (changePwdForm.newPassword !== changePwdForm.confirmPassword) {
    Message.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    await resetUserPwd(currentUserId.value!, changePwdForm.newPassword)
    Message.success('密码修改成功，请重新登录')
    changePwdVisible.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('client_id')
    accountStore.clear()
    window.location.href = '/login'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
  loadRoles()
  loadDepts()
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  flex-shrink: 0;
  font-size: 12px !important;
  font-weight: 700 !important;
}
.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--mc-text-primary);
}
.user-account {
  font-size: 12px;
  color: var(--mc-text-tertiary);
}

.row-actions { display: flex; gap: 4px; flex-wrap: wrap; }
</style>
