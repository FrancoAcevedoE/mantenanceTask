<template>
    <div class="page-container">
        <div class="box">
            <h2>Nueva máquina</h2>

            <input type="text" v-model="form.sector" placeholder="Sector de la fábrica" />

            <input type="text" v-model="form.name" placeholder="Máquina" />

            <textarea v-model="form.machineParts" placeholder="Partes de la máquina"></textarea>

            <input type="number" v-model="form.horometro" placeholder="Horómetro" />

            <textarea v-model="form.instructions" placeholder="Instrucciones/observaciones de la máquina"></textarea>

            <div class="button-group">
                <button @click="save">Guardar</button>
                <button @click="cancel">Cancelar</button>
            </div>
        </div>
    </div>
</template>

<script>
import backgroundImage from '@/assets/fondogeneral.png'
import axios from 'axios'
import Swal from 'sweetalert2'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

export default {
  data() {
    return {
      form: {
        sector: "",
        name: "",
        machineParts: "",
        horometro: 0,
        instructions: ""
      },
      backgroundImage: backgroundImage
    }
  },
  methods: {
    authConfig() {
      const token = localStorage.getItem("token")
      return {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    },
    async save() {
      try {
        if (!this.form.sector || !this.form.name || !this.form.machineParts) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Por favor completa los campos obligatorios"
          })
          return
        }

        await axios.post(`${API_BASE_URL}/machines`, this.form, this.authConfig())
        Swal.fire({
          icon: "success",
          title: "Listo",
          text: "Maquina creada correctamente"
        })
        this.$router.push('/') // Navigate back to home or list
      } catch (error) {
        console.error("Error al crear máquina:", error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al crear la maquina: " + (error.response?.data?.error || error.message)
        })
      }
    },
    cancel() {
      this.$router.back()
    }
  },
  mounted() {
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

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.box {
  width: 100%;
  max-width: 480px;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
  color: #000;
  text-align: center;
}

.box:hover {
  transition: 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}

h2 {
    margin-top: 0;
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
  font-size: 2rem;
  letter-spacing: 0.04rem;
}

input[type="text"],
input[type="number"],
textarea {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  background: #fff;
  color: #000;
  font-size: 1rem;
  text-align: center;
}

textarea {
    resize: vertical;
  min-height: 110px;
}

input:hover,
input:focus,
textarea:hover,
textarea:focus {
  outline: none;
  background: #f0f0f0;
  transition: 0.2s;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

button {
  padding: 10px;
    border: none;
  border-radius: 2rem;
  background: #a6a6a6;
    color: #fff;
    cursor: pointer;
}

button:hover {
  background: #8f8f8f;
}

.button-group {
  width: 100%;
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .box {
    padding: 1rem;
  max-width: 90%;
  }

  h2 {
  font-size: 1.6rem;
  }

  .button-group {
  gap: 0.6rem;
  }

  button {
    width: 100%;
  }
}
</style>
