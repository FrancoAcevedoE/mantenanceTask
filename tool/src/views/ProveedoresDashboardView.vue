<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Dashboard de Proveedores</h2>
        <span class="iso-badge">ISO 9001:2015 §8.4</span>
        <span class="period-badge">Período: Ene–Jul 2026</span>
      </div>

      <!-- KPI STRIP -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon"><i class="bi bi-building"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Total evaluados</span>
            <span class="kpi-value">{{ filtered.length }}</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--green">
          <div class="kpi-icon"><i class="bi bi-check2-circle"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Clase A++</span>
            <span class="kpi-value">{{ counts['A++'] }} <small>({{ pct('A++') }}%)</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-card--lime">
          <div class="kpi-icon"><i class="bi bi-check-circle"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Clase A</span>
            <span class="kpi-value">{{ counts['A'] }} <small>({{ pct('A') }}%)</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-card--gold">
          <div class="kpi-icon"><i class="bi bi-exclamation-triangle"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Clase B — Seguimiento</span>
            <span class="kpi-value">{{ counts['B'] }} <small>({{ pct('B') }}%)</small></span>
          </div>
        </div>
        <div class="kpi-card kpi-card--danger">
          <div class="kpi-icon"><i class="bi bi-x-circle"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Clase C — Riesgo</span>
            <span class="kpi-value">{{ counts['C'] }}</span>
          </div>
        </div>
        <div class="kpi-card kpi-card--blue">
          <div class="kpi-icon"><i class="bi bi-bar-chart-line"></i></div>
          <div class="kpi-content">
            <span class="kpi-label">Puntaje promedio</span>
            <span class="kpi-value">{{ avgScoreVal }}</span>
          </div>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Perfil</label>
          <select v-model="filterPerfil" class="f-select">
            <option value="">Todos</option>
            <option value="I">Internacional</option>
            <option value="L">Local Insumos</option>
            <option value="S">Servicios/Fletes</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Clase</label>
          <div class="chip-row">
            <button v-for="cl in ['all','A++','A','B','C']" :key="cl"
              :class="['chip', cl === 'all' ? 'chip-all' : `chip-${cl.replace('++','pp')}`, filterClase===cl ? 'active' : '']"
              @click="filterClase = cl">
              {{ cl === 'all' ? 'Todas' : cl }}
            </button>
          </div>
        </div>
        <div class="filter-group" style="flex:1">
          <label>Buscar</label>
          <input v-model="searchText" class="f-input" placeholder="Proveedor o producto…" />
        </div>
        <div class="filter-count">{{ filtered.length }} / {{ ISO_DATA.length }} registros</div>
      </div>

      <!-- TABS -->
      <div class="tab-nav">
        <button v-for="t in tabs" :key="t.id"
          :class="['tab-btn', { active: activeTab === t.id }]"
          @click="activeTab = t.id">
          <i :class="'bi ' + t.icon"></i> {{ t.label }}
        </button>
      </div>

      <!-- TAB: DISTRIBUCIÓN -->
      <div v-if="activeTab === 'dist'" class="tab-content">
        <div class="charts-grid">
          <div class="chart-card">
            <h3 class="chart-title">Distribución por Clasificación</h3>
            <div class="canvas-wrap canvas-doughnut">
              <canvas ref="donutRef"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Distribución por Perfil de Abastecimiento</h3>
            <div class="canvas-wrap">
              <canvas ref="perfilRef"></canvas>
            </div>
          </div>
        </div>
        <div class="chart-card" style="margin-top:16px">
          <h3 class="chart-title">Pesos por Módulo ISO 9001:2015 §8.4.1</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Módulo</th><th>Internacional</th><th>Local Insumos</th><th>Servicios/Fletes</th><th>Indicadores</th>
              </tr></thead>
              <tbody>
                <tr v-for="m in MODULOS" :key="m.id">
                  <td><strong>{{ m.label }}</strong></td>
                  <td><span class="badge-pct">{{ m.I }}%</span></td>
                  <td><span class="badge-pct">{{ m.L }}%</span></td>
                  <td><span class="badge-pct">{{ m.S }}%</span></td>
                  <td class="text-muted small">{{ m.indicadores }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: RANKING -->
      <div v-if="activeTab === 'ranking'" class="tab-content">
        <div class="chart-card">
          <h3 class="chart-title">Ranking Completo — Puntaje Final Ponderado ({{ filtered.length }} registros)</h3>
          <div class="rank-chart-wrap" :style="{ height: Math.max(400, filtered.length * 24 + 60) + 'px' }">
            <canvas ref="rankRef"></canvas>
          </div>
        </div>
      </div>

      <!-- TAB: FICHA -->
      <div v-if="activeTab === 'ficha'" class="tab-content">
        <div class="filter-bar">
          <div class="filter-group" style="flex:1">
            <label>Seleccionar proveedor</label>
            <select v-model="selectedProv" class="f-select" style="width:100%;max-width:400px">
              <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>
        <div v-if="selectedProv" class="ficha-layout">
          <div class="ficha-info chart-card">
            <h3 class="chart-title">{{ selectedProv }}</h3>
            <div style="margin-bottom:8px">
              <span :class="'grade grade-' + (fichaRows[0]?.clase || '').replace('++','pp')">{{ fichaRows[0]?.clase }}</span>
              <span class="kpi-value" style="margin-left:8px;color:var(--color-score)">{{ fichaAvg }} pts promedio</span>
            </div>
            <p class="text-muted small">Perfil: {{ PERF_LABEL[fichaRows[0]?.perf] }}</p>
            <p class="text-muted small">Criticidad: {{ CRIT_LABEL[fichaRows[0]?.crit] }}</p>
            <p class="text-muted small">Productos evaluados: {{ fichaRows.length }}</p>
          </div>
          <div class="chart-card" style="flex:1;min-width:260px">
            <h3 class="chart-title">Desempeño por Módulo</h3>
            <div class="canvas-wrap canvas-radar">
              <canvas ref="radarRef"></canvas>
            </div>
          </div>
        </div>
        <div v-if="selectedProv" class="chart-card" style="margin-top:16px">
          <h3 class="chart-title">Detalle por Producto</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Código</th><th>Producto</th><th>Puntaje</th><th>Clase</th>
                <th>NC</th><th>Desvíos</th><th>Ent.Tarde</th><th>Daño</th>
                <th>ISO 9001</th><th>ISO 14001</th><th>FSC</th>
              </tr></thead>
              <tbody>
                <tr v-for="r in fichaRows" :key="r.id">
                  <td class="mono">{{ r.id }}</td>
                  <td>{{ r.prod }}</td>
                  <td class="mono" :style="{ color: CLASE_COLOR[r.clase] }"><strong>{{ r.score.toFixed(1) }}</strong></td>
                  <td><span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span></td>
                  <td>{{ indCell(r.nc, true) }}</td>
                  <td>{{ indCell(r.dtm, true) }}</td>
                  <td>{{ indCell(r.et, true) }}</td>
                  <td>{{ indCell(r.dc, true) }}</td>
                  <td>{{ indCell(r.i9, false) }}</td>
                  <td>{{ indCell(r.i14, false) }}</td>
                  <td>{{ indCell(r.fsc, false) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: RIESGO -->
      <div v-if="activeTab === 'riesgo'" class="tab-content">
        <div class="charts-grid" style="margin-bottom:16px">
          <div class="chart-card">
            <h3 class="chart-title">Frecuencia de Incidentes por Indicador</h3>
            <div class="canvas-wrap">
              <canvas ref="riskRef"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Alertas Críticas</h3>
            <div class="alert-list">
              <div v-for="a in alertas" :key="a.text" class="alert-item" :class="'alert-' + a.type">
                <i :class="'bi ' + a.icon"></i>
                <span>{{ a.text }}</span>
              </div>
              <div v-if="!alertas.length" class="text-muted small" style="padding:12px">Sin alertas para los filtros actuales.</div>
            </div>
          </div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Tabla Completa con Indicadores</h3>
          <div class="table-responsive">
            <table class="data-table data-table--sm">
              <thead><tr>
                <th>Código</th><th>Proveedor</th><th>Producto</th><th>Perf.</th>
                <th>NC</th><th>Desv.</th><th>E.Tarde</th><th>D.Carga</th>
                <th>ART</th><th>EPP</th><th>ISO9001</th><th>FSC</th><th>ISO14001</th><th>ST</th>
                <th>Puntaje</th><th>Clase</th>
              </tr></thead>
              <tbody>
                <tr v-for="r in sortedFiltered" :key="r.id">
                  <td class="mono">{{ r.id }}</td>
                  <td><strong>{{ r.prov }}</strong></td>
                  <td class="text-muted">{{ r.prod }}</td>
                  <td class="text-muted mono">{{ r.perf }}</td>
                  <td v-html="cellHtml(r.nc, true)"></td>
                  <td v-html="cellHtml(r.dtm, true)"></td>
                  <td v-html="cellHtml(r.et, true)"></td>
                  <td v-html="cellHtml(r.dc, true)"></td>
                  <td v-html="cellHtml(r.art, true)"></td>
                  <td v-html="cellHtml(r.epp, true)"></td>
                  <td v-html="cellHtml(r.i9, false)"></td>
                  <td v-html="cellHtml(r.fsc, false)"></td>
                  <td v-html="cellHtml(r.i14, false)"></td>
                  <td v-html="cellHtml(r.st, false)"></td>
                  <td class="mono" :style="{ color: CLASE_COLOR[r.clase] }"><strong>{{ r.score.toFixed(1) }}</strong></td>
                  <td><span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { ISO_DATA, CLASE_COLOR, PERF_LABEL, CRIT_LABEL, filterData, claseCounts, avgScore } from '@/data/isoProveedores.js'

Chart.register(...registerables)

const activeTab = ref('dist')
const filterPerfil = ref('')
const filterClase = ref('all')
const searchText = ref('')
const selectedProv = ref('')

const tabs = [
  { id: 'dist',    label: 'Distribución', icon: 'bi-pie-chart' },
  { id: 'ranking', label: 'Ranking',       icon: 'bi-bar-chart' },
  { id: 'ficha',   label: 'Ficha Proveedor', icon: 'bi-building' },
  { id: 'riesgo',  label: 'Análisis de Riesgo', icon: 'bi-shield-exclamation' },
]

const MODULOS = [
  { id:'M1', label:'M1. Calidad y Conformidad Técnica', I:40, L:30, S:0,  indicadores:'NC Críticas, Desvíos Técnicos' },
  { id:'M2', label:'M2. Logística, Entregas y Origen',  I:30, L:25, S:50, indicadores:'Entregas Tarde, Demora Docum., Daño Carga, Origen Extremo' },
  { id:'M3', label:'M3. Higiene, Seguridad y Legales',  I:0,  L:15, S:30, indicadores:'ART Vencida, Falta EPP, Doc. Mensual' },
  { id:'M4', label:'M4. Gestión Comercial y Costos',    I:20, L:15, S:20, indicadores:'Precio/Cotización, Financiamiento' },
  { id:'M5', label:'M5. Sustentabilidad y Certificaciones', I:10, L:15, S:0, indicadores:'ISO 9001, FSC, ISO 14001, Soporte Técnico' },
]

// ─── COMPUTED ─────────────────────────────────────────────────────────────────
const filtered = computed(() => filterData(ISO_DATA, {
  perf: filterPerfil.value,
  clase: filterClase.value,
  search: searchText.value,
}))

const counts = computed(() => claseCounts(filtered.value))

const pct = (cl) => {
  const t = filtered.value.length
  return t ? ((counts.value[cl] / t) * 100).toFixed(0) : 0
}

const avgScoreVal = computed(() => avgScore(filtered.value).toFixed(1))

const sortedFiltered = computed(() => [...filtered.value].sort((a, b) => a.score - b.score))

const uniqueProvs = computed(() => [...new Set(ISO_DATA.map(d => d.prov))].sort())

const fichaRows = computed(() => ISO_DATA.filter(d => d.prov === selectedProv.value))

const fichaAvg = computed(() => {
  if (!fichaRows.value.length) return 0
  return (fichaRows.value.reduce((s, d) => s + d.score, 0) / fichaRows.value.length).toFixed(1)
})

const alertas = computed(() => {
  const d = filtered.value
  const list = []
  const c = d.filter(r => r.clase === 'C')
  if (c.length) list.push({ type: 'danger', icon: 'bi-x-circle', text: `${c.length} proveedor(es) en Clase C: ${c.map(r => r.prov + ' / ' + r.prod).join(', ')}` })
  const nc = d.filter(r => r.nc !== null && r.nc > 0)
  if (nc.length) list.push({ type: 'danger', icon: 'bi-bug', text: `${nc.length} registro(s) con NC Críticas: ${[...new Set(nc.map(r => r.prov))].join(', ')}` })
  const et = d.filter(r => r.et > 0)
  if (et.length) list.push({ type: 'warning', icon: 'bi-truck', text: `${et.length} proveedor(es) con entregas tardías: ${[...new Set(et.map(r => r.prov))].join(', ')}` })
  const b = d.filter(r => r.clase === 'B')
  if (b.length) list.push({ type: 'warning', icon: 'bi-clipboard-check', text: `${b.length} proveedor(es) en Clase B requieren Plan de Mejora` })
  const noCert = d.filter(r => r.i9 !== null && r.i9 === 0)
  if (noCert.length) list.push({ type: 'info', icon: 'bi-patch-question', text: `${noCert.length} proveedor(es) sin ISO 9001 certificada` })
  return list
})

// ─── CHART REFS ───────────────────────────────────────────────────────────────
const donutRef  = ref(null)
const perfilRef = ref(null)
const rankRef   = ref(null)
const radarRef  = ref(null)
const riskRef   = ref(null)
let charts = {}

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); charts[key] = null }
}

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

