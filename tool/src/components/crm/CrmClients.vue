<template>
  <div class="cc-wrap">

    <!-- Toolbar -->
    <div class="cc-toolbar">
      <div class="cc-search-box">
        <i class="bi bi-search cc-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar cliente..." class="cc-search" />
      </div>
      <select v-model="filterEstado" class="cc-select">
        <option value="">Todos</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>
      <select v-model="filterPipeline" class="cc-select">
        <option value="">Todas las etapas</option>
        <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <button class="cc-btn-add" @click="openNew">
        <i class="bi bi-person-plus-fill"></i> Nuevo cliente
      </button>
    </div>

    <!-- Loading -->
    <div v-if="crmStore.loadingClients" class="cc-state">
      <div class="crm-spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="cc-state">
      <i class="bi bi-person-x" style="font-size:2rem;color:var(--color-muted)"></i>
      <p>{{ search || filterEstado || filterPipeline ? 'Sin resultados' : 'No hay clientes registrados' }}</p>
      <button v-if="!search && !filterEstado && !filterPipeline" @click="openNew">
        <i class="bi bi-person-plus-fill"></i> Agregar primer cliente
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="cc-grid">
      <div v-for="c in filtered" :key="c._id" class="cc-card-wrap">
        <!-- Burbuja roja/naranja: potencial sin actividad -->
        <div v-if="c.tipoCliente === 'potencial' && staleDays(c) >= 2"
          class="cc-stale-badge"
          :class="staleDays(c) >= 7 ? 'cc-stale-badge--critical' : 'cc-stale-badge--warn'">
          {{ staleDays(c) }}d
          <span class="cc-stale-tooltip">
            <strong>{{ staleDays(c) }} días sin actividad ni cotización</strong><br>
            <template v-if="staleDays(c) >= 7">⛔ Mañana este cliente se transfiere automáticamente al administrador de ventas.</template>
            <template v-else>⚠️ Registrá una actividad o cotización para evitar la transferencia automática a los 8 días.</template>
          </span>
        </div>
        <!-- Burbuja naranja: cliente sin cotización en 60+ días -->
        <div v-if="showQuoteBubble(c)"
          class="cc-stale-badge cc-stale-badge--quote"
          :style="c.tipoCliente === 'potencial' && staleDays(c) >= 2 ? 'top:0;right:38px' : ''">
          <i class="bi bi-file-earmark-x"></i>
          <span class="cc-stale-tooltip cc-stale-tooltip--quote">
            <strong>Sin cotización hace {{ daysSinceQuote(c) === 9999 ? 'mucho tiempo' : daysSinceQuote(c) + ' días' }}</strong><br>
            🟠 Este cliente no recibe una cotización en más de 60 días. Hacé click en la tarjeta para ver el detalle y generar una nueva.
            <em style="display:block;margin-top:4px;opacity:.75">La alerta se ocultará al abrir la tarjeta y reaparecerá el próximo lunes.</em>
          </span>
        </div>
        <div class="cc-card" :class="{ 'cc-card--potencial': c.tipoCliente === 'potencial' }"
          @click.self="snoozeAndOpen(c)">
        <div class="cc-card-top" @click.self="snoozeAndOpen(c)">
          <div class="cc-avatar" :style="{ background: avatarColor(c.razonSocial || c.name || '') }">
            {{ initials(c.razonSocial || c.name || '?') }}
          </div>
          <div class="cc-card-head">
            <div class="cc-razon">{{ c.razonSocial || c.name || '—' }}</div>
            <div v-if="c.nombreComercial" class="cc-comercial">{{ c.nombreComercial }}</div>
          </div>
          <div class="cc-card-actions">
            <button class="cc-ico-btn cc-ico-btn--edit" @click="openEdit(c)" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button v-if="canManage" class="cc-ico-btn cc-ico-btn--del" @click="confirmDelete(c)" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div class="cc-card-body" @click="snoozeAndOpen(c)">
          <div v-if="c.contactoPrincipal" class="cc-field">
            <i class="bi bi-person"></i><span>{{ c.contactoPrincipal }}</span>
          </div>
          <div v-if="c.cuitCuil" class="cc-field">
            <i class="bi bi-credit-card-2-front"></i><span>{{ c.cuitCuil }}</span>
          </div>
          <template v-if="c.telefonos?.length">
            <div v-for="(t, i) in c.telefonos.slice(0, 2)" :key="i" class="cc-field">
              <i class="bi bi-telephone"></i>
              <span>{{ t.numero }}</span>
              <span class="cc-sector">{{ t.sector }}</span>
            </div>
          </template>
          <div v-else-if="c.telefono" class="cc-field">
            <i class="bi bi-telephone"></i><span>{{ c.telefono }}</span>
          </div>
          <div v-if="c.email" class="cc-field cc-field--trunc">
            <i class="bi bi-envelope"></i><span>{{ c.email }}</span>
          </div>
          <div v-if="c.lugar || c.direccion" class="cc-field cc-field--trunc">
            <i class="bi bi-geo-alt-fill" style="color:#3b82f6"></i>
            <span>{{ c.lugar || c.direccion }}</span>
            <a
              v-if="c.latitud && c.longitud"
              :href="`https://www.openstreetmap.org/?mlat=${c.latitud}&mlon=${c.longitud}&zoom=16`"
              target="_blank" rel="noopener" class="cc-map-link" title="Ver en mapa">
              <i class="bi bi-map-fill"></i>
            </a>
          </div>
        </div>

        <div class="cc-card-foot">
          <span class="cc-tipo" :class="`cc-tipo--${c.tipoCliente || 'potencial'}`">
            <i :class="c.tipoCliente === 'normal' ? 'bi bi-person-check-fill' : 'bi bi-star-fill'"></i>
            {{ c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
          </span>
          <span class="cc-badge" :class="`cc-badge--${c.estado || 'activo'}`">
            {{ c.estado || 'activo' }}
          </span>
          <span v-if="c.pipelineEstado" class="cc-stage"
            :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
            {{ stageLabel(c.pipelineEstado) }}
          </span>
        </div>
        </div><!-- /.cc-card -->
      </div><!-- /.cc-card-wrap -->
    </div>

    <!-- ── Modal add/edit ── -->
    <Teleport to="body">
      <div v-if="showModal" class="crm-backdrop" @click.self="closeModal">
        <div class="crm-modal">
          <div class="crm-modal-hd">
            <h2>{{ editing ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
            <button class="crm-close" @click="closeModal"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="crm-modal-bd">
            <div class="cm-field">
              <label>Razón social *</label>
              <input v-model="form.razonSocial" placeholder="Ej: Distribuidora ABC S.A."
                maxlength="100" />
            </div>
            <div class="cm-field">
              <label>Nombre comercial</label>
              <input v-model="form.nombreComercial" placeholder="Ej: ABC Distribuidora"
                maxlength="100" />
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Contacto principal</label>
                <input v-model="form.contactoPrincipal" placeholder="Nombre del contacto"
                  maxlength="100" />
              </div>
              <div class="cm-field">
                <label>CUIL / CUIT</label>
                <input v-model="form.cuitCuil" placeholder="20-12345678-9"
                  maxlength="13"
                  @input="form.cuitCuil = form.cuitCuil.replace(/[^\d-]/g, '').slice(0, 13)" />
              </div>
            </div>
            <!-- ── Teléfonos múltiples ── -->
            <div class="cm-field">
              <label>Teléfonos</label>
              <div class="cm-phones">
                <div v-for="(t, i) in form.telefonos" :key="i" class="cm-phone-row">
                  <select v-model="t.sector" class="cm-phone-sector">
                    <option v-for="s in SECTORES" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <input v-model="t.numero" type="tel" placeholder="+54 351 555-0000"
                    class="cm-phone-num" maxlength="20"
                    @input="t.numero = t.numero.replace(/[^\d\s\+\-\(\)]/g, '').slice(0, 20)" />
                  <button type="button" class="cm-phone-del" :disabled="form.telefonos.length === 1"
                    @click="form.telefonos.splice(i, 1)" title="Quitar">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <button type="button" class="cm-phone-add" @click="form.telefonos.push({ numero: '', sector: 'General' })">
                  <i class="bi bi-plus-circle"></i> Agregar teléfono
                </button>
              </div>
            </div>
            <div class="cm-field">
              <label>Email</label>
              <input v-model="form.email" placeholder="contacto@empresa.com" type="email"
                maxlength="100" />
            </div>
            <div class="cm-row">
              <div class="cm-field">
                <label>Estado</label>
                <select v-model="form.estado">
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div class="cm-field">
                <label>Etapa en pipeline</label>
                <select v-model="form.pipelineEstado">
                  <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="cm-field">
              <label>Observaciones</label>
              <input v-model="form.observaciones" placeholder="Notas sobre el cliente" maxlength="300" />
            </div>

            <!-- ── Tipo de cliente ── -->
            <div class="cm-field">
              <label>Tipo de cliente</label>
              <div v-if="canManage" class="cm-tipo-row">
                <button type="button"
                  :class="['cm-tipo-opt', { 'cm-tipo-opt--sel cm-tipo-opt--pot': form.tipoCliente === 'potencial' }]"
                  @click="form.tipoCliente = 'potencial'">
                  <i class="bi bi-star-fill"></i> Potencial
                </button>
                <button type="button"
                  :class="['cm-tipo-opt', { 'cm-tipo-opt--sel cm-tipo-opt--cli': form.tipoCliente === 'normal' }]"
                  @click="form.tipoCliente = 'normal'">
                  <i class="bi bi-person-check-fill"></i> Cliente
                </button>
              </div>
              <div v-else class="cm-tipo-display">
                <span :class="form.tipoCliente === 'potencial' ? 'cm-tipo-opt--pot' : 'cm-tipo-opt--cli'">
                  <i :class="form.tipoCliente === 'potencial' ? 'bi bi-star-fill' : 'bi bi-person-check-fill'"></i>
                  {{ form.tipoCliente === 'potencial' ? 'Potencial' : 'Cliente' }}
                </span>
              </div>
              <p class="cm-tipo-hint">
                Se convierte automáticamente a <strong>Cliente</strong> cuando una cotización asociada pasa a <em>Ganada</em>.
              </p>
            </div>

            <!-- ── Ubicación ── -->
            <div class="cm-section-title">
              <i class="bi bi-geo-alt-fill"></i> Ubicación
            </div>

            <div class="cm-field">
              <label>Dirección</label>
              <input v-model="form.direccion" placeholder="Calle 123, Ciudad, Provincia" maxlength="200" />
            </div>

            <div class="cm-map-actions">
              <button type="button" class="secondary-button cm-map-btn"
                :disabled="geocoding" @click="geocodeAddress">
                <i class="bi bi-search"></i>
                {{ geocoding ? 'Buscando...' : 'Buscar en mapa' }}
              </button>
              <button type="button" class="secondary-button cm-map-btn"
                :disabled="geocoding" @click="useMyLocation">
                <i class="bi bi-crosshair"></i>
                Mi ubicación
              </button>
              <button v-if="form.latitud" type="button" class="secondary-button cm-map-btn cm-map-btn--clear"
                @click="clearLocation">
                <i class="bi bi-x-circle"></i> Quitar
              </button>
            </div>

            <p v-if="geoError" class="cm-geo-error">{{ geoError }}</p>

            <!-- Map preview (iframe OpenStreetMap, sin dependencias) -->
            <div v-if="form.latitud && form.longitud" class="cm-map-preview">
              <iframe
                :src="`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitud-0.006},${form.latitud-0.006},${form.longitud+0.006},${form.latitud+0.006}&layer=mapnik&marker=${form.latitud},${form.longitud}`"
                class="cm-map-iframe"
                frameborder="0"
                loading="lazy"
                title="Mapa de ubicación"
              ></iframe>
              <div class="cm-map-coords">
                <i class="bi bi-geo-alt-fill" style="color:#3b82f6"></i>
                {{ Number(form.latitud).toFixed(5) }}, {{ Number(form.longitud).toFixed(5) }}
                <a :href="`https://www.openstreetmap.org/?mlat=${form.latitud}&mlon=${form.longitud}&zoom=16`"
                  target="_blank" rel="noopener" class="cm-map-open">
                  <i class="bi bi-box-arrow-up-right"></i> Abrir mapa
                </a>
              </div>
              <div v-if="form.lugar" class="cm-map-lugar">{{ form.lugar }}</div>
            </div>

            <p v-if="formError" class="cm-error">{{ formError }}</p>
          </div>

          <div class="crm-modal-ft">
            <button class="secondary-button" @click="closeModal">Cancelar</button>
            <button :disabled="saving" @click="saveClient">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>{{ editing ? 'Guardar cambios' : 'Crear cliente' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Delete confirm ── -->
    <Teleport to="body">
      <div v-if="deleting" class="crm-backdrop" @click.self="deleting = null">
        <div class="crm-modal crm-modal--sm">
          <div class="crm-modal-hd">
            <h2>Eliminar cliente</h2>
            <button class="crm-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crm-modal-bd">
            <p class="del-txt">
              ¿Eliminás a <strong>{{ deleting.razonSocial || deleting.name }}</strong>?
            </p>
          </div>
          <div class="crm-modal-ft">
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
import { ref, computed, onMounted } from 'vue'
import { useCrmStore } from '@/stores/crm'
import { usePermissions } from '@/utils/permissions'

const { canManage } = usePermissions()

const props = defineProps({ pendingEdit: { type: Object, default: null } })

onMounted(() => { if (props.pendingEdit) openEdit(props.pendingEdit) })

const crmStore = useCrmStore()

const search         = ref('')
const filterEstado   = ref('')
const filterPipeline = ref('')
const showModal      = ref(false)
const editing        = ref(null)
const saving         = ref(false)
const formError      = ref('')
const deleting       = ref(null)
const geocoding      = ref(false)
const geoError       = ref('')

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevos Clientes',  color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',  color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',    color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',      color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',     color: '#ef4444' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
function stageLabel(key) { return STAGE_MAP[key]?.label || key }
function stageColor(key) { return STAGE_MAP[key]?.color || '#6b8e3a' }

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#6366f1','#22c55e','#ec4899','#6b8e3a','#ef4444']
function avatarColor(name) {
  let n = 0; for (const c of name) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

const SECTORES = ['General', 'Compras', 'Ventas', 'Facturación', 'Administración', 'Logística', 'Gerencia', 'Soporte']

const emptyForm = () => ({
  razonSocial: '', nombreComercial: '', contactoPrincipal: '',
  cuitCuil: '', telefonos: [{ numero: '', sector: 'General' }],
  email: '', direccion: '', observaciones: '',
  estado: 'activo', pipelineEstado: 'nuevo_lead',
  tipoCliente: 'potencial',
  lugar: '', latitud: null, longitud: null,
})

const form = ref(emptyForm())

const filtered = computed(() => {
  let list = crmStore.visibleClients
  if (filterEstado.value)   list = list.filter(c => c.estado === filterEstado.value)
  if (filterPipeline.value) list = list.filter(c => c.pipelineEstado === filterPipeline.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c =>
      rx.test(c.razonSocial) || rx.test(c.nombreComercial) ||
      rx.test(c.contactoPrincipal) || rx.test(c.email) ||
      rx.test(c.telefono) || rx.test(c.name) ||
      (c.telefonos || []).some(t => rx.test(t.numero))
    )
  }
  return list
})

function openNew() {
  editing.value = null
  form.value = emptyForm()
  formError.value = ''
  geoError.value = ''
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    razonSocial:      c.razonSocial || c.name || '',
    nombreComercial:  c.nombreComercial || c.company || '',
    contactoPrincipal: c.contactoPrincipal || '',
    cuitCuil:         c.cuitCuil || '',
    telefonos:        c.telefonos?.length
      ? c.telefonos.map(t => ({ numero: t.numero || '', sector: t.sector || 'General' }))
      : (c.telefono ? [{ numero: c.telefono, sector: 'General' }] : [{ numero: '', sector: 'General' }]),
    email:            c.email || '',
    direccion:        c.direccion || '',
    observaciones:    c.observaciones || '',
    estado:           c.estado || 'activo',
    pipelineEstado:   c.pipelineEstado || 'nuevo_lead',
    tipoCliente:      c.tipoCliente || 'potencial',
    lugar:            c.lugar || '',
    latitud:          c.latitud ?? null,
    longitud:         c.longitud ?? null,
  }
  formError.value = ''
  geoError.value = ''
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function saveClient() {
  formError.value = ''
  if (!form.value.razonSocial.trim()) {
    formError.value = 'La razón social es obligatoria'
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await crmStore.updateClient(editing.value._id, { ...form.value })
    } else {
      await crmStore.createClient({ ...form.value })
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

function confirmDelete(c) { deleting.value = c }

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await crmStore.deleteClient(deleting.value._id)
    deleting.value = null
  } finally {
    saving.value = false
  }
}

// ── Geocodificación con Nominatim (OpenStreetMap, sin API key) ──
async function geocodeAddress() {
  const addr = form.value.direccion.trim()
  if (!addr) { geoError.value = 'Escribí una dirección primero'; return }
  geocoding.value = true
  geoError.value = ''
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'es' } }
    )
    const data = await res.json()
    if (!data.length) { geoError.value = 'No se encontró esa dirección'; return }
    form.value.latitud  = parseFloat(data[0].lat)
    form.value.longitud = parseFloat(data[0].lon)
    form.value.lugar    = data[0].display_name || addr
  } catch {
    geoError.value = 'Error al buscar en el mapa'
  } finally {
    geocoding.value = false
  }
}

function useMyLocation() {
  if (!navigator.geolocation) { geoError.value = 'El navegador no soporta geolocalización'; return }
  geocoding.value = true
  geoError.value = ''
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      form.value.latitud  = pos.coords.latitude
      form.value.longitud = pos.coords.longitude
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
          { headers: { 'Accept-Language': 'es' } }
        )
        const data = await res.json()
        form.value.lugar = data.display_name || ''
        if (!form.value.direccion.trim()) form.value.direccion = data.display_name || ''
      } catch { /* reverse geocoding opcional */ }
      geocoding.value = false
    },
    (err) => {
      geoError.value = 'No se pudo obtener la ubicación'
      console.warn('Geolocation error:', err.message)
      geocoding.value = false
    },
    { timeout: 10000, enableHighAccuracy: true }
  )
}

