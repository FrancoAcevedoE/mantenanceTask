<template>
  <div class="prov-page">
    <div class="prov-card-wrap">
    <div class="prov-header">
      <h2 class="prov-title"><i class="bi bi-truck"></i> {{ t.title }}</h2>
      <button v-if="canManageCompras" class="btn-primary" @click="openCreate"><i class="bi bi-plus-lg"></i> {{ t.btnNew }}</button>
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
          </div>
          <div class="prov-score-wrap">
            <div class="prov-stars">
              <i v-for="s in 5" :key="s" :class="['bi', starClass(promedioEval(p), s)]"></i>
            </div>
            <span class="prov-score-num">{{ promedioEval(p) ? promedioEval(p).toFixed(1) : '—' }}</span>
          </div>
        </div>

        <div class="prov-info-grid">
          <span v-if="p.cuit" class="prov-info-item"><i class="bi bi-credit-card"></i> CUIT: {{ p.cuit }}</span>
          <span v-if="p.telefono" class="prov-info-item"><i class="bi bi-telephone"></i> {{ p.telefono }}</span>
          <span v-if="p.email" class="prov-info-item"><i class="bi bi-envelope"></i> {{ p.email }}</span>
          <span v-if="p.categoria" class="prov-cat-badge">{{ p.categoria }}</span>
        </div>

        <div class="prov-card-actions">
          <button class="btn-sm btn-eval" @click="openEval(p)">
            <i class="bi bi-star-fill"></i> {{ t.btnEval }}
          </button>
          <button class="btn-sm btn-hist" @click="openEvalHist(p)">
            <i class="bi bi-list-stars"></i> {{ t.evalCount(p.evaluaciones?.length || 0) }}
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

    <!-- Modal evaluar proveedor -->
    <div v-if="showEval" class="modal-overlay" @click.self="showEval = false">
      <div class="modal-box modal-sm">
        <h3><i class="bi bi-star-fill text-yellow"></i> {{ t.evalTitle(evalItem?.nombre) }}</h3>
        <div class="eval-criteria">
          <div v-for="(label, key) in evalKeys" :key="key" class="eval-row">
            <span class="eval-label">{{ label }}</span>
            <div class="star-picker">
              <button
                v-for="s in 5"
                :key="s"
                class="star-btn"
                @click="evalForm[key] = s"
              >
                <i :class="['bi', evalForm[key] >= s ? 'bi-star-fill star-on' : 'bi-star star-off']"></i>
              </button>
            </div>
          </div>
        </div>
        <label class="eval-comment-label">{{ t.evalComment }}
          <textarea v-model="evalForm.comentario" rows="3" :placeholder="t.phComment"></textarea>
        </label>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showEval = false">{{ t.btnCancel }}</button>
          <button class="btn-primary" :disabled="savingEval" @click="saveEval">
            {{ savingEval ? t.btnSaving : t.btnSaveEval }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal historial de evaluaciones -->
    <div v-if="showEvalHist" class="modal-overlay" @click.self="showEvalHist = false">
      <div class="modal-box modal-lg">
        <h3><i class="bi bi-list-stars"></i> {{ t.histTitle(evalHistItem?.nombre) }}</h3>
        <div v-if="!evalHistItem?.evaluaciones?.length" class="prov-empty">{{ t.noEvals }}</div>
        <div v-else class="eval-hist-list">
          <div v-for="ev in evalHistItem.evaluaciones.slice().reverse()" :key="ev._id" class="eval-hist-card">
            <div class="eval-hist-head">
              <span class="eval-hist-date">{{ formatDate(ev.fecha) }}</span>
              <span v-if="ev.usuario" class="eval-hist-user">{{ ev.usuario }}</span>
              <button class="btn-del-ev" @click="deleteEval(evalHistItem, ev._id)" title="Eliminar">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <div class="eval-hist-scores">
              <span v-for="(label, key) in evalKeys" :key="key" class="eval-hist-score">
                <span class="eval-label-sm">{{ label }}</span>
                <span class="ev-stars-sm">
                  <i v-for="s in 5" :key="s" :class="['bi', ev[key] >= s ? 'bi-star-fill star-on-sm' : 'bi-star star-off-sm']"></i>
                </span>
              </span>
            </div>
            <p v-if="ev.comentario" class="eval-hist-comment">{{ ev.comentario }}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showEvalHist = false">{{ t.btnClose }}</button>
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
const { canManageCompras } = usePermissions()

const TRANSLATIONS = {
  es: {
    title: 'Proveedores', btnNew: 'Nuevo proveedor',
    search: 'Buscar por nombre, CUIT, categoría…',
    loading: 'Cargando…', empty: 'Sin proveedores registrados.',
    btnEval: 'Evaluar', evalCount: (n) => `Evaluaciones (${n})`,
    modalCreate: 'Nuevo proveedor', modalEdit: 'Editar proveedor',
    fNombre: 'Nombre *', phNombre: 'Nombre comercial',
    fRazon: 'Razón social', fCuit: 'CUIT',
    fCategoria: 'Categoría', phCategoria: 'Ej: Químicos, Envases…',
    fContacto: 'Contacto', phContacto: 'Nombre del contacto',
    fTelefono: 'Teléfono', fEmail: 'Email',
    fDireccion: 'Dirección', phDireccion: 'Calle, ciudad…',
    btnCancel: 'Cancelar', btnSave: 'Guardar', btnSaving: 'Guardando…',
    evalTitle: (name) => `Evaluar — ${name}`,
    evalComment: 'Comentario', phComment: 'Observaciones…',
    btnSaveEval: 'Guardar evaluación',
    histTitle: (name) => `Evaluaciones — ${name}`,
    noEvals: 'Sin evaluaciones aún.', btnClose: 'Cerrar',
    evalKeys: { calidad: 'Calidad', tiempoEntrega: 'Tiempo de entrega', precio: 'Precio', servicio: 'Servicio' },
    delTitle: '¿Eliminar proveedor?',
    delMsg: (name) => `Se eliminará "${name}". Esta acción no se puede deshacer.`,
    delBtn: 'Eliminar',
  },
  pt: {
    title: 'Fornecedores', btnNew: 'Novo fornecedor',
    search: 'Pesquisar por nome, CNPJ, categoria…',
    loading: 'Carregando…', empty: 'Sem fornecedores registrados.',
    btnEval: 'Avaliar', evalCount: (n) => `Avaliações (${n})`,
    modalCreate: 'Novo fornecedor', modalEdit: 'Editar fornecedor',
    fNombre: 'Nome *', phNombre: 'Nome comercial',
    fRazon: 'Razão social', fCuit: 'CNPJ',
    fCategoria: 'Categoria', phCategoria: 'Ex: Químicos, Embalagens…',
    fContacto: 'Contato', phContacto: 'Nome do contato',
    fTelefono: 'Telefone', fEmail: 'E-mail',
    fDireccion: 'Endereço', phDireccion: 'Rua, cidade…',
    btnCancel: 'Cancelar', btnSave: 'Salvar', btnSaving: 'Salvando…',
    evalTitle: (name) => `Avaliar — ${name}`,
    evalComment: 'Comentário', phComment: 'Observações…',
    btnSaveEval: 'Salvar avaliação',
    histTitle: (name) => `Avaliações — ${name}`,
    noEvals: 'Sem avaliações ainda.', btnClose: 'Fechar',
    evalKeys: { calidad: 'Qualidade', tiempoEntrega: 'Prazo de entrega', precio: 'Preço', servicio: 'Atendimento' },
    delTitle: 'Excluir fornecedor?',
    delMsg: (name) => `O fornecedor "${name}" será excluído. Esta ação não pode ser desfeita.`,
    delBtn: 'Excluir',
  },
}
const t = computed(() => TRANSLATIONS[locale.value] || TRANSLATIONS.es)

const authCfg = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } })
const api = {
  get:    (path, cfg = {})       => axios.get(`${API_BASE_URL}${path}`, { ...authCfg(), ...cfg }),
  post:   (path, data, cfg = {}) => axios.post(`${API_BASE_URL}${path}`, data, authCfg()),
  put:    (path, data, cfg = {}) => axios.put(`${API_BASE_URL}${path}`, data, authCfg()),
  delete: (path, cfg = {})       => axios.delete(`${API_BASE_URL}${path}`, authCfg())
}

