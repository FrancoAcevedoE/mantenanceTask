import { ref } from 'vue'

// Module-level singleton: all consumers share the same reactive ref
const locale = ref(localStorage.getItem('locale') || 'es')

export function useLocale() {
  function toggleLocale() {
    locale.value = locale.value === 'es' ? 'pt' : 'es'
    localStorage.setItem('locale', locale.value)
  }

  return { locale, toggleLocale }
}
