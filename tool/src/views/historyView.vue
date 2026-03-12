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
import axios from "axios"
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

    async mounted() {
        try {
            const res = await axios.get("http://localhost:3000/api/history")
            this.history = res.data

            // prepare data for chart
            this.labels = this.history.map(h => h.machine)
            this.data = this.history.map(h => h.hoursWorked)
        } catch (error) {
            console.log(error)
        }
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


<style scoped>
/* neutral, minimalist status palette */
.done {
    background: #f9f9f9;
    color: #000;
}

.pending {
    background: #e0e0e0;
    color: #000;
}

.stopped {
    background: #cccccc;
    color: #000;
}

input,
select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fafafa;
    color: #000;
    margin-bottom: 1rem;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td {
    border-bottom: 1px solid #ddd;
    padding: 0.5rem;
}
</style>