function clearLocation() {
  form.value.latitud  = null
  form.value.longitud = null
  form.value.lugar    = ''
}

function staleDays(client) {
  if (client.tipoCliente !== 'potencial') return 0
  // Una cotización también cuenta como contacto y resetea el contador
  const candidates = [client.lastActivityAt, client.lastQuoteAt, client.createdAt]
    .filter(Boolean).map(d => new Date(d).getTime())
  if (!candidates.length) return 0
  const mostRecent = Math.max(...candidates)
  return Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24))
}

// ── Burbuja naranja: clientes sin cotización en 60+ días ──

const SNOOZE_KEY = 'cc_quote_snooze'

function loadSnooze() {
  try { return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}') } catch { return {} }
}

function nextMonday(ts) {
  const d = new Date(ts)
  const day = d.getDay() // 0=dom, 1=lun...
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7
  d.setDate(d.getDate() + daysUntilMonday)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function daysSinceQuote(client) {
  if (client.tipoCliente !== 'normal') return 0
  const base = client.lastQuoteAt || null
  if (!base) return 9999 // nunca tuvo cotización → siempre cuenta
  return Math.floor((Date.now() - new Date(base).getTime()) / (1000 * 60 * 60 * 24))
}

function showQuoteBubble(client) {
  if (daysSinceQuote(client) < 60) return false
  const snooze = loadSnooze()
  const snoozeUntil = snooze[client._id]
  if (!snoozeUntil) return true
  return Date.now() >= snoozeUntil
}

function snoozeAndOpen(client) {
  const snooze = loadSnooze()
  snooze[client._id] = nextMonday(Date.now())
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snooze))
  openEdit(client)
}
</script>