const items    = ref([])
const loading  = ref(true)
const search   = ref('')

const showForm   = ref(false)
const editingId  = ref(null)
const savingForm = ref(false)
const form = ref({ nombre: '', razonSocial: '', cuit: '', categoria: '', contacto: '', telefono: '', email: '', direccion: '' })

const showEval   = ref(false)
const evalItem   = ref(null)
const savingEval = ref(false)

const evalKeys = computed(() => t.value.evalKeys)
const evalForm = ref({ calidad: 3, tiempoEntrega: 3, precio: 3, servicio: 3, comentario: '' })

const showEvalHist = ref(false)
const evalHistItem = ref(null)

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

function promedioEval(p) {
  const evs = p.evaluaciones || []
  if (!evs.length) return 0
  const sum = evs.reduce((acc, ev) => {
    const avg = (+(ev.calidad||0) + +(ev.tiempoEntrega||0) + +(ev.precio||0) + +(ev.servicio||0)) / 4
    return acc + avg
  }, 0)
  return sum / evs.length
}

function starClass(score, index) {
  if (score >= index) return 'bi-star-fill star-on'
  if (score >= index - 0.5) return 'bi-star-half star-on'
  return 'bi-star star-off'
}

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
  form.value = { nombre: '', razonSocial: '', cuit: '', categoria: '', contacto: '', telefono: '', email: '', direccion: '' }
  showForm.value = true
}

