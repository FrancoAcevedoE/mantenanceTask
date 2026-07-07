<template>
  <div class="mp-page">
    <div class="mp-card-wrap">

      <!-- ── Encabezado ── -->
      <div class="mp-header">
        <h2 class="mp-title"><i class="bi bi-boxes"></i> Stock de Materias Primas</h2>
        <div class="mp-header-actions">
          <button class="btn-ghost btn-sm-icon" @click="printStock" title="Imprimir / PDF">
            <i class="bi bi-printer"></i><span class="btn-label"> Imprimir</span>
          </button>
          <button class="btn-ghost btn-sm-icon" @click="exportExcel" title="Exportar Excel">
            <i class="bi bi-file-earmark-spreadsheet"></i><span class="btn-label"> Excel</span>
          </button>
          <button v-if="canManageCompras" class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> Nueva</button>
        </div>
      </div>

      <!-- ── Layout principal: lista + dashboard ── -->
      <div class="mp-main">

        <!-- COLUMNA IZQUIERDA: lista -->
        <div class="mp-left">
          <div class="mp-filters">
            <input v-model="search" class="mp-search" placeholder="Buscar…" />
            <select v-model="filterCat" class="mp-select">
              <option value="">Todas</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div v-if="loading" class="mp-loading">Cargando…</div>
          <div v-else-if="filtered.length === 0" class="mp-empty">Sin resultados.</div>

          <div v-else class="mp-list">
            <div
              v-for="mp in filtered"
              :key="mp._id"
              :class="['mp-row', stockStatus(mp)]"
            >
              <div class="mp-row-info">
                <span class="mp-row-name">{{ mp.nombre }}</span>
                <span v-if="mp.categoria" class="mp-row-cat">{{ mp.categoria }}</span>
              </div>
              <div class="mp-row-stats">
                <span :class="['mp-row-stock', mp.stock <= mp.stockMinimo ? 'mp-low' : mp.stock <= mp.stockMinimo * 1.2 && mp.stockMinimo > 0 ? 'mp-warn' : '']">
                  {{ mp.stock }} <em>{{ mp.unidad }}</em>
                </span>
                <span v-if="mp.stock <= mp.stockMinimo && mp.stockMinimo > 0" class="mp-badge mp-badge--low" title="Stock bajo mínimo">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                </span>
                <span v-else-if="mp.stock <= mp.stockMinimo * 1.2 && mp.stockMinimo > 0" class="mp-badge mp-badge--warn" title="Stock cercano al mínimo">
                  <i class="bi bi-exclamation-circle-fill"></i>
                </span>
                <span class="mp-row-price">${{ formatNum(mp.precio) }}</span>
              </div>
              <div class="mp-row-actions">
                <button class="btn-sm btn-entrada" @click="openMovimiento(mp, 'entrada')" title="Entrada">
                  <i class="bi bi-arrow-down-circle"></i>
                </button>
                <button class="btn-sm btn-salida" @click="openMovimiento(mp, 'salida')" title="Salida">
                  <i class="bi bi-arrow-up-circle"></i>
                </button>
                <button class="btn-sm btn-historial" @click="openHistorial(mp)" title="Historial">
                  <i class="bi bi-clock-history"></i>
                </button>
                <button v-if="canManageCompras" class="btn-sm btn-edit" @click="openEdit(mp)" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button v-if="canManageCompras" class="btn-sm btn-del" @click="confirmDelete(mp)" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: dashboard -->
        <div class="mp-right">
          <div class="dash-title">Dashboard mensual</div>

          <div class="dash-kpis">
            <div class="kpi-card kpi-green">
              <span class="kpi-label">Compras este mes</span>
              <span class="kpi-val">{{ kpiComprasMes }}</span>
              <span class="kpi-sub">movimientos</span>
            </div>
            <div class="kpi-card kpi-orange">
              <span class="kpi-label">Consumos este mes</span>
              <span class="kpi-val">{{ kpiConsumosMes }}</span>
              <span class="kpi-sub">movimientos</span>
            </div>
            <div class="kpi-card kpi-red">
              <span class="kpi-label">Stock bajo mínimo</span>
              <span class="kpi-val">{{ kpiBajoMinimo }}</span>
              <span class="kpi-sub">materias primas</span>
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-label">Compras (entradas) — últimos 6 meses</div>
            <div class="canvas-wrap">
              <canvas ref="barComprasRef"></canvas>
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-label">Consumo (salidas) — últimos 6 meses</div>
            <div class="canvas-wrap">
              <canvas ref="barConsumoRef"></canvas>
            </div>
          </div>
        </div>

      </div>
    <!-- ── Tabla solo para impresión ── -->
    <div class="mp-print-only">
      <div class="mp-print-header">
        <h2>Stock de Materias Primas</h2>
        <p>Exportado el {{ printDate }}</p>
      </div>
      <table class="mp-print-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th>Stock actual</th>
            <th>Stock mínimo</th>
            <th>Precio unit.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mp in items" :key="mp._id" :class="mp.stock <= mp.stockMinimo && mp.stockMinimo > 0 ? 'print-row-low' : mp.stock <= mp.stockMinimo * 1.2 && mp.stockMinimo > 0 ? 'print-row-warn' : ''">
            <td>{{ mp.nombre }}</td>
            <td>{{ mp.codigo || '—' }}</td>
            <td>{{ mp.categoria || '—' }}</td>
            <td>{{ mp.unidad }}</td>
            <td>{{ mp.stock }}</td>
            <td>{{ mp.stockMinimo }}</td>
            <td>${{ formatNum(mp.precio) }}</td>
            <td>{{ mp.stock <= mp.stockMinimo && mp.stockMinimo > 0 ? '⚠ Bajo mínimo' : mp.stock <= mp.stockMinimo * 1.2 && mp.stockMinimo > 0 ? '↓ Cercano' : 'OK' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    </div><!-- /mp-card-wrap -->

    <!-- Modal crear/editar -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-box">
        <h3>{{ editingId ? 'Editar materia prima' : 'Nueva materia prima' }}</h3>
        <div class="form-grid">
          <label>Nombre *
            <input v-model="form.nombre" placeholder="Ej: Resina epoxi" />
          </label>
          <label>Código
            <input v-model="form.codigo" placeholder="Ej: MP-001" />
          </label>
          <label>Categoría
            <input v-model="form.categoria" placeholder="Ej: Solventes" list="cat-list" />
            <datalist id="cat-list">
              <option v-for="c in categories" :key="c" :value="c" />
            </datalist>
          </label>
          <label>Unidad *
            <select v-model="form.unidad">
              <option value="kg">kg</option>
              <option value="lt">lt</option>
              <option value="m">m</option>
              <option value="unidad">unidad</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
            </select>
          </label>
          <label>Stock inicial
            <input v-model.number="form.stock" type="number" min="0" />
          </label>
          <label>Stock mínimo
            <input v-model.number="form.stockMinimo" type="number" min="0" />
          </label>
          <label>Precio unitario ($)
            <input v-model.number="form.precio" type="number" min="0" step="0.01" />
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">Cancelar</button>
          <button class="btn-primary" :disabled="savingForm" @click="saveForm">
            {{ savingForm ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal movimiento entrada/salida -->
    <div v-if="showMov" class="modal-overlay" @click.self="showMov = false">
      <div class="modal-box modal-sm">
        <h3>
          <i :class="movTipo === 'entrada' ? 'bi bi-arrow-down-circle text-green' : 'bi bi-arrow-up-circle text-red'"></i>
          {{ movTipo === 'entrada' ? 'Entrada de stock' : 'Salida de stock' }}
        </h3>
        <p class="mov-mp-name">{{ movItem?.nombre }}</p>
        <div class="form-grid">
          <label>Cantidad ({{ movItem?.unidad }}) *
            <input v-model.number="movForm.cantidad" type="number" min="1" />
          </label>
          <label>Motivo
            <input v-model="movForm.motivo" placeholder="Ej: Compra, Producción…" />
          </label>
          <label v-if="movTipo === 'entrada'">Precio unitario ($)
            <input v-model.number="movForm.precio" type="number" min="0" step="0.01" />
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showMov = false">Cancelar</button>
          <button
            :class="['btn-primary', movTipo === 'salida' ? 'btn-danger' : '']"
            :disabled="savingMov"
            @click="saveMovimiento"
          >
            {{ savingMov ? 'Guardando…' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal historial -->
    <div v-if="showHist" class="modal-overlay" @click.self="showHist = false">
      <div class="modal-box modal-lg">
        <h3><i class="bi bi-clock-history"></i> Historial — {{ histItem?.nombre }}</h3>
        <div v-if="histLoading" class="mp-loading">Cargando…</div>
        <div v-else-if="!histMovs.length" class="mp-empty">Sin movimientos registrados.</div>
        <table v-else class="hist-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Precio unit.</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in histMovs" :key="m._id">
              <td>{{ formatDate(m.fecha) }}</td>
              <td>
                <span :class="['badge', m.tipo === 'entrada' ? 'badge-green' : 'badge-red']">
                  {{ m.tipo }}
                </span>
              </td>
              <td>{{ m.cantidad }} {{ histItem?.unidad }}</td>
              <td>{{ m.motivo || '—' }}</td>
              <td>{{ m.precio ? '$' + formatNum(m.precio) : '—' }}</td>
              <td>{{ m.usuario || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showHist = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { usePermissions } from '@/utils/permissions'
import {
  Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js'
import { useDarkMode } from '@/composables/useDarkMode'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const { isDark } = useDarkMode()

const { canManageCompras, isCompras } = usePermissions()

const authCfg = (extra = {}) => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }, ...extra })
const api = {
  get:    (path, cfg = {})  => axios.get(`${API_BASE_URL}${path}`, { ...authCfg(), ...cfg }),
  post:   (path, data)      => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data)      => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path)            => axios.delete(`${API_BASE_URL}${path}`, authCfg())
}

// ── State ──────────────────────────────────────────────────────────────────
const items     = ref([])
const loading   = ref(true)
const search    = ref('')
const filterCat = ref('')

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({ nombre: '', codigo: '', categoria: '', unidad: 'kg', stock: 0, stockMinimo: 0, precio: 0 })

const showMov   = ref(false)
const movItem   = ref(null)
const movTipo   = ref('entrada')
const savingMov = ref(false)
const movForm   = ref({ cantidad: 1, motivo: '', precio: 0 })

const showHist    = ref(false)
const histItem    = ref(null)
const histMovs    = ref([])
const histLoading = ref(false)

// Chart refs
const barComprasRef = ref(null)
const barConsumoRef = ref(null)
let chartCompras = null
let chartConsumo = null

// ── Computed ───────────────────────────────────────────────────────────────
const categories = computed(() => {
  const set = new Set(items.value.map(i => i.categoria).filter(Boolean))
  return [...set].sort()
})

const filtered = computed(() => {
  let list = items.value
  if (filterCat.value) list = list.filter(i => i.categoria === filterCat.value)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(i =>
      i.nombre?.toLowerCase().includes(q) ||
      i.categoria?.toLowerCase().includes(q) ||
      i.codigo?.toLowerCase().includes(q)
    )
  }
  return list
})

// KPIs
const kpiBajoMinimo = computed(() => items.value.filter(i => i.stock <= i.stockMinimo).length)

const kpiComprasMes = computed(() => {
  const now = new Date()
  return allMovimientos.value.filter(m =>
    m.tipo === 'entrada' &&
    new Date(m.fecha).getMonth() === now.getMonth() &&
    new Date(m.fecha).getFullYear() === now.getFullYear()
  ).length
})

const kpiConsumosMes = computed(() => {
  const now = new Date()
  return allMovimientos.value.filter(m =>
    m.tipo === 'salida' &&
    new Date(m.fecha).getMonth() === now.getMonth() &&
    new Date(m.fecha).getFullYear() === now.getFullYear()
  ).length
})

// Todos los movimientos de todos los items
const allMovimientos = computed(() =>
  items.value.flatMap(i => (i.movimientos || []))
)

// ── Helpers de charts ──────────────────────────────────────────────────────
function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }) })
  }
  return months
}

