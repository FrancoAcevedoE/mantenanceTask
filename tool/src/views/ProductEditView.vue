<template>
  <div class="page-container">
    <div class="container">
      <div class="back-row">
        <router-link :to="`/product/${route.params.id}`">
          <button class="ghost-button"><i class="bi bi-arrow-left"></i> Volver al detalle</button>
        </router-link>
      </div>

      <InventorySubNav />

      <div v-if="store.loading" class="empty-state">Cargando...</div>
      <div v-else-if="!product" class="empty-state">Producto no encontrado.</div>

      <div v-else class="edit-layout">
        <div class="edit-header">
          <code class="code-tag">{{ product.code }}</code>
          <h2>Editar producto</h2>
        </div>

        <form class="edit-form" @submit.prevent="save" novalidate>
          <div class="form-grid">
            <!-- Descripción -->
            <div class="field" :class="{ error: errors.name }">
              <label>Descripción *</label>
              <input v-model="form.name" type="text" placeholder="Nombre o descripción del producto" />
              <span class="field-error" v-if="errors.name">{{ errors.name }}</span>
            </div>

            <!-- Precio -->
            <div class="field" :class="{ error: errors.pricePerM2 }">
              <label>Precio por m² *</label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">$</span>
                <input
                  v-model.number="form.pricePerM2"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  class="has-prefix"
                />
              </div>
              <span class="field-error" v-if="errors.pricePerM2">{{ errors.pricePerM2 }}</span>
            </div>

            <!-- Stock -->
            <div class="field" :class="{ error: errors.stock }">
              <label>Stock</label>
              <input v-model.number="form.stock" type="number" min="0" placeholder="0" />
              <span class="field-error" v-if="errors.stock">{{ errors.stock }}</span>
            </div>

            <!-- Medida -->
            <div class="field">
              <label>Medida</label>
              <input v-model="form.dimensions" type="text" placeholder="Ej: 2440x1220 mm" />
            </div>

            <!-- Terminación -->
            <div class="field">
              <label>Terminación</label>
              <input v-model="form.terminacion" type="text" placeholder="Ej: Brillante, Semimate, Textura..." />
            </div>

            <!-- Textura -->
            <div class="field">
              <label>Textura</label>
              <input v-model="form.textura" type="text" placeholder="Ej: Lisa, Madera, Piedra..." />
            </div>

            <!-- Grupo -->
            <div class="field">
              <label>Grupo</label>
              <input v-model="form.grupo" type="text" placeholder="Ej: Grupo I, Grupo II..." />
            </div>

            <!-- m² por placa -->
            <div class="field">
              <label>m² por placa</label>
              <input v-model.number="form.m2PerPlaca" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>

          <!-- Colores -->
          <div class="field full">
            <label>Colores <span class="field-hint">(separados por coma)</span></label>
            <input v-model="colorsText" type="text" placeholder="Negro, Blanco, Gris Tiza..." />
            <div class="color-preview" v-if="colorList.length">
              <span v-for="c in colorList" :key="c" class="color-chip-edit">
                <span class="color-dot-sm" :style="dotStyle(c)"></span>{{ c }}
              </span>
            </div>
          </div>

          <!-- Código de color -->
          <div class="field full">
            <label>Código de color</label>
            <input v-model="form.colorCode" type="text" placeholder="Ej: 5532, 5534..." />
          </div>

          <!-- Espesores -->
          <div class="field full">
            <label>Espesores <span class="field-hint">(separados por coma)</span></label>
            <input v-model="thicknessesText" type="text" placeholder="Ej: 18mm, 24mm, 30mm" />
          </div>

          <!-- Imagen -->
          <div class="field full">
            <label>URL de imagen</label>
            <input v-model="form.image" type="url" placeholder="https://..." />
            <div v-if="form.image" class="img-preview">
              <img :src="form.image" alt="preview" @error="form.image = ''" />
            </div>
          </div>

          <div class="form-footer">
            <button type="submit" :disabled="saving">
              <i class="bi" :class="saving ? 'bi-hourglass-split' : 'bi-check-lg'"></i>
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <router-link :to="`/product/${route.params.id}`">
              <button type="button" class="secondary-button">Cancelar</button>
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'

