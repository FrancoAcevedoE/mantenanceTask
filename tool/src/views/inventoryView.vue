<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Inventario</h2>
        <div class="toolbar-actions">
          <div class="search-wrap">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="search"
              class="search-input"
              placeholder="Buscar código, descripción, color..."
            />
          </div>
          <button class="secondary-button" @click="filtersOpen = !filtersOpen">
            <i class="bi bi-funnel"></i> Filtros
          </button>
          <router-link v-if="canManage" to="/product/new">
            <button class="primary-button"><i class="bi bi-plus-lg"></i> Nuevo producto</button>
          </router-link>
          <button v-if="canManage" class="danger-button btn-vaciar" @click="showDeleteAllConfirm = true" title="Vaciar inventario">
            <i class="bi bi-trash"></i><span class="vaciar-label"> Vaciar</span>
          </button>
          <ConfirmDialog
            :visible="showDeleteAllConfirm"
            title="Vaciar inventario"
            message="¿Estas seguro de eliminar TODOS los productos? Esta accion no se puede deshacer."
            confirm-text="Eliminar todo"
            type="danger"
            @confirm="deleteAll(); showDeleteAllConfirm = false"
            @cancel="showDeleteAllConfirm = false"
          />
          <router-link to="/inv-dashboard">
            <button class="secondary-button"><i class="bi bi-bar-chart-line"></i> Dashboard</button>
          </router-link>
        </div>
      </div>

      <InventorySubNav />

      <div v-if="store.loading" class="empty-state">Cargando productos...</div>
      <div v-else-if="store.error" class="empty-state" style="color:#dc2626">{{ store.error }}</div>

      <div v-else class="inv-layout">
        <!-- Sidebar Filters -->
        <aside :class="['inv-sidebar', { open: filtersOpen }]">
          <div class="filter-header">
            <strong>Filtros</strong>
            <button class="ghost-button small" @click="clearFilters">Limpiar</button>
          </div>

          <div class="filter-group">
            <label>Grupo</label>
            <select v-model="filters.grupo">
              <option value="">Todos</option>
              <option v-for="g in store.uniqueGrupos" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Color</label>
            <select v-model="filters.color">
              <option value="">Todos</option>
              <option v-for="c in store.uniqueColors" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Medida</label>
            <select v-model="filters.medida">
              <option value="">Todas</option>
              <option v-for="m in store.uniqueMedidas" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Terminación</label>
            <select v-model="filters.terminacion">
              <option value="">Todas</option>
              <option v-for="t in store.uniqueTerminaciones" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Textura</label>
            <select v-model="filters.textura">
              <option value="">Todas</option>
              <option v-for="t in store.uniqueTexturas" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Espesor</label>
            <select v-model="filters.espesor">
              <option value="">Todos</option>
              <option v-for="e in store.uniqueEspesores" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>

          <div class="filter-count">
            <span>{{ filtered.length }} producto{{ filtered.length !== 1 ? 's' : '' }}</span>
          </div>
        </aside>

        <!-- Table -->
        <div class="inv-content">
          <div class="selection-bar" v-if="store.selectedIds.length > 0">
            <span>{{ store.selectedIds.length }} seleccionado{{ store.selectedIds.length !== 1 ? 's' : '' }}</span>
            <router-link to="/bulk-price">
              <button><i class="bi bi-tags"></i> Actualizar precios</button>
            </router-link>
            <button class="secondary-button" @click="store.clearSelection()">Deseleccionar</button>
          </div>

          <div class="table-scroll">
            <table class="history-table inv-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input type="checkbox" :checked="allSelected" @change="toggleAll" />
                  </th>
                  <th @click="sortBy('code')" class="sortable">
                    Código <i :class="sortIcon('code')"></i>
                  </th>
                  <th @click="sortBy('name')" class="sortable">
                    Descripción / Tipo / Terminación / Espesor <i :class="sortIcon('name')"></i>
                  </th>
                  <th>Color</th>
                  <th>Medida</th>
                  <th @click="sortBy('precioGrupoI')" class="sortable">
                    Precio unitario <i :class="sortIcon('precioGrupoI')"></i>
                  </th>
                  <th @click="sortBy('stock')" class="sortable">
                    Stock <i :class="sortIcon('stock')"></i>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <!-- Vista agrupada: sin filtro de grupo ni búsqueda -->
                <template v-if="showGrouped">
                  <template v-for="group in groupedFiltered" :key="group.grupo">
                    <tr class="group-header-row">
                      <td colspan="9" class="group-header-cell">
                        <i class="bi bi-layers group-icon"></i>
                        <span class="group-header-label">{{ group.grupo }}</span>
                        <span class="group-count">{{ group.items.length }} producto{{ group.items.length !== 1 ? 's' : '' }}</span>
                      </td>
                    </tr>
                    <template v-for="p in group.items" :key="p._id">
                    <tr :class="{ selected: store.selectedIds.includes(p._id) }">
                      <td><input type="checkbox" :checked="store.selectedIds.includes(p._id)" @change="store.toggleSelect(p._id)" /></td>
                      <td><code class="code-badge">{{ p.code }}</code></td>
                      <td class="desc-cell">
                        <span class="desc-name">{{ p.name }}</span>
                        <div v-if="p.tipo || p.terminacion" class="desc-meta-row">
                          <span v-if="p.tipo" class="desc-meta">{{ p.tipo }}</span>
                          <span v-if="p.tipo && p.terminacion" class="desc-meta-sep">·</span>
                          <span v-if="p.terminacion" class="desc-meta desc-terminacion">{{ p.terminacion }}</span>
                        </div>
                        <span v-if="p.espesor" class="desc-espesor">{{ p.espesor }}mm</span>
                        <span v-if="p.dimensions" class="desc-medida">{{ p.dimensions }}</span>
                      </td>
                      <td>
                        <span v-if="p.colors?.length" class="color-chip">
                          <span class="color-dot" :style="colorStyle(p.colors[0])"></span>
                          {{ p.colors[0] }}
                        </span>
                        <span v-else class="muted">—</span>
                      </td>
                      <td>{{ p.dimensions || '—' }}</td>
                      <td class="price-cell">
                        <span v-if="precioBase(p) !== null">
                          ${{ formatPrice(precioBase(p)) }}
                          <span class="unit-label">/{{ unitLabel(p.unidadPrecio) }}</span>
                        </span>
                        <span v-else class="muted">—</span>
                      </td>
                      <td><span :class="stockBadge(p.stock)">{{ p.stock ?? 0 }}</span></td>
                      <td>
                        <div class="action-buttons">
                          <button class="btn-sm secondary-button" @click="toggleDetail(p._id)" :title="expandedId === p._id ? 'Ocultar' : 'Ver detalle'">
                            <i class="bi" :class="expandedId === p._id ? 'bi-chevron-up' : 'bi-eye'"></i>
                          </button>
                          <router-link v-if="canManage" :to="`/product/${p._id}/edit`">
                            <button class="btn-sm secondary-button"><i class="bi bi-pencil"></i></button>
                          </router-link>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="expandedId === p._id" class="detail-expand-row">
                      <td colspan="8">
                        <div class="detail-expand-box">
                          <div class="dex-grid">
                            <div v-if="p.image" class="dex-img">
                              <img :src="resolveUrl(p.image)" :alt="p.name" />
                            </div>
                            <div class="dex-info">
                              <div class="dex-row"><span class="dex-label">SKU</span><code>{{ p.code }}</code></div>
                              <div v-if="p.grupo" class="dex-row"><span class="dex-label">Grupo</span><span>{{ p.grupo }}</span></div>
                              <div v-if="p.tipo" class="dex-row"><span class="dex-label">Tipo</span><span>{{ p.tipo }}</span></div>
                              <div v-if="p.terminacion" class="dex-row"><span class="dex-label">Terminacion</span><span>{{ p.terminacion }}</span></div>
                              <div v-if="p.espesor" class="dex-row"><span class="dex-label">Espesor</span><span>{{ p.espesor }}mm</span></div>
                              <div v-if="p.dimensions" class="dex-row"><span class="dex-label">Medida</span><span>{{ p.dimensions }}</span></div>
                              <div v-if="p.m2" class="dex-row"><span class="dex-label">m2</span><span>{{ p.m2 }}</span></div>
                              <div v-if="p.colorMode" class="dex-row"><span class="dex-label">Color</span><span>{{ p.colorMode === 'todos' ? 'TODOS' : (p.selectedColors?.join(', ') || p.color || '—') }}</span></div>
                              <div v-if="p.detalle" class="dex-row full"><span class="dex-label">Detalle</span><span>{{ p.detalle }}</span></div>
                              <div v-if="p.comentario" class="dex-row full"><span class="dex-label">Comentario</span><span>{{ p.comentario }}</span></div>
                            </div>
                            <div class="dex-prices">
                              <div v-if="p.precioGeneral != null" class="dex-price"><span class="dex-label">General</span><span class="dex-val">${{ formatPrice(p.precioGeneral) }}</span></div>
                              <div v-if="p.precioGrupoI != null" class="dex-price"><span class="dex-label">Grupo I</span><span class="dex-val">${{ formatPrice(p.precioGrupoI) }}</span></div>
                              <div v-if="p.precioGrupoII != null" class="dex-price"><span class="dex-label">Grupo II</span><span class="dex-val">${{ formatPrice(p.precioGrupoII) }}</span></div>
                              <div v-if="p.precioGrupoIII != null" class="dex-price"><span class="dex-label">Grupo III</span><span class="dex-val">${{ formatPrice(p.precioGrupoIII) }}</span></div>
                            </div>
                          </div>
                          <div class="dex-footer">
                            <router-link :to="`/product/${p._id}`"><button class="btn-sm"><i class="bi bi-box-arrow-up-right"></i> Ver completo</button></router-link>
                          </div>
                        </div>
                      </td>
                    </tr>
                    </template>
                  </template>
                  <tr v-if="groupedFiltered.length === 0">
                    <td colspan="8" class="empty-row">Sin resultados para los filtros aplicados.</td>
                  </tr>
                </template>

                <!-- Vista plana paginada: con filtro o búsqueda activos -->
                <template v-else>
                  <template v-for="p in paged" :key="p._id">
                  <tr :class="{ selected: store.selectedIds.includes(p._id) }">
                    <td><input type="checkbox" :checked="store.selectedIds.includes(p._id)" @change="store.toggleSelect(p._id)" /></td>
                    <td><code class="code-badge">{{ p.code }}</code></td>
                    <td class="desc-cell">
                      <span class="desc-name">{{ p.name }}</span>
                      <span v-if="p.tipo" class="desc-meta">{{ p.tipo }}</span>
                      <span v-if="p.terminacion" class="desc-meta desc-terminacion">{{ p.terminacion }}</span>
                      <span v-if="p.espesor" class="desc-espesor">{{ p.espesor }}mm</span>
                      <span v-if="p.dimensions" class="desc-medida">{{ p.dimensions }}</span>
                    </td>
                    <td>
                      <span v-if="p.colors?.length" class="color-chip">
                        <span class="color-dot" :style="colorStyle(p.colors[0])"></span>
                        {{ p.colors[0] }}
                      </span>
                      <span v-else class="muted">—</span>
                    </td>
                    <td>{{ p.dimensions || '—' }}</td>
                    <td class="price-cell">
                      <span v-if="precioBase(p) !== null">
                        ${{ formatPrice(precioBase(p)) }}
                        <span class="unit-label">/{{ unitLabel(p.unidadPrecio) }}</span>
                      </span>
                      <span v-else class="muted">—</span>
                    </td>
                    <td><span :class="stockBadge(p.stock)">{{ p.stock ?? 0 }}</span></td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-sm secondary-button" @click="toggleDetail(p._id)" :title="expandedId === p._id ? 'Ocultar' : 'Ver detalle'">
                          <i class="bi" :class="expandedId === p._id ? 'bi-chevron-up' : 'bi-eye'"></i>
                        </button>
                        <router-link v-if="canManage" :to="`/product/${p._id}/edit`">
                          <button class="btn-sm secondary-button"><i class="bi bi-pencil"></i></button>
                        </router-link>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedId === p._id" class="detail-expand-row">
                    <td colspan="8">
                      <div class="detail-expand-box">
                        <div class="dex-grid">
                          <div v-if="p.image" class="dex-img">
                            <img :src="resolveUrl(p.image)" :alt="p.name" />
                          </div>
                          <div class="dex-info">
                            <div class="dex-row"><span class="dex-label">SKU</span><code>{{ p.code }}</code></div>
                            <div v-if="p.grupo" class="dex-row"><span class="dex-label">Grupo</span><span>{{ p.grupo }}</span></div>
                            <div v-if="p.tipo" class="dex-row"><span class="dex-label">Tipo</span><span>{{ p.tipo }}</span></div>
                            <div v-if="p.terminacion" class="dex-row"><span class="dex-label">Terminacion</span><span>{{ p.terminacion }}</span></div>
                            <div v-if="p.espesor" class="dex-row"><span class="dex-label">Espesor</span><span>{{ p.espesor }}mm</span></div>
                            <div v-if="p.dimensions" class="dex-row"><span class="dex-label">Medida</span><span>{{ p.dimensions }}</span></div>
                            <div v-if="p.m2" class="dex-row"><span class="dex-label">m2</span><span>{{ p.m2 }}</span></div>
                            <div v-if="p.colorMode" class="dex-row"><span class="dex-label">Color</span><span>{{ p.colorMode === 'todos' ? 'TODOS' : (p.selectedColors?.join(', ') || p.color || '—') }}</span></div>
                            <div v-if="p.detalle" class="dex-row full"><span class="dex-label">Detalle</span><span>{{ p.detalle }}</span></div>
                          </div>
                          <div class="dex-prices">
                            <div v-if="p.precioGeneral != null" class="dex-price"><span class="dex-label">General</span><span class="dex-val">${{ formatPrice(p.precioGeneral) }}</span></div>
                            <div v-if="p.precioGrupoI != null" class="dex-price"><span class="dex-label">Grupo I</span><span class="dex-val">${{ formatPrice(p.precioGrupoI) }}</span></div>
                            <div v-if="p.precioGrupoII != null" class="dex-price"><span class="dex-label">Grupo II</span><span class="dex-val">${{ formatPrice(p.precioGrupoII) }}</span></div>
                            <div v-if="p.precioGrupoIII != null" class="dex-price"><span class="dex-label">Grupo III</span><span class="dex-val">${{ formatPrice(p.precioGrupoIII) }}</span></div>
                          </div>
                        </div>
                        <div class="dex-footer">
                          <router-link :to="`/product/${p._id}`"><button class="btn-sm"><i class="bi bi-box-arrow-up-right"></i> Ver completo</button></router-link>
                        </div>
                      </div>
                    </td>
                  </tr>
                  </template>
                  <tr v-if="paged.length === 0">
                    <td colspan="8" class="empty-row">Sin resultados para los filtros aplicados.</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Pagination: solo en vista plana -->
          <div class="pagination" v-if="!showGrouped && totalPages > 1">
            <button class="secondary-button" :disabled="page === 1" @click="page--">
              <i class="bi bi-chevron-left"></i>
            </button>
            <span>Página {{ page }} de {{ totalPages }}</span>
            <button class="secondary-button" :disabled="page === totalPages" @click="page++">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { API_BASE_URL } from '@/utils/api'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePermissions } from '@/utils/permissions'

