<template>
  <form class="panel-container form-container" @submit.prevent="saveMaintenance">
    <div class="page-container">
      <div class="action-selector">
        <!-- HOROMETRO -->
        <div class="action-card" @click="activePanel = activePanel === 'horometro' ? '' : 'horometro'">
          <i class="bi bi-stopwatch"></i>
          <p class="action-title">ACTUALIZAR HORÓMETRO</p>
        </div>
        <!-- NUEVO TRABAJO -->
        <div class="action-card" @click="activePanel = activePanel === 'trabajo' ? '' : 'trabajo'">
          <i class="bi bi-clipboard-data"></i>
          <p class="action-title">NUEVO TRABAJO</p>
        </div>
      </div>
      <!-- PANEL HOROMETRO -->
      <!-- PANEL HOROMETRO -->
      <div v-if="activePanel === 'horometro'" class="panel-container step-block">
        <div class="horometro-panel">
          <h2>Actualizar horómetro</h2>
          <div class="horometro-body">
            <select v-model="horometroForm.machineId">
              <option value="">Seleccionar máquina</option>
              <option v-for="machine in machines" :key="machine._id" :value="machine._id">
                {{ machine.sector ? `${machine.sector} - ${machine.name}` : machine.name }}
              </option>
            </select>
            <label>Nuevo horómetro</label>
            <input type="number" min="0" step="1" v-model.number="horometroForm.value" />
            <button type="button" :disabled="!horometroForm.machineId || horometroForm.value === null || isUpdatingHorometro
              " @click="updateHorometroFromPanel">
              {{ isUpdatingHorometro ? 'Actualizando...' : 'Actualizar horómetro' }}
            </button>
            <div v-if="selectedHorometroMachine" class="horometro-history">
              <p>
                <strong>Horómetro actual:</strong>
                {{ selectedHorometroMachine.horometro ?? 0 }}h
              </p>
              <p>
                <strong>Historial</strong>
              </p>
              <ul v-if="orderedHorometroHistory.length" class="horometro-list">
                <li v-for="entry in orderedHorometroHistory" :key="`${entry.recordedAt}-${entry.value}`">
                  {{ formatDate(entry.recordedAt) }}
                  -
                  {{ entry.value }}h
                </li>
              </ul>
              <p v-else>No hay historial registrado.</p>
            </div>
          </div>
        </div>
      </div>
      <!-- PANEL NUEVO TRABAJO -->
      <div v-if="activePanel === 'trabajo'" class="panel-container step-block">
        <h2>NUEVA TAREA</h2>
        <form @submit.prevent="saveMaintenance">
          <select v-model="form.sector" required @change="onSectorChange">
            <option value="">SELECCIONAR SECTOR</option>
            <option v-for="sector in sectors" :key="sector" :value="sector">
              {{ sector }}
            </option>
          </select>
          <select v-model="form.machine" required @change="onMachineChange">
            <option value="">SELECCIONAR MÁQUINA</option>
            <option v-for="machine in filteredMachinesBySector" :key="machine._id" :value="machine._id">
              {{ machine.name }}
            </option>
          </select>
          <label>PARTES DE LA MÁQUINA</label>

          <div class="multi-select">
            <div class="multi-select-header" @click="showPartsDropdown = !showPartsDropdown">
              <span v-if="form.machinePart.length">
                {{ form.machinePart.join(', ') }}
              </span>

              <span v-else>
                Seleccionar partes
              </span>

              <span class="dropdown-arrow">
                ▼
              </span>
            </div>

            <div v-if="showPartsDropdown" class="multi-select-dropdown">
              <label v-for="part in selectedMachinePart" :key="part" class="multi-option">
                <input type="checkbox" :value="part" v-model="form.machinePart">

                {{ part }}
              </label>

              <div v-if="!selectedMachinePart.length" class="multi-empty">
                La máquina no tiene partes configuradas.
              </div>
            </div>
          </div>
          <label>OPERARIO</label>
          <select v-model="form.clientId">
            <option value="">Seleccionar operario</option>
            <option v-for="op in operarios" :key="op._id" :value="op._id">
              {{ op.name }}
            </option>
          </select>
          <select v-model="form.maintenanceType">

            <option value="Preventivo predictivo">Preventivo predictivo</option>
            <option value="Preventivo de mejora continua">Preventivo de mejora continua</option>
            <option value="Preventivo de correctivo">Preventivo de correctivo</option>
            <option value="Arreglo">Arreglo</option>
            <option value="fabricación">Fabricación</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Puesta en marcha (maquina parada)">
              Puesta en marcha (maquina parada)
            </option>

          </select>
          <label>DESCRIPCIÓN</label>
          <textarea v-model="form.workDescription"></textarea>
          <label>HORAS TRABAJADAS</label>
          <input type="number" min="0.5" step="0.5" v-model.number="form.hoursWorked" />
          <label>MÁQUINA EN FUNCIONAMIENTO?</label>
          <select v-model="form.machineRunning">
            <option :value="null">Seleccionar</option>
            <option :value="true">Sí</option>
            <option :value="false">No</option>
          </select>
          <label>TRABAJO TERMINADO?</label>
          <select v-model="form.jobFinished">
            <option :value="null">Seleccionar</option>
            <option :value="true">Sí</option>
            <option :value="false">No</option>
          </select>
          <button type="submit">Guardar mantenimiento</button>
        </form>
      </div>
      <!-- MODAL -->
      <div v-if="showMachineDetailModal" class="modal">
        <div class="modal-box modal-box-detail">
          <h3>Detalle de máquina</h3>
          <div style="text-align: left; line-height: 1.8">
            <p>
              <strong>Sector:</strong>
              {{ selectedMachine?.sector || '-' }}
            </p>
            <p>
              <strong>Máquina:</strong>
              {{ selectedMachine?.name || '-' }}
            </p>
            <p>
              <strong>Horómetro:</strong>
              {{ selectedMachine?.horometro ?? 0 }}h
            </p>
            <p>
              <strong>Partes:</strong>
              {{ selectedMachinePart.length ? selectedMachinePart.join(', ') : '-' }}
            </p>
            <p>
              <strong>Instrucciones/observaciones:</strong>
            </p>
            <p style="
                background: #f5f5f5;
                padding: 0.75rem;
                border-radius: 8px;
                white-space: pre-wrap;
              ">
              {{ selectedMachine?.instructions || '-' }}
            </p>
          </div>
          <button type="button" @click="closeMachineDetailModal" style="margin-top: 1rem">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<script>
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

