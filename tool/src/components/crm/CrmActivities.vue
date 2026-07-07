<template>
  <div class="ca-wrap">

    <!-- Toolbar -->
    <div class="ca-toolbar">
      <select v-model="filterTipo" class="ca-select">
        <option value="">Todos los tipos</option>
        <option v-for="t in TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
      </select>

      <select v-model="filterCliente" class="ca-select">
        <option value="">Todos los clientes</option>
        <option v-for="c in crmStore.visibleClients" :key="c._id" :value="c._id">
          {{ c.razonSocial || c.name }}
        </option>
      </select>

      <button
        :class="['ca-btn-toggle', { 'ca-btn-toggle--on': showPending }]"
        @click="showPending = !showPending"
      >
        <i class="bi bi-hourglass-split"></i>
        {{ showPending ? 'Solo pendientes' : 'Todas' }}
      </button>

      <button class="ca-btn-difusion" @click="showDifusion = true">
        <i class="bi bi-megaphone-fill"></i> Difusión
      </button>

      <button class="ca-btn-add" @click="openModal">
        <i class="bi bi-plus-circle-fill"></i> Nueva actividad
      </button>
    </div>

    <!-- Summary chips -->
    <div class="ca-summary">
      <div v-for="t in TYPES" :key="t.key" class="ca-chip"
        :style="{ background: t.color + '18', color: t.color }"
        @click="filterTipo = filterTipo === t.key ? '' : t.key"
        :class="{ 'ca-chip--active': filterTipo === t.key }">
        <i :class="t.icon"></i> {{ typeCount(t.key) }} {{ t.label }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="crmStore.loadingActivities" class="ca-loading">
      <div class="crm-spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="ca-empty">
      <i class="bi bi-calendar-x" style="font-size:2.5rem;color:var(--color-muted)"></i>
      <p>{{ hasFilters ? 'Sin resultados para los filtros aplicados' : 'Sin actividades registradas' }}</p>
      <button v-if="!hasFilters" @click="openModal">
        <i class="bi bi-plus-circle-fill"></i> Registrar actividad
      </button>
    </div>

    <!-- Activity timeline -->
    <div v-else class="ca-timeline">
      <div
        v-for="act in filtered"
        :key="act._id"
        class="ca-item"
        :class="{ 'ca-item--done': act.completada }"
      >
        <div class="ca-item-icon" :style="{ background: typeConfig(act.tipo)?.color }">
          <i :class="typeConfig(act.tipo)?.icon"></i>
        </div>

        <div class="ca-item-body">
          <div class="ca-item-header">
            <div class="ca-item-title">{{ act.titulo }}</div>
            <div class="ca-item-actions">
              <button
                :class="['ca-act-btn', act.completada ? 'ca-act-btn--undo' : 'ca-act-btn--done']"
                :title="act.completada ? 'Marcar pendiente' : 'Marcar completada'"
                @click="toggleDone(act)"
              >
                <i :class="act.completada ? 'bi bi-arrow-counterclockwise' : 'bi bi-check-lg'"></i>
              </button>
              <button class="ca-act-btn ca-act-btn--del" title="Eliminar" @click="confirmDelete(act)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>

          <div class="ca-item-meta">
            <span class="ca-meta-client">
              <i class="bi bi-building"></i> {{ act.clienteNombre || '—' }}
            </span>
            <span class="ca-meta-date">
              <i class="bi bi-calendar3"></i> {{ fmtDate(act.createdAt) }}
            </span>
            <span v-if="act.realizadoPor" class="ca-meta-user">
              <i class="bi bi-person"></i> {{ act.realizadoPor }}
            </span>
          </div>

          <div v-if="act.descripcion" class="ca-item-desc">{{ act.descripcion }}</div>

          <div v-if="act.fechaProgramada" class="ca-item-scheduled">
            <i class="bi bi-alarm"></i> Programada: {{ fmtDate(act.fechaProgramada) }}
          </div>
        </div>

        <span class="ca-tipo-pill" :style="{ background: typeConfig(act.tipo)?.color + '18', color: typeConfig(act.tipo)?.color }">
          {{ typeConfig(act.tipo)?.label }}
        </span>
      </div>
    </div>

    <!-- ── Add activity modal ── -->
    <Teleport to="body">
      <div v-if="showModal" class="crm-backdrop" @click.self="closeModal">
        <div class="crm-modal">
          <div class="crm-modal-header">
            <h2>Nueva actividad</h2>
            <button class="crm-close" @click="closeModal"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="crm-modal-body">
            <div class="cm-row">
              <div class="cm-field">
                <label>Tipo *</label>
                <select v-model="form.tipo">
                  <option value="">Seleccionar tipo</option>
                  <option v-for="t in TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
                </select>
              </div>
              <div class="cm-field">
                <label>Cliente *</label>
                <select v-model="form.clienteId">
                  <option value="">Seleccionar cliente</option>
                  <option v-for="c in crmStore.visibleClients" :key="c._id" :value="c._id">
                    {{ c.razonSocial || c.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="cm-field">
              <label>Título *</label>
              <input v-model="form.titulo" placeholder="Ej: Llamada de seguimiento con comprador" />
            </div>

            <div class="cm-field">
              <label>Fecha programada</label>
              <input v-model="form.fechaProgramada" type="date" />
            </div>

            <div class="cm-field">
              <label>Descripción</label>
              <textarea v-model="form.descripcion" placeholder="Detalles de la actividad..." rows="3"></textarea>
            </div>

            <p v-if="formError" class="cm-error">{{ formError }}</p>
          </div>

          <div class="crm-modal-footer">
            <button class="secondary-button" @click="closeModal">Cancelar</button>
            <button :disabled="saving" @click="saveActivity">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>Registrar actividad</span>
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
            <h2>Eliminar actividad</h2>
            <button class="crm-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-body">
            <p class="del-confirm-txt">
              ¿Eliminás la actividad <strong>{{ deleting.titulo }}</strong>?
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

    <!-- ── Difusión modal ── -->
    <CrmDifusion :open="showDifusion" @close="showDifusion = false" />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/stores/crm'
import CrmDifusion from './CrmDifusion.vue'

const crmStore = useCrmStore()

const filterTipo    = ref('')
const filterCliente = ref('')
const showPending   = ref(false)
const showModal     = ref(false)
const showDifusion  = ref(false)
const saving        = ref(false)
const formError     = ref('')
const deleting      = ref(null)

const TYPES = [
  { key: 'llamada',  label: 'Llamada',  icon: 'bi bi-telephone-fill',  color: '#3b82f6' },
  { key: 'reunion',  label: 'Reunión',  icon: 'bi bi-people-fill',     color: '#8b5cf6' },
  { key: 'correo',   label: 'Correo',   icon: 'bi bi-envelope-fill',   color: '#f59e0b' },
  { key: 'nota',     label: 'Nota',     icon: 'bi bi-sticky-fill',     color: '#6b8e3a' },
  { key: 'difusion', label: 'Difusión', icon: 'bi bi-megaphone-fill',  color: '#ec4899' },
]

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.key, t]))
function typeConfig(tipo) { return TYPE_MAP[tipo] || { icon: 'bi bi-circle', color: '#6b8e3a', label: tipo } }
function typeCount(key) { return crmStore.activities.filter(a => a.tipo === key).length }

