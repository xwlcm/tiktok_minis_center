import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal(threshold = 0.15) {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )
    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer?.observe(el)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  function refresh() {
    if (!observer) return
    document.querySelectorAll('.scroll-reveal:not(.is-visible)').forEach((el) => {
      observer?.observe(el)
    })
  }

  return { refresh }
}
