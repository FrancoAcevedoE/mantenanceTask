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
      />

      <input
        v-model="password"
        type="password"
        inputmode="numeric"
        maxlength="4"
        placeholder="Contraseña"
      />

      <button @click="login">
        Ingresar
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
        <h3>Mis redes</h3>
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

  </div>
</template>

<script>
import axios from "axios"
import Swal from "sweetalert2"
import backgroundImage from '@/assets/fondo.jpg'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
const PWA_URL = import.meta.env.VITE_PWA_URL || "https://mantenance-task-francoacevedoes-projects.vercel.app/logUser"

export default {

  data(){
    return{
      dni:"",
      password:"",
      error:null,
      backgroundImage: backgroundImage,
      pwaUrl: PWA_URL,
      qrUrl: ""
    }
  },

  methods:{
    async login(){
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

      try{
        this.error = null
        const response = await axios.post(`${API_BASE_URL}/users/login`,{
          dni:this.dni,
          password:this.password
        })

        const token = response.data.token
        const user = response.data.user
        localStorage.setItem("token",token)
        localStorage.setItem("user", JSON.stringify(user))
        this.$router.push(user.role === "admin" ? "/adminView" : "/dashboard")

      }
      catch(err){
        this.error = null
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Usuario o contraseña incorrectos"
        })

      }

    }

  },

  mounted() {
    this.backgroundImage = backgroundImage

    let normalizedUrl = this.pwaUrl
    try {
      const parsed = new URL(this.pwaUrl)
      normalizedUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "")
    } catch (error) {
      normalizedUrl = this.pwaUrl
    }

    this.pwaUrl = normalizedUrl
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.pwaUrl)}`

    document.body.style.backgroundImage = `url(${this.backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  },

  beforeUnmount() {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  }

}
</script>

<style>
.nav {
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
    padding: 1rem;
}
.login-container{

  min-height:100vh;
  display:flex;
  flex-direction: column;
  justify-content:flex-start;
  align-items:center;
  background-image: none;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  padding: 1rem;
  box-sizing: border-box;
  overflow-y: auto;
}

.login-box{
  background:white;
  padding:40px;
  border-radius:10px;
  width:300px;
  margin-top: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}
.login-box:hover {
  transition: 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}
.title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 2.2rem;
  letter-spacing: 0.1rem;
}
.title i {
  font-size: 2rem;
  margin-left: 0.5rem;

}
input{
  width:100%;
  padding:10px;
  margin:10px 0;
  border-radius: 2rem;
  border: 1px solid #ccc;
}
input:hover {
  outline: none;
  background:#f0f0f0;
  transition: 0.2s;
  box-shadow:0 1px 5px rgba(189, 189, 189, 0.31);
}

button{
  border-radius: 2rem;
  padding:10px;
  background:#a6a6a6;
  color:white;
  border:none;
  cursor:pointer;
  display: block;
  margin: 0 auto;
}

.error{

  color:red;
  margin-top:10px;

}

.pwa-qr-box {
  margin-top: 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  padding: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
}

.pwa-qr-box h3 {
  margin: 0 0 0.5rem;
  color: #333;
  font-size: 1rem;
}

.pwa-qr-box p {
  margin: 0 0 0.75rem;
  color: #555;
  font-size: 0.85rem;
  line-height: 1.3;
}

.qr-image {
  width: 140px;
  height: 140px;
  display: block;
  margin: 0.25rem auto 0.75rem;
  border-radius: 8px;
  background: #fff;
  padding: 6px;
}

.pwa-qr-box a {
  color: #0369a1;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.pwa-qr-box a:hover {
  text-decoration: underline;
}

.login-footer {
  width: 100%;
  max-width: 760px;
  margin-top: auto;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem;
}

.social-box {
  border-left: 1px solid #e0e0e0;
  padding-left: 1rem;
}

.social-box h3 {
  margin: 0 0 0.75rem;
  color: #fff;
  font-size: 1rem;
  text-align: center;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.social-links a {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #0369a1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  text-decoration: none;
}

.social-links a i {
  font-size: 1.8rem;
}

.social-links a:hover {
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .login-box {
    width: 90%;
    padding: 20px;
  }

  .title {
    font-size: 1.8rem;
  }

  .title i {
    font-size: 1.5rem;
  }

  .login-footer {
    width: 90%;
    flex-direction: column;
    align-items: stretch;
  }

  .social-box {
    border-left: none;
    border-top: 1px solid #e0e0e0;
    padding-left: 0;
    padding-top: 0.75rem;
  }
}

</style>