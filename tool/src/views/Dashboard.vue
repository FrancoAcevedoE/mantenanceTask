<template>

<div class="page-container">
<div class="container">

<h1>Dashboard</h1>

<section class="period-section">
<h2>Periodo de gráficos</h2>
<div class="period-toolbar">
<div class="period-select-group">
<select v-model="periodStartMonth" @change="onPeriodSelectorsChange">
<option v-for="month in monthOptions" :key="`start-${month.value}`" :value="month.value">
{{ month.label }}
</option>
</select>
<select v-model="periodStartYear" @change="onPeriodSelectorsChange">
<option v-for="year in yearOptions" :key="`start-year-${year}`" :value="year">
{{ year }}
</option>
</select>
</div>
<div class="period-select-group">
<select v-model="periodEndMonth" @change="onPeriodSelectorsChange">
<option v-for="month in monthOptions" :key="`end-${month.value}`" :value="month.value">
{{ month.label }}
</option>
</select>
<select v-model="periodEndYear" @change="onPeriodSelectorsChange">
<option v-for="year in yearOptions" :key="`end-year-${year}`" :value="year">
{{ year }}
</option>
</select>
</div>
<button type="button" class="period-button" @click="applyPeriodFilter">
<span class="label-full">Aplicar periodo</span>
<span class="label-compact">Aplicar</span>
</button>
<button type="button" class="period-button secondary" @click="resetPeriodFilter">
<span class="label-full">Ultimo año</span>
<span class="label-compact">12 meses</span>
</button>
</div>
<p class="period-label">
<span class="period-label-full">Mostrando métricas desde {{ formatMonthLabel(periodStart) }} hasta {{ formatMonthLabel(periodEnd) }}</span>
<span class="period-label-compact">{{ formatMonthLabel(periodStart) }} - {{ formatMonthLabel(periodEnd) }}</span>
</p>
</section>

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
<h3>Mantenimientos por operario</h3>
<canvas ref="typeChart"></canvas>
</div>
<div class="chart-card">
<h3>Mantenimientos por sector</h3>
<canvas ref="sectorChart"></canvas>
</div>
<div class="chart-card chart-card-wide">
<h3>Evolución diaria del periodo</h3>
<canvas ref="dailyChart"></canvas>
</div>
</div>
</section>

<section class="machine-status-section">
<h2>Estado actual de máquinas</h2>
<div v-if="machineStatusSummary.total" class="machine-status-summary">
<article class="machine-summary-card summary-green">
<div class="machine-summary-top">
<span class="machine-status-dot status-green"></span>
<strong>Operativas</strong>
</div>
<p>{{ machineStatusSummary.green.count }} máquinas</p>
<span>{{ machineStatusSummary.green.percentage }}%</span>
</article>
<article class="machine-summary-card summary-yellow">
<div class="machine-summary-top">
<span class="machine-status-dot status-yellow"></span>
<strong>Pendientes</strong>
</div>
<p>{{ machineStatusSummary.yellow.count }} máquinas</p>
<span>{{ machineStatusSummary.yellow.percentage }}%</span>
</article>
<article class="machine-summary-card summary-red">
<div class="machine-summary-top">
<span class="machine-status-dot status-red"></span>
<strong>Detenidas</strong>
</div>
<p>{{ machineStatusSummary.red.count }} máquinas</p>
<span>{{ machineStatusSummary.red.percentage }}%</span>
</article>
</div>
<div v-if="machineStatusOverview.length" class="machine-status-grid">
<article v-for="machine in machineStatusOverview" :key="machine.id" class="machine-status-card">
<div class="machine-status-header">
<span :class="['machine-status-dot', `status-${machine.indicator}`]"></span>
<div>
<h3>{{ machine.name }}</h3>
<p>{{ machine.sector || 'Sin sector' }}</p>
</div>
</div>
<p class="machine-status-label">{{ machine.label }}</p>
</article>
</div>
<p v-else class="empty-state">No hay máquinas registradas todavía.</p>
</section>

<section class="unfinished-reasons-section">
<h2>Tareas no terminadas registradas</h2>
<p class="unfinished-total">Total con motivo cargado: {{ unfinishedReasonSummary.totalWithReason }}</p>

