<template>
  <div class="cc-wrap">

    <!-- Toolbar -->
    <div class="cc-toolbar">
      <div class="cc-search-box">
        <i class="bi bi-search cc-search-ico"></i>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar cliente..."
          class="cc-search"
        />
      </div>

      <select v-model="filterEstado" class="cc-select">
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>

      <select v-model="filterPipeline" class="cc-select">
        <option value="">Todas las etapas</option>
        <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>

      <button class="cc-btn-add" @click="openNew">
        <i class="bi bi-person-plus-fill"></i> Nuevo cliente
      </button>
    </div>

    <!-- Loading -->
    <div v-if="crmStore.loadingClients" class="cc-loading">
      <div class="crm-spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="cc-empty">
      <i class="bi bi-person-x" style="font-size:2.5rem;color:var(--color-muted)"></i>
      <p>{{ search || filterEstado || filterPipeline ? 'Sin resultados para los filtros aplicados' : 'No hay clientes registrados' }}</p>
      <button v-if="!search && !filterEstado && !filterPipeline" @click="openNew">
        <i class="bi bi-person-plus-fill"></i> Agregar primer cliente
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="cc-grid">
      <div v-for="c in filtered" :key="c._id" class="cc-card">
        <div class="cc-card-top">
          <div class="cc-avatar" :style="{ background: avatarColor(c.razonSocial || c.name || '') }">
            {{ initials(c.razonSocial || c.name || '?') }}
          </div>
          <div class="cc-card-head">
            <div class="cc-razon">{{ c.razonSocial || c.name || '—' }}</div>
            <div v-if="c.nombreComercial" class="cc-comercial">{{ c.nombreComercial }}</div>
          </div>
          <div class="cc-card-actions">
            <button class="cc-ico-btn cc-ico-btn--edit" @click="openEdit(c)" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="cc-ico-btn cc-ico-btn--del" @click="confirmDelete(c)" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div class="cc-card-body">
          <div v-if="c.contactoPrincipal" class="cc-field">
            <i class="bi bi-person"></i> {{ c.contactoPrincipal }}
          </div>
          <div v-if="c.telefono" class="cc-field">
            <i class="bi bi-telephone"></i> {{ c.telefono }}
          </div>
          <div v-if="c.email" class="cc-field cc-field--email">
            <i class="bi bi-envelope"></i> {{ c.email }}
          </div>
          <div v-if="c.direccion" class="cc-field">
            <i class="bi bi-geo-alt"></i> {{ c.direccion }}
          </div>
        </div>

        <div class="cc-card-footer">
          <span class="cc-badge" :class="`cc-badge--${c.estado || 'activo'}`">
            {{ c.estado || 'activo' }}
          </span>
          <span v-if="c.pipelineEstado" class="cc-stage-pill"
            :style="{ background: stageColor(c.pipelineEstado) + '1a', color: stageColor(c.pipelineEstado) }">
            {{ stageLabel(c.pipelineEstado) }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Modal add/edit ── -->
    <Teleport to="body">
      <div v-if="showModal" class="crm-backdrop" @click.self="closeModal">
        <div class="crm-modal">
          <div class="crm-modal-header">
            <h2>{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
            <button class="crm-close" @click="closeModal"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="crm-modal-body">
            <div class="cm-field">
              <label>Razón social *</label>
              <input v-model="form.razonSocial" placeholder="Ej: Distribuidora ABC S.A." />
            </div>
            <div class="cm-field">
              <label>Nombre comercial</label>
              <input v-model="form.nombreComercial" placeholder="Ej: ABC Distribuidora" />
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Contacto principal</label>
                <input v-model="form.contactoPrincipal" placeholder="Nombre del contacto" />
              </div>
              <div class="cm-field">
                <label>Teléfono</label>
                <input v-model="form.telefono" placeholder="+54 351 555-0000" type="tel" />
              </div>
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Email</label>
                <input v-model="form.email" placeholder="contacto@empresa.com" type="email" />
              </div>
              <div class="cm-field">
                <label>Dirección</label>
                <input v-model="form.direccion" placeholder="Calle 123, Ciudad" />
              </div>
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Estado</label>
                <select v-model="form.estado">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="cm-field">
                <label>Etapa en pipeline</label>
                <select v-model="form.pipelineEstado">
                  <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="cm-field">
              <label>Observaciones</label>
              <textarea v-model="form.observaciones" placeholder="Notas sobre el cliente..." rows="3"></textarea>
            </div>
            <p v-if="formError" class="cm-error">{{ formError }}</p>
          </div>

          <div class="crm-modal-footer">
            <button class="secondary-button" @click="closeModal">Cancelar</button>
            <button :disabled="saving" @click="saveClient">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>{{ editing ? 'Guardar cambios' : 'Crear cliente' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <div v-if="deleting" class="crm-backdrop" @click.self="deleting = null">
        <div class="crm-modal crm-modal--sm">
          <div class="crm-modal-header">
            <h2>Eliminar cliente</h2>
            <button class="crm-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-body">
            <p class="del-confirm-txt">
              ¿Eliminás a <strong>{{ deleting.razonSocial || deleting.name }}</strong>?
              Esta acción puede revertirse desde la base de datos.
            </p>
          </div>
          <div class="crm-modal-footer">
            <button class="secondary-button" @click="deleting = null">Cancelar</button>
            <button class="danger-button" :disabled="saving" @click="doDelete">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/stores/crm'

const crmStore = useCrmStore()

const search         = ref('')
const filterEstado   = ref('')
const filterPipeline = ref('')
const showModal      = ref(false)
const editing        = ref(null)
const saving         = ref(false)
const formError      = ref('')
const deleting       = ref(null)

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo Lead',         color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',          color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotización Enviada',  color: '#f59e0b' },
  { key: 'negociacion',        label: 'Negociación',         color: '#6366f1' },
  { key: 'ganado',             label: 'Ganado',              color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',             color: '#ef4444' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
function stageLabel(key) { return STAGE_MAP[key]?.label || key }
function stageColor(key) { return STAGE_MAP[key]?.color || '#6b8e3a' }

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#6366f1','#22c55e','#ec4899','#6b8e3a','#ef4444']
function avatarColor(name) {
  let n = 0; for (const c of name) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

const emptyForm = () => ({
  razonSocial: '', nombreComercial: '', contactoPrincipal: '',
  telefono: '', email: '', direccion: '', observaciones: '',
  estado: 'activo', pipelineEstado: 'nuevo_lead',
})

const form = ref(emptyForm())

const filtered = computed(() => {
  let list = crmStore.visibleClients
  if (filterEstado.value)   list = list.filter(c => c.estado === filterEstado.value)
  if (filterPipeline.value) list = list.filter(c => c.pipelineEstado === filterPipeline.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c =>
      rx.test(c.razonSocial) || rx.test(c.nombreComercial) ||
      rx.test(c.contactoPrincipal) || rx.test(c.email) ||
      rx.test(c.telefono) || rx.test(c.name)
    )
  }
  return list
})

function openNew() {
  editing.value = null
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    razonSocial:      c.razonSocial || c.name || '',
    nombreComercial:  c.nombreComercial || c.company || '',
    contactoPrincipal: c.contactoPrincipal || '',
    telefono:         c.telefono || '',
    email:            c.email || '',
    direccion:        c.direccion || '',
    observaciones:    c.observaciones || '',
    estado:           c.estado || 'activo',
    pipelineEstado:   c.pipelineEstado || 'nuevo_lead',
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function saveClient() {
  formError.value = ''
  if (!form.value.razonSocial.trim()) {
    formError.value = 'La razón social es obligatoria'
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await crmStore.updateClient(editing.value._id, { ...form.value })
    } else {
      await crmStore.createClient({ ...form.value })
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function confirmDelete(c) { deleting.value = c }

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await crmStore.deleteClient(deleting.value._id)
    deleting.value = null
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cc-wrap { position: relative; }

/* ── Toolbar ── */
.cc-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.cc-search-box {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.cc-search-ico {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 0.9rem;
  pointer-events: none;
}

.cc-search {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.3rem;
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  background: rgba(255,255,255,0.95);
  font-size: 0.85rem;
}

.cc-select {
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-size: 0.83rem;
  width: auto;
  min-width: 150px;
}

.cc-btn-add {
  padding: 0.65rem 1.1rem;
  font-size: 0.83rem;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Empty ── */
.cc-loading,
.cc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 220px;
  color: var(--color-muted);
}

.cc-empty p { text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.06em; }

/* ── Grid ── */
.cc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.cc-card {
  background: rgba(255,255,255,0.95);
  border-radius: 18px;
  border: 1px solid rgba(107,142,58,.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(42,53,32,.07);
  transition: box-shadow 0.2s, transform 0.2s;
}

.cc-card:hover {
  box-shadow: 0 6px 22px rgba(42,53,32,.13);
  transform: translateY(-2px);
}

.cc-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 0.5rem;
}

.cc-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  flex-shrink: 0;
  text-transform: uppercase;
}

.cc-card-head { flex: 1; min-width: 0; }

.cc-razon {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  line-height: 1.3;
}

.cc-comercial {
  font-size: 0.75rem;
  color: var(--color-muted);
  text-transform: none;
  margin-top: 2px;
}

.cc-card-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.cc-ico-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: none;
}

.cc-ico-btn--edit { background: rgba(107,142,58,.1); color: var(--color-primary); }
.cc-ico-btn--edit:hover { background: rgba(107,142,58,.2); }
.cc-ico-btn--del  { background: rgba(239,68,68,.1); color: #ef4444; }
.cc-ico-btn--del:hover { background: rgba(239,68,68,.2); }

.cc-card-body {
  flex: 1;
  padding: 0.5rem 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cc-field {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  color: var(--color-text);
  text-transform: none;
}

.cc-field i { color: var(--color-muted); font-size: 0.8rem; flex-shrink: 0; }

.cc-field--email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-card-footer {
  padding: 0.65rem 1rem;
  border-top: 1px solid rgba(107,142,58,.08);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.cc-badge {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
}

.cc-badge--activo   { background: rgba(34,197,94,.12);  color: #16a34a; }
.cc-badge--inactivo { background: rgba(239,68,68,.12);  color: #dc2626; }

.cc-stage-pill {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.22rem 0.65rem;
  border-radius: 999px;
  text-transform: none;
}

/* ── Modal ── */
.crm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.crm-modal {
  background: #fff;
  border-radius: 22px;
  width: min(560px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,.22);
  display: flex;
  flex-direction: column;
}

.crm-modal--sm { width: min(400px, 100%); }

.crm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(107,142,58,.12);
}

.crm-modal-header h2 {
  font-size: 1.05rem;
  text-transform: uppercase;
}

.crm-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(107,142,58,.1);
  color: var(--color-text);
  padding: 0;
  font-size: 0.85rem;
  box-shadow: none;
}

.crm-modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
}

.cm-field { display: flex; flex-direction: column; gap: 0.35rem; }

.cm-field label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.cm-field input,
.cm-field select,
.cm-field textarea {
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.cm-field textarea { min-height: 80px; }

.cm-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.cm-error {
  color: #dc2626;
  font-size: 0.8rem;
  text-transform: none;
  background: rgba(239,68,68,.08);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  letter-spacing: 0;
}

.crm-modal-footer {
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid rgba(107,142,58,.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.del-confirm-txt {
  text-transform: none;
  font-size: 0.88rem;
  color: var(--color-text);
  letter-spacing: 0;
  line-height: 1.5;
}

/* ── Spinner ── */
.crm-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(107,142,58,.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-spin {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 640px) {
  .cm-row { grid-template-columns: 1fr; }
  .cc-toolbar { flex-direction: column; align-items: stretch; }
}
</style>
