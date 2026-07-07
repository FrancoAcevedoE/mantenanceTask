<template>
  <!-- Corner actions: dark mode + language -->
  <div class="login-corner">
    <button class="corner-btn" @click="toggleDark" :title="darkMode ? t.lightMode : t.darkMode" type="button">
      <i :class="darkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
    </button>
    <button class="corner-btn corner-lang" @click="toggleLocale" :title="locale === 'es' ? 'Mudar para Português' : 'Cambiar a Español'">
      {{ t.langLabel }}
    </button>
  </div>

  <div class="login-container">

    <div class="login-box">
      <h2 class="title">TOOLS<i class="bi bi-wrench-adjustable-circle-fill"></i></h2>

      <input
        v-model="dni"
        type="text"
        inputmode="numeric"
        maxlength="8"
        :placeholder="t.dniPlaceholder"
        @keyup.enter="$refs.passwordInput.focus()"
      />

      <input
        ref="passwordInput"
        v-model="password"
        type="password"
        inputmode="numeric"
        maxlength="4"
        :placeholder="t.passwordPlaceholder"
        @keyup.enter="login"
      />

      <button @click="login" :disabled="loading" class="login-btn">
        <span v-if="loading" class="btn-spinner"></span>
        <span v-else>{{ t.loginBtn }}</span>
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <footer class="login-footer">
      <div class="pwa-qr-box">
        <h3>{{ t.downloadApp }}</h3>
        <img :src="qrUrl" :alt="t.qrAlt" class="qr-image" />
        <a :href="pwaUrl" target="_blank" rel="noopener">{{ t.directLink }}</a>
      </div>

      <div class="social-box">
        <div class="social-links">
          <a href="https://www.instagram.com/_.francoacevedo?igsh=MXBkZTcxYTdjbHZ4dQ%3D%3D&utm_source=qr" target="_blank" rel="noopener" aria-label="Instagram">
            <i class="bi bi-instagram"></i>
          </a>
          <a href="https://www.facebook.com/share/1AupcjuHiM/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook">
            <i class="bi bi-facebook"></i>
          </a>
          <a href="https://github.com/FrancoAcevedoE" target="_blank" rel="noopener" aria-label="GitHub">
            <i class="bi bi-github"></i>
          </a>
          <a href="https://wa.me/5493564581448" target="_blank" rel="noopener" aria-label="WhatsApp">
            <i class="bi bi-whatsapp"></i>
          </a>
        </div>
      </div>
    </footer>

    <p class="social-signature">Acevedo Franco Emanuel | {{ t.devLabel }} · 2026</p>
  </div>
</template>

<script>
import axios from "axios"
import { API_BASE_URL } from '@/utils/api'

const PWA_URL = import.meta.env.VITE_PWA_URL || "https://mantenance-task-francoacevedoes-projects.vercel.app/logUser"

const TRANSLATIONS = {
  es: {
    dniPlaceholder: 'DNI',
    passwordPlaceholder: 'Contraseña',
    loginBtn: 'Ingresar',
    dniError: 'El usuario debe ser un DNI de 8 dígitos numéricos',
    passwordError: 'La contraseña debe tener 4 dígitos numéricos',
    downloadApp: 'Descargá la app',
    qrAlt: 'QR para abrir Tool',
    directLink: 'Abrir enlace directo',
    devLabel: 'Desarrollo de Software',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    langLabel: 'PT',
  },
  pt: {
    dniPlaceholder: 'Documento',
    passwordPlaceholder: 'Senha',
    loginBtn: 'Entrar',
    dniError: 'O usuário deve ter 8 dígitos numéricos',
    passwordError: 'A senha deve ter 4 dígitos numéricos',
    downloadApp: 'Baixe o app',
    qrAlt: 'QR para abrir Tool',
    directLink: 'Abrir link direto',
    devLabel: 'Desenvolvimento de Software',
    darkMode: 'Modo escuro',
    lightMode: 'Modo claro',
    langLabel: 'ES',
  },
}

