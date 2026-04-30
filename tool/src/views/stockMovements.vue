<template>
  <div class="page-container">
    <div class="movement-layout">
      <section class="panel-card">
        <h2>Carga y descarga de stock</h2>

        <div class="form-grid filter-block">
          <label for="materialTypeFilter">Tipo de material</label>
          <select id="materialTypeFilter" v-model="selectedMaterialType">
            <option value="placas">Placas</option>
            <option value="topbox">Top Box - Herrajes</option>
          </select>
        </div>

        <form class="form-grid" @submit.prevent="registerMovement">
          <select v-model="form.itemId" required>
            <option value="">Seleccionar {{ selectedMaterialType === 'placas' ? 'placa' : 'artículo' }}</option>
            <option v-for="item in availableItems" :key="item._id" :value="item._id">
              {{ item.name }} {{ item.size ? `(${item.size})` : '' }}{{ item.supplier ? ` - ${item.supplier}` : '' }} - stock: {{ item.stockPlates }} {{ selectedMaterialType === 'placas' ? 'placas' : 'unidades' }}
            </option>
          </select>

          <div class="movement-type-buttons">
            <button
              type="button"
              :class="['type-button', { active: form.movementType === 'in' }]"
              @click="form.movementType = 'in'"
            >
              Carga +
            </button>
            <button
              type="button"
              :class="['type-button', { active: form.movementType === 'out' }]"
              @click="form.movementType = 'out'"
            >
              Descarga -
            </button>
          </div>

          <input v-model.number="form.plates" type="number" min="1" step="1" :placeholder="`Cantidad de ${selectedMaterialType === 'placas' ? 'placas' : 'unidades'}`" />

          <button type="submit" :disabled="isSaving">
            {{ isSaving ? 'Guardando...' : 'Guardar movimiento' }}
          </button>
        </form>
      </section>

      <section class="panel-card panel-wide">
        <div class="header-row">
          <h2>Historial de movimientos</h2>
          <button type="button" class="secondary" @click="loadData">Actualizar</button>
        </div>

        <p v-if="!filteredMovements.length" class="empty-state">Sin movimientos registrados para el filtro actual.</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Tipo</th>
                <th>Placas</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in filteredMovements" :key="item._id">
                <tr>
                  <td>{{ formatDate(item.createdAt) }}</td>
                  <td>
                    {{ item.item?.name || '-' }} {{ item.item?.size ? `(${item.item.size})` : '' }}
                    <span v-if="item.item?.supplier" class="supplier-inline">- {{ item.item.supplier }}</span>
                  </td>
                  <td>{{ item.movementType === 'in' ? 'Carga' : 'Descarga' }}</td>
                  <td>{{ item.plates }}</td>
                  <td class="details-cell">
                    <button
                      type="button"
                      class="details-button"
                      :aria-expanded="openedDetailId === item._id"
                      @click="toggleDetails(item._id)"
                    >
                      !
                    </button>
                  </td>
                </tr>

                <tr v-if="openedDetailId === item._id" class="details-row">
                  <td colspan="5">
                    <div class="details-inline">
                      <p><strong>Pallets:</strong> {{ item.pallets }}</p>
                      <p><strong>Delta placas:</strong> {{ item.deltaPlates }}</p>
                      <p><strong>Stock resultante:</strong> {{ item.stockAfterPlates }}</p>
                      <p><strong>Usuario:</strong> {{ item.performedBy?.name || '-' }}</p>
                      <p v-if="item.item?.supplier"><strong>Proveedor:</strong> {{ item.item.supplier }}</p>
                      <p v-if="sanitizeMovementReason(item.reason)"><strong>Motivo:</strong> {{ sanitizeMovementReason(item.reason) }}</p>
                    </div>

                    <div v-if="getMovementSupplierEvaluation(item)" class="supplier-evaluation-box">
                      <div class="supplier-evaluation-header">
                        <strong>Evaluacion de proveedor</strong>
                        <span class="supplier-name">{{ getMovementSupplierEvaluation(item).provider }}</span>
                      </div>

                      <div class="supplier-evaluation-grid">
                        <p><strong>Materia prima:</strong> {{ getMovementSupplierEvaluation(item).materiaPrima }}</p>
                        <p>
                          <strong>Calificacion:</strong>
                          <span class="calif-badge" :class="`calif-${String(getMovementSupplierEvaluation(item).calificacionFinal).toLowerCase()}`">
                            {{ getMovementSupplierEvaluation(item).calificacionFinal }}
                          </span>
                        </p>
                        <p><strong>Puntaje:</strong> {{ getMovementSupplierEvaluation(item).puntaje }}</p>
                        <p><strong>Total:</strong> {{ getMovementSupplierEvaluation(item).total }}</p>
                      </div>

                      <div class="score-legend">
                        <span class="score-chip score-1">1 Bueno</span>
                        <span class="score-chip score-2">2 Regular</span>
                        <span class="score-chip score-3">3 Mal</span>
                      </div>

                      <div class="supplier-evaluation-grid criteria-grid">
                        <p><strong>Precios:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).precios)">{{ getMovementSupplierEvaluation(item).precios }}</span></p>
                        <p><strong>Condiciones:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).condiciones)">{{ getMovementSupplierEvaluation(item).condiciones }}</span></p>
                        <p><strong>Logistica:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).logistica)">{{ getMovementSupplierEvaluation(item).logistica }}</span></p>
                        <p><strong>Calidad prod.:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).calidadProducto)">{{ getMovementSupplierEvaluation(item).calidadProducto }}</span></p>
                        <p><strong>No conform.:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).calidadNoConformidades)">{{ getMovementSupplierEvaluation(item).calidadNoConformidades }}</span></p>
                        <p><strong>Medio ambiente:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).medioAmbiente)">{{ getMovementSupplierEvaluation(item).medioAmbiente }}</span></p>
                        <p><strong>Cond. especiales:</strong> <span class="score-chip" :class="scoreClass(getMovementSupplierEvaluation(item).condicionesEspeciales)">{{ getMovementSupplierEvaluation(item).condicionesEspeciales }}</span></p>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import axios from "axios"
