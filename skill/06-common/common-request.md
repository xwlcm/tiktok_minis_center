# Skill: HTTP 请求封装

## 位置

`src/utils/request.ts`

## 设计要点

1. 基于 Axios 创建实例，`baseURL: '/api'`，超时 30 s。
2. 通过 Vite proxy 将 `/api/*` 转发到 `VITE_API_PROXY_TARGET`（默认 `http://192.168.88.50:8080/`）。
3. 请求拦截器自动注入：
   - **Authorization**：`Bearer <localStorage.token>`。
   - **clientid 头**：`localStorage.client_id`（RuoYi-Vue-Plus 约定）。
   - **clientKey**：默认自动注入到非豁免路径（GET → query；非 GET → body）。
4. 响应拦截器：
   - 统一解包 `{ code, data, rows, total, msg }`：`code === 0` 或 `code === 200` 视为成功；含 `rows + total` 返回 `{ rows, total }`，含 `data` 返回 `data`，否则返回整对象。
   - `code === 401` 或 HTTP 401：清理 Token / Store、`Message.error('登录已过期')` 并跳 `/login`。
   - `403` → `Message.error('无权限访问')`。
   - `>=500` → "服务器错误，请稍后重试"。
   - 非 `auth` 路径下其他错误统一 `Message.error`。

## clientKey 自动注入

```ts
const noClientKeyPaths = [
  '/api/auth/', '/api/system/', '/api/vod/',
  '/api/dashboard/', '/api/event/', '/api/episode/', '/api/user/',
]

if (!noClientKeyPaths.some(p => url.includes(p))) {
  const appStore = useAppStore()
  if (appStore.currentClientKey) {
    if (config.method === 'get') {
      config.params = { ...config.params, clientKey: appStore.currentClientKey }
    } else if (config.data && typeof config.data === 'object') {
      config.data = { ...config.data, clientKey: appStore.currentClientKey }
    }
  }
}
```

豁免路径需要作用域时，由 API 函数自己显式带 `appId` / `tenantId` 参数。

## 对外暴露

```ts
export default {
  request<T>(config),
  get<T>(url, config?),
  post<T>(url, data?, config?),
  put<T>(url, data?, config?),
  delete<T>(url, config?),
}
```

## 典型使用

```ts
// 自动注入 clientKey
request.get<{ rows: Drama[]; total: number }>('/drama/list', { params: { pageNum, pageSize } })

// 豁免路径：显式带 clientKey
request.get<number>('/dashboard/dau', {
  params: { clientKey: appStore.currentClientKey, statDate },
})

// 事件上报：显式带 X-Client-Key 头
request.post<void>('/event/report', data, {
  headers: { 'X-Client-Key': appStore.currentClientKey },
})
```

## 失败处理约定

- `auth` 路径（登录 / 登出）关闭全局错误弹窗，由调用方处理（避免"登录失败"被重复提示）。
- 其他路径由拦截器统一 `Message.error`，业务层只关心成功路径。