<style scoped>
.cc-wrap { position: relative; min-width: 0; overflow: hidden; }

/* ── Card wrapper (necesario para que la burbuja salga encima del overflow:hidden del card) ── */
.cc-card-wrap {
  position: relative;
  /* padding superior para que la burbuja no empuje el contenido */
  padding-top: 8px;
}

/* ── Stale alert bubble ── */
.cc-stale-badge {
  position: absolute;
  top: 0;
  right: 4px;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0 6px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
  cursor: default;
}
.cc-stale-badge--warn     { background: #f59e0b; color: #fff; }
.cc-stale-badge--critical { background: #ef4444; color: #fff; animation: cc-pulse 1.6s ease-in-out infinite; }
.cc-stale-badge--quote    { background: #f97316; color: #fff; font-size: 0.75rem; gap: 3px; }

@keyframes cc-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.18); }
}

/* Card body clickeable */
.cc-card-body { cursor: pointer; }
.cc-card-body:hover { background: rgba(107,142,58,.03); }

/* Tooltip de la burbuja — siempre abre hacia abajo-izquierda desde el badge */
.cc-stale-tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: auto;
  width: min(230px, calc(100vw - 24px));
  background: #1e293b;
  color: #f1f5f9;
  font-size: 0.72rem;
  font-weight: 400;
  line-height: 1.5;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
  white-space: normal;
  pointer-events: none;
  z-index: 100;
}
.cc-stale-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 8px;
  left: auto;
  border: 5px solid transparent;
  border-bottom-color: #1e293b;
}
.cc-stale-badge:hover .cc-stale-tooltip { display: block; }

