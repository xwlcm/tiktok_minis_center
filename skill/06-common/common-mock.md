# Skill: Mock 数据系统（已停用）

## 现状

- Mock 依赖 `mockjs ^1.1.0` 及 `src/mock/*` 文件依然保留在仓库。
- 但 `src/main.ts` **已不再调用** `setupMock()`，项目完全对接真实后端（通过 Vite proxy → `VITE_API_PROXY_TARGET`）。
- 保留文件作为后端未就绪时的临时回退参考（例如断网演示、接口字段变更前的对比调试）。

## 目录结构（仅参考）

```
src/mock/
├── index.ts        # setupMock() 聚合注册
├── account.ts      # 系统账号 + 登录 mock
├── app.ts          # 应用列表
├── dashboard.ts    # 仪表盘
├── drama.ts        # 短剧（含 home）
├── user.ts         # C 端用户
└── ad.ts           # 广告规则
```

`src/mock/index.ts` 当前提供：

```ts
export function setupMock() {
  setupLoginMock()
  setupAppMock()
  setupDramaMock()
  setupHomeMock()
  setupUserMock()
  setupAdMock()
  setupDashboardMock()
  setupAccountMock()
  console.log('[Mock] 所有接口已启用 Mock 数据')
}
```

## 如需重新启用

1. 在 `src/main.ts` 中添加：

   ```ts
   import { setupMock } from '@/mock'

   const app = createApp(App)
   app.use(createPinia())
   if (import.meta.env.DEV) setupMock()   // 只在开发环境启用
   ```

2. 确认 `mockjs` 版本与后端返回结构对齐（`{ code, data, rows, total, msg }`）。
3. 留意项目已有的 ESLint 规则 `require-mock-regex-query-compat / require-mock-url-split-query`，避免 Mock 正则匹配在 query string 上失效。

## 长期方向

建议逐步删除 `src/mock/` 与 `mockjs` 依赖，或替换为 [MSW](https://mswjs.io/) 以支持在真实网络层做 mock 与契约测试。