const hasFilters = computed(() => !!(filterTipo.value || filterCliente.value || showPending.value))

const filtered = computed(() => {
  let list = [...crmStore.activities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (filterTipo.value)    list = list.filter(a => a.tipo === filterTipo.value)
  if (filterCliente.value) list = list.filter(a => String(a.clienteId) === filterCliente.value)
  if (showPending.value)   list = list.filter(a => !a.completada)
  return list
})

const emptyForm = () => ({ tipo: '', titulo: '', clienteId: '', descripcion: '', fechaProgramada: '' })
const form = ref(emptyForm())

function openModal() {
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function saveActivity() {
  formError.value = ''
  if (!form.value.tipo || !form.value.titulo.trim() || !form.value.clienteId) {
    formError.value = 'Tipo, título y cliente son obligatorios'
    return
  }
  saving.value = true
  try {
    await crmStore.createActivity({
      tipo:            form.value.tipo,
      titulo:          form.value.titulo.trim(),
      clienteId:       form.value.clienteId,
      descripcion:     form.value.descripcion,
      fechaProgramada: form.value.fechaProgramada || null,
    })
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function toggleDone(act) {
  await crmStore.toggleActivityComplete(act._id)
}

function confirmDelete(act) { deleting.value = act }

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await crmStore.deleteActivity(deleting.value._id)
    deleting.value = null
  } finally {
    saving.value = false
  }
}

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.ca-wrap { display: flex; flex-direction: column; gap: 1rem; }

/* ── Toolbar ── */
.ca-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.ca-select {
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  font-size: 0.83rem;
  width: auto;
  min-width: 160px;
}

.ca-btn-toggle {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  background: rgba(107,142,58,.1);
  color: var(--color-muted);
  font-size: 0.82rem;
  box-shadow: none;
  border: 1px solid rgba(107,142,58,.15);
}

.ca-btn-toggle--on {
  background: rgba(245,158,11,.12);
  color: #b45309;
  border-color: rgba(245,158,11,.3);
}

.ca-btn-toggle:hover:not(:disabled) { transform: none; }

.ca-btn-difusion {
  padding: 0.6rem 1rem;
  font-size: 0.83rem;
  border-radius: 12px;
  background: rgba(236, 72, 153, 0.1);
  color: #be185d;
  border: 1px solid rgba(236, 72, 153, 0.2);
  box-shadow: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s, color 0.15s;
}
.ca-btn-difusion:hover { background: rgba(236, 72, 153, 0.18); color: #9d174d; transform: none; }

.ca-btn-add {
  padding: 0.6rem 1.1rem;
  font-size: 0.83rem;
  border-radius: 12px;
  margin-left: auto;
  white-space: nowrap;
}

/* ── Summary chips ── */
.ca-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ca-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.18s;
  user-select: none;
}

.ca-chip:hover { opacity: 0.8; transform: scale(1.03); }
.ca-chip--active { outline: 2px solid currentColor; }

/* ── Loading / Empty ── */
.ca-loading,
.ca-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 220px;
  color: var(--color-muted);
}

.ca-empty p { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Timeline ── */
.ca-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.ca-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(107,142,58,.1);
  box-shadow: 0 2px 8px rgba(42,53,32,.06);
  transition: opacity 0.2s, box-shadow 0.2s;
  position: relative;
}

.ca-item:hover { box-shadow: 0 4px 16px rgba(42,53,32,.1); }
.ca-item--done { opacity: 0.6; }

.ca-item-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.ca-item-body { flex: 1; min-width: 0; }

.ca-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.ca-item-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  line-height: 1.3;
}