export default {
  data() {
    return {
      activePanel: '',
      operarios: [],
      allOperarios: [],
      additionalWorkersList: [],
      selectedAdditionalWorker: '',
      showPartsDropdown: false,
      additionalMachinePartList: [],
      selectedAdditionalMachinePart: '',
      machines: [],
      sectors: [],
      currentUserRole: '',
      currentUserId: '',
      isUpdatingHorometro: false,
      horometroConfirmState: {
        machineId: '',
        value: null,
        expiresAt: 0,
      },
      maintenanceTypes: [
        "Preventivo predictivo",
        "Preventivo de mejora continua",
        "Preventivo de correctivo",
        "Arreglo",
        "fabricación",
        "Limpieza",
        "Puesta en marcha (maquina parada)"
      ],
      horometroForm: {
        machineId: '',
        value: null,
      },

      form: {
        sector: '',
        machine: '',
        machinePart: [],
        clientId: '',
        maintenanceType: '',
        workDescription: '',
        spareParts: '',
        hoursWorked: null,
        machineRunning: null,
        jobFinished: null,
        unfinishedReasonCategory: '',
        unfinishedReason: '',
      },
      unfinishedReasonOptions: [
        'Tiempo de parada insuficiente.',
        'Falta de personal.',
        'Falta de repuestos (en el acto)',
        'Falta de repuestos (Mas de una semana).',
        'Falta de presupuesto.',
        'Otros',
      ],
      showMachineDetailModal: false,
    }
  },

  async mounted() {
    this.activePanel = ''

    const currentUser = this.getStoredUser()
    this.currentUserRole = currentUser?.role || ''
    this.currentUserId = currentUser?.id || currentUser?._id || ''

    await this.loadOperarios()
    await this.loadMachines()

    document.body.style.background = 'linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28))'
document.body.style.backgroundAttachment = 'fixed'
  },

  beforeUnmount() {
    document.body.style.background = ''
  },

  computed: {
    isSectorComplete() {
      return Boolean(this.form.sector)
    },
    isMachineComplete() {
      return this.isSectorComplete && Boolean(this.selectedMachine)
    },
    isMachinePartComplete() {
      return this.isMachineComplete && this.form.machinePart.length > 0
    },
    isOperarioComplete() {
      return this.isMachinePartComplete && Boolean(this.form.clientId)
    },
    isMaintenanceTypeComplete() {
      return this.isOperarioComplete && Boolean(this.form.maintenanceType)
    },
    isWorkDescriptionComplete() {
      return (
        this.isMaintenanceTypeComplete && Boolean(String(this.form.workDescription || '').trim())
      )
    },
    isHoursWorkedComplete() {
      return (
        this.isWorkDescriptionComplete &&
        Number.isFinite(this.form.hoursWorked) &&
        this.form.hoursWorked > 0
      )
    },
    isMachineRunningAnswered() {
      return (
        this.isHoursWorkedComplete &&
        (this.form.machineRunning === true || this.form.machineRunning === false)
      )
    },
    isJobFinishedAnswered() {
      return (
        this.isMachineRunningAnswered &&
        (this.form.jobFinished === true || this.form.jobFinished === false)
      )
    },
    availableAdditionalWorkers() {
      const usedIds = new Set([this.form.clientId, ...this.additionalWorkersList.map((w) => w._id)])
      return this.allOperarios.filter((op) => !usedIds.has(op._id))
    },
    availableAdditionalMachinePart() {
      const usedParts = new Set([...this.form.machinePart, ...this.additionalMachinePartList])
      return this.selectedMachinePart.filter((part) => !usedParts.has(part))
    },
    availableMachinePart() {
      const usedParts = new Set(this.form.machinePart)
      return this.selectedMachinePart.filter((part) => !usedParts.has(part))
    },
    filteredMachinesBySector() {
      if (!this.form.sector) return []
      return this.machines
        .filter((machine) => machine.sector === this.form.sector)
        .sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }),
        )
    },
    selectedMachine() {
      if (!this.form.sector || !this.form.machine) return null

      return this.filteredMachinesBySector.find(
        m => m._id === this.form.machine
      )
    },
    selectedMachinePart() {
  if (!this.selectedMachine) return []

  const parts =
    this.selectedMachine.machineParts ||
    this.selectedMachine.additionalMachinePartsList ||
    []
console.log("JSON:", JSON.stringify(this.machines.find(m => m._id === this.form.machine), null, 2))
  return Array.isArray(parts) ? parts : []
  console.log("JSON:", JSON.stringify(this.machines.find(m => m._id === this.form.machine), null, 2))
},

    selectedHorometroMachine() {
      if (!this.horometroForm.machineId) return null
      return this.machines.find((machine) => machine._id === this.horometroForm.machineId) || null
    },
    orderedHorometroHistory() {
      if (!this.selectedHorometroMachine) return []
      const history = Array.isArray(this.selectedHorometroMachine.horometroHistory)
        ? this.selectedHorometroMachine.horometroHistory
        : []

      return [...history].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    },
  },

  methods: {
    getStoredUser() {
      try {
        const rawUser = localStorage.getItem('user')
        return rawUser ? JSON.parse(rawUser) : null
      } catch {
        return null
      }
    },

    onSectorChange() {
      this.form.machine = ''
      this.form.machinePart = []
      this.additionalMachinePartList = []
      this.selectedAdditionalMachinePart = ''
    },

    authConfig() {
      const token = localStorage.getItem('token')

      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    },

    async loadOperarios() {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/operarios`, this.authConfig())

        const currentUser = this.getStoredUser()
        const currentUserId = currentUser?.id || currentUser?._id || ''
        const operarios = response.data || []

        this.allOperarios = operarios

        if (currentUser?.role === 'operario') {
          this.operarios = operarios.filter((operario) => operario._id === currentUserId)
          this.form.clientId = this.operarios[0]?._id || currentUserId
        } else {
          this.operarios = operarios
        }
      } catch (error) {
        this.$notify.error('Error al cargar operarios')
      }
    },

    async loadMachines() {
      try {
        const response = await axios.get(`${API_BASE_URL}/machines`, this.authConfig())

        const machines = Array.isArray(response.data) ? response.data : []

        this.machines = machines.map(m => ({
  ...m,
  machinePart: m.machineParts || m.machinePart || []
}))
        this.machines = machines.sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }),
        )
        this.sectors = [
          ...new Set(this.machines.map((machine) => machine.sector).filter(Boolean)),
        ].sort((a, b) =>
          String(a || '').localeCompare(String(b || ''), 'es', { sensitivity: 'base' }),
        )
      } catch (error) {
        this.$notify.error('Error al cargar maquinas')
      }
    },

    onMachineChange() {
       console.log("MAQUINA", this.selectedMachine)
      if (!this.selectedMachine) {
        this.form.machinePart = []
        this.additionalMachinePartList = []
        this.selectedAdditionalMachinePart = ''
        this.form.machinePart = []
        this.showPartsDropdown = false
        return
      }

      this.form.machinePart = []
      this.additionalMachinePartList = []
      this.selectedAdditionalMachinePart = ''
    },

    async updateHorometroFromPanel() {
      if (this.isUpdatingHorometro) return

      if (!this.horometroForm.machineId) {
        this.$notify.error('Selecciona una maquina')
        return
      }

      if (
        !Number.isFinite(this.horometroForm.value) ||
        this.horometroForm.value < 0
      ) {
        this.$notify.error('El horometro debe ser un numero mayor o igual a 0')
        return
      }
      const targetMachine = this.machines.find(
        (machine) => machine._id === this.horometroForm.machineId,
      )
      const machineLabel = targetMachine?.name || 'la maquina seleccionada'
      const confirmationWindowMs = 7000
      const now = Date.now()
      const sameOperation =
        this.horometroConfirmState.machineId === this.horometroForm.machineId &&
        this.horometroConfirmState.value === this.horometroForm.value &&
        this.horometroConfirmState.expiresAt > now

      if (!sameOperation) {
        this.horometroConfirmState = {
          machineId: this.horometroForm.machineId,
          value: this.horometroForm.value,
          expiresAt: now + confirmationWindowMs,
        }
        this.$notify.warning(
          `Confirmacion requerida: volve a presionar "Actualizar horometro" en los proximos ${Math.floor(confirmationWindowMs / 1000)}s para ${machineLabel} (${this.horometroForm.value}h).`,
        )
        return
      }

      this.isUpdatingHorometro = true

      try {
        await axios.patch(
          `${API_BASE_URL}/machines/${this.horometroForm.machineId}/horometro`,
          { horometro: this.horometroForm.value },
          this.authConfig(),
        )

        this.$notify.success('Horometro actualizado')
        await this.loadMachines()
        this.horometroForm.value = null
        this.horometroConfirmState = { machineId: '', value: null, expiresAt: 0 }
      } catch (error) {
        if (error?.response?.status === 403) {
          this.$notify.error(
            'No tenes permiso para actualizar el horometro. Si deberias tener acceso, avisame y lo revisamos en backend.',
          )
          return
        }
        this.$notify.notifyApiError(error, 'No se pudo actualizar horometro')
      } finally {
        this.isUpdatingHorometro = false
      }
    },

    onUnfinishedReasonCategoryChange() {
      if (this.form.unfinishedReasonCategory !== 'Otros') {
        this.form.unfinishedReason = ''
      }
    },

    addWorker() {
      if (!this.selectedAdditionalWorker) return
      const worker = this.allOperarios.find((op) => op._id === this.selectedAdditionalWorker)
      if (worker && !this.additionalWorkersList.find((w) => w._id === worker._id)) {
        this.additionalWorkersList.push(worker)
      }
      this.selectedAdditionalWorker = ''
    },

    removeWorker(workerId) {
      this.additionalWorkersList = this.additionalWorkersList.filter((w) => w._id !== workerId)
    },

    addMachinePart() {
      if (!this.selectedAdditionalMachinePart) return
      if (!this.form.machinePart.includes(this.selectedAdditionalMachinePart)) {
        this.form.machinePart.push(this.selectedAdditionalMachinePart)
      }
      this.selectedAdditionalMachinePart = ''
    },

    removeMachinePart(part) {
      this.form.machinePart = this.form.machinePart.filter((p) => p !== part)
    },

    removeMachinePartFromMain(part) {
      this.additionalMachinePartList = this.additionalMachinePartList.filter((p) => p !== part)
    },

    async saveMaintenance() {
      try {
        if (!Number.isFinite(this.form.hoursWorked) || this.form.hoursWorked <= 0) {
          this.$notify.error('Las horas trabajadas deben ser un numero mayor a 0')
          return
        }

        if (!this.form.sector) {
          this.$notify.error('Primero selecciona un sector')
          return
        }

        if (!this.selectedMachine) {
          this.$notify.error('Selecciona una maquina del sector elegido')
          return
        }

        if (this.form.machinePart.length === 0) {
          this.$notify.error('Debes seleccionar al menos una parte de maquina')
          return
        }

        if (!this.form.clientId) {
          this.$notify.error('Debes seleccionar un operario valido')
          return
        }

        if (!String(this.form.maintenanceType || '').trim()) {
          this.$notify.error('Debes seleccionar un tipo de mantenimiento')
          return
        }

        if (!String(this.form.workDescription || '').trim()) {
          this.$notify.error('Debes cargar la descripcion del trabajo realizado')
          return
        }

        if (
          (this.form.jobFinished === false || this.form.machineRunning === false) &&
          !this.form.unfinishedReasonCategory
        ) {
          this.$notify.error('Debes seleccionar un motivo por el que no se termino')
          return
        }

        if (this.form.machineRunning !== true && this.form.machineRunning !== false) {
          this.$notify.error('Debes indicar si la maquina sigue funcionando')
          return
        }

        if (this.form.jobFinished !== true && this.form.jobFinished !== false) {
          this.$notify.error('Debes indicar si el trabajo se termino')
          return
        }

        if (
          (this.form.jobFinished === false || this.form.machineRunning === false) &&
          this.form.unfinishedReasonCategory === 'Otros' &&
          !String(this.form.unfinishedReason || '').trim()
        ) {
          this.$notify.error("Debes detallar el motivo cuando seleccionas 'Otros'")
          return
        }

        const payload = {
          ...this.form,
          machinePart: this.form.machinePart,
          additionalWorkers: this.additionalWorkersList.map(w => w._id)
        }
        await axios.post(`${API_BASE_URL}/maintenance/newmaintenance`, payload, this.authConfig())

        this.$notify.success('Mantenimiento registrado')

        this.resetForm()
      } catch (error) {
        this.$notify.notifyApiError(error, 'Error al guardar mantenimiento')
      }
    },

    resetForm() {
      this.form = {
        sector: '',
        machine: '',
        machinePart: [],
        clientId: this.currentUserRole === 'operario' ? this.currentUserId : '',
        maintenanceType: '',
        workDescription: '',
        spareParts: '',
        hoursWorked: null,
        machineRunning: null,
        jobFinished: null,
        unfinishedReasonCategory: '',
        unfinishedReason: '',
      }

      this.additionalWorkersList = []
      this.selectedAdditionalWorker = ''
      this.selectedAdditionalMachinePart = ''
    },

    showMachineInstructions() {
      if (this.selectedMachine && this.selectedMachine.instructions) {
        this.showMachineDetailModal = true
      }
    },

    openMachineDetailModal() {
      if (this.selectedMachine) {
        this.showMachineDetailModal = true
      }
    },

    closeMachineDetailModal() {
      this.showMachineDetailModal = false
    },

    formatDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) {
        return '-'
      }

      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 700px;
  margin: 1.5rem auto 0;
  padding: 1rem;
  background: #fafafa;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
}

.multi-select {
  width: 100%;
  position: relative;
  margin: 10px 0;
}

.multi-select-header {
  width: 100%;
  min-height: 46px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 16px;

  background: white;
  border: 1px solid #ccc;
  border-radius: 2rem;

  cursor: pointer;

  box-sizing: border-box;
}

.multi-select-header:hover {
  background: #f5f5f5;
}

.dropdown-arrow {
  font-size: 12px;
  color: #666;
}

.multi-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;

  width: 100%;

  background: white;
  border: 1px solid #ddd;
  border-radius: 16px;

  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);

  z-index: 1000;

  max-height: 250px;
  overflow-y: auto;
}

.multi-option {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 12px 15px;

  cursor: pointer;
  text-align: left;
}

.multi-option:hover {
  background: #f5f5f5;
}

.multi-option input {
  width: auto;
  margin: 0;
}

.multi-empty {
  padding: 15px;
  text-align: center;
  color: #666;
}

.panel-container {
  width: 100%;
  max-width: 700px;
  margin: 1.5rem auto 0;
  justify-content: center;
}

.page-container {
  width: 100%;
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 2rem;

  background: transparent !important;

  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* ELIMINA CUALQUIER MARCO FANTASMA */
.page-container::before,
.page-container::after {
  display: none !important;
  content: none !important;
}

/* POR SI ALGUN PADRE AGREGA EL RECUADRO */
:deep(.page-container),
:deep(.content),
:deep(.wrapper),
:deep(.container) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.action-selector {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: 0.25s;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.action-card i {
  font-size: 3rem;
  color: rgb(69, 82, 28);
  margin-bottom: 1rem;
}

.action-card h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  text-align: center;
}

/* RESPONSIVE */

@media (max-width: 768px) {
  .action-selector {
    grid-template-columns: 1fr;
  }

  .action-card {
    padding: 1.5rem 1rem;
  }
}

h2 {
  margin-top: 0;
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
  font-size: 2rem;
  letter-spacing: 0.04rem;
}

label {
  display: block;
  width: 100%;
  margin-top: 0.15rem;
  color: #4b4b4b;
  font-size: 0.95rem;
  text-align: center;
}

form {
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
}

input[type='text'],
input[type='number'],
textarea,
select {
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
  min-height: 100px;
}

input:hover,
input:focus,
textarea:hover,
textarea:focus,
select:hover,
select:focus {
  outline: none;
  background: #f0f0f0;
  transition: 0.2s;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

button {
  margin-top: 1rem;
  padding: 10px;
  border: none;
  border-radius: 2rem;
  background: #a6a6a6;
  color: #fff;
  cursor: pointer;
  width: 100%;
}

.button-group {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.step-block {
  animation: stepReveal 240ms ease-out;
  transform-origin: top center;
}

@keyframes stepReveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-block {
    animation: none;
  }
}

.button-group button {
  margin-top: 0;
}

.secondary-button {
  background: #8d8d8d;
}

button:hover {
  background: #8f8f8f;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
  width: min(420px, 90vw);
}

.modal-box-detail {
  width: min(700px, 92vw);
  max-height: 85vh;
  overflow-y: auto;
}

.secondary-button:hover {
  background: #767676;
}

.workers-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0;
  justify-content: center;
}

.worker-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  border-radius: 2rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.88rem;
}

.chip-remove {
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  padding: 0;
  width: auto;
  margin-top: 0;
  font-size: 1.1rem;
  line-height: 1;
  display: inline;
}

.chip-remove:hover {
  background: none;
  color: #b71c1c;
}

.add-worker-btn {
  width: auto;
  padding: 0.5rem 1rem;
  background: #00a878;
  margin-top: 0;
  white-space: nowrap;
}

.add-worker-btn:hover {
  background: #008f67;
}

.add-worker-btn:disabled {
  background: #b2dfdb;
  cursor: not-allowed;
}

.horometro-panel {
  margin-bottom: 1rem;
  text-align: left;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 0.55rem 0.8rem;
  background: #fafafa;
}

.horometro-panel summary {
  cursor: pointer;
  font-weight: 600;
  color: #355062;
}

.horometro-body {
  margin-top: 0.65rem;
}

.horometro-history {
  margin-top: 0.75rem;
  background: #f3f7fa;
  border: 1px solid #dde7ee;
  border-radius: 8px;
  padding: 0.65rem;
}

.horometro-list {
  margin: 0;
  padding-left: 1.1rem;
  max-height: 170px;
  overflow-y: auto;
}

.additional-workers-empty {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.parts-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0;
  justify-content: center;
}

.part-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  border-radius: 2rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.88rem;
}

.part-chip.additional {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
}

.add-part-btn {
  width: auto;
  padding: 0.5rem 1rem;
  background: #00a878;
  margin-top: 0;
  white-space: nowrap;
}

.add-part-btn:hover {
  background: #008f67;
}

.add-part-btn:disabled {
  background: #b2dfdb;
  cursor: not-allowed;
}

.additional-parts-empty {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
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
}
</style>
