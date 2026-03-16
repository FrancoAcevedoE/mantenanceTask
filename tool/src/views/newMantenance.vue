```html
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

<button type="submit">

Guardar mantenimiento

</button>

</form>
    </div>
</div>

</template>

<script>

import backgroundImage from '@/assets/fondogeneral.jpg'

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
/* simple minimalist palette for form */
.box {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: #fff;
    border: 1px solid #d1d1d1;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
    color: #000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
        Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

h2 {
    margin-top: 0;
    font-weight: 600;
    color: #111;
}

input[type="text"],
input[type="number"],
textarea,
select {
    display: block;
    width: 100%;
    margin: 0.5rem 0;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fafafa;
    color: #000;
    font-size: 1rem;
}

textarea {
    resize: vertical;
}

button {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    background: #000;
    color: #fff;
    cursor: pointer;
    font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .box {
    margin: 1rem auto;
    padding: 1rem;
    max-width: none;
  }
}
</style>

<style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
```
