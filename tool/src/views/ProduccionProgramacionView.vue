<template>
  <div class="prog-page">
    <div class="prog-header">
      <h2 class="prog-title"><i class="bi bi-calendar3"></i> Programación de Producción</h2>
      <button class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> Nueva orden</button>
    </div>

    <!-- Filtros -->
    <div class="prog-filters">
      <select v-model="filterEstado" class="prog-select">
        <option value="">Todos los estados</option>
        <option value="programada">Programada</option>
        <option value="en_proceso">En proceso</option>
        <option value="completada">Completada</option>
        <option value="cancelada">Cancelada</option>
      </select>
      <input v-model="filterDesde" type="date" class="prog-input" title="Desde" />
      <input v-model="filterHasta" type="date" class="prog-input" title="Hasta" />
      <button class="btn-ghost btn-sm-filt" @click="clearFilters">Limpiar</button>
    </div>

    <div v-if="loading" class="prog-loading">Cargando…</div>
    <div v-else-if="ordenes.length === 0" class="prog-empty">Sin órdenes de producción.</div>

    <div v-else class="prog-kanban">
      <div v-for="col in columns" :key="col.estado" class="kanban-col">
        <div class="kanban-col-header">
          <span :class="['kanban-dot', `dot-${col.estado}`]"></span>
          {{ col.label }}
          <span class="kanban-count">{{ byEstado(col.estado).length }}</span>
        </div>
        <div class="kanban-items">
          <div v-if="byEstado(col.estado).length === 0" class="kanban-empty">—</div>
          <div v-for="o in byEstado(col.estado)" :key="o._id" class="orden-card">
            <div class="oc-top">
              <span class="oc-num">#{{ o.numero }}</span>
              <span :class="['oc-prio', `prio-${o.prioridad}`]">{{ o.prioridad }}</span>
            </div>
            <div class="oc-producto">{{ o.producto }}</div>
            <div v-if="o.color || o.terminacion" class="oc-meta">
              <span v-if="o.color" class="oc-tag">{{ o.color }}</span>
              <span v-if="o.terminacion" class="oc-tag">{{ o.terminacion }}</span>
            </div>
            <div class="oc-cantidad">{{ o.cantidad }} {{ o.unidad }}</div>
            <div class="oc-fecha">
              <i class="bi bi-calendar-event"></i>
              {{ formatDate(o.fechaProgramada) }}
            </div>
            <div v-if="o.formulaResina" class="oc-formula">
              <i class="bi bi-droplet"></i> {{ o.formulaResina?.nombre || '—' }}
            </div>
            <div class="oc-actions">
              <select class="oc-estado-sel" :value="o.estado" @change="changeEstado(o, $event.target.value)">
                <option value="programada">Programada</option>
                <option value="en_proceso">En proceso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <button class="btn-icon btn-edit" @click="openEdit(o)"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon btn-del" @click="confirmDelete(o)"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar orden -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-box">
        <h3>{{ editingId ? 'Editar orden' : 'Nueva orden de producción' }}</h3>

        <div class="form-grid">
          <label class="full-col">Producto *
            <input v-model="form.producto" placeholder="Nombre del producto" />
          </label>
          <label>Color
            <input v-model="form.color" placeholder="Ej: Blanco" />
          </label>
          <label>Terminación
            <input v-model="form.terminacion" placeholder="Ej: Brillante" />
          </label>
          <label>Tipo
            <input v-model="form.tipo" placeholder="Ej: Piso, Revestimiento" />
          </label>
          <label>Cantidad *
            <input v-model.number="form.cantidad" type="number" min="1" />
          </label>
          <label>Unidad
            <select v-model="form.unidad">
              <option value="kg">kg</option>
              <option value="lt">lt</option>
              <option value="unidades">unidades</option>
              <option value="m2">m²</option>
            </select>
          </label>
          <label>Fecha programada *
            <input v-model="form.fechaProgramada" type="date" />
          </label>
          <label>Prioridad
            <select v-model="form.prioridad">
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label class="full-col">Fórmula de resina
            <select v-model="form.formulaResina">
              <option value="">Sin fórmula</option>
              <option v-for="f in formulas" :key="f._id" :value="f._id">{{ f.nombre }}</option>
            </select>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const authCfg = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } })
const api = {
  get:    (path, cfg = {})       => axios.get(`${API_BASE_URL}${path}`, { ...authCfg(), ...cfg }),
  post:   (path, data, cfg = {}) => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data, cfg = {}) => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path, cfg = {})       => axios.delete(`${API_BASE_URL}${path}`, authCfg())
}

const ordenes  = ref([])
const formulas = ref([])
const loading  = ref(true)

const filterEstado = ref('')
const filterDesde  = ref('')
const filterHasta  = ref('')

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({
  producto: '', color: '', terminacion: '', tipo: '',
  cantidad: 1, unidad: 'unidades', fechaProgramada: '', prioridad: 'normal', formulaResina: ''
})

const columns = [
  { estado: 'programada',  label: 'Programada' },
  { estado: 'en_proceso',  label: 'En proceso' },
  { estado: 'completada',  label: 'Completada' },
  { estado: 'cancelada',   label: 'Cancelada'  }
]

function byEstado(estado) {
  return ordenes.value.filter(o => o.estado === estado)
}

function clearFilters() {
  filterEstado.value = ''
  filterDesde.value = ''
  filterHasta.value = ''
  load()
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (filterEstado.value) params.estado = filterEstado.value
    if (filterDesde.value)  params.desde  = filterDesde.value
    if (filterHasta.value)  params.hasta  = filterHasta.value
    const { data } = await api.get('/produccion/ordenes', { params })
    ordenes.value = data
  } finally {
    loading.value = false
  }
}

