<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Dashboard de Inventario</h2>
      </div>

      <InventorySubNav />

      <div v-if="store.loading" class="empty-state">Cargando datos...</div>

      <template v-else>
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon"><i class="bi bi-grid-3x3-gap"></i></div>
            <div class="kpi-content">
              <span class="kpi-label">Total productos</span>
              <span class="kpi-value">{{ store.totalProducts }}</span>
            </div>
          </div>
          <div class="kpi-card kpi-card--blue">
            <div class="kpi-icon"><i class="bi bi-boxes"></i></div>
            <div class="kpi-content">
              <span class="kpi-label">Total stock</span>
              <span class="kpi-value">{{ store.totalStock }}</span>
            </div>
          </div>
          <div class="kpi-card kpi-card--gold">
            <div class="kpi-icon"><i class="bi bi-currency-dollar"></i></div>
            <div class="kpi-content">
              <span class="kpi-label">Valor inventario</span>
              <span class="kpi-value kpi-price">${{ fmtBig(store.inventoryValue) }}</span>
            </div>
          </div>
          <div class="kpi-card kpi-card--danger">
            <div class="kpi-icon"><i class="bi bi-x-circle"></i></div>
            <div class="kpi-content">
              <span class="kpi-label">Sin stock</span>
              <span class="kpi-value">{{ store.noStockProducts.length }}</span>
            </div>
          </div>
          <div class="kpi-card kpi-card--warning">
            <div class="kpi-icon"><i class="bi bi-exclamation-triangle"></i></div>
            <div class="kpi-content">
              <span class="kpi-label">Stock bajo</span>
              <span class="kpi-value">{{ store.lowStockProducts.length }}</span>
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3 class="chart-title">Top 10 productos por precio</h3>
            <div class="canvas-wrap">
              <canvas ref="barRef"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Distribución por grupo</h3>
            <div class="canvas-wrap canvas-doughnut">
              <canvas ref="doughnutRef"></canvas>
            </div>
          </div>
        </div>

        <!-- Products alert lists -->
        <div class="alert-grid">
          <div class="alert-panel" v-if="store.noStockProducts.length">
            <h3 class="alert-title alert-title--danger">
              <i class="bi bi-x-circle"></i> Sin stock ({{ store.noStockProducts.length }})
            </h3>
            <div class="alert-list">
              <div v-for="p in store.noStockProducts.slice(0,8)" :key="p._id" class="alert-item">
                <code class="code-xs">{{ p.code }}</code>
                <span class="alert-name">{{ p.name }}</span>
                <router-link :to="`/product/${p._id}/edit`">
                  <button class="btn-xs secondary-button"><i class="bi bi-pencil"></i></button>
                </router-link>
              </div>
            </div>
          </div>

          <div class="alert-panel" v-if="store.lowStockProducts.length">
            <h3 class="alert-title alert-title--warning">
              <i class="bi bi-exclamation-triangle"></i> Stock bajo ({{ store.lowStockProducts.length }})
            </h3>
            <div class="alert-list">
              <div v-for="p in store.lowStockProducts.slice(0,8)" :key="p._id" class="alert-item">
                <code class="code-xs">{{ p.code }}</code>
                <span class="alert-name">{{ p.name }}</span>
                <span class="stock-num">{{ p.stock }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale,
  DoughnutController, ArcElement, Tooltip, Legend, Title
} from 'chart.js'
import { useProductsStore } from '@/stores/products'
import InventorySubNav from '@/components/InventorySubNav.vue'
import { useDarkMode } from '@/composables/useDarkMode'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, DoughnutController, ArcElement, Tooltip, Legend, Title)

const store = useProductsStore()
const barRef = ref(null)
const doughnutRef = ref(null)
let barChart = null
let doughnutChart = null

const COLORS_LIGHT = ['#6b8e3a','#9eb88c','#4a6d26','#c5d9a8','#2d4d18','#e8f0df','#7aac4a','#3a5c1e','#b8d98a','#8ec060']
const COLORS_DARK  = ['#22c55e','#ef4444','#f59e0b','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4']

const { isDark } = useDarkMode()

onMounted(async () => {
  if (!store.products.length) await store.fetchProducts()
  buildCharts()
})

onUnmounted(() => {
  barChart?.destroy()
  doughnutChart?.destroy()
})

watch(() => store.products, () => {
  barChart?.destroy()
  doughnutChart?.destroy()
  buildCharts()
}, { deep: false })

