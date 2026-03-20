<template>

<div class="page-container">
<div class="container">

<h1>Dashboard de mantenimiento</h1>

<div class="cards">

<div class="card">

<h3>Total mantenimientos</h3>

<p>{{ stats.totalMaintenances }}</p>

</div>

<div class="card">

<h3>Máquinas registradas</h3>

<p>{{ stats.machinesRegistered }}</p>

</div>

<div class="card">

<h3>Mantenimientos pendientes</h3>

<p>{{ stats.pending }}</p>

</div>

<div class="card">

<h3>Máquinas detenidas</h3>

<p>{{ stats.stopped }}</p>

</div>

<div class="card">

<h3>Operarios atendidos</h3>

<p>{{ stats.operariosAttended }}</p>

</div>

</div>

<section class="recent-section">
<h2>Últimos mantenimientos</h2>

<div class="recent-toolbar">
<input v-model="searchOperario" type="text" placeholder="Buscar por operario" />
<input v-model="searchMachine" type="text" placeholder="Buscar por máquina" />
<select v-model="searchStatus">
<option value="">Todos los estados</option>
<option value="finished">Terminado</option>
<option value="pending">Pendiente</option>
<option value="stopped">Máquina parada</option>
</select>
<button type="button" class="clear-filters-button" @click="clearRecentFilters">
Limpiar filtros
</button>
</div>

<div v-if="filteredRecentMaintenances.length" class="recent-table-wrapper">
<table class="recent-table">
<thead>
<tr>
<th>Operario</th>
<th>Máquina</th>
<th>Parte</th>
<th>Sector</th>
<th>Estado</th>
</tr>
</thead>
<tbody>
<tr v-for="item in filteredRecentMaintenances" :key="item._id">
<td class="recent-operario">{{ formatOperarioName(item.clientId) }}</td>
<td>{{ item.machine }}</td>
<td>{{ item.machinePart }}</td>
<td>{{ item.sector }}</td>
<td>{{ formatStatus(item.status) }}</td>
</tr>
</tbody>
</table>
</div>

<p v-else class="empty-state">No hay mantenimientos cargados todavía.</p>
</section>

</div>

</div>

</template>

<script>

import axios from "axios"

// import apiClient from "../services/apiClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

export default{

data(){

return{

stats:{},

searchOperario:"",

searchMachine:"",

searchStatus:""

}
},

computed:{

filteredRecentMaintenances() {

const recentMaintenances = this.stats.recentMaintenances || []

const operarioQuery = this.searchOperario.toLowerCase().trim()
const machineQuery = this.searchMachine.toLowerCase().trim()
const statusQuery = this.searchStatus

if (!operarioQuery && !machineQuery && !statusQuery) {
return recentMaintenances
}

return recentMaintenances.filter(item =>
this.formatOperarioName(item.clientId)
.toLowerCase()
.includes(operarioQuery)
&& item.machine.toLowerCase().includes(machineQuery)
&& item.status.includes(statusQuery)
)

}

},

async mounted(){

const token = localStorage.getItem("token")

const res = await axios.get(
`${API_BASE_URL}/maintenance/dashboard`,
{
headers:{
Authorization: `Bearer ${token}`
}
}
)

this.stats = res.data

},

methods:{

formatOperarioName(operario) {

if (!operario) return "Sin operario"

return operario.company
? `${operario.name} - ${operario.company}`
: operario.name

},

formatStatus(status) {

if (status === "finished") return "Terminado"

if (status === "pending") return "Pendiente"

if (status === "stopped") return "Máquina parada"

return status || "-"

},

clearRecentFilters() {

this.searchOperario = ""
this.searchMachine = ""
this.searchStatus = ""

}

}

</script>

<style>

.page-container{
background-image: url('@/assets/fondogeneral.png');
background-size: cover;
background-position: center;
background-repeat: no-repeat;
background-attachment: fixed;
min-height: 100vh;
display: flex;
justify-content: center;
align-items: center;
padding: 1rem;
}

.container{
width: 100%;
max-width: 980px;
margin: 0 auto;
background: rgba(255, 255, 255, 0.94);
padding: 2rem;
border-radius: 12px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}

h1 {
text-align: center;
margin: 0 0 1.5rem;
color: #333;
font-size: 2rem;
letter-spacing: 0.04rem;
}

.cards{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
gap:16px;
}

.card{
background:#fff;
padding:20px 16px;
text-align:center;
border-radius:10px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
transition: 0.3s;
}

.card:hover {
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.45);
transform: translateY(-2px);
}

.card h3 {
margin: 0 0 0.75rem;
color: #4b4b4b;
}

.card p{
font-size:28px;
font-weight:bold;
margin: 0;
color: #333;
}

.recent-section {
margin-top: 1.5rem;
}

.recent-section h2 {
margin: 0 0 1rem;
text-align: center;
color: #333;
font-size: 1.5rem;
}

.recent-toolbar {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
gap: 0.75rem;
margin-bottom: 1rem;
}

.recent-toolbar input {
width: 100%;
padding: 10px 14px;
border: 1px solid #ccc;
border-radius: 2rem;
background: #fff;
}

.recent-toolbar select {
width: 100%;
padding: 10px 14px;
border: 1px solid #ccc;
border-radius: 2rem;
background: #fff;
}

.clear-filters-button {
width: 100%;
padding: 10px 14px;
border: none;
border-radius: 2rem;
background: #a6a6a6;
color: #fff;
cursor: pointer;
}

.recent-toolbar input:hover,
.recent-toolbar input:focus {
outline: none;
background: #f0f0f0;
transition: 0.2s;
box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.recent-toolbar select:hover,
.recent-toolbar select:focus {
outline: none;
background: #f0f0f0;
transition: 0.2s;
box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.clear-filters-button:hover {
background: #8f8f8f;
}

.recent-table-wrapper {
background: #fff;
border-radius: 10px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
overflow: hidden;
}

.recent-table {
width: 100%;
border-collapse: collapse;
}

.recent-table th,
.recent-table td {
padding: 12px 10px;
border-bottom: 1px solid #e8e8e8;
text-align: left;
color: #555;
}

.recent-table th {
background: #efefef;
color: #333;
}

.recent-table tbody tr:last-child td {
border-bottom: none;
}

.recent-operario {
font-weight: 700;
color: #2f2f2f;
}

.empty-state {
margin: 0;
text-align: center;
color: #666;
}

@media (max-width: 768px) {
.container {
padding: 1rem;
}

h1 {
font-size: 1.6rem;
}

.recent-table-wrapper {
overflow-x: auto;
}
}
</style>