const { canManage } = usePermissions()

const store = useProductsStore()
const toast = useToast()

const expandedId = ref(null)

function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

const search = ref('')
const filtersOpen = ref(false)
const page = ref(1)
const pageSize = 20
const sortKey = ref('code')
const sortDir = ref('asc')

const filters = ref({
  grupo: '',
  color: '',
  medida: '',
  terminacion: '',
  textura: '',
  espesor: ''
})

const GRUPO_ORDER = [
  'LAMINADOS DECORATIVOS', 'KARIPLAC MDP', 'KARIPLAC MDF', 'KARIPLAK H', 'KARIPLAK MAX',
  'Kompak', 'Kompak Unicolor', 'Acustik', 'Top Floor Pisos', 'Top Wall',
  'Top Kit / Solid / Table', 'Coverwall', 'Top Box', 'Panel Expositor / Top Rack',
  'Karystyle', 'Kariform'
]

onMounted(() => {
  if (!store.products.length) store.fetchProducts()
})

function clearFilters() {
  Object.keys(filters.value).forEach(k => (filters.value[k] = ''))
  search.value = ''
}

const showDeleteAllConfirm = ref(false)

async function deleteAll() {
  try {
    const res = await store.deleteAllProducts()
    toast.success(res.message || 'Productos eliminados')
  } catch {
    toast.error('Error al vaciar productos')
  }
}

