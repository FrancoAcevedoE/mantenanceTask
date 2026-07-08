import { ref } from 'vue'

function readLocale() {
  try { return localStorage.getItem('locale') || 'es' } catch { return 'es' }
}

function saveLocale(val) {
  try { localStorage.setItem('locale', val) } catch { /* storage no disponible */ }
}

// Module-level singleton: all consumers share the same reactive ref
const locale = ref(readLocale())

// Sincroniza cuando localStorage cambia desde otra pestaña o tras una recarga del SW
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'locale' && e.newValue && e.newValue !== locale.value) {
      locale.value = e.newValue
    }
  })
}

export function useLocale() {
  function toggleLocale() {
    const next = locale.value === 'es' ? 'pt' : 'es'
    saveLocale(next)       // persiste ANTES de cambiar el ref, evita cualquier race
    locale.value = next
  }

  return { locale, toggleLocale }
}
