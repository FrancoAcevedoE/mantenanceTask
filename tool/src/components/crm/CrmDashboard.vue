<template>
  <div class="crm-dash">

    <!-- ── Barra superior ── -->
    <div class="dash-topbar">
      <!-- Selector de mes -->
      <div class="month-nav">
        <button class="month-btn" @click="shiftMonth(-1)" title="Mes anterior">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="month-btn" @click="shiftMonth(1)" :disabled="isCurrentMonth" title="Mes siguiente">
          <i class="bi bi-chevron-right"></i>
        </button>
        <span v-if="!isCurrentMonth" class="month-current-hint" @click="goCurrentMonth">Ir al mes actual</span>
      </div>

      <!-- Toggle vista (solo admin_ventas) -->
      <div v-if="isAdminVentas" class="view-toggle">
        <button :class="['vt-btn', { active: viewMode === 'global' }]" @click="viewMode = 'global'">
          <i class="bi bi-bar-chart-fill"></i> Mi resumen
        </button>
        <button :class="['vt-btn', { active: viewMode === 'sellers' }]" @click="onSellerMode">
          <i class="bi bi-people-fill"></i> Por vendedor
        </button>
      </div>

      <button class="dash-report-btn" @click="showReport = true">
        <i class="bi bi-file-earmark-bar-graph-fill"></i> Reportes
      </button>
    </div>

    <!-- ── Spinner ── -->
    <div v-if="loading" class="dash-overlay"><div class="crm-spinner"></div></div>

    <!-- ════════════════════════════════════════
         MODO GLOBAL / VENDEDOR PROPIO
    ════════════════════════════════════════ -->
    <template v-if="viewMode === 'global' || !isAdminVentas">
      <!-- Stat cards -->
      <StatGrid :stats="stats" :fmt="fmt" />

      <!-- Pipeline + Actividades -->
      <div class="dash-bottom">
        <PipelinePanel :clients="crmStore.visibleClients" :stages="STAGES" />
        <ActivitiesPanel :activities="stats.activities?.recent || []" :act-map="ACT" :fmt-date="fmtDate" />
      </div>

      <!-- Historial de meses anteriores -->
      <HistoryPanel :history="history" :fmt="fmt" :fmt-month="fmtMonth" @select="selectHistoryMonth" />
    </template>

    <!-- ════════════════════════════════════════
         MODO POR VENDEDOR (solo admin_ventas)
    ════════════════════════════════════════ -->
    <template v-else>
      <div v-if="!sellers.length" class="dash-empty">No hay vendedores activos registrados.</div>
      <div v-else class="sellers-list">
        <div v-for="s in sellers" :key="s._id" class="seller-row">
          <!-- Cabecera de fila vendedor -->
          <button class="seller-row-hd" @click="toggleSeller(s._id)">
            <div class="seller-avatar" :style="{ background: avatarColor(s.name) }">
              {{ initials(s.name) }}
            </div>
            <span class="seller-name">{{ s.name }}</span>
            <div class="seller-mini-stats" v-if="sellerStats[s._id]">
              <span class="sms-item sms-item--quotes">
                <i class="bi bi-file-earmark-text-fill"></i>
                {{ sellerStats[s._id].quotes.total }} cotiz.
              </span>
              <span class="sms-item sms-item--sold">
                <i class="bi bi-trophy-fill"></i>
                {{ fmt(sellerStats[s._id].quotes.soldAmount) }}
              </span>
              <span class="sms-item sms-item--clients">
                <i class="bi bi-person-plus-fill"></i>
                {{ sellerStats[s._id].newClients }} nuevos
              </span>
            </div>
            <div v-else class="seller-loading"><div class="crm-spinner crm-spinner--sm"></div></div>
            <i :class="['bi', expandedSeller === s._id ? 'bi-chevron-up' : 'bi-chevron-down', 'seller-chevron']"></i>
          </button>

          <!-- Detalle expandido -->
          <Transition name="seller-expand">
            <div v-if="expandedSeller === s._id && sellerStats[s._id]" class="seller-detail">
              <StatGrid :stats="sellerStats[s._id]" :fmt="fmt" compact />
              <div class="dash-bottom dash-bottom--compact">
                <PipelinePanel :clients="sellerClients(s._id)" :stages="STAGES" compact />
                <ActivitiesPanel :activities="sellerStats[s._id].activities?.recent || []" :act-map="ACT" :fmt-date="fmtDate" compact />
              </div>
              <HistoryPanel :history="sellerHistory[s._id] || []" :fmt="fmt" :fmt-month="fmtMonth" compact @select="m => selectHistoryMonthSeller(s._id, m)" />
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <CrmReportBuilder v-if="showReport" :quotes="allQuotes" @close="showReport = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useCrmStore } from '@/stores/crm'
import CrmReportBuilder from './CrmReportBuilder.vue'
import { defineComponent, h } from 'vue'

