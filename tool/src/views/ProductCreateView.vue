<template>
  <div class="page-container">
    <div class="container">
      <div class="back-row">
        <router-link to="/inventory">
          <button class="ghost-button"><i class="bi bi-arrow-left"></i> Volver al inventario</button>
        </router-link>
      </div>

      <div class="edit-layout">
        <div class="edit-header">
          <h2>Nuevo producto</h2>
        </div>

        <form class="edit-form" @submit.prevent="save" novalidate>

          <!-- SKU -->
          <div class="section-title">SKU</div>
          <div class="sku-preview">
            <span class="sku-label">SKU generado:</span>
            <code class="sku-code">{{ skuPreview || '—' }}</code>
          </div>
          <div class="form-grid">
            <div class="field" :class="{ error: errors.prefijo }">
              <label>Prefijo (3 letras) *</label>
              <input v-model="form.prefijo" type="text" maxlength="3" placeholder="Ej: LKH"
                     @input="form.prefijo = form.prefijo.toUpperCase()" />
              <span class="field-error" v-if="errors.prefijo">{{ errors.prefijo }}</span>
            </div>
            <div class="field">
              <label>Codigo color (para SKU)</label>
              <input v-model="form.color" type="text" placeholder="Ej: 5505" />
            </div>
            <div class="field">
              <label>Terminacion (para SKU)</label>
              <input v-model="form.terminacion" type="text" placeholder="Ej: SE, BR, TE"
                     @input="form.terminacion = form.terminacion.toUpperCase()" />
            </div>
            <div class="field" :class="{ error: errors.nomenclaturaMedida }">
              <label>Nomenclatura medida (3 numeros) *</label>
              <input v-model="form.nomenclaturaMedida" type="text" maxlength="3"
                     placeholder="Ej: 410"
                     @input="onNomenclatura" />
              <span class="field-error" v-if="errors.nomenclaturaMedida">{{ errors.nomenclaturaMedida }}</span>
            </div>
          </div>

          <!-- Producto -->
          <div class="section-title">Producto</div>
          <div class="form-grid">
            <div class="field" :class="{ error: errors.name }">
              <label>Producto *</label>
              <input v-model="form.name" type="text" placeholder="Nombre del producto" />
              <span class="field-error" v-if="errors.name">{{ errors.name }}</span>
            </div>
            <div class="field">
              <label>Grupo</label>
              <select v-model="form.grupo">
                <option value="">Sin grupo</option>
                <option v-for="g in grupos" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div class="field">
              <label>Tipo</label>
              <input v-model="form.tipo" type="text" placeholder="Ej: Compensado, Liso..." />
            </div>
            <div class="field">
              <label>Espesor</label>
              <input v-model="form.espesor" type="text" placeholder="Ej: 3, 6, 0.6..." />
            </div>
            <div class="field full">
              <label>Detalle</label>
              <textarea v-model="form.detalle" rows="2" placeholder="Descripcion adicional del producto..."></textarea>
            </div>
          </div>

          <!-- Medida y m2 -->
          <div class="section-title">Medida</div>
          <div class="form-grid">
            <div class="field">
              <label>Medida (mm)</label>
              <input v-model="form.medida" type="text" placeholder="Ej: 1220 x 3050" />
            </div>
            <div class="field">
              <label>m2 por unidad</label>
              <div class="m2-display">
                <span v-if="m2Calc !== null">{{ m2Calc }} m2</span>
                <span v-else class="muted">Se calcula con la medida</span>
              </div>
            </div>
          </div>

          <!-- Precio -->
          <div class="section-title">Precio</div>
          <div class="form-grid">
            <div class="field">
              <label>Precio</label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">$</span>
                <input v-model.number="form.precio" type="number" min="0" step="0.01" placeholder="0.00" class="has-prefix" />
              </div>
            </div>
            <div class="field">
              <label>Unidad de precio</label>
              <select v-model="form.unidadPrecio">
                <option value="hoja">Por hoja</option>
                <option value="placa">Por placa</option>
                <option value="m2">Por m2</option>
              </select>
            </div>
          </div>

          <!-- Comercial -->
          <div class="section-title">Comercial</div>
          <div class="form-grid">
            <div class="field">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.admiteDescuentos" />
                <span>Admite descuentos</span>
              </label>
            </div>
            <div class="field full">
              <label>Comentarios</label>
              <textarea v-model="form.comentario" rows="2" placeholder="Observaciones, condiciones especiales..."></textarea>
            </div>
          </div>

          <!-- Imagen -->
          <div class="section-title">Imagen</div>
          <div class="field full">
            <label>URL de imagen</label>
            <input v-model="form.image" type="url" placeholder="https://..." />
            <div v-if="form.image" class="img-preview">
              <img :src="form.image" alt="preview" @error="form.image = ''" />
            </div>
          </div>

          <div class="form-footer">
            <button type="submit" :disabled="saving">
              <i class="bi" :class="saving ? 'bi-hourglass-split' : 'bi-plus-lg'"></i>
              {{ saving ? 'Guardando...' : 'Crear producto' }}
            </button>
            <router-link to="/inventory">
              <button type="button" class="secondary-button">Cancelar</button>
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const router = useRouter()
const store = useProductsStore()
const toast = useToast()

