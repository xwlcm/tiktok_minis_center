import { ref, watch, onUnmounted } from 'vue'

export function useCountUp(
  getter: () => number,
  duration = 600,
  formatter?: (v: number) => string
) {
  const displayValue = ref(getter())
  const isAnimating = ref(false)
  let rafId: number | null = null

  function animateTo(target: number) {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    const start = displayValue.value
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()
    isAnimating.value = true

    function step(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      displayValue.value = start + diff * eased

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        displayValue.value = target
        isAnimating.value = false
        rafId = null
      }
    }

    rafId = requestAnimationFrame(step)
  }

  watch(getter, (newVal) => {
    animateTo(newVal)
  })

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  })

  const formatted = ref('')
  watch(
    displayValue,
    (v) => {
      formatted.value = formatter ? formatter(v) : v.toLocaleString()
    },
    { immediate: true }
  )

  return {
    displayValue,
    formatted,
    isAnimating,
    pulseClass: ref('')
  }
}

export function useMetricPulse() {
  const pulseUp = ref(false)
  const pulseDown = ref(false)

  function triggerPulse(direction: 'up' | 'down') {
    if (direction === 'up') {
      pulseUp.value = true
      setTimeout(() => (pulseUp.value = false), 800)
    } else {
      pulseDown.value = true
      setTimeout(() => (pulseDown.value = false), 800)
    }
  }

  return { pulseUp, pulseDown, triggerPulse }
}
