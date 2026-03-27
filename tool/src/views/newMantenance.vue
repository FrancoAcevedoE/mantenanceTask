<template>

<div class="page-container">
    <div class="box">
        <h2>Nuevo trabajo</h2>

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
<label>Parte de máquina</label>
<select v-model="form.machinePart" required :disabled="!form.machine">
    <option value="">Seleccionar parte</option>
    <option v-for="part in selectedMachineParts" :key="part" :value="part">
        {{ part }}
    </option>
</select>
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

<div v-if="isOperarioComplete && (availableAdditionalWorkers.length > 0 || additionalWorkersList.length > 0)" class="step-block">
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
</div>

<div v-if="isOperarioComplete" class="step-block">
<label>Tipo de mantenimiento</label>
<select v-model="form.maintenanceType">

<option value="">Seleccionar tipo</option>
<option value="preventivo">Preventivo</option>
<option value="mejora">Mejora</option>
<option value="puesta en marcha">Puesta en marcha</option>
<option value="arreglo">Arreglo</option>

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
machines:[],
sectors:[],
currentUserRole:"",
currentUserId:"",

form:{

sector:"",
machine:"",
machinePart:"",
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
        return this.isMachineComplete && Boolean(this.form.machinePart)
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
    filteredMachinesBySector() {
        if (!this.form.sector) return []
        return this.machines.filter(machine => machine.sector === this.form.sector)
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
this.form.machinePart = ""
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

this.machines = response.data

this.sectors = [...new Set(this.machines.map(machine => machine.sector).filter(Boolean))]

}catch(error){

    this.$notify.error("Error al cargar maquinas")

}

},

onMachineChange(){

if(!this.selectedMachine){
this.form.machinePart = ""
return
}

this.form.machinePart = ""

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

if (!String(this.form.machinePart || "").trim()) {
this.$notify.error("Debes seleccionar una parte de maquina")
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
additionalWorkers: this.additionalWorkersList.map(w => w._id)
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
machinePart:"",
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