.ca-item-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }

.ca-act-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  padding: 0;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.ca-act-btn--done  { background: rgba(34,197,94,.12);  color: #16a34a; }
.ca-act-btn--undo  { background: rgba(107,142,58,.1);  color: var(--color-muted); }
.ca-act-btn--del   { background: rgba(239,68,68,.1);   color: #ef4444; }

.ca-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.3rem;
}

.ca-item-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--color-muted);
  text-transform: none;
}

.ca-item-meta i { font-size: 0.72rem; }

.ca-meta-client { font-weight: 600; color: var(--color-text); }

.ca-item-desc {
  font-size: 0.78rem;
  color: var(--color-text);
  text-transform: none;
  line-height: 1.5;
  background: rgba(107,142,58,.05);
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  margin-top: 0.3rem;
}

.ca-item-scheduled {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: #f59e0b;
  text-transform: none;
  margin-top: 0.3rem;
  font-weight: 600;
}

.ca-tipo-pill {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
  align-self: flex-start;
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

.crm-modal-header h2 { font-size: 1.05rem; text-transform: uppercase; }

.crm-close {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: rgba(107,142,58,.1);
  color: var(--color-text);
  padding: 0; font-size: 0.85rem; box-shadow: none;
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

.cm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }

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

@media (max-width: 640px) {
  .cm-row { grid-template-columns: 1fr; }
  .ca-toolbar { flex-direction: column; align-items: stretch; }
  .ca-btn-add { margin-left: 0; }

  .ca-item-header {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .ca-item-title {
    width: 100%;
  }

  .ca-item-actions {
    margin-left: auto;
  }
}
</style>

<style>
/* ── CrmActivities dark mode ── */
[data-theme="dark"] .ca-item {
  background: rgba(13,18,35,0.72) !important;
  border-color: rgba(255,255,255,0.07) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
}
[data-theme="dark"] .ca-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.35) !important; }
[data-theme="dark"] .ca-item-title  { color: rgba(255,255,255,0.9) !important; }
[data-theme="dark"] .ca-item-desc   { background: rgba(107,142,58,0.07) !important; color: rgba(255,255,255,0.75) !important; }
[data-theme="dark"] .ca-meta-client { color: rgba(255,255,255,0.85) !important; }
[data-theme="dark"] .ca-act-btn--done { background: rgba(34,197,94,0.15) !important;  color: #86efac !important; }
[data-theme="dark"] .ca-act-btn--undo { background: rgba(255,255,255,0.06) !important; }
[data-theme="dark"] .ca-act-btn--del  { background: rgba(239,68,68,0.15) !important;   color: #fca5a5 !important; }

/* Modal */
[data-theme="dark"] .crm-modal {
  background: rgba(10,14,28,0.98) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
}
[data-theme="dark"] .crm-modal-header {
  border-color: rgba(255,255,255,0.08) !important;
  color: rgba(255,255,255,0.9) !important;
}
[data-theme="dark"] .crm-modal-header h2 { color: rgba(255,255,255,0.95) !important; }
[data-theme="dark"] .crm-close {
  background: rgba(255,255,255,0.07) !important;
  color: rgba(255,255,255,0.8) !important;
}
[data-theme="dark"] .cm-field label { color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .cm-field input,
[data-theme="dark"] .cm-field select,
[data-theme="dark"] .cm-field textarea {
  background: rgba(13,18,35,0.7) !important;
  border-color: rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
}
[data-theme="dark"] .crm-modal-footer { border-color: rgba(255,255,255,0.08) !important; }
[data-theme="dark"] .cm-error {
  background: rgba(239,68,68,0.1) !important;
  color: #fca5a5 !important;
}
[data-theme="dark"] .del-confirm-txt { color: rgba(255,255,255,0.8) !important; }
</style>
