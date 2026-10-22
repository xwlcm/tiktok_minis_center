# 系统用户（账号）管理模块 — 概览

## 模块职责

管理**登录本管理后台的系统用户**（RuoYi-Vue-Plus 的 `SysUser`）：增删改查、启停、重置密码、分配角色、修改自己密码。此模块与 `02-user/` 的 C 端用户完全不同。

## 二级功能

| 功能 | 路由 | 视图 | Skill 文件 |
|------|------|------|------------|
| 用户管理（列表 + 新增 / 编辑 / 重置密码 / 分配角色 / 修改密码） | `/system/user` | `views/account/index.vue` | `account-list.md` |

## 数据模型（`src/types/account.ts`）

```ts
interface SysUser {
  userId: number
  deptId?: number
  userName: string
  nickName: string
  userType?: string
  email?: string
  phonenumber?: string
  sex?: string            // '0' 男 '1' 女 '2' 未知
  avatar?: string
  status: string          // '0' 正常 '1' 停用
  loginIp?: string
  loginDate?: string
  remark?: string
  createTime?: string
  updateTime?: string
  deptName?: string
  roles?: SysRole[]
  roleIds?: number[]
  postIds?: number[]
}

interface SysRole { roleId; roleName; roleKey; roleSort; dataScope?; status; ...  }
interface SysDept { deptId; parentId; deptName; orderNum; status; children?: SysDept[] }
interface SysPost { postId; postCode; postName; postSort; status }

interface UserInfo { /* 当前登录用户完整信息，见 account.ts */ }
interface GetInfoResponse { user: UserInfo; permissions: string[]; roles: string[]; applications: App[] }
```

## Store（`stores/account.ts`）

```ts
state: {
  userInfo: UserInfo | null
  permissions: string[]
  roleKeys: string[]
  applications: App[]
  menuPerms: MenuPermissions
}

getters:  { current, role, isAdmin, hasAllApps, allowedClientKeys, isLoggedIn }
actions:  { loadFromServer, setInfo, setCurrent, clear }
```

## API 端点（`src/api/account.ts`）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/system/user/list` | 分页列表（`userName / phonenumber / status / deptId / pageNum / pageSize`） |
| GET | `/system/user/:userId` | 用户详情 |
| POST | `/system/user` | 新增用户（含 `password`） |
| PUT | `/system/user` | 更新用户（含 `userId`） |
| DELETE | `/system/user/:userIds` | 支持多个 id 用逗号分隔 |
| PUT | `/system/user/resetPwd` | 重置密码 `{ userId, password }` |
| PUT | `/system/user/changeStatus` | 启停 `{ userId, status }` |
| PUT | `/system/user/authRole` | 分配角色 `{ userId, roleIds[] }` |
| GET | `/system/role/list` | 角色列表 |
| GET | `/system/dept/list` | 部门树 |
| GET | `/system/post/list` | 岗位列表 |
| GET | `/system/user/getInfo` | 当前登录用户信息 |

## 权限

仅 `canManageAccounts === true` 的账号可见此菜单（路径 `/system/user/*` 的权限）。