function chartDefaults() {
  const dark = isDark()
  return {
    textColor: dark ? '#D6E3F5' : '#1A2438',
    mutedColor: dark ? '#5C7399' : '#6B7E99',
    gridColor: dark ? '#1E2E48' : '#E0E8F4',
  }
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function drawDonut() {
  if (!donutRef.value) return
  destroyChart('donut')
  const d = filtered.value
  const { textColor } = chartDefaults()
  charts.donut = new Chart(donutRef.value, {
    type: 'doughnut',
    data: {
      labels: ['A++', 'A', 'B', 'C'],
      datasets: [{ data: [counts.value['A++'], counts.value['A'], counts.value['B'], counts.value['C']],
        backgroundColor: ['#22C55E','#4ADE80','#F59E0B','#EF4444'],
        borderWidth: 0, hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor, padding: 16, font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} (${((ctx.raw/d.length)*100).toFixed(0)}%)` } }
      }
    }
  })
}

// ─── PERFIL BARS ──────────────────────────────────────────────────────────────
function drawPerfilBars() {
  if (!perfilRef.value) return
  destroyChart('perfil')
  const d = filtered.value
  const { textColor, mutedColor, gridColor } = chartDefaults()
  const perfs = ['I','L','S']
  const labels = perfs.map(p => PERF_LABEL[p].split(' ')[0])
  const clases = ['A++','A','B','C']
  const colors = ['#22C55E','#4ADE80','#F59E0B','#EF4444']
  charts.perfil = new Chart(perfilRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: clases.map((cl, i) => ({
        label: cl,
        data: perfs.map(p => d.filter(r => r.perf === p && r.clase === cl).length),
        backgroundColor: colors[i],
        borderRadius: 2,
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: true, indexAxis: 'y',
      plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
      scales: {
        x: { stacked: true, grid: { color: gridColor }, ticks: { color: mutedColor } },
        y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } }
      }
    }
  })
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function drawRanking() {
  if (!rankRef.value) return
  destroyChart('rank')
  const d = [...filtered.value].sort((a, b) => a.score - b.score)
  const { textColor, mutedColor, gridColor } = chartDefaults()
  charts.rank = new Chart(rankRef.value, {
    type: 'bar',
    data: {
      labels: d.map(r => r.prov.slice(0, 20) + (r.prov.length > 20 ? '…' : '') + ' / ' + r.prod.slice(0, 15)),
      datasets: [{
        label: 'Puntaje',
        data: d.map(r => r.score),
        backgroundColor: d.map(r => CLASE_COLOR[r.clase] + 'CC'),
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(1)} pts — ${d[ctx.dataIndex].clase}` } }
      },
      scales: {
        x: { min: 0, max: 105, grid: { color: gridColor }, ticks: { color: mutedColor } },
        y: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } }
      }
    }
  })
}

