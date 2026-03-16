<template>
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

            <input type="date" v-model="filterDate" />
        </div>

        <table>
            <thead>
                <tr>
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
</template>

<script>

// import apiClient from "../services/apiClient"

export default {

    data() {

        return {

            history: [],

            searchMachine: "",

            filterSector: "",

            filterDate: "",

            sectors: [],

            showModal: false,

            selectedId: null,

            extraHours: 0

        }

    },

    async mounted() {

        await this.loadHistory()

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

                const dateMatch = this.filterDate
                    ? item.createdAt
                        .slice(0, 10) === this.filterDate
                    : true

                return machineMatch && sectorMatch && dateMatch

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

        },

        getRowClass(status) {

            if (status === "pending") return "yellow"

            if (status === "stopped") return "red"

            return "white"

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
.container {
    width: 95%;
    margin: auto;
}

.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.filters {
    margin: 20px 0;
    display: flex;
    gap: 10px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #ccc;
    padding: 8px;
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
}
</style>