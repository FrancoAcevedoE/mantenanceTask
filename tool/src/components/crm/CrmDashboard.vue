<template>
  <div class="crm-dash">

    <!-- Report trigger -->
    <div class="dash-actions">
      <button class="dash-report-btn" @click="showReport = true">
        <i class="bi bi-file-earmark-bar-graph-fill"></i>
        Reportes
      </button>
    </div>

    <!-- Stat cards -->
    <div class="dash-grid">
      <div class="dash-card">
        <div class="dash-icon" style="background:rgba(59,130,246,.12);color:#3b82f6">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value">{{ crmStore.visibleClients.length }}</div>
          <div class="dash-label">Clientes activos</div>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-icon" style="background:rgba(245,158,11,.12);color:#f59e0b">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value">{{ pendingQuotes }}</div>
          <div class="dash-label">Cotizaciones pendientes</div>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-icon" style="background:rgba(34,197,94,.12);color:#22c55e">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value">{{ approvedQuotes }}</div>
          <div class="dash-label">Cotizaciones aprobadas</div>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-icon" style="background:rgba(239,68,68,.12);color:#ef4444">
          <i class="bi bi-x-circle-fill"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value">{{ rejectedQuotes }}</div>
          <div class="dash-label">Cotizaciones rechazadas</div>
        </div>
      </div>

      <div class="dash-card">
        <div class="dash-icon" style="background:rgba(107,142,58,.12);color:var(--color-primary)">
          <i class="bi bi-cash-stack"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value dash-value--sm">{{ fmt(totalQuoted) }}</div>
          <div class="dash-label">Total cotizado</div>
        </div>
      </div>

      <div class="dash-card dash-card--green">
        <div class="dash-icon" style="background:rgba(255,255,255,.2);color:#fff">
          <i class="bi bi-trophy-fill"></i>
        </div>
        <div class="dash-info">
          <div class="dash-value dash-value--sm" style="color:#fff">{{ fmt(totalSold) }}</div>
          <div class="dash-label" style="color:rgba(255,255,255,.8)">Total vendido</div>
        </div>
      </div>
    </div>

    <!-- Bottom section -->
    <div class="dash-bottom">

      <!-- Pipeline summary -->
      <div class="dash-panel">
        <div class="dash-panel-header">
          <i class="bi bi-kanban-fill"></i> Estado del pipeline
        </div>
        <div class="pipeline-bars">
          <div v-for="st in STAGES" :key="st.key" class="pb-col">
            <div class="pb-bar-wrap">
              <div class="pb-bar-track">
                <div
                  class="pb-bar-fill"
                  :style="{ height: barH(st.key), background: st.color }"
                ></div>
              </div>
            </div>
            <div class="pb-count" :style="{ color: st.color }">{{ stageN(st.key) }}</div>
            <div class="pb-name">{{ st.shortLabel }}</div>
          </div>
        </div>
        <div class="stage-legend">
          <div v-for="st in STAGES" :key="st.key" class="sl-item">
            <span class="sl-dot" :style="{ background: st.color }"></span>
            <span class="sl-txt">{{ st.label }}</span>
          </div>
        </div>
      </div>

      <!-- Recent activities -->
      <div class="dash-panel">
        <div class="dash-panel-header">
          <i class="bi bi-clock-history"></i> Actividades recientes
        </div>
        <div v-if="!crmStore.recentActivities.length" class="dash-empty">
          Sin actividades registradas
        </div>
        <div v-else class="act-list">
          <div
            v-for="act in crmStore.recentActivities.slice(0, 7)"
            :key="act._id"
            class="act-row"
            :class="{ 'act-row--done': act.completada }"
          >
            <div class="act-icon" :style="{ background: ACT[act.tipo]?.color }">
              <i :class="ACT[act.tipo]?.icon"></i>
            </div>
            <div class="act-body">
              <div class="act-title">{{ act.titulo }}</div>
              <div class="act-meta">{{ act.clienteNombre }} · {{ fmtDate(act.createdAt) }}</div>
            </div>
            <i v-if="act.completada" class="bi bi-check-circle-fill act-check"></i>
          </div>
        </div>
      </div>

    </div>

    <div v-if="loading" class="dash-overlay">
      <div class="crm-spinner"></div>
    </div>

    <CrmReportBuilder v-if="showReport" :quotes="quotes" @close="showReport = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useCrmStore } from '@/stores/crm'
import CrmReportBuilder from './CrmReportBuilder.vue'

const crmStore     = useCrmStore()
const quotes       = ref([])
const loading      = ref(false)
const showReport   = ref(false)

const STAGES = [
  { key: 'nuevo_lead',        label: 'Nuevos Clientes',     shortLabel: 'Nuevos',  color: '#3b82f6' },
  { key: 'contactado',        label: 'Contactado',           shortLabel: 'Cont.',   color: '#8b5cf6' },
  { key: 'cotizacion_enviada',label: 'Cotización Enviada',   shortLabel: 'Prop.',   color: '#f59e0b' },
  { key: 'negociacion',       label: 'Negociación',          shortLabel: 'Neg.',    color: '#6366f1' },
  { key: 'ganado',            label: 'Ganado',               shortLabel: 'Won',     color: '#22c55e' },
  { key: 'perdido',           label: 'Perdido',              shortLabel: 'Lost',    color: '#ef4444' },
]

