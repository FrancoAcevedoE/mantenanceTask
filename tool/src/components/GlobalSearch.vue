<template>
  <Teleport to="body">
    <div v-if="open" class="gs-backdrop" @click.self="close">
      <div class="gs-modal" role="dialog" aria-label="Búsqueda global">
        <div class="gs-input-wrap">
          <i class="bi bi-search gs-icon"></i>
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Buscar clientes, productos, campañas..."
            class="gs-input"
            autocomplete="off"
            @keydown.escape="close"
            @keydown.down.prevent="moveDown"
            @keydown.up.prevent="moveUp"
            @keydown.enter.prevent="selectCurrent"
          />
          <span class="gs-esc-chip" @click="close">ESC</span>
        </div>

        <div v-if="results.length" class="gs-results">
          <div v-for="(group, gi) in resultGroups" :key="group.key" class="gs-group">
            <div class="gs-group-label">
              <i :class="group.icon"></i> {{ group.label }}
            </div>
            <div
              v-for="(item, ii) in group.items"
              :key="item.key"
              class="gs-item"
              :class="{ 'gs-item--active': globalIndex(gi, ii) === cursor }"
              @click="navigate(item)"
              @mouseenter="cursor = globalIndex(gi, ii)"
            >
              <i :class="item.icon" class="gs-item-icon"></i>
              <div class="gs-item-body">
                <div class="gs-item-title">{{ item.title }}</div>
                <div v-if="item.sub" class="gs-item-sub">{{ item.sub }}</div>
              </div>
              <i class="bi bi-arrow-return-left gs-item-enter"></i>
            </div>
          </div>
        </div>

        <div v-else-if="query.length >= 2" class="gs-empty">
          <i class="bi bi-search"></i>
          Sin resultados para "{{ query }}"
        </div>

        <div v-else class="gs-hint">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>Ctrl+K</kbd> cerrar</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCrmStore } from '@/stores/crm'
import { useMarketingStore } from '@/stores/marketing'
import { useProductsStore } from '@/stores/products'

const router = useRouter()
const crmStore = useCrmStore()
const mStore = useMarketingStore()
const productsStore = useProductsStore()

const open = ref(false)
const query = ref('')
const cursor = ref(0)
const inputRef = ref(null)

function openSearch() {
  open.value = true
  query.value = ''
  cursor.value = 0
  nextTick(() => inputRef.value?.focus())
}
function close() { open.value = false; query.value = '' }

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    open.value ? close() : openSearch()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

defineExpose({ openSearch, close })

function escapeRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

const results = computed(() => {
  const q = query.value.trim()
  if (q.length < 2) return []
  const rx = new RegExp(escapeRx(q), 'i')
  const out = []

  // Clientes
  let clientCount = 0
  for (const c of (crmStore.visibleClients || [])) {
    if (clientCount >= 5) break
    if (rx.test(c.razonSocial) || rx.test(c.nombreComercial) || rx.test(c.contactoPrincipal) || rx.test(c.codigoCliente) || rx.test(c.email)) {
      out.push({
        key: 'c_' + c._id,
        category: 'clientes',
        icon: 'bi bi-person-fill',
        title: c.razonSocial || c.name || '—',
        sub: [c.codigoCliente ? '#' + c.codigoCliente : '', c.nombreComercial].filter(Boolean).join(' · ') || c.email || '',
        action: () => router.push('/crm'),
      })
      clientCount++
    }
  }

  // Productos
  let prodCount = 0
  for (const p of (productsStore.products || [])) {
    if (prodCount >= 5) break
    if (rx.test(p.name) || rx.test(p.sku) || rx.test(p.descripcion)) {
      out.push({
        key: 'p_' + p._id,
        category: 'productos',
        icon: 'bi bi-box-seam',
        title: p.name || '—',
        sub: p.sku || '',
        action: () => router.push('/inventory'),
      })
      prodCount++
    }
  }

  // Campañas
  let campCount = 0
  for (const c of (mStore.campaigns || [])) {
    if (campCount >= 4) break
    if (rx.test(c.nombre) || rx.test(c.descripcion)) {
      out.push({
        key: 'm_' + c._id,
        category: 'campanas',
        icon: 'bi bi-megaphone-fill',
        title: c.nombre || '—',
        sub: c.estado || '',
        action: () => router.push('/marketing'),
      })
      campCount++
    }
  }

  return out
})

const resultGroups = computed(() => {
  const defs = [
    { key: 'clientes', label: 'Clientes',  icon: 'bi bi-people-fill' },
    { key: 'productos', label: 'Productos', icon: 'bi bi-box-seam' },
    { key: 'campanas',  label: 'Campañas',  icon: 'bi bi-megaphone-fill' },
  ]
  return defs
    .map(d => ({ ...d, items: results.value.filter(r => r.category === d.key) }))
    .filter(g => g.items.length)
})

function globalIndex(gi, ii) {
  let idx = 0
  for (let g = 0; g < gi; g++) idx += resultGroups.value[g].items.length
  return idx + ii
}

