import { ref } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

// Singletons de módulo — compartidos entre todos los componentes
const open  = ref(false)
const error = ref('')
const busy  = ref(false)
let _resolve = null
let _reject  = null

export function usePasswordConfirm() {
  function askPassword() {
    open.value  = true
    error.value = ''
    return new Promise((resolve, reject) => {
      _resolve = resolve
      _reject  = reject
    })
  }

  async function submit(password) {
    if (!password) { error.value = 'Ingresá tu contraseña'; return }
    busy.value  = true
    error.value = ''
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      await axios.post(`${API_BASE_URL}/users/login`, {
        dni: String(user.dni),
        password: String(password),
      })
      open.value = false
      _resolve?.()
    } catch {
      error.value = 'Contraseña incorrecta'
    } finally {
      busy.value = false
    }
  }

  function cancel() {
    open.value  = false
    error.value = ''
    _reject?.()
  }

  return { open, error, busy, askPassword, submit, cancel }
}