/* El tooltip de cotización también abre a la izquierda — sin override de left */
.cc-stale-tooltip--quote {
  right: 0;
  left: auto;
}
.cc-stale-tooltip--quote::before {
  right: 8px;
  left: auto;
}

/* ── Toolbar ── */
.cc-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 1rem;
}

.cc-search-box { position: relative; flex: 1; min-width: 150px; }

.cc-search-ico {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.cc-search {
  width: 100%;
  padding: 0.55rem 0.9rem 0.55rem 2.1rem;
  border-radius: 10px;
  font-size: 0.82rem;
}

.cc-select {
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  font-size: 0.8rem;
  width: auto;
  min-width: 130px;
}

.cc-btn-add {
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── State: loading / empty ── */
.cc-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 180px;
  color: var(--color-muted);
}

.cc-state p { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Grid ── */
.cc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .cc-grid { grid-template-columns: 1fr; gap: 0.6rem; }
}

/* ── Card ── */
.cc-card {
  background: rgba(255,255,255,.96);
  border-radius: 14px;
  border: 1px solid rgba(107,142,58,.1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(42,53,32,.07);
  overflow: hidden;
  transition: box-shadow 0.18s, transform 0.18s;
  min-width: 0;
}

.cc-card:hover { box-shadow: 0 5px 18px rgba(42,53,32,.13); transform: translateY(-2px); }

.cc-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.75rem 0.35rem;
}

.cc-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.85rem; font-weight: 700;
  flex-shrink: 0; text-transform: uppercase;
}