export default {
  data() {
    return {
      dni: '',
      password: '',
      error: null,
      loading: false,
      pwaUrl: PWA_URL,
      qrUrl: '',
      darkMode: localStorage.getItem('darkMode') === 'true',
      locale: localStorage.getItem('locale') || 'es',
    }
  },

  computed: {
    t() { return TRANSLATIONS[this.locale] || TRANSLATIONS.es },
  },

  methods: {
    async login() {
      if (this.loading) return

      this.dni = this.dni.replace(/\D/g, '').slice(0, 8)
      this.password = this.password.replace(/\D/g, '').slice(0, 4)

      if (!/^\d{8}$/.test(this.dni)) {
        this.error = this.t.dniError
        return
      }

      if (!/^\d{4}$/.test(this.password)) {
        this.error = this.t.passwordError
        return
      }

      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
          dni: this.dni,
          password: this.password,
        })
        const token = response.data.token
        const user = response.data.user
        sessionStorage.setItem('token', token)
        sessionStorage.setItem('user', JSON.stringify(user))
        const dest = user.role === 'admin' ? '/adminView' : user.role === 'admin_ventas' ? '/inventory' : '/dashboard'
        this.$router.push(dest)
      } catch (err) {
        this.error = null
        this.$notify.notifyApiError(err, this.t.dniError.replace('DNI', 'usuario o contraseña'))
      } finally {
        this.loading = false
      }
    },

    toggleDark() {
      this.darkMode = !this.darkMode
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light')
      localStorage.setItem('darkMode', String(this.darkMode))
      this._applyLoginBg()
    },

    toggleLocale() {
      this.locale = this.locale === 'es' ? 'pt' : 'es'
      localStorage.setItem('locale', this.locale)
    },

    _applyLoginBg() {
      document.body.style.background = this.darkMode
        ? 'radial-gradient(ellipse at 15% 15%, rgba(120,50,220,0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(255,102,0,0.16) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(30,60,180,0.14) 0%, transparent 50%), #070b14'
        : 'linear-gradient(160deg, #2b3a14 0%, #3d5220 55%, #1e2b0e 100%)'
    },
  },

  mounted() {
    let normalizedUrl = this.pwaUrl
    try {
      const parsed = new URL(this.pwaUrl)
      normalizedUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')
    } catch {
      normalizedUrl = this.pwaUrl
    }
    this.pwaUrl = normalizedUrl
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.pwaUrl)}`
    this._applyLoginBg()
  },

  beforeUnmount() {
    document.body.style.background = ''
  },
}
</script>

<style>
/* ── Login corner widget ── */
.login-corner {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.45rem;
  z-index: 200;
}

.corner-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.22);
  background: rgba(0,0,0,0.25);
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 700;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
  line-height: 1;
}

.corner-btn i { font-size: 1.1rem; }

.corner-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.4);
  transform: translateY(-1px);
}

.corner-lang { font-size: 0.78rem; letter-spacing: 0.04em; }

/* ── Login page ── */
* { box-sizing: border-box; }

.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.login-box {
  background: #ffffff;
  padding: 2rem;
  border-radius: 20px;
  width: min(420px, 100%);
  margin-top: 1.25rem;
  box-shadow: 0 8px 32px rgba(30, 41, 59, 0.12);
  border: 1px solid #e2e8f0;
}

input {
  width: 100%;
  padding: 12px 16px;
  margin: 10px 0;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  color: #1e293b;
  font-size: 1rem;
  box-sizing: border-box;
  transition: 0.2s;
}

input:hover,
input:focus {
  outline: none;
  background: #f8fafc;
  border-color: #3b6b2e;
  box-shadow: 0 0 0 3px rgba(59, 107, 46, 0.1);
}

.login-footer {
  width: 100%;
  max-width: 500px;
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  gap: 0.75rem;
}

/* ── QR ── */
.pwa-qr-box {
  background: rgba(255,255,255,0.92);
  border-radius: 14px;
  padding: 0.75rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pwa-qr-box,
.social-box { width: 200px; }

.pwa-qr-box h3 {
  margin: 0 0 .4rem;
  color: #1e293b;
  font-size: .95rem;
}

.pwa-qr-box p { display: none; }

.qr-image {
  width: 90px;
  height: 90px;
  margin: .3rem auto;
  padding: 4px;
  background: white;
  border-radius: 8px;
}

.pwa-qr-box a {
  font-size: .8rem;
  text-decoration: none;
  color: #0369a1;
  font-weight: 600;
}

/* ── Social ── */
.social-box {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 16px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.social-box h3 {
  margin: 0 0 .6rem;
  color: white;
  font-size: .95rem;
  text-align: center;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: .6rem;
}

.social-links a {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(226, 232, 240, 0.5);
  color: #e2e8f0;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  transition: .2s;
}

.social-links a:hover {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.6);
  transform: translateY(-2px);
}

.social-links a i { font-size: 1.4rem; }

.social-signature {
  margin-top: .6rem;
  font-size: .75rem;
  color: white;
  text-align: center;
  line-height: 1.3;
}

/* ── Title ── */
.login-box .title {
  color: #1e293b;
  font-size: 1.9rem;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

/* ── Login button ── */
.login-btn {
  position: relative;
  min-height: 44px;
  width: 100%;
  background: #3b6b2e;
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.18s;
  box-shadow: 0 4px 14px rgba(59,107,46,0.25);
}

.login-btn:hover:not(:disabled) { background: #2d5224; }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════════════════
   DARK MODE — login page — glassmorphism
   ═══════════════════════════════════════════════════════════ */
[data-theme="dark"] .login-box {
  background: rgba(13,18,35,0.75) !important;
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.1) !important;
  box-shadow: 0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08) !important;
}

[data-theme="dark"] .login-box .title { color: #ffffff; }

[data-theme="dark"] .login-box input {
  background: rgba(255,255,255,0.07) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: #ffffff !important;
}
[data-theme="dark"] .login-box input::placeholder { color: rgba(255,255,255,0.32); }
[data-theme="dark"] .login-box input:focus {
  border-color: rgba(255,102,0,0.6) !important;
  box-shadow: 0 0 0 3px rgba(255,102,0,0.14), 0 0 20px rgba(255,102,0,0.1);
}

[data-theme="dark"] .login-btn {
  background: linear-gradient(135deg, #FF6600 0%, #ff3d00 100%) !important;
  box-shadow: 0 4px 24px rgba(255,102,0,0.45), 0 1px 0 rgba(255,255,255,0.1) inset !important;
}
[data-theme="dark"] .login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7a1a 0%, #ff5500 100%) !important;
  box-shadow: 0 6px 32px rgba(255,102,0,0.6) !important;
}

[data-theme="dark"] .pwa-qr-box {
  background: rgba(13,18,35,0.7) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1) !important;
}
[data-theme="dark"] .pwa-qr-box h3 { color: #ffffff; }
[data-theme="dark"] .pwa-qr-box a { color: #FF8C42; }
[data-theme="dark"] .qr-image {
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
}

[data-theme="dark"] .corner-btn {
  background: rgba(255,102,0,0.15);
  border-color: rgba(255,102,0,0.4);
  color: #FF8C42;
  box-shadow: 0 4px 16px rgba(255,102,0,0.2);
}
[data-theme="dark"] .corner-btn:hover:not(:disabled) {
  background: rgba(255,102,0,0.28);
  border-color: rgba(255,102,0,0.65);
  box-shadow: 0 4px 20px rgba(255,102,0,0.35);
}
</style>
