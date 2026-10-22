import { ref } from 'vue'

/**
 * 异步操作防抖幂等 composable
 *
 * 解决的问题：
 * 1. 用户重复点击按钮导致多次请求（防重复提交）
 * 2. 异步操作未完成时再次触发导致数据错乱
 * 3. 快速连续操作（如搜索输入）产生过多请求
 *
 * @example 基础用法 — 防重复提交
 * ```ts
 * const { locked, run } = useAsyncLock()
 *
 * async function handleSubmit() {
 *   await run(async () => {
 *     await saveData(form)
 *     Message.success('保存成功')
 *   })
 * }
 * ```
 *
 * @example 带 key 的幂等锁 — 同一 id 不重复操作
 * ```ts
 * const { isLocked, runWithKey } = useAsyncLock()
 *
 * async function handleDelete(id: string) {
 *   await runWithKey(id, async () => {
 *     await deleteDrama(id)
 *     Message.success('删除成功')
 *     await fetchList()
 *   })
 * }
 *
 * // 模板中禁用按钮
 * // :disabled="isLocked(record.id)"
 * ```
 *
 * @example 防抖搜索
 * ```ts
 * const { debounced } = useAsyncLock()
 *
 * const debouncedSearch = debounced(async (keyword: string) => {
 *   await fetchList({ name: keyword })
 * }, 300)
 * ```
 */
export function useAsyncLock() {
  /** 全局锁状态 */
  const locked = ref(false)

  /** 按 key 的锁集合 */
  const lockedKeys = ref<Set<string>>(new Set())

  /**
   * 全局锁 — 同一时间只允许一个操作执行
   * 适用于表单提交、全局保存等场景
   */
  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (locked.value) return undefined
    locked.value = true
    try {
      return await fn()
    } catch {
      // 错误由 axios 拦截器统一处理，这里静默
      return undefined
    } finally {
      locked.value = false
    }
  }

  /**
   * 按 key 加锁 — 同一 key 的操作不重复执行，不同 key 互不影响
   * 适用于列表中对单条记录的操作（删除、状态切换等）
   */
  async function runWithKey<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (lockedKeys.value.has(key)) return undefined
    lockedKeys.value.add(key)
    try {
      return await fn()
    } catch {
      return undefined
    } finally {
      lockedKeys.value.delete(key)
    }
  }

  /**
   * 判断某个 key 是否正在执行中
   * 用于模板中动态禁用按钮 :disabled="isLocked(record.id)"
   */
  function isLocked(key: string): boolean {
    return lockedKeys.value.has(key)
  }

  /**
   * 防抖包装 — 连续调用只执行最后一次
   * 适用于搜索输入、筛选变更等高频触发场景
   */
  function debounced<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay = 300,
  ): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn(...args)
      }, delay)
    }
  }

  /**
   * 节流包装 — 固定间隔内只执行一次
   * 适用于滚动加载、窗口 resize 等场景
   */
  function throttled<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    interval = 300,
  ): (...args: Parameters<T>) => void {
    let lastTime = 0
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastTime >= interval) {
        lastTime = now
        fn(...args)
      }
    }
  }

  return {
    locked,
    lockedKeys,
    run,
    runWithKey,
    isLocked,
    debounced,
    throttled,
  }
}
