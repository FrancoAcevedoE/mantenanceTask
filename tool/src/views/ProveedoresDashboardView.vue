<template>
  <div class="page-container">
    <div class="container">

      <div class="topbar">
        <h2 class="title">Dashboard de Proveedores</h2>
        <span class="iso-badge">ISO 9001:2015 §8.4</span>
        <span class="period-badge">Período: Ene–Jul 2026</span>
        <button class="btn-report" @click="openReport"><i class="bi bi-file-earmark-text"></i> Reporte mensual</button>
      </div>

      <!-- KPI STRIP -->
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon"><i class="bi bi-building"></i></div><div class="kpi-content"><span class="kpi-label">Evaluados</span><span class="kpi-value">{{ filtered.length }}</span></div></div>
        <div class="kpi-card kpi-card--green"><div class="kpi-icon"><i class="bi bi-check2-circle"></i></div><div class="kpi-content"><span class="kpi-label">Clase A++</span><span class="kpi-value">{{ counts['A++'] }} <small>({{ pct('A++') }}%)</small></span></div></div>
        <div class="kpi-card kpi-card--lime"><div class="kpi-icon"><i class="bi bi-check-circle"></i></div><div class="kpi-content"><span class="kpi-label">Clase A</span><span class="kpi-value">{{ counts['A'] }} <small>({{ pct('A') }}%)</small></span></div></div>
        <div class="kpi-card kpi-card--gold"><div class="kpi-icon"><i class="bi bi-exclamation-triangle"></i></div><div class="kpi-content"><span class="kpi-label">Clase B</span><span class="kpi-value">{{ counts['B'] }} <small>({{ pct('B') }}%)</small></span></div></div>
        <div class="kpi-card kpi-card--danger"><div class="kpi-icon"><i class="bi bi-x-circle"></i></div><div class="kpi-content"><span class="kpi-label">Clase C</span><span class="kpi-value">{{ counts['C'] }}</span></div></div>
        <div class="kpi-card kpi-card--blue"><div class="kpi-icon"><i class="bi bi-bar-chart-line"></i></div><div class="kpi-content"><span class="kpi-label">Puntaje prom.</span><span class="kpi-value">{{ avgScoreVal }}</span></div></div>
        <div class="kpi-card kpi-card--teal"><div class="kpi-icon"><i class="bi bi-receipt"></i></div><div class="kpi-content"><span class="kpi-label">Órdenes totales</span><span class="kpi-value">{{ orders.length }}</span></div></div>
      </div>

      <!-- FILTERS (global) -->
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
              :class="['chip', cl==='all' ? 'chip-all' : `chip-${cl.replace('++','pp')}`, filterClase===cl ? 'active' : '']"
              @click="filterClase = cl">{{ cl==='all' ? 'Todas' : cl }}</button>
          </div>
        </div>
        <div class="filter-group search-group" style="flex:1;position:relative">
          <label>Buscar</label>
          <input ref="searchInputRef" v-model="searchText" class="f-input" placeholder="Proveedor o producto…"
            @focus="showSearchDrop = true" @blur="closeDropDelay" />
          <div v-if="showSearchDrop && searchText && searchResults.length" class="search-drop">
            <div v-for="r in searchResults" :key="r.id" class="search-drop-item" @mousedown.prevent="selectSearchResult(r)">
              <span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span>
              <div class="search-drop-text"><strong>{{ r.prov }}</strong><span class="text-muted"> · {{ r.prod }}</span></div>
              <span class="search-drop-score" :style="{ color: CLASE_COLOR[r.clase] }">{{ r.score.toFixed(1) }}</span>
            </div>
            <div v-if="searchResults.length === MAX_RESULTS" class="search-drop-more">+ {{ filtered.length - MAX_RESULTS }} más</div>
          </div>
          <div v-if="showSearchDrop && searchText && !searchResults.length" class="search-drop">
            <div class="search-drop-empty">Sin resultados para "{{ searchText }}"</div>
          </div>
        </div>
        <div class="filter-count">{{ filtered.length }} / {{ ISO_DATA.length }} evaluados · {{ orders.length }} órdenes</div>
      </div>

      <!-- TABS -->
      <div class="tab-nav">
        <button v-for="t in tabs" :key="t.id"
          :class="['tab-btn', { active: activeTab === t.id }]"
          @click="activeTab = t.id">
          <i :class="'bi ' + t.icon"></i> {{ t.label }}
        </button>
      </div>

      <!-- ══ TAB HISTORIAL ══ -->
      <div v-if="activeTab === 'historial'" class="dash-tab">
        <div class="filter-bar">
          <div class="filter-group">
            <label>Mes</label>
            <input type="month" v-model="hFiltroMes" class="f-select" />
          </div>
          <div class="filter-group">
            <label>Proveedor</label>
            <select v-model="hFiltroProv" class="f-select">
              <option value="">Todos</option>
              <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Producto</label>
            <input v-model="hFiltroProd" class="f-input" placeholder="Filtrar producto…" style="min-width:160px" />
          </div>
          <div class="filter-group">
            <label>Estado</label>
            <select v-model="hFiltroEstado" class="f-select">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="recibido">Recibido</option>
              <option value="parcial">Parcial</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <button v-if="canManageCompras" class="btn-sm btn-primary filter-btn-align" @click="openOrderForm()">
            <i class="bi bi-plus-lg"></i> Nueva orden
          </button>
        </div>

        <div v-if="loadingOrders" class="empty-state">Cargando órdenes…</div>
        <div v-else-if="!filteredOrders.length" class="empty-state">Sin órdenes para los filtros actuales.</div>
        <div v-else class="chart-card" style="padding:0;overflow:hidden">
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr>
                <th>Fecha</th><th>Nro Orden</th><th>Proveedor</th><th>Producto</th>
                <th>Cant.</th><th>Unidad</th><th>Precio/u</th><th>Total</th><th>Estado</th><th v-if="canManageCompras"></th>
              </tr></thead>
              <tbody>
                <tr v-for="o in filteredOrders" :key="o._id" class="clickable-row" @click="goToFichaFromOrder(o)">
                  <td class="mono">{{ fmtFecha(o.fecha) }}</td>
                  <td class="mono"><strong>{{ o.nroOrden }}</strong></td>
                  <td><strong>{{ o.proveedorNombre }}</strong></td>
                  <td>{{ o.producto }}</td>
                  <td class="mono">{{ o.cantidad || '—' }}</td>
                  <td class="text-muted">{{ o.unidad || '—' }}</td>
                  <td class="mono">{{ o.precioUnitario ? '$' + fmt(o.precioUnitario) : '—' }}</td>
                  <td class="mono"><strong>{{ o.total ? '$' + fmt(o.total) : '—' }}</strong></td>
                  <td><span :class="'estado-badge estado-' + o.estado">{{ o.estado }}</span></td>
                  <td v-if="canManageCompras" @click.stop>
                    <div style="display:flex;gap:4px">
                      <button class="btn-xs" @click="openOrderForm(o)"><i class="bi bi-pencil"></i></button>
                      <button class="btn-xs btn-xs--danger" @click="deleteOrder(o._id)"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="filteredOrdersTotal > 0">
                <tr>
                  <td colspan="7" style="text-align:right;font-weight:700;padding:8px 10px">Total filtrado</td>
                  <td class="mono" style="font-weight:700">${{ fmt(filteredOrdersTotal) }}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ TAB DISTRIBUCIÓN ══ -->
      <div v-if="activeTab === 'dist'" class="dash-tab">
        <div class="charts-grid">
          <div class="chart-card">
            <h3 class="chart-title">Distribución por Clasificación</h3>
            <div class="canvas-wrap canvas-doughnut"><canvas ref="donutRef"></canvas></div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Distribución por Perfil de Abastecimiento</h3>
            <div class="canvas-wrap"><canvas ref="perfilRef"></canvas></div>
          </div>
        </div>
        <div class="chart-card" style="margin-top:16px">
          <h3 class="chart-title">Análisis por Artículo — Cobertura de Proveedores <span class="chart-title-sub">ISO §8.4 · riesgo de fuente única</span></h3>
          <div class="art-groups">
            <div v-for="grupo in artGrupos" :key="grupo.label" class="art-group" :class="grupo.cls">
              <div class="art-group-header"><i :class="'bi ' + grupo.icon"></i> {{ grupo.label }}<span class="art-group-count">{{ grupo.items.length }}</span></div>
              <div class="art-group-body">
                <div v-for="art in grupo.items" :key="art.prod" class="art-item">
                  <div class="art-item-name">{{ art.prod }}</div>
                  <div class="art-item-provs">
                    <span v-for="p in art.provs" :key="p.prov + p.clase" :class="'art-prov-chip grade grade-' + p.clase.replace('++','pp')" :title="p.prov + ' — ' + p.score.toFixed(1)">{{ p.clase }}</span>
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
              <thead><tr><th>Módulo</th><th>Internacional</th><th>Local Insumos</th><th>Servicios/Fletes</th><th>Indicadores</th></tr></thead>
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

      <!-- ══ TAB RANKING ══ -->
      <div v-if="activeTab === 'ranking'" class="dash-tab">
        <div class="chart-card">
          <h3 class="chart-title">Ranking Completo — Puntaje Final Ponderado ({{ filtered.length }} registros)</h3>
          <div class="rank-chart-wrap" :style="{ height: Math.max(400, filtered.length * 24 + 60) + 'px' }">
            <canvas ref="rankRef"></canvas>
          </div>
        </div>
      </div>

      <!-- ══ TAB FICHA / COMPARAR ══ -->
      <div v-if="activeTab === 'ficha'" class="dash-tab">
        <div class="filter-bar" style="align-items:center">
          <div class="filter-group" style="flex:1">
            <label>{{ compareMode ? 'Proveedores a comparar (hasta 3)' : 'Seleccionar proveedor' }}</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <select v-model="compareProvs[0]" class="f-select" style="min-width:220px">
                <option value="">— Proveedor 1 —</option>
                <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
              </select>
              <template v-if="compareMode">
                <select v-model="compareProvs[1]" class="f-select" style="min-width:220px">
                  <option value="">— Proveedor 2 —</option>
                  <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
                </select>
                <select v-model="compareProvs[2]" class="f-select" style="min-width:220px">
                  <option value="">— Proveedor 3 (opcional) —</option>
                  <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
                </select>
              </template>
            </div>
          </div>
          <button :class="['btn-sm', compareMode ? 'btn-primary' : 'btn-ghost', 'filter-btn-align']" @click="toggleCompare">
            <i :class="'bi ' + (compareMode ? 'bi-x-lg' : 'bi-arrow-left-right')"></i>
            {{ compareMode ? 'Salir de comparación' : 'Comparar proveedores' }}
          </button>
        </div>

        <!-- MODO INDIVIDUAL -->
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
              <div class="canvas-wrap canvas-radar"><canvas ref="radarRef"></canvas></div>
            </div>
          </div>
          <div class="chart-card" style="margin-top:16px">
            <h3 class="chart-title">Detalle por Producto</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead><tr><th>Código</th><th>Producto</th><th>Puntaje</th><th>Clase</th><th>NC</th><th>Desvíos</th><th>Ent.Tarde</th><th>Daño</th><th>ISO 9001</th><th>ISO 14001</th><th>FSC</th></tr></thead>
                <tbody>
                  <tr v-for="r in fichaRows" :key="r.id">
                    <td class="mono">{{ r.id }}</td><td>{{ r.prod }}</td>
                    <td class="mono" :style="{ color: CLASE_COLOR[r.clase] }"><strong>{{ r.score.toFixed(1) }}</strong></td>
                    <td><span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span></td>
                    <td>{{ indCell(r.nc, true) }}</td><td>{{ indCell(r.dtm, true) }}</td>
                    <td>{{ indCell(r.et, true) }}</td><td>{{ indCell(r.dc, true) }}</td>
                    <td>{{ indCell(r.i9, false) }}</td><td>{{ indCell(r.i14, false) }}</td><td>{{ indCell(r.fsc, false) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- MODO COMPARACIÓN -->
        <template v-if="compareMode && activeCompareProvs.length">
          <div class="chart-card" style="margin-bottom:16px">
            <h3 class="chart-title">Radar Comparativo — Módulos M1–M5</h3>
            <div class="canvas-wrap canvas-radar-lg"><canvas ref="radarRef"></canvas></div>
            <div class="compare-legend">
              <div v-for="(p, i) in activeCompareProvs" :key="p" class="compare-legend-item">
                <span class="compare-legend-dot" :style="{ background: COMPARE_COLORS[i] }"></span>{{ p }}
              </div>
            </div>
          </div>
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
                  <span class="text-muted small" style="flex:1">{{ r.prod }}</span>
                  <span class="mono small" :style="{ color: CLASE_COLOR[r.clase] }">{{ r.score.toFixed(1) }}</span>
                  <span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-card" style="margin-top:16px">
            <h3 class="chart-title">Comparación de Indicadores</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead><tr>
                  <th>Indicador</th>
                  <th v-for="(p, i) in activeCompareProvs" :key="p" :style="{ color: COMPARE_COLORS[i] }">{{ p }}</th>
                </tr></thead>
                <tbody>
                  <tr v-for="ind in COMPARE_INDICATORS" :key="ind.key">
                    <td class="text-muted">{{ ind.label }}</td>
                    <td v-for="provName in activeCompareProvs" :key="provName" v-html="compareIndCell(provName, ind.key, ind.isInc)"></td>
                  </tr>
                  <tr class="compare-score-row">
                    <td><strong>Puntaje promedio</strong></td>
                    <td v-for="(provName, i) in activeCompareProvs" :key="provName" class="mono" :style="{ color: COMPARE_COLORS[i], fontWeight: 700 }">{{ compareAvg(provName) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- HISTORIAL DEL PROVEEDOR (siempre visible si hay proveedor seleccionado) -->
        <template v-if="compareProvs[0]">
          <div class="section-divider"><i class="bi bi-clock-history"></i> Historial de Compras — {{ compareMode ? activeCompareProvs.join(', ') : compareProvs[0] }}</div>
          <div v-if="!fichaOrders.length" class="empty-state small-empty">Sin órdenes de compra registradas para este proveedor.</div>
          <div v-else>
            <div v-for="(grp, prod) in fichaOrdersByProd" :key="prod" class="chart-card" style="margin-bottom:12px">
              <h3 class="chart-title">{{ prod }} <span class="chart-title-sub">{{ grp.length }} orden(es) · Total: ${{ fmt(grp.reduce((s, o) => s + (o.total||0), 0)) }}</span></h3>
              <div class="table-responsive">
                <table class="data-table data-table--sm">
                  <thead><tr><th>Fecha</th><th>Nro Orden</th><th>Cant.</th><th>Precio/u</th><th>Total</th><th>Estado</th><th>Notas</th></tr></thead>
                  <tbody>
                    <tr v-for="o in grp" :key="o._id">
                      <td class="mono">{{ fmtFecha(o.fecha) }}</td>
                      <td class="mono"><strong>{{ o.nroOrden }}</strong></td>
                      <td>{{ o.cantidad || '—' }} {{ o.unidad }}</td>
                      <td class="mono">{{ o.precioUnitario ? '$' + fmt(o.precioUnitario) : '—' }}</td>
                      <td class="mono"><strong>{{ o.total ? '$' + fmt(o.total) : '—' }}</strong></td>
                      <td><span :class="'estado-badge estado-' + o.estado">{{ o.estado }}</span></td>
                      <td class="text-muted small">{{ o.notas || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ══ TAB RIESGO ══ -->
      <div v-if="activeTab === 'riesgo'" class="dash-tab">
        <div class="charts-grid" style="margin-bottom:16px">
          <div class="chart-card">
            <h3 class="chart-title">Frecuencia de Incidentes por Indicador</h3>
            <div class="canvas-wrap"><canvas ref="riskRef"></canvas></div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Alertas Críticas</h3>
            <div class="alert-list">
              <div v-for="a in alertas" :key="a.text" class="alert-item" :class="'alert-' + a.type">
                <i :class="'bi ' + a.icon"></i><span>{{ a.text }}</span>
              </div>
              <div v-if="!alertas.length" class="text-muted small" style="padding:12px">Sin alertas para los filtros actuales.</div>
            </div>
          </div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Tabla Completa con Indicadores</h3>
          <div class="table-responsive">
            <table class="data-table data-table--sm">
              <thead><tr><th>Código</th><th>Proveedor</th><th>Producto</th><th>Perf.</th><th>NC</th><th>Desv.</th><th>E.Tarde</th><th>D.Carga</th><th>ART</th><th>EPP</th><th>ISO9001</th><th>FSC</th><th>ISO14001</th><th>ST</th><th>Puntaje</th><th>Clase</th></tr></thead>
              <tbody>
                <tr v-for="r in sortedFiltered" :key="r.id">
                  <td class="mono">{{ r.id }}</td><td><strong>{{ r.prov }}</strong></td><td class="text-muted">{{ r.prod }}</td><td class="text-muted mono">{{ r.perf }}</td>
                  <td v-html="cellHtml(r.nc,true)"></td><td v-html="cellHtml(r.dtm,true)"></td><td v-html="cellHtml(r.et,true)"></td><td v-html="cellHtml(r.dc,true)"></td>
                  <td v-html="cellHtml(r.art,true)"></td><td v-html="cellHtml(r.epp,true)"></td><td v-html="cellHtml(r.i9,false)"></td><td v-html="cellHtml(r.fsc,false)"></td><td v-html="cellHtml(r.i14,false)"></td><td v-html="cellHtml(r.st,false)"></td>
                  <td class="mono" :style="{ color: CLASE_COLOR[r.clase] }"><strong>{{ r.score.toFixed(1) }}</strong></td>
                  <td><span :class="'grade grade-' + r.clase.replace('++','pp')">{{ r.clase }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div><!-- /container -->

    <!-- ══ MODAL ORDEN DE COMPRA ══ -->
    <div v-if="showOrderForm" class="modal-overlay" @click.self="showOrderForm = false">
      <div class="modal-box">
        <h3>{{ editingOrderId ? 'Editar orden' : 'Nueva orden de compra' }}</h3>
        <div class="form-grid">
          <label>Nro Orden *<input v-model="orderForm.nroOrden" placeholder="OC-2026-001" /></label>
          <label>Fecha *<input type="date" v-model="orderForm.fecha" /></label>
          <label>Proveedor *
            <select v-model="orderForm.proveedorNombre" class="f-select" style="width:100%">
              <option value="">Seleccionar…</option>
              <option v-for="p in uniqueProvs" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
          <label>Producto *<input v-model="orderForm.producto" placeholder="Papel Kraft, Melamina…" /></label>
          <label>Cantidad<input type="number" v-model.number="orderForm.cantidad" min="0" /></label>
          <label>Unidad<input v-model="orderForm.unidad" placeholder="kg, lt, m2…" /></label>
          <label>Precio unitario<input type="number" v-model.number="orderForm.precioUnitario" min="0" step="0.01" @input="calcTotal" /></label>
          <label>Total<input type="number" v-model.number="orderForm.total" min="0" step="0.01" /></label>
          <label>Estado
            <select v-model="orderForm.estado" class="f-select" style="width:100%">
              <option value="pendiente">Pendiente</option>
              <option value="recibido">Recibido</option>
              <option value="parcial">Parcial</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label class="full-col">Notas<textarea v-model="orderForm.notas" rows="2" style="width:100%;resize:vertical"></textarea></label>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showOrderForm = false">Cancelar</button>
          <button class="btn-primary" :disabled="savingOrder" @click="saveOrder">
            {{ savingOrder ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ REPORTE MENSUAL ══ -->
    <div v-if="showReport" class="modal-overlay report-overlay" @click.self="showReport = false">
      <div class="report-modal">
        <div class="report-controls no-print">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <label style="font-size:12px;color:var(--color-muted)">Mes del reporte</label>
            <input type="month" v-model="reportMes" class="f-select" @change="buildReport" />
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-sm btn-ghost" @click="showReport = false"><i class="bi bi-x-lg"></i> Cerrar</button>
            <button class="btn-sm btn-primary" @click="window.print()"><i class="bi bi-printer"></i> Imprimir / PDF</button>
          </div>
        </div>

        <div class="report-body" id="printable-report">
          <div class="report-header">
            <h1>Reporte Mensual de Proveedores</h1>
            <p class="report-subtitle">ISO 9001:2015 §8.4 — Gestión de la cadena de suministro</p>
            <p class="report-meta">Período: <strong>{{ reportMesLabel }}</strong> · Generado: {{ fmtFecha(new Date()) }}</p>
          </div>

          <div v-if="!reportData.length" class="empty-state">Sin datos para el período seleccionado.</div>

          <div v-for="prov in reportData" :key="prov.nombre" class="report-proveedor">
            <div class="report-prov-header">
              <span class="report-prov-name">{{ prov.nombre }}</span>
              <span :class="'grade grade-' + prov.clase.replace('++','pp')">{{ prov.clase }}</span>
              <span class="report-prov-score" :style="{ color: CLASE_COLOR[prov.clase] }">{{ prov.score }} pts</span>
              <span class="report-prov-perfil text-muted">{{ PERF_LABEL[prov.perf] }}</span>
            </div>

            <div class="report-section-label">Evaluación ISO — Indicadores</div>
            <div class="report-indicators">
              <div v-for="ind in REPORT_IND_LABELS" :key="ind.key" class="report-ind-item">
                <span class="report-ind-key">{{ ind.label }}</span>
                <span v-html="cellHtml(prov.isoRow[ind.key], ind.isInc)" class="report-ind-val"></span>
              </div>
            </div>

            <div class="report-section-label">Historial de Compras — {{ reportMesLabel }}</div>
            <div v-if="!prov.orders.length" class="text-muted small" style="padding:4px 0 8px">Sin órdenes en este período.</div>
            <div v-else class="report-orders">
              <table class="data-table data-table--sm">
                <thead><tr><th>Fecha</th><th>Nro Orden</th><th>Producto</th><th>Cant.</th><th>Unidad</th><th>Precio/u</th><th>Total</th><th>Estado</th></tr></thead>
                <tbody>
                  <tr v-for="o in prov.orders" :key="o._id">
                    <td class="mono">{{ fmtFecha(o.fecha) }}</td>
                    <td class="mono">{{ o.nroOrden }}</td>
                    <td>{{ o.producto }}</td>
                    <td>{{ o.cantidad || '—' }}</td>
                    <td>{{ o.unidad || '—' }}</td>
                    <td class="mono">{{ o.precioUnitario ? '$' + fmt(o.precioUnitario) : '—' }}</td>
                    <td class="mono"><strong>{{ o.total ? '$' + fmt(o.total) : '—' }}</strong></td>
                    <td><span :class="'estado-badge estado-' + o.estado">{{ o.estado }}</span></td>
                  </tr>
                </tbody>
                <tfoot><tr>
                  <td colspan="6" style="text-align:right;font-weight:700">Subtotal del mes</td>
                  <td class="mono" style="font-weight:700">${{ fmt(prov.orders.reduce((s,o) => s+(o.total||0), 0)) }}</td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
          </div>

          <div class="report-footer">
            <p>Documento generado automáticamente · Sistema de Gestión de Proveedores · ISO 9001:2015</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import axios from 'axios'
import { ISO_DATA, CLASE_COLOR, PERF_LABEL, CRIT_LABEL, filterData, claseCounts, avgScore } from '@/data/isoProveedores.js'
import { API_BASE_URL } from '@/utils/api'
import { usePermissions } from '@/utils/permissions'

Chart.register(...registerables)

const { isAdmin, canManageCompras } = usePermissions()

// ─── API HELPER ───────────────────────────────────────────────────────────────
const authH = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } })
const api = {
  get:    (path, cfg = {}) => axios.get(`${API_BASE_URL}${path}`, { ...authH(), ...cfg }),
  post:   (path, data)     => axios.post(`${API_BASE_URL}${path}`, data, authH()),
  put:    (path, data)     => axios.put(`${API_BASE_URL}${path}`, data, authH()),
  delete: (path)           => axios.delete(`${API_BASE_URL}${path}`, authH()),
}

// ─── STATE ────────────────────────────────────────────────────────────────────
const activeTab    = ref('historial')
const filterPerfil = ref('')
const filterClase  = ref('all')
const searchText   = ref('')
const showSearchDrop = ref(false)
const MAX_RESULTS  = 10

// Órdenes de compra
const orders        = ref([])
const loadingOrders = ref(false)
const hFiltroMes    = ref('')
const hFiltroProv   = ref('')
const hFiltroProd   = ref('')
const hFiltroEstado = ref('')
const showOrderForm  = ref(false)
const savingOrder   = ref(false)
const editingOrderId = ref(null)
const orderForm     = ref({ nroOrden:'', fecha:'', proveedorNombre:'', producto:'', cantidad:0, unidad:'', precioUnitario:0, total:0, estado:'pendiente', notas:'' })

// Ficha / comparación
const compareMode   = ref(false)
const compareProvs  = ref(['', '', ''])
const COMPARE_COLORS = ['#3B82F6','#F97316','#A855F7']

// Reporte
const showReport  = ref(false)
const reportMes   = ref('')
const reportData  = ref([])

const tabs = [
  { id:'historial', label:'Historial',        icon:'bi-clock-history' },
  { id:'dist',      label:'Distribución',     icon:'bi-pie-chart' },
  { id:'ranking',   label:'Ranking',          icon:'bi-bar-chart' },
  { id:'ficha',     label:'Ficha / Comparar', icon:'bi-building' },
  { id:'riesgo',    label:'Análisis de Riesgo', icon:'bi-shield-exclamation' },
]

const MODULOS = [
  { id:'M1', label:'M1. Calidad y Conformidad Técnica',    I:40, L:30, S:0,  indicadores:'NC Críticas, Desvíos Técnicos' },
  { id:'M2', label:'M2. Logística, Entregas y Origen',     I:30, L:25, S:50, indicadores:'Entregas Tarde, Demora Docum., Daño Carga, Origen Extremo' },
  { id:'M3', label:'M3. Higiene, Seguridad y Legales',     I:0,  L:15, S:30, indicadores:'ART Vencida, Falta EPP, Doc. Mensual' },
  { id:'M4', label:'M4. Gestión Comercial y Costos',       I:20, L:15, S:20, indicadores:'Precio/Cotización, Financiamiento' },
  { id:'M5', label:'M5. Sustentabilidad y Certificaciones',I:10, L:15, S:0,  indicadores:'ISO 9001, FSC, ISO 14001, Soporte Técnico' },
]

const COMPARE_INDICATORS = [
  { key:'nc',  label:'NC Críticas',      isInc:true  }, { key:'dtm', label:'Desvíos Téc.',   isInc:true  },
  { key:'et',  label:'Entregas Tarde',   isInc:true  }, { key:'dem', label:'Demora Docum.',   isInc:true  },
  { key:'dc',  label:'Daño en Carga',    isInc:true  }, { key:'art', label:'ART Vencida',     isInc:true  },
  { key:'epp', label:'Falta EPP',        isInc:true  }, { key:'i9',  label:'ISO 9001',        isInc:false },
  { key:'fsc', label:'FSC',              isInc:false }, { key:'i14', label:'ISO 14001',        isInc:false },
  { key:'st',  label:'Soporte Técnico',  isInc:false }, { key:'fin', label:'Financiamiento',   isInc:false },
]

const REPORT_IND_LABELS = [
  { key:'nc',isInc:true,label:'NC Críticas' }, { key:'dtm',isInc:true,label:'Desvíos Téc.' },
  { key:'et',isInc:true,label:'Ent. Tarde' }, { key:'dc',isInc:true,label:'Daño Carga' },
  { key:'i9',isInc:false,label:'ISO 9001' }, { key:'fsc',isInc:false,label:'FSC' },
  { key:'i14',isInc:false,label:'ISO 14001' }, { key:'st',isInc:false,label:'Soporte Téc.' },
]

// ─── COMPUTED ISO ─────────────────────────────────────────────────────────────
const filtered       = computed(() => filterData(ISO_DATA, { perf:filterPerfil.value, clase:filterClase.value, search:searchText.value }))
const counts         = computed(() => claseCounts(filtered.value))
const pct            = cl => { const t = filtered.value.length; return t ? ((counts.value[cl]/t)*100).toFixed(0) : 0 }
const avgScoreVal    = computed(() => avgScore(filtered.value).toFixed(1))
const sortedFiltered = computed(() => [...filtered.value].sort((a,b) => a.score - b.score))
const uniqueProvs    = computed(() => [...new Set(ISO_DATA.map(d => d.prov))].sort())
const searchResults  = computed(() => searchText.value ? filtered.value.slice(0, MAX_RESULTS) : [])

const fichaRows = computed(() => ISO_DATA.filter(d => d.prov === compareProvs.value[0]))
const fichaAvg  = computed(() => {
  if (!fichaRows.value.length) return '—'
  return (fichaRows.value.reduce((s,d) => s+d.score,0)/fichaRows.value.length).toFixed(1)
})
const activeCompareProvs = computed(() => compareProvs.value.filter(p => p))
const compareRows     = pn => ISO_DATA.filter(d => d.prov === pn)
const compareFirstRow = pn => compareRows(pn)[0]
const compareAvg      = pn => { const r = compareRows(pn); return r.length ? (r.reduce((s,d)=>s+d.score,0)/r.length).toFixed(1) : '—' }

const artGrupos = computed(() => {
  const d = filtered.value
  const map = {}
  d.forEach(r => { if (!map[r.prod]) map[r.prod] = []; map[r.prod].push({ prov:r.prov, clase:r.clase, score:r.score }) })
  const items = Object.entries(map).map(([prod, provs]) => ({ prod, provs: provs.sort((a,b)=>b.score-a.score), n: provs.length })).sort((a,b)=>a.prod.localeCompare(b.prod))
  return [
    { label:'1 proveedor — Fuente única',       icon:'bi-exclamation-triangle-fill', cls:'art-group--risk', items: items.filter(i=>i.n===1) },
    { label:'2 proveedores — Cobertura dual',   icon:'bi-arrow-left-right',          cls:'art-group--dual', items: items.filter(i=>i.n===2) },
    { label:'3 o más — Multicobertura',          icon:'bi-check2-all',                cls:'art-group--safe', items: items.filter(i=>i.n>=3) },
  ]
})

const alertas = computed(() => {
  const d = filtered.value; const list = []
  const c = d.filter(r=>r.clase==='C'); if(c.length) list.push({ type:'danger',  icon:'bi-x-circle',       text:`${c.length} proveedor(es) en Clase C: ${c.map(r=>r.prov+' / '+r.prod).join(', ')}` })
  const nc= d.filter(r=>r.nc!==null&&r.nc>0);  if(nc.length) list.push({ type:'danger',  icon:'bi-bug',            text:`${nc.length} con NC Críticas: ${[...new Set(nc.map(r=>r.prov))].join(', ')}` })
  const et= d.filter(r=>r.et>0);               if(et.length) list.push({ type:'warning', icon:'bi-truck',          text:`${et.length} con entregas tardías: ${[...new Set(et.map(r=>r.prov))].join(', ')}` })
  const b = d.filter(r=>r.clase==='B');         if(b.length)  list.push({ type:'warning', icon:'bi-clipboard-check',text:`${b.length} en Clase B requieren Plan de Mejora` })
  return list
})

// ─── COMPUTED ÓRDENES ─────────────────────────────────────────────────────────
const filteredOrders = computed(() => {
  let o = orders.value
  if (hFiltroMes.value) {
    const [y, m] = hFiltroMes.value.split('-').map(Number)
    o = o.filter(r => { const d = new Date(r.fecha); return d.getFullYear()===y && d.getMonth()===m-1 })
  }
  if (hFiltroProv.value) o = o.filter(r => r.proveedorNombre === hFiltroProv.value)
  if (hFiltroProd.value) o = o.filter(r => r.producto.toLowerCase().includes(hFiltroProd.value.toLowerCase()))
  if (hFiltroEstado.value) o = o.filter(r => r.estado === hFiltroEstado.value)
  return o
})
const filteredOrdersTotal = computed(() => filteredOrders.value.reduce((s,o) => s+(o.total||0), 0))

const fichaOrders = computed(() => {
  const provs = compareMode.value ? activeCompareProvs.value : [compareProvs.value[0]].filter(Boolean)
  return orders.value.filter(o => provs.includes(o.proveedorNombre))
})
const fichaOrdersByProd = computed(() => {
  const map = {}
  fichaOrders.value.forEach(o => {
    const key = o.producto
    if (!map[key]) map[key] = []
    map[key].push(o)
  })
  Object.keys(map).forEach(k => map[k].sort((a,b) => new Date(b.fecha)-new Date(a.fecha)))
  return map
})

const reportMesLabel = computed(() => {
  if (!reportMes.value) return '—'
  const [y, m] = reportMes.value.split('-').map(Number)
  return new Date(y, m-1, 1).toLocaleDateString('es-AR', { month:'long', year:'numeric' })
})

// ─── CHART REFS ───────────────────────────────────────────────────────────────
const donutRef  = ref(null); const perfilRef = ref(null)
const rankRef   = ref(null); const radarRef  = ref(null); const riskRef = ref(null)
let charts = {}
function destroyChart(k) { if(charts[k]) { charts[k].destroy(); charts[k]=null } }
function isDark() { return document.documentElement.getAttribute('data-theme')==='dark' || (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) }
function chartDefaults() { const dark=isDark(); return { textColor:dark?'#D6E3F5':'#1A2438', mutedColor:dark?'#5C7399':'#6B7E99', gridColor:dark?'#1E2E48':'#E0E8F4' } }

function drawDonut() {
  if(!donutRef.value) return; destroyChart('donut')
  const d=filtered.value; const {textColor}=chartDefaults()
  charts.donut=new Chart(donutRef.value,{type:'doughnut',data:{labels:['A++','A','B','C'],datasets:[{data:[counts.value['A++'],counts.value['A'],counts.value['B'],counts.value['C']],backgroundColor:['#22C55E','#4ADE80','#F59E0B','#EF4444'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:true,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:textColor,padding:16,font:{size:12}}},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw} (${((ctx.raw/d.length)*100).toFixed(0)}%)`}}}}})
}
function drawPerfilBars() {
  if(!perfilRef.value) return; destroyChart('perfil')
  const d=filtered.value; const {textColor,mutedColor,gridColor}=chartDefaults()
  charts.perfil=new Chart(perfilRef.value,{type:'bar',data:{labels:['Internac.','Local Ins.','Servicios'],datasets:['A++','A','B','C'].map((cl,i)=>({label:cl,data:['I','L','S'].map(p=>d.filter(r=>r.perf===p&&r.clase===cl).length),backgroundColor:['#22C55E','#4ADE80','#F59E0B','#EF4444'][i],borderRadius:2}))},options:{responsive:true,maintainAspectRatio:true,indexAxis:'y',plugins:{legend:{labels:{color:textColor,font:{size:11}}}},scales:{x:{stacked:true,grid:{color:gridColor},ticks:{color:mutedColor}},y:{stacked:true,grid:{color:gridColor},ticks:{color:textColor}}}}})
}
function drawRanking() {
  if(!rankRef.value) return; destroyChart('rank')
  const d=[...filtered.value].sort((a,b)=>a.score-b.score); const {textColor,mutedColor,gridColor}=chartDefaults()
  charts.rank=new Chart(rankRef.value,{type:'bar',data:{labels:d.map(r=>r.prov.slice(0,20)+' / '+r.prod.slice(0,14)),datasets:[{label:'Puntaje',data:d.map(r=>r.score),backgroundColor:d.map(r=>CLASE_COLOR[r.clase]+'CC'),borderRadius:2}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)} pts — ${d[ctx.dataIndex].clase}`}}},scales:{x:{min:0,max:105,grid:{color:gridColor},ticks:{color:mutedColor}},y:{grid:{display:false},ticks:{color:textColor,font:{size:10}}}}}})
}
function modScore(r,mod) {
  const inc=v=>v===null?null:Math.max(0,100-Math.min(v,2)*45)
  if(mod==='M1'){if(r.nc===null&&r.dtm===null)return 50;const vs=[r.nc,r.dtm].filter(v=>v!==null).map(inc);return vs.reduce((s,v)=>s+v,0)/vs.length}
  if(mod==='M2')return Math.max(0,100-[r.et,r.dem,r.dc].filter(v=>v!==null).reduce((s,v)=>s+Math.min(v,1)*33,0))
  if(mod==='M3'){if(r.art===null)return 50;return Math.max(0,100-[r.art,r.epp,r.doc].reduce((s,v)=>s+Math.min(v,1)*33,0))}
  if(mod==='M4')return((r.psa>0?100:65)+(r.fin===1?100:60))/2
  if(mod==='M5'){const vs=[r.i9,r.fsc,r.i14,r.st].filter(v=>v!==null);if(!vs.length)return 50;return vs.reduce((s,v)=>s+(v===1?100:0),0)/vs.length}
  return 0
}
function drawRadar() {
  if(!radarRef.value) return; destroyChart('radar')
  const {textColor,gridColor}=chartDefaults()
  const mods=['M1','M2','M3','M4','M5']
  const labels=['M1 Calidad','M2 Logística','M3 HyS/Legal','M4 Comercial','M5 Sustentab.']
  const provs=compareMode.value?activeCompareProvs.value:[compareProvs.value[0]].filter(Boolean)
  if(!provs.length) return
  const datasets=provs.map((pn,i)=>{const r=compareRows(pn)[0];if(!r)return null;const color=compareMode.value?COMPARE_COLORS[i]:CLASE_COLOR[r.clase];return{label:pn,data:mods.map(m=>modScore(r,m)),backgroundColor:color+'22',borderColor:color,pointBackgroundColor:color,borderWidth:2,pointRadius:compareMode.value?5:4}}).filter(Boolean)
  charts.radar=new Chart(radarRef.value,{type:'radar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:true,scales:{r:{min:0,max:100,grid:{color:gridColor},ticks:{display:false},pointLabels:{color:textColor,font:{size:11}},angleLines:{color:gridColor}}},plugins:{legend:{display:compareMode.value,labels:{color:textColor,font:{size:11},boxWidth:12}}}}})
}
function drawRisk() {
  if(!riskRef.value) return; destroyChart('risk')
  const d=filtered.value; const {textColor,mutedColor,gridColor}=chartDefaults()
  const incF=[{key:'nc',label:'NC Críticas'},{key:'dtm',label:'Desvíos Téc.'},{key:'et',label:'Ent. Tarde'},{key:'dem',label:'Demora Doc.'},{key:'dc',label:'Daño Carga'},{key:'art',label:'ART Vencida'},{key:'epp',label:'Falta EPP'},{key:'doc',label:'Doc. Mensual'}]
  const rates=incF.map(({key,label})=>{const app=d.filter(r=>r[key]!==null);const fail=app.filter(r=>r[key]>0);return{label,rate:app.length?(fail.length/app.length)*100:0}}).sort((a,b)=>b.rate-a.rate)
  charts.risk=new Chart(riskRef.value,{type:'bar',data:{labels:rates.map(r=>r.label),datasets:[{label:'% con incidentes',data:rates.map(r=>r.rate),backgroundColor:rates.map(r=>r.rate>10?'#EF4444CC':r.rate>5?'#F59E0BCC':'#22C55ECC'),borderRadius:3}]},options:{responsive:true,maintainAspectRatio:true,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw.toFixed(1)}% afectados`}}},scales:{x:{min:0,max:100,grid:{color:gridColor},ticks:{color:mutedColor,callback:v=>v+'%'}},y:{grid:{display:false},ticks:{color:textColor}}}}})
}

async function drawCurrentTab() {
  await nextTick()
  if(activeTab.value==='dist')    { drawDonut(); drawPerfilBars() }
  if(activeTab.value==='ranking') drawRanking()
  if(activeTab.value==='ficha')   drawRadar()
  if(activeTab.value==='riesgo')  drawRisk()
}

// ─── ORDERS CRUD ──────────────────────────────────────────────────────────────
async function loadOrders() {
  loadingOrders.value = true
  try { const { data } = await api.get('/ordenes-compra'); orders.value = data }
  catch (e) { console.error(e) }
  finally { loadingOrders.value = false }
}

function openOrderForm(o = null) {
  editingOrderId.value = o ? o._id : null
  if (o) {
    const d = new Date(o.fecha)
    const dateStr = d.toISOString().split('T')[0]
    orderForm.value = { nroOrden:o.nroOrden, fecha:dateStr, proveedorNombre:o.proveedorNombre, producto:o.producto, cantidad:o.cantidad||0, unidad:o.unidad||'', precioUnitario:o.precioUnitario||0, total:o.total||0, estado:o.estado||'pendiente', notas:o.notas||'' }
  } else {
    orderForm.value = { nroOrden:'', fecha:new Date().toISOString().split('T')[0], proveedorNombre:'', producto:'', cantidad:0, unidad:'', precioUnitario:0, total:0, estado:'pendiente', notas:'' }
  }
  showOrderForm.value = true
}

function calcTotal() {
  orderForm.value.total = +(orderForm.value.cantidad * orderForm.value.precioUnitario).toFixed(2)
}

async function saveOrder() {
  if (!orderForm.value.nroOrden || !orderForm.value.fecha || !orderForm.value.proveedorNombre || !orderForm.value.producto) return
  savingOrder.value = true
  try {
    if (editingOrderId.value) { await api.put(`/ordenes-compra/${editingOrderId.value}`, orderForm.value) }
    else { await api.post('/ordenes-compra', orderForm.value) }
    showOrderForm.value = false
    await loadOrders()
  } catch(e) { console.error(e) }
  finally { savingOrder.value = false }
}

async function deleteOrder(id) {
  if (!confirm('¿Eliminar esta orden de compra?')) return
  await api.delete(`/ordenes-compra/${id}`)
  await loadOrders()
}

// ─── REPORT ───────────────────────────────────────────────────────────────────
function openReport() {
  if (!reportMes.value) {
    const now = new Date()
    reportMes.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  }
  buildReport()
  showReport.value = true
}

function buildReport() {
  if (!reportMes.value) return
  const [y, m] = reportMes.value.split('-').map(Number)
  const mesOrders = orders.value.filter(o => {
    const d = new Date(o.fecha)
    return d.getFullYear()===y && d.getMonth()===m-1
  })
  const allProvs = [...new Set([...ISO_DATA.map(d => d.prov), ...orders.value.map(o => o.proveedorNombre)])].sort()
  reportData.value = allProvs.map(nombre => {
    const isoRows = ISO_DATA.filter(d => d.prov === nombre)
    const provOrders = mesOrders.filter(o => o.proveedorNombre === nombre)
    if (!isoRows.length && !provOrders.length) return null
    const isoRow = isoRows[0] || {}
    const scoreAvg = isoRows.length ? (isoRows.reduce((s,d)=>s+d.score,0)/isoRows.length).toFixed(1) : '—'
    const clase = isoRows.length ? isoRows[0].clase : '—'
    return { nombre, isoRow, score: scoreAvg, clase, perf: isoRow.perf || '—', orders: provOrders }
  }).filter(Boolean).filter(p => p.isoRows?.length || p.orders.length || p.isoRow?.prov)
  // Keep only provs that are in ISO_DATA or have orders this month
  reportData.value = allProvs.map(nombre => {
    const isoRows = ISO_DATA.filter(d => d.prov === nombre)
    const provOrders = mesOrders.filter(o => o.proveedorNombre === nombre)
    if (!isoRows.length && !provOrders.length) return null
    const isoRow = isoRows[0] || {}
    const scoreAvg = isoRows.length ? (isoRows.reduce((s,d)=>s+d.score,0)/isoRows.length).toFixed(1) : '—'
    const clase = isoRows.length ? isoRows[0].clase : '—'
    return { nombre, isoRow, score: scoreAvg, clase, perf: isoRow.perf || '—', orders: provOrders }
  }).filter(Boolean)
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function indCell(v, isInc) { if(v===null)return'—'; return isInc?(v>0?`⚠ ${v}`:'✓'):(v===1?'✓':'—') }
function cellHtml(v,isInc) { if(v===null)return`<span class="text-muted">—</span>`; if(isInc)return v>0?`<span style="color:#EF4444;font-weight:700">${v}</span>`:`<span style="color:#22C55E">0</span>`; return v===1?`<span style="color:#22C55E">✓</span>`:`<span class="text-muted">—</span>` }
function compareIndCell(pn,key,isInc) { const rows=compareRows(pn); if(!rows.length)return`<span class="text-muted">—</span>`; const vals=rows.map(r=>r[key]).filter(v=>v!==null); if(!vals.length)return`<span class="text-muted">N/A</span>`; if(isInc){const sum=vals.reduce((s,v)=>s+v,0);return sum>0?`<span style="color:#EF4444;font-weight:700">${sum}</span>`:`<span style="color:#22C55E">0</span>`}else{const hasAll=vals.every(v=>v===1);const hasNone=vals.every(v=>v===0);return hasAll?`<span style="color:#22C55E">✓</span>`:hasNone?`<span class="text-muted">—</span>`:`<span style="color:#F59E0B">parcial</span>`} }
function fmtFecha(d) { if(!d)return'—'; return new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}) }
function fmt(n) { return (n||0).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function goToFichaFromOrder(o) { compareProvs.value[0] = o.proveedorNombre; compareMode.value = false; activeTab.value = 'ficha' }
function selectSearchResult(r) { compareProvs.value[0] = r.prov; searchText.value = ''; showSearchDrop.value = false; activeTab.value = 'ficha' }
function closeDropDelay() { setTimeout(()=>{ showSearchDrop.value = false }, 150) }
function toggleCompare() { compareMode.value = !compareMode.value; if(!compareMode.value){compareProvs.value[1]='';compareProvs.value[2]=''} }

// ─── WATCHERS ─────────────────────────────────────────────────────────────────
watch(activeTab, drawCurrentTab)
watch(filtered, drawCurrentTab)
watch(compareMode, async () => { await nextTick(); drawRadar() })
watch(() => compareProvs.value[0], async () => { await nextTick(); drawRadar() })
watch(() => compareProvs.value[1], async () => { await nextTick(); drawRadar() })
watch(() => compareProvs.value[2], async () => { await nextTick(); drawRadar() })

onMounted(async () => {
  if (uniqueProvs.value.length) compareProvs.value[0] = uniqueProvs.value[0]
  await loadOrders()
  await drawCurrentTab()
})
</script>

<style scoped>
.topbar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
.iso-badge { font-size:11px; font-weight:700; letter-spacing:.04em; padding:3px 8px; border-radius:3px; background:color-mix(in srgb, var(--color-primary) 15%, transparent); color:var(--color-primary); border:1px solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
.period-badge { font-size:11px; color:var(--color-muted); border:1px solid var(--color-border); padding:3px 8px; border-radius:3px; }
.btn-report { margin-left:auto; padding:6px 14px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text); display:flex; align-items:center; gap:6px; transition:all .15s; }
.btn-report:hover { border-color:var(--color-primary); color:var(--color-primary); }

.kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin-bottom:14px; }
.kpi-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:12px; display:flex; align-items:center; gap:10px; }
.kpi-card--green  { border-left:3px solid #22C55E; } .kpi-card--lime { border-left:3px solid #4ADE80; }
.kpi-card--gold   { border-left:3px solid #F59E0B; } .kpi-card--danger { border-left:3px solid #EF4444; }
.kpi-card--blue   { border-left:3px solid var(--color-primary); } .kpi-card--teal { border-left:3px solid #14B8A6; }
.kpi-icon { font-size:18px; opacity:.6; flex-shrink:0; }
.kpi-content { display:flex; flex-direction:column; gap:1px; }
.kpi-label { font-size:9px; text-transform:uppercase; letter-spacing:.04em; color:var(--color-muted); }
.kpi-value { font-size:20px; font-weight:700; line-height:1.1; color:var(--color-text); }
.kpi-value small { font-size:12px; font-weight:400; color:var(--color-muted); }

.filter-bar { display:flex; align-items:flex-end; gap:12px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:10px 14px; margin-bottom:12px; flex-wrap:wrap; }
.filter-group { display:flex; flex-direction:column; gap:4px; }
.filter-group label { font-size:10px; text-transform:uppercase; letter-spacing:.04em; color:var(--color-muted); }
.f-select,.f-input { background:var(--color-bg); border:1px solid var(--color-border); color:var(--color-text); padding:6px 10px; border-radius:4px; font-size:12px; }
.f-input { min-width:180px; }
.chip-row { display:flex; gap:4px; }
.chip { padding:4px 10px; border-radius:3px; border:1px solid var(--color-border); background:var(--color-bg); color:var(--color-muted); cursor:pointer; font-size:11px; font-weight:700; transition:all .15s; }
.chip-all.active { border-color:var(--color-primary); color:var(--color-primary); background:color-mix(in srgb,var(--color-primary) 12%,transparent); }
.chip-App.active { border-color:#22C55E; color:#22C55E; background:#22C55E1A; } .chip-A.active { border-color:#4ADE80; color:#4ADE80; background:#4ADE801A; }
.chip-B.active   { border-color:#F59E0B; color:#F59E0B; background:#F59E0B1A; } .chip-C.active { border-color:#EF4444; color:#EF4444; background:#EF44441A; }
.filter-count { margin-left:auto; font-size:11px; color:var(--color-muted); align-self:flex-end; }

.search-group { position:relative; }
.search-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.2); z-index:200; max-height:300px; overflow-y:auto; }
.search-drop-item { display:flex; align-items:center; gap:8px; padding:8px 12px; cursor:pointer; transition:background .1s; }
.search-drop-item:hover { background:var(--color-bg); }
.search-drop-text { flex:1; font-size:12px; }
.search-drop-score { font-family:monospace; font-size:11px; font-weight:700; }
.search-drop-more,.search-drop-empty { padding:8px 12px; font-size:11px; color:var(--color-muted); text-align:center; border-top:1px solid var(--color-border); }

.tab-nav { display:flex; background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; overflow:hidden; margin-bottom:16px; flex-wrap:wrap; }
.tab-btn { flex:1; min-width:100px; padding:9px 4px; border:none; background:none; color:var(--color-muted); cursor:pointer; font-size:11px; font-weight:600; transition:all .15s; display:flex; align-items:center; justify-content:center; gap:5px; border-right:1px solid var(--color-border); }
.tab-btn:last-child { border-right:none; }
.tab-btn:hover { color:var(--color-text); background:var(--color-bg); }
.tab-btn.active { color:var(--color-primary); background:color-mix(in srgb,var(--color-primary) 8%,transparent); }

.dash-tab { animation:fadeIn .2s; background:transparent !important; border:none !important; box-shadow:none !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; padding:0 !important; border-radius:0 !important; }
@keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }

.charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media (max-width:800px) { .charts-grid { grid-template-columns:1fr; } }
.chart-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:16px; }
.chart-title { font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--color-muted); margin-bottom:12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.chart-title-sub { font-size:9px; font-weight:400; text-transform:none; letter-spacing:0; color:var(--color-muted); }
.canvas-wrap { position:relative; } .canvas-doughnut { max-width:300px; margin:0 auto; }
.canvas-radar { max-width:340px; margin:0 auto; } .canvas-radar-lg { max-width:440px; margin:0 auto; }
.rank-chart-wrap { position:relative; width:100%; } .rank-chart-wrap canvas { position:absolute; inset:0; width:100% !important; height:100% !important; }
.ficha-layout { display:flex; gap:16px; flex-wrap:wrap; width:100%; box-sizing:border-box; }
.ficha-info { min-width:200px; flex:0 0 220px; }

/* HISTORIAL TABLE */
.empty-state { padding:32px; text-align:center; color:var(--color-muted); font-size:13px; }
.small-empty { padding:16px; }
.clickable-row { cursor:pointer; }
.clickable-row:hover td { background:var(--color-bg); }
.estado-badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:3px; }
.estado-pendiente { background:#6366F11A; color:#6366F1; }
.estado-recibido  { background:#22C55E1A; color:#22C55E; }
.estado-parcial   { background:#F59E0B1A; color:#F59E0B; }
.estado-cancelado { background:#EF44441A; color:#EF4444; }

/* SECTION DIVIDER */
.section-divider { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--color-muted); margin:24px 0 12px; }
.section-divider::before,.section-divider::after { content:''; flex:1; height:1px; background:var(--color-border); }

/* ART GROUPS */
.art-groups { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
@media (max-width:900px) { .art-groups { grid-template-columns:1fr; } }
.art-group { border-radius:5px; border:1px solid var(--color-border); overflow:hidden; }
.art-group-header { display:flex; align-items:center; gap:8px; padding:8px 12px; font-size:11px; font-weight:700; letter-spacing:.03em; }
.art-group-count { margin-left:auto; font-size:16px; font-weight:700; font-family:monospace; }
.art-group--risk { border-color:#EF444440; } .art-group--risk .art-group-header { background:#EF44441A; color:#EF4444; }
.art-group--dual { border-color:#F59E0B40; } .art-group--dual .art-group-header { background:#F59E0B1A; color:#F59E0B; }
.art-group--safe { border-color:#22C55E40; } .art-group--safe .art-group-header { background:#22C55E1A; color:#22C55E; }
.art-group-body { display:flex; flex-direction:column; }
.art-item { padding:7px 12px; border-top:1px solid var(--color-border); }
.art-item-name { font-size:12px; font-weight:600; margin-bottom:4px; }
.art-item-provs { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.art-prov-chip { font-size:9px !important; padding:1px 5px !important; }
.art-prov-names { font-size:10px; color:var(--color-muted); }

/* COMPARE */
.compare-legend { display:flex; gap:16px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
.compare-legend-item { display:flex; align-items:center; gap:6px; font-size:12px; }
.compare-legend-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
.compare-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-top:16px; }
.compare-card { border-top:3px solid; }
.compare-prod-row { display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid var(--color-border); font-size:11px; }
.compare-prod-row:last-child { border-bottom:none; }
.compare-score-row td { padding-top:10px !important; border-top:2px solid var(--color-border) !important; }

/* GRADES */
.grade { display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; font-family:monospace; padding:2px 8px; border-radius:2px; }
.grade-App { background:#22C55E1A; color:#22C55E; } .grade-A { background:#4ADE801A; color:#4ADE80; }
.grade-B   { background:#F59E0B1A; color:#F59E0B; } .grade-C { background:#EF44441A; color:#EF4444; }
.badge-pct { font-size:12px; font-weight:700; font-family:monospace; color:var(--color-primary); }
.mono  { font-family:monospace; font-size:11px; }
.small { font-size:11px; }
.text-muted { color:var(--color-muted); }

.data-table { width:100%; border-collapse:collapse; font-size:12px; }
.data-table th { text-align:left; font-size:10px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--color-muted); padding:6px 10px; border-bottom:1px solid var(--color-border); white-space:nowrap; background:transparent; }
.data-table td { padding:6px 10px; border-bottom:1px solid var(--color-border); white-space:nowrap; color:var(--color-text); background:transparent; }
.data-table tr:last-child td { border-bottom:none; }
.data-table tr:hover td { background:var(--color-bg); }
.data-table tfoot td { background:var(--color-bg); }
.data-table--sm th,.data-table--sm td { padding:4px 8px; font-size:11px; }
.table-responsive { overflow-x:auto; }

.alert-list { display:flex; flex-direction:column; gap:8px; }
.alert-item { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:4px; font-size:12px; border:1px solid; }
.alert-danger  { background:#EF44441A; border-color:#EF444440; } .alert-warning { background:#F59E0B1A; border-color:#F59E0B40; }
.alert-info    { background:color-mix(in srgb,var(--color-primary) 10%,transparent); border-color:color-mix(in srgb,var(--color-primary) 25%,transparent); }
.alert-danger i { color:#EF4444; flex-shrink:0; margin-top:2px; } .alert-warning i { color:#F59E0B; flex-shrink:0; margin-top:2px; }
.alert-info i { color:var(--color-primary); flex-shrink:0; margin-top:2px; }

/* BUTTONS */
.btn-sm { padding:6px 12px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid; display:inline-flex; align-items:center; gap:6px; transition:all .15s; }
.btn-primary { background:var(--color-primary); color:#fff; border-color:var(--color-primary); }
.btn-ghost { background:transparent; color:var(--color-muted); border-color:var(--color-border); }
.btn-ghost:hover { color:var(--color-text); border-color:var(--color-muted); }
.btn-xs { padding:3px 7px; border-radius:3px; border:1px solid var(--color-border); background:var(--color-bg); color:var(--color-muted); cursor:pointer; font-size:11px; }
.btn-xs:hover { color:var(--color-text); }
.btn-xs--danger:hover { color:#EF4444; border-color:#EF4444; }

/* MODALS */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px; }
.modal-box { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:24px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; }
.modal-box h3 { font-size:15px; font-weight:700; margin-bottom:16px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
.form-grid label { display:flex; flex-direction:column; gap:4px; font-size:11px; color:var(--color-muted); font-weight:600; text-transform:uppercase; letter-spacing:.03em; }
.form-grid input,.form-grid textarea { background:var(--color-bg); border:1px solid var(--color-border); color:var(--color-text); padding:7px 10px; border-radius:4px; font-size:13px; }
.full-col { grid-column:1/-1; }
.modal-actions { display:flex; justify-content:flex-end; gap:8px; border-top:1px solid var(--color-border); padding-top:14px; }

/* REPORT MODAL */
.report-overlay { align-items:flex-start; overflow-y:auto; }
.report-modal { background:var(--color-surface); border-radius:8px; width:100%; max-width:900px; margin:auto; overflow:hidden; }
.report-controls { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--color-border); gap:12px; flex-wrap:wrap; }
.report-body { padding:24px; }
.report-header { text-align:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid var(--color-border); }
.report-header h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
.report-subtitle { font-size:12px; color:var(--color-muted); }
.report-meta { font-size:12px; color:var(--color-muted); margin-top:6px; }
.report-proveedor { margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid var(--color-border); }
.report-prov-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
.report-prov-name { font-size:16px; font-weight:700; }
.report-prov-score { font-family:monospace; font-size:15px; font-weight:700; }
.report-prov-perfil { font-size:11px; margin-left:auto; }
.report-section-label { font-size:9px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--color-muted); margin:10px 0 6px; border-bottom:1px solid var(--color-border); padding-bottom:4px; }
.report-indicators { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px; }
.report-ind-item { display:flex; align-items:center; gap:5px; font-size:11px; background:var(--color-bg); border:1px solid var(--color-border); padding:3px 8px; border-radius:3px; }
.report-ind-key { color:var(--color-muted); }
.report-ind-val { font-weight:700; }
.report-footer { text-align:center; font-size:10px; color:var(--color-muted); margin-top:24px; padding-top:16px; border-top:1px solid var(--color-border); }

/* FILTER BUTTON ALIGN */
.filter-btn-align { align-self:flex-end; }

/* DARK MODE OVERRIDES */
:global([data-theme="dark"]) .chart-card { background:rgba(255,255,255,0.06) !important; border-color:rgba(255,255,255,0.09) !important; }
:global([data-theme="dark"]) .modal-box { background:rgba(10,15,30,0.96) !important; border-color:rgba(255,255,255,0.12) !important; backdrop-filter:blur(20px); }
:global([data-theme="dark"]) .report-modal { background:rgba(10,15,30,0.97) !important; border-color:rgba(255,255,255,0.1) !important; backdrop-filter:blur(20px); }
:global([data-theme="dark"]) .search-drop { background:rgba(10,15,30,0.96) !important; border-color:rgba(255,255,255,0.12) !important; backdrop-filter:blur(20px); }
:global([data-theme="dark"]) .filter-bar { background:rgba(255,255,255,0.04) !important; border-color:rgba(255,255,255,0.09) !important; }
:global([data-theme="dark"]) .kpi-card { background:rgba(255,255,255,0.05) !important; border-color:rgba(255,255,255,0.08) !important; }
:global([data-theme="dark"]) .tab-nav { background:rgba(255,255,255,0.04) !important; border-color:rgba(255,255,255,0.08) !important; }
:global([data-theme="dark"]) .art-group { border-color:rgba(255,255,255,0.08) !important; }
:global([data-theme="dark"]) .art-group--risk { border-color:rgba(239,68,68,0.25) !important; }
:global([data-theme="dark"]) .art-group--dual { border-color:rgba(245,158,11,0.25) !important; }
:global([data-theme="dark"]) .art-group--safe { border-color:rgba(34,197,94,0.25) !important; }
:global([data-theme="dark"]) .modal-box h3, :global([data-theme="dark"]) .report-header h1 { color:#ffffff !important; }
:global([data-theme="dark"]) .data-table tfoot td { background:rgba(255,255,255,0.04) !important; }
:global([data-theme="dark"]) .data-table tr:hover td { background:rgba(255,255,255,0.05) !important; }
:global([data-theme="dark"]) .clickable-row:hover td { background:rgba(255,255,255,0.05) !important; }
:global([data-theme="dark"]) .report-ind-item { background:rgba(255,255,255,0.05) !important; border-color:rgba(255,255,255,0.09) !important; }
:global([data-theme="dark"]) .btn-xs { background:rgba(255,255,255,0.06) !important; border-color:rgba(255,255,255,0.1) !important; color:rgba(255,255,255,0.6) !important; }

@media print {
  .no-print { display:none !important; }
  .report-overlay,.report-modal { position:static !important; background:#fff !important; box-shadow:none !important; border:none !important; width:100% !important; max-width:none !important; }
  .report-body { padding:0 !important; }
  body * { visibility:hidden; }
  .report-body, .report-body * { visibility:visible; color:#000 !important; }
  .report-body { position:fixed; top:0; left:0; width:100%; }
  .grade { border:1px solid #ccc !important; }
  .report-proveedor { page-break-inside:avoid; }
}
</style>
