<template>
  <div class="mp-page">
    <div class="mp-header">
      <h2 class="mp-title"><i class="bi bi-boxes"></i> Stock de Materias Primas</h2>
      <button class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> Nueva materia prima</button>
    </div>

    <div class="mp-filters">
      <input v-model="search" class="mp-search" placeholder="Buscar por nombre o categoría…" />
      <select v-model="filterCat" class="mp-select">
        <option value="">Todas las categorías</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div v-if="loading" class="mp-loading">Cargando…</div>
    <div v-else-if="filtered.length === 0" class="mp-empty">Sin resultados.</div>

    <div v-else class="mp-grid">
      <div
        v-for="mp in filtered"
        :key="mp._id"
        :class="['mp-card', mp.stock <= mp.stockMinimo ? 'mp-card--low' : '']"
      >
        <div class="mp-card-head">
          <span class="mp-card-name">{{ mp.nombre }}</span>
          <span class="mp-card-cat">{{ mp.categoria }}</span>
        </div>
        <div class="mp-card-body">
          <div class="mp-stat">
            <span class="mp-stat-label">Stock</span>
            <span :class="['mp-stat-val', mp.stock <= mp.stockMinimo ? 'mp-low' : '']">
              {{ mp.stock }} {{ mp.unidad }}
            </span>
          </div>
          <div class="mp-stat">
            <span class="mp-stat-label">Mínimo</span>
            <span class="mp-stat-val">{{ mp.stockMinimo }} {{ mp.unidad }}</span>
          </div>
          <div class="mp-stat">
            <span class="mp-stat-label">Precio unitario</span>
            <span class="mp-stat-val">${{ formatNum(mp.precio) }}</span>
          </div>
          <div v-if="mp.proveedor" class="mp-stat">
            <span class="mp-stat-label">Proveedor</span>
            <span class="mp-stat-val mp-prov">{{ mp.proveedor?.nombre || mp.proveedor }}</span>
          </div>
        </div>
        <div class="mp-card-actions">
          <button class="btn-sm btn-entrada" @click="openMovimiento(mp, 'entrada')">
            <i class="bi bi-arrow-down-circle"></i> Entrada
          </button>
          <button class="btn-sm btn-salida" @click="openMovimiento(mp, 'salida')">
            <i class="bi bi-arrow-up-circle"></i> Salida
          </button>
          <button class="btn-sm btn-historial" @click="openHistorial(mp)">
            <i class="bi bi-clock-history"></i>
          </button>
          <button class="btn-sm btn-edit" @click="openEdit(mp)">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-sm btn-del" @click="confirmDelete(mp)">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const authCfg = (extra = {}) => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }, ...extra })
const api = {
  get:    (path, cfg = {})       => axios.get(`${API_BASE_URL}${path}`, { ...authCfg(), ...cfg }),
  post:   (path, data, cfg = {}) => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data, cfg = {}) => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path, cfg = {})       => axios.delete(`${API_BASE_URL}${path}`, authCfg())
}

const items    = ref([])
const loading  = ref(true)
const search   = ref('')
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

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/materias-primas')
    items.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

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

onMounted(load)
</script>

<style scoped>
.mp-page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }

.mp-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem;
  margin-bottom: 1.25rem;
}
.mp-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; }

.mp-filters { display: flex; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.mp-search { flex: 1; min-width: 200px; padding: .5rem .75rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; }
.mp-select { padding: .5rem .75rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; }

.mp-loading, .mp-empty { text-align: center; color: #888; padding: 2rem; }

.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.mp-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  padding: 1rem;
  display: flex; flex-direction: column; gap: .75rem;
  transition: box-shadow .2s;
}
.mp-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
.mp-card--low { border-color: #f87171; background: rgba(239,68,68,.04); }

.mp-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; }
.mp-card-name { font-weight: 700; font-size: 1rem; }
.mp-card-cat { font-size: .7rem; background: rgba(99,102,241,.12); color: #6366f1; padding: 2px 8px; border-radius: 20px; }

.mp-card-body { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.mp-stat { display: flex; flex-direction: column; gap: 2px; }
.mp-stat-label { font-size: .7rem; color: #888; }
.mp-stat-val { font-size: .9rem; font-weight: 600; }
.mp-low { color: #ef4444; }
.mp-prov { font-size: .82rem; color: #6366f1; }

.mp-card-actions { display: flex; gap: .5rem; flex-wrap: wrap; }

.btn-sm {
  padding: .3rem .6rem; border: none; border-radius: 7px; cursor: pointer;
  font-size: .78rem; display: flex; align-items: center; gap: .3rem;
  transition: opacity .15s;
}
.btn-sm:hover { opacity: .85; }
.btn-entrada  { background: #d1fae5; color: #065f46; }
.btn-salida   { background: #fee2e2; color: #991b1b; }
.btn-historial{ background: #e0e7ff; color: #3730a3; }
.btn-edit     { background: #fef9c3; color: #713f12; }
.btn-del      { background: #fee2e2; color: #7f1d1d; margin-left: auto; }

.btn-primary {
  background: #6366f1; color: #fff; border: none; border-radius: 8px;
  padding: .5rem 1.1rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: .4rem;
  transition: background .15s;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-primary.btn-danger { background: #ef4444; }
.btn-primary.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-ghost {
  background: transparent; border: 1px solid var(--border-color, #ddd); border-radius: 8px;
  padding: .5rem 1rem; cursor: pointer; color: inherit;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-box {
  background: var(--card-bg, #fff); border-radius: 14px; padding: 1.5rem;
  width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1rem; color: inherit;
}
.modal-box h3 { margin: 0; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; }
.modal-sm { max-width: 380px; }
.modal-lg { max-width: 780px; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: .75rem;
}
.form-grid label {
  display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600;
}
.form-grid input, .form-grid select {
  padding: .45rem .65rem; border-radius: 8px;
  border: 1px solid var(--border-color, #ddd);
  background: var(--input-bg, #fff); color: inherit; font-size: .9rem;
}

.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }

.mov-mp-name { font-weight: 700; font-size: 1rem; margin: -.25rem 0 .25rem; }
.text-green { color: #22c55e; }
.text-red   { color: #ef4444; }

.hist-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.hist-table th { background: rgba(99,102,241,.1); padding: .5rem .75rem; text-align: left; }
.hist-table td { padding: .45rem .75rem; border-bottom: 1px solid var(--border-color, #eee); }

.badge { padding: 2px 8px; border-radius: 20px; font-size: .72rem; font-weight: 700; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-red   { background: #fee2e2; color: #991b1b; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
