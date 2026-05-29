<template>
  <div class="page-container">

    <div class="machine-layout">

      <!-- =========================
           NUEVA MAQUINA
      ========================== -->
      <div class="box">

        <div
          class="collapse-header"
          @click="showNewMachineForm = !showNewMachineForm"
        >

          <div class="section-title">
            <i class="bi bi-clipboard-plus"></i>

            <h2>
              {{ editingMachineId ? 'Modificar máquina' : 'Nueva máquina' }}
            </h2>
          </div>

          <i
            class="bi"
            :class="showNewMachineForm ? 'bi-chevron-up' : 'bi-chevron-down'"
          ></i>

        </div>

        <!-- CONTENIDO -->
        <div v-if="showNewMachineForm">

          <input
            type="text"
            v-model="form.sector"
            placeholder="Sector de la fábrica"
          />

          <input
            type="text"
            v-model="form.name"
            placeholder="Máquina"
          />

          <label class="parts-label">
            Partes de la máquina
          </label>

          <div
            class="parts-chips"
            v-if="form.machineParts.length"
          >
            <span
              v-for="(part, index) in form.machineParts"
              :key="index"
              class="part-chip"
            >
              {{ part }}

              <button
                type="button"
                class="chip-remove"
                @click="removePart(index)"
              >
                ×
              </button>
            </span>
          </div>

          <div class="part-input-row">

            <input
              type="text"
              v-model="newPart"
              placeholder="Nombre de la parte"
              @keyup.enter="addPart"
            />

            <button
              type="button"
              class="add-part-button"
              @click="addPart"
            >
              +
            </button>

          </div>

          <input
            type="number"
            v-model.number="form.horometro"
            placeholder="Horómetro"
          />

          <textarea
            v-model="form.instructions"
            placeholder="Instrucciones/observaciones de la máquina"
          ></textarea>

          <div class="button-group">

            <button @click="save">
              {{ editingMachineId ? 'Guardar cambios' : 'Guardar' }}
            </button>

            <button @click="cancel">
              {{ editingMachineId ? 'Cancelar edición' : 'Cancelar' }}
            </button>

          </div>

        </div>
      </div>

      <!-- =========================
           LISTA MAQUINAS
      ========================== -->
      <div class="box machines-panel">

        <div
          class="collapse-header"
          @click="showMachinesPanel = !showMachinesPanel"
        >

          <div class="section-title">

            <i class="bi bi-clipboard2-data"></i>

            <h2>
              Máquinas cargadas
            </h2>

          </div>

          <i
            class="bi"
            :class="showMachinesPanel ? 'bi-chevron-up' : 'bi-chevron-down'"
          ></i>

        </div>

        <!-- CONTENIDO -->
        <div v-if="showMachinesPanel">

          <select
            class="sector-select"
            v-model="sectorFilter"
          >

            <option value="">
              Todas las máquinas
            </option>

            <option
              v-for="s in availableSectors"
              :key="s"
              :value="s"
            >
              {{ s }}
            </option>

          </select>

          <p
            v-if="!machines.length"
            class="empty-state"
          >
            No hay máquinas cargadas.
          </p>

          <p
            v-else-if="sectorFilter && !filteredMachines.length"
            class="empty-state"
          >
            No hay máquinas en este sector.
          </p>

          <div
            v-else
            class="machines-list"
          >

            <div
              v-for="machine in filteredMachines"
              :key="machine._id"
              class="machine-item"
            >

              <div class="machine-info">

                <strong>
                  {{ machine.name }}
                </strong>

                <span>
                  Sector: {{ machine.sector }}
                </span>

                <span>
                  Horómetro: {{ machine.horometro }}h
                </span>

                <span v-if="machine.machineParts?.length">
                  Partes: {{ machine.machineParts.join(', ') }}
                </span>

              </div>

              <div class="machine-actions">

                <button
                  type="button"
                  class="history-button"
                  @click="openMachineModal(machine)"
                >
                  Detalles
                </button>

                <button
                  type="button"
                  class="edit-button"
                  @click="modifyMachine(machine._id)"
                >
                  Modificar
                </button>

                <button
                  type="button"
                  class="danger-button"
                  @click="deleteMachine(machine._id)"
                >
                  Ocultar
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>

    </div>

    <!-- =========================
         MODAL DETALLES
    ========================== -->
    <div
      v-if="showMachineModal"
      class="modal"
    >

      <div class="modal-box modal-box-detail">

        <h3>
          {{ selectedMachine?.name }}
        </h3>

        <div style="text-align: left; line-height: 1.8;">

          <p>
            <strong>Sector:</strong>
            {{ selectedMachine?.sector }}
          </p>

          <p>
            <strong>Horómetro actual:</strong>
            {{ selectedMachine?.horometro }}h
          </p>

          <p v-if="selectedMachine?.machineParts?.length">
            <strong>Partes:</strong>
            {{ selectedMachine.machineParts.join(', ') }}
          </p>

          <template v-if="selectedMachine?.instructions">

            <p>
              <strong>Instrucciones/observaciones:</strong>
            </p>

            <p
              style="
                background: #f5f5f5;
                padding: 0.75rem;
                border-radius: 8px;
                white-space: pre-wrap;
              "
            >
              {{ selectedMachine.instructions }}
            </p>

          </template>

          <template v-if="sortedHorometroHistory.length">

            <p>
              <strong>Historial de horómetro:</strong>
            </p>

            <div
              style="
                background: rgba(107,142,58,0.12);
                padding: 0.65rem 0.75rem;
                border-radius: 0.55rem;
                margin-bottom: 0.5rem;
              "
              v-html="machineHorometroSummary"
            ></div>

            <ul
              style="
                text-align: left;
                padding-left: 1.2rem;
                margin: 0;
              "
            >

              <li
                v-for="(item, i) in sortedHorometroHistory"
                :key="i"
                style="margin-bottom: 0.35rem;"
              >

                <strong>
                  {{ item.value }}h
                </strong>

                -
                {{ formatDate(item.recordedAt) }}

              </li>

            </ul>

          </template>

          <p v-else>
            <em style="color: #888;">
              Sin historial de horómetro registrado.
            </em>
          </p>

        </div>

        <button
          @click="closeMachineModal"
          style="margin-top: 1rem;"
        >
          Cerrar
        </button>

      </div>

    </div>

  </div>
