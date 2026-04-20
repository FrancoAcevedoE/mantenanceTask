<template>

<div class="page-container">
    <div class="box">
        <h2>Nuevo trabajo</h2>

        <details class="horometro-panel step-block">
            <summary>Actualizar horometro</summary>
            <div class="horometro-body">
                <label>Maquina</label>
                <select v-model="horometroForm.machineId">
                    <option value="">Seleccionar maquina</option>
                    <option v-for="machine in machines" :key="machine._id" :value="machine._id">
                        {{ machine.sector ? `${machine.sector} - ${machine.name}` : machine.name }}
                    </option>
                </select>

                <label>Nuevo horometro</label>
                <input type="number" min="0" step="1" v-model.number="horometroForm.value">

                <button type="button" :disabled="!horometroForm.machineId || horometroForm.value === null || isUpdatingHorometro" @click="updateHorometroFromPanel">
                    {{ isUpdatingHorometro ? 'Actualizando...' : 'Actualizar horometro' }}
                </button>

                <div v-if="selectedHorometroMachine" class="horometro-history">
                    <p><strong>Horometro actual:</strong> {{ selectedHorometroMachine.horometro ?? 0 }}h</p>
                    <p><strong>Historial</strong></p>
                    <ul v-if="orderedHorometroHistory.length" class="horometro-list">
                        <li v-for="entry in orderedHorometroHistory" :key="`${entry.recordedAt}-${entry.value}`">
                            {{ formatDate(entry.recordedAt) }} - {{ entry.value }}h
                        </li>
                    </ul>
                    <p v-else>No hay historial registrado.</p>
                </div>
            </div>
        </details>

        <form @submit.prevent="saveMaintenance">

<label>Sector</label>
<select v-model="form.sector" required @change="onSectorChange">
    <option value="">Seleccionar sector</option>
    <option v-for="sector in sectors" :key="sector" :value="sector">
        {{ sector }}
    </option>
</select>

<div v-if="isSectorComplete" class="step-block">
<label>Máquina</label>
<div style="display: flex; gap: 0.5rem; align-items: center;">
        <select v-model="form.machine" required style="flex: 1;" @change="onMachineChange" :disabled="!form.sector">
        <option value="">{{ form.sector ? 'Seleccionar máquina' : 'Primero seleccioná un sector' }}</option>
        <option v-for="machine in filteredMachinesBySector" :key="machine._id" :value="machine.name">
      {{ machine.name }}
    </option>
  </select>
  <button 
    v-if="form.machine && selectedMachine && selectedMachine.instructions"
    type="button" 
        @click="openMachineDetailModal"
    style="padding: 0.5rem 1rem; background-color: #00a878; color: white; border: none; border-radius: 5px; cursor: pointer;"
  >
        Ver detalle
  </button>
</div>
</div>

<div v-if="isMachineComplete" class="step-block">
<label>Partes de máquina</label>
<div v-if="form.machineParts.length" class="parts-chips">
    <span v-for="part in form.machineParts" :key="part" class="part-chip">
        {{ part }}
        <button type="button" class="chip-remove" @click="removeMachinePart(part)">&#xD7;</button>
    </span>
</div>
<div v-if="availableMachineParts.length" style="display:flex;gap:0.5rem;align-items:center;margin:8px 0;">
    <select v-model="selectedAdditionalMachinePart" style="flex:1;margin:0;">
        <option value="">Seleccionar parte</option>
        <option v-for="part in availableMachineParts" :key="part" :value="part">
            {{ part }}
        </option>
    </select>
    <button type="button" @click="addMachinePart" :disabled="!selectedAdditionalMachinePart" class="add-part-btn">Agregar</button>
</div>
<p v-else class="additional-parts-empty">No hay otras partes disponibles para agregar.</p>
</div>

<div v-if="isMachinePartComplete" class="step-block">
<label>Operario</label>
<select v-model="form.clientId" required :disabled="currentUserRole === 'operario'">

<option disabled value="">Seleccionar operario</option>
<option v-for="operario in operarios" :key="operario._id" :value="operario._id">
{{ operario.company ? `${operario.name} - ${operario.company}` : operario.name }}
</option>

