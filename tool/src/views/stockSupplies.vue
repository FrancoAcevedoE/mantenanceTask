<template>
  <div class="page-container">
    <div class="stock-layout">
      <section class="panel-card">
        <h2>Insumos de materia prima</h2>

        <form class="form-grid" @submit.prevent="createSupply">
          <input v-model="form.name" type="text" placeholder="Nombre del insumo" required />
          <select v-model="form.materialType">
            <option value="madera">Madera</option>
          </select>
          <input v-model="form.size" type="text" placeholder="Tamaño / medida" />
          <input v-model.number="form.areaM2PerPlate" type="number" min="0" step="0.01" placeholder="m2 por placa" />
          <input v-model.number="form.platesPerPallet" type="number" min="1" step="1" placeholder="Placas por pallet" />
          <input v-model.number="form.stockPlates" type="number" min="0" step="1" placeholder="Stock inicial en placas" />
          <textarea v-model="form.notes" placeholder="Observaciones (opcional)"></textarea>
          <button type="submit">Agregar insumo</button>
        </form>
      </section>

      <section class="panel-card">
        <h2>Importar / Exportar</h2>
        <p class="helper-text">Podés subir el Excel del stock y también descargar una plantilla con insumos y movimientos.</p>

        <p v-if="lastSync.lastImportAt" class="sync-meta">
          Ultima sincronizacion: {{ formatDate(lastSync.lastImportAt) }} | Archivo: {{ lastSync.lastFileName || '-' }} | Modo: {{ lastSync.lastMode === 'accumulate' ? 'Acumular' : 'Sobrescribir' }}
        </p>

        <div class="import-actions">
          <input type="file" accept=".xlsx,.xlsm,.xls" @change="onFileSelected" />
          <select v-model="importMode">
            <option value="overwrite">Sobrescribir stock por archivo</option>
            <option value="accumulate">Acumular sobre stock actual</option>
          </select>
          <button type="button" :disabled="!selectedFile || isImporting" @click="importExcel">
            {{ isImporting ? 'Sincronizando...' : 'Sincronizar stock desde Excel' }}
          </button>
          <button type="button" class="secondary" :disabled="isExporting" @click="exportExcel">
            {{ isExporting ? 'Exportando...' : 'Descargar Excel de stock' }}
          </button>
        </div>

        <div v-if="importSummary" class="import-summary-box">
          <strong>Resultado:</strong>
          <span>
            Modo {{ importSummary.mode === 'accumulate' ? 'Acumular' : 'Sobrescribir' }} | creados {{ importSummary.created }} | actualizados {{ importSummary.updated }} | omitidos {{ importSummary.skipped }}
          </span>

          <div v-if="importReport.length" class="report-download-actions">
            <button type="button" class="secondary" @click="downloadDiffReportCsv">
              Descargar reporte CSV
            </button>
            <button type="button" class="secondary" @click="downloadDiffReportXlsx">
              Descargar reporte XLSX
            </button>
          </div>
        </div>
      </section>

      <section v-if="importReport.length" class="panel-card panel-wide">
        <h2>Reporte de diferencias (antes/despues)</h2>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fila</th>
                <th>Insumo</th>
                <th>Accion</th>
                <th>Modo</th>
                <th>Antes (placas)</th>
                <th>Importado (placas)</th>
                <th>Despues (placas)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in importReport" :key="`${item.rowNumber}-${item.key}`">
                <td>{{ item.rowNumber }}</td>
                <td>{{ item.key }}</td>
                <td>{{ item.action === 'created' ? 'Creado' : 'Actualizado' }}</td>
                <td>{{ item.mode === 'accumulate' ? 'Acumular' : 'Sobrescribir' }}</td>
                <td>{{ item.beforeStockPlates }}</td>
                <td>{{ item.importedStockPlates }}</td>
                <td>{{ item.afterStockPlates }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel-card panel-wide">
        <div class="list-header">
          <h2>Listado de insumos</h2>
          <input v-model="search" type="text" placeholder="Buscar por nombre o tamaño" />
        </div>

        <p v-if="!filteredSupplies.length" class="empty-state">No hay insumos cargados.</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Tipo</th>
                <th>Tamaño</th>
                <th>m2 por placa</th>
                <th>Placas por pallet</th>
                <th>Stock placas</th>
                <th>Pallets equiv.</th>
                <th>Stock total m2</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredSupplies" :key="item._id">
                <td>{{ item.name }}</td>
                <td>{{ item.materialType }}</td>
                <td>{{ item.size || '-' }}</td>
                <td>{{ item.areaM2PerPlate }}</td>
                <td>{{ item.platesPerPallet }}</td>
                <td>{{ item.stockPlates }}</td>
                <td>{{ item.stockPalletsEquivalent }}</td>
                <td>{{ item.stockTotalM2 }}</td>
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
      search: "",
      selectedFile: null,
      isImporting: false,
      isExporting: false,
      importMode: "overwrite",
      importSummary: null,
      importReport: [],
      lastSync: {
        lastImportAt: null,
        lastFileName: "",
        lastMode: "overwrite",
        lastSummary: {}
      },
      form: {
        name: "",
        materialType: "madera",
        size: "",
        areaM2PerPlate: 0,
        platesPerPallet: 1,
        stockPlates: 0,
        notes: ""
      },
      backgroundImage
    }
  },
  computed: {
    filteredSupplies() {
      const term = this.search.trim().toLowerCase()
      if (!term) return this.supplies

      return this.supplies.filter((item) => {
        const byName = String(item.name || "").toLowerCase().includes(term)
        const bySize = String(item.size || "").toLowerCase().includes(term)
        return byName || bySize
      })
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
    async loadSupplies() {
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/items`, this.authConfig())
        this.supplies = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo cargar insumos")
      }
    },
    async loadSyncStatus() {
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/sync/status`, this.authConfig())
        this.lastSync = response.data?.sync || this.lastSync
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo obtener estado de sincronizacion")
      }
    },
    async createSupply() {
      try {
        await axios.post(`${API_BASE_URL}/stock/items`, this.form, this.authConfig())
        this.$notify.success("Insumo agregado")
        this.form = {
          name: "",
          materialType: "madera",
          size: "",
          areaM2PerPlate: 0,
          platesPerPallet: 1,
          stockPlates: 0,
          notes: ""
        }
        await this.loadSupplies()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo agregar el insumo")
      }
    },
    onFileSelected(event) {
      const [file] = event.target.files || []
      this.selectedFile = file || null
    },
    async importExcel() {
      if (!this.selectedFile || this.isImporting) {
        return
      }

      this.isImporting = true
      try {
        const formData = new FormData()
        formData.append("file", this.selectedFile)
        formData.append("mode", this.importMode)

        const response = await axios.post(`${API_BASE_URL}/stock/import/excel`, formData, {
          ...this.authConfig(),
          headers: {
            ...this.authConfig().headers,
            "Content-Type": "multipart/form-data"
          }
        })

        this.importSummary = response.data?.summary || null
        this.importReport = Array.isArray(response.data?.report) ? response.data.report : []
        this.lastSync = response.data?.sync || this.lastSync

        this.$notify.success("Sincronizacion completada")
        this.selectedFile = null
        await this.loadSupplies()
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo importar el archivo")
      } finally {
        this.isImporting = false
      }
    },
    async exportExcel() {
      if (this.isExporting) {
        return
      }

      this.isExporting = true
      try {
        const response = await axios.get(`${API_BASE_URL}/stock/export/excel`, {
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
        link.download = `stock-materia-prima-${timestamp}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        this.$notify.notifyApiError(error, "No se pudo exportar el stock")
      } finally {
        this.isExporting = false
      }
    },
    normalizeReportRows() {
      return this.importReport.map((item) => ({
        fila: item.rowNumber,
        insumo: item.key,
        accion: item.action === "created" ? "Creado" : "Actualizado",
        modo: item.mode === "accumulate" ? "Acumular" : "Sobrescribir",
        antes_placas: item.beforeStockPlates,
        importado_placas: item.importedStockPlates,
        despues_placas: item.afterStockPlates
      }))
    },
    downloadDiffReportCsv() {
      if (!this.importReport.length) {
        this.$notify.error("No hay reporte para descargar")
        return
      }

      const rows = this.normalizeReportRows()
      const headers = Object.keys(rows[0])

      const escapeCsv = (value) => {
        const text = String(value ?? "")
        if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
          return `"${text.replace(/\"/g, '""')}"`
        }
        return text
      }

      const csv = [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

      link.href = url
      link.download = `reporte-diferencias-stock-${timestamp}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    async downloadDiffReportXlsx() {
      if (!this.importReport.length) {
        this.$notify.error("No hay reporte para descargar")
        return
      }

      const XLSX = await import("xlsx")
      const rows = this.normalizeReportRows()
      const workbook = XLSX.utils.book_new()
      const sheet = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(workbook, sheet, "Diferencias")

      const fileBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
      const blob = new Blob(
        [fileBuffer],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

      link.href = url
      link.download = `reporte-diferencias-stock-${timestamp}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
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
        minute: "2-digit",
        second: "2-digit"
      })
    }
  },
  async mounted() {
    await this.loadSupplies()
    await this.loadSyncStatus()
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

.import-actions {
  display: grid;
  gap: 0.55rem;
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

.report-download-actions {
  margin-top: 0.35rem;
  display: grid;
  gap: 0.45rem;
}

.list-header {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  justify-content: space-between;
}

.list-header input {
  max-width: 300px;
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
