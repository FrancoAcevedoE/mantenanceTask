<template>
  <div class="mkcamp-wrap">

    <!-- Toolbar -->
    <div class="mkcamp-toolbar">
      <div class="mkcamp-search-box">
        <i class="bi bi-search mkcamp-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar campaña..." class="mkcamp-search" />
      </div>
      <select v-model="filterEstado" class="mkcamp-select">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e.key" :value="e.key">{{ e.label }}</option>
      </select>
      <button class="mkcamp-btn-add" @click="openNew">
        <i class="bi bi-plus-lg"></i> Nueva campaña
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!mStore.campaigns.length" class="mkcamp-empty">
      <i class="bi bi-megaphone"></i>
      <p>No hay campañas todavía</p>
      <button @click="openNew"><i class="bi bi-plus-lg"></i> Crear primera campaña</button>
    </div>

    <!-- Campaign cards -->
    <div v-else class="mkcamp-grid">
      <div v-if="!filtered.length" class="mkcamp-empty">
        <p>Sin resultados</p>
      </div>
      <div v-for="c in filtered" :key="c._id" class="mkcamp-card">
        <div class="mkcamp-card-hd">
          <span class="mkcamp-tipo" :class="`mkcamp-tipo--${c.tipo}`">
            <i :class="TIPO_ICON[c.tipo]"></i> {{ TIPO_LABEL[c.tipo] }}
          </span>
          <span class="mkcamp-estado" :class="`mkcamp-estado--${c.estado}`">
            {{ ESTADO_LABEL[c.estado] }}
          </span>
        </div>
        <div class="mkcamp-card-name">{{ c.nombre }}</div>
        <div v-if="c.descripcion" class="mkcamp-card-desc">{{ c.descripcion }}</div>
        <div v-if="c.fechaInicio || c.fechaFin" class="mkcamp-card-dates">
          <i class="bi bi-calendar3"></i>
          <span>{{ fmtDate(c.fechaInicio) }}</span>
          <template v-if="c.fechaFin"> → <span>{{ fmtDate(c.fechaFin) }}</span></template>
        </div>

        <!-- Stats mini -->
        <div class="mkcamp-stats">
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.enviados || 0 }}</div>
            <div class="mkcamp-stat-lbl">Enviados</div>
          </div>
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.abiertos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Abiertos</div>
          </div>
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.respondidos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Respondidos</div>
          </div>
          <div class="mkcamp-stat mkcamp-stat--conv">
            <div class="mkcamp-stat-val">{{ c.stats?.convertidos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Convertidos</div>
          </div>
        </div>

        <!-- Segmento -->
        <div class="mkcamp-segment">
          <i class="bi bi-people"></i>
          <span>{{ targetCount(c) }} destinatario{{ targetCount(c) !== 1 ? 's' : '' }}</span>
          <template v-if="c.segmento?.tipoCliente">
            · {{ c.segmento.tipoCliente === 'normal' ? 'Clientes' : 'Potenciales' }}
          </template>
          <template v-if="c.segmento?.pipelineEstados?.length">
            · {{ c.segmento.pipelineEstados.map(stageLabel).join(', ') }}
          </template>
        </div>

        <div class="mkcamp-card-ft">
          <button class="mkcamp-ico-btn" @click="openEdit(c)" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="mkcamp-ico-btn mkcamp-ico-btn--detail" @click="openDetail(c)" title="Ver destinatarios">
            <i class="bi bi-eye"></i>
          </button>
          <button class="mkcamp-ico-btn mkcamp-ico-btn--del" @click="confirmDel(c)" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal crear/editar ── -->
    <Teleport to="body">
      <div v-if="showModal" class="mk-backdrop" @click.self="showModal = false">
        <div class="mk-modal">
          <div class="mk-modal-hd">
            <h2>{{ editing ? 'Editar campaña' : 'Nueva campaña' }}</h2>
            <button class="mk-close" @click="showModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <div class="mk-row">
              <div class="mk-field mk-field--grow">
                <label>Nombre *</label>
                <input v-model="form.nombre" maxlength="100" placeholder="Ej: Campaña enero 2025" />
              </div>
              <div class="mk-field">
                <label>Canal</label>
                <select v-model="form.tipo">
                  <option v-for="e in TIPOS" :key="e.key" :value="e.key">{{ e.label }}</option>
                </select>
              </div>
            </div>
            <div class="mk-row">
              <div class="mk-field">
                <label>Estado</label>
                <select v-model="form.estado">
                  <option v-for="e in ESTADOS" :key="e.key" :value="e.key">{{ e.label }}</option>
                </select>
              </div>
              <div class="mk-field">
                <label>Fecha inicio</label>
                <input v-model="form.fechaInicio" type="date" />
              </div>
              <div class="mk-field">
                <label>Fecha fin</label>
                <input v-model="form.fechaFin" type="date" />
              </div>
            </div>
            <div class="mk-field">
              <label>Descripción</label>
              <textarea v-model="form.descripcion" rows="2" maxlength="500" placeholder="Objetivo de la campaña..."></textarea>
            </div>

            <!-- Segmento -->
            <div class="mk-section-hd">Segmento de destinatarios</div>
            <div class="mk-row">
              <div class="mk-field">
                <label>Tipo de cliente</label>
                <select v-model="form.segmento.tipoCliente">
                  <option value="">Todos</option>
                  <option value="normal">Clientes</option>
                  <option value="potencial">Potenciales</option>
                </select>
              </div>
            </div>
            <div class="mk-field">
              <label>Etapas del pipeline (múltiple)</label>
              <div class="mk-stage-check-group">
                <label v-for="s in STAGES" :key="s.key" class="mk-stage-check">
                  <input type="checkbox" :value="s.key" v-model="form.segmento.pipelineEstados" />
                  <span :style="{ color: s.color }">{{ s.label }}</span>
                </label>
              </div>
            </div>
            <div class="mk-preview-dest">
              <i class="bi bi-people"></i>
              <strong>{{ previewTargetCount }}</strong> destinatario{{ previewTargetCount !== 1 ? 's' : '' }} con este segmento
            </div>

            <!-- Stats manuales -->
            <div class="mk-section-hd">Métricas (actualización manual)</div>
            <div class="mk-row">
              <div class="mk-field">
                <label>Enviados</label>
                <input v-model.number="form.stats.enviados" type="number" min="0" />
              </div>
              <div class="mk-field">
                <label>Abiertos</label>
                <input v-model.number="form.stats.abiertos" type="number" min="0" />
              </div>
              <div class="mk-field">
                <label>Respondidos</label>
                <input v-model.number="form.stats.respondidos" type="number" min="0" />
              </div>
              <div class="mk-field">
                <label>Convertidos</label>
                <input v-model.number="form.stats.convertidos" type="number" min="0" />
              </div>
            </div>

            <p v-if="formError" class="mk-error">{{ formError }}</p>
          </div>
          <div class="mk-modal-ft">
            <button class="secondary-button" @click="showModal = false">Cancelar</button>
            <button :disabled="saving" @click="save">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>{{ editing ? 'Guardar cambios' : 'Crear campaña' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Modal destinatarios ── -->
    <Teleport to="body">
      <div v-if="detailCamp" class="mk-backdrop" @click.self="detailCamp = null">
        <div class="mk-modal mk-modal--sm">
          <div class="mk-modal-hd">
            <h2><i class="bi bi-people"></i> Destinatarios — {{ detailCamp.nombre }}</h2>
            <button class="mk-close" @click="detailCamp = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <div class="mk-dest-count">
              <strong>{{ detailTargets.length }}</strong> cliente{{ detailTargets.length !== 1 ? 's' : '' }} en el segmento
            </div>
            <div class="mk-dest-list">
              <div v-for="c in detailTargets" :key="c._id" class="mk-dest-row">
                <span v-if="c.codigoCliente" class="mk-dest-cod">#{{ c.codigoCliente }}</span>
                <span class="mk-dest-name">{{ c.razonSocial || c.name }}</span>
                <span class="mk-dest-stage"
                  :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
                  {{ stageLabel(c.pipelineEstado) }}
                </span>
              </div>
              <div v-if="!detailTargets.length" class="mk-dest-empty">
                No hay destinatarios con este segmento
              </div>
            </div>
          </div>
          <div class="mk-modal-ft">
            <button @click="detailCamp = null">Cerrar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Confirm delete ── -->
    <Teleport to="body">
      <div v-if="deleting" class="mk-backdrop" @click.self="deleting = null">
        <div class="mk-modal mk-modal--sm">
          <div class="mk-modal-hd">
            <h2>Eliminar campaña</h2>
            <button class="mk-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <p>¿Eliminás la campaña <strong>{{ deleting.nombre }}</strong>?</p>
          </div>
          <div class="mk-modal-ft">
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
import { useMarketingStore } from '@/stores/marketing'
import { useToast } from 'vue-toastification'

const mStore = useMarketingStore()
const toast  = useToast()

const search      = ref('')
const filterEstado = ref('')
const showModal   = ref(false)
const editing     = ref(null)
const saving      = ref(false)
const formError   = ref('')
const deleting    = ref(null)
const detailCamp  = ref(null)

const TIPOS  = [
  { key: 'email',     label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'mixta',    label: 'Mixta' },
  { key: 'llamada',  label: 'Llamada' },
]
const ESTADOS = [
  { key: 'borrador',   label: 'Borrador' },
  { key: 'activa',     label: 'Activa' },
  { key: 'pausada',    label: 'Pausada' },
  { key: 'finalizada', label: 'Finalizada' },
]
const TIPO_LABEL  = Object.fromEntries(TIPOS.map(t => [t.key, t.label]))
const TIPO_ICON   = { email: 'bi bi-envelope-fill', whatsapp: 'bi bi-whatsapp', mixta: 'bi bi-layers-fill', llamada: 'bi bi-telephone-fill' }
const ESTADO_LABEL = Object.fromEntries(ESTADOS.map(e => [e.key, e.label]))

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo lead',  color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',  color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',    color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',      color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',     color: '#ef4444' },
]
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
function stageLabel(k) { return STAGE_MAP[k]?.label || k }
function stageColor(k) { return STAGE_MAP[k]?.color || '#94a3b8' }

function emptyForm() {
  return {
    nombre: '', tipo: 'email', estado: 'borrador',
    descripcion: '', fechaInicio: '', fechaFin: '',
    segmento: { tipoCliente: '', pipelineEstados: [], clienteIds: [] },
    stats: { enviados: 0, abiertos: 0, respondidos: 0, convertidos: 0 },
  }
}
const form = ref(emptyForm())

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function targetCount(c) { return mStore.campaignTargets(c).length }

const previewTargetCount = computed(() => mStore.campaignTargets({ segmento: form.value.segmento }).length)

const detailTargets = computed(() => detailCamp.value ? mStore.campaignTargets(detailCamp.value) : [])

const filtered = computed(() => {
  let list = mStore.campaigns
  if (filterEstado.value) list = list.filter(c => c.estado === filterEstado.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c => rx.test(c.nombre) || rx.test(c.descripcion))
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
    nombre:      c.nombre,
    tipo:        c.tipo,
    estado:      c.estado,
    descripcion: c.descripcion || '',
    fechaInicio: c.fechaInicio ? c.fechaInicio.slice(0, 10) : '',
    fechaFin:    c.fechaFin    ? c.fechaFin.slice(0, 10)    : '',
    segmento: {
      tipoCliente:     c.segmento?.tipoCliente || '',
      pipelineEstados: [...(c.segmento?.pipelineEstados || [])],
      clienteIds:      [...(c.segmento?.clienteIds || [])],
    },
    stats: {
      enviados:    c.stats?.enviados    || 0,
      abiertos:    c.stats?.abiertos    || 0,
      respondidos: c.stats?.respondidos || 0,
      convertidos: c.stats?.convertidos || 0,
    },
  }
  formError.value = ''
  showModal.value = true
}

function openDetail(c) { detailCamp.value = c }
function confirmDel(c) { deleting.value = c }

async function save() {
  formError.value = ''
  if (!form.value.nombre.trim()) { formError.value = 'El nombre es obligatorio'; return }
  saving.value = true
  try {
    if (editing.value) {
      await mStore.updateCampaign(editing.value._id, { ...form.value })
      toast.success('Campaña actualizada')
    } else {
      await mStore.createCampaign({ ...form.value })
      toast.success('Campaña creada')
    }
    showModal.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await mStore.deleteCampaign(deleting.value._id)
    deleting.value = null
    toast.success('Campaña eliminada')
  } catch {
    toast.error('Error al eliminar')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.mkcamp-wrap { min-width: 0; }

.mkcamp-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.6rem;
  align-items: center; margin-bottom: 1rem;
}
.mkcamp-search-box { position: relative; flex: 1; min-width: 180px; }
.mkcamp-search-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.mkcamp-search { width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.1rem; border-radius: 10px; font-size: 0.82rem; }
.mkcamp-select { padding: 0.55rem 0.9rem; border-radius: 10px; font-size: 0.8rem; min-width: 140px; }
.mkcamp-btn-add {
  padding: 0.55rem 1rem; font-size: 0.8rem; border-radius: 10px;
  white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: 0.4rem;
}

.mkcamp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 3rem 1rem; color: var(--color-muted); font-size: 0.82rem; text-align: center;
}
.mkcamp-empty i { font-size: 2.5rem; opacity: .3; }

/* Cards grid */
.mkcamp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.mkcamp-card {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(107,142,58,.12);
  border-radius: 14px;
  padding: 1rem;
  display: flex; flex-direction: column; gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  transition: box-shadow .18s, transform .18s;
}
.mkcamp-card:hover { box-shadow: 0 5px 18px rgba(0,0,0,.1); transform: translateY(-2px); }

.mkcamp-card-hd { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.mkcamp-card-name { font-weight: 700; font-size: 0.92rem; color: var(--color-text); }
.mkcamp-card-desc { font-size: 0.75rem; color: var(--color-muted); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.mkcamp-card-dates { font-size: 0.72rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.4rem; }

.mkcamp-tipo {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
  text-transform: uppercase;
}
.mkcamp-tipo--email    { background: rgba(59,130,246,.12); color: #1d4ed8; }
.mkcamp-tipo--whatsapp { background: rgba(34,197,94,.12); color: #15803d; }
.mkcamp-tipo--mixta    { background: rgba(107,142,58,.12); color: #4d6728; }
.mkcamp-tipo--llamada  { background: rgba(245,158,11,.12); color: #b45309; }

.mkcamp-estado {
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
}
.mkcamp-estado--borrador   { background: rgba(148,163,184,.15); color: #475569; }
.mkcamp-estado--activa     { background: rgba(34,197,94,.12); color: #15803d; }
.mkcamp-estado--pausada    { background: rgba(245,158,11,.12); color: #b45309; }
.mkcamp-estado--finalizada { background: rgba(107,142,58,.12); color: #4d6728; }

.mkcamp-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem; background: rgba(107,142,58,.05);
  border-radius: 10px; padding: 0.5rem 0.25rem;
}
.mkcamp-stat { text-align: center; }
.mkcamp-stat-val { font-size: 1rem; font-weight: 800; color: var(--color-text); }
.mkcamp-stat-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); }
.mkcamp-stat--conv .mkcamp-stat-val { color: #15803d; }

.mkcamp-segment { font-size: 0.72rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }

.mkcamp-card-ft {
  display: flex; gap: 0.4rem; justify-content: flex-end; margin-top: 0.25rem;
  border-top: 1px solid rgba(107,142,58,.08); padding-top: 0.5rem;
}
.mkcamp-ico-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; background: rgba(107,142,58,.08); color: var(--color-primary);
  border: none; cursor: pointer; transition: background .15s;
}
.mkcamp-ico-btn:hover { background: rgba(107,142,58,.18); }
.mkcamp-ico-btn--detail { background: rgba(59,130,246,.08); color: #1d4ed8; }
.mkcamp-ico-btn--detail:hover { background: rgba(59,130,246,.18); }
.mkcamp-ico-btn--del { background: rgba(239,68,68,.08); color: #b91c1c; }
.mkcamp-ico-btn--del:hover { background: rgba(239,68,68,.18); }

/* ── Modales ── */
.mk-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.mk-modal {
  background: var(--color-bg, #fff);
  border-radius: 18px; width: 100%; max-width: 600px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.18);
}
.mk-modal--sm { max-width: 440px; }
.mk-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.25rem 0.75rem; border-bottom: 1px solid rgba(107,142,58,.12);
}
.mk-modal-hd h2 { font-size: 1rem; font-weight: 700; margin: 0; }
.mk-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--color-muted); padding: 4px; }
.mk-modal-bd { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.mk-modal-ft {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 0.75rem 1.25rem 1rem; border-top: 1px solid rgba(107,142,58,.08);
}

.mk-field { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 100px; }
.mk-field--grow { flex: 2; }
.mk-field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); }
.mk-field input, .mk-field select, .mk-field textarea {
  padding: 0.5rem 0.75rem; border-radius: 10px; font-size: 0.85rem;
}
.mk-field textarea { resize: vertical; }
.mk-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }

.mk-section-hd {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--color-muted);
  border-top: 1px solid rgba(107,142,58,.1); padding-top: 0.6rem; margin-top: 0.25rem;
}

.mk-stage-check-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mk-stage-check { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; cursor: pointer; }
.mk-stage-check input { cursor: pointer; accent-color: var(--color-primary); }

.mk-preview-dest {
  font-size: 0.78rem; color: var(--color-muted);
  background: rgba(107,142,58,.07); border-radius: 8px;
  padding: 0.45rem 0.75rem; display: flex; align-items: center; gap: 0.4rem;
}
.mk-preview-dest strong { color: var(--color-primary); font-size: 0.9rem; }

.mk-error { color: #b91c1c; font-size: 0.8rem; margin: 0; }

/* destinatarios list */
.mk-dest-count { font-size: 0.82rem; color: var(--color-muted); margin-bottom: 0.75rem; }
.mk-dest-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.mk-dest-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.5rem; border-radius: 8px;
  background: rgba(107,142,58,.04); font-size: 0.82rem;
}
.mk-dest-cod  { font-size: 0.68rem; font-weight: 700; color: var(--color-primary); min-width: 40px; }
.mk-dest-name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-dest-stage {
  font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 5px; white-space: nowrap; flex-shrink: 0;
}
.mk-dest-empty { font-size: 0.8rem; color: var(--color-muted); text-align: center; padding: 1rem; }

[data-theme="dark"] .mkcamp-card,
[data-theme="dark"] .mk-modal {
  background: rgba(13,18,35,.88) !important;
  border-color: rgba(255,255,255,.07) !important;
}
[data-theme="dark"] .mkcamp-stats { background: rgba(255,255,255,.04) !important; }
</style>
