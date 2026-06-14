<template>

  <div class="page-container">
    <div class="container">

      <h1>Dashboard</h1>

      <!-- Mostrar mensaje para vendedores -->
      <div v-if="currentUser?.role === 'vendedor'" class="seller-message">
        <p>Como vendedor, tienes acceso a la vista de cotizaciones.</p>
        <button @click="$router.push('/seller')">Ir a Cotizaciones</button>
      </div>

      <!-- Contenido del dashboard solo para admin, supervisor y operario -->
      <div v-else>

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
            <span class="period-label-full">Mostrando métricas desde {{ formatMonthLabel(periodStart) }} hasta {{
              formatMonthLabel(periodEnd) }}</span>
            <span class="period-label-compact">{{ formatMonthLabel(periodStart) }} - {{ formatMonthLabel(periodEnd)
              }}</span>
          </p>
        </section>

        <div class="cards">

          <div class="card">

            <h3>TOTAL DE TRABAJOS</h3>

            <p>{{ stats.totalMaintenances }}</p>

          </div>

          <div class="card">

            <h3>EQUIPOS REGISTRADOS</h3>

            <p>{{ stats.machinesRegistered }}</p>

          </div>

          <div class="card">

            <h3>TRABAJOS PENDIENTES</h3>

            <p>{{ stats.pending }}</p>

          </div>

          <div class="card">

            <h3>EQUIPOS DETENIDOS</h3>

            <p>{{ stats.stopped }}</p>

          </div>

          <div class="card">

            <h3>TOTAL DE TRABAJADORES</h3>

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
            <article v-for="machine in machineStatusOverview" :key="machine.id" class="machine-status-card"
              :class="`state-${machine.indicator}`">
              <div class="machine-tooltip">
                {{ getMachineTooltip(machine) }}
              </div>
              <div class="machine-status-header">


                <div class="machine-status-title">
                  <h3>{{ machine.name }}</h3>

                  <span class="machine-status-state">
                    {{ machine.label }}
                  </span>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="empty-state">No hay máquinas registradas todavía.</p>
        </section>

        <section class="unfinished-reasons-section">
          <h2>Tareas no terminadas registradas</h2>
          <p class="unfinished-total">Total con motivo cargado: {{ unfinishedReasonSummary.totalWithReason }}</p>

          <div v-if="unfinishedReasonSummary.reasons.length" class="unfinished-reasons-grid">
            <article v-for="reason in unfinishedReasonSummary.reasons" :key="reason.reason"
              class="unfinished-reason-card">
              <div class="machine-status-header">
                <div>
                  <h3>{{ formatUnfinishedReason(reason.reason) }}</h3>
                  <p>{{ reason.count }} casos</p>
                </div>
              </div>

              <p class="machine-status-label">
                {{ reason.reason }}
              </p>
            </article>
          </div>

          <p v-else class="empty-state">No hay tareas con motivo de no finalización en este periodo.</p>
        </section>

        <section class="recent-section">
          <h2>ÚLTIMOS TRABAJOS</h2>

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

          <div v-if="filteredRecentMaintenances.length" class="recent-table-wrapper" ref="recentTableWrapper"
            @scroll="onRecentTableScroll">
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
                  <td>{{ Array.isArray(item.machinePart) ? item.machinePart.join(', ') : item.machinePart }}</td>
                  <td>{{ item.sector }}</td>
                  <td>{{ formatStatus(item.status) }}</td>
                  <td>{{ formatDate(item.createdAt) }}</td>
                  <td>{{ formatTime(item.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-show="showRecentBottomScrollbar && filteredRecentMaintenances.length"
            class="recent-fixed-horizontal-scroll" ref="recentBottomScroll" @scroll="onRecentBottomScroll">
            <div class="recent-fixed-horizontal-scroll-inner" ref="recentBottomScrollInner"></div>
          </div>

          <p v-if="!filteredRecentMaintenances.length" class="empty-state">No hay mantenimientos cargados todavía.</p>
        </section>

      </div>

    </div>
  </div>

</template>

<script>

import axios from "axios"
import { API_BASE_URL } from '@/utils/api'
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

// import apiClient from "../services/apiClient"

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

export default {
  data() {

    return {

      stats: {
        totalMaintenances: 0,
        machinesRegistered: 0,
        pending: 0,
        stopped: 0,
        operariosAttended: 0,
        recentMaintenances: [],
        machineStatusOverview: [],
        unfinishedReasonSummary: { reasons: [], otherDetailsTop: [] }
      },

      searchOperario: "",

      searchMachine: "",

      searchStatus: "",

      periodStart: "",

      periodEnd: "",

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

      showRecentBottomScrollbar: false
    }
  },

  computed: {

    machineStatusOverview() {
      return [...(this.stats.machineStatusOverview || [])].sort((left, right) => {
        const nameDifference = String(left.name || "").localeCompare(String(right.name || ""), "es", { sensitivity: "base" })
        if (nameDifference !== 0) {
          return nameDifference
        }
        return String(left.sector || "").localeCompare(String(right.sector || ""), "es", { sensitivity: "base" })
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

      const filtered = recentMaintenances.filter(item =>
        this.formatOperarioName(item.clientId)
          .toLowerCase()
          .includes(operarioQuery)
        && String(item.machine || "").toLowerCase().includes(machineQuery)
        && item.status.includes(statusQuery)
      )

      return filtered.slice().sort((a, b) => {
        const machineComparison = String(a.machine || "").localeCompare(String(b.machine || ""), "es", { sensitivity: "base" })
        if (machineComparison !== 0) return machineComparison
        return new Date(b.createdAt) - new Date(a.createdAt)
      })

    },

    unfinishedReasonSummary() {
      const summary = this.stats.unfinishedReasonSummary || {}
      return {
        totalWithReason: Number(summary.totalWithReason) || 0,
        reasons: Array.isArray(summary.reasons)
          ? summary.reasons.slice().sort((a, b) => String(a.reason || "").localeCompare(String(b.reason || ""), "es", { sensitivity: "base" }))
          : [],
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

    },

    currentUser() {
      return JSON.parse(localStorage.getItem('user') || '{}')
    }

  },

  async mounted() {

    document.body.style.background = 'rgb(103, 111, 62)'

    this.setDefaultPeriod()
    this.syncPeriodSelectorsFromPeriod()

    // Solo cargar dashboard para admin, supervisor y operario
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (['admin', 'supervisor', 'operario'].includes(user.role)) {
      await this.loadDashboard()
    }
    // Aplicar filtro automatico desde notificaciones
    const filter = this.$route.query.filter

    if (filter === "pending") {
      this.searchStatus = "pending"

      this.$nextTick(() => {
        document.querySelector(".recent-section")
          ?.scrollIntoView({ behavior: "smooth" })
      })
    }

    if (filter === "stopped") {
      this.searchStatus = "stopped"

      this.$nextTick(() => {
        document.querySelector(".recent-section")
          ?.scrollIntoView({ behavior: "smooth" })
      })
    }

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

    document.body.style.background = ''

    this.destroyCharts()

    window.removeEventListener("resize", this.updateRecentBottomScrollbar)

  },

  methods: {

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
          setTimeout(() => {
            this.renderCharts()
            this.updateRecentBottomScrollbar()
          }, 200)
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
    getMachineTooltip(machine) {

      if (machine.indicator === "green") {
        return "Operativa"
      }

      if (machine.unfinishedReason) {
        return machine.unfinishedReason
      }

      return machine.label
    },
    destroyCharts() {

      if (this.statusChartInstance) {
        this.statusChartInstance.stop()
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

      const sortedOperarioData = [...operarioData].sort((a, b) => String(a.operario || "").localeCompare(String(b.operario || ""), "es", { sensitivity: "base" }))
      const sortedSectorData = [...sectorData].sort((a, b) => String(a.sector || "").localeCompare(String(b.sector || ""), "es", { sensitivity: "base" }))

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
              },
              tooltip: {
                enabled: true,
                callbacks: {
                  label: function (context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0)
                    const value = context.raw
                    const percentage = ((value / total) * 100).toFixed(1)

                    return `${context.label}: ${value} (${percentage}%)`
                  }
                }
              }
            }
          }
        })
      }

      if (this.$refs.typeChart) {
        this.typeChartInstance = new Chart(this.$refs.typeChart, {
          type: "bar",
          data: {
            labels: sortedOperarioData.map(item => this.formatType(item.operario)),
            datasets: [{
              label: "Cantidad",
              data: sortedOperarioData.map(item => item.count),
              backgroundColor: "#1e88e5",
              borderRadius: 8
            }]
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `Cantidad: ${context.raw}`
                  }
                }
              }
            }
          }
        }
        )
      }

      if (this.$refs.sectorChart) {
        this.sectorChartInstance = new Chart(this.$refs.sectorChart, {
          type: "bar",
          data: {
            labels: sortedSectorData.map(item => item.sector),
            datasets: [{
              label: "Cantidad",
              data: sortedSectorData.map(item => item.count),
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
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `Sector: ${context.label} (${context.raw})`
                  }
                }
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
            maintainAspectRatio: false,
            resizeDelay: 100
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

      const end = new Date(now.getFullYear(), now.getMonth(), 1)
      const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)

      this.periodStart = this.toMonthValue(start)
      this.periodEnd = this.toMonthValue(end)

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

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.seller-message {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.seller-message p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #495057;
}

.seller-message button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.seller-message button:hover {
  background: #0056b3;
}

/* LAYOUT GENERAL */
.page-container {
  background: rgb(103, 111, 62);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.container {
  width: min(1080px, 100%);
  max-width: unset;
  margin: 0 auto;
  overflow-x: hidden;
  background: rgba(255, 255, 255, 0.94);
  padding: 1.9rem;
  border-radius: 12px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, .06),
    0 1px 3px rgba(0, 0, 0, .04);
}

/* PERIOD */
.period-section {
  margin-bottom: 1.2rem;
  background: #f7fbff;
  border: 1px solid #dce9f7;
  border-radius: 12px;
  padding: 0.9rem;
}

.period-section h2 {
  text-align: center;
  font-size: 1.05rem;
  color: #2f3d4f;
  margin-bottom: 0.7rem;
}

.period-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem;
  align-items: center;
}

.period-select-group {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 0.5rem;
}

.period-toolbar input,
.period-toolbar select,
.recent-toolbar input,
.recent-toolbar select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ccc;
  border-radius: 2rem;
  background: #fff;
  box-sizing: border-box;
}

.period-toolbar input:hover,
.period-toolbar input:focus,
.period-toolbar select:hover,
.period-toolbar select:focus,
.recent-toolbar input:hover,
.recent-toolbar input:focus,
.recent-toolbar select:hover,
.recent-toolbar select:focus {
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
  margin-top: 0.65rem;
  text-align: center;
  color: #4b4b4b;
  font-size: 0.95rem;
}

.period-label-compact {
  display: none;
}

/* TITULOS */
h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 2rem;
}

