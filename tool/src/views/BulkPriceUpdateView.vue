<template>
  <div class="page-container">
    <div class="container">
      <h2 class="title">Actualización masiva de precios</h2>

      <InventorySubNav />

      <div class="bulk-layout">
        <!-- Config panel -->
        <div class="config-panel">
          <h3>Configuración</h3>

          <!-- Scope -->
          <div class="field-block">
            <label class="block-label">Alcance</label>
            <div class="radio-group">
              <label class="radio-opt">
                <input type="radio" v-model="scope" value="all" />
                <span>Todos los productos</span>
                <small>({{ store.products.length }})</small>
              </label>
              <label class="radio-opt">
                <input type="radio" v-model="scope" value="grupo" />
                <span>Por grupo</span>
              </label>
              <label class="radio-opt" :class="{ disabled: !store.selectedIds.length }">
                <input type="radio" v-model="scope" value="selected" :disabled="!store.selectedIds.length" />
                <span>Seleccionados</span>
                <small v-if="store.selectedIds.length">({{ store.selectedIds.length }})</small>
                <small v-else class="hint">— seleccione productos en el listado</small>
              </label>
            </div>
          </div>

          <!-- Grupo selector -->
          <div class="field-block" v-if="scope === 'grupo'">
            <label class="block-label">Grupo</label>
            <select v-model="selectedGrupo">
              <option value="">Seleccionar grupo...</option>
              <option v-for="g in store.uniqueGrupos" :key="g" :value="g">{{ g }}</option>
            </select>
            <span class="scope-count" v-if="selectedGrupo">
              {{ productsByGrupo.length }} productos en "{{ selectedGrupo }}"
            </span>
          </div>

          <!-- Percentage -->
          <div class="field-block">
            <label class="block-label">Porcentaje de ajuste</label>
            <div class="pct-presets">
              <button
                v-for="p in presets"
                :key="p"
                :class="['preset-btn', { active: percent === p }]"
                type="button"
                @click="percent = p"
              >
                {{ p > 0 ? '+' : '' }}{{ p }}%
              </button>
            </div>
            <div class="pct-custom">
              <span class="pct-prefix">%</span>
              <input
                v-model.number="percent"
                type="number"
                step="0.5"
                placeholder="Personalizado"
                class="pct-input"
              />
            </div>
          </div>

          <button
            class="preview-btn"
            @click="generatePreview"
            :disabled="!canPreview"
          >
            <i class="bi bi-eye"></i> Previsualizar cambios
          </button>
        </div>

        <!-- Preview table -->
        <div class="preview-panel" v-if="preview.length">
          <div class="preview-header">
            <h3>Previsualización</h3>
            <span class="preview-count">{{ preview.length }} producto{{ preview.length !== 1 ? 's' : '' }} afectados</span>
          </div>

          <div class="summary-row">
            <div class="summary-card">
              <span class="s-label">Ajuste</span>
              <span class="s-value" :class="percent >= 0 ? 'positive' : 'negative'">
                {{ percent > 0 ? '+' : '' }}{{ percent }}%
              </span>
            </div>
            <div class="summary-card">
              <span class="s-label">Precio promedio actual</span>
              <span class="s-value">${{ avgBefore }}</span>
            </div>
            <div class="summary-card">
              <span class="s-label">Precio promedio nuevo</span>
              <span class="s-value">${{ avgAfter }}</span>
            </div>
          </div>

          <div class="table-scroll">
            <table class="history-table preview-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Precio actual</th>
                  <th>Nuevo precio</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in preview" :key="row._id">
                  <td><code class="code-sm">{{ row.code }}</code></td>
                  <td class="desc-cell">{{ row.name }}</td>
                  <td>${{ fmt(row.currentPrice) }}</td>
                  <td class="new-price">${{ fmt(row.newPrice) }}</td>
                  <td :class="row.diff >= 0 ? 'diff-pos' : 'diff-neg'">
                    {{ row.diff >= 0 ? '+' : '' }}${{ fmt(Math.abs(row.diff)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="apply-row">
            <button v-if="canManage" @click="applyChanges" :disabled="applying" class="apply-btn">
              <i class="bi" :class="applying ? 'bi-hourglass-split' : 'bi-check-circle'"></i>
              {{ applying ? 'Aplicando...' : 'Aplicar cambios' }}
            </button>
            <span v-else class="readonly-hint"><i class="bi bi-eye"></i> Solo simulación — sin permiso para guardar</span>
            <button class="secondary-button" @click="preview = []">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useToast } from 'vue-toastification'
import InventorySubNav from '@/components/InventorySubNav.vue'
import { usePermissions } from '@/utils/permissions'

const { canManage } = usePermissions()

const store = useProductsStore()
const toast = useToast()

const scope = ref('all')
const selectedGrupo = ref('')
const percent = ref(10)
const preview = ref([])
const applying = ref(false)

const presets = [-15, -10, -5, 5, 10, 15, 20]

const productsByGrupo = computed(() =>
  store.products.filter(p => p.grupo === selectedGrupo.value)
)

const targetProducts = computed(() => {
  if (scope.value === 'all') return store.products
  if (scope.value === 'grupo') return productsByGrupo.value
  if (scope.value === 'selected') return store.products.filter(p => store.selectedIds.includes(p._id))
  return []
})

const canPreview = computed(() => {
  if (percent.value === 0 || isNaN(percent.value)) return false
  if (scope.value === 'grupo' && !selectedGrupo.value) return false
  if (scope.value === 'selected' && !store.selectedIds.length) return false
  return targetProducts.value.length > 0
})

function generatePreview() {
  const factor = 1 + percent.value / 100
  preview.value = targetProducts.value.map(p => {
    const currentPrice = p.pricePerM2 || 0
    const newPrice = currentPrice * factor
    return {
      _id: p._id,
      code: p.code,
      name: p.name,
      currentPrice,
      newPrice,
      diff: newPrice - currentPrice
    }
  })
}

const avgBefore = computed(() => {
  if (!preview.value.length) return '0.00'
  return fmt(preview.value.reduce((s, r) => s + r.currentPrice, 0) / preview.value.length)
})

const avgAfter = computed(() => {
  if (!preview.value.length) return '0.00'
  return fmt(preview.value.reduce((s, r) => s + r.newPrice, 0) / preview.value.length)
})

async function applyChanges() {
  applying.value = true
  let ok = 0, fail = 0
  for (const row of preview.value) {
    try {
      await store.updateProduct(row._id, { pricePerM2: row.newPrice })
      ok++
    } catch {
      fail++
    }
  }
  applying.value = false
  preview.value = []
  if (fail === 0) toast.success(`${ok} precios actualizados correctamente.`)
  else toast.warning(`${ok} actualizados, ${fail} fallaron.`)
}

function fmt(n) {
  return (n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
.bulk-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.config-panel, .preview-panel {
  background: rgba(107,142,58,0.05);
  border: 1px solid rgba(107,142,58,0.14);
  border-radius: 20px;
  padding: 1.6rem;
}

.config-panel h3, .preview-panel h3 {
  font-size: 1.05rem;
  margin-bottom: 1.2rem;
}

.field-block { margin-bottom: 1.4rem; }

.block-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  margin-bottom: 0.65rem;
}

.radio-group { display: flex; flex-direction: column; gap: 0.5rem; }

.radio-opt {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  font-size: 0.9rem;
  text-transform: none;
  letter-spacing: 0;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  border: 1px solid rgba(107,142,58,0.12);
  background: rgba(255,255,255,0.6);
  transition: all 0.15s;
}

.radio-opt:hover { background: rgba(107,142,58,0.08); border-color: rgba(107,142,58,0.25); }
.radio-opt:has(input:checked) { background: rgba(107,142,58,0.1); border-color: rgba(107,142,58,0.3); }

.radio-opt input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary, #6b8e3a);
  flex-shrink: 0;
}

.radio-opt.disabled { opacity: 0.5; cursor: not-allowed; }
.radio-opt small { color: var(--color-muted); font-size: 0.78rem; }
.radio-opt .hint { font-style: italic; }

.scope-count {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.78rem;
  color: var(--color-primary);
  font-style: italic;
  text-transform: none;
}

.pct-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.preset-btn {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(107,142,58,0.08);
  color: var(--color-text);
  border: 1px solid rgba(107,142,58,0.18);
  min-width: 0;
  box-shadow: none;
}

.preset-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
}

.pct-custom { position: relative; }
.pct-prefix {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 700;
  color: var(--color-muted);
}
.pct-input { padding-left: 2.2rem !important; }

.preview-btn { width: 100%; margin-top: 0.5rem; }

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-count { font-size: 0.82rem; color: var(--color-muted); }

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

.summary-card {
  flex: 1 1 120px;
  padding: 0.85rem 1rem;
  background: rgba(255,255,255,0.85);
  border-radius: 14px;
  border: 1px solid rgba(107,142,58,0.12);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.s-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.s-value { font-size: 1.2rem; font-weight: 700; font-family: 'Poppins', sans-serif; }
.positive { color: #15803d; }
.negative { color: #b91c1c; }

.table-scroll { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(107,142,58,0.14); }
.preview-table { min-width: 600px; }
.preview-table thead th { background: rgba(107,142,58,0.07); font-size: 0.8rem; }

.code-sm {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  background: rgba(107,142,58,0.1);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.desc-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.new-price { font-weight: 700; color: var(--color-primary); }
.diff-pos { color: #15803d; font-weight: 600; }
.diff-neg { color: #b91c1c; font-weight: 600; }

.apply-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(107,142,58,0.12);
}

.apply-btn { background: #15803d; }
.readonly-hint { font-size: 0.8rem; color: var(--color-muted); display: inline-flex; align-items: center; gap: 0.4rem; }

@media (max-width: 900px) {
  .bulk-layout { grid-template-columns: 1fr; }
  .config-panel, .preview-panel { padding: 1rem; border-radius: 14px; }
}

@media (max-width: 600px) {
  .pct-presets { gap: 0.25rem; }
  .preset-btn { padding: 0.35rem 0.6rem; font-size: 0.72rem; }
  .summary-row { gap: 0.4rem; }
  .summary-card { padding: 0.6rem 0.7rem; flex: 1 1 100px; }
  .s-value { font-size: 1rem; }
  .preview-table { min-width: 0; font-size: 0.78rem; }
  .preview-header { flex-direction: column; gap: 0.3rem; align-items: flex-start; }
}
</style>