const crmStore   = useCrmStore()
const allQuotes  = ref([])
const loading    = ref(false)
const showReport = ref(false)
const viewMode   = ref('global')  // 'global' | 'sellers'

// ── Rol ──
const currentUser  = computed(() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}') } catch { return {} } })
const isAdminVentas = computed(() => ['admin', 'admin_ventas'].includes(currentUser.value?.role))

// ── Selector de mes ──
const now = new Date()
const selYear  = ref(now.getFullYear())
const selMonth = ref(now.getMonth() + 1)

const isCurrentMonth = computed(() => selYear.value === now.getFullYear() && selMonth.value === now.getMonth() + 1)

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const monthLabel  = computed(() => `${MONTH_NAMES[selMonth.value - 1]} ${selYear.value}`)

function fmtMonth(year, month) { return `${MONTH_NAMES[month - 1].slice(0,3)} ${year}` }

function shiftMonth(delta) {
  let m = selMonth.value + delta
  let y = selYear.value
  if (m > 12) { m = 1;  y++ }
  if (m < 1)  { m = 12; y-- }
  selMonth.value = m
  selYear.value  = y
}
function goCurrentMonth() { selYear.value = now.getFullYear(); selMonth.value = now.getMonth() + 1 }

function selectHistoryMonth({ year, month }) {
  selYear.value = year; selMonth.value = month
}

// ── Stats globales ──
const stats   = ref({ quotes: { total:0, pending:0, approved:0, rejected:0, totalAmount:0, soldAmount:0 }, activities: { recent: [] }, newClients: 0 })
const history = ref([])

function authH() {
  const t = sessionStorage.getItem('token')
  return { headers: { Authorization: `Bearer ${t}` } }
}

