# Skill: 类型定义

## 位置

`src/types/*.ts`

## 文件清单

| 文件 | 主要类型 |
|------|----------|
| `account.ts` | `SysUser / SysRole / SysDept / SysPost / UserInfo / RoleInfo / GetInfoResponse` + `isStrongPassword / getPasswordStrengthHint` |
| `ad.ts` | `Ad`（UI 简版） |
| `app.ts` | `App`（多租户应用） |
| `dashboard.ts` | `TrendPoint / DashboardData` |
| `drama.ts` | `Drama / Episode / Tag / AdUnlockRule / HomeSlot / RankItem / DramaCreateRequest / UnlockStatusVO / AdWatchResultVO / UnlockOptionVO` + 工具函数（`unlockModeLabel / unlockModeColor / unlockModeDesc / unlockRuleDesc`） |
| `user.ts` | `User / UserProfile / UserTrendPoint / UserTrendVO` |

## 约定

1. **后端字段映射**：类型保持后端原始字段名（`userName / nickName / phonenumber / createTime / deptId / sortWeight / clientKey / tenantId`），不做前端驼峰转换。
2. **联合字面量**：对状态 / 模式 / 枚举使用 `'IAA_ONLY' | 'IAP_ONLY' | 'IAA_IAP'` 等字面量联合，获得更好的 IDE 补全。
3. **工具函数与类型共存**：短剧的 `unlockModeLabel` 等 UI 文本派生函数直接放在 `types/drama.ts`，因它们依赖类型枚举值。
4. **API 返回类型**：在 API 文件中用 `request.get<T>()` 泛型标注，类型来自 `types/` 文件。

## 示例

```ts
// 短剧创建请求
import type { DramaCreateRequest } from '@/types/drama'
await request.post<DramaCreateResponse>('/drama/create-with-episodes-and-tags', payload)

// 仪表盘解析
import type { DashboardData } from '@/types/dashboard'
const data: DashboardData = await fetchDashboard()
```

## 扩展指导

- 新增 API 时，先在 `types/` 文件补类型，再在 `api/` 文件使用。
- 公共的"视图层派生"字段（如徽标颜色）放工具函数，避免污染纯粹 DTO 类型。