// ─── RADAR ────────────────────────────────────────────────────────────────────
function modScore(r, mod) {
  const inc = v => v === null ? null : Math.max(0, 100 - Math.min(v, 2) * 45)
  if (mod === 'M1') {
    if (r.nc === null && r.dtm === null) return 50
    const vs = [r.nc, r.dtm].filter(v => v !== null).map(inc)
    return vs.reduce((s, v) => s + v, 0) / vs.length
  }
  if (mod === 'M2') {
    return Math.max(0, 100 - [r.et, r.dem, r.dc].filter(v => v !== null).reduce((s, v) => s + Math.min(v, 1) * 33, 0))
  }
  if (mod === 'M3') {
    if (r.art === null) return 50
    return Math.max(0, 100 - [r.art, r.epp, r.doc].reduce((s, v) => s + Math.min(v, 1) * 33, 0))
  }
  if (mod === 'M4') {
    return ((r.psa > 0 ? 100 : 65) + (r.fin === 1 ? 100 : 60)) / 2
  }
  if (mod === 'M5') {
    const vs = [r.i9, r.fsc, r.i14, r.st].filter(v => v !== null)
    if (!vs.length) return 50
    return vs.reduce((s, v) => s + (v === 1 ? 100 : 0), 0) / vs.length
  }
  return 0
}

