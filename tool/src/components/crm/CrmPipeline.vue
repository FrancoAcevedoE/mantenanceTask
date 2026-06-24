<template>
  <div class="kp-wrap">

    <!-- Header -->
    <div class="kp-header">
      <div class="kp-hint">
        <i class="bi bi-arrows-move"></i>
        <span>Arrastrá para cambiar etapa</span>
      </div>
      <span class="kp-total">{{ nuevosClientes.length }} nuevos clientes</span>
    </div>

    <!-- Kanban board — siempre 6 columnas iguales, sin scroll lateral de página -->
    <div class="kp-board">
      <div
        v-for="stage in STAGES"
        :key="stage.key"
        class="kp-col"
        :class="{ 'kp-col--over': dragOver === stage.key }"
        :data-stage="stage.key"
        @dragover.prevent="onDragOver(stage.key)"
        @dragleave="onDragLeave"
        @drop="onDrop(stage.key)"
      >
        <!-- Column header -->
        <div class="kp-col-head" :style="{ borderTopColor: stage.color }">
          <i :class="stage.icon" :style="{ color: stage.color }"></i>
          <span class="kp-col-name">{{ stage.label }}</span>
          <span class="kp-col-cnt" :style="{ background: stage.color + '22', color: stage.color }">
            {{ (clientsByStage[stage.key] || []).length }}
          </span>
        </div>

        <!-- Cards -->
        <div class="kp-col-body">
          <div
            v-for="client in clientsByStage[stage.key] || []"
            :key="client._id"
            class="kp-card"
            :class="{ 'kp-card--drag': draggingId === client._id }"
            draggable="true"
            @dragstart="onDragStart(client)"
            @dragend="onDragEnd"
            @touchstart.passive="onTouchStart(client)"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <div class="kp-card-top">
              <div class="kp-av" :style="{ background: avatarColor(client.razonSocial || client.name || '') }">
                {{ initials(client.razonSocial || client.name || '?') }}
              </div>
              <div class="kp-card-info">
                <div class="kp-card-name">{{ client.razonSocial || client.name || '—' }}</div>
                <div v-if="client.nombreComercial" class="kp-card-sub">{{ client.nombreComercial }}</div>
              </div>
              <button
                class="kp-edit-btn"
                title="Editar cliente"
                @click.stop="emit('edit-client', client)"
              ><i class="bi bi-pencil"></i></button>
            </div>

            <div v-if="client.contactoPrincipal || client.telefono" class="kp-card-meta">
              <span v-if="client.contactoPrincipal">
                <i class="bi bi-person"></i>{{ client.contactoPrincipal }}
              </span>
              <span v-if="client.telefono">
                <i class="bi bi-telephone"></i>{{ client.telefono }}
              </span>
            </div>

            <div class="kp-card-foot">
              <span class="kp-tipo" :class="`kp-tipo--${client.tipoCliente || 'potencial'}`">
                <i :class="client.tipoCliente === 'normal' ? 'bi bi-person-check-fill' : 'bi bi-star-fill'"></i>
                {{ client.tipoCliente === 'normal' ? 'Cliente' : 'Pot.' }}
              </span>
              <span class="kp-date">{{ fmtDate(client.createdAt) }}</span>
            </div>
          </div>

          <div v-if="!(clientsByStage[stage.key] || []).length" class="kp-empty-col">
            <i class="bi bi-inbox"></i>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/stores/crm'

const crmStore = useCrmStore()

const draggingId    = ref(null)
const dragOver      = ref(null)
const touchClientId = ref(null)

// Solo clientes potenciales (nuevos)
const nuevosClientes = computed(() =>
  crmStore.visibleClients.filter(c => c.tipoCliente === 'potencial')
)

const clientsByStage = computed(() => {
  const map = {}
  for (const s of STAGES) {
    map[s.key] = nuevosClientes.value.filter(c => c.pipelineEstado === s.key)
  }
  return map
})

