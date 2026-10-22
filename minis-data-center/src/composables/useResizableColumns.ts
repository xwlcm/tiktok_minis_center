import { ref, type Ref } from 'vue'

export interface ResizableColumn {
  width?: number
  minWidth?: number
  [key: string]: unknown
}

/**
 * 表格列拖拽调整宽度
 *
 * 用法：
 *   const { columns, onThMousedown } = useResizableColumns(rawColumns)
 *   <a-table :columns="columns" />
 *   在 headerCell slot 或 th 上绑定 @mousedown="onThMousedown($event, col)"
 *
 * 原理：监听 mousedown → 记录起始 X 和列宽 → mousemove 计算 delta → mouseup 结束
 * 完全绕开 Arco 内置 column-resizable，避免其在弹性布局下的跳变 bug。
 */
export function useResizableColumns<T extends ResizableColumn>(
  initialColumns: T[],
): {
  columns: Ref<T[]>
  startResize: (e: MouseEvent, index: number) => void
} {
  const columns = ref(initialColumns) as Ref<T[]>

  function startResize(e: MouseEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()

    const col = columns.value[index]
    const startX = e.clientX
    const startWidth = col.width ?? 150

    function onMouseMove(moveEvent: MouseEvent) {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(col.minWidth ?? 60, startWidth + delta)
      columns.value[index] = { ...col, width: newWidth }
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return { columns, startResize }
}