function drawRadar() {
  if (!radarRef.value || !fichaRows.value.length) return
  destroyChart('radar')
  const r = fichaRows.value[0]
  const { textColor, mutedColor, gridColor } = chartDefaults()
  const clr = CLASE_COLOR[r.clase]
  charts.radar = new Chart(radarRef.value, {
    type: 'radar',
    data: {
      labels: ['M1 Calidad','M2 Logística','M3 HyS/Legal','M4 Comercial','M5 Sustentab.'],
      datasets: [{
        label: r.prov,
        data: ['M1','M2','M3','M4','M5'].map(m => modScore(r, m)),
        backgroundColor: clr + '33', borderColor: clr, pointBackgroundColor: clr,
        borderWidth: 2, pointRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 100,
          grid: { color: gridColor },
          ticks: { display: false },
          pointLabels: { color: textColor, font: { size: 11 } },
          angleLines: { color: gridColor },
        }
      },
      plugins: { legend: { display: false } }
    }
  })
}

// ─── RISK BARS ────────────────────────────────────────────────────────────────
function drawRisk() {
  if (!riskRef.value) return
  destroyChart('risk')
  const d = filtered.value
  const incFields = [
    { key:'nc',  label:'NC Críticas' }, { key:'dtm', label:'Desvíos Téc.' },
    { key:'et',  label:'Ent. Tarde' }, { key:'dem',  label:'Demora Doc.' },
    { key:'dc',  label:'Daño Carga' }, { key:'art',  label:'ART Vencida' },
    { key:'epp', label:'Falta EPP' }, { key:'doc',   label:'Doc. Mensual' },
  ]
  const rates = incFields.map(({ key, label }) => {
    const applicable = d.filter(r => r[key] !== null)
    const failed = applicable.filter(r => r[key] > 0)
    return { label, rate: applicable.length ? (failed.length / applicable.length) * 100 : 0 }
  }).sort((a, b) => b.rate - a.rate)

  const { textColor, mutedColor, gridColor } = chartDefaults()
  charts.risk = new Chart(riskRef.value, {
    type: 'bar',
    data: {
      labels: rates.map(r => r.label),
      datasets: [{
        label: '% con incidentes',
        data: rates.map(r => r.rate),
        backgroundColor: rates.map(r => r.rate > 10 ? '#EF4444CC' : r.rate > 5 ? '#F59E0BCC' : '#22C55ECC'),
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toFixed(1)}% de proveedores afectados` } }
      },
      scales: {
        x: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: mutedColor, callback: v => v + '%' } },
        y: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  })
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function indCell(v, isInc) {
  if (v === null) return '—'
  if (isInc) return v > 0 ? `⚠ ${v}` : '✓'
  return v === 1 ? '✓' : '—'
}

function cellHtml(v, isInc) {
  if (v === null) return `<span class="text-muted">—</span>`
  if (isInc) return v > 0 ? `<span style="color:#EF4444;font-weight:700">${v}</span>` : `<span style="color:#22C55E">0</span>`
  return v === 1 ? `<span style="color:#22C55E">✓</span>` : `<span class="text-muted">—</span>`
}

// ─── CHART DRAWING PER TAB ────────────────────────────────────────────────────
async function drawCurrentTab() {
  await nextTick()
  if (activeTab.value === 'dist')    { drawDonut(); drawPerfilBars() }
  if (activeTab.value === 'ranking') { drawRanking() }
  if (activeTab.value === 'ficha')   { drawRadar() }
  if (activeTab.value === 'riesgo')  { drawRisk() }
}

// ─── WATCHERS ─────────────────────────────────────────────────────────────────
watch(activeTab, drawCurrentTab)
watch(filtered, drawCurrentTab)
watch(selectedProv, async () => { await nextTick(); drawRadar() })

onMounted(async () => {
  if (uniqueProvs.value.length) selectedProv.value = uniqueProvs.value[0]
  await drawCurrentTab()
})
</script>

<style scoped>
.topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.iso-badge { font-size: 11px; font-weight: 700; letter-spacing: .04em; padding: 3px 8px; border-radius: 3px; background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary); border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
.period-badge { font-size: 11px; color: var(--color-text-muted); border: 1px solid var(--color-border); padding: 3px 8px; border-radius: 3px; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.kpi-card--green  { border-left: 3px solid #22C55E; }
.kpi-card--lime   { border-left: 3px solid #4ADE80; }
.kpi-card--gold   { border-left: 3px solid #F59E0B; }
.kpi-card--danger { border-left: 3px solid #EF4444; }
.kpi-card--blue   { border-left: 3px solid var(--color-primary); }
.kpi-icon { font-size: 20px; opacity: .6; }
.kpi-content { display: flex; flex-direction: column; gap: 2px; }
.kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted); }
.kpi-value { font-size: 22px; font-weight: 700; line-height: 1.1; }
.kpi-value small { font-size: 13px; font-weight: 400; color: var(--color-text-muted); }

.filter-bar { display: flex; align-items: flex-end; gap: 12px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-group label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--color-text-muted); }
.f-select, .f-input { background: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text); padding: 6px 10px; border-radius: 4px; font-size: 12px; }
.f-input { min-width: 200px; }
.chip-row { display: flex; gap: 4px; }
.chip { padding: 4px 10px; border-radius: 3px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text-muted); cursor: pointer; font-size: 11px; font-weight: 700; transition: all .15s; }
.chip-all.active  { border-color: var(--color-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
.chip-App.active  { border-color: #22C55E; color: #22C55E; background: #22C55E1A; }
.chip-A.active    { border-color: #4ADE80; color: #4ADE80; background: #4ADE801A; }
.chip-B.active    { border-color: #F59E0B; color: #F59E0B; background: #F59E0B1A; }
.chip-C.active    { border-color: #EF4444; color: #EF4444; background: #EF44441A; }
.filter-count { margin-left: auto; font-size: 11px; color: var(--color-text-muted); align-self: flex-end; }

.tab-nav { display: flex; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
.tab-btn { flex: 1; padding: 10px 4px; border: none; background: none; color: var(--color-text-muted); cursor: pointer; font-size: 12px; font-weight: 600; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 6px; border-right: 1px solid var(--color-border); }
.tab-btn:last-child { border-right: none; }
.tab-btn:hover { color: var(--color-text); background: var(--color-bg); }
.tab-btn.active { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent); }

.tab-content { animation: fadeIn .2s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .charts-grid { grid-template-columns: 1fr; } }

.chart-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; padding: 16px; }
.chart-title { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 12px; }
.canvas-wrap { position: relative; }
.canvas-doughnut { max-width: 320px; margin: 0 auto; }
.canvas-radar { max-width: 340px; margin: 0 auto; }
.rank-chart-wrap { position: relative; width: 100%; }
.rank-chart-wrap canvas { position: absolute; inset: 0; }

.ficha-layout { display: flex; gap: 16px; flex-wrap: wrap; }
.ficha-info { min-width: 200px; flex: 0 0 220px; }

.grade { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; font-family: monospace; padding: 2px 8px; border-radius: 2px; }
.grade-App { background: #22C55E1A; color: #22C55E; }
.grade-A   { background: #4ADE801A; color: #4ADE80; }
.grade-B   { background: #F59E0B1A; color: #F59E0B; }
.grade-C   { background: #EF44441A; color: #EF4444; }

.badge-pct { font-size: 12px; font-weight: 700; font-family: monospace; color: var(--color-primary); }
.mono { font-family: monospace; font-size: 11px; }
.small { font-size: 11px; }
.text-muted { color: var(--color-text-muted); }

.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--color-text-muted); padding: 6px 10px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
.data-table td { padding: 6px 10px; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--color-bg); }
.data-table--sm th, .data-table--sm td { padding: 4px 8px; font-size: 11px; }
.table-responsive { overflow-x: auto; }

.alert-list { display: flex; flex-direction: column; gap: 8px; }
.alert-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 4px; font-size: 12px; border: 1px solid; }
.alert-danger  { background: #EF44441A; border-color: #EF444440; color: var(--color-text); }
.alert-warning { background: #F59E0B1A; border-color: #F59E0B40; color: var(--color-text); }
.alert-info    { background: color-mix(in srgb, var(--color-primary) 10%, transparent); border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); color: var(--color-text); }
.alert-danger i  { color: #EF4444; flex-shrink: 0; margin-top: 2px; }
.alert-warning i { color: #F59E0B; flex-shrink: 0; margin-top: 2px; }
.alert-info i    { color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
</style>
