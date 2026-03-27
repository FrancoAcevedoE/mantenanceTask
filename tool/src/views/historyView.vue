<template>
    <div class="page-container">
    <div class="container">
        <div class="topbar">
            <h1>Historial</h1>
            <button @click="$router.push('/dashboard')">
                Ir al Dashboard
            </button>
        </div>

        <div class="filters">
            <input v-model="searchMachine" placeholder="Buscar por máquina" />
            <select v-model="filterSector">
                <option value="">Todos los sectores</option>
                <option v-for="sector in sectors" :key="sector" :value="sector">
                    {{ sector }}
                </option>
            </select>

            <select v-model="filterOperario">
                <option value="">Todos los operarios</option>
                <option v-for="operario in operarios" :key="operario.value" :value="operario.value">
                    {{ operario.label }}
                </option>
            </select>

            <input type="date" v-model="filterDate" />

            <button
                type="button"
                class="compact-toggle"
                @click="toggleCompactMode"
            >
                {{ compactMode ? "Vista normal" : "Vista compacta" }}
            </button>
        </div>

        <div class="table-wrapper" :class="{ 'compact-mode': compactMode }" ref="tableWrapper" @scroll="onTableScroll">
        <table class="history-table" ref="historyTable">
            <colgroup>
                <col class="col-operario" />
                <col class="col-fecha" />
                <col class="col-hora" />
                <col class="col-sector" />
                <col class="col-maquina" />
                <col class="col-parte" />
                <col class="col-descripcion" />
                <col class="col-horas" />
                <col class="col-estado" />
                <col class="col-motivo" />
                <col class="col-accion" />
            </colgroup>
            <thead>
                <tr>
                    <th>Operario</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Sector</th>
                    <th>Máquina</th>
                    <th>Parte</th>
                    <th>Descripción</th>
                    <th>Horas</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                    <th>Acción</th>
                </tr>
            </thead>

            <tbody>
               <tr v-for="item in filteredHistory" :key="item._id" :class="getRowClass(item.status)">
                    <td>{{ formatOperarioName(item.clientId) }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ formatTime(item.createdAt) }}</td>
                    <td>{{ item.sector }}</td>
                    <td>{{ item.machine }}</td>
                    <td>{{ item.machinePart }}</td>
                    <td class="description-cell">
                        <span class="description-preview">{{ item.workDescription || '-' }}</span>
                    </td>
                    <td>{{ item.hoursWorked }}</td>
                    <td>
                        <span v-if="item.status === 'finished'">
                            Terminado
                        </span>
                        <span v-if="item.status === 'pending'">
                            Pendiente
                        </span>
                        <span v-if="item.status === 'stopped'">
                            Máquina parada
                        </span>
                    </td>

                    <td>
                        {{ item.unfinishedReason || "-" }}
                    </td>

                    <td class="action-cell">
                        <div class="action-buttons">
                            <button @click="openDetailModal(item)" style="background: #1e88e5;">
                                Detalles
                            </button>
                            <button v-if="item.status !== 'finished'" @click="openFinishModal(item)" style="background: #2e7d32;">
                                Terminar
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
        </div>

        <div
            v-show="showBottomScrollbar"
            class="fixed-horizontal-scroll"
            ref="bottomScroll"
            @scroll="onBottomScroll"
        >
            <div class="fixed-horizontal-scroll-inner" ref="bottomScrollInner"></div>
        </div>

        <div v-if="showDetailModal" class="modal">
            <div class="modal-box modal-box-detail">
                <h3>Detalles del mantenimiento</h3>
                <div style="text-align: left; line-height: 1.8;">
                    <p><strong>Operario:</strong> {{ formatOperarioName(selectedDetail?.clientId) }}</p>
                    <p v-if="selectedDetail?.additionalWorkers?.length">
                        <strong>Otros operarios:</strong> {{ selectedDetail.additionalWorkers.map(w => formatOperarioName(w)).join(', ') }}
                    </p>
                    <p><strong>Sector:</strong> {{ selectedDetail?.sector }}</p>
                    <p><strong>Máquina:</strong> {{ selectedDetail?.machine }}</p>
                    <p><strong>Parte:</strong> {{ selectedDetail?.machinePart }}</p>
                    <p><strong>Tipo de mantenimiento:</strong> {{ selectedDetail?.maintenanceType }}</p>
                    <p><strong>Horas trabajadas:</strong> {{ selectedDetail?.hoursWorked }}</p>
                    <p><strong>Estado:</strong> {{ formatStatus(selectedDetail?.status) }}</p>
                    <p><strong>Fecha:</strong> {{ formatDate(selectedDetail?.createdAt) }}</p>
                    <p><strong>Hora:</strong> {{ formatTime(selectedDetail?.createdAt) }}</p>
                    <p><strong>Descripción del trabajo:</strong></p>
                    <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">{{ selectedDetail?.workDescription || "-" }}</p>
                    <p><strong>Repuestos utilizados:</strong></p>
                    <p style="background: #f5f5f5; padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">{{ selectedDetail?.spareParts || "-" }}</p>
                </div>
                <button @click="closeDetailModal" style="margin-top: 1rem;">
                    Cerrar
                </button>
            </div>
        </div>

        <div v-if="showFinishModal" class="modal">
            <div class="modal-box">
                <h3>Finalizar mantenimiento</h3>
                <label>Horas adicionales</label>
                <input type="number" min="0.5" step="0.5" v-model.number="extraHours" />
                <button @click="finishMaintenance">
                    Guardar
                </button>
                <button @click="closeFinishModal">
                    Cancelar
                </button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>

