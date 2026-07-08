<template>
  <div class="mkinv-wrap">

    <!-- Sub-tabs: Productos / Colores -->
    <div class="mkinv-subtabs">
      <button :class="['mkinv-subtab', { active: subTab === 'productos' }]" @click="subTab = 'productos'">
        <i class="bi bi-box-seam"></i> Productos
      </button>
      <button :class="['mkinv-subtab', { active: subTab === 'colores' }]" @click="subTab = 'colores'">
        <i class="bi bi-palette-fill"></i> Colores
      </button>
    </div>

    <!-- ── PRODUCTOS ── -->
    <template v-if="subTab === 'productos'">
      <div class="mkinv-toolbar">
        <div class="mkinv-search-box">
          <i class="bi bi-search mkinv-search-ico"></i>
          <input v-model="search" type="text" placeholder="Buscar por nombre, código..." class="mkinv-search" />
        </div>
        <select v-model="filterGrupo" class="mkinv-select">
          <option value="">Todos los grupos</option>
          <option v-for="g in uniqueGrupos" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <div v-if="pStore.loading" class="mkinv-loading">
        <i class="bi bi-arrow-repeat spin"></i> Cargando productos…
      </div>
      <div v-else-if="!filteredProducts.length" class="mkinv-empty">
        <i class="bi bi-box-seam"></i>
        <p>Sin resultados</p>
      </div>
      <div v-else class="mkinv-grid">
        <div v-for="p in filteredProducts" :key="p._id" class="mkinv-card" @click="openProduct(p)">
          <!-- Imagen -->
          <div class="mkinv-img-wrap">
            <img v-if="firstImage(p)" :src="firstImage(p)" :alt="p.name" class="mkinv-img" />
            <div v-else class="mkinv-img-placeholder"><i class="bi bi-box-seam"></i></div>
          </div>
          <div class="mkinv-card-body">
            <div class="mkinv-code">{{ p.code }}</div>
            <div class="mkinv-name">{{ p.name }}</div>
            <div v-if="p.grupo" class="mkinv-grupo">{{ p.grupo }}</div>
            <div v-if="p.types?.length" class="mkinv-types">
              <span v-for="t in p.types.slice(0,3)" :key="t.label" class="mkinv-type-chip">
                {{ t.label }}
              </span>
              <span v-if="p.types.length > 3" class="mkinv-type-more">+{{ p.types.length - 3 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail panel -->
      <Teleport to="body">
        <Transition name="mkinv-slide">
          <aside v-if="selectedProduct" class="mkinv-panel" @click.stop>
            <div class="mkinv-panel-hd">
              <div>
                <div class="mkinv-panel-code">{{ selectedProduct.code }}</div>
                <div class="mkinv-panel-name">{{ selectedProduct.name }}</div>
              </div>
              <button class="mkinv-panel-close" @click="selectedProduct = null"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="mkinv-panel-body">
              <div v-if="selectedProduct.grupo" class="mkinv-detail-row">
                <span class="mkinv-detail-lbl">Grupo</span>
                <span>{{ selectedProduct.grupo }}</span>
              </div>
              <div v-if="selectedProduct.dimensions" class="mkinv-detail-row">
                <span class="mkinv-detail-lbl">Medida</span>
                <span>{{ selectedProduct.dimensions }}</span>
              </div>
              <div v-if="selectedProduct.terminacion" class="mkinv-detail-row">
                <span class="mkinv-detail-lbl">Terminación</span>
                <span>{{ selectedProduct.terminacion }}</span>
              </div>
              <div v-if="selectedProduct.descripcion" class="mkinv-detail-desc">
                {{ selectedProduct.descripcion }}
              </div>

              <!-- Colores -->
              <div v-if="selectedProduct.colorMode === 'todos'" class="mkinv-detail-section">
                <div class="mkinv-detail-section-title">Colores</div>
                <div class="mkinv-color-chips">
                  <span v-for="col in allColors" :key="col._id" class="mkinv-color-chip">
                    <span v-if="col.image" class="mkinv-color-swatch"
                      :style="{ backgroundImage: `url(${col.image})`, backgroundSize: 'cover' }"></span>
                    <span v-else class="mkinv-color-swatch" style="background:#d1d5db"></span>
                    {{ col.name }} ({{ col.code }})
                  </span>
                </div>
              </div>
              <div v-else-if="selectedProduct.colors?.length" class="mkinv-detail-section">
                <div class="mkinv-detail-section-title">Colores disponibles</div>
                <div class="mkinv-color-chips">
                  <span v-for="code in selectedProduct.colors" :key="code" class="mkinv-color-chip">
                    <span class="mkinv-color-swatch"
                      :style="colorSwatchStyle(code)"></span>
                    {{ colorName(code) }} ({{ code }})
                  </span>
                </div>
              </div>

              <!-- Tipos / precios -->
              <div v-if="selectedProduct.types?.length" class="mkinv-detail-section">
                <div class="mkinv-detail-section-title">Tipos</div>
                <div class="mkinv-types-list">
                  <div v-for="t in selectedProduct.types" :key="t.label" class="mkinv-type-row">
                    <span class="mkinv-type-label">{{ t.label }}</span>
                    <span class="mkinv-type-price">${{ formatPrice(t.price) }}</span>
                  </div>
                </div>
              </div>

              <!-- Imágenes -->
              <div v-if="productImages(selectedProduct).length" class="mkinv-detail-section">
                <div class="mkinv-detail-section-title">Imágenes</div>
                <div class="mkinv-img-gallery">
                  <img v-for="(img, i) in productImages(selectedProduct)" :key="i"
                    :src="img" :alt="selectedProduct.name + ' ' + (i+1)" class="mkinv-gallery-img" />
                </div>
              </div>
            </div>
          </aside>
        </Transition>
        <div v-if="selectedProduct" class="mkinv-backdrop" @click="selectedProduct = null"></div>
      </Teleport>
    </template>

    <!-- ── COLORES ── -->
    <template v-if="subTab === 'colores'">
      <div class="mkinv-toolbar">
        <div class="mkinv-search-box">
          <i class="bi bi-search mkinv-search-ico"></i>
          <input v-model="colorSearch" type="text" placeholder="Buscar color..." class="mkinv-search" />
        </div>
        <select v-model="filterGrupoColor" class="mkinv-select">
          <option value="">Todos los grupos</option>
          <option v-for="g in uniqueColorGrupos" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>

      <div v-if="loadingColors" class="mkinv-loading">
        <i class="bi bi-arrow-repeat spin"></i> Cargando colores…
      </div>
      <div v-else-if="!filteredColors.length" class="mkinv-empty">
        <i class="bi bi-palette"></i>
        <p>Sin resultados</p>
      </div>
      <div v-else class="mkinv-colors-grid">
        <div v-for="col in filteredColors" :key="col._id" class="mkinv-color-card">
          <div class="mkinv-color-img-wrap">
            <img v-if="col.image" :src="col.image" :alt="col.name" class="mkinv-color-img" />
            <div v-else class="mkinv-color-placeholder"><i class="bi bi-palette"></i></div>
          </div>
          <div class="mkinv-color-info">
            <div class="mkinv-color-name">{{ col.name }}</div>
            <div class="mkinv-color-code">{{ col.code }}</div>
            <div v-if="col.grupoColor" class="mkinv-color-grupo">{{ col.grupoColor }}</div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useProductsStore } from '@/stores/products'

const pStore = useProductsStore()

const subTab        = ref('productos')
const search        = ref('')
const filterGrupo   = ref('')
const colorSearch   = ref('')
const filterGrupoColor = ref('')
const selectedProduct = ref(null)
const allColors     = ref([])
const loadingColors = ref(false)

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(async () => {
  if (!pStore.products.length) await pStore.fetchProducts()
  loadingColors.value = true
  try {
    const { data } = await axios.get(`${API_BASE_URL}/colors`, authHeader())
    allColors.value = Array.isArray(data) ? data : []
  } finally {
    loadingColors.value = false
  }
})

const uniqueGrupos = computed(() =>
  [...new Set(pStore.products.map(p => p.grupo).filter(Boolean))].sort()
)

const uniqueColorGrupos = computed(() =>
  [...new Set(allColors.value.map(c => c.grupoColor).filter(Boolean))].sort()
)

const filteredProducts = computed(() => {
  let list = pStore.products
  if (filterGrupo.value) list = list.filter(p => p.grupo === filterGrupo.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(p => rx.test(p.name) || rx.test(p.code) || rx.test(p.grupo))
  }
  return list
})

const filteredColors = computed(() => {
  let list = allColors.value
  if (filterGrupoColor.value) list = list.filter(c => c.grupoColor === filterGrupoColor.value)
  if (colorSearch.value.trim()) {
    const rx = new RegExp(colorSearch.value.trim(), 'i')
    list = list.filter(c => rx.test(c.name) || rx.test(c.code))
  }
  return list
})

function openProduct(p) { selectedProduct.value = p }

function firstImage(p) {
  return p.mainImage || p.images?.[0] || p.fichas?.[0]?.image || ''
}

function productImages(p) {
  const imgs = []
  if (p.mainImage) imgs.push(p.mainImage)
  if (p.images?.length) imgs.push(...p.images.filter(i => i !== p.mainImage))
  return imgs.slice(0, 6)
}

function colorName(code) {
  return allColors.value.find(c => c.code === code)?.name || code
}

function colorSwatchStyle(code) {
  const col = allColors.value.find(c => c.code === code)
  if (col?.image) return { backgroundImage: `url(${col.image})`, backgroundSize: 'cover' }
  return { background: '#d1d5db' }
}

function formatPrice(v) {
  if (!v && v !== 0) return '—'
  return Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.mkinv-wrap { min-width: 0; }

.mkinv-subtabs {
  display: flex; gap: 0.3rem; margin-bottom: 1rem;
  border-bottom: 2px solid rgba(107,142,58,.1); padding-bottom: 0;
}
.mkinv-subtab {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-radius: 10px 10px 0 0;
  background: transparent; color: var(--color-muted);
  font-size: 0.82rem; font-weight: 600; border: none;
  border-bottom: 3px solid transparent; margin-bottom: -2px;
  cursor: pointer; transition: color .15s, border-color .15s;
  box-shadow: none;
}
.mkinv-subtab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 700; }
.mkinv-subtab:hover:not(.active) { color: var(--color-text); background: transparent; transform: none; box-shadow: none; }

.mkinv-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-bottom: 0.85rem;
}
.mkinv-search-box { position: relative; flex: 1; min-width: 200px; }
.mkinv-search-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.mkinv-search { width: 100%; padding: 0.5rem 0.9rem 0.5rem 2.1rem; border-radius: 10px; font-size: 0.82rem; }
.mkinv-select { padding: 0.5rem 0.9rem; border-radius: 10px; font-size: 0.8rem; min-width: 150px; }

