<template>
    <div>
        <input v-model="search" placeholder="Buscar" />
        <h2>Historial de mantenimientos</h2>
        <table>
            <tr v-for="item in filteredHistory" :key="item._id" :class="statusClass(item.status)">
                <td>{{ item.sector }}</td>
                <td>{{ item.machine }}</td>
                <td>{{ item.hoursWorked }}</td>
                <td>{{ item.description }}</td>
            </tr>
        </table>
        <canvas ref="chart"></canvas>
    </div>
</template>


<script>
import { Chart } from "chart.js/auto"
export default {
    data() {
        return {
            search: "",
            history: [],
            labels: [],
            data: []
        }
    },

    mounted() {
        this.createChart()
    },

    computed: {
        filteredHistory() {
            return this.history.filter(h => {
                return (
                    h.machine.toLowerCase().includes(this.search.toLowerCase()) ||
                    h.sector.toLowerCase().includes(this.search.toLowerCase())
                )
            })
        }
    },

    methods: {
        createChart() {
            new Chart(this.$refs.chart, {
                type: "bar",
                data: {
                    labels: this.labels,
                    datasets: [{
                        label: "Horas trabajadas",
                        data: this.data
                    }]
                }
            })
        },

statusClass(status) {
    if (status == "terminado") return "done"
    if (status == "pendiente") return "pending"
    if (status == "parada") return "stopped"

    }

}

}

</script>


<style>
.done {
    background: white;
}

.pending {
    background: orange;
}

.stopped {
    background: red;
    color: white;
}
</style>