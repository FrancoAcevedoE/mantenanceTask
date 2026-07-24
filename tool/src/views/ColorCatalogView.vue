<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Catalogo de colores</h2>
        <button v-if="canManage" class="primary-button" @click="startNew">
          <i class="bi bi-plus-lg"></i> Nuevo color
        </button>
      </div>

      <InventorySubNav />

      <!-- Buscar -->
      <div class="search-bar">
        <div class="color-search-wrap">
          <i class="bi bi-search color-search-icon"></i>
          <input v-model="search" type="text" placeholder="Buscar por codigo o nombre..." class="color-search-input" />
          <button v-if="search" type="button" class="color-search-clear" @click="search = ''">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div v-if="loading" class="empty-state">Cargando colores...</div>

      <!-- Lista por grupos -->
      <div v-else class="color-groups">
        <div v-for="g in [1,2,3]" :key="g" class="color-group-block">
          <div class="cg-header" :class="'grupo-' + g">
            <span>Grupo {{ romanNum(g) }}</span>
            <span class="cg-count">{{ filteredByGroup(g).length }} colores</span>
          </div>
          <div class="cg-grid">
            <div v-for="c in filteredByGroup(g)" :key="c._id" class="color-card">
              <div class="cc-thumb" @click="openLightbox(c)" title="Ver detalle">
                <img v-if="c.image" :src="resolveUrl(c.image)" :alt="c.name" />
                <div v-else class="cc-placeholder" :style="{ background: guessColor(c.name) }"></div>
              </div>
              <div class="cc-info">
                <code class="cc-code">{{ c.code }}</code>
                <span class="cc-name">{{ c.name }}</span>
                <span v-if="c.tipo" class="cc-tipo">{{ c.tipo }}</span>
              </div>
              <div v-if="canManage" class="cc-actions">
                <button class="icon-btn" @click="startEdit(c)" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="icon-btn danger" @click="colorToDelete = c" title="Eliminar"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <div v-if="!filteredByGroup(g).length" class="cg-empty">Sin colores en este grupo</div>
          </div>
        </div>
      </div>

      <!-- Modal crear/editar -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
            <div class="modal-box">
              <h3>{{ editId ? 'Editar color' : 'Nuevo color' }}</h3>
              <form @submit.prevent="saveColor" novalidate>
                <div class="form-grid-2">
                  <div class="field">
                    <label>Codigo (4 numeros) *</label>
                    <input v-model="form.code" type="text" maxlength="4" placeholder="5520"
                           @input="form.code = form.code.replace(/\D/g, '').slice(0, 4)" />
                  </div>
                  <div class="field">
                    <label>Nombre *</label>
                    <input v-model="form.name" type="text" placeholder="Blanco Nube" />
                  </div>
                  <div class="field">
                    <label>Tipo</label>
                    <input v-model="form.tipo" type="text" placeholder="Liso, Madera, Granito..." />
                  </div>
                  <div class="field">
                    <label>Grupo *</label>
                    <select v-model.number="form.grupoColor">
                      <option :value="1">Grupo I</option>
                      <option :value="2">Grupo II</option>
                      <option :value="3">Grupo III</option>
                    </select>
                  </div>
                  <div class="field full">
                    <label>Imagen del color</label>
                    <div class="upload-row">
                      <label class="upload-btn">
                        <i class="bi bi-upload"></i> Subir imagen
                        <input type="file" accept="image/*" hidden @change="uploadColorImg" />
                      </label>
                      <span v-if="uploadingImg" class="upload-status"><i class="bi bi-hourglass-split"></i> Subiendo...</span>
                    </div>
                    <div v-if="form.image" class="cc-img-preview">
                      <img :src="resolveUrl(form.image)" alt="preview" />
                      <button type="button" class="btn-icon-danger" @click="form.image = ''"><i class="bi bi-x-lg"></i></button>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="submit" :disabled="saving">{{ editId ? 'Guardar' : 'Crear' }}</button>
                  <button type="button" class="secondary-button" @click="showForm = false">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Lightbox color -->
      <Teleport to="body">
        <Transition name="modal-fade">
          <div v-if="lightboxColor" class="lightbox-overlay" @click="lightboxColor = null">
            <div class="lightbox-card" @click.stop>
              <button class="lightbox-close" @click="lightboxColor = null"><i class="bi bi-x-lg"></i></button>
              <div class="lbc-swatch" :style="lightboxColor.image ? {} : { background: guessColor(lightboxColor.name) }">
                <img v-if="lightboxColor.image" :src="resolveUrl(lightboxColor.image)" :alt="lightboxColor.name" class="lbc-img" />
              </div>
              <div class="lbc-info">
                <code class="lbc-code">{{ lightboxColor.code }}</code>
                <span class="lbc-name">{{ lightboxColor.name }}</span>
                <div class="lbc-meta">
                  <span v-if="lightboxColor.tipo" class="lbc-tag">{{ lightboxColor.tipo }}</span>
                  <span class="lbc-tag" :class="'lbc-grupo-' + lightboxColor.grupoColor">Grupo {{ romanNum(lightboxColor.grupoColor) }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <ConfirmDialog
        :visible="!!colorToDelete"
        title="Eliminar color"
        :message="colorToDelete ? `¿Eliminar el color ${colorToDelete.code} — ${colorToDelete.name}?` : ''"
        confirm-text="Eliminar"
        type="danger"
        @confirm="doDelete"
        @cancel="colorToDelete = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePermissions } from '@/utils/permissions'
import { usePasswordConfirm } from '@/composables/usePasswordConfirm'

const { canManage } = usePermissions()
const { askPassword } = usePasswordConfirm()

const toast = useToast()
const colors = ref([])
const loading = ref(false)
const search = ref('')
const showForm = ref(false)
const editId = ref(null)
const saving = ref(false)
const uploadingImg = ref(false)
const colorToDelete = ref(null)
const lightboxColor = ref(null)

function openLightbox(c) { lightboxColor.value = c }

const form = ref({ code: '', name: '', tipo: '', grupoColor: 1, image: '' })

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

function resolveUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL.replace('/api', '')}${path}`
}

function romanNum(g) { return ['I', 'II', 'III'][g - 1] }

const COLOR_MAP = {
  blanco: '#f5f5f5', negro: '#1a1a1a', gris: '#9e9e9e', rojo: '#e53935',
  azul: '#1e88e5', verde: '#43a047', amarillo: '#fdd835', marron: '#6d4c41',
  naranja: '#fb8c00', rosa: '#e91e63', crema: '#fffdd0', beige: '#d7c4a1',
  platino: '#e5e4e2', almendra: '#d4a96a', grafito: '#444', durazno: '#ffab91',
  terracota: '#c75b39', marfil: '#f5f0e0', arena: '#c2b280', cedro: '#8b5e3c',
  roble: '#a0785a', nogal: '#5c3a1e', cerezo: '#9e3030', haya: '#d4a96a',
  oliva: '#6b8e23', teca: '#ab8553',
}

function guessColor(name) {
  const n = (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const [k, v] of Object.entries(COLOR_MAP)) {
    if (n.includes(k)) return v
  }
  return '#ccc'
}

onMounted(() => loadColors())

async function loadColors() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE_URL}/colors`, authHeader())
    colors.value = Array.isArray(data) ? data : []
  } catch { toast.error('Error cargando colores') }
  finally { loading.value = false }
}