function buildChartData(tipo) {
  const months = getLast6Months()
  const counts = months.map(({ year, month }) =>
    allMovimientos.value.filter(m => {
      const d = new Date(m.fecha)
      return m.tipo === tipo && d.getFullYear() === year && d.getMonth() === month
    }).reduce((sum, m) => sum + (m.cantidad || 0), 0)
  )
  return { labels: months.map(m => m.label), counts }
}

function buildCharts() {
  if (!barComprasRef.value || !barConsumoRef.value) return

  const dark = isDark.value
  Chart.defaults.color = dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.87)'
  const tickColor = dark ? 'rgba(255,255,255,0.7)' : undefined
  const gridColor = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,.05)'

  const compras = buildChartData('entrada')
  const consumo = buildChartData('salida')

  chartCompras?.destroy()
  chartConsumo?.destroy()

  chartCompras = new Chart(barComprasRef.value, {
    type: 'bar',
    data: {
      labels: compras.labels,
      datasets: [{
        label: 'Cantidad comprada',
        data: compras.counts,
        backgroundColor: dark ? 'rgba(34,197,94,0.75)' : 'rgba(34,197,94,0.7)',
        borderColor: dark ? '#22c55e' : '#16a34a',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } }
      }
    }
  })

  chartConsumo = new Chart(barConsumoRef.value, {
    type: 'bar',
    data: {
      labels: consumo.labels,
      datasets: [{
        label: 'Cantidad consumida',
        data: consumo.counts,
        backgroundColor: dark ? 'rgba(239,68,68,0.75)' : 'rgba(249,115,22,0.7)',
        borderColor: dark ? '#ef4444' : '#ea580c',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } }
      }
    }
  })
}

