# 公共基础 — 概览

## 模块职责

提供全项目共用的基础设施：路由与守卫、HTTP 请求封装、ECharts 按需引入、布局组件、样式体系、权限体系、类型定义、全局组件。Mock 文件保留但 `main.ts` 已不再注册。

## 子模块

| 子模块 | Skill 文件 |
|--------|------------|
| 路由配置 + 守卫 | `common-router.md` |
| HTTP 请求封装（`utils/request.ts`） | `common-request.md` |
| ECharts 按需引入（`utils/echarts.ts`） | `common-echarts.md` |
| 基础布局（`BasicLayout.vue`） | `common-layout.md` |
| Mock 数据系统（已下线，保留参考） | `common-mock.md` |
| 类型定义（`src/types/*`） | `common-types.md` |
| 全局组件（GlobalLoading / EmptyState / ResizableTable / AppSwitcher） | `common-components.md` |
| 权限体系（`accountStore.menuPerms`） | `common-auth.md` |
| 样式体系（tokens.css + global.css） | `common-styles.md` |
