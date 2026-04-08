<template>
  <div class="page-container">
    <div class="movement-layout">
      <section class="panel-card">
        <h2>Carga y descarga de stock</h2>

        <div class="form-grid filter-block">
          <label for="materialTypeFilter">Filtro</label>
          <select id="materialTypeFilter" v-model="selectedMaterialType" disabled>
            <option value="placas">PLACAS</option>
          </select>
        </div>

        <form class="form-grid" @submit.prevent="registerMovement">
          <select v-model="form.itemId" required>
            <option value="">Seleccionar insumo</option>
            <option v-for="item in filteredSupplies" :key="item._id" :value="item._id">
              {{ item.name }} {{ item.size ? `(${item.size})` : '' }} - stock: {{ item.stockPlates }} placas
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

          <input v-model.number="form.plates" type="number" min="1" step="1" placeholder="Cantidad de placas" />

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
                  <td>{{ item.item?.name || '-' }} {{ item.item?.size ? `(${item.item.size})` : '' }}</td>
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
                      <p><strong>Motivo:</strong> {{ item.reason || '-' }}</p>
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
      isSaving: false,
      openedDetailId: "",
      form: {
        itemId: "",
        movementType: "in",
        plates: 0,
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
      return this.categorizedSupplies.filter(item => item.materialCategory === "placas")
    },
    filteredMovements() {
      return this.categorizedMovements.filter(item => item.materialCategory === "placas")
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
