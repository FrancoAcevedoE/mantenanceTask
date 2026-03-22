<template>

<div class="page-container">
<div class="container">

<h1>Dashboard</h1>

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

<section class="charts-section">
<h2>Analítica de mantenimientos</h2>
<div class="charts-grid">
<div class="chart-card">
<h3>Estados</h3>
<canvas ref="statusChart"></canvas>
</div>
<div class="chart-card">
<h3>Tipos de mantenimiento</h3>
<canvas ref="typeChart"></canvas>
</div>
<div class="chart-card">
<h3>Mantenimientos por sector</h3>
<canvas ref="sectorChart"></canvas>
</div>
<div class="chart-card chart-card-wide">
<h3>Últimos 7 días</h3>
<canvas ref="dailyChart"></canvas>
</div>
</div>
</section>

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
<th>Fecha</th>
<th>Hora</th>
</tr>
</thead>
<tbody>
<tr v-for="item in filteredRecentMaintenances" :key="item._id">
<td class="recent-operario">{{ formatOperarioName(item.clientId) }}</td>
<td>{{ item.machine }}</td>
<td>{{ item.machinePart }}</td>
<td>{{ item.sector }}</td>
<td>{{ formatStatus(item.status) }}</td>
<td>{{ formatDate(item.createdAt) }}</td>
<td>{{ formatTime(item.createdAt) }}</td>
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
import {
Chart,
ArcElement,
BarElement,
LineElement,
CategoryScale,
LinearScale,
PointElement,
Tooltip,
Legend,
DoughnutController
} from "chart.js"
import backgroundImage from '@/assets/fondogeneral.png'

// import apiClient from "../services/apiClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

Chart.register(
ArcElement,
BarElement,
LineElement,
CategoryScale,
LinearScale,
PointElement,
Tooltip,
Legend,
DoughnutController
)

export default{

data(){

return{

stats:{},

searchOperario:"",

searchMachine:"",

searchStatus:"",

statusChartInstance: null,

typeChartInstance: null,

sectorChartInstance: null,

dailyChartInstance: null,

backgroundImage

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

document.body.style.backgroundImage = `url(${this.backgroundImage})`
document.body.style.backgroundSize = 'cover'
document.body.style.backgroundPosition = 'center'
document.body.style.backgroundRepeat = 'no-repeat'
document.body.style.backgroundAttachment = 'fixed'

await this.loadDashboard()

},

beforeUnmount() {

document.body.style.backgroundImage = ''
document.body.style.backgroundSize = ''
document.body.style.backgroundPosition = ''
document.body.style.backgroundRepeat = ''
document.body.style.backgroundAttachment = ''

this.destroyCharts()

},

methods:{

authConfig() {

const token = localStorage.getItem("token")

return {
headers: {
Authorization: `Bearer ${token}`
}
}

},

async loadDashboard() {

const res = await axios.get(
`${API_BASE_URL}/maintenance/dashboard`,
this.authConfig()
)

this.stats = res.data

this.$nextTick(() => {
this.renderCharts()
})

},

destroyCharts() {

if (this.statusChartInstance) {
this.statusChartInstance.destroy()
this.statusChartInstance = null
}

if (this.typeChartInstance) {
this.typeChartInstance.destroy()
this.typeChartInstance = null
}

if (this.sectorChartInstance) {
this.sectorChartInstance.destroy()
this.sectorChartInstance = null
}

if (this.dailyChartInstance) {
this.dailyChartInstance.destroy()
this.dailyChartInstance = null
}

},

renderCharts() {

this.destroyCharts()

const chartData = this.stats.charts || {}

const statusData = chartData.statusBreakdown || []
const typeData = chartData.typeBreakdown || []
const sectorData = chartData.sectorBreakdown || []
const dailyData = chartData.lastSevenDays || []

if (this.$refs.statusChart) {
this.statusChartInstance = new Chart(this.$refs.statusChart, {
type: "doughnut",
data: {
labels: statusData.map(item => this.formatStatus(item.status)),
datasets: [{
data: statusData.map(item => item.count),
backgroundColor: ["#2e7d32", "#f9a825", "#c62828", "#607d8b"]
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
position: "bottom"
}
}
}
})
}

if (this.$refs.typeChart) {
this.typeChartInstance = new Chart(this.$refs.typeChart, {
type: "bar",
data: {
labels: typeData.map(item => this.formatType(item.type)),
datasets: [{
label: "Cantidad",
data: typeData.map(item => item.count),
backgroundColor: "#1e88e5",
borderRadius: 8
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
display: false
}
}
}
})
}

if (this.$refs.sectorChart) {
this.sectorChartInstance = new Chart(this.$refs.sectorChart, {
type: "bar",
data: {
labels: sectorData.map(item => item.sector),
datasets: [{
label: "Cantidad",
data: sectorData.map(item => item.count),
backgroundColor: "#6d4c41",
borderRadius: 8
}]
},
options: {
indexAxis: "y",
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: {
display: false
}
}
}
})
}

if (this.$refs.dailyChart) {
this.dailyChartInstance = new Chart(this.$refs.dailyChart, {
type: "line",
data: {
labels: dailyData.map(item => this.formatShortDate(item.date)),
datasets: [{
label: "Mantenimientos",
data: dailyData.map(item => item.count),
borderColor: "#00a878",
backgroundColor: "rgba(0, 168, 120, 0.2)",
fill: true,
tension: 0.35,
pointRadius: 4
}]
},
options: {
responsive: true,
maintainAspectRatio: false
}
})
}

},

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

formatType(type) {

if (!type) return "Sin tipo"

return type.charAt(0).toUpperCase() + type.slice(1)

},

formatDate(value) {

if (!value) return "-"

return new Date(value).toLocaleDateString("es-AR")

},

formatTime(value) {

if (!value) return "-"

return new Date(value).toLocaleTimeString("es-AR", {
hour: "2-digit",
minute: "2-digit"
})

},

formatShortDate(value) {

if (!value) return "-"

return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR", {
day: "2-digit",
month: "2-digit"
})

},

clearRecentFilters() {

this.searchOperario = ""
this.searchMachine = ""
this.searchStatus = ""

}

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

.charts-section {
margin-top: 1.5rem;
}

.charts-section h2 {
margin: 0 0 1rem;
text-align: center;
color: #333;
font-size: 1.5rem;
}

.charts-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
gap: 1rem;
}

.chart-card {
background: linear-gradient(135deg, #ffffff, #f4f9ff);
border: 1px solid #e7edf7;
border-radius: 12px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
padding: 0.85rem;
height: 300px;
}

.chart-card h3 {
margin: 0 0 0.65rem;
text-align: center;
color: #2f3d4f;
font-size: 1.05rem;
}

.chart-card canvas {
width: 100%;
height: calc(100% - 32px) !important;
}

.chart-card-wide {
grid-column: 1 / -1;
height: 320px;
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