import axios from "axios"

import backgroundImage from '@/assets/fondogeneral.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

export default {

    data() {

        return {

            history: [],

            searchMachine: "",

            filterSector: "",

            filterOperario: "",

            filterDate: "",

            sectors: [],

            operarios: [],

            showDetailModal: false,

            showFinishModal: false,

            selectedDetail: null,

            selectedId: null,

            extraHours: 0,

            syncingHorizontalScroll: false,

            showBottomScrollbar: false,

            compactMode: false,

            backgroundImage

        }

    },

    async mounted() {
        document.body.style.backgroundImage = `url(${this.backgroundImage})`
        document.body.style.backgroundSize = 'cover'
        document.body.style.backgroundPosition = 'center'
        document.body.style.backgroundRepeat = 'no-repeat'
        document.body.style.backgroundAttachment = 'fixed'

        await this.loadHistory()

        const savedCompactMode = localStorage.getItem("historyCompactMode")
        if (savedCompactMode !== null) {
            this.compactMode = savedCompactMode === "true"
        } else {
            this.compactMode = window.innerWidth <= 1366
        }

        this.$nextTick(() => {
            this.updateBottomScrollbar()
        })

        window.addEventListener("resize", this.updateBottomScrollbar)

    },

    beforeUnmount() {

        document.body.style.backgroundImage = ''
        document.body.style.backgroundSize = ''
        document.body.style.backgroundPosition = ''
        document.body.style.backgroundRepeat = ''
        document.body.style.backgroundAttachment = ''

        window.removeEventListener("resize", this.updateBottomScrollbar)

    },

    computed: {

        filteredHistory() {

            return this.history.filter(item => {

                const machineMatch = item.machine
                    .toLowerCase()
                    .includes(this.searchMachine.toLowerCase())

                const sectorMatch = this.filterSector
                    ? item.sector === this.filterSector
                    : true

                const operarioMatch = this.filterOperario
                    ? item.clientId?._id === this.filterOperario ||
                      (item.additionalWorkers || []).some(w => w?._id === this.filterOperario)
                    : true

                const dateMatch = this.filterDate
                    ? item.createdAt
                        .slice(0, 10) === this.filterDate
                    : true

                return machineMatch && sectorMatch && operarioMatch && dateMatch

            })

        }

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

        async loadHistory() {

            const res = await axios.get(
                `${API_BASE_URL}/maintenance/history`,
                this.authConfig()
            )

            this.history = res.data

            this.sectors = [
                ...new Set(
                    res.data.map(item => item.sector)
                )
            ]

            this.operarios = res.data
                .reduce((accumulator, item) => {

                    if (item.clientId?._id && !accumulator.some(operario => operario.value === item.clientId._id)) {
                        accumulator.push({
                            value: item.clientId._id,
                            label: this.formatOperarioName(item.clientId)
                        })
                    }

                    ;(item.additionalWorkers || []).forEach(worker => {
                        if (worker?._id && !accumulator.some(op => op.value === worker._id)) {
                            accumulator.push({
                                value: worker._id,
                                label: this.formatOperarioName(worker)
                            })
                        }
                    })

                    return accumulator

                }, [])

            this.$nextTick(() => {
                this.updateBottomScrollbar()
            })

        },

        updateBottomScrollbar() {
            const tableWrapper = this.$refs.tableWrapper
            const historyTable = this.$refs.historyTable
            const bottomScrollInner = this.$refs.bottomScrollInner

            if (!tableWrapper || !historyTable || !bottomScrollInner) {
                this.showBottomScrollbar = false
                return
            }

            const fullWidth = historyTable.scrollWidth
            bottomScrollInner.style.width = `${fullWidth}px`
            this.showBottomScrollbar = fullWidth > tableWrapper.clientWidth
        },

        onTableScroll() {
            if (this.syncingHorizontalScroll) return

            const tableWrapper = this.$refs.tableWrapper
            const bottomScroll = this.$refs.bottomScroll

            if (!tableWrapper || !bottomScroll) return

            this.syncingHorizontalScroll = true
            bottomScroll.scrollLeft = tableWrapper.scrollLeft
            this.syncingHorizontalScroll = false
        },

        onBottomScroll() {
            if (this.syncingHorizontalScroll) return

            const tableWrapper = this.$refs.tableWrapper
            const bottomScroll = this.$refs.bottomScroll

            if (!tableWrapper || !bottomScroll) return

            this.syncingHorizontalScroll = true
            tableWrapper.scrollLeft = bottomScroll.scrollLeft
            this.syncingHorizontalScroll = false
        },

        toggleCompactMode() {
            this.compactMode = !this.compactMode
            localStorage.setItem("historyCompactMode", String(this.compactMode))

            this.$nextTick(() => {
                this.updateBottomScrollbar()
            })
        },

        getRowClass(status) {

            if (status === "pending") return "yellow"

            if (status === "stopped") return "red"

            return "white"

        },

        formatOperarioName(operario) {

            if (!operario) return "-"

            return operario.company
                ? `${operario.name} - ${operario.company}`
                : operario.name

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

        formatStatus(status) {
            if (status === "finished") return "Terminado"
            if (status === "pending") return "Pendiente"
            if (status === "stopped") return "Máquina parada"
            return status || "-"
        },

        openDetailModal(item) {
            this.selectedDetail = item
            this.showDetailModal = true
        },

        closeDetailModal() {
            this.showDetailModal = false
            this.selectedDetail = null
        },

        openFinishModal(item) {
            this.selectedId = item._id
            this.showFinishModal = true
        },

        closeFinishModal() {
            this.showFinishModal = false
            this.extraHours = 0
            this.selectedId = null
        },

        async finishMaintenance() {

            if (!Number.isFinite(this.extraHours) || this.extraHours <= 0) {
                this.$toast.error("Las horas adicionales deben ser un numero mayor a 0")
                return
            }

            await axios.put(

                `${API_BASE_URL}/maintenance/finish/${this.selectedId}`,

                {
                    hoursWorked: this.extraHours
                },
                this.authConfig()

            )

            this.closeFinishModal()

            this.loadHistory()

        }

    }

}

</script>

<style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 1rem;
}

