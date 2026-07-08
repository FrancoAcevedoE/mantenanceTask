<template>
  <div class="mkcamp-wrap">

    <!-- Toolbar -->
    <div class="mkcamp-toolbar">
      <div class="mkcamp-search-box">
        <i class="bi bi-search mkcamp-search-ico"></i>
        <input v-model="search" type="text" placeholder="Buscar campaña..." class="mkcamp-search" />
      </div>
      <select v-model="filterEstado" class="mkcamp-select">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e.key" :value="e.key">{{ e.label }}</option>
      </select>
      <button class="mkcamp-btn-add" @click="openNew">
        <i class="bi bi-plus-lg"></i> Nueva campaña
      </button>
    </div>

    <!-- Empty -->
    <div v-if="!mStore.campaigns.length" class="mkcamp-empty">
      <i class="bi bi-megaphone"></i>
      <p>No hay campañas todavía</p>
      <button @click="openNew"><i class="bi bi-plus-lg"></i> Crear primera campaña</button>
    </div>

    <!-- Campaign cards -->
    <div v-else class="mkcamp-grid">
      <div v-if="!filtered.length" class="mkcamp-empty">
        <p>Sin resultados</p>
      </div>
      <div v-for="c in filtered" :key="c._id" class="mkcamp-card">

        <!-- Cover image -->
        <div v-if="c.coverImage?.url" class="mkcamp-cover">
          <img :src="resolveUrl(c.coverImage.url)" :alt="c.coverImage.name" />
        </div>

        <div class="mkcamp-card-hd">
          <span class="mkcamp-tipo" :class="`mkcamp-tipo--${c.tipo}`">
            <i :class="TIPO_ICON[c.tipo]"></i> {{ TIPO_LABEL[c.tipo] }}
          </span>
          <span class="mkcamp-estado" :class="`mkcamp-estado--${c.estado}`">
            {{ ESTADO_LABEL[c.estado] }}
          </span>
        </div>
        <div class="mkcamp-card-name">{{ c.nombre }}</div>
        <div v-if="c.descripcion" class="mkcamp-card-desc">{{ c.descripcion }}</div>
        <div v-if="c.fechaInicio || c.fechaFin" class="mkcamp-card-dates">
          <i class="bi bi-calendar3"></i>
          <span>{{ fmtDate(c.fechaInicio) }}</span>
          <template v-if="c.fechaFin"> → <span>{{ fmtDate(c.fechaFin) }}</span></template>
        </div>

        <!-- Stats mini -->
        <div class="mkcamp-stats">
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.enviados || 0 }}</div>
            <div class="mkcamp-stat-lbl">Enviados</div>
          </div>
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.abiertos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Abiertos</div>
          </div>
          <div class="mkcamp-stat">
            <div class="mkcamp-stat-val">{{ c.stats?.respondidos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Respondidos</div>
          </div>
          <div class="mkcamp-stat mkcamp-stat--conv">
            <div class="mkcamp-stat-val">{{ c.stats?.convertidos || 0 }}</div>
            <div class="mkcamp-stat-lbl">Convertidos</div>
          </div>
        </div>

        <!-- Segmento -->
        <div class="mkcamp-segment">
          <i class="bi bi-people"></i>
          <span>{{ targetCount(c) }} destinatario{{ targetCount(c) !== 1 ? 's' : '' }}</span>
          <template v-if="c.segmento?.tipoCliente">
            · {{ c.segmento.tipoCliente === 'normal' ? 'Clientes' : 'Potenciales' }}
          </template>
          <template v-if="c.segmento?.pipelineEstados?.length">
            · {{ c.segmento.pipelineEstados.map(stageLabel).join(', ') }}
          </template>
        </div>

        <!-- Adjuntos badge -->
        <div v-if="c.attachments?.length" class="mkcamp-attach-badge">
          <i class="bi bi-paperclip"></i> {{ c.attachments.length }} adjunto{{ c.attachments.length !== 1 ? 's' : '' }}
        </div>

        <div class="mkcamp-card-ft">
          <button class="mkcamp-ico-btn" @click="openEdit(c)" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="mkcamp-ico-btn mkcamp-ico-btn--detail" @click="openDetail(c)" title="Ver destinatarios">
            <i class="bi bi-eye"></i>
          </button>
          <button class="mkcamp-ico-btn mkcamp-ico-btn--del" @click="confirmDel(c)" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal crear/editar ── -->
    <Teleport to="body">
      <div v-if="showModal" class="mk-backdrop" @click.self="showModal = false">
        <div class="mk-modal">
          <div class="mk-modal-hd">
            <h2>{{ editing ? 'Editar campaña' : 'Nueva campaña' }}</h2>
            <button class="mk-close" @click="showModal = false"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <div class="mk-row">
              <div class="mk-field mk-field--grow">
                <label>Nombre *</label>
                <input v-model="form.nombre" maxlength="100" placeholder="Ej: Campaña enero 2025" />
              </div>
              <div class="mk-field">
                <label>Canal</label>
                <select v-model="form.tipo">
                  <option v-for="e in TIPOS" :key="e.key" :value="e.key">{{ e.label }}</option>
                </select>
              </div>
            </div>
            <div class="mk-row">
              <div class="mk-field">
                <label>Estado</label>
                <select v-model="form.estado">
                  <option v-for="e in ESTADOS" :key="e.key" :value="e.key">{{ e.label }}</option>
                </select>
              </div>
              <div class="mk-field">
                <label>Fecha inicio</label>
                <input v-model="form.fechaInicio" type="date" />
              </div>
              <div class="mk-field">
                <label>Fecha fin</label>
                <input v-model="form.fechaFin" type="date" />
              </div>
            </div>
            <div class="mk-field">
              <label>Descripción</label>
              <textarea v-model="form.descripcion" rows="2" maxlength="500" placeholder="Objetivo de la campaña..."></textarea>
            </div>

            <!-- Imagen de carátula -->
            <div class="mk-section-hd">Imagen de carátula</div>
            <div class="mk-cover-area">
              <!-- Preview imagen existente o pendiente -->
              <div v-if="coverPreviewUrl" class="mk-cover-preview">
                <img :src="coverPreviewUrl" alt="Carátula" />
                <button class="mk-cover-remove" @click="removeCover" title="Quitar imagen">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              <!-- Upload zone -->
              <label v-else class="mk-cover-upload" :class="{ disabled: uploadingCover }">
                <i class="bi bi-image"></i>
                <span>{{ uploadingCover ? 'Subiendo…' : 'Cargar imagen de carátula' }}</span>
                <small>JPG, PNG, WEBP — máx. 5 MB</small>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" :disabled="uploadingCover"
                  @change="onCoverChange" style="display:none" />
              </label>
            </div>

            <!-- Adjuntos -->
            <div class="mk-section-hd">Adjuntos <span class="mk-section-hint">(imágenes, PDF, documentos)</span></div>

            <!-- Adjuntos existentes en BD -->
            <div v-if="existingAttachments.length" class="mk-attach-list">
              <div v-for="a in existingAttachments" :key="a._id" class="mk-attach-row">
                <i :class="attachIcon(a.mimetype)" class="mk-attach-ico"></i>
                <a :href="resolveUrl(a.url)" target="_blank" rel="noopener" class="mk-attach-name">{{ a.name }}</a>
                <span class="mk-attach-size">{{ fmtSize(a.size) }}</span>
                <button class="mk-attach-del" @click="removeExistingAttachment(a._id)" title="Quitar">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>

            <!-- Adjuntos pendientes (aún no subidos) -->
            <div v-if="pendingAttachments.length" class="mk-attach-list">
              <div v-for="(f, i) in pendingAttachments" :key="i" class="mk-attach-row mk-attach-row--pending">
                <i :class="attachIcon(f.type)" class="mk-attach-ico"></i>
                <span class="mk-attach-name">{{ f.name }}</span>
                <span class="mk-attach-size">{{ fmtSize(f.size) }}</span>
                <button class="mk-attach-del" @click="pendingAttachments.splice(i, 1)" title="Quitar">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>

            <label class="mk-attach-upload-btn" :class="{ disabled: uploadingFiles }">
              <i class="bi bi-paperclip"></i>
              {{ uploadingFiles ? 'Subiendo…' : 'Agregar adjunto' }}
              <input type="file" multiple :disabled="uploadingFiles" @change="onAttachChange" style="display:none" />
            </label>

            <!-- Segmento -->
            <div class="mk-section-hd">Segmento de destinatarios</div>
            <div class="mk-row">
              <div class="mk-field">
                <label>Tipo de cliente</label>
                <select v-model="form.segmento.tipoCliente">
                  <option value="">Todos</option>
                  <option value="normal">Clientes</option>
                  <option value="potencial">Potenciales</option>
                </select>
              </div>
            </div>
            <div class="mk-field">
              <label>Etapas del pipeline (múltiple)</label>
              <div class="mk-stage-check-group">
                <label v-for="s in STAGES" :key="s.key" class="mk-stage-check">
                  <input type="checkbox" :value="s.key" v-model="form.segmento.pipelineEstados" />
                  <span :style="{ color: s.color }">{{ s.label }}</span>
                </label>
              </div>
            </div>

            <!-- Clientes específicos -->
            <div class="mk-client-selector">
              <div class="mk-client-sel-hd">
                <span class="mk-client-sel-title">Clientes específicos</span>
                <span v-if="form.segmento.clienteIds.length" class="mk-client-sel-count">
                  {{ form.segmento.clienteIds.length }} seleccionado{{ form.segmento.clienteIds.length !== 1 ? 's' : '' }}
                </span>
                <button v-if="form.segmento.clienteIds.length" class="mk-client-clear" @click="form.segmento.clienteIds = []">
                  Limpiar
                </button>
              </div>
              <div class="mk-client-search-wrap">
                <i class="bi bi-search mk-client-search-ico"></i>
                <input v-model="clientSearch" type="text" placeholder="Buscar cliente por nombre, código..." class="mk-client-search" />
              </div>
              <div class="mk-client-list">
                <div v-if="!clientsForSelector.length" class="mk-client-empty">
                  {{ clientSearch ? 'Sin resultados' : 'No hay clientes cargados' }}
                </div>
                <label v-for="c in clientsForSelector" :key="c._id" class="mk-client-row"
                  :class="{ selected: form.segmento.clienteIds.includes(String(c._id)) }">
                  <input type="checkbox" :value="String(c._id)" v-model="form.segmento.clienteIds" />
                  <span class="mk-client-info">
                    <span class="mk-client-name">{{ c.razonSocial || c.nombreComercial }}</span>
                    <span class="mk-client-meta">
                      <span v-if="c.codigoCliente" class="mk-client-code">#{{ c.codigoCliente }}</span>
                      <span class="mk-client-stage" :style="{ color: stageColor(c.pipelineEstado) }">
                        {{ stageLabel(c.pipelineEstado) }}
                      </span>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div class="mk-preview-dest">
              <i class="bi bi-people"></i>
              <strong>{{ previewTargetCount }}</strong> destinatario{{ previewTargetCount !== 1 ? 's' : '' }} con este segmento
            </div>

            <p v-if="formError" class="mk-error">{{ formError }}</p>
          </div>
          <div class="mk-modal-ft">
            <button class="secondary-button" @click="showModal = false">Cancelar</button>
            <button :disabled="saving || uploadingCover || uploadingFiles" @click="save">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>{{ editing ? 'Guardar cambios' : 'Crear campaña' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Modal destinatarios ── -->
    <Teleport to="body">
      <div v-if="detailCamp" class="mk-backdrop" @click.self="detailCamp = null">
        <div class="mk-modal mk-modal--sm">
          <div class="mk-modal-hd">
            <h2><i class="bi bi-people"></i> Destinatarios — {{ detailCamp.nombre }}</h2>
            <button class="mk-close" @click="detailCamp = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <div class="mk-dest-count">
              <strong>{{ detailTargets.length }}</strong> cliente{{ detailTargets.length !== 1 ? 's' : '' }} en el segmento
            </div>
            <div class="mk-dest-list">
              <div v-for="c in detailTargets" :key="c._id" class="mk-dest-row">
                <span v-if="c.codigoCliente" class="mk-dest-cod">#{{ c.codigoCliente }}</span>
                <span class="mk-dest-name">{{ c.razonSocial || c.name }}</span>
                <span class="mk-dest-stage"
                  :style="{ background: stageColor(c.pipelineEstado)+'18', color: stageColor(c.pipelineEstado) }">
                  {{ stageLabel(c.pipelineEstado) }}
                </span>
              </div>
              <div v-if="!detailTargets.length" class="mk-dest-empty">
                No hay destinatarios con este segmento
              </div>
            </div>
          </div>
          <div class="mk-modal-ft">
            <button @click="detailCamp = null">Cerrar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Confirm delete ── -->
    <Teleport to="body">
      <div v-if="deleting" class="mk-backdrop" @click.self="deleting = null">
        <div class="mk-modal mk-modal--sm">
          <div class="mk-modal-hd">
            <h2>Eliminar campaña</h2>
            <button class="mk-close" @click="deleting = null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="mk-modal-bd">
            <p>¿Eliminás la campaña <strong>{{ deleting.nombre }}</strong>?</p>
          </div>
          <div class="mk-modal-ft">
            <button class="secondary-button" @click="deleting = null">Cancelar</button>
            <button class="danger-button" :disabled="saving" @click="doDelete">
              <div v-if="saving" class="btn-spin"></div>
              <span v-else>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMarketingStore } from '@/stores/marketing'
import { useCrmStore }       from '@/stores/crm'
import { useToast } from 'vue-toastification'
import { API_BASE_URL } from '@/utils/api'

const mStore   = useMarketingStore()
const crmStore = useCrmStore()
const toast    = useToast()

const search       = ref('')
const filterEstado = ref('')
const showModal    = ref(false)
const editing      = ref(null)
const saving       = ref(false)
const formError    = ref('')
const deleting     = ref(null)
const detailCamp   = ref(null)
const clientSearch = ref('')

const clientsForSelector = computed(() => {
  const q = clientSearch.value.trim().toLowerCase()
  let list = crmStore.visibleClients
  if (q) list = list.filter(c =>
    (c.razonSocial || c.nombreComercial || '').toLowerCase().includes(q) ||
    String(c.codigoCliente || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  )
  return list.slice(0, 60)
})

// File state
const pendingCover       = ref(null)   // File object pendiente de subir (nueva imagen)
const coverPreviewUrl    = ref('')     // URL para previsualizar (blob o URL existente)
const removingCover      = ref(false)  // si el usuario quiere quitar cover existente
const uploadingCover     = ref(false)
const pendingAttachments = ref([])     // File[] pendientes de subir
const existingAttachments = ref([])    // attachments ya en BD para la campaña editada
const uploadingFiles     = ref(false)

function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return API_BASE_URL + url.replace(/^\/api/, '')
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function attachIcon(mime = '') {
  if (mime.startsWith('image/')) return 'bi bi-file-earmark-image-fill'
  if (mime === 'application/pdf') return 'bi bi-file-earmark-pdf-fill'
  if (mime.includes('word'))      return 'bi bi-file-earmark-word-fill'
  if (mime.includes('sheet') || mime.includes('excel')) return 'bi bi-file-earmark-excel-fill'
  return 'bi bi-file-earmark-fill'
}

const TIPOS  = [
  { key: 'email',     label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'mixta',    label: 'Mixta' },
  { key: 'llamada',  label: 'Llamada' },
]
const ESTADOS = [
  { key: 'borrador',   label: 'Borrador' },
  { key: 'activa',     label: 'Activa' },
  { key: 'pausada',    label: 'Pausada' },
  { key: 'finalizada', label: 'Finalizada' },
]
const TIPO_LABEL  = Object.fromEntries(TIPOS.map(t => [t.key, t.label]))
const TIPO_ICON   = { email: 'bi bi-envelope-fill', whatsapp: 'bi bi-whatsapp', mixta: 'bi bi-layers-fill', llamada: 'bi bi-telephone-fill' }
const ESTADO_LABEL = Object.fromEntries(ESTADOS.map(e => [e.key, e.label]))

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

function emptyForm() {
  return {
    nombre: '', tipo: 'email', estado: 'borrador',
    descripcion: '', fechaInicio: '', fechaFin: '',
    segmento: { tipoCliente: '', pipelineEstados: [], clienteIds: [] },
  }
}
const form = ref(emptyForm())

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function targetCount(c) { return mStore.campaignTargets(c).length }
const previewTargetCount = computed(() => mStore.campaignTargets({ segmento: form.value.segmento }).length)
const detailTargets = computed(() => detailCamp.value ? mStore.campaignTargets(detailCamp.value) : [])

const filtered = computed(() => {
  let list = mStore.campaigns
  if (filterEstado.value) list = list.filter(c => c.estado === filterEstado.value)
  if (search.value.trim()) {
    const rx = new RegExp(search.value.trim(), 'i')
    list = list.filter(c => rx.test(c.nombre) || rx.test(c.descripcion))
  }
  return list
})

function resetFileState() {
  if (coverPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl.value)
  pendingCover.value       = null
  coverPreviewUrl.value    = ''
  removingCover.value      = false
  pendingAttachments.value = []
  existingAttachments.value = []
}

function openNew() {
  editing.value = null
  form.value = emptyForm()
  formError.value = ''
  clientSearch.value = ''
  resetFileState()
  showModal.value = true
}

function openEdit(c) {
  editing.value = c
  form.value = {
    nombre:      c.nombre,
    tipo:        c.tipo,
    estado:      c.estado,
    descripcion: c.descripcion || '',
    fechaInicio: c.fechaInicio ? c.fechaInicio.slice(0, 10) : '',
    fechaFin:    c.fechaFin    ? c.fechaFin.slice(0, 10)    : '',
    segmento: {
      tipoCliente:     c.segmento?.tipoCliente || '',
      pipelineEstados: [...(c.segmento?.pipelineEstados || [])],
      clienteIds:      [...(c.segmento?.clienteIds || [])],
    },
  }
  formError.value = ''
  clientSearch.value = ''
  resetFileState()
  if (c.coverImage?.url) coverPreviewUrl.value = resolveUrl(c.coverImage.url)
  existingAttachments.value = c.attachments ? [...c.attachments] : []
  showModal.value = true
}

function openDetail(c) { detailCamp.value = c }
function confirmDel(c) { deleting.value = c }

// ── Cover image ──
function onCoverChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5 MB'); return }
  if (coverPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl.value)
  pendingCover.value    = file
  coverPreviewUrl.value = URL.createObjectURL(file)
  e.target.value = ''
}

function removeCover() {
  if (coverPreviewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(coverPreviewUrl.value)
  pendingCover.value    = null
  coverPreviewUrl.value = ''
  removingCover.value   = true   // marcar para eliminar la existente al guardar
}

// ── Attachments ──
function onAttachChange(e) {
  const files = Array.from(e.target.files || [])
  for (const f of files) {
    if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name}: máx. 20 MB`); continue }
    pendingAttachments.value.push(f)
  }
  e.target.value = ''
}

async function removeExistingAttachment(attachId) {
  if (!editing.value) return
  try {
    await mStore.removeAttachment(editing.value._id, attachId)
    existingAttachments.value = existingAttachments.value.filter(a => a._id !== attachId)
  } catch {
    toast.error('Error al quitar el adjunto')
  }
}

async function save() {
  formError.value = ''
  if (!form.value.nombre.trim()) { formError.value = 'El nombre es obligatorio'; return }
  saving.value = true
  try {
    let saved
    if (editing.value) {
      saved = await mStore.updateCampaign(editing.value._id, { ...form.value })
      toast.success('Campaña actualizada')
    } else {
      saved = await mStore.createCampaign({ ...form.value })
      toast.success('Campaña creada')
    }

    // Quitar cover existente si se marcó
    if (removingCover.value && editing.value?.coverImage?.url) {
      await mStore.removeCover(saved._id)
    }

    // Subir cover pendiente
    if (pendingCover.value) {
      uploadingCover.value = true
      await mStore.uploadCover(saved._id, pendingCover.value)
      uploadingCover.value = false
    }

    // Subir adjuntos pendientes
    if (pendingAttachments.value.length) {
      uploadingFiles.value = true
      for (const f of pendingAttachments.value) {
        await mStore.uploadAttachment(saved._id, f)
      }
      uploadingFiles.value = false
    }

    showModal.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    saving.value = false
    uploadingCover.value = false
    uploadingFiles.value = false
  }
}

async function doDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await mStore.deleteCampaign(deleting.value._id)
    deleting.value = null
    toast.success('Campaña eliminada')
  } catch {
    toast.error('Error al eliminar')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.mkcamp-wrap { min-width: 0; }

.mkcamp-toolbar {
  display: flex; flex-wrap: wrap; gap: 0.6rem;
  align-items: center; margin-bottom: 1rem;
}
.mkcamp-search-box { position: relative; flex: 1; min-width: 180px; }
.mkcamp-search-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.85rem; pointer-events: none;
}
.mkcamp-search { width: 100%; padding: 0.55rem 0.9rem 0.55rem 2.1rem; border-radius: 10px; font-size: 0.82rem; }
.mkcamp-select { padding: 0.55rem 0.9rem; border-radius: 10px; font-size: 0.8rem; min-width: 140px; }
.mkcamp-btn-add {
  padding: 0.55rem 1rem; font-size: 0.8rem; border-radius: 10px;
  white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: 0.4rem;
}

.mkcamp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  padding: 3rem 1rem; color: var(--color-muted); font-size: 0.82rem; text-align: center;
}
.mkcamp-empty i { font-size: 2.5rem; opacity: .3; }

/* Cards grid */
.mkcamp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.mkcamp-card {
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(107,142,58,.12);
  border-radius: 14px;
  padding: 0;
  display: flex; flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  transition: box-shadow .18s, transform .18s;
  overflow: hidden;
}
.mkcamp-card:hover { box-shadow: 0 5px 18px rgba(0,0,0,.1); transform: translateY(-2px); }

/* Cover image */
.mkcamp-cover {
  width: 100%; height: 140px; overflow: hidden;
  border-radius: 14px 14px 0 0; flex-shrink: 0;
}
.mkcamp-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Card inner padding */
.mkcamp-card-hd,
.mkcamp-card-name,
.mkcamp-card-desc,
.mkcamp-card-dates,
.mkcamp-stats,
.mkcamp-segment,
.mkcamp-attach-badge,
.mkcamp-card-ft { padding-left: 1rem; padding-right: 1rem; }

.mkcamp-card-hd { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding-top: 0.85rem; }
.mkcamp-card-name { font-weight: 700; font-size: 0.92rem; color: var(--color-text); padding-top: 0.3rem; }
.mkcamp-card-desc { font-size: 0.75rem; color: var(--color-muted); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; padding-top: 0.15rem; }
.mkcamp-card-dates { font-size: 0.72rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.4rem; padding-top: 0.15rem; }

.mkcamp-tipo {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
  text-transform: uppercase;
}
.mkcamp-tipo--email    { background: rgba(59,130,246,.12); color: #1d4ed8; }
.mkcamp-tipo--whatsapp { background: rgba(34,197,94,.12); color: #15803d; }
.mkcamp-tipo--mixta    { background: rgba(107,142,58,.12); color: #4d6728; }
.mkcamp-tipo--llamada  { background: rgba(245,158,11,.12); color: #b45309; }

.mkcamp-estado {
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 6px;
}
.mkcamp-estado--borrador   { background: rgba(148,163,184,.15); color: #475569; }
.mkcamp-estado--activa     { background: rgba(34,197,94,.12); color: #15803d; }
.mkcamp-estado--pausada    { background: rgba(245,158,11,.12); color: #b45309; }
.mkcamp-estado--finalizada { background: rgba(107,142,58,.12); color: #4d6728; }

.mkcamp-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem; background: rgba(107,142,58,.05);
  border-radius: 10px; padding: 0.5rem 0.25rem; margin: 0.5rem 1rem 0;
}
.mkcamp-stat { text-align: center; }
.mkcamp-stat-val { font-size: 1rem; font-weight: 800; color: var(--color-text); }
.mkcamp-stat-lbl { font-size: 0.6rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); }
.mkcamp-stat--conv .mkcamp-stat-val { color: #15803d; }

.mkcamp-segment { font-size: 0.72rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; padding-top: 0.35rem; }

.mkcamp-attach-badge {
  font-size: 0.7rem; color: var(--color-muted); display: flex; align-items: center; gap: 0.3rem;
  padding-top: 0.2rem;
}

.mkcamp-card-ft {
  display: flex; gap: 0.4rem; justify-content: flex-end; margin-top: auto;
  border-top: 1px solid rgba(107,142,58,.08); padding-top: 0.5rem; padding-bottom: 0.5rem;
  margin-top: 0.5rem;
}
.mkcamp-ico-btn {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; background: rgba(107,142,58,.08); color: var(--color-primary);
  border: none; cursor: pointer; transition: background .15s;
}
.mkcamp-ico-btn:hover { background: rgba(107,142,58,.18); }
.mkcamp-ico-btn--detail { background: rgba(59,130,246,.08); color: #1d4ed8; }
.mkcamp-ico-btn--detail:hover { background: rgba(59,130,246,.18); }
.mkcamp-ico-btn--del { background: rgba(239,68,68,.08); color: #b91c1c; }
.mkcamp-ico-btn--del:hover { background: rgba(239,68,68,.18); }

/* ── Modales ── */
.mk-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.mk-modal {
  background: var(--color-bg, #fff);
  border-radius: 18px; width: 100%; max-width: 620px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.18);
}
.mk-modal--sm { max-width: 440px; }
.mk-modal-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.1rem 1.25rem 0.75rem; border-bottom: 1px solid rgba(107,142,58,.12);
}
.mk-modal-hd h2 { font-size: 1rem; font-weight: 700; margin: 0; }
.mk-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--color-muted); padding: 4px; }
.mk-modal-bd { padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.mk-modal-ft {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 0.75rem 1.25rem 1rem; border-top: 1px solid rgba(107,142,58,.08);
}

.mk-field { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 100px; }
.mk-field--grow { flex: 2; }
.mk-field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted); }
.mk-field input, .mk-field select, .mk-field textarea {
  padding: 0.5rem 0.75rem; border-radius: 10px; font-size: 0.85rem;
}
.mk-field textarea { resize: vertical; }
.mk-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }

.mk-section-hd {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: var(--color-muted);
  border-top: 1px solid rgba(107,142,58,.1); padding-top: 0.6rem; margin-top: 0.1rem;
}
.mk-section-hint { text-transform: none; font-weight: 400; letter-spacing: 0; }

/* Cover image */
.mk-cover-area { margin-top: 0.25rem; }
.mk-cover-preview {
  position: relative; display: inline-block; border-radius: 10px; overflow: hidden;
  max-width: 200px; border: 1px solid rgba(107,142,58,.2);
}
.mk-cover-preview img { width: 100%; max-height: 120px; object-fit: cover; display: block; }
.mk-cover-remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(0,0,0,.55); color: #fff; border: none;
  border-radius: 50%; width: 22px; height: 22px; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.mk-cover-remove:hover { background: rgba(239,68,68,.85); }

.mk-cover-upload {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  padding: 0.9rem 1.25rem; border-radius: 10px;
  border: 1.5px dashed #d1d5db; background: #f9fafb;
  cursor: pointer; color: var(--color-muted); font-size: 0.82rem;
  transition: border-color .15s, background .15s; text-align: center;
}
.mk-cover-upload i { font-size: 1.4rem; color: var(--color-muted); }
.mk-cover-upload small { font-size: 0.72rem; color: #9ca3af; text-transform: none; letter-spacing: 0; }
.mk-cover-upload:hover:not(.disabled) { border-color: var(--color-primary); background: rgba(107,142,58,.05); }
.mk-cover-upload.disabled { opacity: .6; cursor: not-allowed; }

/* Adjuntos */
.mk-attach-list { display: flex; flex-direction: column; gap: 0.3rem; }
.mk-attach-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.6rem; border-radius: 8px;
  background: rgba(107,142,58,.04); border: 1px solid rgba(107,142,58,.1);
  font-size: 0.8rem;
}
.mk-attach-row--pending { background: rgba(59,130,246,.04); border-color: rgba(59,130,246,.15); }
.mk-attach-ico { font-size: 1rem; flex-shrink: 0; color: var(--color-muted); }
.mk-attach-name {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; color: var(--color-text); text-decoration: none; font-weight: 500;
}
a.mk-attach-name:hover { text-decoration: underline; color: var(--color-primary); }
.mk-attach-size { font-size: 0.68rem; color: var(--color-muted); white-space: nowrap; flex-shrink: 0; }
.mk-attach-del {
  background: none; border: none; color: #9ca3af;
  font-size: 0.95rem; cursor: pointer; padding: 0.1rem 0.2rem; flex-shrink: 0;
}
.mk-attach-del:hover { color: #ef4444; }

.mk-attach-upload-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.9rem; border-radius: 8px;
  border: 1.5px dashed #d1d5db; background: #f9fafb;
  color: var(--color-muted); font-size: 0.78rem; font-weight: 600;
  cursor: pointer; transition: border-color .15s, color .15s; align-self: flex-start;
}
.mk-attach-upload-btn:hover:not(.disabled) { border-color: var(--color-primary); color: var(--color-primary); background: rgba(107,142,58,.04); }
.mk-attach-upload-btn.disabled { opacity: .6; cursor: not-allowed; }

/* Stage checks */
.mk-stage-check-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mk-stage-check { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; cursor: pointer; }
.mk-stage-check input { cursor: pointer; accent-color: var(--color-primary); width: 14px; height: 14px; flex-shrink: 0; }
.mk-stage-check span { font-size: 0.8rem; white-space: nowrap; }

.mk-preview-dest {
  font-size: 0.78rem; color: var(--color-muted);
  background: rgba(107,142,58,.07); border-radius: 8px;
  padding: 0.45rem 0.75rem; display: flex; align-items: center; gap: 0.4rem;
}
.mk-preview-dest strong { color: var(--color-primary); font-size: 0.9rem; }

.mk-error { color: #b91c1c; font-size: 0.8rem; margin: 0; }

/* destinatarios list */
.mk-dest-count { font-size: 0.82rem; color: var(--color-muted); margin-bottom: 0.75rem; }
.mk-dest-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.mk-dest-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.5rem; border-radius: 8px;
  background: rgba(107,142,58,.04); font-size: 0.82rem;
}
.mk-dest-cod  { font-size: 0.68rem; font-weight: 700; color: var(--color-primary); min-width: 40px; }
.mk-dest-name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-dest-stage {
  font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 5px; white-space: nowrap; flex-shrink: 0;
}
.mk-dest-empty { font-size: 0.8rem; color: var(--color-muted); text-align: center; padding: 1rem; }

/* Client selector */
.mk-client-selector {
  display: flex; flex-direction: column; gap: 0.45rem;
}
.mk-client-sel-hd {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.72rem;
}
.mk-client-sel-title {
  font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--color-muted);
}
.mk-client-sel-count {
  background: rgba(107,142,58,.12); color: var(--color-primary);
  font-weight: 700; padding: 1px 8px; border-radius: 20px; font-size: 0.7rem;
}
.mk-client-clear {
  font-size: 0.7rem; padding: 1px 8px; border-radius: 20px;
  background: rgba(239,68,68,.08); color: #b91c1c;
  border: 1px solid rgba(239,68,68,.2); cursor: pointer;
  font-weight: 600; margin-left: auto;
}
.mk-client-clear:hover { background: rgba(239,68,68,.15); transform: none; box-shadow: none; }

.mk-client-search-wrap { position: relative; }
.mk-client-search-ico {
  position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%);
  color: var(--color-muted); font-size: 0.82rem; pointer-events: none;
}
.mk-client-search {
  width: 100%; padding: 0.45rem 0.75rem 0.45rem 2rem;
  border-radius: 8px; font-size: 0.82rem; box-sizing: border-box;
}

.mk-client-list {
  max-height: 200px; overflow-y: auto;
  border: 1px solid rgba(107,142,58,.15); border-radius: 10px;
  display: flex; flex-direction: column;
}
.mk-client-empty {
  padding: 1rem; text-align: center; font-size: 0.78rem; color: var(--color-muted);
}
.mk-client-row {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.4rem 0.75rem; cursor: pointer; font-size: 0.82rem;
  border-bottom: 1px solid rgba(107,142,58,.06);
  transition: background .12s;
}
.mk-client-row:last-child { border-bottom: none; }
.mk-client-row:hover { background: rgba(107,142,58,.05); }
.mk-client-row.selected { background: rgba(107,142,58,.09); }
.mk-client-row input[type="checkbox"] { flex-shrink: 0; accent-color: var(--color-primary); width: 14px; height: 14px; }
.mk-client-info { display: flex; flex-direction: column; gap: 0.05rem; flex: 1; min-width: 0; }
.mk-client-name { font-weight: 600; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mk-client-meta { display: flex; align-items: center; gap: 0.4rem; }
.mk-client-code { font-size: 0.65rem; font-weight: 700; color: var(--color-primary); }
.mk-client-stage { font-size: 0.65rem; font-weight: 600; }

[data-theme="dark"] .mkcamp-card,
[data-theme="dark"] .mk-modal {
  background: rgba(13,18,35,.88) !important;
  border-color: rgba(255,255,255,.07) !important;
}
[data-theme="dark"] .mkcamp-stats { background: rgba(255,255,255,.04) !important; }
[data-theme="dark"] .mk-cover-upload,
[data-theme="dark"] .mk-attach-upload-btn {
  background: rgba(13,18,35,.6) !important;
  border-color: rgba(255,255,255,.15) !important;
  color: rgba(255,255,255,.55) !important;
}
[data-theme="dark"] .mk-attach-row { background: rgba(255,255,255,.03) !important; border-color: rgba(255,255,255,.07) !important; }
[data-theme="dark"] .mk-attach-row--pending { background: rgba(59,130,246,.06) !important; border-color: rgba(59,130,246,.15) !important; }
[data-theme="dark"] .mk-client-list { border-color: rgba(255,255,255,.1) !important; }
[data-theme="dark"] .mk-client-row { border-bottom-color: rgba(255,255,255,.05) !important; }
[data-theme="dark"] .mk-client-row:hover { background: rgba(255,255,255,.05) !important; }
[data-theme="dark"] .mk-client-row.selected { background: rgba(107,142,58,.12) !important; }
</style>