async function loadFormulas() {
  const { data } = await api.get('/formulas-resina')
  formulas.value = data
}

function openCreate() {
  editingId.value = null
  form.value = { producto: '', color: '', terminacion: '', tipo: '', cantidad: 1, unidad: 'unidades', fechaProgramada: todayStr(), prioridad: 'normal', formulaResina: '' }
  showForm.value = true
}

function openEdit(o) {
  editingId.value = o._id
  form.value = {
    producto: o.producto, color: o.color || '', terminacion: o.terminacion || '',
    tipo: o.tipo || '', cantidad: o.cantidad, unidad: o.unidad,
    fechaProgramada: o.fechaProgramada ? o.fechaProgramada.slice(0, 10) : '',
    prioridad: o.prioridad, formulaResina: o.formulaResina?._id || o.formulaResina || ''
  }
  showForm.value = true
}

function closeForm() { showForm.value = false }

async function saveForm() {
  if (!form.value.producto.trim() || !form.value.fechaProgramada) return
  savingForm.value = true
  try {
    const payload = { ...form.value }
    if (!payload.formulaResina) delete payload.formulaResina
    if (editingId.value) {
      await api.put(`/produccion/ordenes/${editingId.value}`, payload)
    } else {
      await api.post('/produccion/ordenes', payload)
    }
    await load()
    closeForm()
  } finally {
    savingForm.value = false
  }
}

async function confirmDelete(o) {
  if (!confirm(`¿Eliminar la orden #${o.numero}?`)) return
  await api.delete(`/produccion/ordenes/${o._id}`)
  ordenes.value = ordenes.value.filter(x => x._id !== o._id)
}

async function changeEstado(o, nuevoEstado) {
  await api.put(`/produccion/ordenes/${o._id}`, { estado: nuevoEstado })
  o.estado = nuevoEstado
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => { load(); loadFormulas() })
</script>

<style scoped>
.prog-page { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }

.prog-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
.prog-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; }

.prog-filters { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center; }
.prog-select, .prog-input { padding: .45rem .7rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; font-size: .9rem; }
.btn-ghost { background: transparent; border: 1px solid var(--border-color, #ddd); border-radius: 8px; padding: .45rem .875rem; cursor: pointer; color: inherit; }
.btn-sm-filt { font-size: .85rem; }

.prog-loading, .prog-empty { text-align: center; color: #888; padding: 2rem; }

/* Kanban */
.prog-kanban { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

.kanban-col { background: rgba(0,0,0,.03); border-radius: 12px; padding: .875rem; display: flex; flex-direction: column; gap: .625rem; min-height: 300px; }
.kanban-col-header {
  display: flex; align-items: center; gap: .45rem; font-weight: 700; font-size: .9rem;
  padding-bottom: .5rem; border-bottom: 2px solid rgba(0,0,0,.06);
}
.kanban-count { margin-left: auto; background: rgba(0,0,0,.1); border-radius: 20px; padding: 1px 7px; font-size: .75rem; }

.kanban-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-programada { background: #6366f1; }
.dot-en_proceso { background: #f59e0b; }
.dot-completada { background: #22c55e; }
.dot-cancelada  { background: #9ca3af; }

.kanban-items { display: flex; flex-direction: column; gap: .625rem; }
.kanban-empty { color: #aaa; font-size: .82rem; text-align: center; padding: .5rem; }

.orden-card {
  background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 10px; padding: .75rem; display: flex; flex-direction: column; gap: .4rem;
}
.oc-top { display: flex; align-items: center; justify-content: space-between; }
.oc-num { font-size: .75rem; font-weight: 700; color: #6b7280; }
.oc-prio { font-size: .65rem; font-weight: 700; padding: 2px 7px; border-radius: 20px; text-transform: uppercase; }
.prio-baja    { background: #f1f5f9; color: #64748b; }
.prio-normal  { background: #e0e7ff; color: #3730a3; }
.prio-alta    { background: #fef9c3; color: #92400e; }
.prio-urgente { background: #fee2e2; color: #991b1b; }

.oc-producto { font-weight: 700; font-size: .95rem; }
.oc-meta { display: flex; gap: .35rem; flex-wrap: wrap; }
.oc-tag { background: rgba(99,102,241,.1); color: #6366f1; font-size: .7rem; padding: 1px 7px; border-radius: 20px; }
.oc-cantidad { font-size: .82rem; color: #6b7280; }
.oc-fecha { font-size: .78rem; color: #6b7280; display: flex; align-items: center; gap: .3rem; }
.oc-formula { font-size: .75rem; color: #6366f1; display: flex; align-items: center; gap: .3rem; }
.oc-actions { display: flex; gap: .4rem; align-items: center; margin-top: .25rem; }
.oc-estado-sel { flex: 1; padding: .25rem .4rem; font-size: .75rem; border-radius: 6px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; }

.btn-icon { background: none; border: none; cursor: pointer; font-size: .82rem; padding: .2rem .35rem; border-radius: 5px; }
.btn-icon:hover { background: rgba(0,0,0,.07); }
.btn-edit { color: #6366f1; }
.btn-del  { color: #ef4444; }

/* Modal */
.btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.1rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: .4rem; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box { background: var(--card-bg, #fff); border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; color: inherit; }
.modal-box h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.form-grid label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; }
.form-grid input, .form-grid select { padding: .45rem .65rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; font-size: .9rem; }
.full-col { grid-column: 1 / -1; }
.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; }

@media (max-width: 900px) {
  .prog-kanban { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .prog-kanban { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