const filtered = computed(() => {
  let list = store.products

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p =>
      p.code?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.tipo?.toLowerCase().includes(q) ||
      p.terminacion?.toLowerCase().includes(q) ||
      p.grupo?.toLowerCase().includes(q) ||
      p.dimensions?.toLowerCase().includes(q) ||
      p.comentario?.toLowerCase().includes(q) ||
      p.colors?.some(c => c.toLowerCase().includes(q)) ||
      p.thicknesses?.some(t => t.toLowerCase().includes(q))
    )
  }

  if (filters.value.grupo) list = list.filter(p => p.grupo === filters.value.grupo)
  if (filters.value.color) list = list.filter(p => p.colors?.includes(filters.value.color))
  if (filters.value.medida) list = list.filter(p => p.dimensions === filters.value.medida)
  if (filters.value.terminacion) list = list.filter(p => p.terminacion === filters.value.terminacion)
  if (filters.value.textura) list = list.filter(p => p.textura === filters.value.textura)
  if (filters.value.espesor) list = list.filter(p => p.thicknesses?.includes(filters.value.espesor))

  return [...list].sort((a, b) => {
    const av = a[sortKey.value] ?? ''
    const bv = b[sortKey.value] ?? ''
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

// Mostrar vista agrupada cuando no hay filtro de grupo ni búsqueda activa
const showGrouped = computed(() => !filters.value.grupo && !search.value.trim())

const groupedFiltered = computed(() => {
  const map = {}
  for (const p of filtered.value) {
    const g = p.grupo || 'Sin grupo'
    if (!map[g]) map[g] = []
    map[g].push(p)
  }
  const ordered = GRUPO_ORDER.filter(g => map[g]).map(g => ({ grupo: g, items: map[g] }))
  const extra = Object.keys(map).filter(g => !GRUPO_ORDER.includes(g)).map(g => ({ grupo: g, items: map[g] }))
  return [...ordered, ...extra]
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(filtered, () => { page.value = 1 })

const allSelected = computed(() => {
  const rows = showGrouped.value ? filtered.value : paged.value
  return rows.length > 0 && rows.every(p => store.selectedIds.includes(p._id))
})

function toggleAll() {
  const rows = showGrouped.value ? filtered.value : paged.value
  if (allSelected.value) {
    rows.forEach(p => {
      const idx = store.selectedIds.indexOf(p._id)
      if (idx !== -1) store.selectedIds.splice(idx, 1)
    })
  } else {
    rows.forEach(p => {
      if (!store.selectedIds.includes(p._id)) store.selectedIds.push(p._id)
    })
  }
}

function sortBy(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function sortIcon(key) {
  if (sortKey.value !== key) return 'bi bi-chevron-expand text-muted'
  return sortDir.value === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down'
}

function precioBase(p) {
  if (p.precio != null) return p.precio
  if (p.precioGrupoI != null) return p.precioGrupoI
  if (p.precioGrupoII != null) return p.precioGrupoII
  if (p.precioGrupoIII != null) return p.precioGrupoIII
  if (p.pricePerM2 != null) return p.pricePerM2
  return null
}

function unitLabel(u) {
  if (!u || u === 'm2') return 'm²'
  if (u === 'ml') return 'ml'
  return u
}

function formatPrice(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function stockBadge(stock) {
  const n = stock ?? 0
  if (n === 0) return 'badge badge-danger'
  if (n <= 5) return 'badge badge-warning'
  return 'badge badge-ok'
}

function colorStyle(colorName) {
  const map = {
    negro: '#1a1a1a', blanco: '#f5f5f5', gris: '#9e9e9e', rojo: '#e53935',
    azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marrón: '#6d4c41',
    naranja: '#fb8c00', rosa: '#e91e63', violeta: '#8e24aa', beige: '#d7c4a1',
    platino: '#e5e4e2', almendra: '#d4a96a', tiza: '#b0b0b0',
  }
  const key = Object.keys(map).find(k => colorName?.toLowerCase().includes(k))
  return { backgroundColor: key ? map[key] : '#ccc', width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }
}
</script>

<style scoped>
.topbar { margin-bottom: 0.6rem; }

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
}

.toolbar-actions a { text-decoration: none; }

.search-wrap {
  position: relative;
  flex: 1 1 240px;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-size: 0.95rem;
  pointer-events: none;
}

.search-input {
  padding-left: 2.4rem !important;
  width: 100%;
}

.inv-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 0.85rem;
  align-items: start;
}

.inv-sidebar {
  background: rgba(107, 142, 58, 0.06);
  border: 1px solid rgba(107, 142, 58, 0.14);
  border-radius: 16px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  position: sticky;
  top: 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-header strong {
  font-family: 'Poppins', sans-serif;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.filter-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.filter-group select {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  border-radius: 10px;
}

.filter-count {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-muted);
  padding-top: 0.5rem;
  border-top: 1px solid rgba(107,142,58,0.1);
}

.inv-content { min-width: 0; }

.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  background: rgba(107, 142, 58, 0.1);
  border-radius: 14px;
  margin-bottom: 1rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.selection-bar a { text-decoration: none; }

.table-scroll {
  max-height: 200dvh;
  overflow-x: auto;
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid rgba(107, 142, 58, 0.14);
}

.inv-table { min-width: 800px; }

.inv-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(240, 245, 233, 0.97);
  backdrop-filter: blur(4px);
  font-size: 0.75rem;
  padding: 0.5rem 0.7rem;
  white-space: nowrap;
}

.inv-table tbody td { padding: 0.4rem 0.7rem; vertical-align: middle; }
.inv-table tbody tr:hover { background: rgba(107, 142, 58, 0.04); }
.inv-table tbody tr.selected { background: rgba(107, 142, 58, 0.1); }

/* Group header rows */
.group-header-row {
  background: rgba(107, 142, 58, 0.1) !important;
}

.group-header-row:hover {
  background: rgba(107, 142, 58, 0.13) !important;
}

.group-header-cell {
  padding: 0.65rem 1rem !important;
  border-top: 2px solid rgba(107, 142, 58, 0.25);
}

.group-header-cell:first-child {
  border-top-left-radius: 0;
}

.group-icon {
  color: var(--color-primary, #6b8e3a);
  margin-right: 0.5rem;
  font-size: 0.88rem;
}

.group-header-label {
  font-family: 'Poppins', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-primary, #6b8e3a);
}

.group-count {
  margin-left: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-muted);
  font-weight: 500;
}

.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: rgba(107, 142, 58, 0.12); }

.col-check { width: 40px; }

.code-badge {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  background: rgba(107, 142, 58, 0.1);
  padding: 0.2rem 0.55rem;
  border-radius: 8px;
  color: var(--color-text);
  font-weight: 600;
}

.desc-cell {
  min-width: 160px;
  max-width: 260px;
}

.desc-name {
  display: block;
  font-weight: 600;
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* tipo · terminacion en una sola fila */
.desc-meta-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  overflow: hidden;
}

.desc-meta {
  font-size: 0.72rem;
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.desc-meta-sep {
  font-size: 0.65rem;
  color: var(--color-muted);
  opacity: 0.5;
  flex-shrink: 0;
}

.desc-terminacion { font-style: italic; }

.desc-medida {
  display: inline-block;
  margin-top: 0.15rem;
  font-size: 0.67rem;
  color: var(--color-muted);
}

.desc-espesor {
  display: inline-block;
  margin-top: 0.15rem;
  font-size: 0.67rem;
  font-weight: 700;
  background: rgba(107, 142, 58, 0.1);
  color: var(--color-primary, #6b8e3a);
  padding: 0.05rem 0.4rem;
  border-radius: 5px;
  letter-spacing: 0.03em;
}

.color-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.83rem;
  white-space: nowrap;
}

.price-cell { font-weight: 600; white-space: nowrap; }

.unit-label {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--color-muted);
  margin-left: 1px;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}
.badge-ok { background: rgba(34,197,94,0.12); color: #15803d; }
.badge-warning { background: rgba(234,179,8,0.14); color: #b45309; }
.badge-danger { background: rgba(239,68,68,0.12); color: #b91c1c; }

.btn-sm {
  padding: 0.35rem 0.65rem !important;
  font-size: 0.8rem;
  border-radius: 10px !important;
  min-width: 0 !important;
}

.btn-selected {
  background: var(--color-primary) !important;
  color: #fff !important;
}

.action-buttons { display: flex; gap: 0.35rem; }
.action-buttons a { text-decoration: none; }

.muted { color: var(--color-muted); }

.empty-row {
  text-align: center;
  padding: 2rem;
  color: var(--color-muted);
  font-style: italic;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.2rem;
  font-size: 0.88rem;
}

.ghost-button.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .inv-layout { grid-template-columns: 1fr; }

  .inv-sidebar {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 500;
    border-radius: 0;
    overflow-y: auto;
    background: rgba(255,255,255,0.98);
    padding: 2rem 1.5rem;
  }

  .inv-sidebar.open { display: flex; }

  .table-scroll { -webkit-overflow-scrolling: touch; }

  .toolbar-actions { flex-wrap: wrap; gap: 0.4rem; }
}

/* Detail expand */
.detail-expand-row td { padding: 0 !important; }
.detail-expand-box {
  background: rgba(107,142,58,0.04);
  border-top: 1px solid rgba(107,142,58,0.12);
  border-bottom: 1px solid rgba(107,142,58,0.12);
  padding: 0.8rem 1rem;
}
.dex-grid {
  display: flex; gap: 1rem; flex-wrap: wrap;
}
.dex-img {
  width: 80px; height: 80px; border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(107,142,58,0.15); flex-shrink: 0;
}
.dex-img img { width: 100%; height: 100%; object-fit: cover; }
.dex-info {
  flex: 1; min-width: 180px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 0.8rem;
}
.dex-row { display: flex; gap: 0.4rem; align-items: baseline; font-size: 0.8rem; }
.dex-row.full { grid-column: 1 / -1; }
.dex-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); white-space: nowrap; }
.dex-prices {
  display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start;
}
.dex-price {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.35rem 0.6rem; border-radius: 8px;
  background: rgba(255,255,255,0.8); border: 1px solid rgba(107,142,58,0.12);
}
.dex-val { font-weight: 700; font-size: 0.9rem; }
.dex-footer { margin-top: 0.5rem; }
.dex-footer a { text-decoration: none; }

@media (max-width: 768px) {
  .inv-table { min-width: 0; font-size: 0.78rem; }
  .inv-table thead th { padding: 0.4rem 0.5rem; font-size: 0.68rem; }
  .inv-table tbody td { padding: 0.35rem 0.5rem; }

  .inv-table th:nth-child(1),
  .inv-table td:nth-child(1):not(.detail-expand-row td),
  .inv-table th:nth-child(2),
  .inv-table td:nth-child(2):not(.detail-expand-row td),
  .inv-table th:nth-child(4),
  .inv-table td:nth-child(4):not(.detail-expand-row td),
  .inv-table th:nth-child(6),
  .inv-table td:nth-child(6):not(.detail-expand-row td),
  .inv-table th:nth-child(7),
  .inv-table td:nth-child(7):not(.detail-expand-row td) {
    display: none;
  }

  .detail-expand-row td { display: table-cell !important; }
  .detail-expand-box { padding: 0.6rem 0.5rem; }
  .dex-info { grid-template-columns: 1fr; }

  .desc-cell { max-width: none; min-width: 0; }
  .desc-name { white-space: normal; }

  .action-buttons { gap: 0.2rem; }
  .action-buttons .btn-sm { padding: 0.3rem 0.5rem; font-size: 0.75rem; }
}

@media (max-width: 480px) {
  .container { padding: 0.6rem 0.5rem; }
  .toolbar-actions { gap: 0.3rem; }
  .search-input { font-size: 0.8rem; }
}

@media (max-width: 768px) {
  .btn-vaciar { padding: 0.45rem 0.7rem; }
  .vaciar-label { display: none; }
}
</style>
