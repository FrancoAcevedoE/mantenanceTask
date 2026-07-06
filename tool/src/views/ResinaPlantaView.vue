<template>
  <div class="res-page">
    <div class="res-header">
      <h2 class="res-title"><i class="bi bi-droplet-fill"></i> Planta de Resinas</h2>
      <button class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> Nueva fórmula</button>
    </div>

    <div v-if="loadingMp || loadingFormulas" class="res-loading">Cargando…</div>

    <div v-else class="res-layout">
      <!-- Lista de fórmulas -->
      <div class="formulas-panel">
        <h3 class="panel-title">Fórmulas guardadas</h3>
        <div v-if="formulas.length === 0" class="res-empty">Sin fórmulas. Creá la primera.</div>
        <div
          v-for="f in formulas"
          :key="f._id"
          :class="['formula-item', selectedFormula?._id === f._id ? 'formula-item--active' : '']"
          @click="selectFormula(f)"
        >
          <div class="fi-name">{{ f.nombre }}</div>
          <div class="fi-code">{{ f.codigo }}</div>
          <div class="fi-cost">${{ formatNum(f.costoTotal) }}</div>
          <div class="fi-actions">
            <button class="btn-icon btn-edit" @click.stop="openEdit(f)"><i class="bi bi-pencil"></i></button>
            <button class="btn-icon btn-del" @click.stop="confirmDelete(f)"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>

      <!-- Detalle de fórmula seleccionada -->
      <div class="formula-detail" v-if="selectedFormula">
        <div class="detail-header">
          <div>
            <div class="detail-name">{{ selectedFormula.nombre }}</div>
            <div class="detail-code">Código: {{ selectedFormula.codigo || '—' }}</div>
          </div>
          <div class="detail-cost-box">
            <span class="detail-cost-label">Costo total</span>
            <span class="detail-cost-val">${{ formatNum(selectedFormula.costoTotal) }}</span>
          </div>
        </div>

        <div v-if="selectedFormula.rendimiento" class="detail-rend">
          Rendimiento: <strong>{{ selectedFormula.rendimiento }} {{ selectedFormula.unidadRendimiento }}</strong>
        </div>

        <table class="ing-table">
          <thead>
            <tr>
              <th>Materia prima</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ing in selectedFormula.ingredientes" :key="ing._id">
              <td>{{ ing.materiaPrima?.nombre || '—' }}</td>
              <td>{{ ing.cantidad }}</td>
              <td>{{ ing.unidad || ing.materiaPrima?.unidad || '—' }}</td>
              <td>${{ formatNum(ing.materiaPrima?.precio) }}</td>
              <td>${{ formatNum((ing.materiaPrima?.precio || 0) * ing.cantidad) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="formula-detail formula-detail--empty">
        <i class="bi bi-droplet text-muted" style="font-size:3rem"></i>
        <p class="text-muted">Seleccioná una fórmula para ver el detalle</p>
      </div>
    </div>

    <!-- Modal crear/editar fórmula -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-box modal-lg">
        <h3>{{ editingId ? 'Editar fórmula' : 'Nueva fórmula de resina' }}</h3>

        <div class="form-row">
          <label>Nombre *
            <input v-model="form.nombre" placeholder="Ej: Resina Standard A" />
          </label>
          <label>Código
            <input v-model="form.codigo" placeholder="Ej: RST-001" />
          </label>
        </div>

        <div class="form-row">
          <label>Rendimiento
            <input v-model.number="form.rendimiento" type="number" min="0" placeholder="200" />
          </label>
          <label>Unidad rendimiento
            <select v-model="form.unidadRendimiento">
              <option value="kg">kg</option>
              <option value="lt">lt</option>
              <option value="unidades">unidades</option>
              <option value="m2">m²</option>
            </select>
          </label>
        </div>

        <div class="ing-section">
          <div class="ing-section-head">
            <span class="ing-section-title">Ingredientes</span>
            <button class="btn-add-ing" @click="addIngrediente"><i class="bi bi-plus-lg"></i> Agregar</button>
          </div>

          <div v-if="form.ingredientes.length === 0" class="res-empty">Agregá al menos un ingrediente.</div>

          <div v-for="(ing, idx) in form.ingredientes" :key="idx" class="ing-row">
            <label class="ing-label">Materia prima
              <select v-model="ing.materiaPrima" @change="autoFillUnidad(ing)">
                <option value="">— Seleccionar —</option>
                <option v-for="mp in materiasPrimas" :key="mp._id" :value="mp._id">
                  {{ mp.nombre }} ({{ mp.unidad }}) — ${{ formatNum(mp.precio) }}
                </option>
              </select>
            </label>
            <label class="ing-label ing-cant">Cantidad
              <input v-model.number="ing.cantidad" type="number" min="0" step="0.001" />
            </label>
            <label class="ing-label">Unidad
              <select v-model="ing.unidad">
                <option value="kg">kg</option>
                <option value="lt">lt</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="m">m</option>
                <option value="unidad">unidad</option>
              </select>
            </label>
            <div class="ing-subtotal">
              ${{ formatNum(getMpPrecio(ing.materiaPrima) * (ing.cantidad || 0)) }}
            </div>
            <button class="btn-remove-ing" @click="removeIngrediente(idx)"><i class="bi bi-x"></i></button>
          </div>

          <div class="costo-preview">
            Costo estimado: <strong>${{ formatNum(costoEstimado) }}</strong>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">Cancelar</button>
          <button class="btn-primary" :disabled="savingForm" @click="saveForm">
            {{ savingForm ? 'Guardando…' : 'Guardar fórmula' }}
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

const materiasPrimas = ref([])
const formulas       = ref([])
const loadingMp      = ref(true)
const loadingFormulas = ref(true)
const selectedFormula = ref(null)

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({
  nombre: '', codigo: '', rendimiento: null, unidadRendimiento: 'kg',
  ingredientes: []
})

const costoEstimado = computed(() =>
  form.value.ingredientes.reduce((sum, ing) => {
    return sum + getMpPrecio(ing.materiaPrima) * (ing.cantidad || 0)
  }, 0)
)

function getMpPrecio(id) {
  const mp = materiasPrimas.value.find(m => m._id === id)
  return mp?.precio || 0
}

function autoFillUnidad(ing) {
  const mp = materiasPrimas.value.find(m => m._id === ing.materiaPrima)
  if (mp) ing.unidad = mp.unidad
}

async function loadMp() {
  loadingMp.value = true
  try {
    const { data } = await api.get('/materias-primas')
    materiasPrimas.value = data
  } finally {
    loadingMp.value = false
  }
}

async function loadFormulas() {
  loadingFormulas.value = true
  try {
    const { data } = await api.get('/formulas-resina')
    formulas.value = data
  } finally {
    loadingFormulas.value = false
  }
}

function selectFormula(f) {
  selectedFormula.value = f
}

function openCreate() {
  editingId.value = null
  form.value = { nombre: '', codigo: '', rendimiento: null, unidadRendimiento: 'kg', ingredientes: [] }
  showForm.value = true
}

function openEdit(f) {
  editingId.value = f._id
  form.value = {
    nombre: f.nombre, codigo: f.codigo || '',
    rendimiento: f.rendimiento || null, unidadRendimiento: f.unidadRendimiento || 'kg',
    ingredientes: (f.ingredientes || []).map(i => ({
      materiaPrima: i.materiaPrima?._id || i.materiaPrima,
      cantidad: i.cantidad,
      unidad: i.unidad
    }))
  }
  showForm.value = true
}

function closeForm() { showForm.value = false }

function addIngrediente() {
  form.value.ingredientes.push({ materiaPrima: '', cantidad: 1, unidad: 'kg' })
}

function removeIngrediente(idx) {
  form.value.ingredientes.splice(idx, 1)
}

async function saveForm() {
  if (!form.value.nombre.trim()) return
  savingForm.value = true
  try {
    const payload = {
      ...form.value,
      ingredientes: form.value.ingredientes.filter(i => i.materiaPrima)
    }
    if (editingId.value) {
      const { data } = await api.put(`/formulas-resina/${editingId.value}`, payload)
      const idx = formulas.value.findIndex(f => f._id === editingId.value)
      if (idx !== -1) formulas.value[idx] = data
      if (selectedFormula.value?._id === editingId.value) selectedFormula.value = data
    } else {
      const { data } = await api.post('/formulas-resina', payload)
      formulas.value.push(data)
    }
    closeForm()
  } finally {
    savingForm.value = false
  }
}

async function confirmDelete(f) {
  if (!confirm(`¿Eliminar la fórmula "${f.nombre}"?`)) return
  await api.delete(`/formulas-resina/${f._id}`)
  formulas.value = formulas.value.filter(x => x._id !== f._id)
  if (selectedFormula.value?._id === f._id) selectedFormula.value = null
}

function formatNum(n) {
  return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => { loadMp(); loadFormulas() })
</script>

<style scoped>
.res-page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }

.res-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
.res-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; }
.res-loading { text-align: center; color: #888; padding: 3rem; }
.res-empty { color: #888; font-size: .9rem; padding: .75rem 0; }

.res-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }

/* Panel de fórmulas */
.formulas-panel { background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e0e0e0); border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.panel-title { font-weight: 700; font-size: .95rem; margin: 0 0 .5rem; }

.formula-item {
  border: 1px solid var(--border-color, #e5e7eb); border-radius: 9px; padding: .625rem .75rem;
  cursor: pointer; display: grid; grid-template-columns: 1fr auto; gap: .2rem .5rem;
  transition: background .15s;
}
.formula-item:hover { background: rgba(99,102,241,.06); }
.formula-item--active { background: rgba(99,102,241,.1); border-color: #6366f1; }

.fi-name { font-weight: 700; font-size: .9rem; grid-column: 1; }
.fi-code { font-size: .72rem; color: #888; grid-column: 1; }
.fi-cost { font-size: .82rem; color: #059669; font-weight: 700; grid-column: 2; align-self: center; }
.fi-actions { grid-column: 1 / -1; display: flex; gap: .4rem; margin-top: .25rem; }

.btn-icon { background: none; border: none; cursor: pointer; font-size: .85rem; padding: .2rem .35rem; border-radius: 5px; }
.btn-icon:hover { background: rgba(0,0,0,.07); }
.btn-edit { color: #6366f1; }
.btn-del  { color: #ef4444; }

/* Detalle */
.formula-detail {
  background: var(--card-bg, #fff); border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
}
.formula-detail--empty { align-items: center; justify-content: center; min-height: 200px; color: #9ca3af; }

.detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.detail-name { font-size: 1.15rem; font-weight: 700; }
.detail-code { font-size: .8rem; color: #888; }
.detail-cost-box { text-align: right; }
.detail-cost-label { font-size: .72rem; color: #888; display: block; }
.detail-cost-val { font-size: 1.4rem; font-weight: 700; color: #059669; }
.detail-rend { font-size: .88rem; color: #6b7280; }

.ing-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.ing-table th { background: rgba(99,102,241,.08); padding: .5rem .75rem; text-align: left; font-weight: 600; }
.ing-table td { padding: .45rem .75rem; border-bottom: 1px solid var(--border-color, #f0f0f0); }

/* Modal */
.btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: .5rem 1.1rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: .4rem; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid var(--border-color, #ddd); border-radius: 8px; padding: .5rem 1rem; cursor: pointer; color: inherit; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box { background: var(--card-bg, #fff); border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; color: inherit; }
.modal-box h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
.modal-lg { max-width: 740px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.form-row label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; }
.form-row input, .form-row select {
  padding: .45rem .65rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd);
  background: var(--input-bg, #fff); color: inherit; font-size: .9rem;
}

.ing-section { display: flex; flex-direction: column; gap: .625rem; }
.ing-section-head { display: flex; align-items: center; justify-content: space-between; }
.ing-section-title { font-weight: 700; font-size: .95rem; }
.btn-add-ing { background: rgba(99,102,241,.1); color: #6366f1; border: none; border-radius: 7px; padding: .3rem .7rem; cursor: pointer; font-size: .82rem; display: flex; align-items: center; gap: .3rem; }

.ing-row {
  display: grid; grid-template-columns: 1fr 90px 90px 70px 28px;
  gap: .5rem; align-items: flex-end;
  background: rgba(0,0,0,.02); padding: .5rem .625rem; border-radius: 8px;
}
.ing-label { display: flex; flex-direction: column; gap: .25rem; font-size: .78rem; font-weight: 600; }
.ing-label select, .ing-label input {
  padding: .35rem .5rem; border-radius: 7px; border: 1px solid var(--border-color, #ddd);
  background: var(--input-bg, #fff); color: inherit; font-size: .82rem;
}
.ing-subtotal { font-size: .82rem; font-weight: 700; color: #059669; align-self: flex-end; padding-bottom: .3rem; }
.btn-remove-ing { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; align-self: flex-end; padding: .2rem; }

.costo-preview { font-size: .95rem; text-align: right; color: #374151; padding: .25rem 0; }
.costo-preview strong { color: #059669; font-size: 1.05rem; }

.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; }

.text-muted { color: #9ca3af; }

@media (max-width: 768px) {
  .res-layout { grid-template-columns: 1fr; }
  .ing-row { grid-template-columns: 1fr 80px 32px; }
  .ing-label:nth-child(3), .ing-subtotal { display: none; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
