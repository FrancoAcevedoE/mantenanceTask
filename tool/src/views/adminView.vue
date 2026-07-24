<template>
  <div class="page-container">
    <div class="admin-outer">

      <!-- Columna izquierda: lista de usuarios -->
      <div class="admin-left">
        <div class="panel-card users-panel">
          <div class="panel-header">
            <h2 class="title">{{ t.titleUsers }}</h2>
            <button class="toggle-form-button" @click="toggleCreateForm">
              <i class="bi bi-person-plus-fill"></i> {{ t.btnCreateUser }}
            </button>
          </div>

          <p v-if="!users.length" class="empty-state">
            {{ t.emptyUsers }}
          </p>

          <div v-else class="users-list">
            <div v-for="createdUser in users" :key="createdUser._id" class="user-item">
              <div class="user-avatar-sm">
                <img v-if="createdUser.photo" :src="createdUser.photo" class="user-avatar-img" :alt="createdUser.name" />
                <span v-else class="user-avatar-initials" :style="{ background: avatarColor(createdUser.name) }">{{ initials(createdUser.name) }}</span>
              </div>
              <div class="user-info">
                <strong>{{ createdUser.name }}</strong>
                <span class="user-meta">{{ t.roleDni }} {{ createdUser.dni }} · {{ roleLabel(createdUser.role) }}</span>
              </div>
              <div class="user-actions">
                <button type="button" class="edit-button" @click="editUser(createdUser)" title="Modificar">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button type="button" class="danger-button" @click="deleteUser(createdUser._id)" title="Ocultar">
                  <i class="bi bi-eye-slash-fill"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="deletedUsers.length" class="deleted-zone">
            <h3>{{ t.titleHidden }}</h3>
            <p>{{ t.hiddenDesc }}</p>
            <div class="users-list">
              <div v-for="deletedUser in deletedUsers" :key="deletedUser._id" class="user-item deleted-item">
                <div class="user-info">
                  <strong>{{ deletedUser.name }}</strong>
                  <span>Documento: {{ deletedUser.dni }}</span>
                  <span>Rol: {{ roleLabel(deletedUser.role) }}</span>
                </div>
                <button type="button" class="restore-button" @click="restoreUser(deletedUser._id)">
                  {{ t.btnRestore }}
                </button>
                <button type="button" class="danger-button hard-delete-button" @click="deleteUserPermanent(deletedUser._id)">
                  {{ t.btnDeletePermanent }}
                </button>
              </div>
            </div>
          </div>

          <div class="danger-zone">
            <div class="danger-zone-header">
              <div>
                <h3>{{ t.dangerTitle }}</h3>
                <p>{{ t.dangerDesc }}</p>
              </div>
              <button type="button" class="danger-zone-button" :disabled="isPurging" @click="purgeMaintenanceData">
                {{ isPurging ? t.btnPurging : t.btnPurge }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: panel de logs -->
      <div class="panel-card logs-panel">
        <h3 class="logs-title"><i class="bi bi-journal-code"></i> {{ t.logsTitle }}</h3>
        <p class="logs-desc">{{ t.logsDesc }}</p>

        <div class="audit-tools-actions">
          <button type="button" class="audit-button" :disabled="isLoadingAuditLog" @click="generateAuditNotepad">
            {{ isLoadingAuditLog ? t.btnGenerating : t.btnGenerate }}
          </button>
          <button type="button" class="audit-button secondary" :disabled="!auditLogText" @click="downloadAuditTxt">
            <i class="bi bi-file-earmark-text"></i> {{ t.btnDownloadTxt }}
          </button>
          <button type="button" class="audit-button secondary" :disabled="isExportingExcel" @click="exportAuditToExcelCsv">
            <i class="bi bi-file-earmark-spreadsheet"></i> {{ isExportingExcel ? t.btnExporting : t.btnExportExcel }}
          </button>
        </div>

        <textarea
          v-model="auditLogText"
          class="audit-notepad"
          readonly
          :placeholder="t.auditPlaceholder"
        ></textarea>

        <small v-if="auditLogGeneratedAt" class="audit-meta">
          {{ t.auditMeta(formatAuditGeneratedAt(auditLogGeneratedAt), auditLogCount) }}
        </small>
      </div>

    </div>

    <!-- ── Modal crear/editar usuario ── -->
    <Teleport to="body">
      <Transition name="au-fade">
        <div v-if="showCreateForm" class="au-backdrop" @click.self="toggleCreateForm">
          <div class="au-modal">
            <div class="au-modal-hd">
              <h2>{{ editingUserId ? t.editUserTitle : t.newUserTitle }}</h2>
              <button type="button" class="au-close" @click="toggleCreateForm"><i class="bi bi-x-lg"></i></button>
            </div>

            <div class="au-modal-bd">
              <!-- Foto de perfil -->
              <div class="photo-picker-wrap">
                <div class="photo-preview" @click="triggerPhotoInput" :title="user.photo ? 'Cambiar foto' : 'Agregar foto'">
                  <img v-if="user.photo" :src="user.photo" class="photo-img" alt="foto" />
                  <div v-else class="photo-placeholder">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <div class="photo-overlay"><i class="bi bi-camera-fill"></i></div>
                </div>
                <div class="photo-actions">
                  <button type="button" class="photo-btn" @click="triggerPhotoInput">
                    <i class="bi bi-upload"></i> {{ t.btnUploadPhoto }}
                  </button>
                  <button type="button" class="photo-btn photo-btn--camera" @click="triggerCamera">
                    <i class="bi bi-camera-fill"></i> {{ t.btnTakePhoto }}
                  </button>
                  <button v-if="user.photo" type="button" class="photo-btn photo-btn--remove" @click="user.photo = ''">
                    <i class="bi bi-trash-fill"></i> {{ t.btnRemovePhoto }}
                  </button>
                </div>
                <input ref="photoInputRef" type="file" accept="image/*" class="photo-input-hidden" @change="onPhotoFile" />
                <input ref="cameraInputRef" type="file" accept="image/*" capture="user" class="photo-input-hidden" @change="onPhotoFile" />
              </div>

              <div class="au-field">
                <label for="name">{{ t.labelName }}</label>
                <input type="text" id="name" v-model="user.name" :placeholder="t.phName"/>
              </div>

              <div class="au-row">
                <div class="au-field">
                  <label for="dni">{{ t.labelDni }}</label>
                  <input type="text" id="dni" v-model="user.dni" inputmode="numeric" maxlength="8" :placeholder="t.phDni"/>
                </div>
                <div class="au-field">
                  <label for="password">{{ t.labelPassword }}</label>
                  <input type="password" id="password" v-model="user.password" inputmode="numeric" maxlength="4" :placeholder="t.phPassword"/>
                </div>
              </div>

              <div class="au-field">
                <label for="role">{{ t.labelRole }}</label>
                <select id="role" v-model="user.role" :disabled="currentUserRole === 'admin_ventas' || currentUserRole === 'admin_marketing'">
                  <option v-if="currentUserRole !== 'admin_ventas' && currentUserRole !== 'admin_marketing'" value="operario">Operario</option>
                  <option v-if="currentUserRole !== 'admin_ventas' && currentUserRole !== 'admin_marketing'" value="supervisor">Supervisor</option>
                  <option v-if="currentUserRole !== 'admin_marketing'" value="vendedor">Vendedor</option>
                  <option v-if="currentUserRole !== 'admin_ventas' && currentUserRole !== 'admin_marketing'" value="admin_ventas">Admin de ventas</option>
                  <option value="marketing">Marketing</option>
                  <option v-if="currentUserRole !== 'admin_ventas' && currentUserRole !== 'admin_marketing'" value="admin_marketing">Admin de marketing</option>
                  <option v-if="currentUserRole !== 'admin_ventas' && currentUserRole !== 'admin_marketing'" value="admin">Admin</option>
                </select>
              </div>

              <p v-if="message" class="message">{{ message }}</p>
            </div>

            <div class="au-modal-ft">
              <button type="button" class="secondary-button" @click="resetForm">{{ t.btnClear }}</button>
              <button type="button" @click="createUser">{{ editingUserId ? t.btnSaveChanges : t.btnSaveUser }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <ConfirmDialog
      :visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :type="confirmDialog.type"
      @confirm="onDialogConfirm"
      @cancel="confirmDialog.visible = false"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useLocale } from '@/composables/useLocale'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const TRANSLATIONS = {
  es: {
    newUserTitle: 'Nuevo usuario', editUserTitle: 'Editar usuario',
    btnUploadPhoto: 'Subir foto', btnTakePhoto: 'Tomar foto', btnRemovePhoto: 'Quitar',
    labelName: 'Nombre completo', labelDni: 'Documento (DNI)',
    phName: 'Ej: Juan Pérez', phDni: 'Ej: 30123456', phPassword: '4 dígitos',
    labelPassword: 'Contraseña', labelRole: 'Rol',
    btnSaveChanges: 'Guardar cambios', btnSaveUser: 'Guardar usuario',
    btnClear: 'Limpiar',
    titleUsers: 'Usuarios',
    btnCreateUser: 'Nuevo usuario',
    emptyUsers: 'No hay usuarios cargados todavía.',
    titleHidden: 'Usuarios ocultos',
    hiddenDesc: 'Estos usuarios no aparecen en formularios ni login. Desde aca podes eliminarlos definitivamente.',
    btnRestore: 'Restaurar', btnDeletePermanent: 'Borrar definitivamente',
    dangerTitle: 'Zona de riesgo', dangerDesc: 'Elimina todos los registros del historial y las métricas del dashboard.',
    btnPurging: 'Limpiando...', btnPurge: 'Limpiar historial',
    logsTitle: 'Log de auditoría', logsDesc: 'Genera un bloque tipo bloc de notas con toda la auditoría del sistema y exportalo.',
    btnGenerating: 'Generando log...', btnGenerate: 'Generar log',
    btnDownloadTxt: 'Descargar TXT', btnExporting: 'Exportando...', btnExportExcel: 'Exportar Excel (.csv)',
    auditPlaceholder: 'El log se mostrará acá cuando lo generes.',
    auditMeta: (date, count) => `Última generación: ${date} | Eventos: ${count}`,
    roleDni: 'DNI',
    roles: { admin: 'Admin', admin_ventas: 'Admin de ventas', vendedor: 'Vendedor', operario: 'Operario', supervisor: 'Supervisor', compras: 'Compras', admin_compras: 'Admin de compras', produccion: 'Producción', marketing: 'Marketing', admin_marketing: 'Admin de marketing' },
  },
  pt: {
    newUserTitle: 'Novo usuário', editUserTitle: 'Editar usuário',
    btnUploadPhoto: 'Enviar foto', btnTakePhoto: 'Tirar foto', btnRemovePhoto: 'Remover',
    labelName: 'Nome completo', labelDni: 'Documento (DNI)',
    phName: 'Ex: João Silva', phDni: 'Ex: 30123456', phPassword: '4 dígitos',
    labelPassword: 'Senha', labelRole: 'Função',
    btnSaveChanges: 'Salvar alterações', btnSaveUser: 'Salvar usuário',
    btnClear: 'Limpar',
    titleUsers: 'Usuários',
    btnCreateUser: 'Novo usuário',
    emptyUsers: 'Nenhum usuário registrado ainda.',
    titleHidden: 'Usuários ocultos',
    hiddenDesc: 'Estes usuários não aparecem em formulários nem no login. Aqui você pode excluí-los definitivamente.',
    btnRestore: 'Restaurar', btnDeletePermanent: 'Excluir definitivamente',
    dangerTitle: 'Zona de risco', dangerDesc: 'Exclui todos os registros do histórico e as métricas do dashboard.',
    btnPurging: 'Limpando...', btnPurge: 'Limpar histórico',
    logsTitle: 'Log de auditoria', logsDesc: 'Gera um bloco tipo bloco de notas com toda a auditoria do sistema e exporta.',
    btnGenerating: 'Gerando log...', btnGenerate: 'Gerar log',
    btnDownloadTxt: 'Baixar TXT', btnExporting: 'Exportando...', btnExportExcel: 'Exportar Excel (.csv)',
    auditPlaceholder: 'O log será exibido aqui quando gerado.',
    auditMeta: (date, count) => `Última geração: ${date} | Eventos: ${count}`,
    roleDni: 'Doc.',
    roles: { admin: 'Admin', admin_ventas: 'Admin de vendas', vendedor: 'Vendedor', operario: 'Operário', supervisor: 'Supervisor', compras: 'Compras', admin_compras: 'Admin de compras', produccion: 'Produção', marketing: 'Marketing', admin_marketing: 'Admin de marketing' },
  },
}

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem('user') || '{}') } catch { return {} }
}

