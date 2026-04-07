<template>
  <div class="page-container">
    <div class="stock-layout">
      <section class="panel-card">
        <details class="collapsible" open>
          <summary>Compras mensuales</summary>

          <div class="collapsible-body">
            <p class="helper-text">Importa la planilla de compras y, opcionalmente, actualiza el stock en conjunto con Insumos y Movimientos.</p>

            <p v-if="lastSync.lastImportAt" class="sync-meta">
              Ultima importacion: {{ formatDate(lastSync.lastImportAt) }} | Archivo: {{ lastSync.lastFileName || '-' }} | Modo: {{ lastSync.lastMode === 'accumulate' ? 'Acumular' : 'Sobrescribir' }}
            </p>

            <div class="form-grid">
              <input type="file" accept=".xlsx,.xlsm,.xls" @change="onFileSelected" />

              <select v-model="importMode">
                <option value="accumulate">Acumular compras al stock actual</option>
                <option value="overwrite">Sobrescribir stock con valores de la planilla</option>
              </select>

              <label class="toggle-row">
                <input v-model="applyStock" type="checkbox" />
                Aplicar cambios al stock de insumos
              </label>

              <button type="button" :disabled="!selectedFile || isImporting" @click="importPurchases">
                {{ isImporting ? 'Importando...' : 'Sincronizar compras desde Excel' }}
              </button>

              <button type="button" class="secondary" :disabled="isExporting" @click="exportPurchases">
                {{ isExporting ? 'Exportando...' : 'Descargar compras (Excel)' }}
              </button>
            </div>

            <div v-if="importSummary" class="import-summary-box">
              <strong>Resultado:</strong>
              <span>
                creados {{ importSummary.created }} | actualizados {{ importSummary.updated }} | omitidos {{ importSummary.skipped }} | lote {{ importSummary.batchId }}
              </span>
            </div>
          </div>
        </details>
      </section>

      <section v-if="importReport.length" class="panel-card panel-wide">
        <h2>Reporte de importacion</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fila</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Modo</th>
                <th>Aplica stock</th>
                <th>Antes</th>
                <th>Importado</th>
                <th>Despues</th>
                <th>m2 totales</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in importReport" :key="`${item.rowNumber}-${item.key}`">
                <td>{{ item.rowNumber }}</td>
                <td>{{ item.key }}</td>
                <td>{{ item.supplier || '-' }}</td>
                <td>{{ item.mode === 'accumulate' ? 'Acumular' : 'Sobrescribir' }}</td>
                <td>{{ item.applyStock ? 'SI' : 'NO' }}</td>
                <td>{{ item.beforeStockPlates }}</td>
                <td>{{ item.importedStockPlates }}</td>
                <td>{{ item.afterStockPlates }}</td>
                <td>{{ item.totalM2 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel-card panel-wide">
        <div class="list-header">
          <h2>Compras importadas</h2>
          <button type="button" class="secondary" @click="loadPurchases">Actualizar</button>
        </div>

        <p v-if="!purchases.length" class="empty-state">No hay compras importadas.</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Producto</th>
                <th>Código</th>
                <th>Calidad</th>
                <th>Tamaño</th>
                <th>Hojas x pallet</th>
                <th>Pallets</th>
                <th>Placas</th>
                <th>m2 totales</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in purchases" :key="item._id">
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ item.supplier || '-' }}</td>
                <td>{{ item.product }}</td>
                <td>{{ item.code || '-' }}</td>
                <td>{{ item.quality || '-' }}</td>
                <td>{{ item.size || '-' }}</td>
                <td>{{ item.platesPerPallet }}</td>
                <td>{{ item.palletCount }}</td>
                <td>{{ item.platesCount }}</td>
                <td>{{ item.totalM2 }}</td>
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
      selectedFile: null,
      isImporting: false,
      isExporting: false,
      importMode: "accumulate",
      applyStock: true,
      importSummary: null,
      importReport: [],
      purchases: [],
      lastSync: {
        lastImportAt: null,
        lastFileName: "",
        lastMode: "accumulate",
        lastSummary: {}
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
    onFileSelected(event) {
      const [file] = event.target.files || []
      this.selectedFile = file || null
    },
    async loadPurchases() {
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/purchases`, this.authConfig())
        this.purchases = Array.isArray(response.data?.items) ? response.data.items : []
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo cargar compras importadas")
      }
    },
    async loadSyncStatus() {
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/purchases/sync/status`, this.authConfig())
        this.lastSync = response.data?.sync || this.lastSync
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo obtener estado de sincronizacion")
      }
    },
    async importPurchases() {
      if (!this.selectedFile || this.isImporting) {
        return
      }

      this.isImporting = true
      try {
        const formData = new FormData()
        formData.append("file", this.selectedFile)
        formData.append("mode", this.importMode)
        formData.append("applyStock", String(this.applyStock))

        const response = await axios.post(`${API_BASE_URL}/stock/import/purchases-excel`, formData, {
          ...this.authConfig(),
          headers: {
            ...this.authConfig().headers,
            "Content-Type": "multipart/form-data"
          }
        })

        this.importSummary = response.data?.summary || null
        this.importReport = Array.isArray(response.data?.report) ? response.data.report : []
        this.lastSync = response.data?.sync || this.lastSync
        this.selectedFile = null

        this.$notify.success("Compras importadas correctamente")

        await this.loadPurchases()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo importar compras")
      } finally {
        this.isImporting = false
      }
    },
    async exportPurchases() {
      if (this.isExporting) {
        return
      }

      this.isExporting = true
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/purchases/export/excel`, {
          ...this.authConfig(),
          responseType: "blob"
        })

        const blob = new Blob(
          [response.data],
          { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        )
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

        link.href = url
        link.download = `compras-mensuales-${timestamp}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo exportar compras")
      } finally {
        this.isExporting = false
      }
    },
    formatDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) {
        return "-"
      }

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
    await Promise.all([this.loadSyncStatus(), this.loadPurchases()])
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

.stock-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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

.collapsible {
  border: 1px solid #dce3e6;
  border-radius: 10px;
  padding: 0.4rem 0.65rem;
  background: #f8fbfc;
}

.collapsible summary {
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 700;
  color: #2e4450;
  user-select: none;
}

.collapsible-body {
  margin-top: 0.65rem;
}

.form-grid {
  display: grid;
  gap: 0.6rem;
}

input,
select,
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
  background: #49627a;
}

.helper-text {
  color: #455a64;
  margin-top: 0;
}

.sync-meta {
  margin: 0 0 0.55rem;
  color: #365061;
}

.import-summary-box {
  margin-top: 0.6rem;
  border-radius: 10px;
  padding: 0.6rem;
  background: #eef7f3;
  color: #1d4d3a;
  display: grid;
  gap: 0.25rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #2e3a40;
}

.toggle-row input {
  width: auto;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
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