async function loadStats() {
  loading.value = true
  try {
    const [sRes, hRes, qRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/dashboard/stats?year=${selYear.value}&month=${selMonth.value}`, authH()),
      axios.get(`${API_BASE_URL}/dashboard/history?months=12`, authH()),
      axios.get(`${API_BASE_URL}/quotes`, authH()),
    ])
    stats.value    = sRes.data
    history.value  = hRes.data
    allQuotes.value = Array.isArray(qRes.data) ? qRes.data : []
  } catch (e) {
    console.error('Dashboard stats error', e)
  } finally {
    loading.value = false
  }
}

watch([selYear, selMonth], loadStats)

// ── Vendedores (solo admin_ventas) ──
const sellers        = ref([])
const expandedSeller = ref(null)
const sellerStats    = ref({})
const sellerHistory  = ref({})

function sellerClients(sellerId) {
  return crmStore.visibleClients.filter(c => c.assignedToId === sellerId || c.createdBy === sellers.value.find(s => String(s._id) === sellerId)?.name)
}

async function onSellerMode() {
  viewMode.value = 'sellers'
  if (!sellers.value.length) {
    const { data } = await axios.get(`${API_BASE_URL}/dashboard/sellers`, authH())
    sellers.value = data
  }
}

async function toggleSeller(id) {
  if (expandedSeller.value === id) { expandedSeller.value = null; return }
  expandedSeller.value = id
  if (!sellerStats.value[id]) await loadSellerData(id)
}

async function loadSellerData(id) {
  const [sRes, hRes] = await Promise.all([
    axios.get(`${API_BASE_URL}/dashboard/stats?year=${selYear.value}&month=${selMonth.value}&sellerId=${id}`, authH()),
    axios.get(`${API_BASE_URL}/dashboard/history?months=12&sellerId=${id}`, authH()),
  ])
  sellerStats.value   = { ...sellerStats.value,   [id]: sRes.data }
  sellerHistory.value = { ...sellerHistory.value, [id]: hRes.data }
}

async function selectHistoryMonthSeller(id, { year, month }) {
  selYear.value = year; selMonth.value = month
  delete sellerStats.value[id]
  await loadSellerData(id)
}

watch([selYear, selMonth], async () => {
  if (viewMode.value === 'sellers' && expandedSeller.value) {
    delete sellerStats.value[expandedSeller.value]
    await loadSellerData(expandedSeller.value)
  }
})

// ── Helpers visuales ──
const fmt = (n) => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n)
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day:'2-digit', month:'short' })

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#6366f1','#22c55e','#ec4899','#6b8e3a','#ef4444']
function avatarColor(name) { let n=0; for(const c of (name||'')) n+=c.charCodeAt(0); return AVATAR_COLORS[n%AVATAR_COLORS.length] }
function initials(name) { return (name||'?').split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('') }

const STAGES = [
  { key:'nuevo_lead',         label:'Nuevos Clientes',   shortLabel:'Nuevos', color:'#3b82f6' },
  { key:'contactado',         label:'Contactado',         shortLabel:'Cont.',  color:'#8b5cf6' },
  { key:'cotizacion_enviada', label:'Cotización Enviada', shortLabel:'Prop.',  color:'#f59e0b' },
  { key:'negociacion',        label:'Negociación',        shortLabel:'Neg.',   color:'#6366f1' },
  { key:'ganado',             label:'Ganado',             shortLabel:'Won',    color:'#22c55e' },
  { key:'perdido',            label:'Perdido',            shortLabel:'Lost',   color:'#ef4444' },
]

const ACT = {
  llamada:  { icon:'bi bi-telephone-fill',  color:'#3b82f6' },
  reunion:  { icon:'bi bi-people-fill',     color:'#8b5cf6' },
  correo:   { icon:'bi bi-envelope-fill',   color:'#f59e0b' },
  nota:     { icon:'bi bi-sticky-fill',     color:'#6b8e3a' },
  difusion: { icon:'bi bi-megaphone-fill',  color:'#ec4899' },
}

onMounted(async () => {
  await Promise.all([
    loadStats(),
    crmStore.clients.length ? Promise.resolve() : crmStore.fetchClients(),
  ])
})

// ── Sub-componentes inline ──

const StatGrid = defineComponent({
  props: { stats: Object, fmt: Function, compact: Boolean },
  setup(props) {
    const s = computed(() => props.stats?.quotes || {})
    const nc = computed(() => props.stats?.newClients || 0)
    return () => h('div', { class: ['dash-grid', props.compact ? 'dash-grid--compact' : ''] }, [
      card('#3b82f6', 'bi-people-fill',        nc.value,                         'Nuevos clientes'),
      card('#f59e0b', 'bi-hourglass-split',    s.value.pending  || 0,            'Cotiz. pendientes'),
      card('#22c55e', 'bi-check-circle-fill',  s.value.approved || 0,            'Cotiz. aprobadas'),
      card('#ef4444', 'bi-x-circle-fill',      s.value.rejected || 0,            'Cotiz. rechazadas'),
      card('#6b8e3a', 'bi-cash-stack',         props.fmt(s.value.totalAmount||0), 'Total cotizado', true),
      cardGreen(props.fmt(s.value.soldAmount||0), 'Total vendido'),
    ])
    function card(color, icon, val, label, sm=false) {
      return h('div', { class:'dash-card' }, [
        h('div', { class:'dash-icon', style:`background:${color}1e;color:${color}` }, [ h('i', { class:`bi ${icon}` }) ]),
        h('div', { class:'dash-info' }, [
          h('div', { class:['dash-value', sm?'dash-value--sm':''] }, String(val)),
          h('div', { class:'dash-label' }, label),
        ])
      ])
    }
    function cardGreen(val, label) {
      return h('div', { class:'dash-card dash-card--green' }, [
        h('div', { class:'dash-icon', style:'background:rgba(255,255,255,.2);color:#fff' }, [ h('i', { class:'bi bi-trophy-fill' }) ]),
        h('div', { class:'dash-info' }, [
          h('div', { class:'dash-value dash-value--sm', style:'color:#fff' }, val),
          h('div', { class:'dash-label', style:'color:rgba(255,255,255,.8)' }, label),
        ])
      ])
    }
  }
})

const PipelinePanel = defineComponent({
  props: { clients: Array, stages: Array, compact: Boolean },
  setup(props) {
    function stageN(key) { return (props.clients||[]).filter(c=>c.pipelineEstado===key).length }
    function barH(key) {
      const max = Math.max(...props.stages.map(s=>stageN(s.key)), 1)
      return `${Math.max((stageN(key)/max)*72, 4)}px`
    }
    return () => h('div', { class:'dash-panel' }, [
      h('div', { class:'dash-panel-header' }, [ h('i',{class:'bi bi-kanban-fill'}), ' Estado del pipeline' ]),
      h('div', { class:'pipeline-bars' },
        props.stages.map(st => h('div', { class:'pb-col', key:st.key }, [
          h('div', { class:'pb-bar-wrap' }, [ h('div', { class:'pb-bar-track' }, [ h('div', { class:'pb-bar-fill', style:`height:${barH(st.key)};background:${st.color}` }) ]) ]),
          h('div', { class:'pb-count', style:`color:${st.color}` }, String(stageN(st.key))),
          h('div', { class:'pb-name' }, st.shortLabel),
        ]))
      ),
      h('div', { class:'stage-legend' },
        props.stages.map(st => h('div', { class:'sl-item', key:st.key }, [
          h('span', { class:'sl-dot', style:`background:${st.color}` }),
          h('span', { class:'sl-txt' }, st.label),
        ]))
      ),
    ])
  }
})

const ActivitiesPanel = defineComponent({
  props: { activities: Array, actMap: Object, fmtDate: Function, compact: Boolean },
  setup(props) {
    return () => h('div', { class:'dash-panel' }, [
      h('div', { class:'dash-panel-header' }, [ h('i',{class:'bi bi-clock-history'}), ' Actividades recientes' ]),
      !(props.activities||[]).length
        ? h('div', { class:'dash-empty' }, 'Sin actividades en este período')
        : h('div', { class:'act-list' },
            (props.activities||[]).map(act =>
              h('div', { class:['act-row', act.completada?'act-row--done':''], key:act._id }, [
                h('div', { class:'act-icon', style:`background:${props.actMap[act.tipo]?.color||'#999'}` }, [ h('i',{ class:props.actMap[act.tipo]?.icon||'bi bi-circle' }) ]),
                h('div', { class:'act-body' }, [
                  h('div', { class:'act-title' }, act.titulo),
                  h('div', { class:'act-meta' }, `${act.clienteNombre||''}${act.clienteNombre?' · ':''}${props.fmtDate(act.createdAt)}`),
                ]),
                act.completada ? h('i', { class:'bi bi-check-circle-fill act-check' }) : null,
              ])
            )
          )
    ])
  }
})

const HistoryPanel = defineComponent({
  props: { history: Array, fmt: Function, fmtMonth: Function, compact: Boolean },
  emits: ['select'],
  setup(props, { emit }) {
    const open = ref(false)
    return () => {
      if (!(props.history||[]).length) return null
      return h('div', { class:'history-panel' }, [
        h('button', { class:'history-toggle', onClick: () => open.value = !open.value }, [
          h('i', { class:`bi ${open.value?'bi-chevron-up':'bi-chevron-down'}` }),
          ` Historial mensual (últimos ${props.history.length} meses)`,
        ]),
        open.value
          ? h('div', { class:'history-grid' },
              props.history.map(row =>
                h('button', { class:'history-cell', key:`${row.year}-${row.month}`, onClick: () => emit('select', { year: row.year, month: row.month }) }, [
                  h('div', { class:'hc-month' }, props.fmtMonth(row.year, row.month)),
                  h('div', { class:'hc-stat' }, [ h('span', { class:'hc-num' }, row.quotes), h('span', { class:'hc-lbl' }, 'cotiz.') ]),
                  h('div', { class:'hc-stat hc-stat--green' }, [ h('span', { class:'hc-num' }, row.approved), h('span', { class:'hc-lbl' }, 'aprob.') ]),
                  h('div', { class:'hc-amount' }, props.fmt(row.soldAmount||0)),
                ])
              )
            )
          : null
      ])
    }
  }
})
</script>

<style scoped>
.crm-dash { position: relative; }

/* ── Top bar ── */
.dash-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

/* Selector de mes */
.month-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(107,142,58,.2);
  border-radius: 10px;
  padding: 0.3rem 0.5rem;
  flex-shrink: 0;
}
.month-btn {
  background: none;
  border: none;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 0.8rem;
  box-shadow: none;
  line-height: 1;
}
.month-btn:hover:not(:disabled) { background: rgba(107,142,58,.1); color: var(--color-primary); }
.month-btn:disabled { opacity: 0.35; cursor: default; }
.month-label { font-size: 0.85rem; font-weight: 700; color: var(--color-text); min-width: 130px; text-align: center; text-transform: none; letter-spacing: 0; font-family: inherit; }
.month-current-hint { font-size: 0.7rem; color: var(--color-primary); cursor: pointer; text-decoration: underline; text-transform: none; letter-spacing: 0; }

/* Toggle vista */
.view-toggle {
  display: flex;
  gap: 0.3rem;
  background: rgba(107,142,58,.07);
  border-radius: 10px;
  padding: 0.25rem;
}
.vt-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: none;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.vt-btn.active { background: #fff; color: var(--color-primary); box-shadow: 0 1px 4px rgba(0,0,0,.1); }

.dash-report-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  border: 1.5px solid rgba(107,142,58,.25);
  box-shadow: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dash-report-btn:hover { background: rgba(107,142,58,.18); border-color: rgba(107,142,58,.45); transform: translateY(-1px); }

/* ── Stat grid ── */
:deep(.dash-grid) {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;
}
:deep(.dash-grid--compact) { gap: 0.45rem; margin-bottom: 0.65rem; }

:deep(.dash-card) {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: rgba(255,255,255,.9);
  border-radius: 14px;
  padding: 0.7rem 0.75rem;
  box-shadow: 0 2px 10px rgba(42,53,32,.08);
  border: 1px solid rgba(107,142,58,.1);
  min-width: 0;
}
:deep(.dash-card--green) {
  background: linear-gradient(135deg, #6b8e3a, #4a6429);
  border-color: transparent;
}
:deep(.dash-icon) {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.95rem; flex-shrink: 0; margin-top: 2px;
}
:deep(.dash-info) { min-width: 0; flex: 1; }
:deep(.dash-value) {
  font-size: 1.4rem; font-weight: 700; color: var(--color-text);
  line-height: 1.1; font-family: 'Poppins', sans-serif;
  text-transform: none; word-break: break-all;
}
:deep(.dash-value--sm) { font-size: 0.92rem; }
:deep(.dash-label) {
  font-size: 0.6rem; color: var(--color-muted);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-top: 0.25rem; line-height: 1.35; white-space: normal;
}

/* ── Bottom ── */
:deep(.dash-bottom) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
:deep(.dash-bottom--compact) { gap: 0.5rem; margin-bottom: 0.5rem; }

:deep(.dash-panel) {
  background: rgba(255,255,255,.9);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(107,142,58,.1);
}
:deep(.dash-panel-header) {
  font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--color-muted); margin-bottom: 0.85rem;
  display: flex; align-items: center; gap: 0.4rem;
}

/* Pipeline */
:deep(.pipeline-bars) { display: flex; align-items: flex-end; gap: 0.5rem; margin-bottom: 0.6rem; }
:deep(.pb-col) { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.2rem; min-width:0; }
:deep(.pb-bar-wrap) { width:100%; height:72px; display:flex; align-items:flex-end; }
:deep(.pb-bar-track) { width:100%; height:100%; display:flex; align-items:flex-end; background:rgba(107,142,58,.06); border-radius:6px; overflow:hidden; }
:deep(.pb-bar-fill) { width:100%; border-radius:4px; transition:height .45s ease; min-height:4px; }
:deep(.pb-count) { font-size:.78rem; font-weight:700; font-family:'Poppins',sans-serif; text-transform:none; line-height:1.2; }
:deep(.pb-name) { font-size:.56rem; color:var(--color-muted); text-transform:uppercase; letter-spacing:.04em; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
:deep(.stage-legend) { display:flex; flex-wrap:wrap; gap:.4rem .75rem; margin-top:.6rem; }
:deep(.sl-item) { display:flex; align-items:center; gap:.3rem; }
:deep(.sl-dot) { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
:deep(.sl-txt) { font-size:.63rem; color:var(--color-muted); text-transform:uppercase; letter-spacing:.04em; }

/* Actividades */
:deep(.act-list) { display:flex; flex-direction:column; gap:.5rem; }
:deep(.act-row) { display:flex; align-items:center; gap:.6rem; padding:.5rem .65rem; border-radius:10px; background:rgba(107,142,58,.04); border:1px solid rgba(107,142,58,.08); }
:deep(.act-row--done) { opacity:.5; }
:deep(.act-icon) { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:.78rem; flex-shrink:0; }
:deep(.act-body) { flex:1; min-width:0; }
:deep(.act-title) { font-size:.78rem; font-weight:600; color:var(--color-text); text-transform:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
:deep(.act-meta) { font-size:.67rem; color:var(--color-muted); text-transform:none; }
:deep(.act-check) { color:#22c55e; font-size:.85rem; flex-shrink:0; }
:deep(.dash-empty) { color:var(--color-muted); font-size:.8rem; text-align:center; padding:1.25rem; text-transform:uppercase; letter-spacing:.06em; }

/* ── Historial ── */
.history-panel { margin-top: 0.75rem; }
:deep(.history-panel) { margin-top: 0.5rem; }
.history-toggle, :deep(.history-toggle) {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem 0;
  box-shadow: none;
  transition: color 0.15s;
}
.history-toggle:hover, :deep(.history-toggle:hover) { color: var(--color-primary); }

.history-grid, :deep(.history-grid) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.6rem;
}
.history-cell, :deep(.history-cell) {
  background: rgba(255,255,255,.85);
  border: 1px solid rgba(107,142,58,.12);
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  cursor: pointer;
  text-align: left;
  box-shadow: none;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.history-cell:hover, :deep(.history-cell:hover) { border-color: rgba(107,142,58,.4); background: #fff; transform: translateY(-2px); }

.hc-month, :deep(.hc-month) { font-size: 0.72rem; font-weight: 700; color: var(--color-text); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem; }
.hc-stat, :deep(.hc-stat) { display: flex; align-items: baseline; gap: 0.25rem; }
.hc-stat--green :deep(.hc-num), :deep(.hc-stat--green .hc-num) { color: #22c55e; }
.hc-num, :deep(.hc-num) { font-size: 1rem; font-weight: 700; color: var(--color-text); font-family: 'Poppins', sans-serif; text-transform: none; line-height: 1.1; }
.hc-lbl, :deep(.hc-lbl) { font-size: 0.6rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.hc-amount, :deep(.hc-amount) { font-size: 0.7rem; font-weight: 600; color: #6b8e3a; margin-top: 0.2rem; text-transform: none; letter-spacing: 0; }

/* ── Vendedores (modo por vendedor) ── */
.sellers-list { display: flex; flex-direction: column; gap: 0.65rem; }

.seller-row {
  background: rgba(255,255,255,.92);
  border-radius: 14px;
  border: 1px solid rgba(107,142,58,.12);
  overflow: hidden;
}

.seller-row-hd {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  box-shadow: none;
  text-align: left;
  transition: background 0.15s;
}
.seller-row-hd:hover { background: rgba(107,142,58,.04); }

.seller-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.85rem; font-weight: 700;
  flex-shrink: 0; text-transform: uppercase;
}

.seller-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  letter-spacing: 0;
  white-space: nowrap;
  min-width: 120px;
}

.seller-mini-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.sms-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
}
.sms-item--quotes  { background: rgba(59,130,246,.1);  color: #3b82f6; }
.sms-item--sold    { background: rgba(34,197,94,.1);   color: #16a34a; }
.sms-item--clients { background: rgba(107,142,58,.1);  color: #6b8e3a; }

.seller-loading { flex: 1; display: flex; align-items: center; padding-left: 0.5rem; }

.seller-chevron { color: var(--color-muted); font-size: 0.8rem; margin-left: auto; flex-shrink: 0; }

.seller-detail {
  padding: 0.1rem 1rem 1rem;
  border-top: 1px solid rgba(107,142,58,.1);
}

.seller-expand-enter-active, .seller-expand-leave-active { transition: opacity 0.2s, max-height 0.25s ease; max-height: 600px; overflow: hidden; }
.seller-expand-enter-from, .seller-expand-leave-to { opacity: 0; max-height: 0; }

/* ── Spinner ── */
.dash-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.65); border-radius: 18px; z-index: 5;
}
.crm-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(107,142,58,.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.crm-spinner--sm { width: 18px; height: 18px; border-width: 2px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 1024px) {
  :deep(.dash-grid) { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  :deep(.dash-grid)  { grid-template-columns: repeat(2, 1fr); }
  :deep(.dash-bottom) { grid-template-columns: 1fr; }
  .seller-name { min-width: 80px; }
  .history-grid, :deep(.history-grid) { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
}
@media (max-width: 480px) {
  :deep(.dash-grid) { grid-template-columns: 1fr; }
  .seller-mini-stats { display: none; }
}
</style>