</template>


<script>
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

export default {
  data() {
  return {

    showNewMachineForm: false,
    showMachinesPanel: false,

    form: {
      sector: "",
      name: "",
      machineParts: [],
      horometro: null,
      instructions: ""
    },

    newPart: "",
    machines: [],
    deletedMachines: [],
    editingMachineId: null,
    showMachineModal: false,
    selectedMachine: null,
    sectorFilter: "",
    availableSectors: []
  }

  },
  computed: {
    filteredMachines() {
      const filtered = this.sectorFilter
        ? this.machines.filter(m => m.sector === this.sectorFilter)
        : this.machines
      return filtered.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
    },
    sortedHorometroHistory() {
      if (!this.selectedMachine?.horometroHistory?.length) return []
      return [...this.selectedMachine.horometroHistory]
        .filter(item => item && item.recordedAt)
        .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    },
    machineHorometroSummary() {
      if (!this.selectedMachine?.horometroHistory?.length) return ""
      const sorted = [...this.selectedMachine.horometroHistory]
        .filter(item => item && item.recordedAt)
        .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
      return this.buildHorometroSummary(sorted)
    }
  },
  methods: {
    resetForm() {
      this.form = { sector: "", name: "", machineParts: [], horometro: null, instructions: "" }
      this.newPart = ""
      this.editingMachineId = null
    },
    addPart() {
      const trimmed = this.newPart.trim()
      if (trimmed) {
        this.form.machineParts.push(trimmed)
        this.newPart = ""
      }
    },
    removePart(index) {
      this.form.machineParts.splice(index, 1)
    },
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
        const filteredParts = this.form.machineParts
          .map(part => part.trim())
          .filter(Boolean)

        if (!this.form.sector || !this.form.name || !filteredParts.length) {
          this.$notify.error("Por favor completa los campos obligatorios")
          return
        }

        const payload = {
          ...this.form,
          machineParts: filteredParts,
          horometro: this.form.horometro ?? 0
        }

        const isEditing = Boolean(this.editingMachineId)
        const request = isEditing
          ? axios.patch(`${API_BASE_URL}/machines/${this.editingMachineId}`, payload, this.authConfig())
          : axios.post(`${API_BASE_URL}/machines`, payload, this.authConfig())

        await request
        this.$notify.success(isEditing ? "Maquina actualizada correctamente" : "Maquina creada correctamente")
        this.resetForm()
        await this.loadMachines()
      } catch (error) {
        console.error("Error al guardar máquina:", error)
        this.$notify.notifyApiError(error, "Error al guardar la maquina")
      }
    },
    async loadMachines() {
      try {
        const response = await axios.get(`${API_BASE_URL}/machines`, {
          ...this.authConfig(),
          params: {
            includeDeleted: true
          }
        })

        const allMachines = Array.isArray(response.data) ? response.data : []
        this.machines = allMachines
          .filter(machine => !machine.isDeleted)
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
        this.deletedMachines = allMachines
          .filter(machine => machine.isDeleted)
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
        this.availableSectors = [...new Set(this.machines.map(m => m.sector).filter(Boolean))].sort((a, b) => String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" }))

        if (this.sectorFilter && !this.availableSectors.includes(this.sectorFilter)) {
          this.sectorFilter = ""
        }
      } catch (error) {
        console.error("Error al cargar máquinas:", error)
      }
    },
    modifyMachine(machineId) {
      const machine = this.machines.find(item => item._id === machineId)
      if (!machine) return

      this.form = {
        sector: machine.sector || "",
        name: machine.name || "",
        machineParts: Array.isArray(machine.machineParts) ? [...machine.machineParts] : [],
        horometro: machine.horometro ?? 0,
        instructions: machine.instructions || ""
      }
      this.newPart = ""
      this.editingMachineId = machineId

      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    formatDate(value) {
      return new Date(value).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    },
    buildHorometroSummary(sortedHistory) {
      if (sortedHistory.length < 2) {
        return "<p>Se necesitan al menos 2 lecturas para calcular tendencia.</p>"
      }

      const latest = sortedHistory[sortedHistory.length - 1]
      const previous = sortedHistory[sortedHistory.length - 2]

      const latestValue = Number(latest.value)
      const previousValue = Number(previous.value)
      const latestDate = new Date(latest.recordedAt)
      const previousDate = new Date(previous.recordedAt)

      if (!Number.isFinite(latestValue) || !Number.isFinite(previousValue)) {
        return "<p>No se pudo calcular la tendencia por valores inválidos.</p>"
      }

      const deltaHours = latestValue - previousValue
      const deltaDaysRaw = (latestDate - previousDate) / (1000 * 60 * 60 * 24)

      if (!Number.isFinite(deltaDaysRaw) || deltaDaysRaw <= 0) {
        return "<p>No se pudo calcular la tendencia porque las fechas son iguales o inválidas.</p>"
      }

      const avgPerDay = deltaHours / deltaDaysRaw

      if (!Number.isFinite(avgPerDay) || avgPerDay < 0) {
        return "<p>La última lectura es menor a la anterior. Revisá los datos cargados.</p>"
      }

      const deltaDays = Math.round(deltaDaysRaw * 10) / 10
      const normalizedAvg = Math.round(avgPerDay * 100) / 100

      return `
        <p><strong>Diferencia:</strong> ${deltaHours}h en ${deltaDays} días</p>
        <p><strong>Promedio:</strong> ${normalizedAvg} h/día</p>
      `
    },
    openMachineModal(machine) {
      this.selectedMachine = machine
      this.showMachineModal = true
    },
    closeMachineModal() {
      this.showMachineModal = false
      this.selectedMachine = null
    },
    async deleteMachine(machineId) {
      const isConfirmed = window.confirm("Ocultar maquina? No aparecera en formularios ni dashboard de maquinas activas.")
      if (!isConfirmed) return
      try {
        await axios.delete(`${API_BASE_URL}/machines/${machineId}`, this.authConfig())
        this.$notify.success("Maquina ocultada correctamente")
        await this.loadMachines()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo eliminar la maquina")
      }
    },
    async deleteMachinePermanent(machineId) {
      const isConfirmed = window.confirm("Eliminar definitivamente maquina? Esta accion no se puede deshacer.")
      if (!isConfirmed) return

      try {
        await axios.delete(`${API_BASE_URL}/machines/${machineId}/permanent`, this.authConfig())
        this.$notify.success("Maquina eliminada definitivamente")
        await this.loadMachines()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo eliminar definitivamente la maquina")
      }
    },
    async restoreMachine(machineId) {
      try {
        await axios.patch(`${API_BASE_URL}/machines/${machineId}/restore`, {}, this.authConfig())
        this.$notify.success("Maquina restaurada correctamente")
        await this.loadMachines()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo restaurar la maquina")
      }
    },
    cancel() {
      if (this.editingMachineId) {
        this.resetForm()
        return
      }

      this.$router.back()
    }
  },
  mounted() {
    this.loadMachines()
    document.body.style.background = 'linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28))';
  },
  beforeUnmount() {
    document.body.style.background = '';
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

  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.page-container::before,
.page-container::after {
  display: none !important;
  content: none !important;
}

.machine-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}
.collapse-header {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  cursor: pointer;

  user-select: none;

 width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;

  cursor: pointer;

  user-select: none;

  padding: 0.4rem 0;
}



.collapse-header .bi-chevron-up,
.collapse-header .bi-chevron-down {
  position: absolute;
  right: 0;

  font-size: 1rem;

  color: #6b8e3a;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.section-title i {
  font-size: 2rem;
  color: #6b8e3a;

  background: rgba(107, 142, 58, 0.12);

  padding: 0.8rem;

  border-radius: 1rem;
}

.section-title h2 {
  margin: 0;
  font-size: 1.8rem;
}
/* =========================
   BOXES PRINCIPALES
========================= */

.box {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);

  border-radius: 1.5rem;

  padding: 1.6rem;

  border: 1px solid rgba(255, 255, 255, 0.45);

  box-shadow:
    0 10px 35px rgba(0, 0, 0, 0.08),
    0 2px 10px rgba(0, 0, 0, 0.05);

  transition: 0.25s ease;
}