/* CARDS */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  padding: 20px 16px;
  text-align: center;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, .05);
  transition: 0.3s;
}

.card:hover {
  box-shadow: 0 8px 20px rgba(15, 23, 42, .08);
  transform: translateY(-2px);
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e5e7eb;

  min-height: 350px;
  height: 350px;

  position: relative;
  width: 100%;

  overflow: hidden;
}

.chart-card canvas {
  width: 100% !important;
  height: calc(100% - 50px) !important;
}

.chart-card canvas:hover {
  cursor: default !important;
}

.chart-card-wide {
  grid-column: 1 / -1;
  height: 500px;
  min-height: 500px;
}

/* CHARTS */
.charts-section {
  margin-top: 1.5rem;
}

.charts-section h2 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  width: 100%;
}


/* MACHINE STATUS */
.machine-status-section {
  margin-top: 1.5rem;
}

.machine-status-grid {
  gap: 0.9rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
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
}

.machine-summary-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.machine-status-title h3 {
  margin: 0;
  font-size: .95rem;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* CARD BASE (UNIFICADO) */
.machine-status-card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 0.8rem;
  border: 1px solid #e5e7eb;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.machine-status-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, .12);
}

/* TOOLTIP */
.machine-tooltip {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.9);
  color: white;
  padding: 6px 10px;
  font-size: 0.75rem;
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: 0.2s;
  white-space: nowrap;
}