.mkinv-loading, .mkinv-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.6rem;
  padding: 3rem 1rem; color: var(--color-muted); font-size: 0.82rem;
}
.mkinv-empty i { font-size: 2rem; opacity: .3; }
.spin { animation: spin .8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Products grid */
.mkinv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.6rem;
}

.mkinv-card {
  border: 1px solid rgba(107,142,58,.12);
  border-radius: 12px; overflow: hidden;
  background: rgba(255,255,255,.9);
  cursor: pointer; transition: box-shadow .18s, transform .18s;
  display: flex; flex-direction: column;
}
.mkinv-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-2px); }

.mkinv-img-wrap { width: 100%; height: 110px; overflow: hidden; background: #f8fafc; }
.mkinv-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mkinv-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  color: #d1d5db; font-size: 1.8rem;
}

.mkinv-card-body { padding: 0.55rem 0.7rem; display: flex; flex-direction: column; gap: 0.2rem; }
.mkinv-code { font-size: 0.65rem; font-weight: 700; color: var(--color-primary); letter-spacing: .04em; text-transform: uppercase; }
.mkinv-name { font-size: 0.8rem; font-weight: 700; color: var(--color-text); line-height: 1.3; }
.mkinv-grupo { font-size: 0.68rem; color: var(--color-muted); }
.mkinv-types { display: flex; flex-wrap: wrap; gap: 0.2rem; margin-top: 0.2rem; }
.mkinv-type-chip {
  font-size: 0.62rem; padding: 1px 6px; border-radius: 5px;
  background: rgba(107,142,58,.1); color: var(--color-primary); font-weight: 600;
}
.mkinv-type-more { font-size: 0.62rem; color: var(--color-muted); }