</select>
</div>

<div v-if="isOperarioComplete" class="step-block">
    <label>Otros operarios</label>
    <div v-if="additionalWorkersList.length" class="workers-chips">
        <span v-for="worker in additionalWorkersList" :key="worker._id" class="worker-chip">
            {{ worker.company ? `${worker.name} - ${worker.company}` : worker.name }}
            <button type="button" class="chip-remove" @click="removeWorker(worker._id)">&#xD7;</button>
        </span>
    </div>
    <div v-if="availableAdditionalWorkers.length" style="display:flex;gap:0.5rem;align-items:center;margin:8px 0;">
        <select v-model="selectedAdditionalWorker" style="flex:1;margin:0;">
            <option value="">Seleccionar operario</option>
            <option v-for="op in availableAdditionalWorkers" :key="op._id" :value="op._id">
                {{ op.company ? `${op.name} - ${op.company}` : op.name }}
            </option>
        </select>
        <button type="button" @click="addWorker" :disabled="!selectedAdditionalWorker" class="add-worker-btn">Agregar</button>
    </div>
    <p v-else class="additional-workers-empty">No hay otros operarios disponibles para agregar.</p>
</div>

<div v-if="isOperarioComplete" class="step-block">
<label>Tipo de mantenimiento</label>
<select v-model="form.maintenanceType">

<option value="">Seleccionar tipo</option>
<option value="Preventivo predictivo">Preventivo predictivo</option>
<option value="Preventivo de mejora continua">Preventivo de mejora continua</option>
<option value="Preventivo de correctivo">Preventivo de correctivo</option>
<option value="Arreglo">Arreglo</option>
<option value="fabricación">Fabricación</option>
<option value="Limpieza">Limpieza</option>
<option value="Puesta en marcha (maquina parada)">Puesta en marcha (maquina parada)</option>

</select>
</div>

<div v-if="isMaintenanceTypeComplete" class="step-block">
<label>Descripción del trabajo realizado</label>
<textarea v-model="form.workDescription"></textarea>
</div>

<div v-if="isWorkDescriptionComplete" class="step-block">
<label>Repuestos utilizados</label>
<textarea v-model="form.spareParts"></textarea>

<label>Horas trabajadas</label>
<input type="number" min="0.5" step="0.5" v-model.number="form.hoursWorked">
</div>

<div v-if="isHoursWorkedComplete" class="step-block">
<label>¿La máquina sigue funcionando?</label>

<select v-model="form.machineRunning">
<option disabled :value="null">Seleccionar</option>
<option :value="true">SI</option>
<option :value="false">NO</option>

</select>
</div>

<div v-if="isMachineRunningAnswered" class="step-block">
<label>¿El trabajo se terminó?</label>

<select v-model="form.jobFinished">
<option disabled :value="null">Seleccionar</option>
<option :value="true">SI</option>
<option :value="false">NO</option>

</select>
</div>

<div v-if="isJobFinishedAnswered && (form.jobFinished === false || form.machineRunning === false)" class="step-block">

<label>Motivo por el que no se terminó</label>
<select v-model="form.unfinishedReasonCategory" @change="onUnfinishedReasonCategoryChange">
<option value="">Seleccionar motivo</option>
<option v-for="reason in unfinishedReasonOptions" :key="reason" :value="reason">
{{ reason }}
</option>
</select>

<div v-if="form.unfinishedReasonCategory === 'Otros'">
<label>Detalle del motivo</label>
<textarea v-model="form.unfinishedReason" placeholder="Escribí el motivo"></textarea>
</div>

</div>

<div v-if="isJobFinishedAnswered" class="button-group step-block">
<button type="submit">

Guardar mantenimiento

</button>

<button type="button" class="secondary-button" @click="resetForm">

Cancelar

</button>
</div>

</form>

