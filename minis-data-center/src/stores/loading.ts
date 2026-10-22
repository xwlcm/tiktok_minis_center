import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
  state: () => ({
    active: false,
    progress: 0,       // 0–100
    _rafId: null as number | null,
  }),
  actions: {
    start() {
      // 清除可能残留的 rAF，防止泄漏
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
      this.active = true
      this.progress = 0
      this._tick()
    },
    _tick() {
      // 模拟进度：快速到 80%，然后停在那里等 finish()
      const step = () => {
        if (!this.active) return
        if (this.progress < 80) {
          this.progress += (80 - this.progress) * 0.08 + 0.5
        }
        this._rafId = requestAnimationFrame(step)
      }
      this._rafId = requestAnimationFrame(step)
    },
    finish() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
      this.progress = 100
      // 100ms 后隐藏
      setTimeout(() => {
        this.active = false
        this.progress = 0
      }, 300)
    },
    error() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId)
        this._rafId = null
      }
      this.active = false
      this.progress = 0
    },
  },
})