/* Slide panel */
.mkinv-panel {
  position: fixed; top: 0; right: 0;
  width: min(400px, 100vw); height: 100vh;
  background: #fff; color: #1a1a1a;
  box-shadow: -8px 0 30px rgba(0,0,0,.15);
  z-index: 1400; display: flex; flex-direction: column; overflow: hidden;
}
.mkinv-backdrop {
  position: fixed; inset: 0; z-index: 1399; background: rgba(0,0,0,.3);
}

.mkinv-panel-hd {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem;
  padding: 1rem 1.1rem 0.75rem;
  background: #1e3a5f; color: #fff; flex-shrink: 0;
}
.mkinv-panel-code { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,.65); letter-spacing: .06em; text-transform: uppercase; }
.mkinv-panel-name { font-size: 1rem; font-weight: 700; color: #fff; margin-top: 0.1rem; }
.mkinv-panel-close { background: none; border: none; color: rgba(255,255,255,.75); font-size: 1rem; cursor: pointer; padding: 4px; }
.mkinv-panel-close:hover { color: #fff; }

.mkinv-panel-body { flex: 1; overflow-y: auto; padding: 0.9rem 1.1rem; display: flex; flex-direction: column; gap: 0.6rem; }

.mkinv-detail-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; }
.mkinv-detail-lbl { font-size: 0.68rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; letter-spacing: .05em; min-width: 80px; }

.mkinv-detail-desc { font-size: 0.8rem; color: #555; line-height: 1.5; white-space: pre-wrap; }

.mkinv-detail-section { margin-top: 0.3rem; }
.mkinv-detail-section-title {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--color-muted);
  border-bottom: 1px solid rgba(107,142,58,.1); padding-bottom: 0.3rem; margin-bottom: 0.5rem;
}

.mkinv-color-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.mkinv-color-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.72rem; padding: 2px 7px 2px 2px; border-radius: 20px;
  background: rgba(107,142,58,.07); border: 1px solid rgba(107,142,58,.15);
}
.mkinv-color-swatch { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }

