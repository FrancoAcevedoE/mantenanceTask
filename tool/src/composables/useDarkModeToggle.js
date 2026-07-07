import { ref } from 'vue'

const _dark = ref(localStorage.getItem('darkMode') === 'true')
document.documentElement.setAttribute('data-theme', _dark.value ? 'dark' : 'light')

export function useDarkModeToggle() {
  function toggleDark() {
    _dark.value = !_dark.value
    document.documentElement.setAttribute('data-theme', _dark.value ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(_dark.value))
  }

  return { darkMode: _dark, toggleDark }
}
