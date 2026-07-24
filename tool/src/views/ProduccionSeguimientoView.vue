<template>
  <div class="seg-page">
    <div class="seg-header">
      <h2 class="seg-title"><i class="bi bi-clipboard2-data"></i> Seguimiento de Producción</h2>
      <button class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> Nuevo registro</button>
    </div>

    <!-- Filtros -->
    <div class="seg-filters">
      <input v-model="filterDesde" type="date" class="seg-input" title="Desde" />
      <input v-model="filterHasta" type="date" class="seg-input" title="Hasta" />
      <input v-model="search" class="seg-search" placeholder="Buscar producto…" />
      <button class="btn-ghost btn-sm-filt" @click="loadRegistros">Buscar</button>
    </div>

    <div v-if="loading" class="seg-loading">Cargando…</div>
    <div v-else-if="registros.length === 0" class="seg-empty">Sin registros de producción.</div>

    <div v-else class="seg-list">
      <div v-for="r in filtered" :key="r._id" class="reg-card">
        <div class="reg-head">
          <div class="reg-producto">
            {{ r.producto }}
            <span v-if="r.color" class="reg-tag">{{ r.color }}</span>
            <span v-if="r.terminacion" class="reg-tag">{{ r.terminacion }}</span>
          </div>
          <div class="reg-meta-right">
            <span class="reg-fecha"><i class="bi bi-calendar3"></i> {{ formatDate(r.fecha) }}</span>
            <span v-if="r.turno" :class="['reg-turno', `turno-${r.turno}`]">{{ r.turno }}</span>
          </div>
        </div>

        <div class="reg-calidad">
          <div class="calidad-item calidad-primera">
            <span class="calidad-label">1ra calidad</span>
            <span class="calidad-val">{{ r.cantidadPrimera || 0 }}</span>
          </div>
          <div class="calidad-item calidad-segunda">
            <span class="calidad-label">2da calidad</span>
            <span class="calidad-val">{{ r.cantidadSegunda || 0 }}</span>
          </div>
          <div class="calidad-item calidad-desecho">
            <span class="calidad-label">Desecho</span>
            <span class="calidad-val">{{ r.cantidadDesecho || 0 }}</span>
          </div>
          <div class="calidad-item calidad-total">
            <span class="calidad-label">Total</span>
            <span class="calidad-val">{{ (r.cantidadPrimera||0)+(r.cantidadSegunda||0)+(r.cantidadDesecho||0) }}</span>
          </div>
        </div>

        <div v-if="r.ordenProduccion" class="reg-orden">
          <i class="bi bi-clipboard-check"></i> Orden #{{ r.ordenProduccion?.numero || r.ordenProduccion }}
        </div>

        <div v-if="r.formulaResina" class="reg-formula">
          <i class="bi bi-droplet"></i> {{ r.formulaResina?.nombre || '—' }}
        </div>

        <div v-if="r.observacionCalidad" class="reg-obs">
          <i class="bi bi-chat-left-text"></i> {{ r.observacionCalidad }}
        </div>

        <div v-if="r.comentarios" class="reg-coment">
          <i class="bi bi-chat-right-dots"></i> {{ r.comentarios }}
        </div>

        <div class="reg-footer">
          <span class="reg-operario"><i class="bi bi-person"></i> {{ r.operario || '—' }}</span>
          <div class="reg-actions">
            <button class="btn-icon btn-edit" @click="openEdit(r)"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon btn-del" @click="confirmDelete(r)"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-box modal-lg">
        <h3>{{ editingId ? 'Editar registro' : 'Nuevo registro de producción' }}</h3>

        <!-- Producto -->
        <fieldset class="form-section">
          <legend>Producto</legend>
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
              <input v-model="form.tipo" placeholder="Ej: Piso" />
            </label>
            <label>Espesor
              <input v-model="form.espesor" placeholder="Ej: 6mm" />
            </label>
          </div>
        </fieldset>

        <!-- Cantidades y calidad -->
        <fieldset class="form-section">
          <legend>Calidad y cantidades</legend>
          <div class="form-grid">
            <label>Cantidad programada
              <input v-model.number="form.cantidadProgramada" type="number" min="0" />
            </label>
            <label>1ra calidad *
              <input v-model.number="form.cantidadPrimera" type="number" min="0" class="input-primera" />
            </label>
            <label>2da calidad
              <input v-model.number="form.cantidadSegunda" type="number" min="0" class="input-segunda" />
            </label>
            <label>Desecho
              <input v-model.number="form.cantidadDesecho" type="number" min="0" class="input-desecho" />
            </label>
          </div>
          <div class="calidad-obs-label">Observación de calidad</div>
          <textarea v-model="form.observacionCalidad" rows="2" class="form-textarea" placeholder="Ej: Manchas en la superficie, impurezas…"></textarea>
        </fieldset>

        <!-- Producción -->
        <fieldset class="form-section">
          <legend>Datos de producción</legend>
          <div class="form-grid">
            <label>Fecha *
              <input v-model="form.fecha" type="date" />
            </label>
            <label>Turno
              <select v-model="form.turno">
                <option value="">Sin turno</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </select>
            </label>
            <label class="full-col">Fórmula de resina
              <select v-model="form.formulaResina">
                <option value="">Sin fórmula</option>
                <option v-for="f in formulas" :key="f._id" :value="f._id">{{ f.nombre }}</option>
              </select>
            </label>
            <label class="full-col">Orden de producción (opcional)
              <select v-model="form.ordenProduccion">
                <option value="">Sin orden asociada</option>
                <option v-for="o in ordenesAbiertas" :key="o._id" :value="o._id">
                  #{{ o.numero }} — {{ o.producto }} ({{ o.estado }})
                </option>
              </select>
            </label>
          </div>
        </fieldset>

        <label class="form-standalone-label">Comentarios
          <textarea v-model="form.comentarios" rows="2" class="form-textarea" placeholder="Notas adicionales…"></textarea>
        </label>

        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">Cancelar</button>
          <button class="btn-primary" :disabled="savingForm" @click="saveForm">
            {{ savingForm ? 'Guardando…' : 'Guardar registro' }}
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
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const authCfg = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } })
const api = {
  get:    (path, cfg = {})       => axios.get(`${API_BASE_URL}${path}`, { ...authCfg(), ...cfg }),
  post:   (path, data, cfg = {}) => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data, cfg = {}) => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path, cfg = {})       => axios.delete(`${API_BASE_URL}${path}`, authCfg())
}

