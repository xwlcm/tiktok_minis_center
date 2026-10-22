# Skill: 全局组件

## 清单

| 组件 | 文件 | 用途 |
|------|------|------|
| AppSwitcher | `components/AppSwitcher/index.vue` | 顶栏应用切换下拉（见 `03-app/app-switcher.md`） |
| GlobalLoading | `components/GlobalLoading/index.vue` | 路由切换时的顶部 TikTok 双色渐变进度条 |
| EmptyState | `components/EmptyState/index.vue` | 胶片风格空态占位 |
| ResizableTable | `components/ResizableTable/index.vue` | 表格列拖拽调整宽度 |

## GlobalLoading

- 由 `App.vue` 放在最外层，内部 `Teleport` 到 `body`。
- 进度来自 `loadingStore`（`stores/loading.ts`）：`start → requestAnimationFrame` 缓动到 80% → `finish → 100% → 300 ms 后隐藏`。
- 样式：90% 宽、3 px 高条，填充 `linear-gradient(90deg, #D94466, #5BA8B0)`，右侧带微光。

## EmptyState

```vue
<EmptyState description="暂无集数" style="padding: 40px 0" />
```

- SVG 胶片卷轴图标（三角播放键），颜色来自 `rgba(255,255,255,0.2~0.5)`。
- `description` prop 展示次要文案；`style` 可控外层 padding / 背景。

## ResizableTable

基于 `MutationObserver` 观察包裹内的 `<th>`，为其追加拖拽手柄。核心逻辑：

1. `scanAndAttach()` 遍历 `thead th` 并挂 `mousedown` 处理。
2. `mousedown` 触发时先 `freezeAllCols(table)`：把当前渲染宽度写回 `<colgroup><col>` 与 `<th>`，并设置 `table-layout: fixed`，避免后续 hover / 排序导致列宽重新分配。
3. `mousemove` 根据 `delta` 修改对应 `col.style.width`，最小宽度 60 px。
4. `mouseup` 释放事件。

> 该组件绕开了 Arco 的 `column-resizable`，解决了在弹性布局下宽度跳变的问题。

### 使用

```vue
<ResizableTable>
  <a-table :columns="columns" :data="list" row-key="id" />
</ResizableTable>
```

列定义上设置 `resizable: true, minWidth: 60`（提示行为，实际宽度控制在组件内部完成）。

## 其他小组件

- `a-tag / a-switch / a-avatar / a-image` 等均来自 Arco，项目通过自定义 CSS 变量实现深色风格。
- 当需要 TikTok 风格"徽标"时，使用 `tokens.css` 的颜色变量自定义 `type-badge / rank-badge` 等局部类。
