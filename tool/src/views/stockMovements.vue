<template>
  <div class="page-container">
    <div class="movement-layout">
      <section class="panel-card">
        <h2>Carga y descarga de stock</h2>

        <form class="form-grid" @submit.prevent="registerMovement">
          <select v-model="form.itemId" required>
            <option value="">Seleccionar insumo</option>
            <option v-for="item in supplies" :key="item._id" :value="item._id">
              {{ item.name }} {{ item.size ? `(${item.size})` : '' }} - stock: {{ item.stockPlates }} placas
            </option>
          </select>

          <select v-model="form.movementType" required>
            <option value="in">Carga (+)</option>
            <option value="out">Descarga (-)</option>
          </select>

          <input v-model.number="form.pallets" type="number" min="0" step="1" placeholder="Pallets" />
          <input v-model.number="form.plates" type="number" min="0" step="1" placeholder="Placas" />
          <textarea v-model="form.reason" placeholder="Motivo / referencia"></textarea>

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

        <p v-if="!movements.length" class="empty-state">Sin movimientos registrados.</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Tipo</th>
                <th>Pallets</th>
                <th>Placas</th>
                <th>Delta placas</th>
                <th>Stock resultante</th>
                <th>Usuario</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in movements" :key="item._id">
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ item.item?.name || '-' }} {{ item.item?.size ? `(${item.item.size})` : '' }}</td>
                <td>{{ item.movementType === 'in' ? 'Carga' : 'Descarga' }}</td>
                <td>{{ item.pallets }}</td>
                <td>{{ item.plates }}</td>
                <td>{{ item.deltaPlates }}</td>
                <td>{{ item.stockAfterPlates }}</td>
                <td>{{ item.performedBy?.name || '-' }}</td>
                <td>{{ item.reason || '-' }}</td>
              </tr>
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
      isSaving: false,
      form: {
        itemId: "",
        movementType: "in",
        pallets: 0,
        plates: 0,
        reason: ""
      },
      backgroundImage
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
          pallets: 0,
          plates: 0,
          reason: ""
        }
        await this.loadData()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo registrar el movimiento")
      } finally {
        this.isSaving = false
      }
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

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.table-wrap {
  overflow: auto;
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
