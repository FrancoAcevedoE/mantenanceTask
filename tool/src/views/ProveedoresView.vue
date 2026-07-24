<template>
  <div class="prov-page">
    <div class="prov-card-wrap">
    <div class="prov-header">
      <h2 class="prov-title"><i class="bi bi-truck"></i> {{ t.title }}</h2>
      <div class="prov-header-actions">
        <button v-if="isAdmin" class="btn-config" @click="openConfig">
          <i class="bi bi-sliders"></i> Criterios de calificación
        </button>
        <button v-if="canManageCompras" class="btn-primary" @click="openCreate">
          <i class="bi bi-plus-lg"></i> {{ t.btnNew }}
        </button>
      </div>
    </div>

    <div class="prov-filters">
      <input v-model="search" class="prov-search" :placeholder="t.search" />
    </div>

    <div v-if="loading" class="prov-loading">{{ t.loading }}</div>
    <div v-else-if="filtered.length === 0" class="prov-empty">{{ t.empty }}</div>

    <div v-else class="prov-list">
      <div v-for="p in filtered" :key="p._id" class="prov-card">
        <div class="prov-card-top">
          <div>
            <div class="prov-name">{{ p.nombre }}</div>
            <div v-if="p.razonSocial" class="prov-razon">{{ p.razonSocial }}</div>
            <div v-if="latestCalif(p)" class="prov-grade-row">
              <span :class="['prov-grade-badge', `grade-${overallGrade(latestCalif(p))}`]">
                {{ overallGrade(latestCalif(p)) }}
              </span>
              <span class="prov-grade-label">Calificación</span>
            </div>
          </div>
        </div>

        <div class="prov-info-grid">
          <span v-if="p.cuit" class="prov-info-item"><i class="bi bi-credit-card"></i> CUIT: {{ p.cuit }}</span>
          <span v-if="p.telefono" class="prov-info-item"><i class="bi bi-telephone"></i> {{ p.telefono }}</span>
          <span v-if="p.email" class="prov-info-item"><i class="bi bi-envelope"></i> {{ p.email }}</span>
          <span v-if="p.categoria" class="prov-cat-badge">{{ p.categoria }}</span>
          <span v-if="p.perfil" class="prov-cat-badge prov-cat-badge--perfil">{{ p.perfil }}</span>
          <span v-if="p.criticidad" class="prov-cat-badge prov-cat-badge--crit">{{ p.criticidad }}</span>
        </div>

        <div class="prov-card-actions">
          <button v-if="isAdmin" class="btn-sm btn-eval" @click="openCalif(p)">
            <i class="bi bi-clipboard-check"></i> Evaluar
          </button>
          <button v-if="isAdmin && p.calificaciones?.length" class="btn-sm btn-hist" @click="openCalifHist(p)">
            <i class="bi bi-card-checklist"></i> Historial ({{ p.calificaciones.length }})
          </button>
          <button v-if="canManageCompras" class="btn-sm btn-edit" @click="openEdit(p)"><i class="bi bi-pencil"></i></button>
          <button v-if="canManageCompras" class="btn-sm btn-del" @click="confirmDelete(p)"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
    </div><!-- /prov-card-wrap -->

    <!-- Modal crear/editar proveedor -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-box">
        <h3>{{ editingId ? t.modalEdit : t.modalCreate }}</h3>
        <div class="form-grid">
          <label>{{ t.fNombre }}
            <input v-model="form.nombre" :placeholder="t.phNombre" />
          </label>
          <label>{{ t.fRazon }}
            <input v-model="form.razonSocial" :placeholder="t.fRazon" />
          </label>
          <label>{{ t.fCuit }}
            <input v-model="form.cuit" placeholder="20-12345678-9" />
          </label>
          <label>{{ t.fCategoria }}
            <input v-model="form.categoria" :placeholder="t.phCategoria" />
          </label>
          <label>Perfil ISO
            <select v-model="form.perfil">
              <option value="">— Sin clasificar —</option>
              <option value="Internacional">Internacional</option>
              <option value="Local Insumos">Local Insumos</option>
              <option value="Servicios/Fletes">Servicios/Fletes</option>
            </select>
          </label>
          <label>Criticidad
            <select v-model="form.criticidad">
              <option value="">— Sin clasificar —</option>
              <option value="Alta (Tipo A)">Alta (Tipo A)</option>
              <option value="Media (Tipo B)">Media (Tipo B)</option>
              <option value="Baja (Tipo C)">Baja (Tipo C)</option>
            </select>
          </label>
          <label>{{ t.fContacto }}
            <input v-model="form.contacto" :placeholder="t.phContacto" />
          </label>
          <label>{{ t.fTelefono }}
            <input v-model="form.telefono" placeholder="+54 9 …" />
          </label>
          <label class="full-col">{{ t.fEmail }}
            <input v-model="form.email" type="email" placeholder="correo@empresa.com" />
          </label>
          <label class="full-col">{{ t.fDireccion }}
            <input v-model="form.direccion" :placeholder="t.phDireccion" />
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeForm">{{ t.btnCancel }}</button>
          <button class="btn-primary" :disabled="savingForm" @click="saveForm">
            {{ savingForm ? t.btnSaving : t.btnSave }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal configuración de criterios globales -->
    <div v-if="showConfig" class="modal-overlay" @click.self="showConfig = false">
      <div class="modal-box modal-sm">
        <h3><i class="bi bi-sliders"></i> Criterios de calificación</h3>
        <p class="config-desc">Estos criterios se aplican a todos los proveedores al evaluar.</p>

        <div class="calif-criterios">
          <div v-if="!configForm.length" class="calif-empty-hint">
            Sin criterios. Agregá uno para empezar.
          </div>
          <div v-for="(cr, i) in configForm" :key="i" class="calif-row">
            <input v-model="cr.nombre" placeholder="Ej: Cumplimiento, Precio…" class="calif-input" />
            <button class="btn-rm-cr" type="button" @click="configForm.splice(i, 1)">
              <i class="bi bi-x"></i>
            </button>
          </div>
          <button class="btn-add-cr" type="button" @click="configForm.push({ nombre: '' })">
            <i class="bi bi-plus"></i> Agregar criterio
          </button>
        </div>

        <div class="modal-actions">
          <button class="btn-ghost" @click="showConfig = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingConfig" @click="saveConfig">
            {{ savingConfig ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal evaluar proveedor (A/B/C) -->
    <div v-if="showCalif" class="modal-overlay" @click.self="showCalif = false">
      <div class="modal-box modal-sm">
        <h3><i class="bi bi-clipboard-check"></i> Evaluar — {{ califItem?.nombre }}</h3>

        <div v-if="!califForm.criterios.length" class="calif-empty-hint">
          No hay criterios configurados. Configuralos desde "Criterios de calificación".
        </div>
        <div v-else class="calif-criterios">
          <div v-for="(cr, i) in califForm.criterios" :key="i" class="calif-row">
            <span class="calif-label-fixed">{{ cr.nombre }}</span>
            <div class="grade-picker">
              <button
                v-for="g in ['A','B','C']"
                :key="g"
                :class="['grade-btn', `grade-btn--${g}`, { active: cr.valor === g }]"
                type="button"
                @click="cr.valor = g"
              >{{ g }}</button>
            </div>
          </div>
        </div>

        <label class="eval-comment-label">Comentario
          <textarea v-model="califForm.comentario" rows="3" placeholder="Observaciones…"></textarea>
        </label>

        <div class="modal-actions">
          <button class="btn-ghost" @click="showCalif = false">{{ t.btnCancel }}</button>
          <button class="btn-primary" :disabled="savingCalif || !califForm.criterios.length" @click="saveCalif">
            {{ savingCalif ? t.btnSaving : 'Guardar evaluación' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal historial de evaluaciones -->
    <div v-if="showCalifHist" class="modal-overlay" @click.self="showCalifHist = false">
      <div class="modal-box modal-lg">
        <h3><i class="bi bi-card-checklist"></i> Historial — {{ califHistItem?.nombre }}</h3>
        <div v-if="!califHistItem?.calificaciones?.length" class="prov-empty">Sin evaluaciones aún.</div>
        <div v-else class="eval-hist-list">
          <div v-for="cal in califHistItem.calificaciones.slice().reverse()" :key="cal._id" class="eval-hist-card">
            <div class="eval-hist-head">
              <span :class="['prov-grade-badge', `grade-${overallGrade(cal)}`]">{{ overallGrade(cal) }}</span>
              <span class="eval-hist-date">{{ formatDate(cal.fecha) }}</span>
              <span v-if="cal.usuario" class="eval-hist-user">{{ cal.usuario }}</span>
              <button class="btn-del-ev" @click="deleteCalif(califHistItem, cal._id)" title="Eliminar">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <div class="calif-hist-criterios">
              <span v-for="cr in cal.criterios" :key="cr.nombre" class="calif-hist-crit">
                <span class="eval-label-sm">{{ cr.nombre }}</span>
                <span :class="['grade-badge-sm', `grade-${cr.valor}`]">{{ cr.valor }}</span>
              </span>
            </div>
            <p v-if="cal.comentario" class="eval-hist-comment">{{ cal.comentario }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showCalifHist = false">{{ t.btnClose }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { usePermissions } from '@/utils/permissions'
import { useLocale } from '@/composables/useLocale'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const { locale } = useLocale()
const { askPassword } = usePasswordConfirm()
const { canManageCompras, isAdmin } = usePermissions()

const TRANSLATIONS = {
  es: {
    title: 'Proveedores', btnNew: 'Nuevo proveedor',
    search: 'Buscar por nombre, CUIT, categoría…',
    loading: 'Cargando…', empty: 'Sin proveedores registrados.',
    modalCreate: 'Nuevo proveedor', modalEdit: 'Editar proveedor',
    fNombre: 'Nombre *', phNombre: 'Nombre comercial',
    fRazon: 'Razón social', fCuit: 'CUIT',
    fCategoria: 'Categoría', phCategoria: 'Ej: Químicos, Envases…',
    fContacto: 'Contacto', phContacto: 'Nombre del contacto',
    fTelefono: 'Teléfono', fEmail: 'Email',
    fDireccion: 'Dirección', phDireccion: 'Calle, ciudad…',
    btnCancel: 'Cancelar', btnSave: 'Guardar', btnSaving: 'Guardando…',
    btnClose: 'Cerrar',
    delTitle: '¿Eliminar proveedor?',
    delMsg: (name) => `Se eliminará "${name}". Esta acción no se puede deshacer.`,
    delBtn: 'Eliminar',
  },
  pt: {
    title: 'Fornecedores', btnNew: 'Novo fornecedor',
    search: 'Pesquisar por nome, CNPJ, categoria…',
    loading: 'Carregando…', empty: 'Sem fornecedores registrados.',
    modalCreate: 'Novo fornecedor', modalEdit: 'Editar fornecedor',
    fNombre: 'Nome *', phNombre: 'Nome comercial',
    fRazon: 'Razão social', fCuit: 'CNPJ',
    fCategoria: 'Categoria', phCategoria: 'Ex: Químicos, Embalagens…',
    fContacto: 'Contato', phContacto: 'Nome do contato',
    fTelefono: 'Telefone', fEmail: 'E-mail',
    fDireccion: 'Endereço', phDireccion: 'Rua, cidade…',
    btnCancel: 'Cancelar', btnSave: 'Salvar', btnSaving: 'Salvando…',
    btnClose: 'Fechar',
    delTitle: 'Excluir fornecedor?',
    delMsg: (name) => `O fornecedor "${name}" será excluído. Esta ação não pode ser desfeita.`,
    delBtn: 'Excluir',
  },
}
const t = computed(() => TRANSLATIONS[locale.value] || TRANSLATIONS.es)

const authCfg = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } })
const api = {
  get:    (path) => axios.get(`${API_BASE_URL}${path}`, authCfg()),
  post:   (path, data) => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data) => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path) => axios.delete(`${API_BASE_URL}${path}`, authCfg()),
}

const items   = ref([])
const loading = ref(true)
const search  = ref('')

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({ nombre: '', razonSocial: '', cuit: '', categoria: '', perfil: '', criticidad: '', contacto: '', telefono: '', email: '', direccion: '' })

// ── Configuración global de criterios ────────────────────────────────────────
const globalCriterios = ref([])
const showConfig      = ref(false)
const savingConfig    = ref(false)
const configForm      = ref([])

async function loadConfig() {
  try {
    const { data } = await api.get('/proveedores-config')
    globalCriterios.value = data.criterios || []
  } catch { /* sin criterios */ }
}

function openConfig() {
  configForm.value = globalCriterios.value.map(c => ({ nombre: c.nombre }))
  showConfig.value = true
}

async function saveConfig() {
  savingConfig.value = true
  try {
    const { data } = await api.put('/proveedores-config', {
      criterios: configForm.value.filter(c => c.nombre.trim())
    })
    globalCriterios.value = data.criterios || []
    showConfig.value = false
  } finally {
    savingConfig.value = false
  }
}

// ── Evaluaciones A/B/C ───────────────────────────────────────────────────────
const showCalif     = ref(false)
const califItem     = ref(null)
const savingCalif   = ref(false)
const califForm     = ref({ criterios: [], comentario: '' })
const showCalifHist = ref(false)
const califHistItem = ref(null)

const filtered = computed(() => {
  if (!search.value.trim()) return items.value
  const q = search.value.trim().toLowerCase()
  return items.value.filter(p =>
    p.nombre?.toLowerCase().includes(q) ||
    p.razonSocial?.toLowerCase().includes(q) ||
    p.cuit?.toLowerCase().includes(q) ||
    p.categoria?.toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/proveedores')
    items.value = data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = { nombre: '', razonSocial: '', cuit: '', categoria: '', perfil: '', criticidad: '', contacto: '', telefono: '', email: '', direccion: '' }
  showForm.value = true
}

function openEdit(p) {
  editingId.value = p._id
  form.value = { nombre: p.nombre, razonSocial: p.razonSocial || '', cuit: p.cuit || '', categoria: p.categoria || '', perfil: p.perfil || '', criticidad: p.criticidad || '', contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' }
  showForm.value = true
}

function closeForm() { showForm.value = false }

async function saveForm() {
  if (!form.value.nombre.trim()) return
  savingForm.value = true
  try {
    if (editingId.value) {
      await api.put(`/proveedores/${editingId.value}`, form.value)
    } else {
      await api.post('/proveedores', form.value)
    }
    await load()
    closeForm()
  } finally {
    savingForm.value = false
  }
}

async function confirmDelete(p) {
  if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
  try { await askPassword() } catch { return }
  await api.delete(`/proveedores/${p._id}`)
  await load()
}

function openCalif(p) {
  califItem.value = p
  califForm.value = {
    criterios: globalCriterios.value.map(c => ({ nombre: c.nombre, valor: 'A' })),
    comentario: ''
  }
  showCalif.value = true
}

async function saveCalif() {
  savingCalif.value = true
  try {
    const { data } = await api.post(`/proveedores/${califItem.value._id}/calificacion`, califForm.value)
    const idx = items.value.findIndex(i => i._id === califItem.value._id)
    if (idx !== -1) items.value[idx] = data
    showCalif.value = false
  } finally {
    savingCalif.value = false
  }
}

function openCalifHist(p) {
  califHistItem.value = p
  showCalifHist.value = true
}

async function deleteCalif(p, calId) {
  if (!confirm('¿Eliminar esta evaluación?')) return
  const { data } = await api.delete(`/proveedores/${p._id}/calificacion/${calId}`)
  const idx = items.value.findIndex(i => i._id === p._id)
  if (idx !== -1) items.value[idx] = data
  califHistItem.value = data
}

function latestCalif(p) {
  const cals = p.calificaciones || []
  return cals.length ? cals[cals.length - 1] : null
}

function overallGrade(cal) {
  if (!cal?.criterios?.length) return null
  const map = { A: 3, B: 2, C: 1 }
  const avg = cal.criterios.reduce((s, c) => s + (map[c.valor] || 1), 0) / cal.criterios.length
  return avg >= 2.67 ? 'A' : avg >= 1.67 ? 'B' : 'C'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => { load(); loadConfig() })
</script>

<style scoped>
.prov-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1.5rem 0.75rem 2rem;
  background: transparent;
  box-sizing: border-box;
}

.prov-card-wrap {
  width: min(1100px, 100%);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 22px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  padding: 1.5rem;
  box-sizing: border-box;
}

.prov-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
.prov-header-actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.prov-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; color: #1e293b; }

.btn-config {
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
  border-radius: 2rem; padding: .5rem 1.1rem; cursor: pointer;
  font-weight: 600; font-size: .85rem; display: flex; align-items: center; gap: .4rem;
  transition: background .15s, color .15s;
}
.btn-config:hover { background: #e2e8f0; color: #1e293b; }
.config-desc { font-size: .85rem; color: #6b7280; margin: -.25rem 0 .25rem; }

.prov-filters { margin-bottom: 1.25rem; }
.prov-search { width: 100%; max-width: 400px; padding: .5rem .75rem; border-radius: 2rem; border: 1px solid #ccc; background: #fff; color: #333; }

.prov-loading, .prov-empty { text-align: center; color: #888; padding: 2rem; }

.prov-list { display: flex; flex-direction: column; gap: .875rem; }

.prov-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px; padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: .625rem;
}

.prov-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.prov-name { font-weight: 700; font-size: 1rem; }
.prov-razon { font-size: .8rem; color: #888; }

.prov-grade-row   { display: flex; align-items: center; gap: .35rem; margin-top: .25rem; }
.prov-grade-badge { font-size: .78rem; font-weight: 800; padding: 2px 10px; border-radius: 20px; letter-spacing: .05em; }
.prov-grade-label { font-size: .72rem; color: #6b7280; }
.grade-A { background: rgba(34,197,94,.15); color: #15803d; }
.grade-B { background: rgba(245,158,11,.15); color: #b45309; }
.grade-C { background: rgba(239,68,68,.15); color: #b91c1c; }

.prov-info-grid { display: flex; flex-wrap: wrap; gap: .5rem; font-size: .82rem; align-items: center; }
.prov-info-item { color: #6b7280; display: flex; align-items: center; gap: .3rem; }
.prov-cat-badge { background: rgba(99,102,241,.12); color: #6366f1; padding: 2px 8px; border-radius: 20px; font-size: .72rem; font-weight: 600; }
.prov-cat-badge--perfil { background: rgba(14,144,210,.12); color: #0E90D2; }
.prov-cat-badge--crit   { background: rgba(34,197,94,.12); color: #22C55E; }

.prov-card-actions { display: flex; gap: .5rem; flex-wrap: wrap; }

.btn-sm { padding: .3rem .65rem; border: none; border-radius: 7px; cursor: pointer; font-size: .78rem; display: flex; align-items: center; gap: .3rem; transition: opacity .15s; }
.btn-sm:hover { opacity: .85; }
.btn-eval { background: #dcfce7; color: #166534; }
.btn-hist { background: #f0fdf4; color: #166534; }
.btn-edit { background: #f1f5f9; color: #334155; }
.btn-del  { background: #fee2e2; color: #7f1d1d; margin-left: auto; }

.btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 2rem; padding: .5rem 1.25rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: .4rem; transition: background .15s; font-size: .9rem; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid #ccc; border-radius: 2rem; padding: .5rem 1.1rem; cursor: pointer; color: #555; font-size: .9rem; }
.btn-ghost:hover { background: #f3f4f6; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box {
  background: white; border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,.25);
  padding: 1.5rem;
  width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1rem; color: #333;
}
.modal-box h3 { margin: 0 0 .25rem; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; color: #333; }
.modal-sm { max-width: 420px; }
.modal-lg { max-width: 680px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.form-grid label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; color: #444; }
.form-grid input {
  width: 100%; padding: 10px 14px; border-radius: 2rem;
  border: 1px solid #ccc; background: #fff; color: #333;
  font-size: 16px; box-sizing: border-box;
}
.form-grid input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
.full-col { grid-column: 1 / -1; }
.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .25rem; }

/* Criterios A/B/C */
.calif-criterios { display: flex; flex-direction: column; gap: .6rem; }
.calif-empty-hint { font-size: .85rem; color: #9ca3af; text-align: center; padding: .5rem; }
.calif-row { display: flex; align-items: center; gap: .5rem; }
.calif-label-fixed { flex: 1; font-size: .88rem; font-weight: 600; color: #374151; }
.calif-input {
  flex: 1; padding: .45rem .75rem; border-radius: 2rem;
  border: 1px solid #d1d5db; background: #fff; color: #333;
  font-size: .875rem; box-sizing: border-box;
}
.calif-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,.15); }

.grade-picker { display: flex; gap: .3rem; flex-shrink: 0; }
.grade-btn {
  width: 34px; height: 34px; border-radius: 50%; border: 2px solid transparent;
  font-weight: 800; font-size: .82rem; cursor: pointer;
  background: #f1f5f9; color: #64748b;
  transition: background .12s, color .12s, border-color .12s;
}
.grade-btn--A.active { background: #22c55e; color: #fff; border-color: #16a34a; }
.grade-btn--B.active { background: #f59e0b; color: #fff; border-color: #d97706; }
.grade-btn--C.active { background: #ef4444; color: #fff; border-color: #dc2626; }
.grade-btn--A:not(.active):hover { background: rgba(34,197,94,.15); color: #166534; }
.grade-btn--B:not(.active):hover { background: rgba(245,158,11,.15); color: #b45309; }
.grade-btn--C:not(.active):hover { background: rgba(239,68,68,.15); color: #b91c1c; }

.btn-rm-cr { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; padding: 0 .2rem; }
.btn-add-cr {
  display: flex; align-items: center; gap: .3rem;
  background: none; border: 1px dashed #d1d5db; border-radius: 2rem;
  padding: .35rem .75rem; cursor: pointer; color: #6b7280;
  font-size: .82rem; width: fit-content;
  transition: border-color .12s, color .12s;
}
.btn-add-cr:hover { border-color: #22c55e; color: #166534; }

.eval-comment-label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; }
.eval-comment-label textarea { padding: .5rem .7rem; border-radius: 8px; border: 1px solid #ddd; background: #fff; color: inherit; resize: vertical; font-size: 16px; }

/* Historial */
.eval-hist-list { display: flex; flex-direction: column; gap: .875rem; }
.eval-hist-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: .875rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.eval-hist-head { display: flex; align-items: center; gap: .75rem; }
.eval-hist-date { font-size: .8rem; color: #888; }
.eval-hist-user { font-size: .8rem; font-weight: 600; }
.btn-del-ev { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; }
.calif-hist-criterios { display: flex; flex-wrap: wrap; gap: .5rem; }
.calif-hist-crit { display: flex; align-items: center; gap: .3rem; font-size: .8rem; }
.eval-label-sm { color: #6b7280; }
.grade-badge-sm { font-size: .72rem; font-weight: 800; padding: 1px 8px; border-radius: 20px; }
.grade-badge-sm.grade-A { background: rgba(34,197,94,.15); color: #15803d; }
.grade-badge-sm.grade-B { background: rgba(245,158,11,.15); color: #b45309; }
.grade-badge-sm.grade-C { background: rgba(239,68,68,.15); color: #b91c1c; }
.eval-hist-comment { font-size: .85rem; color: #6b7280; margin: 0; font-style: italic; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>

<style>
[data-theme="dark"] .prov-card-wrap {
  background: rgba(13,18,35,0.82) !important;
  border-color: rgba(255,255,255,0.07) !important;
  box-shadow: 0 8px 40px rgba(0,0,0,0.55) !important;
}
[data-theme="dark"] .prov-title     { color: #ffffff !important; }
[data-theme="dark"] .btn-eval       { background: rgba(34,197,94,0.12) !important; color: #86efac !important; }
[data-theme="dark"] .btn-hist       { background: rgba(34,197,94,0.07) !important; color: #86efac !important; }
[data-theme="dark"] .btn-edit       { background: rgba(59,130,246,0.15) !important; color: #93c5fd !important; }
[data-theme="dark"] .btn-del        { background: rgba(239,68,68,0.15)  !important; color: #fca5a5 !important; }
[data-theme="dark"] .btn-config     { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.1) !important; color: rgba(255,255,255,0.7) !important; }
[data-theme="dark"] .btn-config:hover { background: rgba(255,255,255,0.12) !important; color: #fff !important; }
[data-theme="dark"] .btn-ghost:hover { background: rgba(255,255,255,0.07) !important; }
[data-theme="dark"] .calif-input    { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.15) !important; color: #fff !important; }
[data-theme="dark"] .grade-btn      { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .btn-add-cr     { border-color: rgba(255,255,255,0.15) !important; color: rgba(255,255,255,0.45) !important; }
[data-theme="dark"] .btn-add-cr:hover { border-color: #22c55e !important; color: #86efac !important; }
[data-theme="dark"] .calif-label-fixed { color: rgba(255,255,255,0.85) !important; }
[data-theme="dark"] .prov-grade-label  { color: rgba(255,255,255,0.4) !important; }
[data-theme="dark"] .config-desc       { color: rgba(255,255,255,0.4) !important; }
[data-theme="dark"] .eval-label-sm,
[data-theme="dark"] .eval-hist-comment { color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .eval-hist-card    { border-color: rgba(255,255,255,0.08) !important; }
</style>
