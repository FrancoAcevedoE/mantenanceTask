<template>
  <div class="page-container">
    <div class="container">
      <div class="topbar">
        <h2 class="title">Grupos de productos</h2>
        <button v-if="canManage" class="primary-button" @click="startNew">
          <i class="bi bi-plus-lg"></i> Nuevo grupo
        </button>
      </div>

      <InventorySubNav />

      <div v-if="loading" class="empty-state">Cargando grupos...</div>

      <!-- Lista de grupos -->
      <div v-else-if="!editing" class="groups-list">
        <div v-if="!groups.length" class="empty-state">No hay grupos creados.</div>
        <div v-for="g in groups" :key="g._id" class="group-card">
          <div class="group-card-header">
            <h3>{{ g.nombre }}</h3>
            <div v-if="canManage" class="group-actions">
              <button class="btn-sm secondary-button" @click="startEdit(g)">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn-sm danger-button" @click="groupToDelete = g">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div v-if="g.descuentos?.length" class="discount-table-wrap">
            <table class="discount-table">
              <thead>
                <tr>
                  <th>Comentario</th>
                  <th>% Dto x cantidad</th>
                  <th>% Dto contado</th>
                  <th>% Dto 30 dias f.f.</th>
                  <th>% Cant+Contado</th>
                  <th>% Cant+30dias</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(t, i) in g.descuentos" :key="i">
                  <td>{{ t.nota || tramoLabel(t) }}</td>
                  <td>{{ t.porcCantidad }}%</td>
                  <td>{{ t.porcContado }}%</td>
                  <td>{{ t.porc30dias }}%</td>
                  <td>{{ t.porcCantidadContado }}%</td>
                  <td>{{ t.porcCantidad30dias }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="group-empty">Sin tabla de descuentos</div>
        </div>
      </div>

      <!-- Formulario edicion/creacion -->
      <div v-else class="edit-layout">
        <div class="edit-header">
          <h2>{{ editId ? 'Editar grupo' : 'Nuevo grupo' }}</h2>
          <button class="ghost-button" @click="cancelEdit">
            <i class="bi bi-arrow-left"></i> Volver
          </button>
        </div>

        <form @submit.prevent="saveGroup" novalidate>
          <div class="field" :class="{ error: errors.nombre }">
            <label>Nombre del grupo *</label>
            <input v-model="form.nombre" type="text" placeholder="Ej: KARIPLAK H y MAX" />
            <span class="field-error" v-if="errors.nombre">{{ errors.nombre }}</span>
          </div>

          <div class="section-title">Tabla de descuentos</div>
          <p class="hint">Agrega las filas que necesites. Los porcentajes combinados se calculan automaticamente.</p>

          <div class="desc-block" v-for="(row, i) in form.descuentos" :key="i">
            <div class="desc-block-header">
              <div class="desc-comment-row">
                <label class="sub-label">Comentario</label>
                <input v-model="row.nota" type="text" placeholder="Ej: de 1 a 30 hojas" class="input-sm desc-comment-input" />
                <button type="button" class="btn-icon-danger" @click="removeRow(i)" title="Quitar fila">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
            <div class="desc-prices-wrap">
              <table class="variantes-table">
                <thead>
                  <tr>
                    <th>% Dto cantidad</th>
                    <th>% Dto contado</th>
                    <th>% Dto 30 dias</th>
                    <th>% Cant+Contado</th>
                    <th>% Cant+30dias</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="pct-input-wrap">
                        <input v-model.number="row.porcCantidad" type="number" min="0" max="100" step="0.1"
                               class="input-num-sm" @input="calcConcat(row)" />
                        <span>%</span>
                      </div>
                    </td>
                    <td>
                      <div class="pct-input-wrap">
                        <input v-model.number="row.porcContado" type="number" min="0" max="100" step="0.1"
                               class="input-num-sm" @input="calcConcat(row)" />
                        <span>%</span>
                      </div>
                    </td>
                    <td>
                      <div class="pct-input-wrap">
                        <input v-model.number="row.porc30dias" type="number" min="0" max="100" step="0.1"
                               class="input-num-sm" @input="calcConcat(row)" />
                        <span>%</span>
                      </div>
                    </td>
                    <td class="calc-cell">{{ row.porcCantidadContado?.toFixed(2) || '—' }}%</td>
                    <td class="calc-cell">{{ row.porcCantidad30dias?.toFixed(2) || '—' }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button type="button" class="secondary-button add-row-btn" @click="addRow">
            <i class="bi bi-plus"></i> Agregar fila de descuento
          </button>

          <div class="field full">
            <label>Notas generales</label>
            <textarea v-model="form.notas" rows="2" placeholder="Notas adicionales del grupo..."></textarea>
          </div>

          <div class="form-footer">
            <button type="submit" :disabled="saving">
              <i class="bi" :class="saving ? 'bi-hourglass-split' : 'bi-check-lg'"></i>
              {{ saving ? 'Guardando...' : (editId ? 'Guardar cambios' : 'Crear grupo') }}
            </button>
            <button type="button" class="secondary-button" @click="cancelEdit">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
    <ConfirmDialog
      :visible="!!groupToDelete"
      title="Eliminar grupo"
      :message="groupToDelete ? `¿Eliminar el grupo '${groupToDelete.nombre}'? Los productos asociados no se eliminan.` : ''"
      confirm-text="Eliminar"
      type="danger"
      @confirm="doRemoveGroup"
      @cancel="groupToDelete = null"
    />
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

const toast = useToast()
const groups = ref([])
const loading = ref(false)
const editing = ref(false)
const editId = ref(null)
const saving = ref(false)
const errors = ref({})

const form = ref({ nombre: '', descuentos: [], notas: '' })

function authHeader() {
  const token = sessionStorage.getItem('token')
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}

onMounted(() => loadGroups())

async function loadGroups() {
  loading.value = true
  try {
    const { data } = await axios.get(`${API_BASE_URL}/product-groups`, authHeader())
    groups.value = Array.isArray(data) ? data : []
  } catch {
    toast.error('Error cargando grupos')
  } finally {
    loading.value = false
  }
}

function tramoLabel(t) {
  if (t.hastaHojas) return `de ${t.desdeHojas} a ${t.hastaHojas} hojas`
  if (t.desdeHojas) return `mayor a ${t.desdeHojas - 1} hojas`
  return ''
}

function concat(a, b) {
  return Math.round((1 - (1 - (a || 0) / 100) * (1 - (b || 0) / 100)) * 10000) / 100
}

function calcConcat(row) {
  row.porcCantidadContado = concat(row.porcCantidad, row.porcContado)
  row.porcCantidad30dias = concat(row.porcCantidad, row.porc30dias)
}

function emptyRow() {
  return {
    nota: '',
    porcCantidad: 0,
    porcContado: 0,
    porc30dias: 0,
    porcCantidadContado: 0,
    porcCantidad30dias: 0,
    desdeHojas: null,
    hastaHojas: null,
  }
}

function addRow() {
  form.value.descuentos.push(emptyRow())
}

function removeRow(i) {
  form.value.descuentos.splice(i, 1)
}

function startNew() {
  editId.value = null
  form.value = { nombre: '', descuentos: [emptyRow()], notas: '' }
  errors.value = {}
  editing.value = true
}

function startEdit(g) {
  editId.value = g._id
  form.value = {
    nombre: g.nombre,
    descuentos: (g.descuentos || []).map(t => ({
      nota: t.nota || tramoLabel(t),
      porcCantidad: t.porcCantidad ?? 0,
      porcContado: t.porcContado ?? 0,
      porc30dias: t.porc30dias ?? 0,
      porcCantidadContado: t.porcCantidadContado ?? 0,
      porcCantidad30dias: t.porcCantidad30dias ?? 0,
      desdeHojas: t.desdeHojas ?? null,
      hastaHojas: t.hastaHojas ?? null,
    })),
    notas: g.notas || '',
  }
  errors.value = {}
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editId.value = null
}

async function saveGroup() {
  const e = {}
  if (!form.value.nombre.trim()) e.nombre = 'El nombre es obligatorio.'
  errors.value = e
  if (Object.keys(e).length) return

  saving.value = true
  try {
    if (editId.value) {
      await axios.put(`${API_BASE_URL}/product-groups/${editId.value}`, form.value, authHeader())
      toast.success('Grupo actualizado')
    } else {
      await axios.post(`${API_BASE_URL}/product-groups`, form.value, authHeader())
      toast.success('Grupo creado')
    }
    await loadGroups()
    editing.value = false
    editId.value = null
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

const { askPassword } = usePasswordConfirm()
const groupToDelete = ref(null)

async function doRemoveGroup() {
  const g = groupToDelete.value
  groupToDelete.value = null
  if (!g) return
  try { await askPassword() } catch { return }
  try {
    await axios.delete(`${API_BASE_URL}/product-groups/${g._id}`, authHeader())
    toast.success('Grupo eliminado')
    await loadGroups()
  } catch {
    toast.error('Error al eliminar grupo')
  }
}
</script>

<style scoped>
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem; }

.groups-list { display: flex; flex-direction: column; gap: 1rem; }

.group-card {
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  overflow: hidden;
}

.group-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(107,142,58,0.06);
  border-bottom: 1px solid rgba(107,142,58,0.1);
}

.group-card-header h3 { margin: 0; font-size: 0.95rem; }

.group-actions { display: flex; gap: 0.4rem; }

.group-empty {
  padding: 0.75rem 1rem;
  font-size: 0.82rem;
  color: var(--color-muted);
  font-style: italic;
}

.discount-table-wrap { overflow-x: auto; }

.discount-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.discount-table th {
  padding: 0.5rem 0.65rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.discount-table td {
  padding: 0.45rem 0.65rem;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

/* Edit form */
.edit-layout { display: flex; flex-direction: column; gap: 1.2rem; }
.edit-layout form { display: flex; flex-direction: column; gap: 1rem; }

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
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

.hint { font-size: 0.78rem; color: var(--color-muted); margin: 0; }

.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field.full { grid-column: 1 / -1; }
.field.error input { border-color: #dc2626; }
.field label {
  font-size: 0.78rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.07em; color: var(--color-muted);
}
.field-error { font-size: 0.78rem; color: #dc2626; }

textarea { resize: vertical; min-height: 50px; font-family: inherit; font-size: 0.9rem; }

.desc-block {
  border: 1px solid rgba(107,142,58,0.15);
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 0.6rem;
  background: rgba(107,142,58,0.03);
}

.desc-block-header { display: flex; flex-direction: column; gap: 0.2rem; }
.desc-comment-row { display: flex; gap: 0.5rem; align-items: center; }
.desc-comment-input { flex: 1; max-width: 320px; }

.sub-label {
  font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--color-muted); white-space: nowrap;
}

.desc-prices-wrap { overflow-x: auto; margin-top: 0.5rem; }

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
  min-width: 120px;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.12);
  font-size: 0.82rem;
}

.input-num-sm {
  width: 60px;
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

.pct-input-wrap span { font-size: 0.78rem; color: var(--color-muted); }

.calc-cell {
  font-weight: 600;
  color: var(--color-primary, #6b8e3a);
  white-space: nowrap;
}

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

.add-row-btn { align-self: flex-start; }

.form-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(107,142,58,0.12);
}

.danger-button {
  background: rgba(220,38,38,0.1);
  color: #dc2626;
  border: 1px solid rgba(220,38,38,0.2);
  border-radius: 10px;
  padding: 0.45rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.danger-button:hover { background: rgba(220,38,38,0.18); }

@media (max-width: 768px) {
  .discount-edit-table th, .discount-edit-table td { padding: 0.3rem 0.35rem; }
  .input-sm { min-width: 90px; }
  .input-num-sm { width: 50px; }
}
</style>
