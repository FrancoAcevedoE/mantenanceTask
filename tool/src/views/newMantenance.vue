<template>

    <div class="page-container">


        <!-- VISTA PRINCIPAL -->
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

                    <label>Máquina</label>

                    <select v-model="horometroForm.machineId">

                        <option value="">
                            Seleccionar máquina
                        </option>

                        <option v-for="machine in machines" :key="machine._id" :value="machine._id">
                            {{
                                machine.sector
                                    ? `${machine.sector} - ${machine.name}`
                                    : machine.name
                            }}
                        </option>

                    </select>

                    <label>Nuevo horómetro</label>

                    <input type="number" min="0" step="1" v-model.number="horometroForm.value">

                    <button type="button"
                        :disabled="!horometroForm.machineId || horometroForm.value === null || isUpdatingHorometro"
                        @click="updateHorometroFromPanel">
                        {{
                            isUpdatingHorometro
                                ? 'Actualizando...'
                                : 'Actualizar horómetro'
                        }}
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

                        <p v-else>
                            No hay historial registrado.
                        </p>

                    </div>

                </div>

            </div>

        </div>

        <!-- PANEL NUEVO TRABAJO -->
        <div v-if="activePanel === 'trabajo'" class="panel-container step-block">

            <h2>Nuevo trabajo</h2>

            <form @submit.prevent="saveMaintenance">

                <!-- ACA ARRANCA TU FORMULARIO ORIGINAL -->

                <label>Sector</label>

                <select v-model="form.sector" required @change="onSectorChange">

                    <option value="">
                        Seleccionar sector
                    </option>

                    <option v-for="sector in sectors" :key="sector" :value="sector">
                        {{ sector }}
                    </option>

                </select>

                <!-- TODO EL RESTO DEL FORMULARIO -->
                <!-- DESDE -->
                <!-- v-if="currentStep >= 1"class="step-block"> -->
                <!-- HASTA -->
                <!-- EL FINAL DEL FORM -->

            </form>

        </div>

        <!-- MODAL -->
        <div v-if="showMachineDetailModal" class="modal">

            <div class="modal-box modal-box-detail">

                <h3>Detalle de máquina</h3>

                <div style="text-align: left; line-height: 1.8;">

                    <p>
                        <strong>Sector:</strong>
                        {{ selectedMachine?.sector || "-" }}
                    </p>

                    <p>
                        <strong>Máquina:</strong>
                        {{ selectedMachine?.name || "-" }}
                    </p>

                    <p>
                        <strong>Horómetro:</strong>
                        {{ selectedMachine?.horometro ?? 0 }}h
                    </p>

                    <p>
                        <strong>Partes:</strong>
                        {{
                            selectedMachineParts.length
                                ? selectedMachineParts.join(', ')
                                : "-"
                        }}
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
                        {{ selectedMachine?.instructions || "-" }}
                    </p>

                </div>

                <button type="button" @click="closeMachineDetailModal" style="margin-top: 1rem;">
                    Cerrar
                </button>

            </div>

        </div>

    </div>

</template>

<script>
import axios from "axios"
import { API_BASE_URL } from '@/utils/api'

