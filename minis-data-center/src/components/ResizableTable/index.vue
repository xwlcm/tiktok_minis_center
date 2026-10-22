<template>
  <div ref="wrapRef" class="resizable-table-wrap">
    <slot ></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const wrapRef = ref<HTMLElement | null>(null)

let observer: MutationObserver | null = null
const initializedThs = new WeakSet<HTMLElement>()
const cleanupFns: (() => void)[] = []

function getColElements(table: HTMLTableElement): HTMLElement[] {
  return Array.from(table.querySelectorAll<HTMLElement>('colgroup col'))
}

/**
 * 锁定所有列的当前渲染宽度到 col 元素上。
 * Arco 用 colgroup > col 控制列宽，必须操作 col 才能真正固定宽度。
 */
function freezeAllCols(table: HTMLTableElement) {
  const ths = Array.from(table.querySelectorAll<HTMLElement>('thead tr:first-child th'))
  const cols = getColElements(table)

  ths.forEach((th, i) => {
    const w = th.getBoundingClientRect().width
    // 同时设置 col 和 th，确保两者一致
    if (cols[i]) {
      cols[i].style.width = `${w}px`
      cols[i].style.minWidth = `${w}px`
    }
    th.style.width = `${w}px`
    th.style.minWidth = `${w}px`
    th.style.maxWidth = `${w}px`
  })

  // 固定表格总宽，防止 auto 布局重新分配
  const totalWidth = ths.reduce((sum, th) => sum + th.getBoundingClientRect().width, 0)
  table.style.width = `${totalWidth}px`
  table.style.tableLayout = 'fixed'
}

function attachHandle(th: HTMLElement) {
  if (initializedThs.has(th)) return
  initializedThs.add(th)

  th.style.position = 'relative'
  th.style.overflow = 'hidden'

  // 外层容器：占满 th 右侧，用于捕获鼠标事件
  const handle = document.createElement('div')
  handle.style.cssText = `
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 12px;
    cursor: col-resize;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // 内层可见图标：4×20px 白色圆角矩形
  const bar = document.createElement('div')
  bar.style.cssText = `
    width: 3px;
    height: 20px;
    border-radius: 3px;
    background: rgba(255,255,255,0);
    transition: background 0.15s;
    pointer-events: none;
  `
  handle.appendChild(bar)

  function onMouseEnter() {
    bar.style.background = 'rgba(22, 41, 63, 0.92)'
  }
  function onMouseLeave() {
    bar.style.background = 'rgba(255,255,255,0)'
  }

  function onMouseDown(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const table = th.closest('table') as HTMLTableElement | null
    if (!table) return

    const thIndex = Array.from(th.parentElement?.children ?? []).indexOf(th)
    const cols = getColElements(table)

    // 第一步：冻结所有列宽，切换为 fixed 布局
    freezeAllCols(table)

    // 第二步：读取冻结后的起始宽度
    const startX = e.clientX
    const startWidth = th.getBoundingClientRect().width

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMouseMove(me: MouseEvent) {
      const newWidth = Math.max(60, startWidth + me.clientX - startX)

      // 操作 col 元素（Arco 实际用这个控制宽度）
      if (cols[thIndex]) {
        cols[thIndex].style.width = `${newWidth}px`
        cols[thIndex].style.minWidth = `${newWidth}px`
      }
      // 同步 th
      th.style.width = `${newWidth}px`
      th.style.minWidth = `${newWidth}px`
      th.style.maxWidth = `${newWidth}px`
    }

    function onMouseUp() {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  handle.addEventListener('mouseenter', onMouseEnter)
  handle.addEventListener('mouseleave', onMouseLeave)
  handle.addEventListener('mousedown', onMouseDown)
  th.appendChild(handle)

  cleanupFns.push(() => {
    handle.removeEventListener('mouseenter', onMouseEnter)
    handle.removeEventListener('mouseleave', onMouseLeave)
    handle.removeEventListener('mousedown', onMouseDown)
    handle.remove()
  })
}

function scanAndAttach() {
  const wrap = wrapRef.value
  if (!wrap) return
  wrap.querySelectorAll<HTMLElement>('th').forEach(attachHandle)
}

onMounted(() => {
  const wrap = wrapRef.value
  if (!wrap) return

  observer = new MutationObserver(() => {
    scanAndAttach()
  })
  observer.observe(wrap, { childList: true, subtree: true })

  scanAndAttach()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  cleanupFns.forEach(fn => fn())
})
</script>

<style scoped>
.resizable-table-wrap {
  width: 100%;
}
</style>