.machine-status-card:hover .machine-tooltip {
  opacity: 1;
  top: -18px;
}

/* STATES */
.state-green {
  border-left: 4px solid #22c55e;
  box-shadow: 0 0 8px rgba(46, 125, 50, 0.15);
}

.state-yellow {
  border-left: 4px solid #f59e0b;
  box-shadow: 0 0 8px rgba(249, 168, 37, 0.15);
}

.state-red {
  border-left: 4px solid #ef4444;
  box-shadow: 0 0 8px rgba(198, 40, 40, 0.15);
}

.state-green:hover {
  box-shadow: 0 0 22px rgba(46, 125, 50, 0.55);
}

.state-yellow:hover {
  box-shadow: 0 0 22px rgba(249, 168, 37, 0.55);
}

.state-red:hover {
  box-shadow: 0 0 22px rgba(198, 40, 40, 0.55);
}

/* UNFINISHED */
.unfinished-reasons-section {
  margin-top: 1.5rem;
}

/* RECENT */
.recent-section {
  margin-top: 1.5rem;
}

.recent-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
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

.clear-filters-button:hover {
  background: #8f8f8f;
}

/* TABLE */
.recent-table-wrapper {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
  overflow-x: auto;
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
}

.recent-table th {
  background: #efefef;
}

/* SCROLL FIX */
.recent-fixed-horizontal-scroll {
  position: sticky;
  bottom: 0;
  height: 14px;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d5d5d5;
  border-radius: 999px;
}

/* STATES TEXT */
.status-green {
  background: #2e7d32;
}

.status-yellow {
  background: #f9a825;
}

.status-red {
  background: #c62828;
}

/* EMPTY */
.empty-state {
  text-align: center;
  color: #666;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .period-toolbar {
    grid-template-columns: 1fr;
  }

  .period-select-group {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card-wide {
    grid-column: span 1;
    height: 320px;
    min-height: 320px;
  }

  .machine-status-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }

  .machine-status-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-fixed-horizontal-scroll {
    display: none;
  }

  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 380px) {
  .period-button .label-full {
    display: none;
  }

  .period-button .label-compact {
    display: inline;
  }

  .period-label-full {
    display: none;
  }

  .period-label-compact {
    display: inline;
  }
}
</style>