const AVATAR_COLORS = ['#1d4ed8','#6d28d9','#b45309','#4338ca','#15803d','#be185d','#4d6728','#b91c1c']

export default {
  components: { ConfirmDialog },

  setup() {
    const { locale } = useLocale()
    const { askPassword } = usePasswordConfirm()
    return { locale, askPassword }
  },

  data() {
    const currentUser = getCurrentUser()
    return {
      currentUserRole: currentUser.role || '',
      confirmDialog: { visible: false, title: '', message: '', confirmText: 'Confirmar', type: 'danger', action: null },
      user: {
        name: "",
        dni: "",
        password: "",
        role: currentUser.role === 'admin_ventas' ? 'vendedor' : currentUser.role === 'admin_marketing' ? 'marketing' : 'operario',
        photo: ""
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
      auditLogGeneratedAt: null
    }
  },
  computed: {
    t() { return TRANSLATIONS[this.locale] || TRANSLATIONS.es },
  },

  methods: {
    roleLabel(role) {
      return this.t.roles[role] || role
    },
    avatarColor(name) {
      let n = 0; for (const c of (name || '')) n += c.charCodeAt(0)
      return AVATAR_COLORS[n % AVATAR_COLORS.length]
    },
    initials(name) {
      return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
    },
    triggerPhotoInput() { this.$refs.photoInputRef.click() },
    triggerCamera()     { this.$refs.cameraInputRef.click() },
    onPhotoFile(e) {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 320
          const scale = Math.min(1, MAX / Math.max(img.width, img.height))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          this.user.photo = canvas.toDataURL('image/jpeg', 0.82)
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    },
    toggleCreateForm() {
      this.showCreateForm = !this.showCreateForm
      this.message = ""
    },
    authConfig() {
      const token = sessionStorage.getItem("token")

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
        role: createdUser.role || "operario",
        photo: createdUser.photo || ""
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    deleteUser(userId) {
      this.showConfirm(
        'Ocultar usuario',
        '¿Deseás ocultar este usuario? No se eliminará definitivamente.',
        'Ocultar',
        async () => {
          try { await this.askPassword() } catch { return }
          try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`, this.authConfig())
            this.message = "Usuario ocultado correctamente"
            this.$notify.success("Usuario ocultado correctamente")
            await this.loadUsers()
          } catch (error) {
            this.$notify.notifyApiError(error, "No se pudo eliminar el usuario")
          }
        }
      )
    },
    showConfirm(title, message, confirmText, action) {
      this.confirmDialog = { visible: true, title, message, confirmText, type: 'danger', action }
    },
    onDialogConfirm() {
      const action = this.confirmDialog.action
      this.confirmDialog.visible = false
      if (action) action()
    },
    deleteUserPermanent(userId) {
      this.showConfirm(
        'Eliminar usuario',
        'Eliminar definitivamente este usuario? Esta accion no se puede deshacer.',
        'Eliminar',
        async () => {
          try { await this.askPassword() } catch { return }
          try {
            await axios.delete(`${API_BASE_URL}/users/${userId}/permanent`, this.authConfig())
            this.$notify.success("Usuario eliminado definitivamente")
            await this.loadUsers()
          } catch (error) {
            this.$notify.notifyApiError(error, "No se pudo eliminar definitivamente el usuario")
          }
        }
      )
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
    purgeMaintenanceData() {
      if (this.isPurging) return
      this.showConfirm(
        'Limpiar historial',
        'Esta seguro de limpiar todo el historial y dashboard? Esta accion no se puede deshacer.',
        'Limpiar todo',
        () => this.doPurge()
      )
    },
    async doPurge() {
      try { await this.askPassword() } catch { return }

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
        role: "operario",
        photo: ""
      }
      this.editingUserId = null
    }
  },
  mounted() {
    this.loadUsers()
    const isDark = localStorage.getItem('darkMode') === 'true'
    document.body.style.background = isDark
      ? 'radial-gradient(ellipse at 15% 15%, rgba(120,50,220,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(255,102,0,0.14) 0%, transparent 55%), #070b14'
      : 'rgb(103, 111, 62)'
    document.body.style.backgroundAttachment = 'fixed'
  },
  beforeUnmount() {
    document.body.style.background = '';
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
  box-sizing: border-box;
}

.admin-outer {
  width: min(760px, 100%);
  display: grid;
  grid-template-columns: 360px 360px;
  gap: 1rem;
  align-items: start;
}

.admin-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.logs-panel {
  position: sticky;
  top: 1rem;
  align-items: stretch;
  text-align: left;
}

.panel-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(30, 41, 59, 0.08);
}

.panel-card:hover {
  transition: 0.25s;
  box-shadow: 0 6px 24px rgba(30, 41, 59, 0.12);
}

.title {
  text-align: center;
  margin: 0 0 1rem;
  color: #1e293b;
  font-size: 1.8rem;
  letter-spacing: 0.03rem;
}

/* ── Modal crear/editar usuario ── */
.au-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.au-modal {
  background: #fff;
  border-radius: 14px;
  width: min(480px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
}

.au-modal-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.85rem;
  border-bottom: 1px solid rgba(107, 142, 58, 0.12);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.au-modal-hd h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #1e293b;
  letter-spacing: 0.03rem;
}

.au-close {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(107, 142, 58, 0.1);
  color: #1e293b;
  padding: 0;
  font-size: 0.8rem;
  box-shadow: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.au-modal-bd {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1;
}

.au-field {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  text-align: left;
}

.au-field label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.au-field input,
.au-field select {
  width: 100%;
  padding: 0.55rem 0.85rem;
  margin: 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #1e293b;
  text-align: left;
  font-size: 0.85rem;
}

.au-field input:hover,
.au-field input:focus,
.au-field select:hover,
.au-field select:focus {
  outline: none;
  background: #ffffff;
  border-color: #3b6b2e;
  transition: 0.2s;
  box-shadow: 0 0 0 3px rgba(59, 107, 46, 0.1);
}

.au-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
}

.au-modal-ft {
  padding: 0.85rem 1.25rem 1rem;
  border-top: 1px solid rgba(107, 142, 58, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  position: sticky;
  bottom: 0;
  background: #fff;
}

.au-fade-enter-active,
.au-fade-leave-active {
  transition: opacity 0.2s;
}
.au-fade-enter-from,
.au-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .au-row {
    grid-template-columns: 1fr;
  }
}

button {
  border-radius: 10px;
  padding: 10px;
  background: #3b6b2e;
  color: #ffffff;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.18s;
}

button:hover {
  background: #2d5224;
}

.secondary-button {
  background: #64748b;
  color: #ffffff;
}

.secondary-button:hover {
  background: #475569;
}

.users-panel {
  align-items: stretch;
  text-align: left;
}

.danger-zone {
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.danger-zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.danger-zone h3 {
  margin: 0 0 0.2rem;
  color: #991b1b;
  font-size: 0.95rem;
}

.danger-zone p {
  margin: 0;
  color: #6b7280;
  font-size: 0.78rem;
}

.danger-zone-button {
  flex-shrink: 0;
  padding: 0.4rem 0.85rem;
  font-size: 0.78rem;
  white-space: nowrap;
  background: #c0392b;
  border-radius: 8px;
}

.danger-zone-button:hover {
  background: #a93226;
}

.danger-zone-button:disabled {
  background: #dca29c;
  cursor: not-allowed;
}

.logs-title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logs-desc {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  color: #64748b;
}

.audit-tools-actions {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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
  gap: 0.4rem;
}

.user-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.75rem;
  padding-right: 5rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: none;
  min-height: 52px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  flex: 1;
  min-width: 0;
}

.user-info strong {
  font-size: 0.88rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-meta {
  font-size: 0.75rem;
  color: #64748b;
}

.user-actions {
  position: absolute;
  top: 0.4rem;
  right: 0.5rem;
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.danger-button {
  margin: 0;
  background: #cb5f5f;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.85rem;
}

.edit-button {
  margin: 0;
  background: #6b8e3a;
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.85rem;
}

.edit-button:hover {
  background: #5a7d3a;
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
  border-radius: 10px;
  border: 1px solid #fde68a;
  background: #fffbeb;
}

.deleted-zone h3 {
  margin: 0;
  color: #78350f;
}

.deleted-zone p {
  margin: 0.5rem 0 0.75rem;
  color: #6b7280;
}

.deleted-item {
  background: #ffffff;
  border: 1px solid #fde68a;
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

/* ── Foto de perfil ── */
.photo-picker-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  width: 100%;
}

.photo-preview {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  flex-shrink: 0;
}
.photo-preview:hover .photo-overlay { opacity: 1; }

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #94a3b8;
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.3rem;
  opacity: 0;
  transition: opacity 0.18s;
}

.photo-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: center;
}

.photo-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #6b8e3a;
  color: #fff;
  border: none;
  cursor: pointer;
}
.photo-btn--camera { background: #3b82f6; }
.photo-btn--remove { background: #cb5f5f; }
.photo-btn:hover { filter: brightness(0.9); }

.photo-input-hidden { display: none; }

/* Avatar en lista */
.user-avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.user-avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

/* Responsive */
@media (max-width: 900px) {
  .admin-outer {
    grid-template-columns: 1fr;
  }

  .logs-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 0.35rem 0;
  }

  .admin-outer {
    gap: 0.5rem;
  }

  .panel-card {
    padding: 1rem;
    border-radius: 10px;
  }

  .title {
    font-size: 1.4rem;
  }

  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .panel-header button {
    width: 100%;
  }
}
</style>

<style>
[data-theme="dark"] .panel-card {
  background: rgba(13,18,35,0.72) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .title { color: #ffffff !important; }
[data-theme="dark"] .user-item {
  background: rgba(13,18,35,0.55) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .audit-notepad {
  background: rgba(13,18,35,0.8) !important;
  color: rgba(255,255,255,0.85) !important;
  border-color: rgba(255,255,255,0.12) !important;
}
[data-theme="dark"] .audit-meta { color: rgba(255,255,255,0.45) !important; }
[data-theme="dark"] .deleted-zone {
  background: rgba(120,53,15,0.15) !important;
  border-color: rgba(245,158,11,0.25) !important;
}
[data-theme="dark"] .deleted-zone h3 { color: #fde68a !important; }
[data-theme="dark"] .deleted-zone p  { color: rgba(255,255,255,0.6) !important; }
[data-theme="dark"] .deleted-item {
  background: rgba(13,18,35,0.55) !important;
  border-color: rgba(245,158,11,0.2) !important;
}
[data-theme="dark"] .danger-zone {
  background: rgba(127,29,29,0.15) !important;
  border-color: rgba(239,68,68,0.25) !important;
}
[data-theme="dark"] .danger-zone h3 { color: #fca5a5 !important; }
[data-theme="dark"] .danger-zone p  { color: rgba(255,255,255,0.6) !important; }
[data-theme="dark"] .danger-zone-button:disabled {
  background: rgba(220,162,156,0.3) !important;
  color: rgba(255,255,255,0.4) !important;
}

/* Modal crear/editar usuario dark */
[data-theme="dark"] .au-modal {
  background: rgba(10,14,28,0.98) !important;
  border: 1px solid rgba(255,255,255,0.08);
}
[data-theme="dark"] .au-modal-hd {
  background: rgba(10,14,28,0.98) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .au-modal-hd h2 { color: #ffffff !important; }
[data-theme="dark"] .au-close { background: rgba(255,255,255,0.07) !important; color: rgba(255,255,255,0.8) !important; }
[data-theme="dark"] .au-field label { color: rgba(255,255,255,0.45) !important; }
[data-theme="dark"] .au-field input,
[data-theme="dark"] .au-field select {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}
[data-theme="dark"] .au-modal-ft {
  background: rgba(10,14,28,0.98) !important;
  border-color: rgba(255,255,255,0.08) !important;
}
</style>