.container {
    width: min(96vw, 1650px);
    background: rgba(255, 255, 255, 0.94);
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
    padding: 1.9rem;
    margin: 0;
}

.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

h1 {
    margin: 0;
    color: #333;
    font-size: 2rem;
    letter-spacing: 0.04rem;
}

.filters {
    margin: 0 0 1rem;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.compact-toggle {
    background: #4b5563;
    white-space: nowrap;
}

.compact-toggle:hover {
    background: #374151;
}

.filters input,
.filters select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 2rem;
    min-width: 200px;
    background: #fff;
}

.filters input:hover,
.filters input:focus,
.filters select:hover,
.filters select:focus {
    outline: none;
    background: #f0f0f0;
    transition: 0.2s;
    box-shadow: 0 1px 5px rgba(189, 189, 189, 0.31);
}

table {
    width: 100%;
    border-collapse: collapse;
}

.history-table {
    table-layout: fixed;
    min-width: 1610px;
}

.history-table col.col-operario { width: 220px; }
.history-table col.col-fecha { width: 110px; }
.history-table col.col-hora { width: 95px; }
.history-table col.col-sector { width: 140px; }
.history-table col.col-maquina { width: 170px; }
.history-table col.col-parte { width: 170px; }
.history-table col.col-descripcion { width: 280px; }
.history-table col.col-horas { width: 90px; }
.history-table col.col-estado { width: 150px; }
.history-table col.col-motivo { width: 230px; }
.history-table col.col-accion { width: 220px; }