.box:hover {
  transform: translateY(-2px);

  box-shadow:
    0 14px 45px rgba(0, 0, 0, 0.12),
    0 4px 14px rgba(0, 0, 0, 0.06);
}

/* =========================
   HEADERS CON ICONOS
========================= */

.section-header {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  margin-bottom: 1.5rem;
}
.section-title {
  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 0.45rem;

  width: 100%;
}

.section-title i {
  font-size: 1.3rem;

  color: #6b8e3a;

  background: rgba(107, 142, 58, 0.12);

  width: 42px;
  height: 42px;

  border-radius: 0.9rem;

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow: 0 2px 8px rgba(107, 142, 58, 0.12);
}

.section-title h2 {
  margin: 0;

  font-size: 1rem;

  color: #333;

  text-align: center;

  font-weight: 600;
}

/* =========================
   FORMULARIOS
========================= */

.parts-label {
  display: block;
  margin-top: 0.25rem;
  color: #4b4b4b;
  font-size: 0.95rem;
}

.parts-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0 0.4rem;
}

.part-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  background: #6b8e3a;
  color: #fff;

  border-radius: 2rem;

  padding: 4px 12px;

  font-size: 0.88rem;
}

.chip-remove {
  background: none;
  border: none;

  color: #fff;

  cursor: pointer;

  font-size: 1rem;

  padding: 0;

  line-height: 1;
  border-radius: 0;
}

