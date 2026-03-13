<template>
    <div class="page-container">
        <div class="history-layout">
            <section class="history-list">
                <div class="history-box">
                    <div class="search-row">
                        <input v-model="search" placeholder="Buscar por sector o máquina" />
                    </div>

                    <h2>Historial de mantenimientos</h2>

                    <div class="history-items">
                <!-- Ejemplos de tareas -->
                <div class="history-item done">
                    <div class="item-header">
                        <span class="item-sector">Mantenimiento</span>
                        <span class="item-machine">Máquina A</span>
                    </div>
                    <div class="item-body">
                        <span class="item-hours">Horas: 3</span>
                        <span class="item-desc">Cambio de filtro y ajustes</span>
                    </div>
                </div>
                <div class="history-item pending">
                    <div class="item-header">
                        <span class="item-sector">Revisión</span>
                        <span class="item-machine">Máquina B</span>
                    </div>
                    <div class="item-body">
                        <span class="item-hours">Horas: 1</span>
                        <span class="item-desc">Chequeo preventivo de sensores</span>
                    </div>
                </div>

                <!-- Historial real -->
                <div
                    v-for="item in filteredHistory"
                    :key="item._id"
                    :class="['history-item', statusClass(item.status)]"
                >
                    <div class="item-header">
                        <span class="item-sector">{{ item.sector }}</span>
                        <span class="item-machine">{{ item.machine }}</span>
                    </div>
                    <div class="item-body">
                        <span class="item-hours">Horas: {{ item.hoursWorked }}</span>
                        <span class="item-desc">{{ item.description }}</span>
                    </div>
                </div>
            </div>
                </div>
            </section>

            <aside class="charts">
                <div class="chart-card">
                    <h3>Horas trabajadas (muestra)</h3>
                    <div class="pie" style="--p: 72;"></div>
                    <div class="pie-label">72%</div>
                </div>

                <div class="chart-card">
                    <h3>Horas máquina parada (muestra)</h3>
                    <div class="pie" style="--p: 43;"></div>
                    <div class="pie-label">43%</div>
                </div>
            </aside>
        </div>
    </div>
</template>


<script>
import axios from "axios"
import { Chart } from "chart.js/auto"
import backgroundImage from '@/assets/fondogeneral.jpg'

export default {
    data() {
        return {
            search: "",
            history: [],
            labels: [],
            data: [],
            backgroundImage: backgroundImage
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
    .page-container {
        margin-top: 1rem;
    }

    .history-layout {
        display: flex;
        gap: 1.5rem;
    }

    .history-list {
        flex: 0 0 70%;
        max-width: 70%;
    }

    .history-box {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
        border: 1px solid rgba(0, 0, 0, 0.12);
    }

    .charts {
        flex: 0 0 30%;
        max-width: 30%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.75rem;
    }

    .chart-card {
        width: 100%;
        max-width: 280px;
        height: 240px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .pie {
        width: 130px;
        height: 130px;
    }

    .search-row {
        margin-bottom: 1rem;
    }

    .history-items {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .history-item {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.12);
        background: rgba(255, 255, 255, 0.85);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .history-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .item-body {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
    }

    .charts {
        width: 340px;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .chart-card {
        padding: 1.25rem;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(0, 0, 0, 0.12);
        text-align: center;
    }

    .pie {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        margin: 0.75rem auto 0.25rem auto;
        background: conic-gradient(#3b82f6 calc(var(--p) * 1%), rgba(192, 196, 204, 0.35) 0);
        position: relative;
    }

    .pie::after {
        content: '';
        position: absolute;
        inset: 18px;
        border-radius: 50%;
        background: #fff;
    }

    .pie-label {
        font-weight: 700;
        margin-top: 0.35rem;
    }

</style>
.page-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
