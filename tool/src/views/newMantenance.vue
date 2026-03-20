<template>

<div class="page-container">
    <div class="box">
        <h2>Nuevo Mantenimiento</h2>

        <form @submit.prevent="saveMaintenance">

<label>Sector</label>
<input v-model="form.sector" required>

<label>Máquina</label>
<input v-model="form.machine" required>

<label>Parte de máquina</label>
<input v-model="form.machinePart" required>

<label>Tipo de mantenimiento</label>
<select v-model="form.maintenanceType">

<option value="preventivo">Preventivo</option>
<option value="MEJORA">MEJORA</option>
<option value="puesta en marcha">Puesta en marcha</option>
<option value="arreglo">Arreglo</option>

</select>

<label>Descripción del trabajo realizado</label>
<textarea v-model="form.workDescription"></textarea>

<label>Repuestos utilizados</label>
<textarea v-model="form.spareParts"></textarea>

<label>Horas trabajadas</label>
<input type="number" v-model="form.hoursWorked">

<label>¿La máquina sigue funcionando?</label>

<select v-model="form.machineRunning">

<option :value="true">SI</option>
<option :value="false">NO</option>

</select>

<label>¿El trabajo se terminó?</label>

<select v-model="form.jobFinished">

<option :value="true">SI</option>
<option :value="false">NO</option>

</select>

<div v-if="form.jobFinished === false">

<label>Motivo por el que no se terminó</label>
<textarea v-model="form.unfinishedReason"></textarea>

</div>

<div class="button-group">
<button type="submit">

Guardar mantenimiento

</button>

<button type="button" class="secondary-button" @click="resetForm">

Cancelar

</button>
</div>

</form>
    </div>
</div>

</template>

<script>

import backgroundImage from '@/assets/fondogeneral.png'

export default{

data(){

return{

form:{

sector:"",
machine:"",
machinePart:"",
maintenanceType:"MEJORA",
workDescription:"",
spareParts:"",
hoursWorked:0,
machineRunning:true,
jobFinished:true,
unfinishedReason:""

},
backgroundImage: backgroundImage

}

},

mounted() {
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

methods:{

async saveMaintenance(){

try{

await apiClient.post(

"/maintenance/newmaintenance",
this.form

)

alert("Mantenimiento registrado")

this.resetForm()

}catch(error){

alert("Error al guardar mantenimiento")

}

},

resetForm(){

this.form = {

sector:"",
machine:"",
machinePart:"",
maintenanceType:"MEJORA",
workDescription:"",
spareParts:"",
hoursWorked:0,
machineRunning:true,
jobFinished:true,
unfinishedReason:""

}

}

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

.button-group button {
    margin-top: 0;
}

.secondary-button {
    background: #8d8d8d;
}

button:hover {
    background: #8f8f8f;
}

.secondary-button:hover {
    background: #767676;
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