const route = useRoute()
const router = useRouter()
const store = useProductsStore()
const toast = useToast()

const product = computed(() => store.getById(route.params.id))
const saving = ref(false)
const errors = ref({})

const form = ref({
  name: '', pricePerM2: 0, stock: 0, dimensions: '',
  terminacion: '', textura: '', grupo: '', m2PerPlaca: null,
  colorCode: '', image: ''
})

const colorsText = ref('')
const thicknessesText = ref('')

const colorList = computed(() =>
  colorsText.value.split(',').map(c => c.trim()).filter(Boolean)
)

onMounted(() => {
  if (!store.products.length) {
    store.fetchProducts().then(populate)
  } else {
    populate()
  }
})

watch(product, populate)

function populate() {
  if (!product.value) return
  const p = product.value
  form.value = {
    name: p.name || '',
    pricePerM2: p.pricePerM2 || 0,
    stock: p.stock ?? 0,
    dimensions: p.dimensions || '',
    terminacion: p.terminacion || '',
    textura: p.textura || '',
    grupo: p.grupo || '',
    m2PerPlaca: p.m2PerPlaca ?? null,
    colorCode: p.colorCode || '',
    image: p.image || ''
  }
  colorsText.value = (p.colors || []).join(', ')
  thicknessesText.value = (p.thicknesses || []).join(', ')
}

function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = 'La descripción es obligatoria.'
  if (form.value.pricePerM2 < 0) e.pricePerM2 = 'El precio no puede ser negativo.'
  if (form.value.stock < 0) e.stock = 'El stock no puede ser negativo.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    await store.updateProduct(route.params.id, {
      ...form.value,
      colors: colorList.value,
      thicknesses: thicknessesText.value.split(',').map(t => t.trim()).filter(Boolean)
    })
    toast.success('Producto actualizado correctamente.')
    router.push(`/product/${route.params.id}`)
  } catch {
    toast.error('Error al guardar. Intente nuevamente.')
  } finally {
    saving.value = false
  }
}

function dotStyle(colorName) {
  const map = {
    negro: '#1a1a1a', blanco: '#f5f5f5', gris: '#9e9e9e', rojo: '#e53935',
    azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marrón: '#6d4c41',
    naranja: '#fb8c00', rosa: '#e91e63', violeta: '#8e24aa', beige: '#d7c4a1',
    platino: '#e5e4e2', almendra: '#d4a96a', tiza: '#b0b0b0',
  }
  const key = Object.keys(map).find(k => colorName?.toLowerCase().includes(k))
  return { backgroundColor: key ? map[key] : '#ccc', width: '10px', height: '10px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block', flexShrink: 0 }
}
</script>

<style scoped>
.back-row { margin-bottom: 1.2rem; }
.back-row a { text-decoration: none; }

.edit-layout { display: flex; flex-direction: column; gap: 1.5rem; }

.edit-header { display: flex; flex-direction: column; gap: 0.4rem; }

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

.edit-form { display: flex; flex-direction: column; gap: 1.1rem; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field.full { grid-column: 1 / -1; }
.field.error input { border-color: #dc2626; }

.field label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-muted);
}

.field-hint { font-size: 0.72rem; text-transform: none; font-weight: 400; }

.field-error { font-size: 0.78rem; color: #dc2626; text-transform: none; }

.input-prefix-wrap { position: relative; }
.input-prefix {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font-weight: 600;
}
.has-prefix { padding-left: 1.8rem !important; }

.color-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.color-chip-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  background: rgba(107,142,58,0.1);
  border-radius: 999px;
  font-size: 0.78rem;
}

.img-preview {
  margin-top: 0.6rem;
  border-radius: 14px;
  overflow: hidden;
  width: 120px;
  height: 120px;
  border: 1px solid rgba(107,142,58,0.16);
}

.img-preview img { width: 100%; height: 100%; object-fit: cover; }

.form-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(107,142,58,0.12);
}

.form-footer a { text-decoration: none; }
</style>
