import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useDarkMode() {
  const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')
  let observer

  onMounted(() => {
    observer = new MutationObserver(() => {
      isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { isDark }
}
