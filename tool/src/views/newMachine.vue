<template>
    <div class="page-container">
        <div class="machine-layout">

            <!-- Formulario -->
            <div class="box">
              <h2>{{ editingMachineId ? 'Modificar máquina' : 'Nueva máquina' }}</h2>

                <input type="text" v-model="form.sector" placeholder="Sector de la fábrica" />

                <input type="text" v-model="form.name" placeholder="Máquina" />

                <label class="parts-label">Partes de la máquina</label>
                <div class="parts-chips" v-if="form.machineParts.length">
                  <span v-for="(part, index) in form.machineParts" :key="index" class="part-chip">
                    {{ part }}
                    <button type="button" class="chip-remove" @click="removePart(index)">×</button>
                  </span>
                </div>
                <div class="part-input-row">
                  <input
                    type="text"
                    v-model="newPart"
                    placeholder="Nombre de la parte"
                    @keyup.enter="addPart"
                  />
                  <button type="button" class="add-part-button" @click="addPart">+</button>
                </div>

                <input type="number" v-model.number="form.horometro" placeholder="Horómetro"/>

                <textarea v-model="form.instructions" placeholder="Instrucciones/observaciones de la máquina"></textarea>

                <div class="button-group">
                  <button @click="save">{{ editingMachineId ? 'Guardar cambios' : 'Guardar' }}</button>
                  <button @click="cancel">{{ editingMachineId ? 'Cancelar edición' : 'Cancelar' }}</button>
                </div>
            </div>

            <!-- Lista de máquinas -->
            <div class="box machines-panel">
                <h2>Máquinas cargadas</h2>

                <select class="sector-select" v-model="sectorFilter">
                  <option value="">Todas las máquinas</option>
                  <option v-for="s in availableSectors" :key="s" :value="s">{{ s }}</option>
                </select>

                <p v-if="!machines.length" class="empty-state">No hay máquinas cargadas.</p>
                <p v-else-if="sectorFilter && !filteredMachines.length" class="empty-state">No hay máquinas en este sector.</p>
                <div v-else class="machines-list">
                    <div v-for="machine in filteredMachines" :key="machine._id" class="machine-item">
                        <div class="machine-info">
                            <strong>{{ machine.name }}</strong>
                            <span>Sector: {{ machine.sector }}</span>
                            <span>Horómetro: {{ machine.horometro }}h</span>
                            <span v-if="machine.machineParts?.length">Partes: {{ machine.machineParts.join(', ') }}</span>
                    </div>
                    <div class="machine-actions">
                      <button type="button" class="history-button" @click="openMachineModal(machine)">Detalles</button>
                      <button type="button" class="edit-button" @click="modifyMachine(machine._id)">Modificar</button>
                      <button type="button" class="danger-button" @click="deleteMachine(machine._id)">Eliminar</button>
                    </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Modal detalles máquina -->
        <div v-if="showMachineModal" class="modal">
            <div class="modal-box modal-box-detail">
                <h3>{{ selectedMachine?.name }}</h3>
                <div style="text-align: left; line-height: 1.8;">
                    <p><strong>Sector:</strong> {{ selectedMachine?.sector }}</p>
                    <p><strong>Horómetro actual:</strong> {{ selectedMachine?.horometro }}h</p>
                    <p v-if="selectedMachine?.machineParts?.length">
                        <strong>Partes:</strong> {{ selectedMachine.machineParts.join(', ') }}
                    </p>
                    <template v-if="selectedMachine?.instructions">
                        <p><strong>Instrucciones/observaciones:</strong></p>
                        <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">{{ selectedMachine.instructions }}</p>
                    </template>
                    <template v-if="sortedHorometroHistory.length">
                        <p><strong>Historial de horómetro:</strong></p>
                        <div style="background: rgba(14,165,164,0.12); padding: 0.65rem 0.75rem; border-radius: 0.55rem; margin-bottom: 0.5rem;" v-html="machineHorometroSummary"></div>
                        <ul style="text-align: left; padding-left: 1.2rem; margin: 0;">
                            <li v-for="(item, i) in sortedHorometroHistory" :key="i" style="margin-bottom: 0.35rem;">
                                <strong>{{ item.value }}h</strong> - {{ formatDate(item.recordedAt) }}
                            </li>
                        </ul>
                    </template>
                    <p v-else><em style="color: #888;">Sin historial de horómetro registrado.</em></p>
                </div>
                <button @click="closeMachineModal" style="margin-top: 1rem;">Cerrar</button>
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
      form: {
        sector: "",
        name: "",
        machineParts: [],
        horometro: null,
        instructions: ""
      },
      newPart: "",
      machines: [],
      editingMachineId: null,
      backgroundImage: backgroundImage,
      showMachineModal: false,
      selectedMachine: null,
      sectorFilter: "",
      availableSectors: []
    }
  },
  computed: {
    filteredMachines() {
      if (!this.sectorFilter) return this.machines
      return this.machines.filter(m => m.sector === this.sectorFilter)
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
          this.$toast.error("Por favor completa los campos obligatorios")
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
        this.$toast.success(isEditing ? "Maquina actualizada correctamente" : "Maquina creada correctamente")
        this.resetForm()
        await this.loadMachines()
      } catch (error) {
        console.error("Error al guardar máquina:", error)
        this.$toast.error("Error al guardar la maquina: " + (error.response?.data?.error || error.message))
      }
    },
    async loadMachines() {
      try {
        const response = await axios.get(`${API_BASE_URL}/machines`, this.authConfig())
        this.machines = response.data
        this.availableSectors = [...new Set(response.data.map(m => m.sector).filter(Boolean))].sort()
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
      const isConfirmed = window.confirm("¿Eliminar maquina? Esta accion no se puede deshacer.")
      if (!isConfirmed) return
      try {
        await axios.delete(`${API_BASE_URL}/machines/${machineId}`, this.authConfig())
        this.$toast.success("Maquina eliminada correctamente")
        await this.loadMachines()
      } catch (error) {
        this.$toast.error(error.response?.data?.error || "No se pudo eliminar la maquina")
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

.machine-layout {
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

.box {
  width: 100%;
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
  background: #0369a1;
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
  padding: 10px 18px;
  font-size: 1.2rem;
  line-height: 1;
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
  padding: 0.75rem 1rem;
  background: rgba(0,0,0,0.04);
  border-radius: 0.5rem;
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
  color: #1e3a5f;
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
  white-space: nowrap;
  flex-shrink: 0;
}

.history-button:hover {
  background: #374151;
}

.edit-button {
  background: #0ea5a4;
  white-space: nowrap;
  flex-shrink: 0;
}

.edit-button:hover {
  background: #0b8a89;
}

.danger-button {
  background: #dc2626;
  white-space: nowrap;
  flex-shrink: 0;
}

.danger-button:hover {
  background: #b91c1c;
}

/* Responsive */
@media (max-width: 768px) {
  .machine-layout {
    grid-template-columns: 1fr;
  }

  .box {
    padding: 1rem;
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

.modal-box h3 {
  margin-top: 0;
  color: #333;
}

.sector-select {
  display: block;
  width: 100%;
  margin: 0 0 0.75rem;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  background: #fff;
  color: #000;
  font-size: 1rem;
  cursor: pointer;
  text-align: center;
}

.sector-select:hover,
.sector-select:focus {
  outline: none;
  background: #f0f0f0;
  transition: 0.2s;
  box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

</style>