.chip-remove:hover {
  background: none;
  color: #ffd;
}

.part-input-row {
  display: grid;
  grid-template-columns: 1fr auto;

  gap: 0.5rem;

  align-items: center;

  margin-bottom: 0.5rem;
}

.part-input-row input {
  margin: 0;
}

.add-part-button {
  padding: 10px 10px;
  font-size: 1.2rem;
  line-height: 0;
}

input[type="text"],
input[type="number"],
textarea,
.sector-select {
  display: block;

  width: 100%;

  margin: 10px 0;

  padding: 12px 14px;

  border: 1px solid #d8d8d8;

  border-radius: 2rem;

  background: #fff;

  color: #000;

  font-size: 1rem;

  text-align: center;

  transition: 0.2s;
}

textarea {
  resize: vertical;
  min-height: 110px;
}

input:hover,
input:focus,
textarea:hover,
textarea:focus,
.sector-select:hover,
.sector-select:focus {
  outline: none;

  background: #f8f8f8;

  box-shadow: 0 3px 10px rgba(189, 189, 189, 0.25);

  border-color: #c9c9c9;
}

/* =========================
   BOTONES
========================= */

button {
  padding: 10px 14px;

  border: none;
  border-radius: 2rem;

  background: #a6a6a6;

  color: #fff;

  cursor: pointer;

  transition: 0.2s;
}

