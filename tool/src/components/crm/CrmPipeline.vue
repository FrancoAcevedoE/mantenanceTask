<template>
  <div class="kp-wrap">

    <!-- Header -->
    <div class="kp-header">
      <div class="kp-hint">
        <i class="bi bi-arrows-move"></i>
        <span>Arrastrá las tarjetas para cambiar la etapa del cliente</span>
      </div>
      <div class="kp-totals">
        <span>Total: <strong>{{ crmStore.visibleClients.length }}</strong> clientes</span>
      </div>
    </div>

    <!-- Kanban board -->
    <div class="kp-board">
      <div
        v-for="stage in STAGES"
        :key="stage.key"
        class="kp-col"
        :class="{ 'kp-col--over': dragOver === stage.key }"
        @dragover.prevent="onDragOver(stage.key)"
        @dragleave="onDragLeave"
        @drop="onDrop(stage.key)"
      >
        <!-- Column header -->
        <div class="kp-col-header" :style="{ borderTopColor: stage.color }">
          <div class="kp-col-title">
            <i :class="stage.icon" :style="{ color: stage.color }"></i>
            <span>{{ stage.label }}</span>
          </div>
          <div class="kp-col-count" :style="{ background: stage.color + '20', color: stage.color }">
            {{ (crmStore.clientsByStage[stage.key] || []).length }}
          </div>
        </div>

        <!-- Cards -->
        <div class="kp-col-body">
          <div
            v-for="client in crmStore.clientsByStage[stage.key] || []"
            :key="client._id"
            class="kp-card"
            :class="{ 'kp-card--dragging': draggingId === client._id }"
            draggable="true"
            @dragstart="onDragStart(client)"
            @dragend="onDragEnd"
          >
            <div class="kp-card-top">
              <div class="kp-avatar" :style="{ background: avatarColor(client.razonSocial || client.name || '') }">
                {{ initials(client.razonSocial || client.name || '?') }}
              </div>
              <div class="kp-card-info">
                <div class="kp-card-name">{{ client.razonSocial || client.name || '—' }}</div>
                <div v-if="client.nombreComercial" class="kp-card-sub">{{ client.nombreComercial }}</div>
              </div>
            </div>

            <div v-if="client.contactoPrincipal || client.telefono" class="kp-card-meta">
              <span v-if="client.contactoPrincipal">
                <i class="bi bi-person"></i> {{ client.contactoPrincipal }}
              </span>
              <span v-if="client.telefono">
                <i class="bi bi-telephone"></i> {{ client.telefono }}
              </span>
            </div>

            <div class="kp-card-footer">
              <span class="kp-badge" :class="`kp-badge--${client.estado || 'activo'}`">
                {{ client.estado || 'activo' }}
              </span>
              <span class="kp-date">{{ fmtDate(client.createdAt) }}</span>
            </div>
          </div>

          <!-- Empty column -->
          <div v-if="!(crmStore.clientsByStage[stage.key] || []).length" class="kp-col-empty">
            <i class="bi bi-inbox" style="font-size:1.4rem;color:var(--color-muted);opacity:.5"></i>
            <span>Sin clientes</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCrmStore } from '@/stores/crm'

const crmStore = useCrmStore()

const draggingId = ref(null)
const dragOver   = ref(null)

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo Lead',         icon: 'bi bi-person-plus-fill',      color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',          icon: 'bi bi-telephone-fill',         color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotización Enviada',  icon: 'bi bi-file-earmark-text-fill', color: '#f59e0b' },
  { key: 'negociacion',        label: 'Negociación',         icon: 'bi bi-chat-dots-fill',         color: '#6366f1' },
  { key: 'ganado',             label: 'Ganado',              icon: 'bi bi-trophy-fill',            color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',             icon: 'bi bi-x-circle-fill',          color: '#ef4444' },
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

function onDragStart(client) {
  draggingId.value = client._id
}

function onDragOver(stageKey) {
  dragOver.value = stageKey
}

function onDragLeave() {
  dragOver.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOver.value   = null
}

async function onDrop(stageKey) {
  dragOver.value = null
  if (!draggingId.value) return
  const client = crmStore.clients.find(c => c._id === draggingId.value)
  if (!client || client.pipelineEstado === stageKey) {
    draggingId.value = null
    return
  }
  await crmStore.updatePipelineStage(draggingId.value, stageKey)
  draggingId.value = null
}
</script>

<style scoped>
.kp-wrap { display: flex; flex-direction: column; gap: 1rem; }

/* ── Header ── */
.kp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.kp-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.kp-hint i { font-size: 0.9rem; }

.kp-totals {
  font-size: 0.82rem;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Board ── */
.kp-board {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
  min-height: 520px;
  align-items: flex-start;
}

/* Custom scrollbar */
.kp-board::-webkit-scrollbar { height: 6px; }
.kp-board::-webkit-scrollbar-track { background: rgba(107,142,58,.06); border-radius: 3px; }
.kp-board::-webkit-scrollbar-thumb { background: rgba(107,142,58,.3); border-radius: 3px; }

/* ── Column ── */
.kp-col {
  flex: 0 0 230px;
  min-width: 230px;
  background: rgba(107,142,58,.04);
  border-radius: 18px;
  border: 2px solid transparent;
  transition: border-color 0.2s, background 0.2s;
  display: flex;
  flex-direction: column;
  max-height: 72vh;
}

.kp-col--over {
  border-color: rgba(107,142,58,.35);
  background: rgba(107,142,58,.09);
}

.kp-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 0.9rem 0.65rem;
  border-top: 4px solid;
  border-radius: 16px 16px 0 0;
}

.kp-col-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text);
}

.kp-col-title i { font-size: 0.85rem; }

.kp-col-count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
}

.kp-col-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

/* Custom scrollbar for columns */
.kp-col-body::-webkit-scrollbar { width: 4px; }
.kp-col-body::-webkit-scrollbar-thumb { background: rgba(107,142,58,.25); border-radius: 2px; }

/* ── Card ── */
.kp-card {
  background: rgba(255,255,255,0.97);
  border-radius: 14px;
  padding: 0.75rem;
  border: 1px solid rgba(107,142,58,.1);
  box-shadow: 0 2px 8px rgba(42,53,32,.07);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.18s, transform 0.18s, opacity 0.18s;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.kp-card:hover {
  box-shadow: 0 5px 16px rgba(42,53,32,.14);
  transform: translateY(-1px);
}

.kp-card:active { cursor: grabbing; }

.kp-card--dragging {
  opacity: 0.45;
  transform: scale(0.97);
}

.kp-card-top {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.kp-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  text-transform: uppercase;
}

.kp-card-info { min-width: 0; flex: 1; }

.kp-card-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kp-card-sub {
  font-size: 0.7rem;
  color: var(--color-muted);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kp-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.kp-card-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--color-text);
  text-transform: none;
}

.kp-card-meta i { color: var(--color-muted); font-size: 0.72rem; }

.kp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.1rem;
}

.kp-badge {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
}

.kp-badge--activo   { background: rgba(34,197,94,.12);  color: #16a34a; }
.kp-badge--inactivo { background: rgba(239,68,68,.12);  color: #dc2626; }

.kp-date {
  font-size: 0.65rem;
  color: var(--color-muted);
  text-transform: uppercase;
}

/* ── Empty column ── */
.kp-col-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 100px;
  color: var(--color-muted);
}

.kp-col-empty span {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
