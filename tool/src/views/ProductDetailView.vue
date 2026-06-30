<template>
  <div class="page-container">
    <div class="container">
      <div class="back-row">
        <router-link to="/inventory">
          <button class="ghost-button"><i class="bi bi-arrow-left"></i> Volver al listado</button>
        </router-link>
      </div>

      <InventorySubNav />

      <div v-if="loading" class="empty-state">Cargando...</div>
      <div v-else-if="!product" class="empty-state">Producto no encontrado.</div>

      <div v-else class="detail-layout">
        <!-- Left panel -->
        <aside class="detail-aside">
          <div class="product-image-wrap" @click="product.image && (imgExpanded = true)">
            <img v-if="product.image" :src="resolveUrl(product.image)" :alt="product.name" class="product-img" />
            <div v-else class="no-image"><i class="bi bi-image" style="font-size:3rem;color:var(--color-muted)"></i></div>
            <div v-if="product.image" class="img-zoom-hint"><i class="bi bi-arrows-fullscreen"></i></div>
          </div>

          <!-- Lightbox imagen producto -->
          <Teleport to="body">
            <div v-if="imgExpanded" class="lightbox-overlay" @click="imgExpanded = false">
              <button class="lightbox-close" @click.stop="imgExpanded = false"><i class="bi bi-x-lg"></i></button>
              <img :src="resolveUrl(product.image)" :alt="product.name" class="lightbox-img" @click.stop />
            </div>
          </Teleport>

          <!-- Lightbox color -->
          <Teleport to="body">
            <Transition name="modal-fade">
              <div v-if="lightboxColor" class="lightbox-overlay" @click="lightboxColor = null">
                <div class="lbc-card" @click.stop>
                  <button class="lightbox-close" @click="lightboxColor = null"><i class="bi bi-x-lg"></i></button>
                  <div class="lbc-swatch" :style="lightboxColor.image ? {} : { background: guessColorFromName(lightboxColor.name) }">
                    <img v-if="lightboxColor.image" :src="resolveUrl(lightboxColor.image)" :alt="lightboxColor.name" class="lbc-img" />
                  </div>
                  <div class="lbc-info">
                    <code class="lbc-code">{{ lightboxColor.code }}</code>
                    <span class="lbc-name">{{ lightboxColor.name }}</span>
                    <div class="lbc-meta">
                      <span v-if="lightboxColor.tipo" class="lbc-tag">{{ lightboxColor.tipo }}</span>
                      <span class="lbc-tag" :class="'lbc-g' + lightboxColor.grupoColor">Grupo {{ ['I','II','III'][lightboxColor.grupoColor - 1] }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </Teleport>

          <!-- Colores -->
          <div v-if="product.colorMode === 'todos'" class="color-section">
            <h4 class="section-label">Colores: TODOS</h4>
            <div class="color-mode-badge todos">Todos los colores disponibles</div>
          </div>
          <div v-else-if="product.selectedColors?.length" class="color-section">
            <h4 class="section-label">Colores seleccionados ({{ product.selectedColors.length }})</h4>
            <div class="swatches-grid">
              <div v-for="code in product.selectedColors" :key="code" class="swatch-card" :title="colorName(code)" @click="openColorDetail(code)">
                <div class="swatch-thumb">
                  <img v-if="colorImage(code)" :src="resolveUrl(colorImage(code))" :alt="code" />
                  <div v-else class="swatch-thumb-css" :style="{ background: guessColorFromName(colorName(code)) }"></div>
                </div>
                <span class="swatch-code">{{ code }}</span>
                <span class="swatch-name">{{ colorName(code) }}</span>
                <span v-if="colorGroup(code)" class="swatch-group" :class="'g' + colorGroup(code)">G{{ colorGroup(code) }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="product.colors?.length && product.colors[0] !== 'TODOS'" class="color-section">
            <h4 class="section-label">Colores</h4>
            <div class="swatches-grid">
              <div v-for="(color, i) in product.colors" :key="i" class="swatch-card" @click="openColorDetail(color)">
                <div class="swatch-thumb">
                  <img v-if="colorImage(color)" :src="resolveUrl(colorImage(color))" :alt="color" />
                  <div v-else class="swatch-thumb-css" :style="{ background: guessColorFromName(colorName(color)) }"></div>
                </div>
                <span class="swatch-code">{{ color }}</span>
                <span class="swatch-name">{{ colorName(color) }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right panel -->
        <main class="detail-main">
          <div class="detail-heading">
            <code class="code-tag">{{ product.code }}</code>
            <h2>{{ product.name }}</h2>
            <span v-if="product.grupo" class="grupo-badge">{{ product.grupo }}</span>
          </div>

          <!-- Precios -->
          <div class="prices-section">
            <h4 class="section-label">Precios <span class="unit-note">(por {{ product.unidadPrecio || 'm²' }})</span></h4>
            <div class="detail-price-row">
              <div v-if="product.precioGrupoI != null" class="price-card">
                <span class="price-label">Grupo I</span>
                <span class="price-value">${{ formatPrice(product.precioGrupoI) }}</span>
              </div>
              <div v-if="product.precioGrupoII != null" class="price-card">
                <span class="price-label">Grupo II</span>
                <span class="price-value">${{ formatPrice(product.precioGrupoII) }}</span>
              </div>
              <div v-if="product.precioGrupoIII != null" class="price-card">
                <span class="price-label">Grupo III</span>
                <span class="price-value">${{ formatPrice(product.precioGrupoIII) }}</span>
              </div>
              <div v-if="product.precioEscolares != null" class="price-card price-card--school">
                <span class="price-label">Escolares</span>
                <span class="price-value">${{ formatPrice(product.precioEscolares) }}</span>
              </div>
              <div v-if="product.pricePerM2 != null" class="price-card price-card--m2">
                <span class="price-label">Por m²</span>
                <span class="price-value">${{ formatPrice(product.pricePerM2) }}</span>
              </div>
              <div class="stock-card" :class="stockClass(product.stock)">
                <span class="price-label">Stock</span>
                <span class="price-value">{{ product.stock ?? 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Atributos -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="di-label">Código</span>
              <span class="di-value mono">{{ product.code || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Descripción</span>
              <span class="di-value">{{ product.name || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Tipo</span>
              <span class="di-value">{{ product.tipo || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Terminación</span>
              <span class="di-value">{{ product.terminacion || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Medida</span>
              <span class="di-value">{{ product.dimensions || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Espesor</span>
              <span class="di-value">{{ product.thicknesses?.join(', ') || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Unidad precio</span>
              <span class="di-value">{{ product.unidadPrecio || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Producción mínima</span>
              <span class="di-value">{{ product.produccionMinima ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Admite descuentos</span>
              <span class="di-value">
                <span :class="product.admiteDescuentos ? 'badge-yes' : 'badge-no'">
                  {{ product.admiteDescuentos ? 'Sí' : 'No' }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="di-label">Grupo</span>
              <span class="di-value">{{ product.grupo || '—' }}</span>
            </div>
            <div v-if="product.comentario" class="detail-item full-width">
              <span class="di-label">Comentario</span>
              <span class="di-value comment-text">{{ product.comentario }}</span>
            </div>
          </div>

          <!-- Variantes -->
          <div v-if="product.variantes?.length > 1" class="variantes-section">
            <h4 class="section-label">Tipos / Variantes</h4>
            <table class="variantes-detail-table">
              <thead>
                <tr>
                  <th>Tipo</th><th>Tipo terminacion</th><th>Terminacion</th><th>$ General</th><th>$ Grupo I</th><th>$ Grupo II</th><th>$ Grupo III</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, i) in product.variantes" :key="i">
                  <td>{{ v.tipoProducto || '—' }}</td>
                  <td>{{ v.tipoTerminacion || '—' }}</td>
                  <td class="mono">{{ v.terminacion || '—' }}</td>
                  <td>{{ v.precioGeneral != null ? '$' + formatPrice(v.precioGeneral) : '—' }}</td>
                  <td>${{ formatPrice(v.precioGrupoI) }}</td>
                  <td>${{ formatPrice(v.precioGrupoII) }}</td>
                  <td>${{ formatPrice(v.precioGrupoIII) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Archivos -->
          <div v-if="allArchivos.length" class="files-section">
            <h4 class="section-label">Archivos adjuntos</h4>
            <div class="files-row">
              <a v-for="(a, i) in allArchivos" :key="i" :href="resolveUrl(a.url)" target="_blank" class="file-card">
                <i class="bi" :class="a.url?.endsWith('.pdf') ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text'"></i>
                <span>{{ a.titulo || 'Archivo' }}</span>
              </a>
            </div>
          </div>

          <div class="detail-actions">
            <router-link :to="`/product/${product._id}/edit`">
              <button><i class="bi bi-pencil"></i> Editar producto</button>
            </router-link>
            <router-link to="/inventory">
              <button class="secondary-button"><i class="bi bi-grid-3x3-gap"></i> Ver todos</button>
            </router-link>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { API_BASE_URL } from '@/utils/api'
import axios from 'axios'
import InventorySubNav from '@/components/InventorySubNav.vue'

const route = useRoute()
const store = useProductsStore()
const loading = computed(() => store.loading)
const product = computed(() => store.getById(route.params.id))
const colorCatalog = ref([])
const imgExpanded = ref(false)
const lightboxColor = ref(null)

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(async () => {
  if (!store.products.length) store.fetchProducts()
  try {
    const { data } = await axios.get(`${API_BASE_URL}/colors`, authHeader())
    colorCatalog.value = Array.isArray(data) ? data : []
  } catch { /* ignore */ }
})

function colorName(code) {
  const c = colorCatalog.value.find(c => c.code === code)
  return c ? c.name : ''
}

function colorGroup(code) {
  const c = colorCatalog.value.find(c => c.code === code)
  return c ? c.grupoColor : null
}

function colorImage(code) {
  const c = colorCatalog.value.find(c => c.code === code)
  return c?.image || ''
}

const COLOR_MAP = {
  blanco: '#f5f5f5', negro: '#1a1a1a', gris: '#9e9e9e', rojo: '#e53935',
  azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marron: '#6d4c41',
  naranja: '#fb8c00', rosa: '#e91e63', crema: '#fffdd0', beige: '#d7c4a1',
  platino: '#e5e4e2', almendra: '#d4a96a', grafito: '#444', durazno: '#ffab91',
  terracota: '#c75b39', marfil: '#f5f0e0', arena: '#c2b280', cedro: '#8b5e3c',
  roble: '#a0785a', nogal: '#5c3a1e', cerezo: '#9e3030', haya: '#d4a96a',
  oliva: '#6b8e23', teca: '#ab8553',
}

function guessColorFromName(name) {
  const n = (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (n.includes(k)) return v
  }
  return '#ccc'
}

function openColorDetail(code) {
  const c = colorCatalog.value.find(c => c.code === code)
  if (c) lightboxColor.value = c
}

const allArchivos = computed(() => {
  const p = product.value
  if (!p) return []
  const list = [...(p.archivos || [])]
  if (p.catalogo && !list.some(a => a.url === p.catalogo)) {
    list.unshift({ titulo: 'Catalogo', url: p.catalogo })
  }
  if (p.fichaTecnica && !list.some(a => a.url === p.fichaTecnica)) {
    list.unshift({ titulo: 'Ficha tecnica', url: p.fichaTecnica })
  }
  return list.filter(a => a.url)
})

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

function formatPrice(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}


function stockClass(stock) {
  const n = stock ?? 0
  if (n === 0) return 'stock-card--danger'
  if (n <= 5) return 'stock-card--warning'
  return 'stock-card--ok'
}
</script>

<style scoped>
.back-row { margin-bottom: 1.2rem; }
.back-row a { text-decoration: none; }

.detail-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

.detail-aside {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-image-wrap {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(107,142,58,0.16);
  background: rgba(107,142,58,0.05);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.product-image-wrap:hover .product-img { transform: scale(1.03); }

.img-zoom-hint {
  position: absolute;
  bottom: 0.5rem; right: 0.5rem;
  background: rgba(0,0,0,0.5); color: #fff;
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; opacity: 0;
  transition: opacity 0.2s;
}
.product-image-wrap:hover .img-zoom-hint { opacity: 1; }

.lightbox-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem; cursor: zoom-out;
}
.lightbox-img {
  max-width: 90vw; max-height: 90vh;
  object-fit: contain; border-radius: 12px;
  cursor: default;
}
.lightbox-close {
  position: absolute; top: 1rem; right: 1rem;
  background: rgba(255,255,255,0.15); border: none;
  color: #fff; font-size: 1.2rem; width: 36px; height: 36px;
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.3); }

/* Lightbox color */
.lbc-card {
  position: relative; background: #fff; border-radius: 20px;
  overflow: hidden; max-width: 320px; width: 100%;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35); cursor: default;
}
.lbc-swatch { width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; }
.lbc-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lbc-info { padding: 0.9rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.lbc-code { font-size: 1.4rem; font-weight: 800; letter-spacing: 0.08em; color: var(--color-primary, #6b8e3a); font-family: monospace; }
.lbc-name { font-size: 0.95rem; font-weight: 600; color: var(--color-text); }
.lbc-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem; }
.lbc-tag { display: inline-block; font-size: 0.68rem; font-weight: 600; padding: 0.18rem 0.55rem; border-radius: 999px; background: rgba(107,142,58,0.1); color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.lbc-g1 { background: rgba(76,175,80,0.12); color: #2e7d32; }
.lbc-g2 { background: rgba(33,150,243,0.12); color: #1565c0; }
.lbc-g3 { background: rgba(255,152,0,0.12); color: #e65100; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
}

.section-label {
  font-family: 'Poppins', sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  margin-bottom: 0.75rem;
}

.color-mode-badge {
  display: inline-flex; padding: 0.4rem 0.8rem; border-radius: 8px;
  font-size: 0.78rem; font-weight: 600;
}
.color-mode-badge.todos { background: rgba(107,142,58,0.1); color: var(--color-primary, #6b8e3a); }

.swatches-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.swatch-card {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.55rem 0.3rem 0.3rem;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.swatch-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-color: rgba(107,142,58,0.3); }

.swatch-thumb {
  width: 28px; height: 28px; border-radius: 5px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.08); flex-shrink: 0;
}
.swatch-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.swatch-thumb-css { width: 100%; height: 100%; }

.swatch-code { font-weight: 700; }

.swatch-group {
  font-size: 0.62rem; font-weight: 700; padding: 0.1rem 0.3rem; border-radius: 4px;
}
.swatch-group.g1 { background: rgba(76,175,80,0.12); color: #2e7d32; }
.swatch-group.g2 { background: rgba(33,150,243,0.12); color: #1565c0; }
.swatch-group.g3 { background: rgba(255,152,0,0.12); color: #e65100; }

.swatch-name {
  font-size: 0.72rem;
  color: var(--color-muted);
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-main { display: flex; flex-direction: column; gap: 1.5rem; }

.detail-heading { display: flex; flex-direction: column; gap: 0.5rem; }

.code-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  background: rgba(107,142,58,0.1);
  padding: 0.25rem 0.7rem;
  border-radius: 8px;
  display: inline-block;
  font-weight: 700;
  width: fit-content;
}

.detail-heading h2 { font-size: clamp(1.3rem, 2vw, 1.9rem); }

.grupo-badge {
  display: inline-block;
  padding: 0.3rem 0.9rem;
  background: rgba(107,142,58,0.12);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  width: fit-content;
}

.detail-price-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.prices-section { display: flex; flex-direction: column; gap: 0.6rem; }
.unit-note { font-size: 0.75rem; font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--color-muted); }

.price-card, .stock-card {
  flex: 1 1 120px;
  padding: 0.9rem 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(107,142,58,0.16);
  background: rgba(107,142,58,0.07);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-card--school { background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.18); }
.price-card--m2 { background: rgba(107,142,58,0.04); border-color: rgba(107,142,58,0.1); }

.stock-card--ok { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); }
.stock-card--warning { background: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.25); }
.stock-card--danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); }

.price-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.price-value { font-size: 1.6rem; font-weight: 700; font-family: 'Poppins', sans-serif; color: var(--color-text); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.55rem;
}

.detail-item {
  padding: 0.5rem 0.75rem;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(107,142,58,0.1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.di-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.di-value { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
.comment-text { white-space: pre-line; font-size: 0.88rem; font-weight: 400; line-height: 1.6; }
.di-value.mono { font-family: 'Courier New', monospace; }

.full-width { grid-column: 1 / -1; }

.badge-yes {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(34,197,94,0.12);
  color: #15803d;
}

.badge-no {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(239,68,68,0.12);
  color: #b91c1c;
}

.discounts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.discount-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.7rem 1rem;
  background: rgba(107,142,58,0.08);
  border: 1px solid rgba(107,142,58,0.18);
  border-radius: 14px;
  min-width: 90px;
}

.disc-qty { font-size: 0.78rem; color: var(--color-muted); }
.disc-pct { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); }

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.detail-actions a { text-decoration: none; }

.variantes-section { margin-top: 0.5rem; }

.variantes-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  margin-top: 0.5rem;
}
.variantes-detail-table th {
  padding: 0.45rem 0.65rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
  border-bottom: 1px solid rgba(0,0,0,0.1);
}
.variantes-detail-table td {
  padding: 0.4rem 0.65rem;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

.files-section { margin-top: 0.5rem; }
.files-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; }

.file-card {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(107,142,58,0.2);
  background: rgba(107,142,58,0.06);
  color: var(--color-primary, #6b8e3a);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}
.file-card:hover { background: rgba(107,142,58,0.14); border-color: rgba(107,142,58,0.4); }
.file-card i { font-size: 1.2rem; }

.detail-main { min-width: 0; }

.variantes-section, .files-section, .prices-section, .detail-grid {
  overflow-x: auto;
}

@media (max-width: 800px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-aside { flex-direction: row; flex-wrap: wrap; }
  .product-image-wrap { width: 160px; height: 160px; aspect-ratio: unset; }
  .detail-price-row { flex-wrap: wrap; }
  .detail-grid { grid-template-columns: 1fr 1fr; }
}
</style>
