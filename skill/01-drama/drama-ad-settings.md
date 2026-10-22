# Skill: 短剧广告推送设置

## 功能描述

逐部短剧配置「免费集数 / 解锁模式 / 广告解锁规则 / 单集价格 / 整剧价格」。该页面不创建短剧，仅修改已有短剧的解锁策略字段。

## 路由

- 路径：`/drama/ad-settings`（路由名 `DramaAdSettings`，被 `BasicLayout` `keep-alive`）
- 视图：`src/views/drama/ad-settings.vue`

## 页面结构

```
page-header
  ├─ page-title "广告推送设置"
  └─ page-subtitle "为每部短剧配置免费集数和解锁模式"
toolbar
  └─ a-input-search  按名称过滤（前端 computed 过滤）
table-card
  └─ ResizableTable > a-table[pagination pageSize=20]
a-modal  配置 Modal
```

## 列定义

| 列 | 内容 |
|----|------|
| 短剧 | 封面 + 名称 |
| 免费集数 | `config-value`（集） |
| 解锁模式 | `a-tag[unlockModeColor]` |
| 广告规则 | `getRuleName(adUnlockRuleId)` |
| 单集价格 | `(episodePrice / 100).toFixed(2)` 元 |
| 整剧价格 | `(bundlePrice / 100).toFixed(2)` 元 |
| 操作 | 配置 → 打开 Modal |

## 表单字段

| 字段 | 组件 | 显隐规则 |
|------|------|----------|
| 免费集数 `freeEpisodes` | `a-input-number` | 总是显示 |
| 解锁模式 `unlockMode` | `a-select(IAA_ONLY / IAP_ONLY / IAA_IAP)` | 总是显示 |
| 广告解锁规则 `adUnlockRuleId` | `a-select` | 仅 `IAA_ONLY / IAA_IAP` 时显示 |
| 单集价格 `episodePrice` | `a-input-number` | 仅 `IAP_ONLY / IAA_IAP` 时显示 |
| 整剧价格 `bundlePrice` | `a-input-number` | 仅 `IAP_ONLY / IAA_IAP` 时显示 |

## 关键逻辑

```ts
async function loadData() {
  const res = await fetchDramaList()
  dramaList.value = res.rows ?? []
}

async function loadAdUnlockRules() {
  adUnlockRules.value = await fetchAdUnlockRuleList() || []
}

function getRuleName(id?: number) {
  if (!id) return '—'
  return adUnlockRules.value.find(r => r.id === id)?.ruleName ?? `规则 #${id}`
}

async function handleSave() {
  await updateDrama(editingDrama.value!.id, {
    freeEpisodes, unlockMode, adUnlockRuleId, episodePrice, bundlePrice,
  })
  loadData()
}
```

## 搜索

本地 computed 过滤：

```ts
const filteredList = computed(() =>
  keyword.value ? dramaList.value.filter(d => d.name.includes(keyword.value)) : dramaList.value
)
```

## 注意

- 广告解锁规则通过 `04-ad/` 模块维护。短剧仅引用其 `id`。
- 价格以**分**为单位，UI 展示时除以 100。