function filteredByGroup(g) {
  const q = search.value.trim().toLowerCase()
  const byGroup = colors.value.filter(c => c.grupoColor === g)
  if (!q) return byGroup
  return byGroup.filter(c =>
    c.code.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    (c.tipo && c.tipo.toLowerCase().includes(q))
  )
}

function startNew() {
  editId.value = null
  form.value = { code: '', name: '', tipo: '', grupoColor: 1, image: '' }
  showForm.value = true
}

function startEdit(c) {
  editId.value = c._id
  form.value = { code: c.code, name: c.name, tipo: c.tipo || '', grupoColor: c.grupoColor, image: c.image || '' }
  showForm.value = true
}

async function saveColor() {
  if (!form.value.code || !form.value.name) { toast.warning('Codigo y nombre son obligatorios'); return }
  saving.value = true
  try {
    if (editId.value) {
      await axios.put(`${API_BASE_URL}/colors/${editId.value}`, form.value, authHeader())
      toast.success('Color actualizado')
    } else {
      await axios.post(`${API_BASE_URL}/colors`, form.value, authHeader())
      toast.success('Color creado')
    }
    showForm.value = false
    await loadColors()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al guardar')
  } finally { saving.value = false }
}

async function doDelete() {
  const c = colorToDelete.value
  if (!c) return
  try { await askPassword() } catch { colorToDelete.value = null; return }
  colorToDelete.value = null
  try {
    await axios.delete(`${API_BASE_URL}/colors/${c._id}`, authHeader())
    toast.success('Color eliminado')
    await loadColors()
  } catch { toast.error('Error al eliminar') }
}

async function uploadColorImg(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingImg.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await axios.post(`${API_BASE_URL}/upload`, fd, {
      headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' },
    })
    form.value.image = data.url
    toast.success('Imagen subida')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al subir imagen')
  } finally {
    uploadingImg.value = false
    event.target.value = ''
  }
}
</script>

<style scoped>
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem; }

.search-bar { margin-bottom: 1rem; max-width: 360px; }

