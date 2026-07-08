<template>
  <div class="mka-wrap">

    <!-- Toolbar -->
    <div class="mka-toolbar">
      <div class="mka-search-box">
        <i class="bi bi-search mka-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar cuenta, razón social, email..." class="mka-search" />
      </div>
      <select v-model="filterTipo" class="mka-select">
        <option value="">Todos los tipos</option>
        <option value="normal">Cliente</option>
        <option value="potencial">Potencial</option>
      </select>
      <select v-model="filterPipeline" class="mka-select">
        <option value="">Todas las etapas</option>
        <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
      </select>
      <div class="mka-count">{{ filtered.length }} cuenta{{ filtered.length !== 1 ? 's' : '' }}</div>
    </div>

    <!-- Table -->
    <div class="mka-table-wrap">
      <div v-if="!mStore.accounts.length" class="mka-empty">
        <i class="bi bi-building-x"></i>
        <p>No hay cuentas registradas. Agregá clientes en el CRM.</p>
      </div>
      <table v-else class="mka-table">
        <thead>
          <tr>
            <th @click="toggleSort('codigoCliente')" class="mka-th--sort">
              Cód. <i :class="sortIcon('codigoCliente')"></i>
            </th>
            <th @click="toggleSort('razonSocial')" class="mka-th--sort">
              Razón social <i :class="sortIcon('razonSocial')"></i>
            </th>
            <th>Contacto</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Etapa</th>
            <th>Tipo</th>
            <th class="mka-th-center">Campañas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="8" class="mka-td-empty">Sin resultados para la búsqueda</td>
          </tr>
          <tr v-for="c in filtered" :key="c._id" class="mka-row" @click="goToClient(c._id)">
            <td>
              <span v-if="c.codigoCliente" class="mka-cod">#{{ c.codigoCliente }}</span>
              <span v-else class="mka-empty-cell">—</span>
            </td>
            <td>
              <div class="mka-account">
                <div class="mka-avatar" :style="{ background: avatarColor(c.razonSocial || c.name || '') }">
                  {{ initials(c.razonSocial || c.name || '?') }}
                </div>
                <div>
                  <div class="mka-razon">{{ c.razonSocial || c.name || '—' }}</div>
                  <div v-if="c.nombreComercial" class="mka-comercial">{{ c.nombreComercial }}</div>
                </div>
              </div>
            </td>
            <td class="mka-contact">{{ c.contactoPrincipal || '—' }}</td>
            <td class="mka-email">
              <a v-if="c.email" :href="`mailto:${c.email}`" @click.stop>{{ c.email }}</a>
              <span v-else class="mka-empty-cell">—</span>
            </td>
            <td class="mka-tel">
              <template v-if="c.telefonos?.length">{{ c.telefonos[0].numero }}</template>
              <template v-else-if="c.telefono">{{ c.telefono }}</template>
              <span v-else class="mka-empty-cell">—</span>
            </td>
            <td>
              <span class="mka-stage"
                :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
                {{ stageLabel(c.pipelineEstado) }}
              </span>
            </td>
            <td>
              <span class="mka-tipo" :class="`mka-tipo--${c.tipoCliente}`">
                {{ c.tipoCliente === 'normal' ? 'Cliente' : 'Potencial' }}
              </span>
            </td>
            <td class="mka-td-center">
              <span class="mka-camp-count" :class="{ 'mka-camp-count--active': campaignCount(c._id) > 0 }">
                {{ campaignCount(c._id) }}
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

const search         = ref('')
const filterTipo     = ref('')
const filterPipeline = ref('')
const sortKey        = ref('razonSocial')
const sortDir        = ref(1)

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

function campaignCount(clientId) {
  return mStore.campaigns.filter(camp => {
    const targets = mStore.campaignTargets(camp)
    return targets.some(t => String(t._id) === String(clientId))
  }).length
}

const filtered = computed(() => {
  let list = mStore.accounts
  if (filterTipo.value)     list = list.filter(c => c.tipoCliente === filterTipo.value)
  if (filterPipeline.value) list = list.filter(c => c.pipelineEstado === filterPipeline.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c =>
      rx.test(c.razonSocial) || rx.test(c.nombreComercial) ||
      rx.test(c.contactoPrincipal) || rx.test(c.email) || rx.test(c.name)
    )
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
  if (sortKey.value !== key) return 'bi bi-arrow-down-up mka-sort-ico mka-sort-ico--off'
  return sortDir.value === 1 ? 'bi bi-arrow-up mka-sort-ico' : 'bi bi-arrow-down mka-sort-ico'
}

function goToClient(id) {
  router.push({ path: '/crm', query: { clientId: id } })
}
</script>

<style scoped>
.mka-wrap { min-width: 0; }

.mka-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.6rem;
  align-items: center; margin-bottom: 1rem;
}
.mka-search-box { position: relative; flex: 1; min-width: 180px; }
.mka-search-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.mka-search {
  width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.1rem;
  border-radius: 10px; font-size: 0.82rem;
}
.mka-select { padding: 0.55rem 0.9rem; border-radius: 10px; font-size: 0.8rem; min-width: 140px; }
.mka-count  { font-size: 0.75rem; color: var(--color-muted); margin-left: auto; white-space: nowrap; }

.mka-table-wrap { overflow-x: auto; }
.mka-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  padding: 3rem 1rem; color: var(--color-muted); font-size: 0.82rem; text-align: center;
}
.mka-empty i { font-size: 2.5rem; opacity: .3; }

.mka-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; min-width: 780px; }
.mka-table th {
  text-align: left; padding: 0.5rem 0.75rem;
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-muted); border-bottom: 1.5px solid rgba(107,142,58,.12);
  white-space: nowrap;
}
.mka-th--sort { cursor: pointer; user-select: none; }
.mka-th--sort:hover { color: var(--color-primary); }
.mka-th-center { text-align: center; }
.mka-sort-ico     { font-size: 0.65rem; margin-left: 3px; color: var(--color-primary); }
.mka-sort-ico--off { opacity: .35; }

.mka-row { cursor: pointer; transition: background .12s; }
.mka-row:hover { background: rgba(107,142,58,.04); }
.mka-table td { padding: 0.55rem 0.75rem; border-bottom: 1px solid rgba(107,142,58,.06); vertical-align: middle; }
.mka-td-empty  { text-align: center; color: var(--color-muted); padding: 1.5rem; font-size: 0.8rem; }
.mka-td-center { text-align: center; }

.mka-cod { font-size: 0.72rem; font-weight: 700; color: var(--color-primary); }
.mka-account { display: flex; align-items: center; gap: 0.6rem; }
.mka-avatar  { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; text-transform: uppercase; }
.mka-razon   { font-weight: 600; line-height: 1.2; }
.mka-comercial { font-size: 0.68rem; color: var(--color-muted); }
.mka-contact { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mka-email   { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.mka-email a, .mka-tel a { color: var(--color-primary); text-decoration: none; }
.mka-email a:hover, .mka-tel a:hover { text-decoration: underline; }
.mka-empty-cell { color: var(--color-muted); }

.mka-stage {
  display: inline-flex; align-items: center;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; white-space: nowrap;
}
.mka-tipo { display: inline-flex; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; }
.mka-tipo--normal    { background: rgba(107,142,58,.12); color: #4d6728; }
.mka-tipo--potencial { background: rgba(59,130,246,.12); color: #1d4ed8; }

.mka-camp-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  font-size: 0.72rem; font-weight: 700;
  background: rgba(107,142,58,.08); color: var(--color-muted);
}
.mka-camp-count--active { background: rgba(107,142,58,.18); color: var(--color-primary); }
</style>
