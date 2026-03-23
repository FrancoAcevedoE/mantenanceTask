<template>
  <div class="page-container">
    <div :class="['admin-layout', { 'single-column': !showCreateForm }]">
      <div v-if="showCreateForm" class="panel-card admin-form">
        <h2 class="title">Panel de Admin</h2>

        <input type="text" id="name" v-model="user.name" placeholder="Nombre"/>

        <input type="text" id="dni" v-model="user.dni" inputmode="numeric" maxlength="8" placeholder="Documento"/>

        <label for="password">Contraseña</label>
        <input type="password" id="password" v-model="user.password" inputmode="numeric" maxlength="4" placeholder="Contraseña"/>

        <label for="role">Rol</label>
        <select id="role" v-model="user.role">
          <option value="operario">Operario</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>

        <p v-if="message" class="message">{{ message }}</p>

        <div class="actions">
          <button @click="createUser">{{ editingUserId ? 'Guardar cambios' : 'Guardar usuario' }}</button>
          <button class="secondary-button" @click="resetForm">Limpiar</button>
          <button class="secondary-button" @click="toggleCreateForm">Cerrar formulario</button>
        </div>
      </div>

      <div class="panel-card users-panel">
        <div class="panel-header">
          <h2 class="title">Usuarios creados</h2>
          <button class="toggle-form-button" @click="toggleCreateForm">
            {{ showCreateForm ? "Ocultar formulario" : "Crear usuario" }}
          </button>
        </div>

        <p v-if="!users.length" class="empty-state">
          No hay usuarios cargados todavía.
        </p>

        <div v-else class="users-list">
          <div v-for="createdUser in users" :key="createdUser._id" class="user-item">
            <div class="user-info">
              <strong>{{ createdUser.name }}</strong>
              <span>Documento: {{ createdUser.dni }}</span>
              <span>Rol: {{ createdUser.role }}</span>
            </div>

            <button
              type="button"
              class="edit-button"
              @click="editUser(createdUser)"
            >
              Modificar
            </button>

            <button
              type="button"
              class="danger-button"
              @click="deleteUser(createdUser._id)"
            >
              Eliminar
            </button>
          </div>
        </div>
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
      user: {
        name: "",
        dni: "",
        password: "",
        role: "operario"
      },
      users: [],
      message: "",
      editingUserId: null,
      showCreateForm: false,
      backgroundImage: backgroundImage
    }
  },
  methods: {
    toggleCreateForm() {
      this.showCreateForm = !this.showCreateForm
      this.message = ""
    },
    authConfig() {
      const token = localStorage.getItem("token")

      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    },
    async loadUsers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/users`, this.authConfig())
        this.users = response.data
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar la lista de usuarios"
        })
      }
    },
    async createUser() {
      try {
        this.message = ""

        this.user.dni = String(this.user.dni).replace(/\D/g, "").slice(0, 8)
        this.user.password = String(this.user.password).replace(/\D/g, "").slice(0, 4)

        if (!/^\d{8}$/.test(this.user.dni)) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "El documento debe tener exactamente 8 digitos numericos"
          })
          return
        }

        if (!/^\d{4}$/.test(this.user.password)) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "La contrasena debe tener exactamente 4 digitos numericos"
          })
          return
        }

        if (this.editingUserId) {
          const payload = {
            name: this.user.name,
            dni: this.user.dni,
            role: this.user.role
          }

          if (this.user.password) {
            payload.password = this.user.password
          }

          await axios.patch(`${API_BASE_URL}/users/${this.editingUserId}`, payload, this.authConfig())
          this.message = "Usuario actualizado correctamente"
        } else {
          await axios.post(`${API_BASE_URL}/users`, this.user, this.authConfig())
          this.message = "Usuario creado correctamente"
        }

        this.resetForm()
        await this.loadUsers()
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "No se pudo crear el usuario"
        })
      }
    },
    editUser(createdUser) {
      this.showCreateForm = true
      this.message = ""
      this.editingUserId = createdUser._id
      this.user = {
        name: createdUser.name || "",
        dni: String(createdUser.dni || ""),
        password: "",
        role: createdUser.role || "operario"
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    async deleteUser(userId) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`, this.authConfig())
        this.message = "Usuario eliminado correctamente"
        await this.loadUsers()
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "No se pudo eliminar el usuario"
        })
      }
    },
    resetForm() {
      this.user = {
        name: "",
        dni: "",
        password: "",
        role: "operario"
      }
      this.editingUserId = null
    }
  },
  mounted() {
    this.loadUsers()
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
  align-items: flex-start;
  padding: 1rem;
}

.admin-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.admin-layout.single-column {
  max-width: 720px;
  grid-template-columns: 1fr;
}

.panel-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}

.panel-card:hover {
  transition: 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.8);
}

.title {
  text-align: center;
  margin: 0 0 1rem;
  color: #333;
  font-size: 2rem;
  letter-spacing: 0.04rem;
}

.admin-form label {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  color: #4b4b4b;
  font-size: 0.95rem;
  text-align: center;
}

.admin-form input,
.admin-form select {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 2rem;
  border: 1px solid #ccc;
  text-align: center;
}

.admin-form input:hover,
.admin-form input:focus,
.admin-form select:hover,
.admin-form select:focus {
  outline: none;
  background: #f0f0f0;
  transition: 0.2s;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.actions {
  width: 100%;
  display: grid;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

button {
  border-radius: 2rem;
  padding: 10px;
  background: #a6a6a6;
  color: #fff;
  border: none;
  cursor: pointer;
}

button:hover {
  background: #8f8f8f;
}

.secondary-button {
  background: #7e8a97;
}

.users-panel {
  align-items: stretch;
  text-align: left;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.panel-header .title {
  margin: 0;
}

.toggle-form-button {
  padding: 10px 14px;
  white-space: nowrap;
}

.users-list {
  width: 100%;
  display: grid;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.user-info {
  display: grid;
  gap: 0.25rem;
}

.user-info strong,
.user-info span {
  color: #333;
}

.danger-button {
  margin: 0;
  background: #cb5f5f;
}

.edit-button {
  margin: 0;
  background: #0ea5a4;
}

.edit-button:hover {
  background: #0b8a89;
}

.danger-button:hover {
  background: #b14d4d;
}

.message {
  color: #3b4b3b;
  margin: 0.5rem 0 0;
}

.empty-state {
  color: #4b4b4b;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .panel-card {
    padding: 1rem;
  }

  .title {
    font-size: 1.6rem;
  }

  .user-item {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
