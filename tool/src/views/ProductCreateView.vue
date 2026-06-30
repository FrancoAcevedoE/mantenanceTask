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
            <span v-if="form.tiposConfig.flatMap(tc => tc.terminaciones).length > 1" class="sku-hint">(+ terminacion en cotizacion)</span>
            <span v-if="form.colorMode === 'todos' || form.selectedColors.length > 1" class="sku-hint">(+ color en cotizacion)</span>
          </div>
          <div class="form-grid">
            <div class="field" :class="{ error: errors.prefijo }">
              <label>Prefijo (3 letras) *</label>
              <input v-model="form.prefijo" type="text" maxlength="3" placeholder="Ej: LKH"
                     @input="form.prefijo = form.prefijo.toUpperCase()" />
              <span class="field-error" v-if="errors.prefijo">{{ errors.prefijo }}</span>
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
            <div class="field">
              <label>Modo de color</label>
              <select v-model="form.colorMode">
                <option value="todos">TODOS (todos los colores disponibles)</option>
                <option value="especifico">Colores especificos</option>
              </select>
            </div>
            <div class="field" v-if="form.colorMode === 'especifico' || form.colorMode === 'todos'">
              <label>Buscar color</label>
              <div class="color-search-wrap">
                <i class="bi bi-search color-search-icon"></i>
                <input v-model="colorSearch" type="text" placeholder="Buscar por codigo o nombre..." class="color-search-input" />
                <button v-if="colorSearch" type="button" class="color-search-clear" @click="colorSearch = ''">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- TODOS: preview de colores -->
          <div v-if="form.colorMode === 'todos'" class="color-panel">
            <div class="color-group-section" v-for="g in [1,2,3]" :key="g">
              <div class="color-group-badge" :class="'grupo-' + g">Grupo {{ romanNum(g) }} <span class="color-group-count">{{ filteredColorsByGroup(g).length }}</span></div>
              <div class="color-chips-grid">
                <span v-for="c in filteredColorsByGroup(g)" :key="c.code" class="color-chip">
                  <span class="color-chip-code">{{ c.code }}</span>
                  <span class="color-chip-name">{{ c.name }}</span>
                </span>
              </div>
              <div v-if="!filteredColorsByGroup(g).length" class="color-empty">Sin resultados</div>
            </div>
          </div>

          <!-- ESPECIFICO: checkboxes por grupo -->
          <div v-if="form.colorMode === 'especifico'" class="color-panel">
            <div v-if="form.selectedColors.length" class="color-selection-bar">
              <span class="color-selection-count">{{ form.selectedColors.length }} color{{ form.selectedColors.length !== 1 ? 'es' : '' }}</span>
              <button type="button" class="btn-link" @click="form.selectedColors = []">Limpiar seleccion</button>
            </div>
            <div class="color-group-section" v-for="g in [1,2,3]" :key="g">
              <div class="color-group-header-row">
                <div class="color-group-badge" :class="'grupo-' + g">Grupo {{ romanNum(g) }} <span class="color-group-count">{{ filteredColorsByGroup(g).length }}</span></div>
                <button type="button" class="btn-link" @click="toggleGroup(g)">
                  {{ isGroupAllSelected(g) ? 'Deseleccionar todo' : 'Seleccionar todo' }}
                </button>
              </div>
              <div class="color-check-grid">
                <label v-for="c in filteredColorsByGroup(g)" :key="c.code" class="color-check-item"
                       :class="{ checked: form.selectedColors.includes(c.code) }">
                  <input type="checkbox" :value="c.code" v-model="form.selectedColors" />
                  <span class="color-check-code">{{ c.code }}</span>
                  <span class="color-check-name">{{ c.name }}</span>
                  <span v-if="c.tipo" class="color-check-tipo">{{ c.tipo }}</span>
                </label>
              </div>
              <div v-if="!filteredColorsByGroup(g).length" class="color-empty">Sin resultados</div>
            </div>
          </div>

          <!-- Espesores y Medidas -->
          <div class="section-title">Espesores y medidas</div>
          <p class="hint">Cada fila es una combinacion espesor + medida. Se usan para generar el SKU y calcular m2.</p>
          <div v-for="(em, ei) in form.espesoresMedidas" :key="ei" class="tipo-block">
            <div class="em-row">
              <div class="em-field">
                <label class="sub-label-sm">Espesor (mm)</label>
                <input v-model="em.espesor" type="text" placeholder="Ej: 3" class="input-sm" style="max-width:80px" />
              </div>
              <div class="em-field">
                <label class="sub-label-sm">Medida (mm)</label>
                <input v-model="em.medida" type="text" placeholder="Ej: 1220 x 3050" class="input-sm" />
              </div>
              <div class="em-field">
                <label class="sub-label-sm">Nomenclatura (3 num)</label>
                <input v-model="em.nomenclaturaMedida" type="text" maxlength="3" placeholder="410" class="input-sm" style="max-width:70px"
                       @input="em.nomenclaturaMedida = em.nomenclaturaMedida.replace(/\D/g, '').slice(0, 3)" />
              </div>
              <div class="em-field">
                <label class="sub-label-sm">m2</label>
                <div class="m2-display-sm">{{ calcM2(em.medida) ?? '—' }}</div>
              </div>
              <button type="button" class="btn-icon-danger" @click="removeEspesorMedida(ei)"
                      v-if="form.espesoresMedidas.length > 1" title="Quitar" style="align-self:flex-end;margin-bottom:0.3rem">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <button type="button" class="secondary-button btn-sm" @click="addEspesorMedida">
            <i class="bi bi-plus"></i> Agregar espesor / medida
          </button>

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

          <!-- Tipos de producto con sus terminaciones -->
          <div v-for="(tc, ti) in form.tiposConfig" :key="ti" class="tipo-block">
            <div class="tipo-block-header">
              <div class="tipo-name-row">
                <label class="sub-label">Tipo de producto</label>
                <input v-model="tc.nombre" type="text" placeholder="Ej: Compensado" class="input-sm tipo-name-input" />
                <button type="button" class="btn-icon-danger" @click="removeTipoConfig(ti)"
                        v-if="form.tiposConfig.length > 1" title="Quitar tipo">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
              <div v-if="tc.nombre.trim()" class="tipo-terms-section">
                <label class="sub-label-sm">Terminaciones para {{ tc.nombre }}</label>
                <div class="terminaciones-checks">
                  <label v-for="t in allTerminaciones" :key="t.code" class="term-check-item"
                         :class="{ checked: tc.terminaciones.includes(t.code) }">
                    <input type="checkbox" :value="t.code" v-model="tc.terminaciones" />
                    <span class="term-name">{{ t.nombre }}</span>
                    <span class="term-code">{{ t.code }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Tabla de precios de este tipo -->
            <div v-if="tc.nombre.trim() && tc.terminaciones.length" class="variantes-table-wrap">
              <table class="variantes-table">
                <thead>
                  <tr>
                    <th>Terminacion</th>
                    <th>SKU</th>
                    <th>$ General</th>
                    <th>$ Grupo I</th>
                    <th>$ Grupo II</th>
                    <th>$ Grupo III</th>
                    <th class="th-grupo-extra">
                      <label class="grupo-extra-head">
                        <input type="checkbox" v-model="form.habilitarGrupoExtra" />
                        <input v-if="form.habilitarGrupoExtra"
                               v-model="form.grupoExtraLabel"
                               type="text" class="grupo-extra-label-input"
                               placeholder="Grupo IV" maxlength="20"
                               @click.stop />
                        <span v-else class="grupo-extra-hint">+ Grupo extra</span>
                      </label>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in getRowsForTipo(ti)" :key="row._key">
                    <td class="cell-label">{{ row.tipoTerminacion }} <code>{{ row.terminacion }}</code></td>
                    <td class="cell-sku"><code>{{ skuForVariante(row) }}</code></td>
                    <td>
                      <div class="pct-input-wrap">
                        <span class="input-prefix-inline">$</span>
                        <input v-model.number="row.precioGeneral" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                      </div>
                    </td>
                    <td>
                      <div class="pct-input-wrap">
                        <span class="input-prefix-inline">$</span>
                        <input v-model.number="row.precioGrupoI" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                      </div>
                    </td>
                    <td>
                      <div class="pct-input-wrap">
                        <span class="input-prefix-inline">$</span>
                        <input v-model.number="row.precioGrupoII" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                      </div>
                    </td>
                    <td>
                      <div class="pct-input-wrap">
                        <span class="input-prefix-inline">$</span>
                        <input v-model.number="row.precioGrupoIII" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                      </div>
                    </td>
                    <td>
                      <div v-if="form.habilitarGrupoExtra" class="pct-input-wrap">
                        <span class="input-prefix-inline">$</span>
                        <input v-model.number="row.precioGrupoIV" type="number" min="0" step="0.01" placeholder="0" class="input-num-sm" />
                      </div>
                      <span v-else class="cell-extra-off">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button type="button" class="secondary-button add-row-btn" @click="addTipoConfig">
            <i class="bi bi-plus"></i> Agregar otro +
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

          <!-- Tabla de descuentos del grupo -->
          <div v-if="form.admiteDescuentos && selectedGroupData?.descuentos?.length" class="descuentos-preview">
            <div class="section-title">Descuentos de {{ selectedGroupData.nombre }}</div>
            <div class="desc-table-wrap">
              <table class="variantes-table">
                <thead>
                  <tr>
                    <th>Comentario</th>
                    <th>% Dto cantidad</th>
                    <th>% Dto contado</th>
                    <th>% Dto 30 dias</th>
                    <th>% Cant+Contado</th>
                    <th>% Cant+30dias</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, i) in selectedGroupData.descuentos" :key="i">
                    <td class="cell-label">{{ d.nota || '—' }}</td>
                    <td>{{ d.porcCantidad }}%</td>
                    <td>{{ d.porcContado }}%</td>
                    <td>{{ d.porc30dias }}%</td>
                    <td class="calc-cell">{{ d.porcCantidadContado?.toFixed(2) }}%</td>
                    <td class="calc-cell">{{ d.porcCantidad30dias?.toFixed(2) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="hint">Para editar estos descuentos, ir a <router-link to="/product-groups">Grupos</router-link>.</p>
          </div>
          <div v-else-if="form.admiteDescuentos && form.grupo && !selectedGroupData?.descuentos?.length" class="hint">
            El grupo {{ form.grupo }} no tiene descuentos configurados. <router-link to="/product-groups">Configurar en Grupos</router-link>.
          </div>

          <!-- Imagen -->
          <div class="section-title">Imagen del producto</div>
          <div class="form-grid">
            <div class="field">
              <label>URL de imagen</label>
              <input v-model="form.image" type="text" placeholder="https://..." />
            </div>
            <div class="field">
              <label>o subir archivo</label>
              <div class="upload-row">
                <label class="upload-btn">
                  <i class="bi bi-upload"></i> Elegir imagen
                  <input type="file" accept="image/*" hidden @change="uploadImage($event)" />
                </label>
                <span v-if="uploadingImage" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
              </div>
            </div>
          </div>
          <div v-if="form.image" class="img-preview">
            <img :src="resolveUrl(form.image)" alt="preview" @error="form.image = ''" />
          </div>

          <!-- Archivos adjuntos -->
          <div class="section-title">Archivos adjuntos</div>
          <div class="archivos-list">
            <div v-for="(arch, ai) in form.archivos" :key="ai" class="archivo-item">
              <div class="archivo-top">
                <input v-model="arch.titulo" type="text" placeholder="Titulo del archivo (ej: Catalogo, Ficha tecnica...)" class="input-sm" style="flex:1" />
                <button type="button" class="btn-icon-danger" @click="removeArchivo(ai)" title="Quitar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
              <div v-if="!arch.url" class="upload-row">
                <label class="upload-btn">
                  <i class="bi bi-upload"></i> Subir archivo
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" hidden @change="uploadArchivo($event, ai)" />
                </label>
                <span v-if="arch._uploading" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
              </div>
              <div v-else class="file-attached">
                <a :href="resolveUrl(arch.url)" target="_blank" class="file-link">
                  <i class="bi bi-file-earmark-check"></i> {{ arch.titulo || 'Ver archivo' }}
                </a>
                <button type="button" class="btn-icon-danger" @click="arch.url = ''" title="Cambiar">
                  <i class="bi bi-arrow-repeat"></i>
                </button>
              </div>
            </div>
          </div>
          <button type="button" class="secondary-button btn-sm" @click="addArchivo">
            <i class="bi bi-plus"></i> Agregar archivo
          </button>
          <div class="form-grid">
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
import { ref, computed, watch, onMounted } from 'vue'
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
const gruposData = ref([])
const colorCatalog = ref([])
const colorSearch = ref('')
const showNewGrupo = ref(false)
const newGrupoName = ref('')
const uploadingImage = ref(false)

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

async function doUpload(file) {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await axios.post(`${API_BASE_URL}/upload`, fd, {
    headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

async function uploadImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingImage.value = true
  try {
    form.value.image = await doUpload(file)
    toast.success(`Imagen subida: ${file.name}`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al subir imagen')
  } finally {
    uploadingImage.value = false
    event.target.value = ''
  }
}

function addArchivo() {
  form.value.archivos.push({ titulo: '', url: '', _uploading: false })
}

function removeArchivo(i) {
  form.value.archivos.splice(i, 1)
}

async function uploadArchivo(event, idx) {
  const file = event.target.files?.[0]
  if (!file) return
  const arch = form.value.archivos[idx]
  arch._uploading = true
  try {
    arch.url = await doUpload(file)
    if (!arch.titulo) arch.titulo = file.name.replace(/\.[^.]+$/, '')
    toast.success(`Archivo subido: ${file.name}`)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al subir archivo')
  } finally {
    arch._uploading = false
    event.target.value = ''
  }
}

const form = ref({
  prefijo: '',
  name: '',
  grupo: '',
  detalle: '',
  color: '',
  colorMode: 'todos',
  selectedColors: [],
  espesoresMedidas: [{ espesor: '', medida: '', nomenclaturaMedida: '' }],
  admiteDescuentos: true,
  comentario: '',
  image: '',
  archivos: [],
  unidadPrecio: 'hoja',
  tiposConfig: [{ nombre: '', terminaciones: [] }],
  habilitarGrupoExtra: false,
  grupoExtraLabel: 'Grupo IV',
})

const DEFAULT_TERMINACIONES = [
  { nombre: 'Brillante', code: 'BR' },
  { nombre: 'Semimate', code: 'SE' },
  { nombre: 'Textura', code: 'TE' },
]

const allTerminaciones = ref([...DEFAULT_TERMINACIONES])

function addTipoConfig() {
  form.value.tiposConfig.push({ nombre: '', terminaciones: [] })
}

function removeTipoConfig(i) {
  const removed = form.value.tiposConfig.splice(i, 1)[0]
  if (removed) {
    for (const code of removed.terminaciones) {
      const key = `${removed.nombre}|${code}`
      delete priceRows.value[key]
    }
  }
}

const priceRows = ref({})

function getRowsForTipo(tipoIdx) {
  const tc = form.value.tiposConfig[tipoIdx]
  if (!tc || !tc.nombre.trim()) return []
  return tc.terminaciones
    .map(code => allTerminaciones.value.find(t => t.code === code))
    .filter(Boolean)
    .map(term => {
      const key = `${tc.nombre}|${term.code}`
      if (!priceRows.value[key]) {
        priceRows.value[key] = {
          _key: key,
          tipoProducto: tc.nombre,
          tipoTerminacion: term.nombre,
          terminacion: term.code,
          precioGeneral: null,
          precioGrupoI: null,
          precioGrupoII: null,
          precioGrupoIII: null,
          precioGrupoIV: null,
        }
      } else {
        priceRows.value[key].tipoProducto = tc.nombre
        priceRows.value[key].tipoTerminacion = term.nombre
        priceRows.value[key].terminacion = term.code
      }
      return priceRows.value[key]
    })
}

function getAllVariantes() {
  const result = []
  for (let i = 0; i < form.value.tiposConfig.length; i++) {
    result.push(...getRowsForTipo(i))
  }
  return result
}

function addEspesorMedida() {
  form.value.espesoresMedidas.push({ espesor: '', medida: '', nomenclaturaMedida: '' })
}

function removeEspesorMedida(i) {
  form.value.espesoresMedidas.splice(i, 1)
}

function calcM2(medida) {
  if (!medida) return null
  const parts = medida.replace(/mm/gi, '').split(/[x×]/i).map(s => parseFloat(s.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return Number(((parts[0] * parts[1]) / 1000000).toFixed(4))
  }
  return null
}

function buildSku(prefijo, colorPart, termPart, nomenclatura, espesor) {
  const base = `${prefijo}${colorPart}${termPart}${nomenclatura}`
  return espesor ? `${base}-${espesor}` : base
}

function skuForVariante(v) {
  const { prefijo, colorMode, selectedColors, espesoresMedidas } = form.value
  const colorPart = colorMode === 'especifico' && selectedColors.length === 1 ? selectedColors[0] : ''
  const em = espesoresMedidas[0] || {}
  return buildSku(prefijo, colorPart, v.terminacion, em.nomenclaturaMedida || '', em.espesor || '')
}

const skuPreview = computed(() => {
  const { prefijo, colorMode, selectedColors, tiposConfig, espesoresMedidas } = form.value
  const colorPart = colorMode === 'especifico' && selectedColors.length === 1 ? selectedColors[0] : ''
  const allTerms = tiposConfig.flatMap(tc => tc.terminaciones)
  const termPart = allTerms.length === 1 ? allTerms[0] : ''
  const em = espesoresMedidas[0] || {}
  const nom = em.nomenclaturaMedida || ''
  const esp = em.espesor || ''
  if (!prefijo && !colorPart && !termPart && !nom) return ''
  return buildSku(prefijo, colorPart, termPart, nom, esp)
})

function colorsByGroup(g) {
  return colorCatalog.value.filter(c => c.grupoColor === g)
}

function filteredColorsByGroup(g) {
  const q = colorSearch.value.trim().toLowerCase()
  const byGroup = colorsByGroup(g)
  if (!q) return byGroup
  return byGroup.filter(c =>
    c.code.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    (c.tipo && c.tipo.toLowerCase().includes(q))
  )
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

const selectedGroupData = computed(() => {
  if (!form.value.grupo) return null
  return gruposData.value.find(g => g.nombre === form.value.grupo) || null
})



onMounted(async () => {
  try {
    const [groupsRes, colorsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/product-groups`, authHeader()),
      axios.get(`${API_BASE_URL}/colors`, authHeader()),
    ])
    gruposData.value = Array.isArray(groupsRes.data) ? groupsRes.data : []
    grupos.value = gruposData.value.map(g => g.nombre)
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
    const em0 = payload.espesoresMedidas[0] || {}
    payload.espesor = em0.espesor || ''
    payload.medida = em0.medida || ''
    payload.nomenclaturaMedida = em0.nomenclaturaMedida || ''
    payload.archivos = (payload.archivos || []).filter(a => a.url).map(a => ({ titulo: a.titulo, url: a.url }))
    const vars = getAllVariantes().map(v => ({
      tipoProducto: v.tipoProducto,
      tipoTerminacion: v.tipoTerminacion,
      terminacion: v.terminacion,
      precioGeneral: v.precioGeneral,
      precioGrupoI: v.precioGrupoI,
      precioGrupoII: v.precioGrupoII,
      precioGrupoIII: v.precioGrupoIII,
      precioGrupoIV: payload.habilitarGrupoExtra ? (v.precioGrupoIV ?? null) : null,
    }))
    payload.variantes = vars
    if (vars.length === 1) {
      const v0 = vars[0]
      payload.tipo = v0.tipoProducto
      payload.tipoTerminacion = v0.tipoTerminacion
      payload.terminacion = v0.terminacion
      payload.precioGeneral = v0.precioGeneral
      payload.precioGrupoI = v0.precioGrupoI
      payload.precioGrupoII = v0.precioGrupoII
      payload.precioGrupoIII = v0.precioGrupoIII
      payload.precioGrupoIV = v0.precioGrupoIV
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

/* Color search */
.color-search-wrap {
  position: relative; display: flex; align-items: center;
}
.color-search-icon {
  position: absolute; left: 0.75rem; color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.color-search-input {
  width: 100%; padding: 0.5rem 2rem 0.5rem 2.2rem;
  border: 1px solid rgba(107,142,58,0.2); border-radius: 10px;
  font-size: 0.85rem; background: rgba(255,255,255,0.8);
  transition: border-color 0.2s;
}
.color-search-input:focus { border-color: var(--color-primary, #6b8e3a); outline: none; }
.color-search-clear {
  position: absolute; right: 0.5rem; background: none; border: none;
  color: var(--color-muted); cursor: pointer; font-size: 0.75rem; padding: 0.2rem;
}

/* Color panel */
.color-panel {
  border: 1px solid rgba(107,142,58,0.15); border-radius: 14px;
  background: rgba(255,255,255,0.6); padding: 0.8rem;
  display: flex; flex-direction: column; gap: 0.8rem;
  max-height: 420px; overflow-y: auto;
}

.color-group-section { display: flex; flex-direction: column; gap: 0.4rem; }

.color-group-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.3rem 0.75rem; border-radius: 8px;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; width: fit-content;
}
.color-group-badge.grupo-1 { background: rgba(76,175,80,0.12); color: #2e7d32; }
.color-group-badge.grupo-2 { background: rgba(33,150,243,0.12); color: #1565c0; }
.color-group-badge.grupo-3 { background: rgba(255,152,0,0.12); color: #e65100; }
.color-group-count {
  background: rgba(0,0,0,0.08); border-radius: 6px; padding: 0.1rem 0.4rem;
  font-size: 0.68rem;
}

.color-group-header-row {
  display: flex; justify-content: space-between; align-items: center;
}

.btn-link {
  background: none; border: none; color: var(--color-primary, #6b8e3a);
  font-size: 0.72rem; font-weight: 600; cursor: pointer;
  text-decoration: underline; padding: 0;
}

/* Color chips (TODOS mode) */
.color-chips-grid {
  display: flex; flex-wrap: wrap; gap: 0.3rem;
}
.color-chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.55rem; border-radius: 7px;
  background: rgba(107,142,58,0.07); font-size: 0.72rem;
  border: 1px solid rgba(107,142,58,0.1);
}
.color-chip-code { font-weight: 700; }
.color-chip-name { color: var(--color-muted); }

/* Color checkboxes (ESPECIFICO mode) */
.color-check-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.25rem;
}
.color-check-item {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0.35rem 0.6rem; border-radius: 8px; cursor: pointer;
  font-size: 0.78rem; transition: all 0.15s;
  border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.5);
}
.color-check-item:hover { background: rgba(107,142,58,0.08); border-color: rgba(107,142,58,0.2); }
.color-check-item.checked {
  background: rgba(107,142,58,0.1); border-color: rgba(107,142,58,0.3);
  box-shadow: 0 0 0 1px rgba(107,142,58,0.15);
}
.color-check-item input[type="checkbox"] {
  width: 15px; height: 15px; accent-color: var(--color-primary, #6b8e3a); flex-shrink: 0;
}
.color-check-code { font-weight: 700; min-width: 35px; }
.color-check-name { color: var(--color-text); font-weight: 400; flex: 1; }
.color-check-tipo {
  font-size: 0.65rem; color: var(--color-muted); font-style: italic;
  background: rgba(0,0,0,0.04); padding: 0.1rem 0.35rem; border-radius: 4px;
}

.color-empty { font-size: 0.78rem; color: var(--color-muted); font-style: italic; padding: 0.3rem 0; }

.color-selection-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.4rem 0.6rem; background: rgba(107,142,58,0.08);
  border-radius: 8px; margin-bottom: 0.2rem;
}
.color-selection-count {
  font-size: 0.78rem; font-weight: 600; color: var(--color-primary, #6b8e3a);
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

.sub-section { margin-top: 0.6rem; }
.sub-label {
  font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--color-muted); display: block; margin-bottom: 0.4rem;
}
.sub-label-sm {
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--color-muted); display: block; margin-bottom: 0.3rem; margin-top: 0.4rem;
}

.tipo-block {
  border: 1px solid rgba(107,142,58,0.15);
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 0.6rem;
  background: rgba(107,142,58,0.03);
}

.tipo-block-header { display: flex; flex-direction: column; gap: 0.2rem; }
.tipo-name-row { display: flex; gap: 0.5rem; align-items: center; }
.tipo-name-input { max-width: 260px; }
.tipo-terms-section { margin-top: 0.3rem; }

.terminaciones-checks {
  display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem;
}

.term-check-item {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.7rem; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(0,0,0,0.1); font-size: 0.82rem;
  transition: all 0.15s;
}
.term-check-item:hover { background: rgba(107,142,58,0.08); }
.term-check-item.checked { background: rgba(107,142,58,0.12); border-color: rgba(107,142,58,0.3); }
.term-check-item input[type="checkbox"] { width: 14px; height: 14px; accent-color: var(--color-primary, #6b8e3a); }
.term-name { font-weight: 600; }
.term-code { font-size: 0.72rem; color: var(--color-muted); font-weight: 700; letter-spacing: 0.05em; }

.th-grupo-extra { white-space: nowrap; }
.grupo-extra-head {
  display: inline-flex; align-items: center; gap: 0.35rem;
  cursor: pointer; font-weight: 600; font-size: 0.7rem;
  color: var(--color-muted);
}
.grupo-extra-head input[type="checkbox"] { cursor: pointer; accent-color: var(--color-primary, #6b8e3a); }
.grupo-extra-label-input {
  width: 90px; padding: 0.15rem 0.35rem; border-radius: 5px;
  border: 1px solid rgba(107,142,58,0.3); font-size: 0.7rem; font-weight: 700;
  color: var(--color-text); background: rgba(107,142,58,0.04);
}
.grupo-extra-hint { opacity: 0.55; font-style: italic; }
.cell-extra-off { color: rgba(0,0,0,0.18); font-size: 0.85rem; }

.cell-label { font-size: 0.82rem; font-weight: 500; }
.cell-sku code { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: var(--color-muted); }

.em-row {
  display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: flex-end;
}
.em-field { display: flex; flex-direction: column; gap: 0.2rem; }
.m2-display-sm {
  padding: 0.4rem 0.6rem; background: rgba(107,142,58,0.06); border-radius: 8px;
  font-size: 0.85rem; font-weight: 600; min-width: 60px; text-align: center;
}

.archivos-list { display: flex; flex-direction: column; gap: 0.5rem; }
.archivo-item {
  border: 1px solid rgba(107,142,58,0.15); border-radius: 10px; padding: 0.6rem;
  background: rgba(107,142,58,0.03);
}
.archivo-top { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem; }

.descuentos-preview { margin-top: 0.3rem; }
.desc-table-wrap { overflow-x: auto; margin-top: 0.5rem; }
.calc-cell { font-weight: 600; color: var(--color-primary, #6b8e3a); white-space: nowrap; }
.descuentos-preview .hint a { color: var(--color-primary, #6b8e3a); font-weight: 600; }

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
