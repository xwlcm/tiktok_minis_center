export interface SysUser {
  userId: number
  deptId?: number
  userName: string
  nickName: string
  userType?: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
  status: string
  loginIp?: string
  loginDate?: string
  remark?: string
  createTime?: string
  updateTime?: string
  deptName?: string
  roles?: SysRole[]
  roleIds?: number[]
  postIds?: number[]
  partnerName?: string; 
}

export interface SysRole {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope?: string
  status: string
  remark?: string
  createTime?: string
  flag?: boolean
  superAdmin?: boolean
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  menuIds?: number[]
  deptIds?: number[]
  clientKeys?: string[]
}

export interface SysDept {
  deptId: number
  parentId: number
  deptName: string
  orderNum: number
  status: string
  createTime?: string
  children?: SysDept[]
}

export interface SysPost {
  postId: number
  postCode: string
  postName: string
  postSort: number
  status: string
}

export interface RoleInfo {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope: string
  menuCheckStrictly: null | boolean
  deptCheckStrictly: null | boolean
  status: string
  remark: null | string
  createTime: null | string
  flag: boolean
  superAdmin: boolean
  menuIds?: number[]
  deptIds?: number[]
  clientKeys?: string[]
}

export interface UserInfo {
  userId: number
  tenantId: string
  deptId: number
  userName: string
  nickName: string
  userType: string
  email: string
  phonenumber: string
  sex: string
  avatar: null | string
  status: string
  loginIp: string
  loginDate: string
  remark: string
  createTime: string
  deptName: string
  roles: RoleInfo[]
  roleIds: null | number[]
  postIds: null | number[]
  roleId: null | number
}

export interface GetInfoResponse {
  user: UserInfo
  permissions: string[]
  roles: string[]
  applications: import('@/types/app.ts').App[]
}

export function isStrongPassword(pwd: string): boolean {
  return pwd.length >= 6
}

export function getPasswordStrengthHint(pwd: string): string {
  if (!pwd) return ''
  if (pwd.length < 6) return '密码至少 6 个字符'
  return ''
}
