<template>
  <div class="mkd-wrap">

    <!-- KPI row -->
    <div class="mkd-kpis">
      <div class="mkd-kpi">
        <i class="bi bi-megaphone-fill mkd-kpi-icon" style="color:#6b8e3a"></i>
        <div>
          <div class="mkd-kpi-val">{{ mStore.stats.total }}</div>
          <div class="mkd-kpi-lbl">Campañas totales</div>
        </div>
      </div>
      <div class="mkd-kpi">
        <i class="bi bi-play-circle-fill mkd-kpi-icon" style="color:#3b82f6"></i>
        <div>
          <div class="mkd-kpi-val">{{ mStore.stats.activas }}</div>
          <div class="mkd-kpi-lbl">Campañas activas</div>
        </div>
      </div>
      <div class="mkd-kpi">
        <i class="bi bi-people-fill mkd-kpi-icon" style="color:#8b5cf6"></i>
        <div>
          <div class="mkd-kpi-val">{{ crmStore.visibleClients.length }}</div>
          <div class="mkd-kpi-lbl">Cuentas registradas</div>
        </div>
      </div>
      <div class="mkd-kpi">
        <i class="bi bi-person-lines-fill mkd-kpi-icon" style="color:#f59e0b"></i>
        <div>
          <div class="mkd-kpi-val">{{ mStore.contacts.length }}</div>
          <div class="mkd-kpi-lbl">Contactos</div>
        </div>
      </div>
      <div class="mkd-kpi">
        <i class="bi bi-send-fill mkd-kpi-icon" style="color:#22c55e"></i>
        <div>
          <div class="mkd-kpi-val">{{ mStore.stats.enviados }}</div>
          <div class="mkd-kpi-lbl">Enviados (total)</div>
        </div>
      </div>
      <div class="mkd-kpi">
        <i class="bi bi-arrow-up-right-circle-fill mkd-kpi-icon" style="color:#ec4899"></i>
        <div>
          <div class="mkd-kpi-val">{{ mStore.stats.tasa }}%</div>
          <div class="mkd-kpi-lbl">Tasa de conversión</div>
        </div>
      </div>
    </div>

    <div class="mkd-grid">
      <!-- Campañas recientes -->
      <div class="mkd-panel mkd-panel--wide">
        <div class="mkd-panel-hd">
          <i class="bi bi-megaphone"></i> Campañas recientes
        </div>
        <div v-if="!mStore.campaigns.length" class="mkd-empty">
          <i class="bi bi-megaphone" style="font-size:2rem;opacity:.3"></i>
          <p>No hay campañas todavía</p>
        </div>
        <table v-else class="mkd-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Enviados</th>
              <th>Respondidos</th>
              <th>Convertidos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in recentCampaigns" :key="c._id">
              <td class="mkd-td-name">{{ c.nombre }}</td>
              <td><span class="mkd-tipo" :class="`mkd-tipo--${c.tipo}`">{{ TIPO_LABEL[c.tipo] || c.tipo }}</span></td>
              <td><span class="mkd-estado" :class="`mkd-estado--${c.estado}`">{{ ESTADO_LABEL[c.estado] || c.estado }}</span></td>
              <td class="mkd-num">{{ c.stats?.enviados || 0 }}</td>
              <td class="mkd-num">{{ c.stats?.respondidos || 0 }}</td>
              <td class="mkd-num mkd-num--conv">{{ c.stats?.convertidos || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Clientes por etapa pipeline -->
      <div class="mkd-panel">
        <div class="mkd-panel-hd">
          <i class="bi bi-kanban"></i> Clientes por etapa
        </div>
        <div class="mkd-stage-list">
          <div v-for="s in stageBreakdown" :key="s.key" class="mkd-stage-row">
            <div class="mkd-stage-bar-wrap">
              <span class="mkd-stage-lbl">{{ s.label }}</span>
              <div class="mkd-stage-bar">
                <div class="mkd-stage-fill" :style="{ width: s.pct + '%', background: s.color }"></div>
              </div>
              <span class="mkd-stage-count">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Embudo de conversión -->
      <div class="mkd-panel">
        <div class="mkd-panel-hd">
          <i class="bi bi-filter"></i> Embudo global
        </div>
        <div class="mkd-funnel">
          <div v-for="(step, i) in funnel" :key="i" class="mkd-funnel-step">
            <div class="mkd-funnel-bar-wrap">
              <div class="mkd-funnel-bar" :style="{ width: step.pct + '%', background: step.color }"></div>
            </div>
            <div class="mkd-funnel-info">
              <span class="mkd-funnel-lbl">{{ step.label }}</span>
              <span class="mkd-funnel-val">{{ step.val }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribución por tipo de cliente -->
      <div class="mkd-panel">
        <div class="mkd-panel-hd">
          <i class="bi bi-person-badge"></i> Tipo de cliente
        </div>
        <div class="mkd-donut-wrap">
          <svg viewBox="0 0 100 100" class="mkd-donut">
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(107,142,58,.1)" stroke-width="16"/>
            <circle
              v-if="donut.normales + donut.potenciales > 0"
              cx="50" cy="50" r="38" fill="none"
              stroke="#6b8e3a" stroke-width="16"
              :stroke-dasharray="`${donut.normalesPct} ${100 - donut.normalesPct}`"
              stroke-dashoffset="25"
              pathLength="100"
            />
            <circle
              v-if="donut.normales + donut.potenciales > 0"
              cx="50" cy="50" r="38" fill="none"
              stroke="#3b82f6" stroke-width="16"
              :stroke-dasharray="`${donut.potencialesPct} ${100 - donut.potencialesPct}`"
              :stroke-dashoffset="25 - donut.normalesPct"
              pathLength="100"
            />
            <text x="50" y="47" text-anchor="middle" class="mkd-donut-num">{{ donut.normales + donut.potenciales }}</text>
            <text x="50" y="58" text-anchor="middle" class="mkd-donut-sub">total</text>
          </svg>
          <div class="mkd-donut-legend">
            <div class="mkd-legend-row">
              <span class="mkd-legend-dot" style="background:#6b8e3a"></span>
              <span>Clientes ({{ donut.normales }})</span>
            </div>
            <div class="mkd-legend-row">
              <span class="mkd-legend-dot" style="background:#3b82f6"></span>
              <span>Potenciales ({{ donut.potenciales }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMarketingStore } from '@/stores/marketing'
import { useCrmStore } from '@/stores/crm'

const mStore  = useMarketingStore()
const crmStore = useCrmStore()

const TIPO_LABEL  = { email: 'Email', whatsapp: 'WhatsApp', mixta: 'Mixta', llamada: 'Llamada' }
const ESTADO_LABEL = { borrador: 'Borrador', activa: 'Activa', pausada: 'Pausada', finalizada: 'Finalizada' }

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevos leads',  color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',    color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',      color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',        color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',       color: '#ef4444' },
]

const recentCampaigns = computed(() => mStore.campaigns.slice(0, 8))

const stageBreakdown = computed(() => {
  const total = crmStore.visibleClients.length || 1
  return STAGES.map(s => {
    const count = crmStore.visibleClients.filter(c => c.pipelineEstado === s.key).length
    return { ...s, count, pct: Math.round((count / total) * 100) }
  })
})

const funnel = computed(() => {
  const env = mStore.stats.enviados
  const abi = mStore.campaigns.reduce((s, c) => s + (c.stats?.abiertos || 0), 0)
  const res = mStore.campaigns.reduce((s, c) => s + (c.stats?.respondidos || 0), 0)
  const con = mStore.stats.convertidos
  const base = env || 1
  return [
    { label: 'Enviados',    val: env, pct: 100,                        color: '#6b8e3a' },
    { label: 'Abiertos',    val: abi, pct: Math.round(abi/base*100),   color: '#3b82f6' },
    { label: 'Respondidos', val: res, pct: Math.round(res/base*100),   color: '#f59e0b' },
    { label: 'Convertidos', val: con, pct: Math.round(con/base*100),   color: '#22c55e' },
  ]
})

const donut = computed(() => {
  const normales    = crmStore.visibleClients.filter(c => c.tipoCliente === 'normal').length
  const potenciales = crmStore.visibleClients.filter(c => c.tipoCliente === 'potencial').length
  const total = normales + potenciales || 1
  return {
    normales, potenciales,
    normalesPct:    Math.round(normales / total * 100),
    potencialesPct: Math.round(potenciales / total * 100),
  }
})
</script>

<style scoped>
.mkd-wrap { padding: 0.25rem 0; }

/* ── KPIs ── */
.mkd-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.mkd-kpi {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(107,142,58,.1);
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
.mkd-kpi-icon { font-size: 1.4rem; flex-shrink: 0; }
.mkd-kpi-val  { font-size: 1.5rem; font-weight: 800; color: var(--color-text); line-height: 1; }
.mkd-kpi-lbl  { font-size: 0.68rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 2px; }

/* ── Main grid ── */
.mkd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
@media (max-width: 900px) { .mkd-grid { grid-template-columns: 1fr; } }

.mkd-panel {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(107,142,58,.1);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  min-width: 0;
}
.mkd-panel--wide { grid-column: 1 / -1; }

.mkd-panel-hd {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--color-muted);
  margin-bottom: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.mkd-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem 0; color: var(--color-muted); font-size: 0.8rem; }

/* ── Table ── */
.mkd-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.mkd-table th { text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-muted); padding: 0.35rem 0.5rem; border-bottom: 1px solid rgba(107,142,58,.12); }
.mkd-table td { padding: 0.5rem 0.5rem; border-bottom: 1px solid rgba(107,142,58,.06); vertical-align: middle; }
.mkd-td-name { font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mkd-num     { text-align: right; font-variant-numeric: tabular-nums; }
.mkd-num--conv { font-weight: 700; color: #22c55e; }

.mkd-tipo {
  display: inline-flex; align-items: center;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
  text-transform: uppercase; letter-spacing: .04em;
}
.mkd-tipo--email     { background: rgba(59,130,246,.12); color: #1d4ed8; }
.mkd-tipo--whatsapp  { background: rgba(34,197,94,.12); color: #15803d; }
.mkd-tipo--mixta     { background: rgba(107,142,58,.12); color: #4d6728; }
.mkd-tipo--llamada   { background: rgba(245,158,11,.12); color: #b45309; }

.mkd-estado {
  display: inline-flex; align-items: center;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
}
.mkd-estado--borrador   { background: rgba(148,163,184,.15); color: #475569; }
.mkd-estado--activa     { background: rgba(34,197,94,.12); color: #15803d; }
.mkd-estado--pausada    { background: rgba(245,158,11,.12); color: #b45309; }
.mkd-estado--finalizada { background: rgba(107,142,58,.12); color: #4d6728; }

/* ── Stage bars ── */
.mkd-stage-list { display: flex; flex-direction: column; gap: 0.55rem; }
.mkd-stage-bar-wrap { display: flex; align-items: center; gap: 0.5rem; }
.mkd-stage-lbl   { font-size: 0.72rem; color: var(--color-text); min-width: 90px; }
.mkd-stage-bar   { flex: 1; height: 8px; background: rgba(107,142,58,.08); border-radius: 4px; overflow: hidden; }
.mkd-stage-fill  { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.mkd-stage-count { font-size: 0.72rem; font-weight: 700; min-width: 24px; text-align: right; color: var(--color-text); }

/* ── Funnel ── */
.mkd-funnel { display: flex; flex-direction: column; gap: 0.6rem; }
.mkd-funnel-step {}
.mkd-funnel-info { display: flex; justify-content: space-between; margin-bottom: 3px; }
.mkd-funnel-lbl  { font-size: 0.72rem; color: var(--color-muted); }
.mkd-funnel-val  { font-size: 0.72rem; font-weight: 700; color: var(--color-text); }
.mkd-funnel-bar-wrap { height: 10px; background: rgba(107,142,58,.08); border-radius: 5px; overflow: hidden; }
.mkd-funnel-bar  { height: 100%; border-radius: 5px; transition: width 0.5s ease; }

/* ── Donut ── */
.mkd-donut-wrap { display: flex; align-items: center; gap: 1.25rem; }
.mkd-donut { width: 120px; height: 120px; transform: rotate(-90deg); flex-shrink: 0; }
.mkd-donut-num  { font-size: 16px; font-weight: 800; fill: var(--color-text); transform: rotate(90deg); transform-origin: 50% 50%; }
.mkd-donut-sub  { font-size: 8px; fill: var(--color-muted); transform: rotate(90deg); transform-origin: 50% 50%; }
.mkd-donut-legend { display: flex; flex-direction: column; gap: 0.5rem; }
.mkd-legend-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; }
.mkd-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* dark mode */
[data-theme="dark"] .mkd-kpi,
[data-theme="dark"] .mkd-panel {
  background: rgba(13,18,35,.75) !important;
  border-color: rgba(255,255,255,.07) !important;
}
</style>
