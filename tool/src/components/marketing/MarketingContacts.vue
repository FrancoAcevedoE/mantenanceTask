<template>
  <div class="mkc-wrap">

    <!-- Toolbar -->
    <div class="mkc-toolbar">
      <div class="mkc-search-box">
        <i class="bi bi-search mkc-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar contacto, empresa o email..." class="mkc-search" />
      </div>
      <select v-model="filterTipo" class="mkc-select">
        <option value="">Todos los tipos</option>
        <option value="normal">Cliente</option>
        <option value="potencial">Potencial</option>
      </select>
      <select v-model="filterPipeline" class="mkc-select">
        <option value="">Todas las etapas</option>
        <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <div class="mkc-count">{{ filtered.length }} contacto{{ filtered.length !== 1 ? 's' : '' }}</div>
    </div>

    <!-- Table -->
    <div class="mkc-table-wrap">
      <div v-if="!mStore.contacts.length" class="mkc-empty">
        <i class="bi bi-person-x"></i>
        <p>No hay contactos registrados. Agregá clientes en el CRM con nombre de contacto.</p>
      </div>
      <table v-else class="mkc-table">
        <thead>
          <tr>
            <th @click="toggleSort('nombre')" class="mkc-th--sort">
              Contacto <i :class="sortIcon('nombre')"></i>
            </th>
            <th @click="toggleSort('empresa')" class="mkc-th--sort">
              Cuenta <i :class="sortIcon('empresa')"></i>
            </th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Etapa</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="6" class="mkc-td-empty">Sin resultados para la búsqueda</td>
          </tr>
          <tr v-for="c in filtered" :key="c._id" class="mkc-row" @click="goToClient(c._id)">
            <td>
              <div class="mkc-person">
                <div class="mkc-avatar" :style="{ background: avatarColor(c.nombre || c.empresa) }">
                  {{ initials(c.nombre || c.empresa) }}
                </div>
                <div>
                  <div class="mkc-name">{{ c.nombre || '—' }}</div>
                  <div v-if="c.codigoCliente" class="mkc-cod">#{{ c.codigoCliente }}</div>
                </div>
              </div>
            </td>
            <td class="mkc-empresa">{{ c.empresa || '—' }}</td>
            <td class="mkc-email">
              <a v-if="c.email" :href="`mailto:${c.email}`" @click.stop>{{ c.email }}</a>
              <span v-else class="mkc-empty-cell">—</span>
            </td>
            <td class="mkc-tel">
              <a v-if="c.telefono" :href="`tel:${c.telefono}`" @click.stop>{{ c.telefono }}</a>
              <span v-else class="mkc-empty-cell">—</span>
            </td>
            <td>
              <span class="mkc-stage" :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
                {{ stageLabel(c.pipelineEstado) }}
              </span>
            </td>
            <td>
              <span class="mkc-tipo" :class="`mkc-tipo--${c.tipoCliente}`">
                {{ c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMarketingStore } from '@/stores/marketing'
import { useRouter } from 'vue-router'

const mStore = useMarketingStore()
const router = useRouter()

const search       = ref('')
const filterTipo   = ref('')
const filterPipeline = ref('')
const sortKey      = ref('nombre')
const sortDir      = ref(1)

const STAGES = [
  { key: 'nuevo_lead',         label: 'Nuevo lead',  color: '#3b82f6' },
  { key: 'contactado',         label: 'Contactado',  color: '#8b5cf6' },
  { key: 'cotizacion_enviada', label: 'Cotizado',    color: '#f59e0b' },
  { key: 'ganado',             label: 'Ganado',      color: '#22c55e' },
  { key: 'perdido',            label: 'Perdido',     color: '#ef4444' },
]
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
function stageLabel(k) { return STAGE_MAP[k]?.label || k }
function stageColor(k) { return STAGE_MAP[k]?.color || '#94a3b8' }

const AVATAR_COLORS = ['#1d4ed8','#6d28d9','#b45309','#4338ca','#15803d','#be185d','#4d6728','#b91c1c']
function avatarColor(name) {
  let n = 0; for (const c of (name||'')) n += c.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '?').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

const filtered = computed(() => {
  let list = mStore.contacts
  if (filterTipo.value)     list = list.filter(c => c.tipoCliente === filterTipo.value)
  if (filterPipeline.value) list = list.filter(c => c.pipelineEstado === filterPipeline.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c => rx.test(c.nombre) || rx.test(c.empresa) || rx.test(c.email) || rx.test(c.telefono))
  }
  return [...list].sort((a, b) => {
    const va = (a[sortKey.value] || '').toLowerCase()
    const vb = (b[sortKey.value] || '').toLowerCase()
    return va < vb ? -sortDir.value : va > vb ? sortDir.value : 0
  })
})

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else { sortKey.value = key; sortDir.value = 1 }
}
function sortIcon(key) {
  if (sortKey.value !== key) return 'bi bi-arrow-down-up mkc-sort-ico mkc-sort-ico--off'
  return sortDir.value === 1 ? 'bi bi-arrow-up mkc-sort-ico' : 'bi bi-arrow-down mkc-sort-ico'
}