const registros = ref([])
const formulas  = ref([])
const ordenes   = ref([])
const loading   = ref(true)

const search      = ref('')
const filterDesde = ref('')
const filterHasta = ref('')

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({
  producto: '', color: '', terminacion: '', tipo: '', espesor: '',
  cantidadProgramada: 0, cantidadPrimera: 0, cantidadSegunda: 0, cantidadDesecho: 0,
  observacionCalidad: '', fecha: '', turno: '', formulaResina: '', ordenProduccion: '',
  comentarios: ''
})

const ordenesAbiertas = computed(() =>
  ordenes.value.filter(o => o.estado === 'programada' || o.estado === 'en_proceso')
)

const filtered = computed(() => {
  if (!search.value.trim()) return registros.value
  const q = search.value.trim().toLowerCase()
  return registros.value.filter(r =>
    r.producto?.toLowerCase().includes(q) ||
    r.color?.toLowerCase().includes(q) ||
    r.terminacion?.toLowerCase().includes(q)
  )
})

async function loadRegistros() {
  loading.value = true
  try {
    const params = {}
    if (filterDesde.value) params.desde = filterDesde.value
    if (filterHasta.value) params.hasta = filterHasta.value
    const { data } = await api.get('/produccion/registros', { params })
    registros.value = data
  } finally {
    loading.value = false
  }
}

async function loadFormulas() {
  const { data } = await api.get('/formulas-resina')
  formulas.value = data
}

async function loadOrdenes() {
  const { data } = await api.get('/produccion/ordenes')
  ordenes.value = data
}

function openCreate() {
  editingId.value = null
  form.value = {
    producto: '', color: '', terminacion: '', tipo: '', espesor: '',
    cantidadProgramada: 0, cantidadPrimera: 0, cantidadSegunda: 0, cantidadDesecho: 0,
    observacionCalidad: '', fecha: todayStr(), turno: '', formulaResina: '', ordenProduccion: '',
    comentarios: ''
  }
  showForm.value = true
}

function openEdit(r) {
  editingId.value = r._id
  form.value = {
    producto: r.producto, color: r.color || '', terminacion: r.terminacion || '',
    tipo: r.tipo || '', espesor: r.espesor || '',
    cantidadProgramada: r.cantidadProgramada || 0,
    cantidadPrimera: r.cantidadPrimera || 0,
    cantidadSegunda: r.cantidadSegunda || 0,
    cantidadDesecho: r.cantidadDesecho || 0,
    observacionCalidad: r.observacionCalidad || '',
    fecha: r.fecha ? r.fecha.slice(0, 10) : '',
    turno: r.turno || '',
    formulaResina: r.formulaResina?._id || r.formulaResina || '',
    ordenProduccion: r.ordenProduccion?._id || r.ordenProduccion || '',
    comentarios: r.comentarios || ''
  }
  showForm.value = true
}

function closeForm() { showForm.value = false }