watch(isDark, () => {
  barChart?.destroy()
  doughnutChart?.destroy()
  buildCharts()
})

function buildCharts() {
  if (!barRef.value || !doughnutRef.value) return

  const dark = isDark.value
  const COLORS = dark ? COLORS_DARK : COLORS_LIGHT
  const tickColor = dark ? 'rgba(255,255,255,0.5)' : undefined
  const gridColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(107,142,58,0.1)'
  const borderColor = dark ? 'rgba(13,18,35,0.8)' : '#fff'

  // Bar: top 10 by price
  const top10 = [...store.products]
    .sort((a, b) => (b.pricePerM2 || 0) - (a.pricePerM2 || 0))
    .slice(0, 10)

  barChart = new Chart(barRef.value, {
    type: 'bar',
    data: {
      labels: top10.map(p => p.code),
      datasets: [{
        label: 'Precio por m²',
        data: top10.map(p => p.pricePerM2 || 0),
        backgroundColor: COLORS,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `$${ctx.parsed.y.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            title: ctx => top10[ctx[0].dataIndex]?.name || ctx[0].label
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            callback: v => '$' + v.toLocaleString('es-AR'),
            font: { size: 11 }
          }
        }
      }
    }
  })

  // Doughnut: by grupo
  const grupoMap = {}
  store.products.forEach(p => {
    const g = p.grupo || 'Sin grupo'
    grupoMap[g] = (grupoMap[g] || 0) + 1
  })
  const labels = Object.keys(grupoMap)
  const data = Object.values(grupoMap)

  doughnutChart = new Chart(doughnutRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS,
        borderWidth: 2,
        borderColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: tickColor, font: { size: 11 }, padding: 12 }
        },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} productos` } }
      },
      cutout: '62%'
    }
  })
}

function fmtBig(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0 })
}
</script>

<style scoped>
.topbar { margin-bottom: 1.2rem; }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 1rem;
  margin-bottom: 1.8rem;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  background: rgba(107,142,58,0.07);
  border: 1px solid rgba(107,142,58,0.18);
  border-radius: 20px;
  transition: transform 0.15s;
}

.kpi-card:hover { transform: translateY(-2px); }
.kpi-card--blue { background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.2); }
.kpi-card--gold { background: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.22); }
.kpi-card--danger { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.2); }
.kpi-card--warning { background: rgba(251,146,60,0.08); border-color: rgba(251,146,60,0.22); }

.kpi-icon {
  font-size: 1.6rem;
  color: var(--color-primary);
  opacity: 0.75;
  flex-shrink: 0;
}

.kpi-content { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.kpi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--color-muted); }
.kpi-value { font-size: 1.9rem; font-weight: 700; font-family: 'Poppins', sans-serif; line-height: 1; color: var(--color-text); }
.kpi-price { font-size: 1.5rem; }

.charts-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.8rem;
}

.chart-card {
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(107,142,58,0.14);
  border-radius: 20px;
  padding: 1.2rem;
}

.chart-title {
  font-size: 0.82rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-muted);
}

.canvas-wrap { height: 240px; }
.canvas-doughnut { height: 240px; display: flex; align-items: center; justify-content: center; }

.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.alert-panel {
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 18px;
  padding: 1.1rem;
}

.alert-title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.alert-title--danger { color: #b91c1c; }
.alert-title--warning { color: #b45309; }

.alert-list { display: flex; flex-direction: column; gap: 0.5rem; }

.alert-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  background: rgba(107,142,58,0.05);
  border-radius: 10px;
}

.code-xs {
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  background: rgba(107,142,58,0.12);
  padding: 0.12rem 0.4rem;
  border-radius: 5px;
  flex-shrink: 0;
}

.alert-name { flex: 1; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: none; letter-spacing: 0; }

.stock-num {
  font-size: 0.88rem;
  font-weight: 700;
  color: #b45309;
  text-transform: none;
}

.btn-xs {
  padding: 0.25rem 0.5rem !important;
  font-size: 0.72rem !important;
  border-radius: 8px !important;
  min-width: 0 !important;
}

.alert-item a { text-decoration: none; margin-left: auto; flex-shrink: 0; }

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
  .canvas-wrap { height: 200px; }
}

@media (max-width: 600px) {
  .kpi-value { font-size: 1.5rem; }
  .kpi-price { font-size: 1.2rem; }
}
</style>
