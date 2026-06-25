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
            <span class="sku-label">SKU base:</span>
            <code class="sku-code">{{ skuPreview || '—' }}</code>
            <span v-if="form.variantes.length > 1" class="sku-hint">(+ terminacion del tipo en cotizacion)</span>
            <span v-if="form.colorMode === 'todos' || form.selectedColors.length > 1" class="sku-hint">(+ color en cotizacion)</span>
          </div>
          <div class="form-grid">
            <div class="field" :class="{ error: errors.prefijo }">
              <label>Prefijo (3 letras) *</label>
              <input v-model="form.prefijo" type="text" maxlength="3" placeholder="Ej: LKH"
                     @input="form.prefijo = form.prefijo.toUpperCase()" />
              <span class="field-error" v-if="errors.prefijo">{{ errors.prefijo }}</span>
            </div>
            <div class="field" :class="{ error: errors.nomenclaturaMedida }">
              <label>Nomenclatura medida (3 numeros) *</label>
              <input v-model="form.nomenclaturaMedida" type="text" maxlength="3"
                     placeholder="Ej: 410" @input="onNomenclatura" />
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
              <div class="grupo-row">
                <select v-model="form.grupo" class="grupo-select">
                  <option value="">Sin grupo</option>
                  <option v-for="g in grupos" :key="g" :value="g">{{ g }}</option>
                </select>
                <button type="button" class="btn-sm secondary-button" @click="showNewGrupo = !showNewGrupo"
                        title="Crear grupo">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
              <div v-if="showNewGrupo" class="new-grupo-row">
                <input v-model="newGrupoName" type="text" placeholder="Nombre del nuevo grupo" />
                <button type="button" class="btn-sm" @click="createGrupo" :disabled="!newGrupoName.trim()">Crear</button>
              </div>
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

          <!-- Color -->
          <div class="section-title">Color</div>
          <div class="form-grid">
            <div class="field full">
              <label>Modo de color</label>
              <select v-model="form.colorMode">
                <option value="todos">TODOS (todos los colores disponibles)</option>
                <option value="especifico">Colores especificos</option>
              </select>
            </div>
          </div>

          <!-- TODOS: preview de colores -->
          <div v-if="form.colorMode === 'todos'" class="color-catalog-preview">
            <div class="color-group-section" v-for="g in [1,2,3]" :key="g">
              <div class="color-group-header">Grupo {{ romanNum(g) }} ({{ colorsByGroup(g).length }} colores)</div>
              <div class="color-chips-row">
                <span v-for="c in colorsByGroup(g).slice(0, 8)" :key="c.code" class="color-chip-sm">
                  {{ c.code }} {{ c.name }}
                </span>
                <span v-if="colorsByGroup(g).length > 8" class="color-chip-sm more">
                  +{{ colorsByGroup(g).length - 8 }} mas
                </span>
              </div>
            </div>
          </div>

          <!-- ESPECIFICO: checkboxes por grupo -->
          <div v-if="form.colorMode === 'especifico'" class="color-catalog-select">
            <div class="color-group-section" v-for="g in [1,2,3]" :key="g">
              <div class="color-group-header">
                <span>Grupo {{ romanNum(g) }}</span>
                <button type="button" class="btn-link" @click="toggleGroup(g)">
                  {{ isGroupAllSelected(g) ? 'Deseleccionar' : 'Seleccionar todo' }}
                </button>
              </div>
              <div class="color-check-grid">
                <label v-for="c in colorsByGroup(g)" :key="c.code" class="color-check-item"
                       :class="{ checked: form.selectedColors.includes(c.code) }">
                  <input type="checkbox" :value="c.code" v-model="form.selectedColors" />
                  <span class="color-check-code">{{ c.code }}</span>
                  <span class="color-check-name">{{ c.name }}</span>
                </label>
              </div>
            </div>
            <div v-if="form.selectedColors.length" class="color-selection-count">
              {{ form.selectedColors.length }} color{{ form.selectedColors.length !== 1 ? 'es' : '' }} seleccionado{{ form.selectedColors.length !== 1 ? 's' : '' }}
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

          <!-- Tipos y Precios -->
          <div class="section-title">Tipos y precios</div>
          <div class="form-grid">
            <div class="field">
              <label>Unidad de precio</label>
              <select v-model="form.unidadPrecio">
                <option value="hoja">Por hoja</option>
                <option value="placa">Por placa</option>
                <option value="m2">Por m2</option>
              </select>
            </div>
          </div>
          <p class="hint">Cada fila es un tipo/terminacion del producto con sus precios por grupo de color.</p>
          <div class="variantes-table-wrap">
            <table class="variantes-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Terminacion (SKU)</th>
                  <th>$ Grupo I</th>
                  <th>$ Grupo II</th>
                  <th>$ Grupo III</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, i) in form.variantes" :key="i">
                  <td>
                    <input v-model="v.tipo" type="text" placeholder="Ej: Brillante" class="input-sm" />
                  </td>
                  <td>
                    <input v-model="v.terminacion" type="text" placeholder="Ej: BR" class="input-sm input-code"
                           @input="v.terminacion = v.terminacion.toUpperCase()" maxlength="4" />
                  </td>
                  <td>
                    <div class="pct-input-wrap">
                      <span class="input-prefix-inline">$</span>
                      <input v-model.number="v.precioGrupoI" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                    </div>
                  </td>
                  <td>
                    <div class="pct-input-wrap">
                      <span class="input-prefix-inline">$</span>
                      <input v-model.number="v.precioGrupoII" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                    </div>
                  </td>
                  <td>
                    <div class="pct-input-wrap">
                      <span class="input-prefix-inline">$</span>
                      <input v-model.number="v.precioGrupoIII" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                    </div>
                  </td>
                  <td>
                    <button type="button" class="btn-icon-danger" @click="removeVariante(i)"
                            v-if="form.variantes.length > 1" title="Quitar">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="secondary-button add-row-btn" @click="addVariante">
            <i class="bi bi-plus"></i> Agregar tipo
          </button>

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
          <div class="section-title">Imagen del producto</div>
          <div class="form-grid">
            <div class="field">
              <label>URL de imagen</label>
              <input v-model="form.image" type="url" placeholder="https://..." />
            </div>
            <div class="field">
              <label>o subir archivo</label>
              <div class="upload-row">
                <label class="upload-btn">
                  <i class="bi bi-upload"></i> Elegir imagen
                  <input type="file" accept="image/*" hidden @change="uploadFile($event, 'image')" />
                </label>
                <span v-if="uploading.image" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
              </div>
            </div>
          </div>
          <div v-if="form.image" class="img-preview">
            <img :src="resolveUrl(form.image)" alt="preview" @error="form.image = ''" />
          </div>

          <!-- Archivos adjuntos -->
          <div class="section-title">Archivos adjuntos</div>
          <div class="form-grid">
            <div class="field">
              <label>Catalogo</label>
              <div class="upload-row">
                <label class="upload-btn">
                  <i class="bi bi-file-earmark-pdf"></i> Subir catalogo
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" hidden @change="uploadFile($event, 'catalogo')" />
                </label>
                <span v-if="uploading.catalogo" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
              </div>
              <div v-if="form.catalogo" class="file-attached">
                <a :href="resolveUrl(form.catalogo)" target="_blank" class="file-link">
                  <i class="bi bi-file-earmark-check"></i> Ver catalogo
                </a>
                <button type="button" class="btn-icon-danger" @click="form.catalogo = ''" title="Quitar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div class="field">
              <label>Ficha tecnica</label>
              <div class="upload-row">
                <label class="upload-btn">
                  <i class="bi bi-file-earmark-pdf"></i> Subir ficha tecnica
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" hidden @change="uploadFile($event, 'fichaTecnica')" />
                </label>
                <span v-if="uploading.fichaTecnica" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
              </div>
              <div v-if="form.fichaTecnica" class="file-attached">
                <a :href="resolveUrl(form.fichaTecnica)" target="_blank" class="file-link">
                  <i class="bi bi-file-earmark-check"></i> Ver ficha tecnica
                </a>
                <button type="button" class="btn-icon-danger" @click="form.fichaTecnica = ''" title="Quitar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
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
const colorCatalog = ref([])
const showNewGrupo = ref(false)
const newGrupoName = ref('')
const uploading = ref({ image: false, catalogo: false, fichaTecnica: false })

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

