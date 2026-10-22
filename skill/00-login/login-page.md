# Skill: 登录页

## 功能描述

全屏深色背景 + Canvas 粒子动画的登录页，TikTok 风格红青双色光晕，自定义浮动 Label 表单，支持密码显示 / 隐藏切换、`@animationstart` 检测浏览器自动填充、错误抖动动画。登录成功后调用 `GET /system/user/getInfo` 拉取账号信息并跳转 `/dashboard`。

## 路由

- 路径：`/login`（路由名 `Login`，`meta.public = true`）
- 视图：`src/views/login/index.vue`
- 独立布局，不使用 `BasicLayout`

## UI 结构

```
.lw                         全屏容器（深色 + 光晕）
  ├─ canvas.lw__canvas      70-ish 粒子动画（鼠标连线）
  ├─ .lw__glow--red         红色光晕装饰
  ├─ .lw__glow--cyan        青色光晕装饰
  └─ .lc (+ .lc--shake)
        ├─ .lc__brand      六边形 Logo（渐变 stroke）+ "Minis / Data Center"
        ├─ .lc__heading    "欢迎回来" + "登录您的管理账号"
        ├─ form.lf
        │   ├─ .lf__field username   浮动 Label + 圆形头像图标 + 下划线
        │   ├─ .lf__field password   浮动 Label + 锁图标 + 眼睛切换 + 下划线
        │   ├─ .lf__error            错误提示（transition name="err"）
        │   └─ .lf__btn              主渐变按钮（loading 时显示 spinner）
        └─ .lc__hint       "演示账号 admin / admin123"
```

## 登录请求

登录调用 `api/auth.ts` 中的 `login(...)`，请求体遵循 RuoYi-Vue-Plus 的 `PasswordLoginBody`：

```ts
await login({
  clientId:  'pc',              // 必填
  grantType: 'password',        // 必填
  tenantId:  '000000',          // 可选，默认租户
  username:  formData.username,
  password:  formData.password,
})
```

响应：

```ts
{
  access_token: string
  refresh_token?: string
  expire_in: number
  client_id: string
  ...
}
```

## 成功流程

```ts
const res = await login({...})
localStorage.setItem('token', res.access_token)
localStorage.setItem('client_id', res.client_id || 'pc')
if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token)

const info = await fetchCurrentAccount()      // GET /system/user/getInfo
accountStore.setInfo(info)                    // userInfo + permissions[] + roles[] + applications[]
appStore.loadFromAccountStore()               // appList + 默认 clientKey

router.push('/dashboard')
```

## 错误处理

- 空字段 → `triggerError('请填写用户名和密码')` + 抖动动画。
- 接口失败 → 捕获 `err.message`；含 `'锁定'` 关键字的文案直接展示，其他统一提示。
- 成功后清空 `errorMsg`，按钮恢复。

## 交互细节

### 浮动 Label

```ts
focus = reactive({ username: false, password: false })
autofilled = reactive({ username: false, password: false })

<label :class="{ 'lf__label--up': focus.username || formData.username || autofilled.username }">
```

浏览器 **自动填充检测**：

```ts
@animationstart="onAutofill('username')"
// CSS 中定义 :-webkit-autofill 状态下触发一个命名 animation
```

### 密码显示切换

```ts
const showPwd = ref(false)
<input :type="showPwd ? 'text' : 'password'" />
<button @click="showPwd = !showPwd"><!-- 眼睛 svg --></button>
```

### 抖动

```ts
function triggerError(msg: string) {
  errorMsg.value = msg
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
}
```

## Canvas 粒子动画

- 粒子数量约 70（源码中在 `onMounted` 初始化时基于画布面积配比）。
- 每个粒子随机红 / 青色，缓慢漂移 + 边界反弹。
- 鼠标附近 150 px 内粒子连线，透明度随距离衰减。
- 使用 `requestAnimationFrame` 驱动；`onUnmounted` 取消。

## 样式 Token

- 按钮渐变：`linear-gradient(135deg, #D94466, #5BA8B0)`，Hover 时 `linear-gradient(135deg, #f5305e, #6FB8BF)`。
- 输入框下划线：聚焦时从灰色变青色（`--mc-primary`）。
- 错误态：字段下划线变红色（`--mc-danger`）。

## 与守卫的协作

- 登录页通过 `meta.public = true` 避免触发 `beforeEach` 中的 Token 检查。
- 如果用户在已登录状态下直接访问 `/login`，不会被自动跳走（可按需增加跳转）。