.cc-card-head { flex: 1; min-width: 0; }

.cc-razon {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: none;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
}

.cc-comercial {
  font-size: 0.7rem;
  color: var(--color-muted);
  text-transform: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-card-actions { display: flex; gap: 0.2rem; flex-shrink: 0; }

.cc-ico-btn {
  width: 26px; height: 26px;
  border-radius: 7px;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
  box-shadow: none;
}

.cc-ico-btn--edit { background: rgba(107,142,58,.1); color: var(--color-primary); }
.cc-ico-btn--edit:hover { background: rgba(107,142,58,.2); }
.cc-ico-btn--del  { background: rgba(239,68,68,.1); color: #ef4444; }
.cc-ico-btn--del:hover { background: rgba(239,68,68,.2); }

.cc-card-body {
  flex: 1;
  padding: 0.3rem 0.75rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cc-field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-text);
  text-transform: none;
  min-width: 0;
}

.cc-field i { color: var(--color-muted); font-size: 0.75rem; flex-shrink: 0; }
.cc-field span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .cc-field span { white-space: normal; word-break: break-word; overflow: visible; }
  .cc-card-foot  { flex-wrap: wrap; }
}

.cc-sector {
  flex-shrink: 0;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(107,142,58,.1);
  color: var(--color-primary);
  white-space: nowrap;
}