// ── Data ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    // Traer cada item con sus movimientos
    const { data: list } = await api.get('/materias-primas')
    const details = await Promise.all(list.map(mp => api.get(`/materias-primas/${mp._id}`).then(r => r.data)))
    items.value = details
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

watch(items, () => {
  setTimeout(buildCharts, 50)
}, { deep: false })

watch(isDark, () => {
  setTimeout(buildCharts, 50)
})

// ── CRUD ───────────────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  form.value = { nombre: '', codigo: '', categoria: '', unidad: 'kg', stock: 0, stockMinimo: 0, precio: 0 }
  showForm.value = true
}

function openEdit(mp) {
  editingId.value = mp._id
  form.value = {
    nombre: mp.nombre, codigo: mp.codigo || '', categoria: mp.categoria || '',
    unidad: mp.unidad, stock: mp.stock, stockMinimo: mp.stockMinimo, precio: mp.precio
  }
  showForm.value = true
}

function closeForm() { showForm.value = false }

async function saveForm() {
  if (!form.value.nombre.trim()) return
  savingForm.value = true
  try {
    if (editingId.value) {
      await api.put(`/materias-primas/${editingId.value}`, form.value)
    } else {
      await api.post('/materias-primas', form.value)
    }
    await load()
    closeForm()
  } catch (e) {
    console.error(e)
  } finally {
    savingForm.value = false
  }
}

