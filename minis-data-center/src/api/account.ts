import request from '@/utils/request.ts'
import type { SysUser, SysRole, SysDept, SysPost, GetInfoResponse } from '@/types/account.ts'

export function fetchUserList(params?: {
  userName?: string
  phonenumber?: string
  status?: string
  deptId?: number
  pageNum?: number
  pageSize?: number
}) {
  return request.get<{ total: number; rows: SysUser[] }>('/system/user/list', { params })
}

export function fetchUserDetail(userId: number) {
  return request.get<SysUser>(`/system/user/${userId}`)
}

export function createUser(data: Partial<SysUser> & { password: string }) {
  return request.post<void>('/system/user', data)
}

export function updateUser(data: Partial<SysUser> & { userId: number }) {
  return request.put<void>('/system/user', data)
}

export function deleteUser(userIds: number | string) {
  return request.delete<void>(`/system/user/${userIds}`)
}

export function resetUserPwd(userId: number, password: string) {
  return request.put<void>('/system/user/resetPwd', { userId, password })
}

export function changeUserStatus(userId: number, status: string) {
  return request.put<void>('/system/user/changeStatus', { userId, status })
}

export function authUserRole(userId: number, roleIds: number[]) {
  return request.put<void>('/system/user/authRole', null, {
    params: { userId, roleIds: roleIds.join(',') },
  })
}

export function fetchRoleList(params?: {
  roleName?: string
  roleKey?: string
  status?: string
  pageNum?: number
  pageSize?: number
}) {
  return request.get<{ total: number; rows: SysRole[] }>('/system/role/list', { params })
}

export function fetchAllRoles() {
  return request.get<SysRole[]>('/system/role/list', { params: { pageSize: 999 } })
}

export function createRole(data: {
  roleName: string
  roleKey: string
  roleSort?: number
  dataScope?: string
  status?: string
  remark?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  menuIds?: number[]
  deptIds?: number[]
  clientKeys?: string[]
}) {
  return request.post<void>('/system/role', data)
}

export function updateRole(data: {
  roleId: number
  roleName?: string
  roleKey?: string
  roleSort?: number
  dataScope?: string
  status?: string
  remark?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  menuIds?: number[]
  deptIds?: number[]
  clientKeys?: string[]
}) {
  return request.put<void>('/system/role', data)
}

export function deleteRole(roleId: number) {
  return request.delete<void>(`/system/role/${roleId}`)
}

export function changeRoleStatus(roleId: number, status: string) {
  return request.put<void>('/system/role/changeStatus', { roleId, status })
}

export function fetchRoleMenuTree(roleId: number) {
  return request.get<{ menus: any[]; checkedKeys: number[] }>(`/system/menu/roleMenuTreeselect/${roleId}`)
}

export function fetchMenuTree() {
  return request.get<any[]>('/system/menu/treeselect')
}

export function updateRoleMenu(data: {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  status: string
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  menuIds: number[]
  deptIds?: number[]
  clientKeys?: string[]
}) {
  return request.put<void>('/system/role', data)
}

export function fetchRoleApps(roleId: number) {
  return request.get<string[]>(`/system/role/${roleId}/apps`)
}

export function updateRoleApps(roleId: number, clientKeys: string[]) {
  return request.put<void>(`/system/role/${roleId}/apps`, { clientKeys })
}

export function fetchDeptList(params?: { deptName?: string; status?: string }) {
  return request.get<SysDept[]>('/system/dept/list', { params })
}

export function fetchPostList() {
  return request.get<SysPost[]>('/system/post/list', { params: { pageSize: 999 } })
}

export function fetchCurrentAccount() {
  return request.get<GetInfoResponse>('/system/user/getInfo')
}
