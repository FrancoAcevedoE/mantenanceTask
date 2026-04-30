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
          <option value="vendedor">Vendedor</option>
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
              Ocultar
            </button>
          </div>
        </div>

        <div v-if="deletedUsers.length" class="deleted-zone">
          <h3>Usuarios ocultos</h3>
          <p>
            Estos usuarios no aparecen en formularios ni login. Desde aca podes eliminarlos definitivamente.
          </p>

          <div class="users-list">
            <div v-for="deletedUser in deletedUsers" :key="deletedUser._id" class="user-item deleted-item">
              <div class="user-info">
                <strong>{{ deletedUser.name }}</strong>
                <span>Documento: {{ deletedUser.dni }}</span>
                <span>Rol: {{ deletedUser.role }}</span>
              </div>

              <button
                type="button"
                class="restore-button"
                @click="restoreUser(deletedUser._id)"
              >
                Restaurar
              </button>

              <button
                type="button"
                class="danger-button hard-delete-button"
                @click="deleteUserPermanent(deletedUser._id)"
              >
                Borrar definitivamente
              </button>
            </div>
          </div>
        </div>

        <div class="danger-zone">
          <h3>Zona de riesgo</h3>
          <p>
            Esta accion elimina todos los registros del historial y las metricas del dashboard.
          </p>
          <button
            type="button"
            class="danger-zone-button"
            :disabled="isPurging"
            @click="purgeMaintenanceData"
          >
            {{ isPurging ? 'Limpiando...' : 'Limpiar historial y dashboard' }}
          </button>

          <div class="audit-tools">
            <h4>Log descargable</h4>
            <p>
              Genera un bloque tipo bloc de notas con toda la auditoria del sistema y exportalo.
            </p>

            <div class="audit-tools-actions">
              <button
                type="button"
                class="audit-button"
                :disabled="isLoadingAuditLog"
                @click="generateAuditNotepad"
              >
                {{ isLoadingAuditLog ? 'Generando log...' : 'Generar bloque de notas' }}
              </button>

              <button
                type="button"
                class="audit-button secondary"
                :disabled="!auditLogText"
                @click="downloadAuditTxt"
              >
                Descargar log TXT
              </button>

              <button
                type="button"
                class="audit-button secondary"
                :disabled="isExportingExcel"
                @click="exportAuditToExcelCsv"
              >
                {{ isExportingExcel ? 'Exportando...' : 'Transpilar todo a Excel (.csv)' }}
              </button>
            </div>

            <textarea
              v-model="auditLogText"
              class="audit-notepad"
              readonly
              placeholder="El log se mostrara aca cuando lo generes."
            ></textarea>

            <small v-if="auditLogGeneratedAt" class="audit-meta">
              Ultima generacion: {{ formatAuditGeneratedAt(auditLogGeneratedAt) }} | Eventos: {{ auditLogCount }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import backgroundImage from '@/assets/fondogeneral.png'
import axios from 'axios'

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
      deletedUsers: [],
      message: "",
      editingUserId: null,
      showCreateForm: false,
      isPurging: false,
      isLoadingAuditLog: false,
      isExportingExcel: false,
      auditLogText: "",
      auditLogCount: 0,
      auditLogGeneratedAt: null,
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
        const response = await axios.get(`${API_BASE_URL}/users`, {
          ...this.authConfig(),
          params: {
            includeDeleted: true
          }
        })

        const allUsers = Array.isArray(response.data) ? response.data : []
        this.users = allUsers.filter(item => !item.isDeleted)
        this.deletedUsers = allUsers.filter(item => item.isDeleted)
      } catch (error) {
        this.$notify.error("No se pudo cargar la lista de usuarios")
      }
    },
    async createUser() {
      try {
        this.message = ""

        this.user.dni = String(this.user.dni).replace(/\D/g, "").slice(0, 8)
        this.user.password = String(this.user.password).replace(/\D/g, "").slice(0, 4)

        if (!/^\d{8}$/.test(this.user.dni)) {
          this.$notify.error("El documento debe tener exactamente 8 digitos numericos")
          return
        }

        if (!/^\d{4}$/.test(this.user.password)) {
          this.$notify.error("La contrasena debe tener exactamente 4 digitos numericos")
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
        this.$notify.notifyApiError(error, "No se pudo crear el usuario")
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
        this.message = "Usuario ocultado correctamente"
        this.$notify.success("Usuario ocultado correctamente")
        await this.loadUsers()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo eliminar el usuario")
      }
    },
    async deleteUserPermanent(userId) {
      const confirmed = window.confirm(
        "Eliminar definitivamente este usuario? Esta accion no se puede deshacer."
      )

      if (!confirmed) {
        return
      }

      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}/permanent`, this.authConfig())
        this.$notify.success("Usuario eliminado definitivamente")
        await this.loadUsers()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo eliminar definitivamente el usuario")
      }
    },
    async restoreUser(userId) {
      try {
        await axios.patch(`${API_BASE_URL}/users/${userId}/restore`, {}, this.authConfig())
        this.$notify.success("Usuario restaurado correctamente")
        await this.loadUsers()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo restaurar el usuario")
      }
    },
    async purgeMaintenanceData() {
      if (this.isPurging) {
        return
      }

      const confirmed = window.confirm(
        "Esta seguro de limpiar todo el historial y dashboard? Esta accion no se puede deshacer."
      )

      if (!confirmed) {
        return
      }

      const confirmationKeyword = window.prompt(
        "Para confirmar definitivamente, escribi BORRAR"
      )

      if (confirmationKeyword !== "BORRAR") {
        this.$notify.error("Operacion cancelada: palabra clave incorrecta")
        return
      }

      this.isPurging = true

      try {
        await axios.delete(`${API_BASE_URL}/maintenance/purge-all`, this.authConfig())
        this.$notify.success("Historial y dashboard limpiados correctamente")
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo limpiar historial y dashboard")
      } finally {
        this.isPurging = false
      }
    },
    formatAuditGeneratedAt(value) {
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) {
        return "-"
      }

      return date.toLocaleString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    },
    stringifyMetadata(metadata) {
      try {
        return JSON.stringify(metadata || {}, null, 2)
      } catch {
        return "{}"
      }
    },
    formatAuditEntry(entry) {
      const createdAt = entry?.createdAt
        ? this.formatAuditGeneratedAt(entry.createdAt)
        : "-"

      const actor = entry?.actor || {}
      const actorName = actor.name || "Sin nombre"
      const actorRole = actor.role || "-"
      const actorDni = actor.dni || "-"

      return [
        "========================================",
        `Fecha: ${createdAt}`,
        `Accion: ${entry?.action || "-"}`,
        `Entidad: ${entry?.entityType || "-"}`,
        `ID Entidad: ${entry?.entityId || "-"}`,
        `Descripcion: ${entry?.description || "-"}`,
        `Actor: ${actorName} | Rol: ${actorRole} | DNI: ${actorDni}`,
        "Metadata:",
        this.stringifyMetadata(entry?.metadata),
        ""
      ].join("\n")
    },
    async fetchAllAuditLogs() {
      const allItems = []
      let page = 1
      let hasNext = true

      while (hasNext) {
        const response = await axios.get(`${API_BASE_URL}/users/audit-log`, {
          ...this.authConfig(),
          params: {
            page,
            limit: 200
          }
        })

        const items = Array.isArray(response.data?.items) ? response.data.items : []
        allItems.push(...items)

        const totalPages = Number(response.data?.pagination?.totalPages || 0)
        hasNext = totalPages > 0 && page < totalPages
        page += 1
      }

      return allItems
    },
    buildAuditLogNotepad(entries) {
      if (!entries.length) {
        return "No hay eventos de auditoria para mostrar."
      }

      const header = [
        "LOG DE AUDITORIA - MANTENANCE TASK",
        `Generado: ${this.formatAuditGeneratedAt(new Date())}`,
        `Cantidad de eventos: ${entries.length}`,
        ""
      ].join("\n")

      const body = entries.map(entry => this.formatAuditEntry(entry)).join("\n")
      return `${header}${body}`
    },
    downloadFile(content, fileName, mimeType) {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    async generateAuditNotepad() {
      if (this.isLoadingAuditLog) {
        return
      }

      this.isLoadingAuditLog = true

      try {
        const entries = await this.fetchAllAuditLogs()
        this.auditLogText = this.buildAuditLogNotepad(entries)
        this.auditLogCount = entries.length
        this.auditLogGeneratedAt = new Date().toISOString()
        this.$notify.success("Log de auditoria generado")
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo generar el log de auditoria")
      } finally {
        this.isLoadingAuditLog = false
      }
    },
    downloadAuditTxt() {
      if (!this.auditLogText) {
        this.$notify.error("Primero genera el bloque de notas")
        return
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      this.downloadFile(this.auditLogText, `log-auditoria-${timestamp}.txt`, "text/plain;charset=utf-8")
      this.$notify.success("Log TXT descargado")
    },
    async exportAuditToExcelCsv() {
      if (this.isExportingExcel) {
        return
      }

      this.isExportingExcel = true

      try {
        const response = await axios.get(`${API_BASE_URL}/users/audit-log/download`, {
          ...this.authConfig(),
          responseType: "blob"
        })

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const fileName = `log-auditoria-excel-${timestamp}.csv`
        const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")

        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        this.$notify.success("Exportacion a Excel (.csv) completada")
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo exportar el log a Excel")
      } finally {
        this.isExportingExcel = false
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

.danger-zone {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #f5b7b1;
  background: #fff5f5;
}

.danger-zone h3 {
  margin: 0;
  color: #8a1c1c;
}

.danger-zone p {
  margin: 0.5rem 0 0;
  color: #6d3d3d;
}

.danger-zone-button {
  margin-top: 0.75rem;
  width: 100%;
  background: #c0392b;
}

.danger-zone-button:hover {
  background: #a93226;
}

.danger-zone-button:disabled {
  background: #dca29c;
  cursor: not-allowed;
}

.audit-tools {
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid #f0cccc;
}

.audit-tools h4 {
  margin: 0;
  color: #6f1d1d;
}

.audit-tools p {
  margin: 0.4rem 0 0.7rem;
}

.audit-tools-actions {
  display: grid;
  gap: 0.5rem;
}

.audit-button {
  width: 100%;
  background: #7f4f24;
}

.audit-button:hover {
  background: #6b3f1c;
}

.audit-button.secondary {
  background: #5f6f7a;
}

.audit-button.secondary:hover {
  background: #4e5d67;
}

.audit-button:disabled {
  background: #b9b9b9;
  cursor: not-allowed;
}

.audit-notepad {
  margin-top: 0.7rem;
  width: 100%;
  min-height: 200px;
  border: 1px solid #d8d8d8;
  border-radius: 0.75rem;
  background: #fff;
  color: #222;
  padding: 0.8rem;
  line-height: 1.35;
  font-family: "Courier New", monospace;
  resize: vertical;
}

.audit-meta {
  display: block;
  margin-top: 0.5rem;
  color: #704c4c;
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

.deleted-zone {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #f0d6ab;
  background: #fff8eb;
}

.deleted-zone h3 {
  margin: 0;
  color: #7d4f00;
}

.deleted-zone p {
  margin: 0.5rem 0 0.75rem;
  color: #6f5a37;
}

.deleted-item {
  background: #fffdf8;
  border: 1px solid #f3e2ba;
}

.hard-delete-button {
  background: #7f1d1d;
}

.hard-delete-button:hover {
  background: #631616;
}

.restore-button {
  margin: 0;
  background: #1f7a4c;
}

.restore-button:hover {
  background: #16613b;
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