import backgroundImage from "@/assets/fondogeneral.png"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"

export default {
  data() {
    return {
      supplies: [],
      movements: [],
      selectedMaterialType: "placas",
      placasData: [],
      topBoxData: [],
      isSaving: false,
      openedDetailId: "",
      form: {
        itemId: "",
        movementType: "in",
        plates: 0,
      },
      supplierEvaluations: {
        VILLA_GUILLERMINA: {
          provider: "Villa Guillermina",
          materiaPrima: "Sustrato para pisos",
          precios: "2",
          condiciones: "1",
          logistica: "1",
          calidadProducto: "2",
          calidadNoConformidades: "2",
          medioAmbiente: "2",
          condicionesEspeciales: "2",
          total: "12",
          puntaje: "24",
          calificacionFinal: "A"
        },
        CUYOPLACAS: {
          provider: "Cuyoplacas",
          materiaPrima: "MDP/Aglomerado",
          precios: "2",
          condiciones: "2",
          logistica: "1",
          calidadProducto: "1",
          calidadNoConformidades: "1",
          medioAmbiente: "2",
          condicionesEspeciales: "2",
          total: "11",
          puntaje: "22",
          calificacionFinal: "A"
        },
        FAPLAC: {
          provider: "Faplac",
          materiaPrima: "MDP/Aglomerado",
          precios: "1",
          condiciones: "3",
          logistica: "1",
          calidadProducto: "1",
          calidadNoConformidades: "1",
          medioAmbiente: "1",
          condicionesEspeciales: "2",
          total: "10",
          puntaje: "20",
          calificacionFinal: "A"
        },
        FIPLASTO: {
          provider: "Fiplasto",
          materiaPrima: "Chapadur",
          precios: "2",
          condiciones: "2",
          logistica: "1",
          calidadProducto: "2",
          calidadNoConformidades: "2",
          medioAmbiente: "2",
          condicionesEspeciales: "1",
          total: "12",
          puntaje: "12",
          calificacionFinal: "B"
        }
      },
      movementProviderMatchers: {
        VILLA_GUILLERMINA: ["VILLA GUILLERMINA", "SUSTRATO PARA PISOS"],
        CUYOPLACAS: ["CUYOPLACAS"],
        FAPLAC: ["FAPLAC"],
        FIPLASTO: ["FIPLASTO", "CHAPADUR"]
      },
      backgroundImage
    }
  },
  computed: {
    categorizedSupplies() {
      return this.supplies.map(item => ({
        ...item,
        materialCategory: this.normalizeMaterialType(item.materialType)
      }))
    },
    categorizedMovements() {
      return this.movements.map(item => ({
        ...item,
        materialCategory: this.normalizeMaterialType(item.item?.materialType)
      }))
    },
    filteredSupplies() {
      return this.categorizedSupplies.filter(item => item.materialCategory === this.selectedMaterialType)
    },
    filteredMovements() {
      return this.categorizedMovements.filter(item => item.materialCategory === this.selectedMaterialType)
    },
    availableItems() {
      if (this.selectedMaterialType === "placas") {
        // Para placas, combinar supplies con placasData
        const supplyItems = this.filteredSupplies.map(item => ({
          _id: item._id,
          name: item.name,
          size: item.size,
          supplier: item.supplier,
          stockPlates: item.stockPlates,
          type: 'supply'
        }))
        
        const placaItems = this.placasData.map((item, index) => ({
          _id: `placa-${index}`,
          name: `${item.producto} ${item.espesorMm}x${item.anchoMm}x${item.largoMm}`,
          size: `${item.espesorMm}x${item.anchoMm}x${item.largoMm}`,
          supplier: item.proveedor,
          stockPlates: item.cantidadStock,
          type: 'placa'
        }))
        
        return [...supplyItems, ...placaItems]
      } else if (this.selectedMaterialType === "topbox") {
        // Para top box, usar topBoxData
        return this.topBoxData.map((item, index) => ({
          _id: `topbox-${index}`,
          name: item.descripcion || item.producto || item.nombre,
          size: item.medida || item.dimensiones || '',
          supplier: item.proveedor || '',
          stockPlates: item.stock || item.cantidad || 0,
          type: 'topbox'
        }))
      }
      return []
    }
  },
  watch: {
    selectedMaterialType() {
      const existsInFiltered = this.filteredSupplies.some(item => item._id === this.form.itemId)
      if (!existsInFiltered) {
        this.form.itemId = ""
      }

      if (this.openedDetailId) {
        const existsInHistory = this.filteredMovements.some(item => item._id === this.openedDetailId)
        if (!existsInHistory) {
          this.openedDetailId = ""
        }
      }
    }
  },
  methods: {
    authConfig() {
      const token = localStorage.getItem("token")
      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    },
    async loadData() {
      try {
        const [suppliesResponse, movementsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/stock/items`, this.authConfig()),
          axios.get(`${API_BASE_URL}/stock/movements`, this.authConfig())
        ])

        this.supplies = Array.isArray(suppliesResponse.data) ? suppliesResponse.data : []
        this.movements = Array.isArray(movementsResponse.data?.items) ? movementsResponse.data.items : []

      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo cargar el módulo de stock")
      }
    },
    async registerMovement() {
      if (this.isSaving) {
        return
      }

      this.isSaving = true
      try {
        await axios.post(`${API_BASE_URL}/stock/movements`, this.form, this.authConfig())
        this.$notify.success("Movimiento registrado")
        this.form = {
          itemId: "",
          movementType: "in",
          plates: 0,
        }
        await this.loadData()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo registrar el movimiento")
      } finally {
        this.isSaving = false
      }
    },
    toggleDetails(id) {
      this.openedDetailId = this.openedDetailId === id ? "" : id
    },
    normalizeLookupText(value) {
      return String(value || "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
    },
    sanitizeMovementReason(reason) {
      const text = String(reason || "").trim()
      if (!text) return ""
      if (/^importacion compras\s*:/i.test(text)) {
        return ""
      }
      return text
    },
    getMovementSupplierEvaluation(item) {
      const supplierKey = this.normalizeLookupText(item?.item?.supplier || "")

      if (supplierKey) {
        const directMatch = this.supplierEvaluations[supplierKey.replace(/\s+/g, "_")]
        if (directMatch) {
          return directMatch
        }
      }

      const haystack = this.normalizeLookupText(`${item?.item?.name || ""} ${item?.item?.size || ""}`)

      for (const [providerKey, matchers] of Object.entries(this.movementProviderMatchers)) {
        if (matchers.some((matcher) => haystack.includes(this.normalizeLookupText(matcher)))) {
          return this.supplierEvaluations[providerKey] || null
        }
      }

      return null
    },
    scoreClass(value) {
      const numeric = Number(value)
      if (numeric === 1) return "score-1"
      if (numeric === 2) return "score-2"
      if (numeric === 3) return "score-3"
      return "score-na"
    },
    normalizeMaterialType(value) {
      const raw = String(value || "").trim().toLowerCase()
      if (!raw) return "otros"
      if (raw.includes("madera")) return "placas"
      return "otros"
    },
    formatMaterialType(value) {
      const text = String(value || "").trim()
      if (!text) return "-"
      if (text.toLowerCase() === "madera") return "PLACAS"
      return text.charAt(0).toUpperCase() + text.slice(1)
    },
    formatDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) return "-"
      return date.toLocaleString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
  },
  async mounted() {
    await this.loadData()
    document.body.style.backgroundImage = `url(${this.backgroundImage})`
    document.body.style.backgroundSize = "cover"
    document.body.style.backgroundPosition = "center"
    document.body.style.backgroundRepeat = "no-repeat"
    document.body.style.backgroundAttachment = "fixed"
  },
  beforeUnmount() {
    document.body.style.backgroundImage = ""
    document.body.style.backgroundSize = ""
    document.body.style.backgroundPosition = ""
    document.body.style.backgroundRepeat = ""
    document.body.style.backgroundAttachment = ""
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  padding: 1rem;
}

.movement-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.panel-card {
  padding: 1.2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.panel-wide {
  grid-column: 1 / -1;
}

.form-grid {
  display: grid;
  gap: 0.6rem;
}

.filter-block {
  margin-bottom: 0.7rem;
}

.filter-block label {
  font-size: 0.92rem;
  color: #344955;
}

input,
select,
textarea,
button {
  width: 100%;
  border: 1px solid #d2d2d2;
  border-radius: 12px;
  padding: 10px;
}

button {
  background: #7f8c8d;
  color: #fff;
  border: none;
  cursor: pointer;
}

button.secondary {
  width: auto;
  padding: 8px 14px;
  background: #49627a;
}

.movement-type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.type-button {
  background: #d9e4ea;
  color: #234;
}

.type-button.active {
  background: #2f6f8f;
  color: #fff;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.table-wrap {
  overflow: auto;
}

.details-cell {
  text-align: center;
}

.supplier-inline {
  color: #365061;
  font-weight: 600;
}

.details-button {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  padding: 0;
  font-weight: 700;
  background: #f59f00;
  color: #1f2933;
}

.details-row td {
  background: #f7fafc;
}

.details-inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.45rem 0.8rem;
  padding: 0.4rem 0.1rem;
}

.details-inline p {
  margin: 0;
  white-space: normal;
}

.supplier-evaluation-box {
  margin-top: 0.8rem;
  padding: 0.8rem;
  border-radius: 10px;
  background: #eef5fb;
  border: 1px solid #d8e6f3;
}

.supplier-evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.supplier-name {
  font-weight: 700;
  color: #244a68;
}

.supplier-evaluation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.45rem 0.8rem;
}

.supplier-evaluation-grid p {
  margin: 0;
  white-space: normal;
}

.criteria-grid {
  margin-top: 0.55rem;
}

.score-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.6rem 0;
}

.score-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
}

.score-1 {
  background: #d8f5df;
  color: #1b5e20;
}

.score-2 {
  background: #fff4d6;
  color: #8a6d00;
}

.score-3 {
  background: #ffe1e1;
  color: #a30000;
}

.score-na {
  background: #eceff1;
  color: #607d8b;
}

.calif-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  padding: 0.15rem 0.45rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
}

.calif-a {
  background: #d8f5df;
  color: #1b5e20;
}

.calif-b {
  background: #fff4d6;
  color: #8a6d00;
}

.calif-c {
  background: #ffe1e1;
  color: #a30000;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #ececec;
  padding: 0.55rem;
  text-align: left;
  white-space: nowrap;
}

.empty-state {
  color: #666;
}
</style>