async function uploadFile(event, field) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value[field] = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await axios.post(`${API_BASE_URL}/upload`, fd, {
      ...authHeader(),
      headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' },
    })
    form.value[field] = data.url
    toast.success(`Archivo subido: ${file.name}`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al subir archivo')
  } finally {
    uploading.value[field] = false
    event.target.value = ''
  }
}

function emptyVariante() {
  return { tipo: '', terminacion: '', precioGrupoI: null, precioGrupoII: null, precioGrupoIII: null }
}

function addVariante() { form.value.variantes.push(emptyVariante()) }
function removeVariante(i) { form.value.variantes.splice(i, 1) }

const form = ref({
  prefijo: '',
  name: '',
  grupo: '',
  espesor: '',
  detalle: '',
  color: '',
  colorMode: 'todos',
  selectedColors: [],
  medida: '',
  nomenclaturaMedida: '',
  admiteDescuentos: true,
  comentario: '',
  image: '',
  catalogo: '',
  fichaTecnica: '',
  unidadPrecio: 'hoja',
  variantes: [emptyVariante()],
})

const skuPreview = computed(() => {
  const { prefijo, nomenclaturaMedida, colorMode, selectedColors, variantes } = form.value
  const colorPart = colorMode === 'especifico' && selectedColors.length === 1 ? selectedColors[0] : ''
  const termPart = variantes.length === 1 ? (variantes[0].terminacion || '') : ''
  if (!prefijo && !colorPart && !termPart && !nomenclaturaMedida) return ''
  return `${prefijo}${colorPart}${termPart}${nomenclaturaMedida}`
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

function colorsByGroup(g) {
  return colorCatalog.value.filter(c => c.grupoColor === g)
}

function romanNum(g) {
  return ['I', 'II', 'III'][g - 1]
}

function isGroupAllSelected(g) {
  const codes = colorsByGroup(g).map(c => c.code)
  return codes.length > 0 && codes.every(c => form.value.selectedColors.includes(c))
}

function toggleGroup(g) {
  const codes = colorsByGroup(g).map(c => c.code)
  if (isGroupAllSelected(g)) {
    form.value.selectedColors = form.value.selectedColors.filter(c => !codes.includes(c))
  } else {
    const toAdd = codes.filter(c => !form.value.selectedColors.includes(c))
    form.value.selectedColors.push(...toAdd)
  }
}

function onNomenclatura() {
  form.value.nomenclaturaMedida = form.value.nomenclaturaMedida.replace(/\D/g, '').slice(0, 3)
}

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(async () => {
  try {
    const [groupsRes, colorsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/product-groups`, authHeader()),
      axios.get(`${API_BASE_URL}/colors`, authHeader()),
    ])
    grupos.value = (Array.isArray(groupsRes.data) ? groupsRes.data : []).map(g => g.nombre)
    colorCatalog.value = Array.isArray(colorsRes.data) ? colorsRes.data : []
  } catch { /* ignore */ }
})

async function createGrupo() {
  const nombre = newGrupoName.value.trim().toUpperCase()
  if (!nombre) return
  try {
    await axios.post(`${API_BASE_URL}/product-groups`, { nombre, descuentos: [] }, authHeader())
    grupos.value.push(nombre)
    form.value.grupo = nombre
    newGrupoName.value = ''
    showNewGrupo.value = false
    toast.success(`Grupo "${nombre}" creado`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al crear grupo')
  }
}

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
    const payload = { ...form.value }
    if (payload.colorMode === 'especifico' && payload.selectedColors.length === 1) {
      payload.color = payload.selectedColors[0]
    }
    if (payload.variantes.length === 1) {
      payload.tipo = payload.variantes[0].tipo
      payload.terminacion = payload.variantes[0].terminacion
      payload.precioGrupoI = payload.variantes[0].precioGrupoI
      payload.precioGrupoII = payload.variantes[0].precioGrupoII
      payload.precioGrupoIII = payload.variantes[0].precioGrupoIII
    }
    await store.createProduct(payload)
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
  flex-wrap: wrap;
}

.sku-label { font-size: 0.82rem; font-weight: 600; color: var(--color-muted); }
.sku-code { font-size: 1.1rem; font-weight: 700; color: var(--color-text, #2d3d24); letter-spacing: 0.05em; }
.sku-hint { font-size: 0.75rem; color: var(--color-muted); font-style: italic; }

.grupo-row { display: flex; gap: 0.4rem; align-items: center; }
.grupo-select { flex: 1; }

.new-grupo-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  margin-top: 0.35rem;
}
.new-grupo-row input { flex: 1; }

.color-catalog-preview {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem;
  background: rgba(107,142,58,0.04);
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 12px;
}

.color-group-header {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary, #6b8e3a);
  margin-bottom: 0.25rem;
}

.color-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.color-chip-sm {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(107,142,58,0.08);
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-text);
}

.color-chip-sm.more {
  background: rgba(107,142,58,0.16);
  font-weight: 700;
  color: var(--color-primary, #6b8e3a);
}

.color-catalog-select {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.75rem;
  background: rgba(107,142,58,0.04);
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 12px;
}

.color-catalog-select .color-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary, #6b8e3a);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.color-check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.3rem;
}

.color-check-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.78rem;
  transition: background 0.15s;
  border: 1px solid transparent;
}

.color-check-item:hover { background: rgba(107,142,58,0.08); }
.color-check-item.checked { background: rgba(107,142,58,0.12); border-color: rgba(107,142,58,0.25); }

.color-check-item input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary, #6b8e3a);
  flex-shrink: 0;
}

.color-check-code { font-weight: 700; min-width: 35px; }
.color-check-name { color: var(--color-muted); font-weight: 400; }

.color-selection-count {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-primary, #6b8e3a);
  text-align: right;
  padding-top: 0.3rem;
  border-top: 1px solid rgba(107,142,58,0.12);
}

.hint { font-size: 0.78rem; color: var(--color-muted); margin: 0; }

.variantes-table-wrap { overflow-x: auto; margin-top: 0.5rem; }

.variantes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.variantes-table th {
  padding: 0.45rem 0.5rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  white-space: nowrap;
}

.variantes-table td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  vertical-align: middle;
}

.input-sm {
  width: 100%;
  min-width: 100px;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.12);
  font-size: 0.82rem;
}

.input-code { max-width: 70px; text-align: center; font-weight: 700; letter-spacing: 0.05em; }

.input-num-sm {
  width: 80px;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.12);
  font-size: 0.82rem;
  text-align: right;
}

.pct-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.input-prefix-inline { font-size: 0.82rem; font-weight: 600; color: var(--color-muted); }

.btn-icon-danger {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.btn-icon-danger:hover { background: rgba(220,38,38,0.1); }

.add-row-btn { align-self: flex-start; margin-top: 0.4rem; }

.m2-display {
  padding: 0.65rem 1rem;
  background: rgba(107,142,58,0.06);
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text, #2d3d24);
}

.m2-display .muted { font-weight: 400; font-size: 0.82rem; color: var(--color-muted); }

.input-prefix-wrap { position: relative; }
.input-prefix {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-weight: 600;
}
.has-prefix { padding-left: 1.8rem !important; }

textarea { resize: vertical; min-height: 60px; font-family: inherit; font-size: 0.9rem; }

.checkbox-label {
  display: flex; align-items: center; gap: 0.55rem; cursor: pointer;
  text-transform: none !important; font-size: 0.88rem !important;
  font-weight: 500 !important; letter-spacing: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: 16px; height: 16px; accent-color: var(--color-primary, #6b8e3a);
}

.img-preview {
  margin-top: 0.6rem; border-radius: 14px; overflow: hidden;
  width: 120px; height: 120px; border: 1px solid rgba(107,142,58,0.16);
}
.img-preview img { width: 100%; height: 100%; object-fit: cover; }

.form-footer {
  display: flex; flex-wrap: wrap; gap: 0.85rem; padding-top: 0.5rem;
  border-top: 1px solid rgba(107,142,58,0.12);
}
.form-footer a { text-decoration: none; }

.upload-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px dashed rgba(107,142,58,0.35);
  background: rgba(107,142,58,0.06);
  color: var(--color-primary, #6b8e3a);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-btn:hover { background: rgba(107,142,58,0.14); border-style: solid; }

.upload-status { font-size: 0.78rem; color: var(--color-muted); }

.file-attached {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-primary, #6b8e3a);
  text-decoration: none;
}
.file-link:hover { text-decoration: underline; }
</style>
