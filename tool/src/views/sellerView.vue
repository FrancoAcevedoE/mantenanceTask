<template>
  <!-- ── Pantalla principal (oculta al imprimir) ─────────────────────── -->
  <div class="page-container no-print">
    <div class="container">

      <!-- Topbar -->
      <div class="topbar">
        <div class="topbar-left">
          <h2 class="page-title">Cotizaciones</h2>
        </div>
        <div class="topbar-right">
          <button v-if="activeTab === 'list'" class="primary-button" @click="startNew">
            <i class="bi bi-plus-lg"></i> Nueva cotización
          </button>
          <button v-else class="ghost-button" @click="cancelForm">
            <i class="bi bi-arrow-left"></i> Volver al historial
          </button>
        </div>
      </div>

      <!-- ── HISTORIAL ────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'list'">
        <div v-if="loadingQuotes" class="empty-state">Cargando cotizaciones…</div>
        <div v-else-if="!quotes.length" class="empty-state">
          <i class="bi bi-file-earmark-text" style="font-size:2rem; opacity:.35"></i>
          <p>No hay cotizaciones todavía.</p>
        </div>
        <div v-else class="table-scroll">
          <table class="inv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Válida hasta</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quotes" :key="q._id">
                <td class="num-cell">#{{ String(q.numero).padStart(4, '0') }}</td>
                <td class="title-cell">{{ q.titulo }}</td>
                <td class="client-cell">{{ q.cliente?.nombre || '—' }}</td>
                <td class="date-cell">{{ fmtDate(q.createdAt) }}</td>
                <td class="date-cell">{{ validezFecha(q.createdAt, q.validezDias) }}</td>
                <td class="price-cell">{{ fmtMoney(totalCotizacion(q)) }}</td>
                <td>
                  <span :class="['badge-estado', q.estado]">{{ labelEstado(q.estado) }}</span>
                </td>
                <td class="actions-cell">
                  <button class="icon-btn" title="Imprimir" @click="openPrint(q)"><i class="bi bi-printer"></i></button>
                  <button class="icon-btn" title="Editar" @click="editQuote(q)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger" title="Eliminar" @click="confirmDelete(q)"><i class="bi bi-trash3"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── FORMULARIO ───────────────────────────────────────────────── -->
      <div v-if="activeTab === 'form'" class="quote-form">

        <!-- Header del form -->
        <div class="form-section-title">
          {{ editingId ? `Editando cotización #${String(form.numero || '').padStart(4,'0')}` : 'Nueva cotización' }}
        </div>

        <!-- Datos generales -->
        <div class="form-grid-2">
          <div class="field full">
            <label>Título *</label>
            <input v-model="form.titulo" type="text" placeholder="Ej: Cotización revestimiento oficinas" />
          </div>
          <div class="field">
            <label>Fecha</label>
            <input :value="fmtDate(form.fecha)" type="text" disabled class="disabled-input" />
          </div>
          <div class="field">
            <label>Válida por (días)</label>
            <input v-model.number="form.validezDias" type="number" min="1" max="365" />
          </div>
          <div class="field">
            <label>Estado</label>
            <select v-model="form.estado">
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        <!-- Cliente (opcional) -->
        <div class="collapsible-header" @click="showCliente = !showCliente">
          <i :class="showCliente ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          <span>Datos del cliente <em class="optional-tag">(opcional)</em></span>
        </div>
        <div v-if="showCliente" class="form-grid-2 collapsible-body">
          <div class="field">
            <label>Nombre</label>
            <input v-model="form.cliente.nombre" type="text" placeholder="Nombre del contacto" />
          </div>
          <div class="field">
            <label>Empresa</label>
            <input v-model="form.cliente.empresa" type="text" placeholder="Razón social" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="form.cliente.email" type="email" placeholder="correo@ejemplo.com" />
          </div>
          <div class="field">
            <label>Teléfono</label>
            <input v-model="form.cliente.telefono" type="tel" placeholder="+54 11 0000-0000" />
          </div>
        </div>

        <!-- Items -->
        <div class="section-label">Productos / Materiales</div>
        <div class="items-scroll">
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-producto">Producto</th>
                <th class="col-color">Color</th>
                <th class="col-qty">Cant.</th>
                <th class="col-unit">Unidad</th>
                <th class="col-price">Precio unit.</th>
                <th class="col-desc">Descripción</th>
                <th class="col-sub">Subtotal</th>
                <th class="col-del"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx" class="item-row">
                <!-- Selector de producto -->
                <td class="col-producto">
                  <select v-model="item._productId" @change="onProductSelect(idx)" class="sel-producto">
                    <option value="">— Manual —</option>
                    <optgroup v-for="grupo in productGroups" :key="grupo" :label="grupo">
                      <option
                        v-for="p in productsByGrupo[grupo]"
                        :key="p._id"
                        :value="p._id"
                      >{{ p.name }}{{ p.thicknesses?.length ? ' · ' + p.thicknesses.join('/') + 'mm' : '' }} ({{ p.code }})</option>
                    </optgroup>
                  </select>
                  <input
                    v-if="!item._productId"
                    v-model="item.nombre"
                    type="text"
                    placeholder="Nombre del material"
                    class="manual-name"
                  />
                  <span v-else class="item-code">{{ item.codigo }}</span>
                </td>
                <!-- Color -->
                <td class="col-color">
                  <select v-if="item._colors?.length > 1" v-model="item.color" class="sel-color">
                    <option v-for="c in item._colors" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <input v-else v-model="item.color" type="text" placeholder="Color" class="input-color" />
                </td>
                <!-- Cantidad -->
                <td class="col-qty">
                  <input v-model.number="item.cantidad" type="number" min="0" step="0.01" class="input-num" @input="recalc(idx)" />
                </td>
                <!-- Unidad -->
                <td class="col-unit">
                  <select v-model="item.unidad" class="sel-unit">
                    <option value="unidad">unidad</option>
                    <option value="m2">m²</option>
                    <option value="ml">ml</option>
                    <option value="lámina">lámina</option>
                    <option value="placa">placa</option>
                    <option value="kit">kit</option>
                    <option value="caja">caja</option>
                  </select>
                </td>
                <!-- Precio unitario -->
                <td class="col-price">
                  <div class="input-prefix-wrap">
                    <span class="input-prefix">$</span>
                    <input v-model.number="item.precioUnitario" type="number" min="0" step="0.01" class="input-num has-prefix" @input="recalc(idx)" />
                  </div>
                </td>
                <!-- Descripción -->
                <td class="col-desc">
                  <input v-model="item.descripcion" type="text" placeholder="Observaciones…" class="input-desc" />
                </td>
                <!-- Subtotal -->
                <td class="col-sub subtotal-cell">
                  {{ fmtMoney(item.subtotal || 0) }}
                </td>
                <!-- Eliminar fila -->
                <td class="col-del">
                  <button class="del-row-btn" @click="removeItem(idx)" title="Quitar"><i class="bi bi-x-lg"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="add-row-btn" @click="addItem">
          <i class="bi bi-plus-circle"></i> Agregar ítem
        </button>

        <!-- Total -->
        <div class="total-row">
          <span class="total-label">Total</span>
          <span class="total-value">{{ fmtMoney(totalForm) }}</span>
        </div>

        <!-- Descripción general -->
        <div class="field">
          <label>Notas / Condiciones</label>
          <textarea v-model="form.descripcionGeneral" rows="3" placeholder="Observaciones generales, condiciones de pago, plazo de entrega…"></textarea>
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button class="primary-button" :disabled="saving" @click="saveQuote">
            <i class="bi" :class="saving ? 'bi-hourglass-split' : 'bi-floppy2'"></i>
            {{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear cotización' }}
          </button>
          <button class="secondary-button" :disabled="saving" @click="saveAndPrint">
            <i class="bi bi-printer"></i> Guardar e imprimir
          </button>
          <button class="ghost-button" @click="cancelForm">Cancelar</button>
        </div>
      </div>

    </div>
  </div>

  <!-- ── Layout de impresión (sólo visible al imprimir) ──────────────── -->
  <div v-if="quoteToPrint" class="print-doc">
    <div class="print-header">
      <img src="/karikal.png" alt="Karikal" class="print-logo" />
      <div class="print-company">
        <div class="print-doc-title">COTIZACIÓN</div>
        <table class="print-meta-table">
          <tr><td>N°</td><td><strong>#{{ String(quoteToPrint.numero).padStart(4,'0') }}</strong></td></tr>
          <tr><td>Fecha</td><td>{{ fmtDate(quoteToPrint.createdAt) }}</td></tr>
          <tr><td>Válida hasta</td><td>{{ validezFecha(quoteToPrint.createdAt, quoteToPrint.validezDias) }}</td></tr>
          <tr><td>Vendedor</td><td>{{ quoteToPrint.vendedor }}</td></tr>
        </table>
      </div>
    </div>

    <div class="print-titulo">{{ quoteToPrint.titulo }}</div>

    <!-- Cliente (si hay datos) -->
    <div v-if="hasCliente(quoteToPrint)" class="print-client-box">
      <div class="print-section-label">DESTINATARIO</div>
      <div v-if="quoteToPrint.cliente.nombre" class="print-client-name">{{ quoteToPrint.cliente.nombre }}</div>
      <div v-if="quoteToPrint.cliente.empresa" class="print-client-detail">{{ quoteToPrint.cliente.empresa }}</div>
      <div v-if="quoteToPrint.cliente.email" class="print-client-detail">{{ quoteToPrint.cliente.email }}</div>
      <div v-if="quoteToPrint.cliente.telefono" class="print-client-detail">{{ quoteToPrint.cliente.telefono }}</div>
    </div>

    <!-- Tabla de items -->
    <table class="print-items">
      <thead>
        <tr>
          <th class="pi-product">Producto / Material</th>
          <th class="pi-color">Color</th>
          <th class="pi-qty">Cant.</th>
          <th class="pi-unit">Unidad</th>
          <th class="pi-price">Precio unit.</th>
          <th class="pi-desc">Descripción</th>
          <th class="pi-sub">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, i) in quoteToPrint.items" :key="i">
          <td class="pi-product">
            <span class="pi-name">{{ item.nombre }}</span>
            <span v-if="item.codigo" class="pi-code">{{ item.codigo }}</span>
          </td>
          <td class="pi-color">{{ item.color || '—' }}</td>
          <td class="pi-qty">{{ item.cantidad }}</td>
          <td class="pi-unit">{{ item.unidad }}</td>
          <td class="pi-price">{{ fmtMoney(item.precioUnitario) }}</td>
          <td class="pi-desc">{{ item.descripcion || '' }}</td>
          <td class="pi-sub">{{ fmtMoney(item.subtotal) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="print-total-row">
          <td colspan="6" class="print-total-label">TOTAL</td>
          <td class="print-total-value">{{ fmtMoney(totalCotizacion(quoteToPrint)) }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Notas -->
    <div v-if="quoteToPrint.descripcionGeneral" class="print-notes">
      <div class="print-section-label">NOTAS Y CONDICIONES</div>
      <p class="print-notes-text">{{ quoteToPrint.descripcionGeneral }}</p>
    </div>

    <div class="print-validity">
      Oferta válida por {{ quoteToPrint.validezDias }} días a partir de la fecha de emisión.
      Precios en dólares. No incluyen IVA.
    </div>

    <div class="print-footer">
      Cotización generada por {{ quoteToPrint.vendedor }} — {{ fmtDate(quoteToPrint.createdAt) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import { API_BASE_URL } from '@/utils/api'

const productsStore = useProductsStore()
const toast = useToast()

// ── Estado ────────────────────────────────────────────────────────────────────
const activeTab = ref('list')
const quotes = ref([])
const loadingQuotes = ref(false)
const saving = ref(false)
const editingId = ref(null)
const showCliente = ref(false)
const quoteToPrint = ref(null)

const form = ref(newFormState())

// ── Productos ─────────────────────────────────────────────────────────────────
const productGroups = computed(() => productsStore.uniqueGrupos)
const productsByGrupo = computed(() => {
  const map = {}
  for (const g of productGroups.value) {
    map[g] = productsStore.products.filter(p => p.grupo === g)
  }
  return map
})

// ── Totales ───────────────────────────────────────────────────────────────────
const totalForm = computed(() =>
  form.value.items.reduce((s, i) => s + (i.subtotal || 0), 0)
)

function totalCotizacion(q) {
  return (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0)
}

// ── Auth header ───────────────────────────────────────────────────────────────
function authH() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  loadingQuotes.value = true
  try {
    await Promise.all([
      loadQuotes(),
      productsStore.products.length ? Promise.resolve() : productsStore.fetchProducts(),
    ])
  } finally {
    loadingQuotes.value = false
  }
})

async function loadQuotes() {
  const { data } = await axios.get(`${API_BASE_URL}/quotes`, authH())
  quotes.value = Array.isArray(data) ? data : []
}

// ── Formulario ────────────────────────────────────────────────────────────────
function newFormState() {
  return {
    numero: null,
    titulo: '',
    fecha: new Date().toISOString(),
    validezDias: 7,
    estado: 'borrador',
    cliente: { nombre: '', empresa: '', email: '', telefono: '' },
    items: [emptyItem()],
    descripcionGeneral: '',
  }
}

function emptyItem() {
  return {
    _productId: '',
    _colors: [],
    nombre: '',
    codigo: '',
    color: '',
    cantidad: 1,
    unidad: 'unidad',
    precioUnitario: 0,
    descripcion: '',
    subtotal: 0,
  }
}

function startNew() {
  editingId.value = null
  form.value = newFormState()
  showCliente.value = false
  activeTab.value = 'form'
}

function editQuote(q) {
  editingId.value = q._id
  form.value = {
    numero: q.numero,
    titulo: q.titulo,
    fecha: q.createdAt,
    validezDias: q.validezDias ?? 7,
    estado: q.estado || 'borrador',
    cliente: { ...{ nombre: '', empresa: '', email: '', telefono: '' }, ...(q.cliente || {}) },
    items: (q.items || []).map(it => ({
      _productId: it.productoId || '',
      _colors: it.productoId
        ? (productsStore.getById(it.productoId)?.colors || [])
        : [],
      nombre: it.nombre || '',
      codigo: it.codigo || '',
      color: it.color || '',
      cantidad: it.cantidad ?? 1,
      unidad: it.unidad || 'unidad',
      precioUnitario: it.precioUnitario ?? 0,
      descripcion: it.descripcion || '',
      subtotal: it.subtotal ?? 0,
    })),
    descripcionGeneral: q.descripcionGeneral || '',
  }
  showCliente.value = !!(q.cliente?.nombre || q.cliente?.empresa)
  activeTab.value = 'form'
}

function cancelForm() {
  activeTab.value = 'list'
  editingId.value = null
}

function addItem() {
  form.value.items.push(emptyItem())
}

function removeItem(idx) {
  form.value.items.splice(idx, 1)
  if (!form.value.items.length) form.value.items.push(emptyItem())
}

function recalc(idx) {
  const item = form.value.items[idx]
  item.subtotal = Number(((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2))
}

function onProductSelect(idx) {
  const item = form.value.items[idx]
  const pid = item._productId
  if (!pid) {
    item.nombre = ''
    item.codigo = ''
    item.color = ''
    item._colors = []
    item.precioUnitario = 0
    item.unidad = 'unidad'
    recalc(idx)
    return
  }
  const p = productsStore.getById(pid)
  if (!p) return
  item.nombre = p.name
  item.codigo = p.code || ''
  item._colors = p.colors || []
  item.color = item._colors.length ? item._colors[0] : ''
  item.unidad = p.unidadPrecio || 'unidad'
  item.precioUnitario = p.precioGrupoI ?? p.pricePerM2 ?? 0
  recalc(idx)
}

// ── Guardar ───────────────────────────────────────────────────────────────────
function buildPayload() {
  return {
    titulo: form.value.titulo,
    cliente: form.value.cliente,
    validezDias: form.value.validezDias,
    estado: form.value.estado,
    items: form.value.items.map(it => ({
      productoId: it._productId || null,
      nombre: it.nombre,
      codigo: it.codigo,
      color: it.color,
      cantidad: it.cantidad,
      unidad: it.unidad,
      precioUnitario: it.precioUnitario,
      descripcion: it.descripcion,
      subtotal: it.subtotal,
    })),
    descripcionGeneral: form.value.descripcionGeneral,
  }
}

async function saveQuote(andPrint = false) {
  if (!form.value.titulo.trim()) {
    toast.warning('El título es obligatorio.')
    return null
  }
  saving.value = true
  try {
    let saved
    if (editingId.value) {
      const { data } = await axios.put(`${API_BASE_URL}/quotes/${editingId.value}`, buildPayload(), authH())
      saved = data
      toast.success('Cotización actualizada.')
    } else {
      const { data } = await axios.post(`${API_BASE_URL}/quotes`, buildPayload(), authH())
      saved = data
      toast.success(`Cotización #${String(saved.numero).padStart(4,'0')} creada.`)
    }
    await loadQuotes()
    activeTab.value = 'list'
    editingId.value = null
    return saved
  } catch (err) {
    toast.error('Error al guardar la cotización.')
    console.error(err)
    return null
  } finally {
    saving.value = false
  }
}

async function saveAndPrint() {
  const saved = await saveQuote()
  if (saved) {
    quoteToPrint.value = saved
    await nextTick()
    window.print()
  }
}

// ── Imprimir cotización existente ────────────────────────────────────────────
async function openPrint(q) {
  quoteToPrint.value = q
  await nextTick()
  window.print()
}

// ── Eliminar ──────────────────────────────────────────────────────────────────
async function confirmDelete(q) {
  if (!confirm(`¿Eliminar cotización #${String(q.numero).padStart(4,'0')} "${q.titulo}"?`)) return
  try {
    await axios.delete(`${API_BASE_URL}/quotes/${q._id}`, authH())
    toast.success('Cotización eliminada.')
    await loadQuotes()
  } catch {
    toast.error('Error al eliminar.')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function validezFecha(createdAt, dias = 7) {
  if (!createdAt) return '—'
  const d = new Date(createdAt)
  d.setDate(d.getDate() + (dias || 7))
  return fmtDate(d.toISOString())
}

function fmtMoney(v) {
  if (v == null || isNaN(v)) return '—'
  return '$ ' + Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ESTADO_LABELS = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
}
function labelEstado(e) { return ESTADO_LABELS[e] || e }

function hasCliente(q) {
  return !!(q.cliente?.nombre || q.cliente?.empresa || q.cliente?.email || q.cliente?.telefono)
}
</script>

<style scoped>
/* ── Topbar ── */
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
.topbar-left { display: flex; align-items: center; gap: 0.75rem; }
.page-title { margin: 0; font-size: 1.1rem; font-weight: 700; }

/* ── Empty state ── */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 3rem 1rem; color: var(--color-muted); text-align: center; }

/* ── Tabla historial ── */
.table-scroll { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(107,142,58,0.14); }
.inv-table { width: 100%; border-collapse: collapse; min-width: 720px; font-size: 0.85rem; }
.inv-table thead th { background: rgba(240,245,233,0.97); padding: 0.55rem 0.85rem; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: var(--color-muted); white-space: nowrap; text-align: left; }
.inv-table tbody tr { border-top: 1px solid rgba(107,142,58,0.08); transition: background 0.12s; }
.inv-table tbody tr:hover { background: rgba(107,142,58,0.04); }
.inv-table tbody td { padding: 0.5rem 0.85rem; vertical-align: middle; }
.num-cell { font-weight: 700; font-size: 0.8rem; color: var(--color-primary, #6b8e3a); white-space: nowrap; }
.title-cell { font-weight: 600; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.client-cell { color: var(--color-muted); font-size: 0.82rem; }
.date-cell { white-space: nowrap; font-size: 0.82rem; color: var(--color-muted); }
.price-cell { font-weight: 700; white-space: nowrap; }
.actions-cell { white-space: nowrap; display: flex; gap: 0.3rem; align-items: center; }

/* ── Badges estado ── */
.badge-estado { display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.55rem; border-radius: 999px; }
.badge-estado.borrador { background: rgba(107,142,58,0.1); color: #557030; }
.badge-estado.enviada { background: rgba(59,130,246,0.12); color: #1d4ed8; }
.badge-estado.aceptada { background: rgba(16,185,129,0.12); color: #065f46; }
.badge-estado.rechazada { background: rgba(239,68,68,0.12); color: #991b1b; }

/* ── Botones icono ── */
.icon-btn { background: none; border: none; padding: 0.35rem 0.45rem; border-radius: 8px; cursor: pointer; color: var(--color-muted); transition: background 0.15s, color 0.15s; }
.icon-btn:hover { background: rgba(107,142,58,0.1); color: var(--color-primary, #6b8e3a); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.1); color: #dc2626; }

/* ── Formulario ── */
.quote-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-section-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-primary, #6b8e3a); padding-bottom: 0.4rem; border-bottom: 1px solid rgba(107,142,58,0.18); }
.section-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); margin-top: 0.3rem; }

/* Grid de campos */
.form-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field.full { grid-column: 1 / -1; }
.field label { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-muted); }
.disabled-input { background: rgba(0,0,0,0.04); cursor: default; }

/* Colapsible cliente */
.collapsible-header { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--color-text); padding: 0.45rem 0; user-select: none; }
.collapsible-body { padding-top: 0.25rem; }
.optional-tag { font-size: 0.78rem; font-weight: 400; color: var(--color-muted); font-style: italic; }

/* Tabla items */
.items-scroll { overflow-x: auto; border: 1px solid rgba(107,142,58,0.14); border-radius: 12px; }
.items-table { width: 100%; border-collapse: collapse; min-width: 860px; font-size: 0.83rem; }
.items-table thead th { background: rgba(240,245,233,0.97); padding: 0.45rem 0.6rem; font-size: 0.71rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-muted); font-weight: 700; text-align: left; }
.item-row td { padding: 0.3rem 0.4rem; border-top: 1px solid rgba(107,142,58,0.08); vertical-align: middle; }

.col-producto { min-width: 200px; }
.col-color { min-width: 100px; }
.col-qty { width: 70px; }
.col-unit { width: 90px; }
.col-price { width: 110px; }
.col-desc { min-width: 140px; }
.col-sub { width: 100px; text-align: right; }
.col-del { width: 36px; text-align: center; }

.sel-producto { width: 100%; font-size: 0.8rem; }
.manual-name { width: 100%; margin-top: 0.25rem; font-size: 0.8rem; }
.item-code { display: block; font-size: 0.7rem; color: var(--color-muted); margin-top: 0.15rem; }
.sel-color, .sel-unit { width: 100%; font-size: 0.8rem; }
.input-color { width: 100%; font-size: 0.8rem; }
.input-num { width: 100%; font-size: 0.82rem; }
.input-desc { width: 100%; font-size: 0.8rem; }
.subtotal-cell { font-weight: 700; font-size: 0.82rem; white-space: nowrap; }

.input-prefix-wrap { position: relative; }
.input-prefix { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--color-muted); pointer-events: none; }
.has-prefix { padding-left: 1.3rem !important; }

.del-row-btn { background: none; border: none; padding: 0.2rem 0.35rem; border-radius: 6px; cursor: pointer; color: #dc2626; opacity: 0.6; transition: opacity 0.15s, background 0.15s; }
.del-row-btn:hover { opacity: 1; background: rgba(239,68,68,0.08); }

.add-row-btn { align-self: flex-start; background: none; border: 1px dashed rgba(107,142,58,0.4); color: var(--color-primary, #6b8e3a); border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.15s, border-color 0.15s; display: flex; align-items: center; gap: 0.4rem; }
.add-row-btn:hover { background: rgba(107,142,58,0.07); border-color: rgba(107,142,58,0.7); }

/* Total */
.total-row { display: flex; justify-content: flex-end; align-items: center; gap: 1rem; padding: 0.6rem 0.85rem; background: rgba(107,142,58,0.07); border-radius: 10px; }
.total-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.total-value { font-size: 1.1rem; font-weight: 800; color: var(--color-primary, #6b8e3a); }

/* Footer form */
.form-footer { display: flex; flex-wrap: wrap; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid rgba(107,142,58,0.12); }

/* ── IMPRESIÓN ── */
.print-doc { display: none; }
</style>

<style>
/* ── Media print (global para afectar App.vue) ── */
@media print {
  /* Ocultar toda la interfaz */
  .no-print,
  .sidebar,
  .mobile-toggle,
  .sidebar-backdrop,
  .notification-bell-container { display: none !important; }

  /* Resetear el layout fijo */
  html, body, #app {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  main.app-content {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Mostrar el doc de impresión */
  .print-doc {
    display: block !important;
    font-family: 'Inter', Arial, sans-serif;
    color: #111;
    padding: 1.2cm 1.5cm;
    font-size: 10pt;
    line-height: 1.5;
  }

  /* Header impresión */
  .print-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.2rem;
    border-bottom: 2px solid #5a7a2a;
    padding-bottom: 0.9rem;
    gap: 1rem;
  }

  .print-logo { height: 70px; width: auto; object-fit: contain; }

  .print-company { text-align: right; }

  .print-doc-title {
    font-size: 20pt;
    font-weight: 800;
    color: #5a7a2a;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
  }

  .print-meta-table { font-size: 9pt; border-collapse: collapse; }
  .print-meta-table td { padding: 0.05rem 0.4rem; }
  .print-meta-table td:first-child { color: #666; text-align: right; }

  /* Título cotización */
  .print-titulo {
    font-size: 13pt;
    font-weight: 700;
    margin: 0.8rem 0 0.6rem;
    color: #222;
  }

  /* Destinatario */
  .print-client-box {
    background: #f5f7f0;
    border: 1px solid #d4dfc8;
    border-radius: 6px;
    padding: 0.6rem 0.9rem;
    margin-bottom: 0.9rem;
  }

  .print-section-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #5a7a2a;
    margin-bottom: 0.3rem;
  }

  .print-client-name { font-weight: 700; font-size: 10.5pt; }
  .print-client-detail { font-size: 9pt; color: #444; }

  /* Tabla items */
  .print-items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 0.9rem;
    font-size: 9pt;
  }

  .print-items thead tr { background: #5a7a2a; color: #fff; }
  .print-items thead th { padding: 0.4rem 0.6rem; text-align: left; font-weight: 700; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
  .print-items tbody tr:nth-child(even) { background: #f9fbf6; }
  .print-items tbody td { padding: 0.35rem 0.6rem; border-bottom: 1px solid #e2ead8; vertical-align: top; }

  .pi-name { display: block; font-weight: 600; }
  .pi-code { display: block; font-size: 8pt; color: #777; }
  .pi-product { min-width: 140px; }
  .pi-color { width: 80px; }
  .pi-qty { width: 45px; text-align: right; }
  .pi-unit { width: 55px; }
  .pi-price { width: 75px; text-align: right; }
  .pi-desc { color: #555; }
  .pi-sub { width: 80px; text-align: right; font-weight: 600; }

  .print-total-row { background: #5a7a2a !important; color: #fff; }
  .print-total-label { text-align: right; font-weight: 700; font-size: 10pt; padding: 0.45rem 0.6rem; }
  .print-total-value { text-align: right; font-weight: 800; font-size: 11pt; padding: 0.45rem 0.6rem; white-space: nowrap; }

  /* Notas */
  .print-notes { margin-bottom: 0.8rem; }
  .print-notes-text { font-size: 9pt; color: #444; white-space: pre-line; margin: 0.3rem 0 0; }

  /* Validez */
  .print-validity {
    font-size: 8.5pt;
    color: #555;
    border-top: 1px solid #d4dfc8;
    padding-top: 0.5rem;
    margin-bottom: 0.5rem;
    font-style: italic;
  }

  /* Footer impresión */
  .print-footer {
    font-size: 8pt;
    color: #888;
    text-align: right;
    border-top: 1px solid #e0e0e0;
    padding-top: 0.4rem;
    margin-top: 0.4rem;
  }
}
</style>