async function confirmDelete(mp) {
  if (!confirm(`¿Eliminar "${mp.nombre}"?`)) return
  await api.delete(`/materias-primas/${mp._id}`)
  await load()
}

function openMovimiento(mp, tipo) {
  movItem.value = mp
  movTipo.value = tipo
  movForm.value = { cantidad: 1, motivo: '', precio: mp.precio || 0 }
  showMov.value = true
}

async function saveMovimiento() {
  if (!movForm.value.cantidad || movForm.value.cantidad <= 0) return
  // Confirmación extra para el rol compras al descontar stock
  if (isCompras.value && movTipo.value === 'salida') {
    const ok = confirm(`¿Confirmar descuento de ${movForm.value.cantidad} ${movItem.value?.unidad} de "${movItem.value?.nombre}"?\n\nEsta acción no se puede revertir.`)
    if (!ok) return
  }
  savingMov.value = true
  try {
    await api.post(`/materias-primas/${movItem.value._id}/movimiento`, {
      tipo: movTipo.value,
      cantidad: movForm.value.cantidad,
      motivo: movForm.value.motivo,
      precio: movForm.value.precio
    })
    await load()
    showMov.value = false
  } catch (e) {
    console.error(e)
  } finally {
    savingMov.value = false
  }
}

async function openHistorial(mp) {
  histItem.value = mp
  histMovs.value = []
  showHist.value = true
  histLoading.value = true
  try {
    const { data } = await api.get(`/materias-primas/${mp._id}`)
    histMovs.value = (data.movimientos || []).slice().reverse()
  } catch (e) {
    console.error(e)
  } finally {
    histLoading.value = false
  }
}