function openEdit(p) {
  editingId.value = p._id
  form.value = { nombre: p.nombre, razonSocial: p.razonSocial || '', cuit: p.cuit || '', categoria: p.categoria || '', contacto: p.contacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '' }
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

function openEval(p) {
  evalItem.value = p
  evalForm.value = { calidad: 3, tiempoEntrega: 3, precio: 3, servicio: 3, comentario: '' }
  showEval.value = true
}

async function saveEval() {
  savingEval.value = true
  try {
    const { data } = await api.post(`/proveedores/${evalItem.value._id}/evaluacion`, evalForm.value)
    const idx = items.value.findIndex(i => i._id === evalItem.value._id)
    if (idx !== -1) items.value[idx] = data
    showEval.value = false
  } finally {
    savingEval.value = false
  }
}

function openEvalHist(p) {
  evalHistItem.value = p
  showEvalHist.value = true
}

async function deleteEval(p, evId) {
  if (!confirm('¿Eliminar esta evaluación?')) return
  const { data } = await api.delete(`/proveedores/${p._id}/evaluacion/${evId}`)
  const idx = items.value.findIndex(i => i._id === p._id)
  if (idx !== -1) items.value[idx] = data
  evalHistItem.value = data
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(load)
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
.prov-title { font-size: 1.3rem; font-weight: 700; display: flex; align-items: center; gap: .5rem; margin: 0; color: #1e293b; }

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

.prov-score-wrap { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
.prov-stars { display: flex; gap: 2px; font-size: 1rem; }
.prov-score-num { font-size: .85rem; font-weight: 700; color: #f59e0b; min-width: 24px; }

.star-on  { color: #f59e0b; }
.star-off { color: #d1d5db; }

.prov-info-grid { display: flex; flex-wrap: wrap; gap: .5rem; font-size: .82rem; align-items: center; }
.prov-info-item { color: #6b7280; display: flex; align-items: center; gap: .3rem; }
.prov-cat-badge { background: rgba(99,102,241,.12); color: #6366f1; padding: 2px 8px; border-radius: 20px; font-size: .72rem; font-weight: 600; }

.prov-card-actions { display: flex; gap: .5rem; flex-wrap: wrap; }

.btn-sm { padding: .3rem .65rem; border: none; border-radius: 7px; cursor: pointer; font-size: .78rem; display: flex; align-items: center; gap: .3rem; transition: opacity .15s; }
.btn-sm:hover { opacity: .85; }
.btn-eval  { background: #fef9c3; color: #713f12; }
.btn-hist  { background: #e0e7ff; color: #3730a3; }
.btn-edit  { background: #f1f5f9; color: #334155; }
.btn-del   { background: #fee2e2; color: #7f1d1d; margin-left: auto; }

.btn-primary { background: #6366f1; color: #fff; border: none; border-radius: 2rem; padding: .5rem 1.25rem; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: .4rem; transition: background .15s; font-size: .9rem; }
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid #ccc; border-radius: 2rem; padding: .5rem 1.1rem; cursor: pointer; color: #555; font-size: .9rem; }
.btn-ghost:hover { background: #f3f4f6; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-box {
  background: white;
  border-radius: 12px;
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
  font-size: 16px; /* Evita zoom automático en iOS */
  box-sizing: border-box;
}
.form-grid input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.15); }
.full-col { grid-column: 1 / -1; }

.modal-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .25rem; }

/* Evaluación */
.eval-criteria { display: flex; flex-direction: column; gap: .75rem; }
.eval-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.eval-label { font-size: .9rem; font-weight: 600; }
.star-picker { display: flex; gap: .25rem; }
.star-btn { background: none; border: none; cursor: pointer; font-size: 1.4rem; padding: 0; transition: transform .1s; }
.star-btn:hover { transform: scale(1.2); }
.star-on  { color: #f59e0b; }
.star-off { color: #d1d5db; }
.eval-comment-label { display: flex; flex-direction: column; gap: .3rem; font-size: .85rem; font-weight: 600; }
.eval-comment-label textarea { padding: .5rem .7rem; border-radius: 8px; border: 1px solid var(--border-color, #ddd); background: var(--input-bg, #fff); color: inherit; resize: vertical; font-size: 16px; /* Evita zoom en iOS */ }
.text-yellow { color: #f59e0b; }

/* Historial evaluaciones */
.eval-hist-list { display: flex; flex-direction: column; gap: .875rem; }
.eval-hist-card { border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; padding: .875rem 1rem; display: flex; flex-direction: column; gap: .5rem; }
.eval-hist-head { display: flex; align-items: center; gap: .75rem; }
.eval-hist-date { font-size: .8rem; color: #888; }
.eval-hist-user { font-size: .8rem; font-weight: 600; }
.btn-del-ev { margin-left: auto; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; }
.eval-hist-scores { display: flex; flex-wrap: wrap; gap: .75rem; }
.eval-hist-score { display: flex; align-items: center; gap: .35rem; font-size: .8rem; }
.eval-label-sm { color: #6b7280; }
.ev-stars-sm { display: flex; gap: 1px; font-size: .75rem; }
.star-on-sm  { color: #f59e0b; }
.star-off-sm { color: #d1d5db; }
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
[data-theme="dark"] .prov-title { color: #ffffff !important; }
[data-theme="dark"] .btn-eval  { background: rgba(245,158,11,0.15) !important; color: #fde68a !important; }
[data-theme="dark"] .btn-edit  { background: rgba(59,130,246,0.15) !important; color: #93c5fd !important; }
[data-theme="dark"] .btn-del   { background: rgba(239,68,68,0.15)  !important; color: #fca5a5 !important; }
[data-theme="dark"] .btn-ghost:hover { background: rgba(255,255,255,0.07) !important; }
[data-theme="dark"] .eval-label-sm,
[data-theme="dark"] .eval-hist-comment { color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .star-off-sm { color: rgba(255,255,255,0.2) !important; }
</style>
