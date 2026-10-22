# Skill: 系统用户管理（列表 + 维护）

## 功能描述

单页集成：列表、搜索、新增、编辑、启停、重置密码、分配角色、修改自己密码。

## 路由

- 路径：`/system/user`（路由名 `SystemUser`）
- 视图：`src/views/account/index.vue`

## 页面结构

```
page-header
  ├─ page-title "用户管理"
  └─ header-actions
       ├─ 修改密码 按钮
       └─ 新增用户 按钮
toolbar
  ├─ a-input 用户名
  ├─ a-input 手机号
  ├─ a-select 状态
  └─ 搜索 / 重置 按钮
table-card
  └─ a-table（分页 + 角色 / 重置密码 / 分配角色 / 删除操作）
5 个 Modal：
  ├─ 新增用户
  ├─ 编辑用户
  ├─ 重置密码
  ├─ 分配角色
  └─ 修改自己密码
```

## 列定义

```ts
[
  { title: '用户',    slotName: 'userName',     width: 200, ... },
  { title: '部门',    slotName: 'deptName',     width: 130, ... },
  { title: '手机号',   slotName: 'phonenumber', width: 130, ... },
  { title: '状态',    slotName: 'status',       width: 100, ... },
  { title: '创建时间', slotName: 'createTime',  width: 160, ... },
  { title: '操作',    slotName: 'operations',   width: 230, ... },
]
```

- **用户**：首字母 Avatar（青底）+ 昵称 + `@userName`。
- **状态**：`a-switch`（`status === '0'` 启用）；当前登录用户不可改自己的状态。
- **操作**：编辑 / 重置密码 / 分配角色 / 删除（当前登录用户不可删）。

## Modal：新增用户

字段：`userName / nickName / password / email / phonenumber / sex / deptId / status / remark`。  
- `deptId` 通过 `a-tree-select` 选部门（`fetchDeptList`）。
- 校验：`userName / nickName / password` 必填。

## Modal：编辑用户

与新增类似但不含密码字段，`userId` 从编辑对象带入。

## Modal：重置密码

仅输入 `password`，提交 `resetUserPwd(userId, password)`。

## Modal：分配角色

- 顶部展示当前角色 `a-tag` 列表。
- `a-checkbox-group` 列出全部角色（`fetchAllRoles`）。
- 提交 `authUserRole(userId, roleIds[])`。

## Modal：修改自己的密码

- 三个字段：`oldPassword / newPassword / confirmPassword`。
- 前端校验：两次一致 + 非空。
- 提交调用 `resetUserPwd(currentUserId, newPassword)`；成功后清 Token、清 Store、跳 `/login`。

## 关键逻辑

```ts
async function handleToggleStatus(user: SysUser, active: boolean) {
  const newStatus = active ? '0' : '1'
  const oldStatus = user.status
  user.status = newStatus              // 乐观更新
  try {
    await changeUserStatus(user.userId, newStatus)
    Message.success(active ? '已启用' : '已停用')
  } catch {
    user.status = oldStatus             // 回滚
  }
}
```

## 依赖

- `fetchUserList / createUser / updateUser / deleteUser / changeUserStatus / resetUserPwd / authUserRole / fetchAllRoles / fetchDeptList`
- `useAccountStore().current` 判断"不能操作自己"
- Arco 组件：`a-modal / a-form / a-input / a-input-password / a-tree-select / a-select / a-radio-group / a-checkbox-group / a-switch / a-popconfirm`
