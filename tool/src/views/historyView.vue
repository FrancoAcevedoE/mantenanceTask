<template>
    <div class="page-container">
    <div class="container">
        <div class="topbar">
            <h1>Historial de mantenimiento</h1>
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
        </div>

        <table>
            <thead>
                <tr>
                    <th>Operario</th>
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
                    <td>{{ item.sector }}</td>
                    <td>{{ item.machine }}</td>
                    <td>{{ item.machinePart }}</td>
                    <td>{{ item.workDescription }}</td>
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

                    <td>
                        <button v-if="item.status !== 'finished'" @click="openModal(item)">
                            Terminar trabajo
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-if="showModal" class="modal">
            <div class="modal-box">
                <h3>Finalizar mantenimiento</h3>
                <label>Horas adicionales</label>
                <input type="number" v-model="extraHours" />
                <button @click="finishMaintenance">
                    Guardar
                </button>
                <button @click="closeModal">
                    Cancelar
                </button>
            </div>
        </div>
    </div>
    </div>
</template>

<script>

// import apiClient from "../services/apiClient"

import backgroundImage from '@/assets/fondogeneral.png'

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

            showModal: false,

            selectedId: null,

            extraHours: 0,

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

    },

    beforeUnmount() {

        document.body.style.backgroundImage = ''
        document.body.style.backgroundSize = ''
        document.body.style.backgroundPosition = ''
        document.body.style.backgroundRepeat = ''
        document.body.style.backgroundAttachment = ''

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
                    ? item.clientId?._id === this.filterOperario
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

        async loadHistory() {

            const res = await apiClient.get("/maintenance/history")

            this.history = res.data

            this.sectors = [
                ...new Set(
                    res.data.map(item => item.sector)
                )
            ]

            this.operarios = res.data
                .filter(item => item.clientId?._id)
                .reduce((accumulator, item) => {

                    if (!accumulator.some(operario => operario.value === item.clientId._id)) {
                        accumulator.push({
                            value: item.clientId._id,
                            label: this.formatOperarioName(item.clientId)
                        })
                    }

                    return accumulator

                }, [])

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

        openModal(item) {

            this.selectedId = item._id

            this.showModal = true

        },

        closeModal() {

            this.showModal = false

            this.extraHours = 0

        },

        async finishMaintenance() {

            await apiClient.put(

                `/maintenance/finish/${this.selectedId}`,

                {
                    hoursWorked: this.extraHours
                }

            )

            this.closeModal()

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
    width: 100%;
    max-width: 1180px;
    background: rgba(255, 255, 255, 0.94);
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.622);
    padding: 1.5rem;
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
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
}

th,
td {
    border: 1px solid #e2e2e2;
    padding: 10px;
}

th {
    background: #efefef;
    color: #333;
    text-align: left;
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

    table {
        display: block;
        overflow-x: auto;
        white-space: nowrap;
    }
}
</style>