<div v-if="unfinishedReasonSummary.reasons.length" class="unfinished-reasons-grid">
<article v-for="item in unfinishedReasonSummary.reasons" :key="item.reason" class="unfinished-reason-card">
<h3>{{ formatUnfinishedReason(item.reason) }}</h3>
<p>{{ item.count }} tareas</p>
<ul v-if="item.reason === 'Otros' && unfinishedReasonSummary.otherDetailsTop.length" class="unfinished-other-list">
<li v-for="detail in unfinishedReasonSummary.otherDetailsTop" :key="detail.detail">
<span>{{ detail.detail }}</span>
<strong>{{ detail.count }}</strong>
</li>
</ul>
</article>
</div>

<p v-else class="empty-state">No hay tareas con motivo de no finalización en este periodo.</p>
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

<div v-if="filteredRecentMaintenances.length" class="recent-table-wrapper" ref="recentTableWrapper" @scroll="onRecentTableScroll">
<table class="recent-table" ref="recentTable">
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

<div
v-show="showRecentBottomScrollbar && filteredRecentMaintenances.length"
class="recent-fixed-horizontal-scroll"
ref="recentBottomScroll"
@scroll="onRecentBottomScroll"
>
<div class="recent-fixed-horizontal-scroll-inner" ref="recentBottomScrollInner"></div>
</div>

<p v-if="!filteredRecentMaintenances.length" class="empty-state">No hay mantenimientos cargados todavía.</p>
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
Filler,
BarController,
LineController,
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
Filler,
BarController,
LineController,
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

periodStart:"",

periodEnd:"",

periodStartMonth: "01",

periodStartYear: "2024",

periodEndMonth: "01",

periodEndYear: "2024",

monthOptions: [
{ value: "01", label: "Enero" },
{ value: "02", label: "Febrero" },
{ value: "03", label: "Marzo" },
{ value: "04", label: "Abril" },
{ value: "05", label: "Mayo" },
{ value: "06", label: "Junio" },
{ value: "07", label: "Julio" },
{ value: "08", label: "Agosto" },
{ value: "09", label: "Septiembre" },
{ value: "10", label: "Octubre" },
{ value: "11", label: "Noviembre" },
{ value: "12", label: "Diciembre" }
],

statusChartInstance: null,

typeChartInstance: null,

sectorChartInstance: null,

dailyChartInstance: null,

syncingRecentScroll: false,

showRecentBottomScrollbar: false,

backgroundImage

}
},

computed:{

machineStatusOverview() {
const statusPriority = {
red: 0,
yellow: 1,
green: 2
}

return [...(this.stats.machineStatusOverview || [])].sort((left, right) => {
const priorityDifference = (statusPriority[left.indicator] ?? 99) - (statusPriority[right.indicator] ?? 99)

if (priorityDifference !== 0) {
return priorityDifference
}

const sectorDifference = String(left.sector || "").localeCompare(String(right.sector || ""), "es")

if (sectorDifference !== 0) {
return sectorDifference
}

return String(left.name || "").localeCompare(String(right.name || ""), "es")
})
},

machineStatusSummary() {
const total = this.machineStatusOverview.length

const buildSummary = (indicator) => {
const count = this.machineStatusOverview.filter(machine => machine.indicator === indicator).length
const percentage = total ? Math.round((count / total) * 100) : 0
return { count, percentage }
}

return {
total,
green: buildSummary("green"),
yellow: buildSummary("yellow"),
red: buildSummary("red")
}
},

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

},

unfinishedReasonSummary() {
const summary = this.stats.unfinishedReasonSummary || {}
return {
totalWithReason: Number(summary.totalWithReason) || 0,
reasons: Array.isArray(summary.reasons) ? summary.reasons : [],
otherDetailsTop: Array.isArray(summary.otherDetailsTop) ? summary.otherDetailsTop : []
}

},

yearOptions() {
const currentYear = new Date().getFullYear()
const years = []
for (let year = currentYear - 6; year <= currentYear + 2; year += 1) {
years.push(String(year))
}
return years

}

},

async mounted(){

document.body.style.backgroundImage = `url(${this.backgroundImage})`
document.body.style.backgroundSize = 'cover'
document.body.style.backgroundPosition = 'center'
document.body.style.backgroundRepeat = 'no-repeat'
document.body.style.backgroundAttachment = 'fixed'

this.setDefaultPeriod()
this.syncPeriodSelectorsFromPeriod()
await this.loadDashboard()

window.addEventListener("resize", this.updateRecentBottomScrollbar)

if (this.$route.query.reason === "role" && this.$route.query.denied) {
const deniedPath = String(this.$route.query.denied)
this.$notify.warning(`No tenes permisos para acceder a ${deniedPath}`)

this.$router.replace({
path: this.$route.path,
query: {}
})
}

},

