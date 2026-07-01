<template>
  <div class="login-container">

    <div class="login-box">

      <h2 class="title">TOOLS<i class="bi bi-wrench-adjustable-circle-fill"></i></h2>

      <input
        v-model="dni"
        type="text"
        inputmode="numeric"
        maxlength="8"
        placeholder="DNI"
        @keyup.enter="$refs.passwordInput.focus()"
      />

      <input
        ref="passwordInput"
        v-model="password"
        type="password"
        inputmode="numeric"
        maxlength="4"
        placeholder="Contraseña"
        @keyup.enter="login"
      />

      <button @click="login" :disabled="loading" class="login-btn">
        <span v-if="loading" class="btn-spinner"></span>
        <span v-else>Ingresar</span>
      </button>

      <p v-if="error" class="error">
        {{ error }}
      </p>

    </div>

    <footer class="login-footer">
      <div class="pwa-qr-box">
        <h3>Descarga la app</h3>
        <p>Escanea el QR y agrega Tool a la pantalla de inicio.</p>
        <img :src="qrUrl" alt="QR para abrir Tool" class="qr-image" />
        <a :href="pwaUrl" target="_blank" rel="noopener">Abrir enlace directo</a>
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
            <p class="social-signature">
  Acevedo Franco Emanuel | Desarrollo de Software · 2026</p>

  </div>
</template>

<script>
import axios from "axios"
import { API_BASE_URL } from '@/utils/api'

const PWA_URL = import.meta.env.VITE_PWA_URL || "https://mantenance-task-francoacevedoes-projects.vercel.app/logUser"

export default {

  data(){
    return{
      dni:"",
      password:"",
      error:null,
      loading: false,
      pwaUrl: PWA_URL,
      qrUrl: ""
    }
  },

  methods:{
    async login(){
      if (this.loading) return

      this.dni = this.dni.replace(/\D/g, "").slice(0, 8)
      this.password = this.password.replace(/\D/g, "").slice(0, 4)

      if (!/^\d{8}$/.test(this.dni)) {
        this.error = "El usuario debe ser un DNI de 8 digitos numericos"
        return
      }

      if (!/^\d{4}$/.test(this.password)) {
        this.error = "La contrasena debe tener 4 digitos numericos"
        return
      }

      this.loading = true
      this.error = null
      try{
        const response = await axios.post(`${API_BASE_URL}/users/login`,{
          dni:this.dni,
          password:this.password
        })

        const token = response.data.token
        const user = response.data.user
        sessionStorage.setItem("token",token)
        sessionStorage.setItem("user", JSON.stringify(user))
        const dest = user.role === 'admin' ? '/adminView' : user.role === 'admin_ventas' ? '/inventory' : '/dashboard'
        this.$router.push(dest)

      }
      catch(err){
        this.error = null
        this.$notify.notifyApiError(err, "Usuario o contraseña incorrectos")
      }
      finally{
        this.loading = false
      }

    }

  },

  mounted() {
    let normalizedUrl = this.pwaUrl
    try {
      const parsed = new URL(this.pwaUrl)
      normalizedUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "")
    } catch (error) {
      normalizedUrl = this.pwaUrl
    }

    this.pwaUrl = normalizedUrl
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.pwaUrl)}`

    document.body.style.background = 'linear-gradient(160deg, #2b3a14 0%, #3d5220 55%, #1e2b0e 100%)';
  },

  beforeUnmount() {
    document.body.style.background = '';
  }

}
</script>

<style>
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
.login-box{
  background: #ffffff;

  padding: 2rem;

  border-radius: 20px;

  width: min(420px, 100%);

  margin-top: 1.25rem;

  box-shadow: 0 8px 32px rgba(30, 41, 59, 0.12);
  border: 1px solid #e2e8f0;
}
* {
  box-sizing: border-box;
}
.login-container{
  min-height:100vh;

  display:flex;
  flex-direction:column;

  justify-content:center;
  align-items:center;

  padding:1rem;
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
/* =========================
   QR
========================= */

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
.social-box {
  width: 200px;
}



.pwa-qr-box h3 {
  margin: 0 0 .4rem;
  color: #1e293b;
  font-size: .95rem;
}

.pwa-qr-box p {
  display: none;
}

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

/* =========================
   REDES
========================= */

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

.social-links a i {
  font-size: 1.4rem;
}

.social-signature {
  margin-top: .6rem;

  font-size: .75rem;

  color: white;

  text-align: center;

  line-height: 1.3;
}

/* =========================
   TITLE
========================= */

.login-box .title {
  color: #1e293b;
  font-size: 1.9rem;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}

/* =========================
   LOGIN BUTTON
========================= */

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
}

.login-btn:hover:not(:disabled) {
  background: #2d5224;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================
   RESPONSIVE
========================= */

</style>