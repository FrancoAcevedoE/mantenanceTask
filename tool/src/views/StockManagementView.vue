<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Gestión de Stock</h2>
        <div v-if="canManage" class="toolbar-actions">
          <button @click="openModal('ingreso')">
            <i class="bi bi-box-arrow-in-down"></i> Agregar ingreso
          </button>
          <button class="secondary-button" @click="openModal('salida')">
            <i class="bi bi-box-arrow-up"></i> Registrar salida
          </button>
          <button class="ghost-button" @click="openModal('ajuste')">
            <i class="bi bi-pencil-square"></i> Ajuste manual
          </button>
        </div>
      </div>

      <InventorySubNav />

      <!-- Summary cards -->
      <div class="stock-summary">
        <div class="sum-card">
          <i class="bi bi-boxes sum-icon"></i>
          <div>
            <span class="sum-label">Total unidades</span>
            <span class="sum-val">{{ store.totalStock }}</span>
          </div>
        </div>
        <div class="sum-card sum-card--ok">
          <i class="bi bi-check-circle sum-icon"></i>
          <div>
            <span class="sum-label">Con stock</span>
            <span class="sum-val">{{ withStock }}</span>
          </div>
        </div>
        <div class="sum-card sum-card--warning">
          <i class="bi bi-exclamation-triangle sum-icon"></i>
          <div>
            <span class="sum-label">Stock bajo (≤5)</span>
            <span class="sum-val">{{ store.lowStockProducts.length }}</span>
          </div>
        </div>
        <div class="sum-card sum-card--danger">
          <i class="bi bi-x-circle sum-icon"></i>
          <div>
            <span class="sum-label">Sin stock</span>
            <span class="sum-val">{{ store.noStockProducts.length }}</span>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="stock-toolbar">
        <div class="search-wrap">
          <i class="bi bi-search search-icon"></i>
          <input v-model="search" class="search-input" placeholder="Buscar producto..." />
        </div>
        <select v-model="stockFilter" class="filter-sel">
          <option value="all">Todos</option>
          <option value="low">Stock bajo</option>
          <option value="none">Sin stock</option>
        </select>
      </div>

      <!-- Table -->
      <div v-if="store.loading" class="empty-state">Cargando...</div>
      <div v-else class="table-scroll">
        <table class="history-table stock-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Grupo</th>
              <th>Precio/m²</th>
              <th>Stock actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p._id" :class="rowClass(p.stock)">
              <td><code class="code-sm">{{ p.code }}</code></td>
              <td class="desc-cell">{{ p.name }}</td>
              <td>{{ p.grupo || '—' }}</td>
              <td>${{ fmt(p.pricePerM2) }}</td>
              <td class="stock-val">{{ p.stock ?? 0 }}</td>
              <td><span :class="badgeClass(p.stock)">{{ badgeLabel(p.stock) }}</span></td>
              <td>
                <div v-if="canManage" class="action-buttons">
                  <button class="btn-sm secondary-button" title="Ingreso" @click="openModalFor(p, 'ingreso')">
                    <i class="bi bi-plus-lg"></i>
                  </button>
                  <button class="btn-sm secondary-button" title="Salida" @click="openModalFor(p, 'salida')">
                    <i class="bi bi-dash-lg"></i>
                  </button>
                  <button class="btn-sm ghost-button" title="Ajuste" @click="openModalFor(p, 'ajuste')">
                    <i class="bi bi-pencil"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredProducts.length">
              <td colspan="7" class="empty-row">Sin resultados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Movements log -->
      <div v-if="movements.length" class="movements-section">
        <h3>Últimos movimientos</h3>
        <div class="movements-list">
          <div v-for="(m, i) in movements.slice().reverse()" :key="i" class="movement-item">
            <div class="mov-icon" :class="`mov-${m.type}`">
              <i :class="movIcon(m.type)"></i>
            </div>
            <div class="mov-info">
              <strong>{{ m.productName }}</strong>
              <span>{{ movLabel(m.type) }} {{ m.type === 'ajuste' ? '→ ' + m.quantity : (m.type === 'ingreso' ? '+' : '-') + m.quantity }}</span>
            </div>
            <span class="mov-time">{{ m.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal" v-if="modal.open" @click.self="closeModal">
    <div class="modal-box modal-box-detail">
      <h3>{{ modalTitle }}</h3>
      <p class="modal-product-name">{{ modal.product?.name }}</p>

      <div class="field">
        <label>{{ modal.type === 'ajuste' ? 'Nuevo stock' : 'Cantidad' }}</label>
        <input v-model.number="modal.quantity" type="number" min="0" placeholder="0" autofocus />
      </div>

      <div class="field">
        <label>Observación (opcional)</label>
        <input v-model="modal.note" type="text" placeholder="Motivo, proveedor, etc." />
      </div>

      <div class="modal-actions">
        <button @click="confirmMovement" :disabled="modal.saving">
          {{ modal.saving ? 'Guardando...' : 'Confirmar' }}
        </button>
        <button class="secondary-button" @click="closeModal">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'
import { usePermissions } from '@/utils/permissions'

const { canManage } = usePermissions()

const store = useProductsStore()
const toast = useToast()

const search = ref('')
const stockFilter = ref('all')
const movements = ref([])

const modal = ref({ open: false, type: 'ingreso', product: null, quantity: null, note: '', saving: false })

onMounted(() => { if (!store.products.length) store.fetchProducts() })

const withStock = computed(() => store.products.filter(p => (p.stock || 0) > 0).length)

const filteredProducts = computed(() => {
  let list = store.products
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.code?.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q))
  }
  if (stockFilter.value === 'low') list = list.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5)
  if (stockFilter.value === 'none') list = list.filter(p => (p.stock || 0) === 0)
  return list
})