button:hover {
  background: #8f8f8f;
}

.button-group {
  width: 100%;

  display: grid;

  gap: 0.75rem;

  margin-top: 0.8rem;
}

.toggle-machines-button {
  width: auto;

  padding: 0.75rem 1rem;

  background: #6b8e3a;

  font-weight: 600;
}

.toggle-machines-button:hover {
  background: #5a7d3a;
}

.close-machines-button {
  width: 42px;
  height: 42px;

  border-radius: 50%;

  background: #dc2626;

  color: white;

  font-size: 1.5rem;

  line-height: 1;

  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;
}

.close-machines-button:hover {
  background: #b91c1c;
}

/* =========================
   PANEL MAQUINAS
========================= */

.machines-panel {
  text-align: left;
}

.empty-state {
  color: #888;

  font-size: 0.95rem;

  text-align: center;

  margin-top: 1rem;
}

.machines-list {
  display: flex;
  flex-direction: column;

  gap: 0.75rem;

  margin-top: 0.5rem;
}

.machine-item {
  display: flex;
  flex-wrap: wrap;

  align-items: center;
  justify-content: space-between;

  gap: 0.75rem;

  padding: 1rem;

  background: rgba(0, 0, 0, 0.04);

  border-radius: 1rem;

  border: 1px solid rgba(0, 0, 0, 0.05);
}

.machine-info {
  display: flex;
  flex-direction: column;

  gap: 0.15rem;

  font-size: 0.9rem;

  min-width: 0;

  word-break: break-word;
}

.machine-info strong {
  font-size: 1rem;
  color: #5a7d3a;
}

.machine-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 0.5rem;

  flex-shrink: 0;
}

.machine-actions .edit-button,
.machine-actions .danger-button,
.machine-actions .history-button {
  min-width: 104px;
  text-align: center;
}

.history-button {
  background: #4b5563;
}

.history-button:hover {
  background: #374151;
}

.edit-button {
  background: #6b8e3a;
}

.edit-button:hover {
  background: #5a7d3a;
}

.danger-button {
  background: #dc2626;
}

.danger-button:hover {
  background: #b91c1c;
}

/* =========================
   MODAL
========================= */

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

  border-radius: 1rem;

  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.25);

  width: min(420px, 90vw);
}

.modal-box-detail {
  width: min(700px, 92vw);

  max-height: 85vh;

  overflow-y: auto;
}

.modal-box h3 {
  margin-top: 0;
  color: #333;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 768px) {

  .machine-layout {
    grid-template-columns: 1fr;
  }

  .box {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .section-title {
    justify-content: center;
  }

  .section-title h2 {
    text-align: center;
    font-size: 1.5rem;
  }

  .toggle-machines-button,
  .close-machines-button {
    align-self: center;
  }

  .button-group {
    gap: 0.6rem;
  }

  button {
    width: 100%;
  }

  .machine-item {
    flex-direction: column;
    align-items: stretch;
  }

  .machine-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .machine-item .danger-button,
  .machine-item .edit-button,
  .machine-item .history-button {
    width: auto;
  }
}
</style>