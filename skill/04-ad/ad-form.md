# Skill: 广告规则表单（新增 / 编辑）

## 组件定位

`src/views/ad/form.vue` 是一个 **Modal 组件**，由父级（`ad/index.vue`）通过 `v-model:visible` 控制开关，通过 `:ad` 传入待编辑对象（`null` 表示新增），提交成功后 `emit('saved')`。

## Props / Emits

```ts
defineProps<{ visible: boolean; ad: Ad | null }>()
defineEmits<{
  'update:visible': [val: boolean]
  'saved': []
}>()
```

## 表单字段

| 字段 | 组件 | 校验 | 编辑时行为 |
|------|------|------|------------|
| 广告规则名称 `ruleName` | `a-input` | 必填；2–50 字符 | 可修改 |
| 广告位 ID `adUnitId` | `a-input` | 必填 | 编辑时 `disabled`（不可修改） |
| 广告类型 `adType` | `a-select` | 必填 | 编辑时 `disabled` |
| 激活状态 `active`（→ 映射 `status`） | `a-switch` | — | |

### 类型选项

```ts
const typeOptions = [
  { label: '激励视频', value: 'RewardedVideoAd' },
  { label: '插屏广告', value: 'InterstitialAd' },
]
```

## 回填 / 重置

```ts
watch(() => props.ad, (ad) => {
  if (ad) {
    form.value = {
      ruleName: ad.ruleName,
      adUnitId: ad.adUnitId,
      adType:   ad.adType,
      active:   ad.status === 1,
    }
  } else {
    form.value = { ruleName: '', adUnitId: '', adType: 'RewardedVideoAd', active: true }
  }
}, { immediate: true })
```

## 提交

```ts
async function handleSubmit() {
  const errors = await formRef.value.validate()
  if (errors) return
  submitting.value = true
  try {
    const payload = {
      ruleName: form.value.ruleName,
      adUnitId: form.value.adUnitId,
      adType:   form.value.adType,
      status:   form.value.active ? 1 : 0,
    }
    if (props.ad) await updateAd(props.ad.id, payload)
    else           await createAd(payload)
    Message.success(props.ad ? '已更新' : '已新增')
    emit('saved')
    emit('update:visible', false)
  } finally { submitting.value = false }
}
```

## 路由入口

`router/index.ts` 中的 `AdCreate`（`/ad/create`）、`AdEdit`（`/ad/:id/edit`）两条路由指向此文件，但当前父组件主要通过 **Modal** 使用；两条路由提供独立页面形态的备选入口。