.compact-mode .history-table {
    min-width: 1380px;
}

.compact-mode .history-table col.col-operario { width: 190px; }
.compact-mode .history-table col.col-fecha { width: 95px; }
.compact-mode .history-table col.col-hora { width: 80px; }
.compact-mode .history-table col.col-sector { width: 120px; }
.compact-mode .history-table col.col-maquina { width: 140px; }
.compact-mode .history-table col.col-parte { width: 140px; }
.compact-mode .history-table col.col-descripcion { width: 220px; }
.compact-mode .history-table col.col-horas { width: 75px; }
.compact-mode .history-table col.col-estado { width: 130px; }
.compact-mode .history-table col.col-motivo { width: 170px; }
.compact-mode .history-table col.col-accion { width: 190px; }

.table-wrapper {
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
}

.table-wrapper {
    scrollbar-width: none;
}

.table-wrapper::-webkit-scrollbar {
    height: 0;
}

th,
td {
    padding: 12px 10px;
    border-bottom: 1px solid #e8e8e8;
    text-align: left;
    color: #555;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
}

.compact-mode th,
.compact-mode td {
    padding: 8px 8px;
    font-size: 0.88rem;
}

th {
    background: #efefef;
    color: #333;
}

.description-cell {
    width: 280px;
    min-width: 280px;
    max-width: 280px;
}

.compact-mode .description-cell {
    width: 220px;
    min-width: 220px;
    max-width: 220px;
}

.description-preview {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fixed-horizontal-scroll {
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

.fixed-horizontal-scroll::-webkit-scrollbar {
    height: 10px;
}

.fixed-horizontal-scroll-inner {
    height: 1px;
}

.action-cell {
    text-align: center;
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: nowrap;
    justify-content: center;
}

.action-buttons button {
    white-space: nowrap;
}

.compact-mode .action-buttons {
    gap: 0.35rem;
}

.compact-mode .action-buttons button {
    padding: 8px 10px;
    font-size: 0.82rem;
}

.yellow {
    background: #fff3cd;
}

.red {
    background: #f8d7da;
}

.white {
    background: white;
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

.modal-box input {
    width: 100%;
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 2rem;
}

button {
    border-radius: 2rem;
    padding: 10px 14px;
    background: #a6a6a6;
    color: #fff;
    border: none;
    cursor: pointer;
}

button:hover {
    background: #8f8f8f;
}

@media (max-width: 1400px) {
    .container {
        width: min(97vw, 1400px);
        padding: 1.7rem;
    }
}

@media (max-width: 1200px) {
    .container {
        width: min(98vw, 1200px);
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

    h1 {
        font-size: 1.6rem;
    }

    .topbar {
        flex-direction: column;
        align-items: stretch;
    }

    .filters input,
    .filters select {
        min-width: 100%;
    }

    .table-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
    }

    .table-wrapper::-webkit-scrollbar {
        height: 4px;
    }

    .fixed-horizontal-scroll {
        display: none;
    }
}
</style>