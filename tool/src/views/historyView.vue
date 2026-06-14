<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <p>HISTORIAL</p>
        <button @click="$router.push('/dashboard')">Ir al Dashboard</button>
      </div>

      <div v-if="currentUserRole === 'vendedor'" class="seller-message">
        <p>Como vendedor, tienes acceso al historial de cotizaciones.</p>
        <button @click="$router.push('/seller')">Ir a Cotizaciones</button>
      </div>

      <div v-else-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando historial...</p>
      </div>

      <div v-else>
        <div class="filters">
          <input v-model="searchMachine" placeholder="Buscar por máquina" />
          <select v-model="filterSector">
            <option value="">Todos los sectores</option>
            <option v-for="sector in sectors" :key="sector" :value="sector">{{ sector }}</option>
          </select>
          <select v-model="filterOperario">
            <option value="">Todos los operarios</option>
            <option v-for="op in operarios" :key="op.value" :value="op.value">{{ op.label }}</option>
          </select>
          <input type="date" v-model="filterDate" />
        </div>

        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th class="col-hide-mobile">Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
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
                    <button class="btn-detail" @click="openDetailModal(item)">
                      <span class="btn-full">Ver detalle</span>
                      <span class="btn-short">Info</span>
                    </button>
                    <button v-if="currentUserRole === 'admin'" class="btn-delete" @click="deleteMaintenanceRecord(item)">
                      <span class="btn-full">Eliminar</span>
                      <span class="btn-short">Borrar</span>
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
          <h3>Detalles del mantenimiento</h3>
          <div class="detail-content">
            <p><strong>Operario:</strong> {{ formatOperarioName(selectedDetail?.clientId) }}</p>
            <p v-if="selectedDetail?.additionalWorkers?.length">
              <strong>Otros operarios:</strong>
              {{ selectedDetail.additionalWorkers.map(w => formatOperarioName(w)).join(', ') }}
            </p>
            <p><strong>Sector:</strong> {{ selectedDetail?.sector }}</p>
            <p><strong>Máquina:</strong> {{ selectedDetail?.machine }}</p>
            <p><strong>Partes:</strong> {{ Array.isArray(selectedDetail?.machinePart) ? selectedDetail.machinePart.join(', ') : selectedDetail?.machinePart }}</p>
            <p><strong>Tipo de mantenimiento:</strong> {{ selectedDetail?.maintenanceType }}</p>
            <p><strong>Horas trabajadas:</strong> {{ selectedDetail?.hoursWorked }}</p>
            <p><strong>Estado:</strong> {{ formatStatus(selectedDetail?.status) }}</p>
            <p><strong>Fecha:</strong> {{ formatDate(selectedDetail?.createdAt) }}</p>
            <p><strong>Hora:</strong> {{ formatTime(selectedDetail?.createdAt) }}</p>
            <p><strong>Descripción del trabajo:</strong></p>
            <p class="detail-text">{{ selectedDetail?.workDescription || '-' }}</p>
            <p><strong>Repuestos utilizados:</strong></p>
            <p class="detail-text">{{ selectedDetail?.spareParts || '-' }}</p>
          </div>
          <div class="modal-actions">
            <button v-if="selectedDetail?.status !== 'finished'" class="btn-finish" @click="openFinishFromDetail">Terminar</button>
            <button class="btn-close" @click="closeDetailModal">Cerrar</button>
          </div>
        </div>
      </div>

      <div v-if="showFinishModal" class="modal" @click.self="closeFinishModal">
        <div class="modal-box">
          <h3>Finalizar mantenimiento</h3>
          <label>Horas adicionales</label>
          <input type="number" min="0.5" step="0.5" v-model.number="extraHours" />
          <div class="modal-actions">
            <button class="btn-finish" @click="finishMaintenance">Guardar</button>
            <button class="btn-close" @click="closeFinishModal">Cancelar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import axios from "axios"
import { API_BASE_URL } from '@/utils/api'

export default {

  data() {
    return {
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
    document.body.style.background = 'rgb(103, 111, 62)'
    const currentUser = this.getStoredUser()
    this.currentUserRole = currentUser?.role || ""
    if (currentUser?.role === 'vendedor') return
    await this.loadHistory()
  },

  beforeUnmount() {
    document.body.style.background = ''
  },

  computed: {
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
        const raw = localStorage.getItem("user")
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    },

    authConfig() {
      const token = localStorage.getItem("token")
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
      if (status === "finished") return "Terminado"
      if (status === "pending") return "Pendiente"
      if (status === "stopped") return "Máquina parada"
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

    async deleteMaintenanceRecord(item) {
      if (!window.confirm(`¿Eliminar el registro de ${item.machine}? Esta acción no se puede deshacer.`)) return
      try {
        await axios.delete(`${API_BASE_URL}/maintenance/${item._id}`, this.authConfig())
        this.$notify.success("Registro eliminado correctamente")
        await this.loadHistory()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo eliminar el registro")
      }
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
  padding: 2rem;
  background: transparent;
}

.container {
  width: min(900px, 100%);
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

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filters input,
.filters select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  min-width: 180px;
  background: #fff;
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
  min-width: 480px;
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
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

button {
  border-radius: 2rem;
  padding: 8px 14px;
  background: #a6a6a6;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
}

button:hover { background: #8f8f8f; }

.btn-detail { background: #1e88e5; }
.btn-detail:hover { background: #1565c0; }

.btn-delete { background: #c62828; }
.btn-delete:hover { background: #b71c1c; }

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

.btn-short { display: none; }

@media (max-width: 1000px) {
  .col-hide-mobile { display: none; }
  .btn-full { display: none; }
  .btn-short { display: inline; }
  .btn-detail, .btn-delete { padding: 6px 10px; font-size: 0.8rem; }
}

@media (max-width: 768px) {
  .page-container { padding: 1rem; }
  .container { padding: 1rem; }
  .topbar { flex-direction: column; align-items: stretch; }
  .filters input, .filters select { min-width: 100%; }
  .history-table { min-width: unset; }
  .history-table th, .history-table td { padding: 8px 8px; font-size: 0.82rem; }
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
</style>