const saving = ref(false)
const errors = ref({})
const grupos = ref([])

const form = ref({
  prefijo: '',
  name: '',
  grupo: '',
  tipo: '',
  espesor: '',
  detalle: '',
  terminacion: '',
  color: '',
  medida: '',
  nomenclaturaMedida: '',
  admiteDescuentos: true,
  comentario: '',
  image: '',
  precio: null,
  unidadPrecio: 'hoja',
})

const skuPreview = computed(() => {
  const { prefijo, color, terminacion, nomenclaturaMedida } = form.value
  if (!prefijo && !color && !terminacion && !nomenclaturaMedida) return ''
  return `${prefijo}${color}${terminacion}${nomenclaturaMedida}`
})

const m2Calc = computed(() => {
  const m = form.value.medida
  if (!m) return null
  const parts = m.replace(/mm/gi, '').split(/[x×]/i).map(s => parseFloat(s.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return Number(((parts[0] * parts[1]) / 1000000).toFixed(4))
  }
  return null
})

function onNomenclatura() {
  form.value.nomenclaturaMedida = form.value.nomenclaturaMedida.replace(/\D/g, '').slice(0, 3)
}

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/product-groups`, authHeader())
    grupos.value = (Array.isArray(data) ? data : []).map(g => g.nombre)
  } catch { /* ignore */ }
})

function validate() {
  const e = {}
  if (!form.value.prefijo.trim() || form.value.prefijo.trim().length !== 3) e.prefijo = 'Debe tener exactamente 3 letras.'
  if (!form.value.name.trim()) e.name = 'El nombre es obligatorio.'
  if (form.value.nomenclaturaMedida && form.value.nomenclaturaMedida.length !== 3) e.nomenclaturaMedida = 'Debe tener exactamente 3 numeros.'
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    await store.createProduct({ ...form.value })
    toast.success('Producto creado correctamente.')
    router.push('/inventory')
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al crear el producto.'
    toast.error(msg)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.back-row { margin-bottom: 1.2rem; }
.back-row a { text-decoration: none; }

.edit-layout { display: flex; flex-direction: column; gap: 1.5rem; }
.edit-header h2 { margin: 0; }

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary, #6b8e3a);
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(107,142,58,0.18);
  margin-top: 0.5rem;
}

.edit-form { display: flex; flex-direction: column; gap: 1.2rem; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field.full { grid-column: 1 / -1; }
.field.error input, .field.error select, .field.error textarea { border-color: #dc2626; }

.field label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-muted);
}

.field-error { font-size: 0.78rem; color: #dc2626; text-transform: none; }

.sku-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(107,142,58,0.08);
  border-radius: 12px;
  margin-bottom: 0.25rem;
}

.sku-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-muted);
}

.sku-code {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text, #2d3d24);
  letter-spacing: 0.05em;
}

.m2-display {
  padding: 0.65rem 1rem;
  background: rgba(107,142,58,0.06);
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text, #2d3d24);
}

.m2-display .muted {
  font-weight: 400;
  font-size: 0.82rem;
  color: var(--color-muted);
}

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

textarea {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  text-transform: none !important;
  font-size: 0.88rem !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary, #6b8e3a);
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