const ACT = {
  llamada: { icon: 'bi bi-telephone-fill', color: '#3b82f6' },
  reunion: { icon: 'bi bi-people-fill',    color: '#8b5cf6' },
  correo:  { icon: 'bi bi-envelope-fill',  color: '#f59e0b' },
  nota:    { icon: 'bi bi-sticky-fill',    color: '#6b8e3a' },
}

const qTotal  = (q) => (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0)
const pendingQuotes  = computed(() => quotes.value.filter(q => ['borrador','enviada'].includes(q.estado)).length)
const approvedQuotes = computed(() => quotes.value.filter(q => q.estado === 'aceptada').length)
const rejectedQuotes = computed(() => quotes.value.filter(q => q.estado === 'rechazada').length)
const totalQuoted    = computed(() => quotes.value.reduce((s, q) => s + qTotal(q), 0))
const totalSold      = computed(() => quotes.value.filter(q => q.estado === 'aceptada').reduce((s, q) => s + qTotal(q), 0))

function stageN(key) { return (crmStore.clientsByStage[key] || []).length }
function barH(key) {
  const max = Math.max(...Object.values(crmStore.clientsByStage).map(a => a.length), 1)
  return `${Math.max((stageN(key) / max) * 72, 4)}px`
}

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

onMounted(async () => {
  loading.value = true
  try {
    const token = sessionStorage.getItem('token')
    const { data } = await axios.get(`${API_BASE_URL}/quotes`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    quotes.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.crm-dash { position: relative; }

/* ── Actions bar ── */
.dash-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.dash-report-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  border: 1.5px solid rgba(107,142,58,.25);
  box-shadow: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s, border-color 0.18s, transform 0.15s;
}

.dash-report-btn:hover {
  background: rgba(107,142,58,.18);
  border-color: rgba(107,142,58,.45);
  transform: translateY(-1px);
}

/* ── Stat grid ── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.dash-card {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: rgba(255,255,255,0.9);
  border-radius: 14px;
  padding: 0.7rem 0.75rem;
  box-shadow: 0 2px 10px rgba(42,53,32,.08);
  border: 1px solid rgba(107,142,58,.1);
  min-width: 0;
}

.dash-card--green {
  background: linear-gradient(135deg, #6b8e3a, #4a6429);
  border-color: transparent;
}

.dash-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.dash-info { min-width: 0; flex: 1; }

.dash-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.1;
  font-family: 'Poppins', sans-serif;
  text-transform: none;
  word-break: break-all;
}

.dash-value--sm { font-size: 0.95rem; }

.dash-label {
  font-size: 0.62rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
  line-height: 1.35;
  white-space: normal;
}

/* ── Bottom ── */
.dash-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.dash-panel {
  background: rgba(255,255,255,0.9);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(107,142,58,.1);
}

.dash-panel-header {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Pipeline bar chart ── */
.pipeline-bars {
  display: flex;
  align-items: flex-end;   /* alinea columnas desde abajo para que barras crezcan hacia arriba */
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.pb-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
}

.pb-bar-wrap {
  width: 100%;
  height: 72px;           /* altura máxima del gráfico — fija y en el padre */
  display: flex;
  align-items: flex-end;  /* barra crece desde abajo */
}

.pb-bar-track {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  background: rgba(107,142,58,.06);
  border-radius: 6px;
  overflow: hidden;
}

.pb-bar-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.45s ease;
  min-height: 4px;
}

.pb-count {
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  text-transform: none;
  line-height: 1.2;
}

.pb-name {
  font-size: 0.58rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1.2;
}

.stage-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.75rem;
}

.sl-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.sl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sl-txt {
  font-size: 0.68rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Activity list ── */
.act-list { display: flex; flex-direction: column; gap: 0.6rem; }

.act-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: rgba(107,142,58,.04);
  border: 1px solid rgba(107,142,58,.08);
  transition: background 0.18s;
}

.act-row--done { opacity: 0.55; }

.act-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.act-body { flex: 1; min-width: 0; }

.act-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.act-meta {
  font-size: 0.7rem;
  color: var(--color-muted);
  text-transform: none;
  margin-top: 1px;
}

.act-check { color: #22c55e; font-size: 0.9rem; flex-shrink: 0; }

.dash-empty {
  color: var(--color-muted);
  font-size: 0.82rem;
  text-align: center;
  padding: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Spinner overlay ── */
.dash-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.65);
  border-radius: 18px;
}

.crm-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(107,142,58,.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .dash-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .dash-grid { grid-template-columns: repeat(2, 1fr); }
  .dash-bottom { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .dash-grid { grid-template-columns: 1fr; }
}
</style>