function formatNum(n) {
  return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function stockStatus(mp) {
  if (!mp.stockMinimo || mp.stockMinimo <= 0) return ''
  if (mp.stock <= mp.stockMinimo) return 'mp-row--low'
  if (mp.stock <= mp.stockMinimo * 1.2) return 'mp-row--warn'
  return ''
}

const printDate = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function printStock() {
  window.print()
}

function exportExcel() {
  const rows = items.value.map(mp => {
    let estado = 'OK'
    if (mp.stockMinimo > 0) {
      if (mp.stock <= mp.stockMinimo) estado = 'Bajo mínimo'
      else if (mp.stock <= mp.stockMinimo * 1.2) estado = 'Cercano al mínimo'
    }
    return {
      Nombre: mp.nombre,
      Código: mp.codigo || '',
      Categoría: mp.categoria || '',
      Unidad: mp.unidad,
      'Stock actual': mp.stock,
      'Stock mínimo': mp.stockMinimo,
      'Precio unitario': mp.precio,
      Estado: estado
    }
  })

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(';'),
    ...rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(';'))
  ]
  // BOM UTF-8 para que Excel lo abra correctamente
  const csv = '﻿' + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `stock-materias-primas-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(load)
onUnmounted(() => { chartCompras?.destroy(); chartConsumo?.destroy() })
</script>

<style scoped>
/* ── Página ──────────────────────────────────────────────────────────────── */
.mp-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem 2rem;
  background: transparent;
  box-sizing: border-box;
}

.mp-card-wrap {
  width: 100%;
  max-width: 1300px;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 22px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  padding: 1.25rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.mp-header {
  display: flex; align-items: center; justify-content: space-between; gap: .75rem;
  margin-bottom: 1rem; flex-wrap: wrap;
}
.mp-title {
  font-size: 1.1rem; font-weight: 700;
  display: flex; align-items: center; gap: .5rem;
  margin: 0; color: #1e293b;
}

/* ── Layout dos columnas (desktop) ───────────────────────────────────────── */
.mp-main {
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}

/* ── Columna izquierda ───────────────────────────────────────────────────── */
.mp-left { display: flex; flex-direction: column; gap: .625rem; min-width: 0; }

.mp-filters { display: flex; gap: .5rem; flex-wrap: wrap; }
.mp-search {
  flex: 1; min-width: 120px;
  padding: .4rem .75rem; border-radius: 2rem;
  border: 1px solid #ccc;
  font-size: 16px; /* Evita zoom automático en iOS */
  color: #333; background: #fff;
  box-sizing: border-box;
}
.mp-select {
  padding: .4rem .65rem; border-radius: 2rem;
  border: 1px solid #ccc;
  font-size: 16px; /* Evita zoom automático en iOS */
  color: #333; background: #fff;
  width: auto;
  max-width: 120px;
  cursor: pointer;
  /* Evita que el select nativo se expanda al ancho del contenido */
  box-sizing: border-box;
}

.mp-loading, .mp-empty { text-align: center; color: #888; padding: 1.5rem; font-size: .9rem; }

.mp-list {
  display: flex; flex-direction: column; gap: .35rem;
  max-height: 55vh; overflow-y: auto; padding-right: 2px;
}

.mp-row {
  display: flex; align-items: center; gap: .4rem;
  background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: .45rem .625rem;
  min-width: 0;
}
.mp-row--low { border-color: #fca5a5; background: #fff7f7; }

.mp-row-info { flex: 1; min-width: 0; overflow: hidden; }
.mp-row-name {
  font-weight: 700; font-size: .85rem; color: #1e293b;
  display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mp-row-cat {
  font-size: .65rem; color: #6366f1; background: rgba(99,102,241,.1);
  padding: 1px 6px; border-radius: 20px; display: inline-block; margin-top: 1px;
}

.mp-row-stats {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 1px; flex-shrink: 0; min-width: 60px;
}
.mp-row-stock { font-size: .85rem; font-weight: 700; color: #374151; white-space: nowrap; }
.mp-row-stock em { font-style: normal; font-size: .7rem; color: #9ca3af; }
.mp-low { color: #ef4444 !important; }
.mp-row-price { font-size: .7rem; color: #6b7280; white-space: nowrap; }

.mp-row-actions { display: flex; gap: .2rem; flex-shrink: 0; }
.btn-sm {
  padding: .25rem .35rem; border: none; border-radius: 6px;
  cursor: pointer; font-size: .78rem; display: flex; align-items: center;
  transition: opacity .15s; line-height: 1;
}
.btn-sm:active { opacity: .7; }
.btn-entrada  { background: #d1fae5; color: #065f46; }
.btn-salida   { background: #fee2e2; color: #991b1b; }
.btn-historial{ background: #e0e7ff; color: #3730a3; }
.btn-edit     { background: #fef9c3; color: #713f12; }
.btn-del      { background: #fee2e2; color: #7f1d1d; }

/* ── Columna derecha: dashboard ──────────────────────────────────────────── */
.mp-right {
  display: flex; flex-direction: column; gap: .875rem;
  background: #f8fafc; border-radius: 14px; padding: 1rem;
  border: 1px solid #e5e7eb; min-width: 0;
}

.dash-title {
  font-size: .88rem; font-weight: 700; color: #374151;
  padding-bottom: .5rem; border-bottom: 1px solid #e5e7eb;
}

.dash-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.kpi-card {
  border-radius: 10px; padding: .5rem .5rem;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 1px;
}
.kpi-green  { background: #d1fae5; }
.kpi-orange { background: #ffedd5; }
.kpi-red    { background: #fee2e2; }
.kpi-label  { font-size: .6rem; font-weight: 600; color: #6b7280; text-transform: uppercase; line-height: 1.2; }
.kpi-val    { font-size: 1.4rem; font-weight: 800; line-height: 1.1; }
.kpi-green .kpi-val  { color: #065f46; }
.kpi-orange .kpi-val { color: #9a3412; }
.kpi-red .kpi-val    { color: #991b1b; }
.kpi-sub    { font-size: .58rem; color: #9ca3af; }

.chart-section { display: flex; flex-direction: column; gap: .3rem; }
.chart-label { font-size: .75rem; font-weight: 600; color: #6b7280; }
.canvas-wrap { position: relative; width: 100%; height: 130px; }
.canvas-wrap canvas { max-width: 100%; }

/* ── Modales ─────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,.25);
  padding: 1.25rem;
  width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: .875rem; color: #333;
  box-sizing: border-box;
}
.modal-box h3 { margin: 0; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; color: #333; }
.modal-sm { max-width: 360px; }
.modal-lg { max-width: 780px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .625rem; }
.form-grid label { display: flex; flex-direction: column; gap: .25rem; font-size: .82rem; font-weight: 600; color: #444; }
.form-grid input, .form-grid select {
  width: 100%; padding: 9px 14px; border-radius: 2rem;
  border: 1px solid #ccc; background: #fff; color: #333;
  font-size: 16px; /* Evita zoom automático en iOS */
  box-sizing: border-box;
}
.form-grid input:focus, .form-grid select:focus {
  outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15);
}

.modal-actions { display: flex; justify-content: flex-end; gap: .625rem; margin-top: .25rem; }

.btn-primary {
  background: #6366f1; color: #fff; border: none; border-radius: 2rem;
  padding: .45rem 1.1rem; cursor: pointer; font-weight: 600;
  display: flex; align-items: center; gap: .35rem; font-size: .88rem;
  transition: background .15s; white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary.btn-danger { background: #ef4444; }
.btn-primary.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-ghost {
  background: transparent; border: 1px solid #ccc; border-radius: 2rem;
  padding: .45rem 1rem; cursor: pointer; color: #555; font-size: .88rem;
  white-space: nowrap;
}
.btn-ghost:hover { background: #f3f4f6; }

.mov-mp-name { font-weight: 700; font-size: .95rem; color: #333; margin: 0; }
.text-green { color: #22c55e; }
.text-red   { color: #ef4444; }

/* Historial */
.hist-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.hist-table th { background: #f3f4f6; padding: .45rem .625rem; text-align: left; color: #374151; font-weight: 600; }
.hist-table td { padding: .4rem .625rem; border-bottom: 1px solid #e5e7eb; color: #374151; }
.hist-table tr:last-child td { border-bottom: none; }

.badge { padding: 2px 7px; border-radius: 20px; font-size: .7rem; font-weight: 700; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-red   { background: #fee2e2; color: #991b1b; }

/* ── Header acciones ─────────────────────────────────────────────────────── */
.mp-header-actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.btn-sm-icon {
  display: flex; align-items: center; gap: .25rem;
  padding: .4rem .75rem; font-size: .82rem;
}
.btn-sm-icon i { font-size: .9rem; }

/* ── Badges de stock ─────────────────────────────────────────────────────── */
.mp-warn { color: #f97316 !important; }
.mp-badge {
  font-size: .7rem; line-height: 1; flex-shrink: 0;
}
.mp-badge--low { color: #ef4444; }
.mp-badge--warn { color: #f97316; }
.mp-row--warn { background: #fff7ed; border-left: 3px solid #f97316; }

/* ── Tabla de impresión (oculta en pantalla) ─────────────────────────────── */
.mp-print-only { display: none; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .mp-main { grid-template-columns: 1fr; }
  .mp-list { max-height: none; }
}

@media (max-width: 500px) {
  .mp-card-wrap { border-radius: 14px; padding: 1rem .875rem; }
  .mp-title { font-size: 1rem; }
  .form-grid { grid-template-columns: 1fr; }
  .mp-row-price { display: none; }
  .dash-kpis { grid-template-columns: repeat(3, 1fr); gap: .35rem; }
  .kpi-val { font-size: 1.2rem; }
  .modal-lg { max-width: 100%; border-radius: 12px 12px 0 0; }
  .hist-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .btn-label { display: none; }
}

/* ── @media print ────────────────────────────────────────────────────────── */
@media print {
  .mp-page { padding: 0; background: white; min-height: unset; }
  .mp-card-wrap { box-shadow: none; border-radius: 0; padding: 0; background: white; }
  .mp-header-actions, .mp-filters, .mp-main, .modal-overlay { display: none !important; }
  .mp-print-only { display: block !important; }

  .mp-print-header { margin-bottom: 1rem; }
  .mp-print-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
  .mp-print-header p { margin: .2rem 0 0; font-size: .8rem; color: #555; }

  .mp-print-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
  .mp-print-table th {
    background: #f3f4f6; padding: .4rem .5rem; text-align: left;
    font-weight: 600; border: 1px solid #d1d5db;
  }
  .mp-print-table td { padding: .35rem .5rem; border: 1px solid #e5e7eb; }
  .mp-print-table .print-row-low { background: #fee2e2; }
  .mp-print-table .print-row-warn { background: #fff7ed; }

  body { background: white !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>

<style>
[data-theme="dark"] .mp-card-wrap {
  background: rgba(13,18,35,0.82) !important;
  border-color: rgba(255,255,255,0.07) !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.55) !important;
}
[data-theme="dark"] .mp-title { color: #ffffff !important; }
[data-theme="dark"] .chart-label { color: rgba(255,255,255,0.55) !important; }
[data-theme="dark"] .kpi-green  { background: rgba(34,197,94,0.12) !important; }
[data-theme="dark"] .kpi-orange { background: rgba(249,115,22,0.12) !important; }
[data-theme="dark"] .kpi-red    { background: rgba(239,68,68,0.12)  !important; }
[data-theme="dark"] .kpi-green .kpi-val  { color: #86efac !important; }
[data-theme="dark"] .kpi-orange .kpi-val { color: #fdba74 !important; }
[data-theme="dark"] .kpi-red .kpi-val    { color: #fca5a5 !important; }
[data-theme="dark"] .kpi-label { color: rgba(255,255,255,0.45) !important; }
[data-theme="dark"] .kpi-sub   { color: rgba(255,255,255,0.3) !important; }

/* Dashboard derecho */
[data-theme="dark"] .mp-right {
  background: rgba(13,18,35,0.55) !important;
  border-color: rgba(255,255,255,0.07) !important;
}
[data-theme="dark"] .dash-title {
  color: rgba(255,255,255,0.75) !important;
  border-color: rgba(255,255,255,0.08) !important;
}

/* Filas de lista */
[data-theme="dark"] .mp-row {
  background: rgba(13,18,35,0.45) !important;
  border-color: rgba(255,255,255,0.07) !important;
}
[data-theme="dark"] .mp-row--low  { background: rgba(127,29,29,0.18) !important; border-color: rgba(239,68,68,0.2) !important; }
[data-theme="dark"] .mp-row--warn { background: rgba(120,53,15,0.18) !important; border-color: rgba(249,115,22,0.2) !important; }
[data-theme="dark"] .mp-row-name  { color: rgba(255,255,255,0.9) !important; }
[data-theme="dark"] .mp-row-stock { color: rgba(255,255,255,0.75) !important; }
[data-theme="dark"] .mp-row-price { color: rgba(255,255,255,0.4) !important; }

/* Filtros */
[data-theme="dark"] .mp-search,
[data-theme="dark"] .mp-select {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}

/* Botones de acción de fila */
[data-theme="dark"] .btn-entrada  { background: rgba(34,197,94,0.15)  !important; color: #86efac !important; }
[data-theme="dark"] .btn-salida   { background: rgba(239,68,68,0.15)  !important; color: #fca5a5 !important; }
[data-theme="dark"] .btn-historial{ background: rgba(99,102,241,0.15) !important; color: #a5b4fc !important; }
[data-theme="dark"] .btn-edit     { background: rgba(234,179,8,0.15)  !important; color: #fde68a !important; }
[data-theme="dark"] .btn-del      { background: rgba(239,68,68,0.15)  !important; color: #fca5a5 !important; }

/* Modales */
[data-theme="dark"] .modal-box {
  background: rgba(10,14,28,0.98) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  color: rgba(255,255,255,0.85) !important;
}
[data-theme="dark"] .modal-box h3 { color: rgba(255,255,255,0.95) !important; }
[data-theme="dark"] .mov-mp-name  { color: rgba(255,255,255,0.85) !important; }
[data-theme="dark"] .form-grid label { color: rgba(255,255,255,0.6) !important; }
[data-theme="dark"] .form-grid input,
[data-theme="dark"] .form-grid select {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}

/* Historial */
[data-theme="dark"] .hist-table th {
  background: rgba(13,18,35,0.75) !important;
  color: rgba(255,255,255,0.55) !important;
}
[data-theme="dark"] .hist-table td {
  color: rgba(255,255,255,0.8) !important;
  border-color: rgba(255,255,255,0.06) !important;
}
[data-theme="dark"] .badge-green { background: rgba(34,197,94,0.15) !important;  color: #86efac !important; }
[data-theme="dark"] .badge-red   { background: rgba(239,68,68,0.15) !important;  color: #fca5a5 !important; }

/* Botones ghost */
[data-theme="dark"] .btn-ghost {
  background: transparent !important;
  border-color: rgba(255,255,255,0.15) !important;
  color: rgba(255,255,255,0.7) !important;
}
[data-theme="dark"] .btn-ghost:hover { background: rgba(255,255,255,0.05) !important; }
</style>