const totalResults = computed(() => results.value.length)

function moveDown() { if (!totalResults.value) return; cursor.value = (cursor.value + 1) % totalResults.value }
function moveUp()   { if (!totalResults.value) return; cursor.value = (cursor.value - 1 + totalResults.value) % totalResults.value }

function selectCurrent() {
  const flat = resultGroups.value.flatMap(g => g.items)
  const item = flat[cursor.value]
  if (item) navigate(item)
}

function navigate(item) { item.action(); close() }

watch(results, () => { cursor.value = 0 })
</script>

<style scoped>
.gs-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: clamp(4rem, 12vh, 9rem);
  animation: gs-bg-in 0.15s ease;
}
@keyframes gs-bg-in { from { opacity: 0 } to { opacity: 1 } }

.gs-modal {
  width: min(600px, calc(100vw - 2rem));
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06);
  overflow: hidden;
  animation: gs-modal-in 0.15s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes gs-modal-in {
  from { transform: scale(0.94) translateY(-10px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.gs-input-wrap {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid #f1f5f9;
}
.gs-icon { font-size: 1.15rem; color: #94a3b8; flex-shrink: 0; }
.gs-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 1.05rem; color: #1e293b;
  padding: 0; line-height: 1.4;
  width: 100%;
}
.gs-input::placeholder { color: #94a3b8; }
.gs-esc-chip {
  font-size: 0.72rem; font-weight: 600; color: #94a3b8;
  background: #f1f5f9; border-radius: 6px; padding: 2px 7px;
  cursor: pointer; flex-shrink: 0; letter-spacing: 0.04em;
  user-select: none; text-transform: uppercase;
}
.gs-esc-chip:hover { background: #e2e8f0; color: #475569; }

.gs-results { max-height: 380px; overflow-y: auto; padding: 0.4rem 0 0.5rem; }

.gs-group { margin-bottom: 0.1rem; }
.gs-group-label {
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #94a3b8;
  padding: 0.45rem 1.1rem 0.25rem;
  display: flex; align-items: center; gap: 0.4rem;
}

.gs-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 1.1rem; cursor: pointer;
  transition: background 0.1s;
}
.gs-item:hover, .gs-item--active {
  background: rgba(59,107,46,0.07);
}
.gs-item-icon { font-size: 1rem; color: #64748b; flex-shrink: 0; width: 20px; text-align: center; }
.gs-item--active .gs-item-icon { color: var(--color-primary, #3b6b2e); }
.gs-item-body { flex: 1; min-width: 0; }
.gs-item-title { font-size: 0.9rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gs-item-sub { font-size: 0.78rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: none; letter-spacing: 0; }
.gs-item-enter { font-size: 0.8rem; color: #cbd5e1; opacity: 0; transition: opacity 0.1s; }
.gs-item--active .gs-item-enter,
.gs-item:hover .gs-item-enter { opacity: 1; }

.gs-empty {
  display: flex; align-items: center; gap: 0.6rem; justify-content: center;
  padding: 2rem 1rem; color: #94a3b8; font-size: 0.88rem;
}
.gs-empty i { font-size: 1.1rem; }

.gs-hint {
  display: flex; align-items: center; justify-content: center; gap: 1.5rem;
  padding: 0.85rem 1rem; border-top: 1px solid #f1f5f9;
  font-size: 0.78rem; color: #94a3b8;
}
.gs-hint span { display: flex; align-items: center; gap: 0.35rem; }
kbd {
  font-family: inherit; font-size: 0.72rem; font-weight: 600;
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px;
  padding: 1px 5px; color: #475569;
}

/* Dark mode */
:root[data-theme="dark"] .gs-modal {
  background: #0f172a;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07);
}
:root[data-theme="dark"] .gs-input-wrap { border-bottom-color: rgba(255,255,255,0.08); }
:root[data-theme="dark"] .gs-input { color: #f1f5f9; }
:root[data-theme="dark"] .gs-icon { color: rgba(255,255,255,0.35); }
:root[data-theme="dark"] .gs-esc-chip { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
:root[data-theme="dark"] .gs-esc-chip:hover { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); }
:root[data-theme="dark"] .gs-group-label { color: rgba(255,255,255,0.3); }
:root[data-theme="dark"] .gs-item:hover,
:root[data-theme="dark"] .gs-item--active { background: rgba(255,102,0,0.1); }
:root[data-theme="dark"] .gs-item-icon { color: rgba(255,255,255,0.4); }
:root[data-theme="dark"] .gs-item--active .gs-item-icon { color: #FF6600; }
:root[data-theme="dark"] .gs-item-title { color: rgba(255,255,255,0.9); }
:root[data-theme="dark"] .gs-item-sub { color: rgba(255,255,255,0.4); }
:root[data-theme="dark"] .gs-empty { color: rgba(255,255,255,0.3); }
:root[data-theme="dark"] .gs-hint { border-top-color: rgba(255,255,255,0.06); color: rgba(255,255,255,0.3); }
:root[data-theme="dark"] kbd { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
</style>