const emit = defineEmits(['edit-client'])

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo Lead',  icon: 'bi bi-person-plus-fill',      color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',  icon: 'bi bi-telephone-fill',         color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',    icon: 'bi bi-file-earmark-text-fill', color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',      icon: 'bi bi-trophy-fill',            color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',     icon: 'bi bi-x-circle-fill',          color: '#ef4444' },
]

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#6366f1','#22c55e','#ec4899','#6b8e3a','#ef4444']
function avatarColor(name) {
  let n = 0; for (const c of name) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''

function onDragStart(client) { draggingId.value = client._id }
function onDragOver(key)     { dragOver.value = key }
function onDragLeave()       { dragOver.value = null }
function onDragEnd()         { draggingId.value = null; dragOver.value = null }

// ── Touch drag (mobile) ──────────────────────────────────────────────────────
function onTouchStart(client) {
  touchClientId.value = client._id
}

function onTouchMove(event) {
  if (!touchClientId.value) return
  if (!draggingId.value) draggingId.value = touchClientId.value
  const touch = event.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  const colEl = el?.closest('[data-stage]')
  dragOver.value = colEl?.dataset.stage || null
}

function onTouchEnd() {
  const stageKey = dragOver.value
  const clientId = draggingId.value
  touchClientId.value = null
  dragOver.value      = null
  draggingId.value    = null
  if (clientId && stageKey) onDrop(stageKey)
}

async function onDrop(stageKey) {
  dragOver.value = null
  if (!draggingId.value) return
  const client = crmStore.clients.find(c => c._id === draggingId.value)
  if (!client || client.pipelineEstado === stageKey) { draggingId.value = null; return }
  await crmStore.updatePipelineStage(draggingId.value, stageKey)
  draggingId.value = null
}
</script>

<style scoped>
.kp-wrap { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; overflow: hidden; }

/* ── Header ── */
.kp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.kp-hint {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kp-hint i { font-size: 0.85rem; }

.kp-total {
  font-size: 0.76rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* ── Board: 6 columnas en grid, siempre caben en pantalla ── */
.kp-board {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.55rem;
  align-items: start;
  width: 100%;
  min-width: 0;
}

/* ── Column ── */
.kp-col {
  min-width: 0;
  background: rgba(107,142,58,.04);
  border-radius: 14px;
  border: 2px solid transparent;
  transition: border-color 0.18s, background 0.18s;
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  overflow: hidden;
}

.kp-col--over {
  border-color: rgba(107,142,58,.4);
  background: rgba(107,142,58,.08);
}

/* ── Column header ── */
.kp-col-head {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.6rem 0.55rem 0.45rem;
  border-top: 3px solid;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.kp-col-head i { font-size: 0.75rem; flex-shrink: 0; }

.kp-col-name {
  flex: 1;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.kp-col-cnt {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.08rem 0.4rem;
  border-radius: 999px;
  flex-shrink: 0;
}

/* ── Column body ── */
.kp-col-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 0.45rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.kp-col-body::-webkit-scrollbar { width: 3px; }
.kp-col-body::-webkit-scrollbar-thumb { background: rgba(107,142,58,.25); border-radius: 2px; }

/* ── Card ── */
.kp-card {
  background: rgba(255,255,255,.97);
  border-radius: 10px;
  padding: 0.55rem 0.6rem;
  border: 1px solid rgba(107,142,58,.1);
  box-shadow: 0 1px 6px rgba(42,53,32,.07);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.15s, transform 0.15s, opacity 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.kp-card:hover { box-shadow: 0 4px 12px rgba(42,53,32,.14); transform: translateY(-1px); }
.kp-card:active { cursor: grabbing; }
.kp-card--drag { opacity: 0.4; transform: scale(0.96); }

.kp-card-top { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }

.kp-edit-btn {
  background: none; border: none; cursor: pointer;
  padding: 0.2rem 0.3rem; border-radius: 6px;
  color: var(--color-muted); font-size: 0.75rem;
  flex-shrink: 0; opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}
.kp-card:hover .kp-edit-btn { opacity: 1; }
.kp-edit-btn:hover { background: rgba(107,142,58,0.12); color: var(--color-primary, #6b8e3a); }

.kp-av {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.72rem; font-weight: 700;
  flex-shrink: 0; text-transform: uppercase;
}

.kp-card-info { min-width: 0; flex: 1; }

.kp-card-name {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.kp-card-sub {
  font-size: 0.65rem;
  color: var(--color-muted);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kp-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.kp-card-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.66rem;
  color: var(--color-text);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kp-card-meta i { color: var(--color-muted); font-size: 0.65rem; flex-shrink: 0; }

.kp-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.kp-tipo {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
}

.kp-tipo--potencial { background: rgba(245,158,11,.14); color: #b45309; }
.kp-tipo--normal    { background: rgba(34,197,94,.14);  color: #16a34a; }

.kp-date {
  font-size: 0.6rem;
  color: var(--color-muted);
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Empty column placeholder ── */
.kp-empty-col {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: var(--color-muted);
  opacity: 0.35;
  font-size: 1.2rem;
}

/* ── Mobile: 2 columnas por fila ── */
@media (max-width: 640px) {
  .kp-board {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  .kp-col { max-height: 55vh; }
  .kp-wrap { overflow: visible; }
}
</style>