function goToClient(id) {
  router.push({ path: '/crm', query: { clientId: id } })
}
</script>

<style scoped>
.mkc-wrap { min-width: 0; }

.mkc-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.6rem;
  align-items: center; margin-bottom: 1rem;
}
.mkc-search-box { position: relative; flex: 1; min-width: 180px; }
.mkc-search-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.mkc-search {
  width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.1rem;
  border-radius: 10px; font-size: 0.82rem;
}
.mkc-select { padding: 0.55rem 0.9rem; border-radius: 10px; font-size: 0.8rem; min-width: 140px; }
.mkc-count  { font-size: 0.75rem; color: var(--color-muted); margin-left: auto; white-space: nowrap; }

.mkc-table-wrap { overflow-x: auto; }
.mkc-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  padding: 3rem 1rem; color: var(--color-muted); font-size: 0.82rem; text-align: center;
}
.mkc-empty i { font-size: 2.5rem; opacity: .3; }

.mkc-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; min-width: 640px; }
.mkc-table th {
  text-align: left; padding: 0.5rem 0.75rem;
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-muted); border-bottom: 1.5px solid rgba(107,142,58,.12);
  white-space: nowrap;
}
.mkc-th--sort { cursor: pointer; user-select: none; }
.mkc-th--sort:hover { color: var(--color-primary); }
.mkc-sort-ico     { font-size: 0.65rem; margin-left: 3px; color: var(--color-primary); }
.mkc-sort-ico--off { opacity: .35; }

.mkc-row { cursor: pointer; transition: background .12s; }
.mkc-row:hover { background: rgba(107,142,58,.04); }
.mkc-table td { padding: 0.55rem 0.75rem; border-bottom: 1px solid rgba(107,142,58,.06); vertical-align: middle; }
.mkc-td-empty { text-align: center; color: var(--color-muted); padding: 1.5rem; font-size: 0.8rem; }

.mkc-person  { display: flex; align-items: center; gap: 0.6rem; }
.mkc-avatar  { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; text-transform: uppercase; }
.mkc-name    { font-weight: 600; line-height: 1.2; }
.mkc-cod     { font-size: 0.65rem; color: var(--color-primary); font-weight: 700; }
.mkc-empresa { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mkc-email   { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.mkc-email a, .mkc-tel a { color: var(--color-primary); text-decoration: none; }
.mkc-email a:hover, .mkc-tel a:hover { text-decoration: underline; }
.mkc-empty-cell { color: var(--color-muted); }

.mkc-stage {
  display: inline-flex; align-items: center;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; white-space: nowrap;
}
.mkc-tipo {
  display: inline-flex; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
}
.mkc-tipo--normal    { background: rgba(107,142,58,.12); color: #4d6728; }
.mkc-tipo--potencial { background: rgba(59,130,246,.12); color: #1d4ed8; }
</style>
