<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <p>{{ t.title }}</p>
        <button @click="$router.push('/dashboard')">{{ t.goDashboard }}</button>
      </div>

      <div v-if="currentUserRole === 'vendedor'" class="seller-message">
        <p>{{ t.sellerMsg }}</p>
        <button @click="$router.push('/seller')">{{ t.goSeller }}</button>
      </div>

      <div v-else-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t.loading }}</p>
      </div>

      <div v-else>
        <div class="filters">
          <input v-model="searchMachine" :placeholder="t.searchMachine" />
          <select v-model="filterSector">
            <option value="">{{ t.allSectors }}</option>
            <option v-for="sector in sectors" :key="sector" :value="sector">{{ sector }}</option>
          </select>
          <select v-model="filterOperario">
            <option value="">{{ t.allOperarios }}</option>
            <option v-for="op in operarios" :key="op.value" :value="op.value">{{ op.label }}</option>
          </select>
          <input type="date" v-model="filterDate" />
        </div>

        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>{{ t.colName }}</th>
                <th class="col-hide-mobile">{{ t.colDate }}</th>
                <th>{{ t.colStatus }}</th>
                <th>{{ t.colActions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredHistory" :key="item._id" :class="getRowClass(item.status)">
                <td>{{ item.machine }}</td>
                <td class="col-hide-mobile">{{ formatDate(item.createdAt) }}</td>
                <td>
                  <span class="status-badge" :class="'badge-' + item.status">
                    {{ formatStatus(item.status) }}
                  </span>
                </td>
                <td class="action-cell">
                  <div class="action-buttons">
                    <button class="btn-detail" @click="openDetailModal(item)" title="Ver detalle">
                      <i class="bi bi-info-circle-fill"></i>
                    </button>
                    <button v-if="currentUserRole === 'admin'" class="btn-delete" @click="deleteMaintenanceRecord(item)" title="Eliminar">
                      <i class="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showDetailModal" class="modal" @click.self="closeDetailModal">
        <div class="modal-box modal-box-detail">
          <h3>{{ t.modalTitle }}</h3>
          <div class="detail-content">
            <p><strong>{{ t.labelOperario }}</strong> {{ formatOperarioName(selectedDetail?.clientId) }}</p>
            <p v-if="selectedDetail?.additionalWorkers?.length">
              <strong>{{ t.labelOthers }}</strong>
              {{ selectedDetail.additionalWorkers.map(w => formatOperarioName(w)).join(', ') }}
            </p>
            <p><strong>{{ t.labelSector }}</strong> {{ selectedDetail?.sector }}</p>
            <p><strong>{{ t.labelMachine }}</strong> {{ selectedDetail?.machine }}</p>
            <p><strong>{{ t.labelParts }}</strong> {{ Array.isArray(selectedDetail?.machinePart) ? selectedDetail.machinePart.join(', ') : selectedDetail?.machinePart }}</p>
            <p><strong>{{ t.labelType }}</strong> {{ selectedDetail?.maintenanceType }}</p>
            <p><strong>{{ t.labelHours }}</strong> {{ selectedDetail?.hoursWorked }}</p>
            <p><strong>{{ t.labelStatus }}</strong> {{ formatStatus(selectedDetail?.status) }}</p>
            <p><strong>{{ t.labelDate }}</strong> {{ formatDate(selectedDetail?.createdAt) }}</p>
            <p><strong>{{ t.labelTime }}</strong> {{ formatTime(selectedDetail?.createdAt) }}</p>
            <p><strong>{{ t.labelDesc }}</strong></p>
            <p class="detail-text">{{ selectedDetail?.workDescription || '-' }}</p>
            <p><strong>{{ t.labelParts2 }}</strong></p>
            <p class="detail-text">{{ selectedDetail?.spareParts || '-' }}</p>
          </div>
          <div class="modal-actions">
            <button v-if="selectedDetail?.status !== 'finished'" class="btn-finish" @click="openFinishFromDetail">{{ t.btnFinish }}</button>
            <button class="btn-close" @click="closeDetailModal">{{ t.btnClose }}</button>
          </div>
        </div>
      </div>

      <div v-if="showFinishModal" class="modal" @click.self="closeFinishModal">
        <div class="modal-box">
          <h3>{{ t.modalFinish }}</h3>
          <label>{{ t.labelExtraHours }}</label>
          <input type="number" min="0.5" step="0.5" v-model.number="extraHours" />
          <div class="modal-actions">
            <button class="btn-finish" @click="finishMaintenance">{{ t.btnSave }}</button>
            <button class="btn-close" @click="closeFinishModal">{{ t.btnCancel }}</button>
          </div>
        </div>
      </div>
    </Teleport>
    <ConfirmDialog
      :visible="confirmDlg.visible"
      :title="confirmDlg.title"
      :message="confirmDlg.message"
      :confirm-text="confirmDlg.confirmText"
      :type="confirmDlg.type"
      @confirm="onConfirmDlg"
      @cancel="confirmDlg.visible = false"
    />
  </div>
</template>

<script>
import axios from "axios"
import { API_BASE_URL } from '@/utils/api'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useLocale } from '@/composables/useLocale'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const TRANSLATIONS = {
  es: {
    title: 'HISTORIAL', goDashboard: 'Ir al Dashboard',
    sellerMsg: 'Como vendedor, tienes acceso al historial de cotizaciones.',
    goSeller: 'Ir a Cotizaciones', loading: 'Cargando historial...',
    searchMachine: 'Buscar por máquina', allSectors: 'Todos los sectores',
    allOperarios: 'Todos los operarios',
    colName: 'Nombre', colDate: 'Fecha', colStatus: 'Estado', colActions: 'Acciones',
    modalTitle: 'Detalles del mantenimiento',
    labelOperario: 'Operario:', labelOthers: 'Otros operarios:',
    labelSector: 'Sector:', labelMachine: 'Máquina:', labelParts: 'Partes:',
    labelType: 'Tipo de mantenimiento:', labelHours: 'Horas trabajadas:',
    labelStatus: 'Estado:', labelDate: 'Fecha:', labelTime: 'Hora:',
    labelDesc: 'Descripción del trabajo:', labelParts2: 'Repuestos utilizados:',
    btnFinish: 'Terminar', btnClose: 'Cerrar',
    modalFinish: 'Finalizar mantenimiento', labelExtraHours: 'Horas adicionales',
    btnSave: 'Guardar', btnCancel: 'Cancelar',
    statusFinished: 'Terminado', statusPending: 'Pendiente', statusStopped: 'Máquina parada',
  },
  pt: {
    title: 'HISTÓRICO', goDashboard: 'Ir ao Dashboard',
    sellerMsg: 'Como vendedor, tens acesso ao histórico de cotações.',
    goSeller: 'Ir a Cotações', loading: 'Carregando histórico...',
    searchMachine: 'Pesquisar por máquina', allSectors: 'Todos os setores',
    allOperarios: 'Todos os operários',
    colName: 'Nome', colDate: 'Data', colStatus: 'Status', colActions: 'Ações',
    modalTitle: 'Detalhes da manutenção',
    labelOperario: 'Operário:', labelOthers: 'Outros operários:',
    labelSector: 'Setor:', labelMachine: 'Máquina:', labelParts: 'Peças:',
    labelType: 'Tipo de manutenção:', labelHours: 'Horas trabalhadas:',
    labelStatus: 'Status:', labelDate: 'Data:', labelTime: 'Hora:',
    labelDesc: 'Descrição do trabalho:', labelParts2: 'Peças utilizadas:',
    btnFinish: 'Concluir', btnClose: 'Fechar',
    modalFinish: 'Finalizar manutenção', labelExtraHours: 'Horas adicionais',
    btnSave: 'Salvar', btnCancel: 'Cancelar',
    statusFinished: 'Concluído', statusPending: 'Pendente', statusStopped: 'Máquina parada',
  },
}

export default {
  components: { ConfirmDialog },

  setup() {
    const { locale } = useLocale()
    const { askPassword } = usePasswordConfirm()
    return { locale, askPassword }
  },

  data() {
    return {
      confirmDlg: { visible: false, title: '', message: '', confirmText: 'Eliminar', type: 'danger', action: null },
      isLoading: false,
      history: [],
      searchMachine: "",
      filterSector: "",
      filterOperario: "",
      filterDate: "",
      sectors: [],
      operarios: [],
      showDetailModal: false,
      showFinishModal: false,
      selectedDetail: null,
      selectedId: null,
      extraHours: 0,
      currentUserRole: ""
    }
  },

  async mounted() {
    const isDark = localStorage.getItem('darkMode') === 'true'
    document.body.style.background = isDark
      ? 'radial-gradient(ellipse at 15% 15%, rgba(120,50,220,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(255,102,0,0.14) 0%, transparent 55%), #070b14'
      : 'rgb(103, 111, 62)'
    const currentUser = this.getStoredUser()
    this.currentUserRole = currentUser?.role || ""
    if (currentUser?.role === 'vendedor') return
    await this.loadHistory()
  },

  beforeUnmount() {
    document.body.style.background = ''
  },

  computed: {
    t() { return TRANSLATIONS[this.locale] || TRANSLATIONS.es },

    filteredHistory() {
      return this.history.filter(item => {
        const machineMatch = String(item.machine || '').toLowerCase().includes(this.searchMachine.toLowerCase())
        const sectorMatch = this.filterSector ? item.sector === this.filterSector : true
        const operarioMatch = this.filterOperario
          ? item.clientId?._id === this.filterOperario ||
            (item.additionalWorkers || []).some(w => w?._id === this.filterOperario)
          : true
        const dateMatch = this.filterDate ? item.createdAt.slice(0, 10) === this.filterDate : true
        return machineMatch && sectorMatch && operarioMatch && dateMatch
      })
    }
  },

  methods: {

    getStoredUser() {
      try {
        const raw = sessionStorage.getItem("user")
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    },

    authConfig() {
      const token = sessionStorage.getItem("token")
      return { headers: { Authorization: `Bearer ${token}` } }
    },

    async loadHistory() {
      this.isLoading = true
      try {
        const res = await axios.get(`${API_BASE_URL}/maintenance/history`, this.authConfig())
        this.history = res.data
        this.sectors = [...new Set(res.data.map(item => item.sector))]
        this.operarios = res.data.reduce((acc, item) => {
          if (item.clientId?._id && !acc.some(o => o.value === item.clientId._id)) {
            acc.push({ value: item.clientId._id, label: this.formatOperarioName(item.clientId) })
          }
          ;(item.additionalWorkers || []).forEach(w => {
            if (w?._id && !acc.some(o => o.value === w._id)) {
              acc.push({ value: w._id, label: this.formatOperarioName(w) })
            }
          })
          return acc
        }, [])
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo cargar el historial")
      } finally {
        this.isLoading = false
      }
    },

    getRowClass(status) {
      if (status === "pending") return "row-yellow"
      if (status === "stopped") return "row-red"
      return ""
    },

    formatOperarioName(operario) {
      if (!operario) return "-"
      return operario.company ? `${operario.name} - ${operario.company}` : operario.name
    },

    formatDate(value) {
      if (!value) return "-"
      return new Date(value).toLocaleDateString("es-AR")
    },

    formatTime(value) {
      if (!value) return "-"
      return new Date(value).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    },

    formatStatus(status) {
      if (status === "finished") return this.t.statusFinished
      if (status === "pending") return this.t.statusPending
      if (status === "stopped") return this.t.statusStopped
      return status || "-"
    },

    openDetailModal(item) {
      this.selectedDetail = item
      this.selectedId = item._id
      this.showDetailModal = true
    },

    closeDetailModal() {
      this.showDetailModal = false
      this.selectedDetail = null
    },

    openFinishFromDetail() {
      this.showDetailModal = false
      this.showFinishModal = true
    },

    closeFinishModal() {
      this.showFinishModal = false
      this.extraHours = 0
      this.selectedId = null
    },

    async finishMaintenance() {
      if (!Number.isFinite(this.extraHours) || this.extraHours <= 0) {
        this.$notify.error("Las horas adicionales deben ser un número mayor a 0")
        return
      }
      try {
        await axios.put(
          `${API_BASE_URL}/maintenance/finish/${this.selectedId}`,
          { hoursWorked: this.extraHours },
          this.authConfig()
        )
        this.closeFinishModal()
        this.$notify.success("Trabajo terminado correctamente")
        await this.loadHistory()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo terminar el trabajo")
      }
    },

    deleteMaintenanceRecord(item) {
      this.confirmDlg = {
        visible: true, title: 'Eliminar registro',
        message: `¿Eliminar el registro de ${item.machine}? Esta accion no se puede deshacer.`,
        confirmText: 'Eliminar', type: 'danger',
        action: async () => {
          try { await this.askPassword() } catch { return }
          try {
            await axios.delete(`${API_BASE_URL}/maintenance/${item._id}`, this.authConfig())
            this.$notify.success("Registro eliminado correctamente")
            await this.loadHistory()
          } catch (error) {
            this.$notify.notifyApiError(error, "No se pudo eliminar el registro")
          }
        }
      }
    },
    onConfirmDlg() {
      const action = this.confirmDlg.action
      this.confirmDlg.visible = false
      if (action) action()
    }

  }

}
</script>

<style scoped>

.page-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.75rem 2rem;
  background: transparent;
}

.container {
  width: min(900px, 100%);
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.62);
  padding: 1.9rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.topbar p {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
}

.topbar button {
  min-width: 0;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
}

.filters input,
.filters select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  min-width: 0;
  flex: 1 1 180px;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  text-align: center;
  text-align-last: center;
  font-size: 0.88rem;
}

