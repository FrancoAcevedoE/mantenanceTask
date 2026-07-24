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
        <!-- SEARCH WITH DROPDOWN -->
        <div class="filter-group search-group" style="flex:1;position:relative">
          <label>Buscar</label>
          <input
            ref="searchInputRef"
            v-model="searchText"
            class="f-input"
            placeholder="Proveedor o producto…"
            @focus="showSearchDrop = true"
            @blur="closeDropDelay"
          />
          <div v-if="showSearchDrop && searchText && searchResults.length" class="search-drop">
            <div
              v-for="r in searchResults"
              :key="r.id"
              class="search-drop-item"
              @mousedown.prevent="selectSearchResult(r)"
            >
              <span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span>
              <div class="search-drop-text">
                <strong>{{ r.prov }}</strong>
                <span class="text-muted"> · {{ r.prod }}</span>
              </div>
              <span class="search-drop-score" :style="{ color: CLASE_COLOR[r.clase] }">{{ r.score.toFixed(1) }}</span>
            </div>
            <div v-if="searchResults.length === MAX_RESULTS" class="search-drop-more">
              + {{ filtered.length - MAX_RESULTS }} más — refiná la búsqueda
            </div>
          </div>
          <div v-if="showSearchDrop && searchText && !searchResults.length" class="search-drop">
            <div class="search-drop-empty">Sin resultados para "{{ searchText }}"</div>
          </div>
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

      <!-- ══════════ TAB: DISTRIBUCIÓN ══════════ -->
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

        <!-- POR ARTÍCULO -->
        <div class="chart-card" style="margin-top:16px">
          <h3 class="chart-title">
            Análisis por Artículo — Cobertura de Proveedores
            <span class="chart-title-sub">ISO §8.4 · riesgo de fuente única</span>
          </h3>
          <div class="art-groups">
            <div v-for="grupo in artGrupos" :key="grupo.label" class="art-group" :class="grupo.cls">
              <div class="art-group-header">
                <i :class="'bi ' + grupo.icon"></i>
                {{ grupo.label }}
                <span class="art-group-count">{{ grupo.items.length }}</span>
              </div>
              <div class="art-group-body">
                <div v-for="art in grupo.items" :key="art.prod" class="art-item">
                  <div class="art-item-name">{{ art.prod }}</div>
                  <div class="art-item-provs">
                    <span
                      v-for="p in art.provs" :key="p.prov + p.clase"
                      :class="'art-prov-chip grade grade-' + p.clase.replace('++','pp')"
                      :title="p.prov + ' — ' + p.score.toFixed(1) + ' pts'"
                    >{{ p.clase }}</span>
                    <span class="art-prov-names">{{ art.provs.map(p => p.prov).join(', ') }}</span>
                  </div>
                </div>
              </div>
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

      <!-- ══════════ TAB: RANKING ══════════ -->
      <div v-if="activeTab === 'ranking'" class="tab-content">
        <div class="chart-card">
          <h3 class="chart-title">Ranking Completo — Puntaje Final Ponderado ({{ filtered.length }} registros)</h3>
          <div class="rank-chart-wrap" :style="{ height: Math.max(400, filtered.length * 24 + 60) + 'px' }">
            <canvas ref="rankRef"></canvas>
          </div>
        </div>
      </div>

      <!-- ══════════ TAB: FICHA / COMPARACIÓN ══════════ -->
      <div v-if="activeTab === 'ficha'" class="tab-content">
        <!-- Mode toggle -->
        <div class="filter-bar" style="align-items:center">
          <div class="filter-group" style="flex:1">
            <label>{{ compareMode ? 'Proveedores a comparar (hasta 3)' : 'Seleccionar proveedor' }}</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <select v-model="compareProvs[0]" class="f-select" style="min-width:220px" @change="onCompareChange">
                <option value="">— Proveedor 1 —</option>
                <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
              </select>
              <template v-if="compareMode">
                <select v-model="compareProvs[1]" class="f-select" style="min-width:220px" @change="onCompareChange">
                  <option value="">— Proveedor 2 —</option>
                  <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
                </select>
                <select v-model="compareProvs[2]" class="f-select" style="min-width:220px" @change="onCompareChange">
                  <option value="">— Proveedor 3 (opcional) —</option>
                  <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
                </select>
              </template>
            </div>
          </div>
          <button
            :class="['btn-sm', compareMode ? 'btn-primary' : 'btn-ghost']"
            style="margin-top:18px"
            @click="toggleCompare"
          >
            <i :class="'bi ' + (compareMode ? 'bi-x-lg' : 'bi-arrow-left-right')"></i>
            {{ compareMode ? 'Salir de comparación' : 'Comparar proveedores' }}
          </button>
        </div>

        <!-- SINGLE MODE -->
        <template v-if="!compareMode && compareProvs[0]">
          <div class="ficha-layout">
            <div class="ficha-info chart-card">
              <h3 class="chart-title">{{ compareProvs[0] }}</h3>
              <div style="margin-bottom:8px">
                <span :class="'grade grade-' + (fichaRows[0]?.clase || '').replace('++','pp')">{{ fichaRows[0]?.clase }}</span>
                <span class="mono" style="margin-left:8px;font-size:18px;font-weight:700" :style="{ color: CLASE_COLOR[fichaRows[0]?.clase] }">{{ fichaAvg }} pts</span>
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
          <div class="chart-card" style="margin-top:16px">
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
        </template>

        <!-- COMPARE MODE -->
        <template v-if="compareMode && activeCompareProvs.length">
          <!-- Radar comparativo -->
          <div class="chart-card" style="margin-bottom:16px">
            <h3 class="chart-title">Radar Comparativo — Módulos M1–M5</h3>
            <div class="canvas-wrap canvas-radar-lg">
              <canvas ref="radarRef"></canvas>
            </div>
            <div class="compare-legend">
              <div v-for="(p, i) in activeCompareProvs" :key="p" class="compare-legend-item">
                <span class="compare-legend-dot" :style="{ background: COMPARE_COLORS[i] }"></span>
                {{ p }}
              </div>
            </div>
          </div>

          <!-- Cards por proveedor -->
          <div class="compare-cards">
            <div v-for="(provName, i) in activeCompareProvs" :key="provName" class="compare-card chart-card" :style="{ borderTopColor: COMPARE_COLORS[i] }">
              <h3 class="chart-title" :style="{ color: COMPARE_COLORS[i] }">{{ provName }}</h3>
              <div style="margin-bottom:6px">
                <span :class="'grade grade-' + (compareFirstRow(provName)?.clase || '').replace('++','pp')">{{ compareFirstRow(provName)?.clase }}</span>
                <span class="mono" style="margin-left:8px;font-weight:700" :style="{ color: CLASE_COLOR[compareFirstRow(provName)?.clase] }">{{ compareAvg(provName) }} pts</span>
              </div>
              <p class="text-muted small">{{ PERF_LABEL[compareFirstRow(provName)?.perf] }}</p>
              <p class="text-muted small">{{ compareRows(provName).length }} producto(s)</p>
              <div style="margin-top:8px">
                <div v-for="r in compareRows(provName)" :key="r.id" class="compare-prod-row">
                  <span class="text-muted small">{{ r.prod }}</span>
                  <span class="mono small" :style="{ color: CLASE_COLOR[r.clase] }">{{ r.score.toFixed(1) }}</span>
                  <span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabla comparativa de indicadores -->
          <div class="chart-card" style="margin-top:16px">
            <h3 class="chart-title">Comparación de Indicadores</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th v-for="(p, i) in activeCompareProvs" :key="p" :style="{ color: COMPARE_COLORS[i] }">{{ p }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ind in COMPARE_INDICATORS" :key="ind.key">
                    <td class="text-muted">{{ ind.label }}</td>
                    <td v-for="provName in activeCompareProvs" :key="provName" v-html="compareIndCell(provName, ind.key, ind.isInc)"></td>
                  </tr>
                  <tr class="compare-score-row">
                    <td><strong>Puntaje promedio</strong></td>
                    <td v-for="(provName, i) in activeCompareProvs" :key="provName" class="mono" :style="{ color: COMPARE_COLORS[i], fontWeight: 700 }">
                      {{ compareAvg(provName) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <!-- ══════════ TAB: RIESGO ══════════ -->
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

// ─── STATE ────────────────────────────────────────────────────────────────────
const activeTab    = ref('dist')
const filterPerfil = ref('')
const filterClase  = ref('all')
const searchText   = ref('')
const showSearchDrop = ref(false)
const MAX_RESULTS  = 10

// Ficha / comparación
const compareMode  = ref(false)
const compareProvs = ref(['', '', ''])

const COMPARE_COLORS = ['#3B82F6', '#F97316', '#A855F7']

const COMPARE_INDICATORS = [
  { key:'nc',   label:'NC Críticas',       isInc:true  },
  { key:'dtm',  label:'Desvíos Técnicos',  isInc:true  },
  { key:'et',   label:'Entregas Tarde',     isInc:true  },
  { key:'dem',  label:'Demora Docum.',      isInc:true  },
  { key:'dc',   label:'Daño en Carga',      isInc:true  },
  { key:'art',  label:'ART Vencida',        isInc:true  },
  { key:'epp',  label:'Falta EPP',          isInc:true  },
  { key:'i9',   label:'ISO 9001',           isInc:false },
  { key:'fsc',  label:'FSC',                isInc:false },
  { key:'i14',  label:'ISO 14001',          isInc:false },
  { key:'st',   label:'Soporte Técnico',    isInc:false },
  { key:'fin',  label:'Financiamiento',     isInc:false },
]

const tabs = [
  { id: 'dist',    label: 'Distribución',      icon: 'bi-pie-chart' },
  { id: 'ranking', label: 'Ranking',            icon: 'bi-bar-chart' },
  { id: 'ficha',   label: 'Ficha / Comparar',  icon: 'bi-building' },
  { id: 'riesgo',  label: 'Análisis de Riesgo', icon: 'bi-shield-exclamation' },
]

const MODULOS = [
  { id:'M1', label:'M1. Calidad y Conformidad Técnica',   I:40, L:30, S:0,  indicadores:'NC Críticas, Desvíos Técnicos' },
  { id:'M2', label:'M2. Logística, Entregas y Origen',    I:30, L:25, S:50, indicadores:'Entregas Tarde, Demora Docum., Daño Carga, Origen Extremo' },
  { id:'M3', label:'M3. Higiene, Seguridad y Legales',    I:0,  L:15, S:30, indicadores:'ART Vencida, Falta EPP, Doc. Mensual' },
  { id:'M4', label:'M4. Gestión Comercial y Costos',      I:20, L:15, S:20, indicadores:'Precio/Cotización, Financiamiento' },
  { id:'M5', label:'M5. Sustentabilidad y Certificaciones',I:10, L:15, S:0, indicadores:'ISO 9001, FSC, ISO 14001, Soporte Técnico' },
]

// ─── COMPUTED FILTERS ─────────────────────────────────────────────────────────
const filtered = computed(() => filterData(ISO_DATA, {
  perf: filterPerfil.value, clase: filterClase.value, search: searchText.value,
}))
const counts     = computed(() => claseCounts(filtered.value))
const pct        = cl => { const t = filtered.value.length; return t ? ((counts.value[cl] / t) * 100).toFixed(0) : 0 }
const avgScoreVal= computed(() => avgScore(filtered.value).toFixed(1))
const sortedFiltered = computed(() => [...filtered.value].sort((a, b) => a.score - b.score))

// Search dropdown results
const searchResults = computed(() => {
  if (!searchText.value) return []
  return filtered.value.slice(0, MAX_RESULTS)
})

// Unique providers list
const uniqueProvs = computed(() => [...new Set(ISO_DATA.map(d => d.prov))].sort())

// Ficha single mode
const fichaRows = computed(() => ISO_DATA.filter(d => d.prov === compareProvs.value[0]))
const fichaAvg  = computed(() => {
  if (!fichaRows.value.length) return '—'
  return (fichaRows.value.reduce((s, d) => s + d.score, 0) / fichaRows.value.length).toFixed(1)
})

// Compare mode helpers
const activeCompareProvs = computed(() => compareProvs.value.filter(p => p))
const compareRows   = provName => ISO_DATA.filter(d => d.prov === provName)
const compareFirstRow = provName => compareRows(provName)[0]
const compareAvg    = provName => {
  const rows = compareRows(provName)
  if (!rows.length) return '—'
  return (rows.reduce((s, d) => s + d.score, 0) / rows.length).toFixed(1)
}

// Artículos por cantidad de proveedores
const artGrupos = computed(() => {
  const d = filtered.value
  const map = {}
  d.forEach(r => {
    if (!map[r.prod]) map[r.prod] = []
    map[r.prod].push({ prov: r.prov, clase: r.clase, score: r.score })
  })
  const items = Object.entries(map).map(([prod, provs]) => ({
    prod,
    provs: provs.sort((a, b) => b.score - a.score),
    n: provs.length,
  })).sort((a, b) => a.prod.localeCompare(b.prod))

  return [
    {
      label: '1 proveedor — Fuente única',
      icon: 'bi-exclamation-triangle-fill',
      cls: 'art-group--risk',
      items: items.filter(i => i.n === 1),
    },
    {
      label: '2 proveedores — Cobertura dual',
      icon: 'bi-arrow-left-right',
      cls: 'art-group--dual',
      items: items.filter(i => i.n === 2),
    },
    {
      label: '3 o más proveedores — Multicobertura',
      icon: 'bi-check2-all',
      cls: 'art-group--safe',
      items: items.filter(i => i.n >= 3),
    },
  ]
})

// Alertas
const alertas = computed(() => {
  const d = filtered.value
  const list = []
  const c = d.filter(r => r.clase === 'C')
  if (c.length) list.push({ type:'danger',  icon:'bi-x-circle',       text:`${c.length} proveedor(es) en Clase C: ${c.map(r => r.prov + ' / ' + r.prod).join(', ')}` })
  const nc = d.filter(r => r.nc !== null && r.nc > 0)
  if (nc.length) list.push({ type:'danger',  icon:'bi-bug',            text:`${nc.length} registro(s) con NC Críticas: ${[...new Set(nc.map(r => r.prov))].join(', ')}` })
  const et = d.filter(r => r.et > 0)
  if (et.length) list.push({ type:'warning', icon:'bi-truck',          text:`${et.length} con entregas tardías: ${[...new Set(et.map(r => r.prov))].join(', ')}` })
  const b = d.filter(r => r.clase === 'B')
  if (b.length) list.push({ type:'warning', icon:'bi-clipboard-check', text:`${b.length} proveedor(es) en Clase B requieren Plan de Mejora` })
  const noCert = d.filter(r => r.i9 !== null && r.i9 === 0)
  if (noCert.length) list.push({ type:'info', icon:'bi-patch-question', text:`${noCert.length} proveedor(es) sin ISO 9001 certificada` })
  return list
})

// ─── CHART REFS ───────────────────────────────────────────────────────────────
const donutRef  = ref(null)
const perfilRef = ref(null)
const rankRef   = ref(null)
const radarRef  = ref(null)
const riskRef   = ref(null)
let charts = {}

function destroyChart(key) { if (charts[key]) { charts[key].destroy(); charts[key] = null } }

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
}
function chartDefaults() {
  const dark = isDark()
  return {
    textColor:  dark ? '#D6E3F5' : '#1A2438',
    mutedColor: dark ? '#5C7399' : '#6B7E99',
    gridColor:  dark ? '#1E2E48' : '#E0E8F4',
  }
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function drawDonut() {
  if (!donutRef.value) return; destroyChart('donut')
  const d = filtered.value; const { textColor } = chartDefaults()
  charts.donut = new Chart(donutRef.value, {
    type: 'doughnut',
    data: { labels:['A++','A','B','C'], datasets:[{ data:[counts.value['A++'],counts.value['A'],counts.value['B'],counts.value['C']], backgroundColor:['#22C55E','#4ADE80','#F59E0B','#EF4444'], borderWidth:0, hoverOffset:6 }] },
    options: { responsive:true, maintainAspectRatio:true, cutout:'62%', plugins:{ legend:{ position:'bottom', labels:{ color:textColor, padding:16, font:{size:12} } }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw} (${((ctx.raw/d.length)*100).toFixed(0)}%)` } } } }
  })
}

// ─── PERFIL BARS ──────────────────────────────────────────────────────────────
function drawPerfilBars() {
  if (!perfilRef.value) return; destroyChart('perfil')
  const d = filtered.value; const { textColor, mutedColor, gridColor } = chartDefaults()
  charts.perfil = new Chart(perfilRef.value, {
    type: 'bar',
    data: { labels: ['Internac.','Local Ins.','Servicios'], datasets: ['A++','A','B','C'].map((cl, i) => ({ label:cl, data:['I','L','S'].map(p => d.filter(r => r.perf===p && r.clase===cl).length), backgroundColor:['#22C55E','#4ADE80','#F59E0B','#EF4444'][i], borderRadius:2 })) },
    options: { responsive:true, maintainAspectRatio:true, indexAxis:'y', plugins:{ legend:{ labels:{ color:textColor, font:{size:11} } } }, scales:{ x:{ stacked:true, grid:{color:gridColor}, ticks:{color:mutedColor} }, y:{ stacked:true, grid:{color:gridColor}, ticks:{color:textColor} } } }
  })
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function drawRanking() {
  if (!rankRef.value) return; destroyChart('rank')
  const d = [...filtered.value].sort((a, b) => a.score - b.score); const { textColor, mutedColor, gridColor } = chartDefaults()
  charts.rank = new Chart(rankRef.value, {
    type: 'bar',
    data: { labels: d.map(r => r.prov.slice(0,20) + ' / ' + r.prod.slice(0,14)), datasets:[{ label:'Puntaje', data:d.map(r => r.score), backgroundColor:d.map(r => CLASE_COLOR[r.clase]+'CC'), borderRadius:2 }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label: ctx => ` ${ctx.raw.toFixed(1)} pts — ${d[ctx.dataIndex].clase}` } } }, scales:{ x:{min:0,max:105,grid:{color:gridColor},ticks:{color:mutedColor}}, y:{grid:{display:false},ticks:{color:textColor,font:{size:10}}} } }
  })
}

// ─── MODULE SCORE ─────────────────────────────────────────────────────────────
function modScore(r, mod) {
  const inc = v => v === null ? null : Math.max(0, 100 - Math.min(v, 2) * 45)
  if (mod === 'M1') { if (r.nc===null && r.dtm===null) return 50; const vs=[r.nc,r.dtm].filter(v=>v!==null).map(inc); return vs.reduce((s,v)=>s+v,0)/vs.length }
  if (mod === 'M2') return Math.max(0, 100 - [r.et,r.dem,r.dc].filter(v=>v!==null).reduce((s,v)=>s+Math.min(v,1)*33,0))
  if (mod === 'M3') { if (r.art===null) return 50; return Math.max(0, 100 - [r.art,r.epp,r.doc].reduce((s,v)=>s+Math.min(v,1)*33,0)) }
  if (mod === 'M4') return ((r.psa>0?100:65) + (r.fin===1?100:60)) / 2
  if (mod === 'M5') { const vs=[r.i9,r.fsc,r.i14,r.st].filter(v=>v!==null); if(!vs.length) return 50; return vs.reduce((s,v)=>s+(v===1?100:0),0)/vs.length }
  return 0
}

// ─── RADAR (single + compare) ─────────────────────────────────────────────────
function drawRadar() {
  if (!radarRef.value) return; destroyChart('radar')
  const { textColor, gridColor } = chartDefaults()
  const mods = ['M1','M2','M3','M4','M5']
  const labels = ['M1 Calidad','M2 Logística','M3 HyS/Legal','M4 Comercial','M5 Sustentab.']

  const provsToRender = compareMode.value ? activeCompareProvs.value : [compareProvs.value[0]].filter(Boolean)
  if (!provsToRender.length) return

  const datasets = provsToRender.map((provName, i) => {
    const rows = compareRows(provName)
    const r = rows[0]
    if (!r) return null
    const color = compareMode.value ? COMPARE_COLORS[i] : CLASE_COLOR[r.clase]
    return {
      label: provName,
      data: mods.map(m => modScore(r, m)),
      backgroundColor: color + '22',
      borderColor: color,
      pointBackgroundColor: color,
      borderWidth: 2,
      pointRadius: compareMode.value ? 5 : 4,
    }
  }).filter(Boolean)

  charts.radar = new Chart(radarRef.value, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive:true, maintainAspectRatio:true,
      scales: { r: { min:0, max:100, grid:{color:gridColor}, ticks:{display:false}, pointLabels:{color:textColor,font:{size:11}}, angleLines:{color:gridColor} } },
      plugins: { legend: { display: compareMode.value, labels:{ color:textColor, font:{size:11}, boxWidth:12 } } }
    }
  })
}

// ─── RISK ─────────────────────────────────────────────────────────────────────
function drawRisk() {
  if (!riskRef.value) return; destroyChart('risk')
  const d = filtered.value; const { textColor, mutedColor, gridColor } = chartDefaults()
  const incFields = [{key:'nc',label:'NC Críticas'},{key:'dtm',label:'Desvíos Téc.'},{key:'et',label:'Ent. Tarde'},{key:'dem',label:'Demora Doc.'},{key:'dc',label:'Daño Carga'},{key:'art',label:'ART Vencida'},{key:'epp',label:'Falta EPP'},{key:'doc',label:'Doc. Mensual'}]
  const rates = incFields.map(({ key, label }) => { const app=d.filter(r=>r[key]!==null); const fail=app.filter(r=>r[key]>0); return { label, rate: app.length?(fail.length/app.length)*100:0 } }).sort((a,b)=>b.rate-a.rate)
  charts.risk = new Chart(riskRef.value, {
    type: 'bar',
    data: { labels:rates.map(r=>r.label), datasets:[{ label:'% con incidentes', data:rates.map(r=>r.rate), backgroundColor:rates.map(r=>r.rate>10?'#EF4444CC':r.rate>5?'#F59E0BCC':'#22C55ECC'), borderRadius:3 }] },
    options: { responsive:true, maintainAspectRatio:true, indexAxis:'y', plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)}% de proveedores afectados`}} }, scales:{ x:{min:0,max:100,grid:{color:gridColor},ticks:{color:mutedColor,callback:v=>v+'%'}}, y:{grid:{display:false},ticks:{color:textColor}} } }
  })
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function indCell(v, isInc) {
  if (v === null) return '—'
  return isInc ? (v > 0 ? `⚠ ${v}` : '✓') : (v === 1 ? '✓' : '—')
}
function cellHtml(v, isInc) {
  if (v === null) return `<span class="text-muted">—</span>`
  if (isInc) return v > 0 ? `<span style="color:#EF4444;font-weight:700">${v}</span>` : `<span style="color:#22C55E">0</span>`
  return v === 1 ? `<span style="color:#22C55E">✓</span>` : `<span class="text-muted">—</span>`
}

function compareIndCell(provName, key, isInc) {
  const rows = compareRows(provName)
  if (!rows.length) return `<span class="text-muted">—</span>`
  const vals = rows.map(r => r[key]).filter(v => v !== null)
  if (!vals.length) return `<span class="text-muted">N/A</span>`
  if (isInc) {
    const sum = vals.reduce((s, v) => s + v, 0)
    return sum > 0 ? `<span style="color:#EF4444;font-weight:700">${sum}</span>` : `<span style="color:#22C55E">0</span>`
  } else {
    const hasAll = vals.every(v => v === 1)
    const hasNone = vals.every(v => v === 0)
    return hasAll ? `<span style="color:#22C55E">✓</span>` : hasNone ? `<span class="text-muted">—</span>` : `<span style="color:#F59E0B">parcial</span>`
  }
}

// ─── INTERACTIONS ─────────────────────────────────────────────────────────────
function selectSearchResult(r) {
  compareProvs.value[0] = r.prov
  searchText.value = ''
  showSearchDrop.value = false
  activeTab.value = 'ficha'
}
function closeDropDelay() { setTimeout(() => { showSearchDrop.value = false }, 150) }

function toggleCompare() {
  compareMode.value = !compareMode.value
  if (!compareMode.value) { compareProvs.value[1] = ''; compareProvs.value[2] = '' }
}

async function onCompareChange() { await nextTick(); drawRadar() }

// ─── DRAW CURRENT TAB ─────────────────────────────────────────────────────────
async function drawCurrentTab() {
  await nextTick()
  if (activeTab.value === 'dist')    { drawDonut(); drawPerfilBars() }
  if (activeTab.value === 'ranking') { drawRanking() }
  if (activeTab.value === 'ficha')   { drawRadar() }
  if (activeTab.value === 'riesgo')  { drawRisk() }
}

watch(activeTab, drawCurrentTab)
watch(filtered,  drawCurrentTab)
watch(compareMode, async () => { await nextTick(); drawRadar() })
watch(() => compareProvs.value[0], async () => { await nextTick(); drawRadar() })

onMounted(async () => {
  if (uniqueProvs.value.length) compareProvs.value[0] = uniqueProvs.value[0]
  await drawCurrentTab()
})
</script>

<style scoped>
.topbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.iso-badge { font-size:11px; font-weight:700; letter-spacing:.04em; padding:3px 8px; border-radius:3px; background:color-mix(in srgb, var(--color-primary) 15%, transparent); color:var(--color-primary); border:1px solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
.period-badge { font-size:11px; color:var(--color-text-muted); border:1px solid var(--color-border); padding:3px 8px; border-radius:3px; }

.kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; margin-bottom:16px; }
.kpi-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:14px; display:flex; align-items:center; gap:12px; }
.kpi-card--green  { border-left:3px solid #22C55E; }
.kpi-card--lime   { border-left:3px solid #4ADE80; }
.kpi-card--gold   { border-left:3px solid #F59E0B; }
.kpi-card--danger { border-left:3px solid #EF4444; }
.kpi-card--blue   { border-left:3px solid var(--color-primary); }
.kpi-icon { font-size:20px; opacity:.6; }
.kpi-content { display:flex; flex-direction:column; gap:2px; }
.kpi-label { font-size:10px; text-transform:uppercase; letter-spacing:.04em; color:var(--color-text-muted); }
.kpi-value { font-size:22px; font-weight:700; line-height:1.1; }
.kpi-value small { font-size:13px; font-weight:400; color:var(--color-text-muted); }

.filter-bar { display:flex; align-items:flex-end; gap:12px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:10px 14px; margin-bottom:12px; flex-wrap:wrap; }
.filter-group { display:flex; flex-direction:column; gap:4px; }
.filter-group label { font-size:10px; text-transform:uppercase; letter-spacing:.04em; color:var(--color-text-muted); }
.f-select, .f-input { background:var(--color-bg); border:1px solid var(--color-border); color:var(--color-text); padding:6px 10px; border-radius:4px; font-size:12px; }
.f-input { min-width:200px; }
.chip-row { display:flex; gap:4px; }
.chip { padding:4px 10px; border-radius:3px; border:1px solid var(--color-border); background:var(--color-bg); color:var(--color-text-muted); cursor:pointer; font-size:11px; font-weight:700; transition:all .15s; }
.chip-all.active { border-color:var(--color-primary); color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 12%, transparent); }
.chip-App.active { border-color:#22C55E; color:#22C55E; background:#22C55E1A; }
.chip-A.active   { border-color:#4ADE80; color:#4ADE80; background:#4ADE801A; }
.chip-B.active   { border-color:#F59E0B; color:#F59E0B; background:#F59E0B1A; }
.chip-C.active   { border-color:#EF4444; color:#EF4444; background:#EF44441A; }
.filter-count { margin-left:auto; font-size:11px; color:var(--color-text-muted); align-self:flex-end; }

/* SEARCH DROPDOWN */
.search-group { position:relative; }
.search-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.2); z-index:200; max-height:340px; overflow-y:auto; }
.search-drop-item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; transition:background .1s; }
.search-drop-item:hover { background:var(--color-bg); }
.search-drop-text { flex:1; font-size:12px; }
.search-drop-score { font-family:monospace; font-size:11px; font-weight:700; }
.search-drop-more { padding:6px 12px; font-size:11px; color:var(--color-text-muted); border-top:1px solid var(--color-border); text-align:center; }
.search-drop-empty { padding:12px; font-size:12px; color:var(--color-text-muted); text-align:center; }

.tab-nav { display:flex; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; overflow:hidden; margin-bottom:16px; }
.tab-btn { flex:1; padding:10px 4px; border:none; background:none; color:var(--color-text-muted); cursor:pointer; font-size:12px; font-weight:600; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:6px; border-right:1px solid var(--color-border); }
.tab-btn:last-child { border-right:none; }
.tab-btn:hover { color:var(--color-text); background:var(--color-bg); }
.tab-btn.active { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, transparent); }

.tab-content { animation:fadeIn .2s; }
@keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }

.charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media (max-width:800px) { .charts-grid { grid-template-columns:1fr; } }

.chart-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:16px; }
.chart-title { font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:12px; }
.chart-title-sub { font-size:9px; font-weight:400; text-transform:none; letter-spacing:0; margin-left:8px; }
.canvas-wrap { position:relative; }
.canvas-doughnut { max-width:320px; margin:0 auto; }
.canvas-radar { max-width:340px; margin:0 auto; }
.canvas-radar-lg { max-width:440px; margin:0 auto; }
.rank-chart-wrap { position:relative; width:100%; }
.rank-chart-wrap canvas { position:absolute; inset:0; }

/* ART GRUPOS */
.art-groups { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
@media (max-width:900px) { .art-groups { grid-template-columns:1fr; } }
.art-group { border-radius:5px; border:1px solid var(--color-border); overflow:hidden; }
.art-group-header { display:flex; align-items:center; gap:8px; padding:8px 12px; font-size:11px; font-weight:700; letter-spacing:.03em; }
.art-group-count { margin-left:auto; font-size:16px; font-weight:700; font-family:monospace; }
.art-group--risk { border-color:#EF444440; }
.art-group--risk .art-group-header  { background:#EF44441A; color:#EF4444; }
.art-group--dual { border-color:#F59E0B40; }
.art-group--dual .art-group-header  { background:#F59E0B1A; color:#F59E0B; }
.art-group--safe { border-color:#22C55E40; }
.art-group--safe .art-group-header  { background:#22C55E1A; color:#22C55E; }
.art-group-body { display:flex; flex-direction:column; }
.art-item { padding:7px 12px; border-top:1px solid var(--color-border); }
.art-item-name { font-size:12px; font-weight:600; margin-bottom:4px; }
.art-item-provs { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.art-prov-chip { font-size:9px !important; padding:1px 5px !important; }
.art-prov-names { font-size:10px; color:var(--color-text-muted); }

/* FICHA */
.ficha-layout { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:0; }
.ficha-info { min-width:200px; flex:0 0 220px; }

/* COMPARE */
.compare-legend { display:flex; gap:16px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
.compare-legend-item { display:flex; align-items:center; gap:6px; font-size:12px; }
.compare-legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
.compare-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-top:0; }
.compare-card { border-top:3px solid; }
.compare-prod-row { display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid var(--color-border); font-size:11px; }
.compare-prod-row:last-child { border-bottom:none; }
.compare-prod-row .text-muted { flex:1; }
.compare-score-row td { padding-top:10px !important; border-top:2px solid var(--color-border) !important; }

/* GRADES */
.grade { display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:monospace; padding:2px 8px; border-radius:2px; }
.grade-App { background:#22C55E1A; color:#22C55E; }
.grade-A   { background:#4ADE801A; color:#4ADE80; }
.grade-B   { background:#F59E0B1A; color:#F59E0B; }
.grade-C   { background:#EF44441A; color:#EF4444; }

.badge-pct { font-size:12px; font-weight:700; font-family:monospace; color:var(--color-primary); }
.mono  { font-family:monospace; font-size:11px; }
.small { font-size:11px; }
.text-muted { color:var(--color-text-muted); }

.data-table { width:100%; border-collapse:collapse; font-size:12px; }
.data-table th { text-align:left; font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--color-text-muted); padding:6px 10px; border-bottom:1px solid var(--color-border); white-space:nowrap; }
.data-table td { padding:6px 10px; border-bottom:1px solid var(--color-border); white-space:nowrap; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tr:hover td { background:var(--color-bg); }
.data-table--sm th, .data-table--sm td { padding:4px 8px; font-size:11px; }
.table-responsive { overflow-x:auto; }

.alert-list { display:flex; flex-direction:column; gap:8px; }
.alert-item { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:4px; font-size:12px; border:1px solid; }
.alert-danger  { background:#EF44441A; border-color:#EF444440; }
.alert-warning { background:#F59E0B1A; border-color:#F59E0B40; }
.alert-info    { background:color-mix(in srgb, var(--color-primary) 10%, transparent); border-color:color-mix(in srgb, var(--color-primary) 25%, transparent); }
.alert-danger i  { color:#EF4444; flex-shrink:0; margin-top:2px; }
.alert-warning i { color:#F59E0B; flex-shrink:0; margin-top:2px; }
.alert-info i    { color:var(--color-primary); flex-shrink:0; margin-top:2px; }

.btn-sm { padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; display:inline-flex; align-items:center; gap:6px; transition:all .15s; }
.btn-primary { background:var(--color-primary); color:#fff; border-color:var(--color-primary); }
.btn-ghost   { background:transparent; color:var(--color-text-muted); border-color:var(--color-border); }
.btn-ghost:hover { color:var(--color-text); border-color:var(--color-text-muted); }
</style>