.mkinv-types-list { display: flex; flex-direction: column; gap: 0.3rem; }
.mkinv-type-row {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 6px;
  background: rgba(107,142,58,.04);
}
.mkinv-type-label { font-weight: 600; }
.mkinv-type-price { color: var(--color-primary); font-weight: 700; }

.mkinv-img-gallery { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.mkinv-gallery-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }

/* Slide transition */
.mkinv-slide-enter-active, .mkinv-slide-leave-active { transition: transform .22s ease; }
.mkinv-slide-enter-from, .mkinv-slide-leave-to { transform: translateX(100%); }

/* Colors grid */
.mkinv-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.55rem;
}
.mkinv-color-card {
  border: 1px solid rgba(107,142,58,.12); border-radius: 10px;
  background: rgba(255,255,255,.9); overflow: hidden;
}
.mkinv-color-img-wrap { width: 100%; height: 90px; overflow: hidden; background: #f3f4f6; }
.mkinv-color-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mkinv-color-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  color: #d1d5db; font-size: 1.4rem;
}
.mkinv-color-info { padding: 0.4rem 0.55rem; }
.mkinv-color-name { font-size: 0.78rem; font-weight: 700; color: var(--color-text); }
.mkinv-color-code { font-size: 0.65rem; color: var(--color-primary); font-weight: 700; }
.mkinv-color-grupo { font-size: 0.62rem; color: var(--color-muted); }

/* Dark mode */
[data-theme="dark"] .mkinv-card,
[data-theme="dark"] .mkinv-color-card { background: rgba(13,18,35,.82) !important; border-color: rgba(255,255,255,.07) !important; }
[data-theme="dark"] .mkinv-panel { background: rgba(10,14,28,.98) !important; color: rgba(255,255,255,.88) !important; }
[data-theme="dark"] .mkinv-panel-body { color: rgba(255,255,255,.82); }
[data-theme="dark"] .mkinv-detail-desc { color: rgba(255,255,255,.65) !important; }
[data-theme="dark"] .mkinv-type-row { background: rgba(255,255,255,.04) !important; }
[data-theme="dark"] .mkinv-img-wrap,
[data-theme="dark"] .mkinv-color-img-wrap { background: rgba(255,255,255,.04) !important; }
</style>