<div v-if="showMachineDetailModal" class="modal">
    <div class="modal-box modal-box-detail">
        <h3>Detalle de máquina</h3>
        <div style="text-align: left; line-height: 1.8;">
            <p><strong>Sector:</strong> {{ selectedMachine?.sector || "-" }}</p>
            <p><strong>Máquina:</strong> {{ selectedMachine?.name || "-" }}</p>
            <p><strong>Horómetro:</strong> {{ selectedMachine?.horometro ?? 0 }}h</p>
            <p><strong>Partes:</strong> {{ selectedMachineParts.length ? selectedMachineParts.join(', ') : "-" }}</p>
            <p><strong>Instrucciones/observaciones:</strong></p>
            <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">{{ selectedMachine?.instructions || "-" }}</p>
        </div>
        <button type="button" @click="closeMachineDetailModal" style="margin-top: 1rem;">Cerrar</button>
    </div>
</div>
    </div>
</div>

</template>

<script>

import axios from "axios"

import backgroundImage from '@/assets/fondogeneral.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

export default{

data(){

return{

operarios:[],
allOperarios:[],
additionalWorkersList:[],
selectedAdditionalWorker:"",
selectedAdditionalMachinePart:"",
machines:[],
sectors:[],
currentUserRole:"",
currentUserId:"",
isUpdatingHorometro:false,
horometroConfirmState:{
machineId:"",
value:null,
expiresAt:0
},

horometroForm:{
machineId:"",
value:null
},

form:{

sector:"",
machine:"",
machineParts:[],
clientId:"",
maintenanceType:"",
workDescription:"",
spareParts:"",
hoursWorked:null,
machineRunning:null,
jobFinished:null,
unfinishedReasonCategory:"",
unfinishedReason:""

},
unfinishedReasonOptions:[
"Tiempo de parada insuficiente.",
"Falta de personal.",
"Falta de repuestos (en el acto)",
"Falta de repuestos (Mas de una semana).",
"Falta de presupuesto.",
"Otros"
],
backgroundImage: backgroundImage
,
showMachineDetailModal: false

}

},

async mounted() {
    const currentUser = this.getStoredUser()
    this.currentUserRole = currentUser?.role || ""
    this.currentUserId = currentUser?.id || currentUser?._id || ""
    await this.loadOperarios()
    await this.loadMachines()
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
},

computed: {
    isSectorComplete() {
        return Boolean(this.form.sector)
    },
    isMachineComplete() {
        return this.isSectorComplete && Boolean(this.selectedMachine)
    },
    isMachinePartComplete() {
        return this.isMachineComplete && this.form.machineParts.length > 0
    },
    isOperarioComplete() {
        return this.isMachinePartComplete && Boolean(this.form.clientId)
    },
    isMaintenanceTypeComplete() {
        return this.isOperarioComplete && Boolean(this.form.maintenanceType)
    },
    isWorkDescriptionComplete() {
        return this.isMaintenanceTypeComplete && Boolean(String(this.form.workDescription || "").trim())
    },
    isHoursWorkedComplete() {
        return this.isWorkDescriptionComplete && Number.isFinite(this.form.hoursWorked) && this.form.hoursWorked > 0
    },
    isMachineRunningAnswered() {
        return this.isHoursWorkedComplete && (this.form.machineRunning === true || this.form.machineRunning === false)
    },
    isJobFinishedAnswered() {
        return this.isMachineRunningAnswered && (this.form.jobFinished === true || this.form.jobFinished === false)
    },
    availableAdditionalWorkers() {
        const usedIds = new Set([
            this.form.clientId,
            ...this.additionalWorkersList.map(w => w._id)
        ])
        return this.allOperarios.filter(op => !usedIds.has(op._id))
    },
    availableAdditionalMachineParts() {
        const usedParts = new Set([
            ...this.form.machineParts,
            ...this.additionalMachinePartsList
        ])
        return this.selectedMachineParts.filter(part => !usedParts.has(part))
    },
    availableMachineParts() {
        const usedParts = new Set(this.form.machineParts)
        return this.selectedMachineParts.filter(part => !usedParts.has(part))
    },
    filteredMachinesBySector() {
        if (!this.form.sector) return []
        return this.machines
          .filter(machine => machine.sector === this.form.sector)
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
    },
  selectedMachine() {
        if (!this.form.sector || !this.form.machine) return null
        return this.filteredMachinesBySector.find(m => m.name === this.form.machine)
    },
    selectedMachineParts() {
        if (!this.selectedMachine) return []

        const parts = this.selectedMachine.machineParts

        if (Array.isArray(parts)) {
            return parts
        }

        return parts ? [parts] : []
  },
    selectedHorometroMachine() {
        if (!this.horometroForm.machineId) return null
        return this.machines.find(machine => machine._id === this.horometroForm.machineId) || null
    },
    orderedHorometroHistory() {
        if (!this.selectedHorometroMachine) return []
        const history = Array.isArray(this.selectedHorometroMachine.horometroHistory)
            ? this.selectedHorometroMachine.horometroHistory
            : []

        return [...history].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    }
},

methods:{

getStoredUser() {
try {
const rawUser = localStorage.getItem("user")
return rawUser ? JSON.parse(rawUser) : null
} catch {
return null
}
},

onSectorChange() {
this.form.machine = ""
this.form.machineParts = []
this.additionalMachinePartsList = []
this.selectedAdditionalMachinePart = ""
},

authConfig(){

const token = localStorage.getItem("token")

return {
headers:{
Authorization: `Bearer ${token}`
}
}

},

async loadOperarios(){

try{

const response = await axios.get(
`${API_BASE_URL}/users/operarios`,
this.authConfig()
)

const currentUser = this.getStoredUser()
const currentUserId = currentUser?.id || currentUser?._id || ""
const operarios = response.data || []

this.allOperarios = operarios

if (currentUser?.role === "operario") {
this.operarios = operarios.filter(operario => operario._id === currentUserId)
this.form.clientId = this.operarios[0]?._id || currentUserId
} else {
this.operarios = operarios
}

}catch(error){

    this.$notify.error("Error al cargar operarios")

}

},

async loadMachines(){

try{

const response = await axios.get(
`${API_BASE_URL}/machines`,
this.authConfig()
)

const machines = Array.isArray(response.data) ? response.data : []
this.machines = machines.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" }))
this.sectors = [...new Set(this.machines.map(machine => machine.sector).filter(Boolean))].sort((a, b) => String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" }))

}catch(error){

    this.$notify.error("Error al cargar maquinas")

}

},

onMachineChange(){

if(!this.selectedMachine){
this.form.machineParts = []
this.additionalMachinePartsList = []
this.selectedAdditionalMachinePart = ""
return
}

this.form.machineParts = []
this.additionalMachinePartsList = []
this.selectedAdditionalMachinePart = ""

},

async updateHorometroFromPanel() {
if (this.isUpdatingHorometro) return

if (!this.horometroForm.machineId) {
this.$notify.error("Selecciona una maquina")
return
}

if (!Number.isFinite(this.horometroForm.value) || this.horometroForm.value < 0) {
this.$notify.error("El horometro debe ser un numero mayor o igual a 0")
return
}

const targetMachine = this.machines.find(machine => machine._id === this.horometroForm.machineId)
const machineLabel = targetMachine?.name || "la maquina seleccionada"
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
expiresAt: now + confirmationWindowMs
}
this.$notify.warning(`Confirmacion requerida: volve a presionar "Actualizar horometro" en los proximos ${Math.floor(confirmationWindowMs / 1000)}s para ${machineLabel} (${this.horometroForm.value}h).`)
return
}

this.isUpdatingHorometro = true

try {
await axios.patch(
`${API_BASE_URL}/machines/${this.horometroForm.machineId}/horometro`,
{ horometro: this.horometroForm.value },
this.authConfig()
)

this.$notify.success("Horometro actualizado")
await this.loadMachines()
this.horometroForm.value = null
this.horometroConfirmState = { machineId: "", value: null, expiresAt: 0 }
} catch (error) {
if (error?.response?.status === 403) {
this.$notify.error("No tenes permiso para actualizar el horometro. Si deberias tener acceso, avisame y lo revisamos en backend.")
return
}
this.$notify.notifyApiError(error, "No se pudo actualizar horometro")
} finally {
this.isUpdatingHorometro = false
}
},

onUnfinishedReasonCategoryChange() {
if (this.form.unfinishedReasonCategory !== "Otros") {
this.form.unfinishedReason = ""
}
},

addWorker(){
if(!this.selectedAdditionalWorker) return
const worker = this.allOperarios.find(op => op._id === this.selectedAdditionalWorker)
if(worker && !this.additionalWorkersList.find(w => w._id === worker._id)){
    this.additionalWorkersList.push(worker)
}
this.selectedAdditionalWorker = ""
},

removeWorker(workerId){
this.additionalWorkersList = this.additionalWorkersList.filter(w => w._id !== workerId)
},

addMachinePart(){
if(!this.selectedAdditionalMachinePart) return
if(!this.form.machineParts.includes(this.selectedAdditionalMachinePart)){
    this.form.machineParts.push(this.selectedAdditionalMachinePart)
}
this.selectedAdditionalMachinePart = ""
},

removeMachinePart(part){
this.form.machineParts = this.form.machineParts.filter(p => p !== part)
},

removeMachinePartFromMain(part){
this.additionalMachinePartsList = this.additionalMachinePartsList.filter(p => p !== part)
},

async saveMaintenance(){

try{

if (!Number.isFinite(this.form.hoursWorked) || this.form.hoursWorked <= 0) {
this.$notify.error("Las horas trabajadas deben ser un numero mayor a 0")
return
}

if (!this.form.sector) {
this.$notify.error("Primero selecciona un sector")
return
}

if (!this.selectedMachine) {
this.$notify.error("Selecciona una maquina del sector elegido")
return
}

if (this.form.machineParts.length === 0) {
this.$notify.error("Debes seleccionar al menos una parte de maquina")
return
}

if (!this.form.clientId) {
this.$notify.error("Debes seleccionar un operario valido")
return
}

if (!String(this.form.maintenanceType || "").trim()) {
this.$notify.error("Debes seleccionar un tipo de mantenimiento")
return
}

if (!String(this.form.workDescription || "").trim()) {
this.$notify.error("Debes cargar la descripcion del trabajo realizado")
return
}

if ((this.form.jobFinished === false || this.form.machineRunning === false) && !this.form.unfinishedReasonCategory) {
this.$notify.error("Debes seleccionar un motivo por el que no se termino")
return
}

if (this.form.machineRunning !== true && this.form.machineRunning !== false) {
this.$notify.error("Debes indicar si la maquina sigue funcionando")
return
}

if (this.form.jobFinished !== true && this.form.jobFinished !== false) {
this.$notify.error("Debes indicar si el trabajo se termino")
return
}

if ((this.form.jobFinished === false || this.form.machineRunning === false)
&& this.form.unfinishedReasonCategory === "Otros"
&& !String(this.form.unfinishedReason || "").trim()) {
this.$notify.error("Debes detallar el motivo cuando seleccionas 'Otros'")
return
}

const payload = {
...this.form,
unfinishedReasonCategory: this.form.unfinishedReasonCategory,
unfinishedReason: this.form.unfinishedReasonCategory === "Otros"
? String(this.form.unfinishedReason || "").trim()
: this.form.unfinishedReasonCategory,
additionalWorkers: this.additionalWorkersList.map(w => w._id),
machinePart: this.form.machineParts
}

await axios.post(

`${API_BASE_URL}/maintenance/newmaintenance`,
payload,
this.authConfig()

)

this.$notify.success("Mantenimiento registrado")

this.resetForm()

}catch(error){

this.$notify.notifyApiError(error, "Error al guardar mantenimiento")

}

},

resetForm(){

this.form = {

sector:"",
machine:"",
machineParts:[],
clientId:this.currentUserRole === "operario" ? this.currentUserId : "",
maintenanceType:"",
workDescription:"",
spareParts:"",
hoursWorked:null,
machineRunning:null,
jobFinished:null,
unfinishedReasonCategory:"",
unfinishedReason:""

}

this.additionalWorkersList = []
this.selectedAdditionalWorker = ""
this.selectedAdditionalMachinePart = ""

},

showMachineInstructions(){

if(this.selectedMachine && this.selectedMachine.instructions){

this.showMachineDetailModal = true

}

},

openMachineDetailModal(){

if(this.selectedMachine){
this.showMachineDetailModal = true
}

},

closeMachineDetailModal(){
this.showMachineDetailModal = false

},

formatDate(value) {
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
    max-width: 560px;
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