beforeUnmount() {

document.body.style.backgroundImage = ''
document.body.style.backgroundSize = ''
document.body.style.backgroundPosition = ''
document.body.style.backgroundRepeat = ''
document.body.style.backgroundAttachment = ''

this.destroyCharts()

window.removeEventListener("resize", this.updateRecentBottomScrollbar)

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

try {

if (!this.periodStart || !this.periodEnd) {
this.setDefaultPeriod()
}

if (this.periodStart > this.periodEnd) {
this.$notify.error("El mes de inicio no puede ser mayor al mes de fin")
return
}

const res = await axios.get(
`${API_BASE_URL}/maintenance/dashboard`,
{
...this.authConfig(),
params: {
startMonth: this.periodStart,
endMonth: this.periodEnd
}
}
)

this.stats = res.data

if (res.data?.period?.startMonth) {
this.periodStart = res.data.period.startMonth
}

if (res.data?.period?.endMonth) {
this.periodEnd = res.data.period.endMonth
}

this.syncPeriodSelectorsFromPeriod()

this.$nextTick(() => {
this.renderCharts()
this.updateRecentBottomScrollbar()
})

} catch (error) {

if (error.response?.status === 401 || error.response?.status === 403) {
localStorage.removeItem("token")
localStorage.removeItem("user")

this.$notify.warning("Tu sesion expiro. Volve a iniciar sesion para cargar el dashboard.")

this.$router.push("/logUser")
return
}

this.$notify.error("No se pudo cargar el dashboard")

}

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
const operarioData = chartData.operarioBreakdown || []
const sectorData = chartData.sectorBreakdown || []
const dailyData = chartData.dailySeries || []

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
labels: operarioData.map(item => this.formatType(item.operario)),
datasets: [{
label: "Cantidad",
data: operarioData.map(item => item.count),
backgroundColor: "#1e88e5",
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

formatUnfinishedReason(reason) {

if (!reason) return "Sin motivo"

return reason.charAt(0).toUpperCase() + reason.slice(1)

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

formatMonthLabel(value) {

if (!value) return "-"

const [yearRaw, monthRaw] = value.split("-")
const year = Number(yearRaw)
const monthIndex = Number(monthRaw) - 1

if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
return value
}

return new Date(year, monthIndex, 1).toLocaleDateString("es-AR", {
month: "long",
year: "numeric"
})

},

setDefaultPeriod() {
const now = new Date()
const start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
this.periodStart = this.toMonthValue(start)
this.periodEnd = this.toMonthValue(now)
this.syncPeriodSelectorsFromPeriod()
},

syncPeriodSelectorsFromPeriod() {
const [startYear = "", startMonth = ""] = String(this.periodStart || "").split("-")
const [endYear = "", endMonth = ""] = String(this.periodEnd || "").split("-")

if (startYear && startMonth) {
this.periodStartYear = startYear
this.periodStartMonth = startMonth
}

if (endYear && endMonth) {
this.periodEndYear = endYear
this.periodEndMonth = endMonth
}
},

onPeriodSelectorsChange() {
if (!this.periodStartYear || !this.periodStartMonth || !this.periodEndYear || !this.periodEndMonth) {
return
}

this.periodStart = `${this.periodStartYear}-${this.periodStartMonth}`
this.periodEnd = `${this.periodEndYear}-${this.periodEndMonth}`
},

toMonthValue(date) {
const year = date.getFullYear()
const month = String(date.getMonth() + 1).padStart(2, "0")
return `${year}-${month}`
},

async applyPeriodFilter() {
await this.loadDashboard()
},

async resetPeriodFilter() {
this.setDefaultPeriod()
await this.loadDashboard()
},

updateRecentBottomScrollbar() {

const recentTableWrapper = this.$refs.recentTableWrapper
const recentTable = this.$refs.recentTable
const recentBottomScrollInner = this.$refs.recentBottomScrollInner

if (!recentTableWrapper || !recentTable || !recentBottomScrollInner) {
this.showRecentBottomScrollbar = false
return
}

const fullWidth = recentTable.scrollWidth
recentBottomScrollInner.style.width = `${fullWidth}px`
this.showRecentBottomScrollbar = fullWidth > recentTableWrapper.clientWidth

},

onRecentTableScroll() {

if (this.syncingRecentScroll) return

const recentTableWrapper = this.$refs.recentTableWrapper
const recentBottomScroll = this.$refs.recentBottomScroll

if (!recentTableWrapper || !recentBottomScroll) return

this.syncingRecentScroll = true
recentBottomScroll.scrollLeft = recentTableWrapper.scrollLeft
this.syncingRecentScroll = false

},

onRecentBottomScroll() {

if (this.syncingRecentScroll) return

const recentTableWrapper = this.$refs.recentTableWrapper
const recentBottomScroll = this.$refs.recentBottomScroll

if (!recentTableWrapper || !recentBottomScroll) return

this.syncingRecentScroll = true
recentTableWrapper.scrollLeft = recentBottomScroll.scrollLeft
this.syncingRecentScroll = false

},

clearRecentFilters() {

this.searchOperario = ""
this.searchMachine = ""
this.searchStatus = ""

this.$nextTick(() => {
this.updateRecentBottomScrollbar()
})

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
width: min(96vw, 1500px);
margin: 0 auto;
background: rgba(255, 255, 255, 0.94);
padding: 1.9rem;
border-radius: 12px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
}

.period-section {
margin-bottom: 1.2rem;
background: #f7fbff;
border: 1px solid #dce9f7;
border-radius: 12px;
padding: 0.9rem;
}

.period-section h2 {
margin: 0 0 0.7rem;
text-align: center;
font-size: 1.05rem;
color: #2f3d4f;
}

.period-toolbar {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
gap: 0.6rem;
align-items: center;
}

.period-toolbar > * {
min-width: 0;
}

.period-toolbar input {
width: 100%;
min-width: 0;
max-width: 100%;
box-sizing: border-box;
padding: 10px 14px;
border: 1px solid #ccc;
border-radius: 2rem;
background: #fff;
}

.period-toolbar select {
width: 100%;
min-width: 0;
max-width: 100%;
box-sizing: border-box;
padding: 10px 12px;
border: 1px solid #ccc;
border-radius: 2rem;
background: #fff;
}

.period-select-group {
display: grid;
grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
gap: 0.5rem;
}

.period-toolbar input:hover,
.period-toolbar input:focus,
.period-toolbar select:hover,
.period-toolbar select:focus {
outline: none;
background: #f0f0f0;
transition: 0.2s;
box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

.period-button {
width: 100%;
padding: 10px 12px;
border: none;
border-radius: 2rem;
background: #1e88e5;
color: #fff;
cursor: pointer;
}

.period-button:hover {
background: #1976d2;
}

.period-button.secondary {
background: #7a8a9a;
}

.period-button.secondary:hover {
background: #657483;
}

.period-button .label-compact {
display: none;
}

.period-label {
margin: 0.65rem 0 0;
text-align: center;
color: #4b4b4b;
font-size: 0.95rem;
}

.period-label-compact {
display: none;
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

.machine-status-section {
margin-top: 1.5rem;
}

.machine-status-section h2 {
margin: 0 0 1rem;
text-align: center;
color: #333;
font-size: 1.5rem;
}

.machine-status-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
gap: 0.9rem;
}

.machine-status-summary {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
gap: 0.9rem;
margin-bottom: 1rem;
}

.machine-summary-card {
border-radius: 12px;
padding: 0.9rem;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
border: 1px solid transparent;
}

.machine-summary-top {
display: flex;
align-items: center;
gap: 0.6rem;
margin-bottom: 0.55rem;
}

.machine-summary-card p {
margin: 0;
font-size: 0.95rem;
color: #364152;
}

.machine-summary-card span:last-child {
display: inline-block;
margin-top: 0.45rem;
font-size: 1.45rem;
font-weight: 700;
color: #111827;
}

.summary-green {
background: #eef8f0;
border-color: #cfe9d3;
}

.summary-yellow {
background: #fff8e8;
border-color: #f5df9e;
}

.summary-red {
background: #fdeeee;
border-color: #efc1c1;
}

.machine-status-card {
background: #fff;
border: 1px solid #e4e7eb;
border-radius: 12px;
padding: 0.95rem;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
}

.machine-status-header {
display: flex;
align-items: center;
gap: 0.75rem;
}

.machine-status-header h3 {
margin: 0;
font-size: 1rem;
color: #243447;
}

.machine-status-header p {
margin: 0.2rem 0 0;
font-size: 0.88rem;
color: #667085;
}

.machine-status-dot {
width: 16px;
height: 16px;
border-radius: 999px;
flex-shrink: 0;
box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
}

.status-green {
background: #2e7d32;
}

.status-yellow {
background: #f9a825;
}

.status-red {
background: #c62828;
}

.machine-status-label {
margin: 0.8rem 0 0;
font-weight: 700;
color: #364152;
}

.unfinished-reasons-section {
margin-top: 1.5rem;
}

.unfinished-reasons-section h2 {
margin: 0 0 0.55rem;
text-align: center;
color: #333;
font-size: 1.35rem;
}

.unfinished-total {
margin: 0 0 0.95rem;
text-align: center;
color: #4b4b4b;
font-weight: 600;
}

.unfinished-reasons-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 0.85rem;
}

.unfinished-reason-card {
background: #fff;
border: 1px solid #e4e7eb;
border-radius: 12px;
padding: 0.85rem;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
}

.unfinished-reason-card h3 {
margin: 0 0 0.45rem;
font-size: 1rem;
color: #243447;
}

.unfinished-reason-card p {
margin: 0;
font-weight: 700;
color: #364152;
}

.unfinished-other-list {
margin: 0.65rem 0 0;
padding: 0;
list-style: none;
border-top: 1px solid #e8ecf1;
padding-top: 0.55rem;
}

.unfinished-other-list li {
display: grid;
grid-template-columns: 1fr auto;
gap: 0.5rem;
align-items: center;
font-size: 0.86rem;
color: #4a5568;
margin-bottom: 0.35rem;
}

.unfinished-other-list li span {
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}

.unfinished-other-list li strong {
color: #243447;
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
overflow-x: auto;
overflow-y: hidden;
scrollbar-width: none;
}

.recent-table-wrapper::-webkit-scrollbar {
height: 0;
}

.recent-table {
width: 100%;
min-width: 820px;
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

.recent-fixed-horizontal-scroll {
position: sticky;
left: 0;
bottom: 0;
width: 100%;
height: 14px;
overflow-x: auto;
overflow-y: hidden;
background: rgba(255, 255, 255, 0.95);
border: 1px solid #d5d5d5;
border-radius: 999px;
z-index: 900;
margin-top: 0.35rem;
}

.recent-fixed-horizontal-scroll-inner {
height: 1px;
}

.recent-fixed-horizontal-scroll::-webkit-scrollbar {
height: 10px;
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

@media (max-width: 1400px) {
.container {
width: min(97vw, 1320px);
padding: 1.7rem;
}
}

@media (max-width: 1200px) {
.container {
width: min(98vw, 1120px);
padding: 1.45rem;
}
}

@media (max-width: 992px) {
.container {
width: 100%;
padding: 1.15rem;
}
}

@media (max-width: 768px) {
.container {
padding: 1rem;
}

.page-container {
align-items: flex-start;
padding: 0.6rem;
background-attachment: scroll;
}

.period-toolbar {
grid-template-columns: 1fr;
}

.period-toolbar input,
.period-toolbar select,
.period-button {
width: 100%;
max-width: 100%;
box-sizing: border-box;
}

.period-select-group {
grid-template-columns: 1fr 1fr;
}

.period-label {
font-size: 0.88rem;
line-height: 1.35;
}

h1 {
font-size: 1.6rem;
}

.recent-table-wrapper {
overflow-x: auto;
overflow-y: hidden;
scrollbar-width: thin;
}

.recent-table-wrapper::-webkit-scrollbar {
height: 4px;
}

.recent-fixed-horizontal-scroll {
display: none;
}
}

@media (max-width: 380px) {
.period-button .label-full {
display: none;
}

.period-button .label-compact {
display: inline;
}

.period-button {
padding: 10px;
font-size: 0.9rem;
}

.period-label-full {
display: none;
}

.period-label-compact {
display: inline;
font-size: 0.85rem;
}
}
</style>