const modalTitle = computed(() => {
  if (modal.value.type === 'ingreso') return '📦 Agregar ingreso de stock'
  if (modal.value.type === 'salida') return '📤 Registrar salida de stock'
  return '✏️ Ajuste manual de stock'
})

function openModal(type) {
  modal.value = { open: true, type, product: null, quantity: null, note: '', saving: false }
}

function openModalFor(product, type) {
  modal.value = { open: true, type, product, quantity: null, note: '', saving: false }
}

function closeModal() {
  modal.value.open = false
}

async function confirmMovement() {
  if (modal.value.quantity === null || modal.value.quantity < 0) {
    toast.error('Ingrese una cantidad válida.')
    return
  }
  if (!modal.value.product) {
    toast.error('Seleccione un producto.')
    return
  }

  modal.value.saving = true
  try {
    const p = modal.value.product
    const currentStock = p.stock ?? 0
    let newStock = currentStock

    if (modal.value.type === 'ingreso') newStock = currentStock + modal.value.quantity
    else if (modal.value.type === 'salida') newStock = Math.max(0, currentStock - modal.value.quantity)
    else newStock = modal.value.quantity

    await store.updateProduct(p._id, { stock: newStock })

    movements.value.push({
      type: modal.value.type,
      productName: p.name,
      quantity: modal.value.quantity,
      note: modal.value.note,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    })

    toast.success('Stock actualizado correctamente.')
    closeModal()
  } catch {
    toast.error('Error al actualizar el stock.')
  } finally {
    modal.value.saving = false
  }
}

function rowClass(stock) {
  const n = stock ?? 0
  if (n === 0) return 'row-danger'
  if (n <= 5) return 'row-warning'
  return ''
}

function badgeClass(stock) {
  const n = stock ?? 0
  if (n === 0) return 'badge badge-danger'
  if (n <= 5) return 'badge badge-warning'
  return 'badge badge-ok'
}

function badgeLabel(stock) {
  const n = stock ?? 0
  if (n === 0) return 'Sin stock'
  if (n <= 5) return 'Stock bajo'
  return 'OK'
}