.color-search-wrap { position: relative; display: flex; align-items: center; }
.color-search-icon { position: absolute; left: 0.75rem; color: var(--color-muted); font-size: 0.85rem; pointer-events: none; }
.color-search-input { width: 100%; padding: 0.5rem 2rem 0.5rem 2.2rem; border: 1px solid rgba(107,142,58,0.2); border-radius: 10px; font-size: 0.85rem; }
.color-search-input:focus { border-color: var(--color-primary, #6b8e3a); outline: none; }
.color-search-clear { position: absolute; right: 0.5rem; background: none; border: none; color: var(--color-muted); cursor: pointer; }

.color-groups { display: flex; flex-direction: column; gap: 1.2rem; }

.color-group-block {
  border: 1px solid rgba(107,142,58,0.12);
  border-radius: 14px;
  overflow: hidden;
}

.cg-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.cg-header.grupo-1 { background: rgba(76,175,80,0.1); color: #2e7d32; }
.cg-header.grupo-2 { background: rgba(33,150,243,0.1); color: #1565c0; }
.cg-header.grupo-3 { background: rgba(255,152,0,0.1); color: #e65100; }
.cg-count { font-weight: 400; font-size: 0.75rem; opacity: 0.7; }

.cg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
}

.color-card {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  background: rgba(255,255,255,0.7);
  transition: box-shadow 0.15s;
}
.color-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

.cc-thumb {
  width: 36px; height: 36px; border-radius: 8px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; cursor: pointer;
}
.cc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cc-placeholder { width: 100%; height: 100%; }

.cc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
.cc-code { font-weight: 700; font-size: 0.8rem; font-family: monospace; }
.cc-name { font-size: 0.78rem; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cc-tipo { font-size: 0.65rem; color: var(--color-muted); font-style: italic; }

.cc-actions { display: flex; gap: 0.15rem; flex-shrink: 0; }

.icon-btn { background: none; border: none; padding: 0.25rem 0.35rem; border-radius: 6px; cursor: pointer; color: var(--color-muted); transition: all 0.15s; font-size: 0.8rem; }
.icon-btn:hover { background: rgba(107,142,58,0.1); color: var(--color-primary, #6b8e3a); }
.icon-btn.danger:hover { background: rgba(239,68,68,0.1); color: #dc2626; }

.cg-empty { grid-column: 1 / -1; font-size: 0.8rem; color: var(--color-muted); font-style: italic; padding: 0.5rem; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-box {
  background: #fff; border-radius: 18px; padding: 1.5rem;
  max-width: 480px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal-box h3 { margin: 0 0 1rem; font-size: 1.05rem; }

.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field.full { grid-column: 1 / -1; }
.field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-muted); }

.upload-row { display: flex; align-items: center; gap: 0.5rem; }
.upload-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.8rem; border-radius: 8px;
  border: 1px dashed rgba(107,142,58,0.35); background: rgba(107,142,58,0.06);
  color: var(--color-primary, #6b8e3a); font-size: 0.8rem; font-weight: 600; cursor: pointer;
}
.upload-btn:hover { background: rgba(107,142,58,0.14); }
.upload-status { font-size: 0.78rem; color: var(--color-muted); }

.cc-img-preview {
  display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;
}
.cc-img-preview img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(0,0,0,0.1); }

.btn-icon-danger { background: none; border: none; color: #dc2626; cursor: pointer; padding: 0.2rem; border-radius: 6px; }

.modal-footer { display: flex; gap: 0.6rem; margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid rgba(0,0,0,0.06); }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Lightbox */
.lightbox-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
  cursor: zoom-out;
}

.lightbox-card {
  position: relative;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
  cursor: default;
}

.lightbox-close {
  position: absolute; top: 0.65rem; right: 0.65rem; z-index: 1;
  background: rgba(0,0,0,0.25); border: none; color: #fff;
  font-size: 1rem; width: 30px; height: 30px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.lightbox-close:hover { background: rgba(0,0,0,0.5); }

.lbc-swatch {
  width: 100%; height: 220px; display: flex; align-items: center; justify-content: center;
}
.lbc-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.lbc-info {
  padding: 1rem 1.2rem 1.2rem;
  display: flex; flex-direction: column; gap: 0.3rem;
}
.lbc-code {
  font-size: 1.5rem; font-weight: 800; letter-spacing: 0.08em;
  color: var(--color-primary, #6b8e3a); font-family: monospace;
}
.lbc-name { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.lbc-meta { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem; }
.lbc-tag {
  display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem;
  border-radius: 999px; background: rgba(107,142,58,0.1); color: var(--color-muted);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.lbc-grupo-1 { background: rgba(76,175,80,0.12); color: #2e7d32; }
.lbc-grupo-2 { background: rgba(33,150,243,0.12); color: #1565c0; }
.lbc-grupo-3 { background: rgba(255,152,0,0.12); color: #e65100; }

@media (max-width: 600px) {
  .cg-grid { grid-template-columns: 1fr; padding: 0.5rem; }
  .form-grid-2 { grid-template-columns: 1fr; }
}
</style>