.filters input:focus,
.filters select:focus {
  outline: none;
  background: #f0f0f0;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 0;
}

.history-table th,
.history-table td {
  padding: 10px 14px;
  font-size: 0.9rem;
  border-bottom: 1px solid #e8e8e8;
  text-align: left;
  color: #444;
  vertical-align: middle;
}

.history-table th {
  background: #f5f5f5;
  color: #333;
  font-weight: 600;
}

/* Safari/iOS no recorta el fondo de las celdas con el border-radius del
   wrapper, así que redondeamos las celdas de las puntas directamente. */
.history-table thead tr:first-child th:first-child {
  border-top-left-radius: 10px;
}

.history-table thead tr:first-child th:last-child {
  border-top-right-radius: 10px;
}

.history-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 10px;
}

.history-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 10px;
}

.row-yellow { background: #fff8e1; }
.row-red    { background: #fdecea; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge-finished  { background: #e8f5e9; color: #2e7d32; }
.badge-pending   { background: #fff3e0; color: #e65100; }
.badge-stopped   { background: #fdecea; color: #c62828; }

.action-cell {
  white-space: nowrap;
  width: 1%;
  text-align: right;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 0.3rem;
  justify-content: flex-end;
}

button:hover { background: #8f8f8f; }

.action-buttons .btn-detail,
.action-buttons .btn-delete {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  min-width: 0;
  box-shadow: none;
}

.action-buttons .btn-detail { background: #e3f0fa; color: #1565c0; border: 1px solid rgba(21, 101, 192, 0.2); }
.action-buttons .btn-detail:hover { background: #d2e6f7; }

.action-buttons .btn-delete { background: #fdecea; color: #c62828; border: 1px solid rgba(198, 40, 40, 0.2); }
.action-buttons .btn-delete:hover { background: #fbdcd9; }

.btn-finish { background: #2e7d32; }
.btn-finish:hover { background: #1b5e20; }

.btn-close { background: #757575; }
.btn-close:hover { background: #616161; }

.seller-message {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.seller-message p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #495057;
}

@media (max-width: 1000px) {
  .col-hide-mobile { display: none; }
  .action-cell { padding: 6px 4px !important; }
}

@media (max-width: 768px) {
  .page-container { padding: 0.5rem 0.5rem 2rem; }
  .container { padding: 0.85rem; }
  .topbar { flex-direction: column; align-items: stretch; }
  .filters { flex-direction: column; align-items: stretch; }
  .filters input,
  .filters select {
    width: 100%;
    flex: unset;
    font-size: 0.85rem;
  }
  .history-table { min-width: 0; }
  .history-table th, .history-table td { padding: 8px 6px; font-size: 0.82rem; }
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  gap: 1rem;
  color: #666;
  font-size: 0.95rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #1e88e5;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Modales (renderizados en <body> via Teleport) ── */
</style>

<style>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-box {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  width: min(420px, 90vw);
}

.modal-box-detail {
  width: min(680px, 92vw);
  max-height: 85vh;
  overflow-y: auto;
}

.modal-box h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.modal-box input {
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  box-sizing: border-box;
}

.modal-box label {
  font-size: 0.9rem;
  color: #555;
}

.detail-content {
  text-align: left;
  line-height: 1.8;
}

.detail-content p {
  margin: 0.3rem 0;
}

.detail-text {
  background: #f5f5f5;
  padding: 0.75rem;
  border-radius: 8px;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  justify-content: flex-end;
}

[data-theme="dark"] .modal-box {
  background: rgba(10,14,28,0.97) !important;
  border: 1px solid rgba(255,255,255,0.09) !important;
}
[data-theme="dark"] .modal-box h3 { color: #ffffff !important; }
[data-theme="dark"] .modal-box label { color: rgba(255,255,255,0.6) !important; }
[data-theme="dark"] .detail-text {
  background: rgba(13,18,35,0.7) !important;
  color: rgba(255,255,255,0.82) !important;
}
</style>
