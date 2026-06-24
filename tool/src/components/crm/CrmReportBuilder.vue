<template>
  <Teleport to="body">
    <div class="rb-backdrop" @click.self="$emit('close')">
      <div class="rb-modal">

        <!-- Header -->
        <div class="rb-hd">
          <div class="rb-hd-left">
            <div class="rb-hd-icon"><i class="bi bi-file-earmark-bar-graph-fill"></i></div>
            <div>
              <h2>Generador de reportes</h2>
              <p>Elegí los datos y campos que querés incluir</p>
            </div>
          </div>
          <button class="rb-close" @click="$emit('close')"><i class="bi bi-x-lg"></i></button>
        </div>

        <!-- Body -->
        <div class="rb-body">

          <!-- Date range (aplica a todos) -->
          <div class="rb-date-row">
            <i class="bi bi-calendar3" style="color:var(--color-muted);font-size:0.85rem"></i>
            <span class="rb-date-label">Rango de fechas</span>
            <input type="date" v-model="dateFrom" class="rb-date-input" />
            <span class="rb-date-sep">—</span>
            <input type="date" v-model="dateTo" class="rb-date-input" />
            <button v-if="dateFrom || dateTo" type="button" class="rb-date-clear" @click="dateFrom='';dateTo=''">
              <i class="bi bi-x"></i>
            </button>
          </div>

          <!-- ── CLIENTES ── -->
          <div class="rb-section" :class="{ 'rb-section--on': inc.clientes }">
            <div class="rb-sec-hd" @click="inc.clientes = !inc.clientes">
              <label class="rb-sec-toggle" @click.stop>
                <input type="checkbox" v-model="inc.clientes" />
              </label>
              <i class="bi bi-people-fill" style="color:#3b82f6"></i>
              <span class="rb-sec-title">Clientes</span>
              <span class="rb-sec-cnt">{{ filteredClients.length }} registros</span>
              <i class="bi rb-chevron" :class="inc.clientes ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>

            <div v-if="inc.clientes" class="rb-sec-body">
              <!-- Fields -->
              <div class="rb-fields-block">
                <div class="rb-fields-bar">
                  <span class="rb-fields-title">Campos</span>
                  <button type="button" @click="clientFields = CLIENT_FIELDS.map(f=>f.key)">Todos</button>
                  <button type="button" @click="clientFields = []">Ninguno</button>
                </div>
                <div class="rb-fields-grid">
                  <label v-for="f in CLIENT_FIELDS" :key="f.key" class="rb-field-lbl">
                    <input type="checkbox" v-model="clientFields" :value="f.key" />
                    {{ f.label }}
                  </label>
                </div>
              </div>
              <!-- Filters -->
              <div class="rb-filters-block">
                <span class="rb-fields-title">Filtros rápidos</span>
                <div class="rb-filter-row">
                  <select v-model="filters.clientEstado">
                    <option value="">Todos los estados</option>
                    <option value="activo">Activos</option>
                    <option value="inactivo">Inactivos</option>
                  </select>
                  <select v-model="filters.clientTipo">
                    <option value="">Todos los tipos</option>
                    <option value="potencial">Potencial</option>
                    <option value="normal">Cliente</option>
                  </select>
                  <select v-model="filters.clientStage">
                    <option value="">Todas las etapas</option>
                    <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
                  </select>
                </div>
              </div>

              <!-- Client picker -->
              <div class="rb-picker-block">
                <div class="rb-fields-bar">
                  <span class="rb-fields-title">
                    Clientes incluidos
                    <span class="rb-picker-badge">
                      {{ clientPickerActive ? selectedClientIds.length : preFilteredClients.length }}
                      / {{ preFilteredClients.length }}
                    </span>
                  </span>
                  <button type="button"
                    :class="['rb-selall', { 'rb-selall--active': clientPickerActive }]"
                    @click="toggleClientPicker">
                    <i :class="clientPickerActive ? 'bi bi-list-check' : 'bi bi-card-checklist'"></i>
                    {{ clientPickerActive ? 'Usar filtros' : 'Elegir uno a uno' }}
                  </button>
                </div>

                <div v-if="clientPickerActive" class="rb-client-picker">
                  <div class="rb-picker-searchbar">
                    <i class="bi bi-search"></i>
                    <input v-model="clientPickerSearch" placeholder="Buscar cliente..." class="rb-picker-input" />
                    <button v-if="clientPickerSearch" type="button" class="rb-picker-clear" @click="clientPickerSearch = ''">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                  <div class="rb-picker-actions">
                    <button type="button" @click="selectAllClients">Seleccionar todos</button>
                    <button type="button" @click="selectedClientIds = []">Ninguno</button>
                    <span class="rb-picker-count">{{ selectedClientIds.length }} seleccionado{{ selectedClientIds.length !== 1 ? 's' : '' }}</span>
                  </div>
                  <div class="rb-client-list">
                    <div v-if="!pickerClients.length" class="rb-picker-empty">
                      Sin resultados
                    </div>
                    <label v-for="c in pickerClients" :key="c._id" class="rb-client-item">
                      <input type="checkbox" :value="c._id" v-model="selectedClientIds" />
                      <span class="rb-client-name">{{ c.razonSocial || c.name || '—' }}</span>
                      <span v-if="c.nombreComercial" class="rb-client-sub">{{ c.nombreComercial }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── COTIZACIONES ── -->
          <div class="rb-section" :class="{ 'rb-section--on': inc.cotizaciones }">
            <div class="rb-sec-hd" @click="inc.cotizaciones = !inc.cotizaciones">
              <label class="rb-sec-toggle" @click.stop>
                <input type="checkbox" v-model="inc.cotizaciones" />
              </label>
              <i class="bi bi-file-earmark-text-fill" style="color:#f59e0b"></i>
              <span class="rb-sec-title">Cotizaciones</span>
              <span class="rb-sec-cnt">{{ filteredQuotes.length }} registros</span>
              <i class="bi rb-chevron" :class="inc.cotizaciones ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>

            <div v-if="inc.cotizaciones" class="rb-sec-body">
              <div class="rb-fields-block">
                <div class="rb-fields-bar">
                  <span class="rb-fields-title">Campos</span>
                  <button type="button" @click="quoteFields = QUOTE_FIELDS.map(f=>f.key)">Todos</button>
                  <button type="button" @click="quoteFields = []">Ninguno</button>
                </div>
                <div class="rb-fields-grid">
                  <label v-for="f in QUOTE_FIELDS" :key="f.key" class="rb-field-lbl">
                    <input type="checkbox" v-model="quoteFields" :value="f.key" />
                    {{ f.label }}
                  </label>
                </div>
              </div>
              <div class="rb-filters-block">
                <span class="rb-fields-title">Filtros</span>
                <div class="rb-filter-row">
                  <select v-model="filters.quoteEstado">
                    <option value="">Todos los estados</option>
                    <option value="borrador">Borrador</option>
                    <option value="enviada">Enviada</option>
                    <option value="aceptada">Aceptada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- ── ACTIVIDADES ── -->
          <div class="rb-section" :class="{ 'rb-section--on': inc.actividades }">
            <div class="rb-sec-hd" @click="inc.actividades = !inc.actividades">
              <label class="rb-sec-toggle" @click.stop>
                <input type="checkbox" v-model="inc.actividades" />
              </label>
              <i class="bi bi-clock-history" style="color:#8b5cf6"></i>
              <span class="rb-sec-title">Actividades</span>
              <span class="rb-sec-cnt">{{ filteredActivities.length }} registros</span>
              <i class="bi rb-chevron" :class="inc.actividades ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>

            <div v-if="inc.actividades" class="rb-sec-body">
              <div class="rb-fields-block">
                <div class="rb-fields-bar">
                  <span class="rb-fields-title">Campos</span>
                  <button type="button" @click="activityFields = ACTIVITY_FIELDS.map(f=>f.key)">Todos</button>
                  <button type="button" @click="activityFields = []">Ninguno</button>
                </div>
                <div class="rb-fields-grid">
                  <label v-for="f in ACTIVITY_FIELDS" :key="f.key" class="rb-field-lbl">
                    <input type="checkbox" v-model="activityFields" :value="f.key" />
                    {{ f.label }}
                  </label>
                </div>
              </div>
              <div class="rb-filters-block">
                <span class="rb-fields-title">Filtros</span>
                <div class="rb-filter-row">
                  <select v-model="filters.actTipo">
                    <option value="">Todos los tipos</option>
                    <option value="llamada">Llamadas</option>
                    <option value="reunion">Reuniones</option>
                    <option value="correo">Correos</option>
                    <option value="nota">Notas</option>
                  </select>
                  <select v-model="filters.actCompletada">
                    <option value="">Todas</option>
                    <option value="true">Completadas</option>
                    <option value="false">Pendientes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- ── PIPELINE ── -->
          <div class="rb-section" :class="{ 'rb-section--on': inc.pipeline }">
            <div class="rb-sec-hd" @click="inc.pipeline = !inc.pipeline">
              <label class="rb-sec-toggle" @click.stop>
                <input type="checkbox" v-model="inc.pipeline" />
              </label>
              <i class="bi bi-kanban-fill" style="color:#22c55e"></i>
              <span class="rb-sec-title">Resumen Pipeline</span>
              <span class="rb-sec-cnt">6 etapas</span>
              <i class="bi rb-chevron" :class="inc.pipeline ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
            <div v-if="inc.pipeline" class="rb-sec-body rb-pipeline-preview">
              <div v-for="s in STAGES" :key="s.key" class="rb-pipe-row">
                <span class="rb-pipe-dot" :style="{ background: s.color }"></span>
                <span class="rb-pipe-name">{{ s.label }}</span>
                <span class="rb-pipe-n" :style="{ color: s.color }">{{ stageCount(s.key) }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="rb-ft">
          <span class="rb-ft-info">
            <i class="bi bi-table"></i>
            {{ totalRows }} fila{{ totalRows !== 1 ? 's' : '' }} seleccionada{{ totalRows !== 1 ? 's' : '' }}
          </span>
          <button class="secondary-button" @click="$emit('close')">Cancelar</button>
          <button class="rb-excel-btn" :disabled="!totalRows" @click="exportExcel">
            <i class="bi bi-file-earmark-excel-fill"></i> Excel
          </button>
          <button class="rb-pdf-btn" :disabled="!totalRows" @click="exportPDF">
            <i class="bi bi-file-earmark-pdf-fill"></i> PDF
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCrmStore } from '@/stores/crm'

const props = defineProps({ quotes: { type: Array, default: () => [] } })
defineEmits(['close'])

const crmStore = useCrmStore()

// ── Lookups ────────────────────────────────────────────────────────────────
const STAGE_LABEL = {
  nuevo_lead: 'Nuevo Lead', contactado: 'Contactado',
  cotizacion_enviada: 'Cotización enviada', negociacion: 'Negociación',
  ganado: 'Ganado', perdido: 'Perdido',
}
const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo Lead',          color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',           color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotización enviada',   color: '#f59e0b' },
  { key: 'negociacion',        label: 'Negociación',          color: '#6366f1' },
  { key: 'ganado',             label: 'Ganado',               color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',              color: '#ef4444' },
]

const fmtDate = d => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const fmtCur  = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const qTotal  = q => (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0)

// ── Field definitions ──────────────────────────────────────────────────────
const CLIENT_FIELDS = [
  { key: 'razonSocial',       label: 'Razón Social',       get: c => c.razonSocial || c.name || '' },
  { key: 'nombreComercial',   label: 'Nombre Comercial',    get: c => c.nombreComercial || '' },
  { key: 'contactoPrincipal', label: 'Contacto Principal',  get: c => c.contactoPrincipal || '' },
  { key: 'cuitCuil',          label: 'CUIL / CUIT',         get: c => c.cuitCuil || '' },
  { key: 'telefonos',         label: 'Teléfonos',           get: c => (c.telefonos || []).map(t => `${t.numero} (${t.sector})`).join(' / ') || c.telefono || '' },
  { key: 'email',             label: 'Email',               get: c => c.email || '' },
  { key: 'direccion',         label: 'Dirección',           get: c => c.direccion || '' },
  { key: 'lugar',             label: 'Ubicación',           get: c => c.lugar || '' },
  { key: 'estado',            label: 'Estado',              get: c => c.estado || '' },
  { key: 'tipoCliente',       label: 'Tipo',                get: c => c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' },
  { key: 'pipelineEstado',    label: 'Etapa Pipeline',      get: c => STAGE_LABEL[c.pipelineEstado] || c.pipelineEstado || '' },
  { key: 'observaciones',     label: 'Observaciones',       get: c => c.observaciones || '' },
  { key: 'createdBy',         label: 'Registrado por',      get: c => c.createdBy || '' },
  { key: 'createdAt',         label: 'Fecha de alta',       get: c => fmtDate(c.createdAt) },
]

const QUOTE_FIELDS = [
  { key: 'numero',      label: 'N°',             get: q => `#${String(q.numero).padStart(4, '0')}` },
  { key: 'titulo',      label: 'Título',          get: q => q.titulo || '' },
  { key: 'cliente',     label: 'Cliente',         get: q => q.cliente?.nombre || '' },
  { key: 'empresa',     label: 'Empresa cliente', get: q => q.cliente?.empresa || '' },
  { key: 'email',       label: 'Email cliente',   get: q => q.cliente?.email || '' },
  { key: 'estado',      label: 'Estado',          get: q => q.estado || '' },
  { key: 'total',       label: 'Total',           get: q => fmtCur(qTotal(q)) },
  { key: 'vendedor',    label: 'Vendedor',        get: q => q.vendedor || '' },
  { key: 'createdAt',   label: 'Fecha',           get: q => fmtDate(q.createdAt) },
  { key: 'validezDias', label: 'Validez (días)',  get: q => String(q.validezDias ?? '') },
]

const TIPO_LABEL = { llamada: 'Llamada', reunion: 'Reunión', correo: 'Correo', nota: 'Nota' }
const ACTIVITY_FIELDS = [
  { key: 'tipo',            label: 'Tipo',              get: a => TIPO_LABEL[a.tipo] || a.tipo },
  { key: 'titulo',          label: 'Título',            get: a => a.titulo || '' },
  { key: 'descripcion',     label: 'Descripción',       get: a => a.descripcion || '' },
  { key: 'clienteNombre',   label: 'Cliente',           get: a => a.clienteNombre || '' },
  { key: 'fechaProgramada', label: 'Fecha programada',  get: a => fmtDate(a.fechaProgramada) },
  { key: 'completada',      label: 'Estado',            get: a => a.completada ? 'Completada' : 'Pendiente' },
  { key: 'realizadoPor',    label: 'Realizado por',     get: a => a.realizadoPor || '' },
  { key: 'createdAt',       label: 'Fecha de registro', get: a => fmtDate(a.createdAt) },
]

// ── State ──────────────────────────────────────────────────────────────────
const inc            = ref({ clientes: false, cotizaciones: false, actividades: false, pipeline: false })
const clientFields   = ref(CLIENT_FIELDS.map(f => f.key))
const quoteFields    = ref(QUOTE_FIELDS.map(f => f.key))
const activityFields = ref(ACTIVITY_FIELDS.map(f => f.key))
const dateFrom       = ref('')
const dateTo         = ref('')
const filters = ref({
  clientEstado: '', clientTipo: '', clientStage: '',
  quoteEstado: '',
  actTipo: '', actCompletada: '',
})

// ── Date helper ────────────────────────────────────────────────────────────
function inRange(dateStr) {
  if (!dateFrom.value && !dateTo.value) return true
  const d = new Date(dateStr)
  if (isNaN(d)) return true
  if (dateFrom.value && d < new Date(dateFrom.value)) return false
  if (dateTo.value   && d > new Date(dateTo.value + 'T23:59:59')) return false
  return true
}

// ── Client picker state ────────────────────────────────────────────────────
const clientPickerActive = ref(false)
const clientPickerSearch = ref('')
const selectedClientIds  = ref([])

// ── Filtered datasets ──────────────────────────────────────────────────────
const preFilteredClients = computed(() => {
  let list = crmStore.visibleClients
  const f = filters.value
  if (f.clientEstado) list = list.filter(c => c.estado === f.clientEstado)
  if (f.clientTipo)   list = list.filter(c => c.tipoCliente === f.clientTipo)
  if (f.clientStage)  list = list.filter(c => c.pipelineEstado === f.clientStage)
  return list.filter(c => inRange(c.createdAt))
})

const pickerClients = computed(() => {
  const q = clientPickerSearch.value.trim().toLowerCase()
  if (!q) return preFilteredClients.value
  return preFilteredClients.value.filter(c =>
    (c.razonSocial || c.name || '').toLowerCase().includes(q) ||
    (c.nombreComercial || '').toLowerCase().includes(q) ||
    (c.contactoPrincipal || '').toLowerCase().includes(q)
  )
})

const filteredClients = computed(() => {
  if (!clientPickerActive.value || !selectedClientIds.value.length) {
    return preFilteredClients.value
  }
  const ids = new Set(selectedClientIds.value)
  return preFilteredClients.value.filter(c => ids.has(c._id))
})

function toggleClientPicker() {
  clientPickerActive.value = !clientPickerActive.value
  if (clientPickerActive.value) {
    selectedClientIds.value = preFilteredClients.value.map(c => c._id)
  } else {
    selectedClientIds.value = []
    clientPickerSearch.value = ''
  }
}
function selectAllClients() { selectedClientIds.value = preFilteredClients.value.map(c => c._id) }

const filteredQuotes = computed(() => {
  let list = props.quotes
  if (filters.value.quoteEstado) list = list.filter(q => q.estado === filters.value.quoteEstado)
  return list.filter(q => inRange(q.createdAt))
})

const filteredActivities = computed(() => {
  let list = crmStore.activities
  const f = filters.value
  if (f.actTipo) list = list.filter(a => a.tipo === f.actTipo)
  if (f.actCompletada !== '') {
    const v = f.actCompletada === 'true'
    list = list.filter(a => a.completada === v)
  }
  return list.filter(a => inRange(a.createdAt))
})

const totalRows = computed(() => {
  let n = 0
  if (inc.value.clientes     && clientFields.value.length)   n += filteredClients.value.length
  if (inc.value.cotizaciones && quoteFields.value.length)    n += filteredQuotes.value.length
  if (inc.value.actividades  && activityFields.value.length) n += filteredActivities.value.length
  if (inc.value.pipeline) n += STAGES.length
  return n
})

function stageCount(key) { return (crmStore.clientsByStage[key] || []).length }

// ── HTML builder ───────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildTable(title, allFields, selectedKeys, rows) {
  if (!rows.length || !selectedKeys.length) return ''
  const cols = allFields.filter(f => selectedKeys.includes(f.key))
  const thead = cols.map(f => `<th>${esc(f.label)}</th>`).join('')
  const tbody = rows.map((row, ri) => {
    const bg = ri % 2 === 1 ? ' style="background:#f6f8f3"' : ''
    return `<tr${bg}>${cols.map(f => `<td>${esc(f.get(row))}</td>`).join('')}</tr>`
  }).join('')
  return `
<h3 class="sec-title">${esc(title)}</h3>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${tbody}</tbody>
</table>`
}

function buildPipeline() {
  if (!inc.value.pipeline) return ''
  const rows = STAGES.map((s, i) => {
    const bg = i % 2 === 1 ? ' style="background:#f6f8f3"' : ''
    return `<tr${bg}><td>${esc(s.label)}</td><td style="text-align:center;font-weight:700;color:${s.color}">${stageCount(s.key)}</td></tr>`
  }).join('')
  return `
<h3 class="sec-title">Resumen Pipeline</h3>
<table>
  <thead><tr><th>Etapa</th><th>Clientes</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`
}

function buildHtml(forPrint) {
  const now = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  let body = ''
  if (inc.value.clientes)     body += buildTable('Clientes', CLIENT_FIELDS, clientFields.value, filteredClients.value)
  if (inc.value.cotizaciones) body += buildTable('Cotizaciones', QUOTE_FIELDS, quoteFields.value, filteredQuotes.value)
  if (inc.value.actividades)  body += buildTable('Actividades', ACTIVITY_FIELDS, activityFields.value, filteredActivities.value)
  body += buildPipeline()

  const printCss = forPrint ? `
    @media print { @page { margin: 1.5cm; size: landscape; } }
    body { padding: 0; }` : ''

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<title>Reporte CRM</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 1.5cm; }
  .report-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #6b8e3a; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
  .report-header h1 { margin: 0; font-size: 1.4rem; color: #3a4023; }
  .report-header p  { margin: 0; font-size: 0.75rem; color: #888; }
  .sec-title { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b8e3a; margin: 1.5rem 0 0.4rem; border-bottom: 1px solid #d4e0b8; padding-bottom: 0.2rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 0.5rem; }
  thead tr { background: #6b8e3a; color: #fff; }
  thead th { padding: 0.5rem 0.6rem; text-align: left; font-weight: 600; }
  tbody td { padding: 0.4rem 0.6rem; border-bottom: 1px solid #e8eed8; }
  ${printCss}
</style>
</head><body>
<div class="report-header">
  <h1>Reporte CRM</h1>
  <p>Generado el ${now}</p>
</div>
${body}
</body></html>`
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportExcel() {
  const html = buildHtml(false)
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `reporte-crm-${new Date().toISOString().slice(0, 10)}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportPDF() {
  const html = buildHtml(true)
  const win  = window.open('', '_blank', 'width=1024,height=768')
  if (!win) { alert('Permitir ventanas emergentes para descargar el PDF'); return }
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => { win.focus(); win.print() })
}
</script>

<style scoped>
.rb-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  z-index: 3000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.rb-modal {
  background: #fff;
  border-radius: 20px;
  width: min(720px, 100%);
  max-height: calc(100vh - 3rem);
  height: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 80px rgba(0,0,0,.25);
  overflow: hidden;
  margin: auto 0;
  align-self: flex-start;
}

/* ── Header ── */
.rb-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem 1rem;
  border-bottom: 1px solid rgba(107,142,58,.12);
  flex-shrink: 0;
  gap: 0.75rem;
}

.rb-hd-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rb-hd-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: rgba(107,142,58,.12);
  color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.rb-hd h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.rb-hd p {
  font-size: 0.72rem;
  color: var(--color-muted);
  margin: 0.1rem 0 0;
  text-transform: none;
  letter-spacing: 0;
}

.rb-close {
  width: 32px; height: 32px;
  border-radius: 9px;
  background: rgba(107,142,58,.1);
  color: var(--color-text);
  padding: 0; font-size: 0.8rem; box-shadow: none;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ── Body ── */
.rb-body {
  flex: 1;
  min-height: 0;          /* key: lets flex child shrink so overflow-y kicks in */
  overflow-y: auto;
  padding: 1rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.rb-body::-webkit-scrollbar { width: 4px; }
.rb-body::-webkit-scrollbar-thumb { background: rgba(107,142,58,.25); border-radius: 2px; }

/* ── Date row ── */
.rb-date-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(107,142,58,.05);
  border: 1px solid rgba(107,142,58,.12);
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
}

.rb-date-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  white-space: nowrap;
}

.rb-date-input {
  padding: 0.3rem 0.55rem;
  border-radius: 7px;
  font-size: 0.78rem;
  flex: 1;
  min-width: 0;
}

.rb-date-sep { color: var(--color-muted); font-size: 0.8rem; }

.rb-date-clear {
  width: 24px; height: 24px;
  border-radius: 6px;
  background: rgba(239,68,68,.1);
  color: #ef4444;
  padding: 0; font-size: 0.8rem; box-shadow: none;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ── Section ── */
.rb-section {
  border: 1.5px solid rgba(107,142,58,.12);
  border-radius: 12px;
  transition: border-color 0.18s;
}

.rb-section--on { border-color: rgba(107,142,58,.3); }

.rb-sec-hd {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.9rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  border-radius: 10px;        /* round all corners when section is closed */
}

.rb-sec-hd:hover { background: rgba(107,142,58,.04); border-radius: 10px; }

/* when open, only top corners round so body connects seamlessly */
.rb-section--on .rb-sec-hd {
  background: rgba(107,142,58,.06);
  border-radius: 10px 10px 0 0;
}

.rb-sec-toggle input[type="checkbox"] {
  width: 15px; height: 15px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.rb-sec-title {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rb-sec-cnt {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(107,142,58,.08);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
}

.rb-chevron {
  color: var(--color-muted);
  font-size: 0.75rem;
  flex-shrink: 0;
}

/* ── Section body ── */
.rb-sec-body {
  border-top: 1px solid rgba(107,142,58,.1);
  padding: 0.85rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rb-fields-block, .rb-filters-block { display: flex; flex-direction: column; gap: 0.4rem; }

.rb-fields-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rb-fields-title {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-muted);
  flex: 1;
}

.rb-fields-bar button {
  font-size: 0.62rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: rgba(107,142,58,.09);
  color: var(--color-primary);
  box-shadow: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  height: auto;
  line-height: 1.5;
}

.rb-fields-bar button:hover { background: rgba(107,142,58,.18); transform: none; }

.rb-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.3rem 0.75rem;
}

.rb-field-lbl {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  color: var(--color-text);
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  padding: 0.15rem 0;
}

.rb-field-lbl input[type="checkbox"] {
  width: 13px; height: 13px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.rb-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rb-filter-row select {
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.78rem;
  flex: 1;
  min-width: 140px;
}

/* ── Pipeline preview ── */
.rb-pipeline-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.6rem;
}

.rb-pipe-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(107,142,58,.05);
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  font-size: 0.76rem;
}

.rb-pipe-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rb-pipe-name { color: var(--color-text); text-transform: none; letter-spacing: 0; }

.rb-pipe-n {
  font-weight: 700;
  font-size: 0.85rem;
  margin-left: 0.25rem;
  font-family: 'Poppins', sans-serif;
  text-transform: none;
}

/* ── Footer ── */
.rb-ft {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.9rem 1.4rem 1rem;
  border-top: 1px solid rgba(107,142,58,.1);
  flex-shrink: 0;
  background: #fff;
}

.rb-ft-info {
  flex: 1;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rb-excel-btn {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  background: #217346;
  color: #fff;
  box-shadow: 0 2px 8px rgba(33,115,70,.25);
  display: flex; align-items: center; gap: 0.4rem;
}

.rb-excel-btn:hover:not(:disabled) { background: #185f39; transform: translateY(-1px); }
.rb-excel-btn:disabled { opacity: 0.4; cursor: default; }

.rb-pdf-btn {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  background: #c0392b;
  color: #fff;
  box-shadow: 0 2px 8px rgba(192,57,43,.25);
  display: flex; align-items: center; gap: 0.4rem;
}

.rb-pdf-btn:hover:not(:disabled) { background: #a93226; transform: translateY(-1px); }
.rb-pdf-btn:disabled { opacity: 0.4; cursor: default; }

/* ── Client picker ── */
.rb-picker-block { display: flex; flex-direction: column; gap: 0.45rem; }

.rb-picker-badge {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.6rem;
  font-weight: 700;
  background: rgba(107,142,58,.12);
  color: var(--color-primary);
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  vertical-align: middle;
  letter-spacing: 0.03em;
}

.rb-selall--active {
  background: rgba(107,142,58,.18) !important;
  color: var(--color-primary) !important;
  border: 1px solid rgba(107,142,58,.35) !important;
}

.rb-client-picker {
  border: 1.5px solid rgba(107,142,58,.18);
  border-radius: 10px;
}

.rb-picker-searchbar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(107,142,58,.1);
  background: rgba(107,142,58,.04);
  border-radius: 8px 8px 0 0;
}

.rb-picker-searchbar i { color: var(--color-muted); font-size: 0.8rem; flex-shrink: 0; }

.rb-picker-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  font-size: 0.8rem;
  outline: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  min-width: 0;
}

.rb-picker-clear {
  width: 20px; height: 20px;
  border-radius: 5px;
  padding: 0; font-size: 0.75rem; box-shadow: none;
  background: rgba(239,68,68,.1); color: #ef4444;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.rb-picker-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.65rem;
  border-bottom: 1px solid rgba(107,142,58,.08);
  background: rgba(107,142,58,.02);
  flex-wrap: wrap;
}

.rb-picker-actions button {
  font-size: 0.62rem;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
  background: rgba(107,142,58,.09);
  color: var(--color-primary);
  box-shadow: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  line-height: 1.5;
  height: auto;
}

.rb-picker-actions button:hover { background: rgba(107,142,58,.18); transform: none; }

.rb-picker-count {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.rb-client-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.3rem;
}

.rb-client-list::-webkit-scrollbar { width: 3px; }
.rb-client-list::-webkit-scrollbar-thumb { background: rgba(107,142,58,.25); border-radius: 2px; }

.rb-picker-empty {
  text-align: center;
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rb-client-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  border-radius: 7px;
  cursor: pointer;
  text-transform: none;
  letter-spacing: 0;
  transition: background 0.12s;
  min-height: 36px;
}

.rb-client-item:hover { background: rgba(107,142,58,.07); }

.rb-client-item input[type="checkbox"] {
  width: 14px; height: 14px;
  accent-color: var(--color-primary);
  flex-shrink: 0;
  cursor: pointer;
}

.rb-client-name {
  font-size: 0.78rem;
  color: var(--color-text);
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rb-client-sub {
  font-size: 0.65rem;
  color: var(--color-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .rb-backdrop { padding: 0.75rem 0.5rem; }

  .rb-modal { border-radius: 14px; }

  .rb-hd { padding: 0.85rem 1rem 0.8rem; gap: 0.5rem; }
  .rb-hd-icon { display: none; }
  .rb-hd h2 { font-size: 0.9rem; }

  .rb-body { padding: 0.75rem; gap: 0.5rem; }

  .rb-date-row { flex-wrap: wrap; gap: 0.4rem; }
  .rb-date-label { width: 100%; }
  .rb-date-input { flex: 1; min-width: 120px; }

  .rb-sec-hd { padding: 0.6rem 0.75rem; }
  .rb-sec-body { padding: 0.7rem 0.75rem; }

  .rb-fields-grid { grid-template-columns: repeat(2, 1fr); gap: 0.2rem 0.5rem; }

  .rb-field-lbl { font-size: 0.72rem; min-height: 32px; }

  .rb-filter-row { flex-direction: column; }
  .rb-filter-row select { min-width: 0; width: 100%; }

  .rb-ft { padding: 0.75rem 1rem; flex-wrap: wrap; gap: 0.5rem; }
  .rb-ft-info { flex: none; width: 100%; }
  .rb-excel-btn, .rb-pdf-btn { flex: 1; justify-content: center; }

  .rb-client-list { max-height: 160px; }
}

@media (max-width: 380px) {
  .rb-fields-grid { grid-template-columns: 1fr; }
}
</style>