async function saveForm() {
  if (!form.value.producto.trim() || !form.value.fecha) return
  savingForm.value = true
  try {
    const payload = { ...form.value }
    if (!payload.formulaResina)  delete payload.formulaResina
    if (!payload.ordenProduccion) delete payload.ordenProduccion
    if (editingId.value) {
      await api.put(`/produccion/registros/${editingId.value}`, payload)
    } else {
      await api.post('/produccion/registros', payload)
    }
    await loadRegistros()
    closeForm()
  } finally {
    savingForm.value = false
  }
}

const { askPassword } = usePasswordConfirm()

async function confirmDelete(r) {
  if (!confirm(`¿Eliminar el registro de "${r.producto}"?`)) return
  try { await askPassword() } catch { return }
  await api.delete(`/produccion/registros/${r._id}`)
  registros.value = registros.value.filter(x => x._id !== r._id)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => { loadRegistros(); loadFormulas(); loadOrdenes() })
</script>

<style scoped>
.seg-page { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }

.seg-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
.seg-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; }

.seg-filters { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center; }
.seg-input, .seg-search { padding: .45rem .7rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; font-size: .9rem; }
.seg-search { flex: 1; min-width: 180px; }
.btn-ghost { background: transparent; border: 1px solid var(--border-color, #ddd); border-radius: 8px; padding: .45rem .875rem; cursor: pointer; color: inherit; }
.btn-sm-filt { font-size: .85rem; }

.seg-loading, .seg-empty { text-align: center; color: #888; padding: 2rem; }

.seg-list { display: flex; flex-direction: column; gap: 1rem; }

.reg-card {
  background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .625rem;
}

.reg-head { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; flex-wrap: wrap; }
.reg-producto { font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
.reg-tag { background: rgba(99,102,241,.1); color: #6366f1; font-size: .7rem; padding: 2px 7px; border-radius: 20px; }
.reg-meta-right { display: flex; align-items: center; gap: .625rem; }
.reg-fecha { font-size: .8rem; color: #6b7280; display: flex; align-items: center; gap: .3rem; }
.reg-turno { font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: capitalize; }
.turno-mañana { background: #fef9c3; color: #92400e; }
.turno-tarde  { background: #fed7aa; color: #9a3412; }
.turno-noche  { background: #e0e7ff; color: #3730a3; }

.reg-calidad { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
.calidad-item { border-radius: 9px; padding: .5rem .75rem; text-align: center; }
.calidad-primera { background: #d1fae5; }
.calidad-segunda { background: #fef9c3; }
.calidad-desecho { background: #fee2e2; }
.calidad-total   { background: rgba(99,102,241,.1); }
.calidad-label { font-size: .68rem; color: #6b7280; display: block; font-weight: 600; }
.calidad-val   { font-size: 1.2rem; font-weight: 800; display: block; }
.calidad-primera .calidad-val { color: #065f46; }
.calidad-segunda .calidad-val { color: #92400e; }
.calidad-desecho .calidad-val { color: #991b1b; }
.calidad-total   .calidad-val { color: #3730a3; }

.reg-orden, .reg-formula, .reg-obs, .reg-coment {
  font-size: .82rem; color: #6b7280; display: flex; align-items: flex-start; gap: .35rem;
}
.reg-obs { color: #374151; font-style: italic; }

.reg-footer { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding-top: .25rem; border-top: 1px solid var(--border-color, #f0f0f0); }
.reg-operario { font-size: .8rem; color: #9ca3af; display: flex; align-items: center; gap: .3rem; }
.reg-actions { display: flex; gap: .4rem; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: .85rem; padding: .25rem .4rem; border-radius: 5px; }
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
.modal-lg { max-width: 680px; }

.form-section { border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; padding: .875rem 1rem; display: flex; flex-direction: column; gap: .75rem; }
.form-section legend { font-size: .82rem; font-weight: 700; padding: 0 .4rem; color: #6366f1; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .625rem; }
.form-grid label { display: flex; flex-direction: column; gap: .25rem; font-size: .83rem; font-weight: 600; }
.form-grid input, .form-grid select { padding: .4rem .6rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; font-size: .88rem; }
.input-primera { border-color: #6ee7b7 !important; }
.input-segunda  { border-color: #fcd34d !important; }
.input-desecho  { border-color: #fca5a5 !important; }
.full-col { grid-column: 1 / -1; }

.calidad-obs-label { font-size: .83rem; font-weight: 600; }
.form-textarea { width: 100%; padding: .45rem .65rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; font-size: .9rem; resize: vertical; box-sizing: border-box; }

.form-standalone-label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; }
.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; }

@media (max-width: 600px) {
  .reg-calidad { grid-template-columns: 1fr 1fr; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