function movIcon(type) {
  if (type === 'ingreso') return 'bi bi-box-arrow-in-down'
  if (type === 'salida') return 'bi bi-box-arrow-up'
  return 'bi bi-pencil-square'
}

function movLabel(type) {
  if (type === 'ingreso') return 'Ingreso'
  if (type === 'salida') return 'Salida'
  return 'Ajuste'
}

function fmt(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.topbar { margin-bottom: 1.2rem; }

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.75rem;
}

.stock-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.sum-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: rgba(107,142,58,0.07);
  border: 1px solid rgba(107,142,58,0.16);
  border-radius: 18px;
}

.sum-card--ok { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.2); }
.sum-card--warning { background: rgba(234,179,8,0.07); border-color: rgba(234,179,8,0.22); }
.sum-card--danger { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.18); }

.sum-icon { font-size: 1.5rem; color: var(--color-primary); opacity: 0.7; flex-shrink: 0; }

.sum-card > div { display: flex; flex-direction: column; gap: 0.1rem; }
.sum-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.sum-val { font-size: 1.5rem; font-weight: 700; font-family: 'Poppins', sans-serif; color: var(--color-text); line-height: 1; }

.stock-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: center;
}

.search-wrap { position: relative; flex: 1 1 200px; min-width: 160px; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--color-muted); font-size: 0.9rem; pointer-events: none; }
.search-input { padding-left: 2.4rem !important; }
.filter-sel { flex: 0 0 160px; }

.table-scroll { overflow-x: auto; border-radius: 16px; border: 1px solid rgba(107,142,58,0.14); margin-bottom: 1.5rem; }

.stock-table { min-width: 700px; }
.stock-table thead th { background: rgba(107,142,58,0.08); font-size: 0.78rem; white-space: nowrap; }

.row-warning td { background: rgba(234,179,8,0.04); }
.row-danger td { background: rgba(239,68,68,0.04); }

.code-sm {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  background: rgba(107,142,58,0.1);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.desc-cell { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stock-val { font-weight: 700; font-size: 1.05rem; }

.badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.badge-ok { background: rgba(34,197,94,0.12); color: #15803d; }
.badge-warning { background: rgba(234,179,8,0.14); color: #b45309; }
.badge-danger { background: rgba(239,68,68,0.12); color: #b91c1c; }

.btn-sm { padding: 0.35rem 0.65rem !important; font-size: 0.8rem; border-radius: 10px !important; min-width: 0 !important; }

.action-buttons { display: flex; gap: 0.35rem; }

.empty-row { text-align: center; padding: 2rem; color: var(--color-muted); font-style: italic; }

.movements-section { margin-top: 1.5rem; }
.movements-section h3 { font-size: 1rem; margin-bottom: 1rem; }
.movements-list { display: flex; flex-direction: column; gap: 0.6rem; }

.movement-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(107,142,58,0.1);
  border-radius: 14px;
}

.mov-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.mov-ingreso { background: rgba(34,197,94,0.15); color: #15803d; }
.mov-salida { background: rgba(239,68,68,0.12); color: #b91c1c; }
.mov-ajuste { background: rgba(107,142,58,0.12); color: var(--color-primary); }

.mov-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.85rem; }
.mov-info strong { font-size: 0.88rem; text-transform: none; }
.mov-info span { text-transform: none; color: var(--color-muted); font-size: 0.8rem; letter-spacing: 0; }

.mov-time { font-size: 0.75rem; color: var(--color-muted); white-space: nowrap; }

.modal .field { margin-bottom: 1rem; }
.modal .field label { display: block; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-muted); margin-bottom: 0.4rem; }

.modal-product-name { font-weight: 600; margin-bottom: 1rem; color: var(--color-primary); text-transform: none; letter-spacing: 0; }

.modal-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.2rem; }
</style>