.cc-map-link {
  color: #3b82f6;
  font-size: 0.75rem;
  text-decoration: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.cc-map-link:hover { color: #2563eb; }

.cc-card-foot {
  padding: 0.45rem 0.75rem;
  border-top: 1px solid rgba(107,142,58,.08);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}

/* ── Tipo badge en card ── */
.cc-tipo {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.cc-tipo--potencial { background: rgba(245,158,11,.12); color: #b45309; }
.cc-tipo--normal    { background: rgba(34,197,94,.12);  color: #16a34a; }

.cc-badge {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
}

.cc-badge--activo   { background: rgba(107,142,58,.1);  color: var(--color-primary); }
.cc-badge--inactivo { background: rgba(239,68,68,.12); color: #dc2626; }

.cc-stage {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 0.18rem 0.55rem;
  border-radius: 999px;
  text-transform: none;
}

/* ── Tipo toggle en formulario ── */
.cm-tipo-row {
  display: flex;
  gap: 0.5rem;
}

.cm-tipo-opt {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: rgba(107,142,58,.07);
  color: var(--color-muted);
  border: 2px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: none;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cm-tipo-opt:hover:not(.cm-tipo-opt--sel) {
  background: rgba(107,142,58,.13);
  color: var(--color-text);
  transform: none;
}

.cm-tipo-opt--pot {
  background: rgba(245,158,11,.12);
  color: #b45309;
  border-color: rgba(245,158,11,.35);
}

.cm-tipo-opt--cli {
  background: rgba(34,197,94,.12);
  color: #16a34a;
  border-color: rgba(34,197,94,.35);
}

.cm-tipo-hint {
  font-size: 0.68rem;
  color: var(--color-muted);
  text-transform: none;
  letter-spacing: 0;
  line-height: 1.4;
  margin-top: 0.3rem;
  font-style: italic;
}

/* ── Modal ── */
.crm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.crm-modal {
  background: #fff;
  border-radius: 20px;
  width: min(560px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,.22);
  display: flex;
  flex-direction: column;
}

.crm-modal--sm { width: min(380px, 100%); }

.crm-modal-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.85rem;
  border-bottom: 1px solid rgba(107,142,58,.12);
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.crm-modal-hd h2 { font-size: 1rem; text-transform: uppercase; }

.crm-close {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: rgba(107,142,58,.1);
  color: var(--color-text);
  padding: 0; font-size: 0.8rem; box-shadow: none;
}

.crm-modal-bd {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1;
}

.cm-section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(107,142,58,.12);
  margin-top: 0.15rem;
}

.cm-field { display: flex; flex-direction: column; gap: 0.28rem; }

.cm-field label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.cm-field input, .cm-field select, .cm-field textarea {
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  font-size: 0.83rem;
}

.cm-field textarea { min-height: 70px; }

.cm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }

/* ── Multi-phone ── */
.cm-phones { display: flex; flex-direction: column; gap: 0.4rem; }

.cm-phone-row {
  display: grid;
  grid-template-columns: 130px 1fr 28px;
  gap: 0.4rem;
  align-items: center;
}

.cm-phone-sector {
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  font-size: 0.78rem;
  width: 100%;
}

.cm-phone-num {
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  font-size: 0.82rem;
  width: 100%;
}

.cm-phone-del {
  width: 28px; height: 28px;
  border-radius: 7px;
  padding: 0;
  font-size: 0.85rem;
  background: rgba(239,68,68,.1);
  color: #ef4444;
  box-shadow: none;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.cm-phone-del:hover:not(:disabled) { background: rgba(239,68,68,.2); transform: none; }
.cm-phone-del:disabled { opacity: 0.3; cursor: default; }

.cm-phone-add {
  align-self: flex-start;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  background: rgba(107,142,58,.08);
  color: var(--color-primary);
  border-radius: 8px;
  box-shadow: none;
  display: flex; align-items: center; gap: 0.35rem;
  border: 1px dashed rgba(107,142,58,.3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.cm-phone-add:hover { background: rgba(107,142,58,.15); transform: none; }

/* ── Map ── */
.cm-map-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cm-map-btn {
  padding: 0.45rem 0.85rem;
  font-size: 0.78rem;
  border-radius: 8px;
}

.cm-map-btn--clear {
  background: rgba(239,68,68,.1);
  color: #dc2626;
  border-color: rgba(239,68,68,.2);
}

.cm-geo-error {
  font-size: 0.78rem;
  color: #dc2626;
  background: rgba(239,68,68,.08);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  text-transform: none;
  letter-spacing: 0;
}

.cm-map-preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(107,142,58,.15);
}

.cm-map-iframe {
  width: 100%;
  height: 190px;
  display: block;
  border: none;
}

.cm-map-coords {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.72rem;
  color: var(--color-muted);
  text-transform: none;
  background: rgba(107,142,58,.04);
  flex-wrap: wrap;
}

.cm-map-open {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
}

.cm-map-open:hover { text-decoration: underline; }

.cm-map-lugar {
  padding: 0.35rem 0.75rem;
  font-size: 0.7rem;
  color: var(--color-text);
  text-transform: none;
  background: #fff;
  border-top: 1px solid rgba(107,142,58,.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cm-error {
  color: #dc2626;
  font-size: 0.78rem;
  text-transform: none;
  background: rgba(239,68,68,.08);
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  letter-spacing: 0;
}

.crm-modal-ft {
  padding: 0.85rem 1.25rem 1rem;
  border-top: 1px solid rgba(107,142,58,.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  position: sticky;
  bottom: 0;
  background: #fff;
}

.del-txt {
  text-transform: none;
  font-size: 0.88rem;
  color: var(--color-text);
  letter-spacing: 0;
  line-height: 1.5;
}

/* ── Spinners ── */
.crm-spinner {
  width: 28px; height: 28px;
  border: 3px solid rgba(107,142,58,.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-spin {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 560px) {
  .cm-row { grid-template-columns: 1fr; }
  .cc-toolbar { flex-direction: column; align-items: stretch; }
}
</style>
