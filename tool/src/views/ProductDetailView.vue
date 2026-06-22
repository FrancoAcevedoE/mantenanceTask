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
          <div class="product-image-wrap">
            <img v-if="product.image" :src="product.image" :alt="product.name" class="product-img" />
            <div v-else class="no-image"><i class="bi bi-image" style="font-size:3rem;color:var(--color-muted)"></i></div>
          </div>

          <!-- Color swatches -->
          <div v-if="product.colors?.length" class="color-section">
            <h4 class="section-label">Colores disponibles</h4>
            <div class="swatches-grid">
              <div
                v-for="(color, i) in product.colors"
                :key="i"
                class="swatch-card"
                :title="color"
              >
                <div class="swatch-dot" :style="swatchStyle(color)"></div>
                <span class="swatch-name">{{ color }}</span>
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

          <div class="detail-price-row">
            <div class="price-card">
              <span class="price-label">Precio por m²</span>
              <span class="price-value">${{ formatPrice(product.pricePerM2) }}</span>
            </div>
            <div class="stock-card" :class="stockClass(product.stock)">
              <span class="price-label">Stock</span>
              <span class="price-value">{{ product.stock ?? 0 }}</span>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="di-label">Código</span>
              <span class="di-value">{{ product.code || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Descripción</span>
              <span class="di-value">{{ product.name || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Color</span>
              <span class="di-value">{{ product.colors?.[0] || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Código color</span>
              <span class="di-value">{{ product.colorCode || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Textura</span>
              <span class="di-value">{{ product.textura || '—' }}</span>
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
              <span class="di-label">m² por placa</span>
              <span class="di-value">{{ product.m2PerPlaca ?? '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="di-label">Grupo</span>
              <span class="di-value">{{ product.grupo || '—' }}</span>
            </div>
          </div>

          <!-- Discounts -->
          <div v-if="product.discounts?.length" class="discounts-section">
            <h4 class="section-label">Descuentos por volumen</h4>
            <div class="discounts-grid">
              <div v-for="d in product.discounts" :key="d._id" class="discount-card">
                <span class="disc-qty">≥ {{ d.quantity }} m²</span>
                <span class="disc-pct">{{ d.discountPercent }}% off</span>
              </div>
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import InventorySubNav from '@/components/InventorySubNav.vue'

const route = useRoute()
const store = useProductsStore()
const loading = computed(() => store.loading)
const product = computed(() => store.getById(route.params.id))

onMounted(() => {
  if (!store.products.length) store.fetchProducts()
})

function formatPrice(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function swatchStyle(colorName) {
  const map = {
    negro: '#1a1a1a', blanco: '#f5f5f5', gris: '#9e9e9e', rojo: '#e53935',
    azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marrón: '#6d4c41',
    naranja: '#fb8c00', rosa: '#e91e63', violeta: '#8e24aa', beige: '#d7c4a1',
    platino: '#e5e4e2', almendra: '#d4a96a', tiza: '#b0b0b0', crema: '#fffdd0',
  }
  const key = Object.keys(map).find(k => colorName?.toLowerCase().includes(k))
  return {
    backgroundColor: key ? map[key] : '#ccc',
    width: '36px', height: '36px', borderRadius: '50%',
    border: '2px solid rgba(0,0,0,0.1)', flexShrink: 0
  }
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
}

.product-img { width: 100%; height: 100%; object-fit: cover; }

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

.swatches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.65rem;
}

.swatch-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.4rem;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 14px;
  cursor: default;
  transition: transform 0.15s;
}

.swatch-card:hover { transform: translateY(-2px); }

.swatch-name {
  font-size: 0.68rem;
  text-align: center;
  color: var(--color-text);
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

.price-card, .stock-card {
  flex: 1 1 140px;
  padding: 1rem 1.2rem;
  border-radius: 18px;
  border: 1px solid rgba(107,142,58,0.16);
  background: rgba(107,142,58,0.07);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stock-card--ok { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.2); }
.stock-card--warning { background: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.25); }
.stock-card--danger { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); }

.price-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.price-value { font-size: 1.6rem; font-weight: 700; font-family: 'Poppins', sans-serif; color: var(--color-text); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.85rem;
}

.detail-item {
  padding: 0.85rem 1rem;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(107,142,58,0.1);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.di-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.di-value { font-size: 0.95rem; font-weight: 600; color: var(--color-text); }

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

@media (max-width: 800px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-aside { flex-direction: row; flex-wrap: wrap; }
  .product-image-wrap { width: 160px; height: 160px; aspect-ratio: unset; }
}
</style>