export default {
  data() {
    return {
      activePanel: "",

      currentStep: 0,

      steps: [
        {
          key: "sector",
          validate: () => !!this.form.sector
        },
        {
          key: "machine",
          validate: () => !!this.form.machine
        },
        {
          key: "parts",
          validate: () => this.form.machineParts.length > 0
        },
        {
          key: "operario",
          validate: () => !!this.form.clientId
        },
        {
          key: "type",
          validate: () => !!this.form.maintenanceType
        },
        {
          key: "description",
          validate: () => !!String(this.form.workDescription || "").trim()
        },
        {
          key: "hours",
          validate: () =>
            Number.isFinite(this.form.hoursWorked) &&
            this.form.hoursWorked > 0
        },
        {
          key: "status",
          validate: () =>
            this.form.machineRunning !== null &&
            this.form.jobFinished !== null
        }
      ],

      form: {
        sector: "",
        machine: "",
        machineParts: [],
        clientId: "",
        maintenanceType: "",
        workDescription: "",
        spareParts: "",
        hoursWorked: null,
        machineRunning: null,
        jobFinished: null,
        unfinishedReasonCategory: "",
        unfinishedReason: ""
      },

      machines: [],
      sectors: [],
      operarios: [],
      allOperarios: [],

      additionalWorkersList: [],
      additionalMachinePartsList: [],

      horometroForm: {
        machineId: "",
        value: null
      },

      isUpdatingHorometro: false,
      horometroConfirmState: {
        machineId: "",
        value: null,
        expiresAt: 0
      },

      showMachineDetailModal: false
    }
  },

  mounted() {
    this.init()

    document.body.style.background =
      'linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28))'
  },

  beforeUnmount() {
    document.body.style.background = ''
  },

  watch: {

    // 🔥 AUTO ADVANCE CORE ENGINE
    form: {
      deep: true,
      handler() {
        this.autoAdvance()
      }
    },

    "form.machine"(val) {
      if (!val) this.form.machineParts = []
    }
  },

  computed: {

    selectedMachine() {
      return this.machines.find(m => m._id === this.form.machine) || null
    },

    selectedMachineParts() {
      if (!this.selectedMachine) return []
      const p = this.selectedMachine.machineParts
      return Array.isArray(p) ? p : (p ? [p] : [])
    },

    selectedHorometroMachine() {
      return this.machines.find(m => m._id === this.horometroForm.machineId) || null
    },

    orderedHorometroHistory() {
      const h = this.selectedHorometroMachine?.horometroHistory || []
      return [...h].sort((a,b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    }
  },

  methods: {

    // 🔥 INIT
    async init() {
      await this.loadMachines()
      await this.loadOperarios()
    },

    authConfig() {
      const token = localStorage.getItem("token")
      return {
        headers: { Authorization: `Bearer ${token}` }
      }
    },

    async loadMachines() {
      const res = await axios.get(`${API_BASE_URL}/machines`, this.authConfig())

      const machines = Array.isArray(res.data) ? res.data : []

      this.machines = machines.sort((a,b) =>
        String(a.name).localeCompare(String(b.name), "es")
      )

      this.sectors = [...new Set(machines.map(m => m.sector).filter(Boolean))]
    },

    async loadOperarios() {
      const res = await axios.get(`${API_BASE_URL}/users/operarios`, this.authConfig())
      this.allOperarios = res.data || []
      this.operarios = this.allOperarios
    },

    // 🔥 CORE ENGINE: AUTO ADVANCE WIZARD
    autoAdvance() {

      const step = this.steps[this.currentStep]

      if (!step) return

      if (!step.validate()) return

      // evita saltar steps sin datos intermedios
      const nextStep = this.currentStep + 1
      const next = this.steps[nextStep]

      if (next && next.validate()) {
        return
      }

      if (nextStep < this.steps.length) {
        this.currentStep = nextStep
      }
    },

    // reset wizard
    reset() {
      this.currentStep = 0

      this.form = {
        sector: "",
        machine: "",
        machineParts: [],
        clientId: "",
        maintenanceType: "",
        workDescription: "",
        spareParts: "",
        hoursWorked: null,
        machineRunning: null,
        jobFinished: null,
        unfinishedReasonCategory: "",
        unfinishedReason: ""
      }

      this.additionalWorkersList = []
    },

    // submit final
    async saveMaintenance() {
      try {

        const payload = {
          ...this.form,
          additionalWorkers: this.additionalWorkersList.map(w => w._id),
          machinePart: this.form.machineParts
        }

        await axios.post(
          `${API_BASE_URL}/maintenance/newmaintenance`,
          payload,
          this.authConfig()
        )

        this.$notify.success("Mantenimiento registrado")
        this.reset()

      } catch (e) {
        this.$notify.notifyApiError(e, "Error")
      }
    },

    // horómetro FIX
    async updateHorometroFromPanel() {

      if (!this.horometroForm.machineId) return

      const now = Date.now()

      const same =
        this.horometroConfirmState.machineId === this.horometroForm.machineId &&
        this.horometroConfirmState.value === this.horometroForm.value &&
        this.horometroConfirmState.expiresAt > now

      if (!same) {
        this.horometroConfirmState = {
          machineId: this.horometroForm.machineId,
          value: this.horometroForm.value,
          expiresAt: now + 7000
        }

        this.$notify.warning("Confirmá otra vez")
        return
      }

      this.isUpdatingHorometro = true

      try {

        await axios.patch(
          `${API_BASE_URL}/machines/${this.horometroForm.machineId}/horometro`,
          { horometro: this.horometroForm.value },
          this.authConfig()
        )

        this.$notify.success("Actualizado")

        await this.loadMachines()

        this.horometroForm.value = null
        this.horometroConfirmState = { machineId: "", value: null, expiresAt: 0 }

      } finally {
        this.isUpdatingHorometro = false
      }
    }
  }
}
</script>

<style scoped>
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

input[type="text"],
input[type="number"],
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
