<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Registro de productos</h2>
        <div class="toolbar-actions">
          <div class="filter-chips">
            <button
              v-for="f in filterOptions" :key="f.value"
              :class="['chip', { active: activeFilter === f.value }]"
              @click="activeFilter = f.value"
            >{{ f.label }}</button>
          </div>
        </div>
      </div>

      <InventorySubNav />

      <div v-if="loading" class="empty-state">Cargando registro...</div>
      <div v-else-if="error" class="empty-state" style="color:#dc2626">{{ error }}</div>
      <div v-else-if="filtered.length === 0" class="empty-state">No hay registros.</div>

      <div v-else class="log-list">
        <div v-for="log in filtered" :key="log._id" :class="['log-card', actionClass(log.action)]">
          <div class="log-icon">
            <i :class="actionIcon(log.action)"></i>
          </div>
          <div class="log-body">
            <div class="log-desc">{{ log.description }}</div>
            <div class="log-meta">
              <span class="log-actor">
                <i class="bi bi-person"></i>
                {{ log.actor?.name || 'Sistema' }}
              </span>
              <span class="log-date">{{ formatDate(log.createdAt) }}</span>
            </div>
            <div v-if="log.metadata?.code" class="log-detail">
              <code>{{ log.metadata.code }}</code>
              <span v-if="log.metadata.grupo" class="log-grupo">{{ log.metadata.grupo }}</span>
              <span v-if="log.metadata.precio" class="log-precio">${{ log.metadata.precio }}</span>
            </div>
          </div>
          <div class="log-badge">
            <span :class="['badge', badgeClass(log.action)]">{{ actionLabel(log.action) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import InventorySubNav from '@/components/InventorySubNav.vue'

const logs = ref([])
const loading = ref(false)
const error = ref(null)
const activeFilter = ref('all')

const filterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Agregados', value: 'CREATE_PRODUCT' },
  { label: 'Eliminados', value: 'DELETE_PRODUCT' },
  { label: 'Actualizados', value: 'UPDATE_PRODUCT' },
]

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE_URL}/products/audit-log`, authHeader())
    logs.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Error cargando registro'
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  if (activeFilter.value === 'all') return logs.value
  return logs.value.filter(l => l.action === activeFilter.value)
})

function actionIcon(action) {
  if (action === 'CREATE_PRODUCT') return 'bi bi-plus-circle-fill'
  if (action === 'DELETE_PRODUCT' || action === 'DELETE_ALL_PRODUCTS') return 'bi bi-trash-fill'
  if (action === 'UPDATE_PRODUCT') return 'bi bi-pencil-fill'
  return 'bi bi-info-circle'
}

function actionLabel(action) {
  if (action === 'CREATE_PRODUCT') return 'Alta'
  if (action === 'DELETE_PRODUCT') return 'Baja'
  if (action === 'DELETE_ALL_PRODUCTS') return 'Vaciado'
  if (action === 'UPDATE_PRODUCT') return 'Modificado'
  return action
}

function actionClass(action) {
  if (action === 'CREATE_PRODUCT') return 'log-create'
  if (action === 'DELETE_PRODUCT' || action === 'DELETE_ALL_PRODUCTS') return 'log-delete'
  if (action === 'UPDATE_PRODUCT') return 'log-update'
  return ''
}

function badgeClass(action) {
  if (action === 'CREATE_PRODUCT') return 'badge-ok'
  if (action === 'DELETE_PRODUCT' || action === 'DELETE_ALL_PRODUCTS') return 'badge-danger'
  if (action === 'UPDATE_PRODUCT') return 'badge-warning'
  return ''
}

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.filter-chips {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.chip {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(107,142,58,0.2);
  background: rgba(107,142,58,0.06);
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chip:hover { background: rgba(107,142,58,0.14); color: var(--color-text); }
.chip.active { background: var(--color-primary, #6b8e3a); color: #fff; border-color: transparent; }

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.log-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
}

.log-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.log-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.log-create .log-icon { background: rgba(67,160,71,0.12); color: #43a047; }
.log-delete .log-icon { background: rgba(220,38,38,0.12); color: #dc2626; }
.log-update .log-icon { background: rgba(251,140,0,0.12); color: #fb8c00; }

.log-body { flex: 1; min-width: 0; }

.log-desc {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text, #2d3d24);
  margin-bottom: 0.25rem;
}

.log-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--color-muted);
}

.log-actor { display: flex; align-items: center; gap: 0.3rem; }

.log-detail {
  margin-top: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.log-detail code {
  font-size: 0.78rem;
  padding: 0.15rem 0.5rem;
  background: rgba(107,142,58,0.08);
  border-radius: 6px;
  font-weight: 600;
}

.log-grupo {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  background: rgba(107,142,58,0.1);
  border-radius: 6px;
  color: var(--color-primary, #6b8e3a);
  font-weight: 600;
}

.log-precio {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text);
}

.log-badge { flex-shrink: 0; }

.badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-ok { background: rgba(67,160,71,0.12); color: #2e7d32; }
.badge-danger { background: rgba(220,38,38,0.12); color: #dc2626; }
.badge-warning { background: rgba(251,140,0,0.12); color: #e65100; }

@media (max-width: 600px) {
  .log-card { flex-wrap: wrap; }
  .log-badge { width: 100%; text-align: right; }
}
</style>
