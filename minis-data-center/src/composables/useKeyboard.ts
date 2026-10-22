import { onMounted, onUnmounted } from 'vue'

interface KeyboardShortcut {
  key: string
  ctrlOrMeta?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
  description: string
}

export function useKeyboard(shortcuts: KeyboardShortcut[]) {
  function handleKeyDown(e: KeyboardEvent) {
    for (const s of shortcuts) {
      const ctrlMatch = s.ctrlOrMeta ? e.ctrlKey || e.metaKey : true
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      const altMatch = s.alt ? e.altKey : !e.altKey

      if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        s.handler(e)
        return
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return { shortcuts }
}
