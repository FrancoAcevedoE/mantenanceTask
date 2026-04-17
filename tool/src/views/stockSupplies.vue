<template>
  <div class="page-container">
    <div class="stock-layout">
      <section class="panel-card">
        <details class="collapsible" :open="openedPanel === 'supply'" @toggle="handlePanelToggle('supply', $event)">
          <summary>Insumos de materia prima</summary>

          <form class="form-grid collapsible-body" @submit.prevent="createSupply">
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
        </details>
      </section>

      <section class="panel-card">
        <details class="collapsible" :open="openedPanel === 'import'" @toggle="handlePanelToggle('import', $event)">
          <summary>Importar / Exportar</summary>

          <div class="collapsible-body">
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

            <div class="import-actions import-actions-secondary">
              <div class="file-group">
                <input type="file" accept=".xlsx,.xlsm,.xls" @change="onPlacasFileSelected" />
                <button type="button" :disabled="!selectedPlacasFile || isImportingPlacas" @click="importPlacasExcel">
                  {{ isImportingPlacas ? 'Importando placas...' : 'Importar placas desde Excel' }}
                </button>
              </div>
              <div class="file-group">
                <input type="file" accept=".xlsx,.xlsm,.xls" @change="onTopBoxFileSelected" />
                <button type="button" :disabled="!selectedTopBoxFile || isImportingTopBox" @click="importTopBoxExcel">
                  {{ isImportingTopBox ? 'Importando herrajes...' : 'Importar herrajes Top Box' }}
                </button>
              </div>
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
          </div>
        </details>
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
          <h2>Placas</h2>
          <div class="data-controls">
            <span class="data-indicator" v-if="placasData.length > 0">
              <i class="bi bi-check-circle-fill"></i>
              Datos cargados desde Excel
            </span>
            <button type="button" class="secondary small" v-if="placasData.length > 0" @click="clearPlacasData">
              Limpiar datos
            </button>
          </div>
        </div>

        <div class="quick-legend">
          <span class="calif-badge calif-a">A</span>
          <span>Proveedor recomendado</span>
          <span class="calif-badge calif-b">B</span>
          <span>Seguimiento medio</span>
          <span class="calif-badge calif-c">C</span>
          <span>Solo casos excepcionales</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Proveedor</th>
                <th>Producto</th>
                <th>Espesor (mm)</th>
                <th>Ancho (mm)</th>
                <th>Largo (mm)</th>
                <th>Calidad</th>
                <th>Cant. placas stock</th>
                <th>M2 totales stock</th>
                <th>Estado proveedor</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in placasDataWithEvaluation" :key="`${item.codigo}-${index}`">
                <td class="code">{{ item.codigo }}</td>
                <td>{{ item.proveedor }}</td>
                <td>{{ item.producto }}</td>
                <td>{{ item.espesorMm }}</td>
                <td>{{ item.anchoMm }}</td>
                <td>{{ item.largoMm }}</td>
                <td>{{ item.calidad }}</td>
                <td class="quantity">
                  <span :class="{ 'low-stock': item.cantidadStock === 0 }">{{ item.cantidadStock }}</span>
                </td>
                <td>{{ item.m2TotalesStock }}</td>
                <td>
                  <div class="status-stack">
                    <span class="calif-badge" :class="`calif-${String(getSupplierEvaluation(item.proveedor)?.calificacionFinal || '-').toLowerCase()}`">
                      {{ getSupplierEvaluation(item.proveedor)?.calificacionFinal || '-' }}
                    </span>
                    <small>
                      Puntaje {{ getSupplierEvaluation(item.proveedor)?.puntaje || '-' }}
                    </small>
                  </div>
                </td>
                <td>
                  <button type="button" class="details-btn" @click="openSupplierDetails(item.proveedor)">
                    Ver detalles
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel-card panel-wide">
        <div class="list-header">
          <h2>Top Box - Herrajes</h2>
          <div class="data-controls">
            <span class="data-indicator" v-if="topBoxData.length > 0">
              <i class="bi bi-check-circle-fill"></i>
              Datos cargados desde Excel
            </span>
            <button type="button" class="secondary small" v-if="topBoxData.length > 0" @click="clearTopBoxData">
              Limpiar datos
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Herraje</th>
                <th>Función</th>
                <th>Código</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topBoxData" :key="`${item.cod}-${index}`">
                <td>{{ item.herraje }}</td>
                <td>{{ item.funcion }}</td>
                <td class="code">{{ item.cod }}</td>
                <td class="quantity">
                  <span v-if="item.cantidad !== null" :class="{ 'low-stock': item.cantidad === 0 }">
                    {{ item.cantidad }}
                  </span>
                  <span v-else class="stock-unknown">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="isSupplierModalOpen" class="modal-backdrop" @click.self="closeSupplierDetails">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Evaluacion de proveedor: {{ selectedSupplier }}</h3>
            <button type="button" class="close-btn" @click="closeSupplierDetails">X</button>
          </div>

          <div class="modal-content">
            <p><strong>Materia prima:</strong> {{ selectedEvaluation.materiaPrima }}</p>
            <p>
              <strong>Calificacion inicial/flexibilidad:</strong>
              <span class="calif-badge" :class="`calif-${String(selectedEvaluation.calificacionInicial).toLowerCase()}`">
                {{ selectedEvaluation.calificacionInicial }}
              </span>
              /
              <span class="calif-badge" :class="`calif-${String(selectedEvaluation.calificacionFinal).toLowerCase()}`">
                {{ selectedEvaluation.calificacionFinal }}
              </span>
            </p>
            <p><strong>Total:</strong> {{ selectedEvaluation.total }} | <strong>Puntaje:</strong> {{ selectedEvaluation.puntaje }}</p>

            <div class="legend-box">
              <strong>Referencia Excel:</strong>
              <span class="score-chip score-1">1 = Bueno</span>
              <span class="score-chip score-2">2 = Regular</span>
              <span class="score-chip score-3">3 = Mal</span>
              <span class="legend-note">En "Condiciones especiales" la escala es inversa.</span>
            </div>

            <table class="evaluation-table">
              <thead>
                <tr>
                  <th>Criterio</th>
                  <th>Valor</th>
                  <th>Lectura</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Comercial - precios</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.precios)">{{ selectedEvaluation.precios }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.precios, false) }}</td>
                </tr>
                <tr>
                  <td>Comercial - condiciones</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.condiciones)">{{ selectedEvaluation.condiciones }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.condiciones, false) }}</td>
                </tr>
                <tr>
                  <td>Logistica</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.logistica)">{{ selectedEvaluation.logistica }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.logistica, false) }}</td>
                </tr>
                <tr>
                  <td>Calidad - producto</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.calidadProducto)">{{ selectedEvaluation.calidadProducto }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.calidadProducto, false) }}</td>
                </tr>
                <tr>
                  <td>Calidad - no conformidades</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.calidadNoConformidades)">{{ selectedEvaluation.calidadNoConformidades }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.calidadNoConformidades, false) }}</td>
                </tr>
                <tr>
                  <td>Medio ambiente</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.medioAmbiente)">{{ selectedEvaluation.medioAmbiente }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.medioAmbiente, false) }}</td>
                </tr>
                <tr>
                  <td>Condiciones especiales</td>
                  <td><span class="score-chip" :class="scoreClass(selectedEvaluation.condicionesEspeciales)">{{ selectedEvaluation.condicionesEspeciales }}</span></td>
                  <td>{{ scoreMeaning(selectedEvaluation.condicionesEspeciales, true) }}</td>
                </tr>
              </tbody>
            </table>

            <p class="evaluation-note">Visual adaptado a la planilla para mantener coherencia de lectura.</p>
            <p><strong>Observaciones:</strong> {{ selectedEvaluation.observaciones }}</p>
          </div>
        </div>
      </div>
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
      selectedFile: null,
      selectedPlacasFile: null,
      selectedTopBoxFile: null,
      isImporting: false,
      isImportingPlacas: false,
      isImportingTopBox: false,
      isExporting: false,
      importMode: "overwrite",
      importSummary: null,
      importReport: [],
      openedPanel: "supply",
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
      placasData: [
        {
          codigo: "P-001",
          proveedor: "Villa Guillermina",
          producto: "MDF",
          espesorMm: 18,
          anchoMm: 1830,
          largoMm: 2600,
          calidad: "A",
          cantidadStock: 42,
          m2TotalesStock: 199.84
        },
        {
          codigo: "P-002",
          proveedor: "Cuyoplacas",
          producto: "Aglomerado",
          espesorMm: 18,
          anchoMm: 1830,
          largoMm: 2600,
          calidad: "A",
          cantidadStock: 27,
          m2TotalesStock: 128.47
        },
        {
          codigo: "P-003",
          proveedor: "Sadepan",
          producto: "Aglomerado",
          espesorMm: 15,
          anchoMm: 1830,
          largoMm: 2600,
          calidad: "B",
          cantidadStock: 18,
          m2TotalesStock: 85.64
        },
        {
          codigo: "P-004",
          proveedor: "Faplac",
          producto: "Aglomerado",
          espesorMm: 18,
          anchoMm: 1830,
          largoMm: 2600,
          calidad: "A",
          cantidadStock: 14,
          m2TotalesStock: 66.61
        },
        {
          codigo: "P-005",
          proveedor: "Trupan",
          producto: "MDF",
          espesorMm: 9,
          anchoMm: 1830,
          largoMm: 2600,
          calidad: "A",
          cantidadStock: 31,
          m2TotalesStock: 147.50
        },
        {
          codigo: "P-006",
          proveedor: "Fiplasto",
          producto: "Chapadur",
          espesorMm: 3,
          anchoMm: 1220,
          largoMm: 2440,
          calidad: "B",
          cantidadStock: 0,
          m2TotalesStock: 0
        }
      ],
      supplierEvaluations: {
        "VILLA GUILLERMINA": {
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
          calificacionInicial: "B",
          calificacionFinal: "A",
          observaciones: "Datos extraidos de Hoja1 (noviembre 2023)."
        },
        CUYOPLACAS: {
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
          calificacionInicial: "B",
          calificacionFinal: "A",
          observaciones: "Datos extraidos de Hoja1 (noviembre 2023)."
        },
        FAPLAC: {
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
          calificacionInicial: "B",
          calificacionFinal: "A",
          observaciones: "Datos extraidos de Hoja1 (noviembre 2023)."
        },
        FIPLASTO: {
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
          calificacionInicial: "B",
          calificacionFinal: "B",
          observaciones: "Datos extraidos de Hoja1 (noviembre 2023)."
        }
      },
      isSupplierModalOpen: false,
      selectedSupplier: "",
      selectedEvaluation: {
        materiaPrima: "Sin datos",
        precios: "-",
        condiciones: "-",
        logistica: "-",
        calidadProducto: "-",
        calidadNoConformidades: "-",
        medioAmbiente: "-",
        condicionesEspeciales: "-",
        total: "-",
        puntaje: "-",
        calificacionInicial: "-",
        calificacionFinal: "-",
        observaciones: "Sin datos"
      },
      topBoxData: [
        { herraje: "SOPORTE PLACA 13-15mm", funcion: "SOPORTE KOMPAK", cod: "T-01A", cantidad: 25 },
        { herraje: "BISAGRA SELF CLOSING", funcion: "DERECHA", cod: "E-BT-1", cantidad: null },
        { herraje: "BISAGRA SELF CLOSING", funcion: "IZQUIERDA", cod: "E-BT-2", cantidad: null },
        { herraje: "ZÓCALOS (600x10mm)", funcion: "ZÓCALO", cod: "T-022", cantidad: 0 },
        { herraje: "PERFIL INOX 1\" (50x10mm)", funcion: "TRAVESAÑO", cod: "T-023", cantidad: 0 },
        { herraje: "TORN CAB FRESADA MX19", funcion: "FRENTE HP 15 MM", cod: "E-008-2", cantidad: 8 },
        { herraje: "PERFIL DE ALUMINIO", funcion: "SUJECCIÓN KOMPAK", cod: "E-001", cantidad: null },
        { herraje: "SOPORTE PLACA 10mm", funcion: "SUJECCIÓN KOMPAK", cod: "T-005", cantidad: null },
        { herraje: "TAPA PVC SUPERIOR DERECHA", funcion: "PARA PERFIL", cod: "E-002-1", cantidad: null },
        { herraje: "TAPA PVC SUPERIOR IZQUIERDA", funcion: "PARA PERFIL", cod: "E-002-2", cantidad: null },
        { herraje: "ZAPATA FUNCIÓN DE ALUMINIO", funcion: "PARA BASE DE PERFIL", cod: "T-003", cantidad: null },
        { herraje: "CERRADURA-PASADOR LIBRE/OCUPADO", funcion: "PARA PUERTA", cod: "E-009", cantidad: 4 },
        { herraje: "TORNILLO DEL PARKER AX1/8\"", funcion: "PARA TAPA LIBRE OCUPADO Y CERR0JO", cod: "E-B1-1", cantidad: 10 },
        { herraje: "TACO FISCHER MR8x10", funcion: "PARA ZAPATA", cod: "E-004", cantidad: null },
        { herraje: "TORNILLO CAB FRESADA MAX12", funcion: "PARA LATERAL XP", cod: "E-008-1", cantidad: null },
        { herraje: "TORNILLO CAB FRESADA MAX15", funcion: "HP P50 13 MM", cod: "E-008-3", cantidad: null },
        { herraje: "TORNILLO CAB BOTÓN INOX MAX10", funcion: "PARA KOMPAK Y CENEFA", cod: "E-B1-2", cantidad: 42 },
        { herraje: "TORNILLO CAB BOTÓN INOX MAX16", funcion: "PARA ZÓCALO Y TRAVESAÑO", cod: "E-B1-3", cantidad: 0 },
        { herraje: "TORNILLO CAB BOTÓN INOX MAX19", funcion: "PARA BISAGRA, ZÓCALO Y TRAVESAÑO", cod: "E-B1-5", cantidad: 8 },
        { herraje: "TORNILLO CAB BOTÓN INOX MAX30", funcion: "PARA KOMPAK Y CENEFA", cod: "E-B1-4", cantidad: 10 },
        { herraje: "TUERCA REMACHE M6", funcion: "PARA KOMPAK", cod: "T-012", cantidad: 56 },
        { herraje: "TORNILLO FIX MADERA Nº 8 X 2 1/2", funcion: "PARA PARED", cod: "E-B13", cantidad: 20 },
        { herraje: "TARUGO PARED Nº 8", funcion: "PARA PARED", cod: "E-B14", cantidad: 20 },
        { herraje: "TORN AUTOPERF 8X1/2\"", funcion: "PARA BISAGRA Y TUERCA", cod: "E-B14", cantidad: null },
        { herraje: "TORNILLO AUTOPERF 8X1", funcion: "PARA PERFIL LATERAL Y GRAPAS", cod: "E-B1-1", cantidad: null },
        { herraje: "TORNILLO AUTOPERF 8X1/2", funcion: "PARA PERFIL LATERAL GRAPAS", cod: "E-B1-2", cantidad: null },
        { herraje: "BURLETE GOMA PERFIL T5", funcion: "PARA PUERTA", cod: "E-020", cantidad: null },
        { herraje: "TORNILLO TEL PARKER AX1\"", funcion: "PARA \"C\" INGRESO PESTILLO", cod: "E-B10-2", cantidad: 10 },
        { herraje: "TORNILLO D TEL PARKER AX1/4\"", funcion: "PARA CERRADURA", cod: "E-B10-3", cantidad: 18 },
        { herraje: "SUPLEMENTO KOMPAK", funcion: "PARA ANCHO APERTURA ESPECIAL", cod: "T-019", cantidad: null },
        { herraje: "TAPA CERROJO PERFIL", funcion: "PARA INGRESO PESTILLO (PERFIL)", cod: "T-018", cantidad: null },
        { herraje: "FARFAIAS", funcion: "PARA DURLOCK", cod: "E-001", cantidad: null },
        { herraje: "BISAGRA DOBLE APERTURA", funcion: "BIDIRECCIONAL", cod: "E-022", cantidad: 4 },
        { herraje: "PRISIONEROS 4x8", funcion: "TODO MODELO", cod: "E-005", cantidad: 26 },
        { herraje: "PRISIONEROS 6X6", funcion: "TODO MODELO", cod: "E-006", cantidad: null }
      ],
      backgroundImage
    }
  },
  computed: {
    placasDataWithEvaluation() {
      return this.placasData.filter((item) => {
        const providerKey = this.normalizeProviderKey(item.proveedor)
        return Boolean(this.supplierEvaluations[providerKey])
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
    loadPersistedData() {
      try {
        const placasData = localStorage.getItem("stockPlacasData")
        if (placasData) {
          this.placasData = JSON.parse(placasData)
        }
        const topBoxData = localStorage.getItem("stockTopBoxData")
        if (topBoxData) {
          this.topBoxData = JSON.parse(topBoxData)
        }
      } catch (error) {
        console.warn("Error loading persisted stock data:", error)
      }
    },
    persistPlacasData() {
      try {
        localStorage.setItem("stockPlacasData", JSON.stringify(this.placasData))
      } catch (error) {
        console.warn("Error persisting placas data:", error)
      }
    },
    persistTopBoxData() {
      try {
        localStorage.setItem("stockTopBoxData", JSON.stringify(this.topBoxData))
      } catch (error) {
        console.warn("Error persisting top box data:", error)
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
    handlePanelToggle(panelName, event) {
      const isOpen = Boolean(event?.target?.open)
      if (isOpen) {
        this.openedPanel = panelName
        return
      }

      if (this.openedPanel === panelName) {
        this.openedPanel = ""
      }
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
    normalizeSheetHeader(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    },
    parseNumber(value) {
      const raw = String(value || "").trim().replace(/\s+/g, "").replace(/,/g, ".")
      const numeric = Number(raw.replace(/[^0-9.-]/g, ""))
      return Number.isFinite(numeric) ? numeric : null
    },
    buildHeaderIndex(headerRow) {
      const index = {}
      headerRow.forEach((cell, columnIndex) => {
        const key = this.normalizeSheetHeader(cell)
        if (key) {
          index[key] = columnIndex
        }
      })
      return index
    },
    getSheetValue(row, headerIndex, candidates = []) {
      for (const candidate of candidates) {
        const columnIndex = headerIndex[this.normalizeSheetHeader(candidate)]
        if (columnIndex !== undefined) {
          const value = row[columnIndex]
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value
          }
        }
      }
      return ""
    },
    toMillimeters(value) {
      const parsed = this.parseNumber(value)
      if (!Number.isFinite(parsed)) {
        return null
      }
      if (parsed > 1000) {
        return Math.round(parsed)
      }
      if (parsed > 0) {
        return Math.round(parsed * 1000)
      }
      return null
    },
    onPlacasFileSelected(event) {
      const [file] = event.target.files || []
      this.selectedPlacasFile = file || null
    },
    onTopBoxFileSelected(event) {
      const [file] = event.target.files || []
      this.selectedTopBoxFile = file || null
    },
    async importPlacasExcel() {
      if (!this.selectedPlacasFile || this.isImportingPlacas) {
        return
      }

      this.isImportingPlacas = true
      try {
        const XLSX = await import("xlsx")
        const arrayBuffer = await this.selectedPlacasFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames.find((name) =>
          this.normalizeSheetHeader(name).includes("stock_actual")
        ) || workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })

        const headerRowIndex = rows.findIndex((row) => {
          const normalized = row.map((cell) => this.normalizeSheetHeader(cell))
          return normalized.includes("codigo") && normalized.includes("proveedor") && normalized.includes("producto")
        })

        if (headerRowIndex < 0) {
          throw new Error("No se encontró la fila de cabecera de placas en el archivo")
        }

        const headerIndex = this.buildHeaderIndex(rows[headerRowIndex])
        const dataRows = rows.slice(headerRowIndex + 1)
          .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))

        const parsed = dataRows.map((row) => {
          const codigo = String(this.getSheetValue(row, headerIndex, ["codigo", "cod"])).trim()
          const proveedor = String(this.getSheetValue(row, headerIndex, ["proveedor"])).trim()
          const producto = String(this.getSheetValue(row, headerIndex, ["producto"])).trim()
          const espesorMm = this.toMillimeters(this.getSheetValue(row, headerIndex, ["espesor_mm", "espesor__mm", "espesor", "espesor_mm_", "espesor en mm"]))
          const anchoMm = this.toMillimeters(this.getSheetValue(row, headerIndex, ["ancho_mm", "ancho", "ancho_m", "ancho_m_", "ancho_mm_", "ancho mm"]))
          const largoMm = this.toMillimeters(this.getSheetValue(row, headerIndex, ["largo_mm", "largo", "largo_m", "largo_m_", "length", "longitud", "largo mm"]))
          const calidad = String(this.getSheetValue(row, headerIndex, ["calidad", "grade"])).trim()
          const cantidadStock = Number.isFinite(this.parseNumber(this.getSheetValue(row, headerIndex, ["cant_placas_stock", "cant_placas", "cantidad_placas", "cantidad_stock", "cant. placas stock", "cant.placas.stock"])))
            ? Math.round(this.parseNumber(this.getSheetValue(row, headerIndex, ["cant_placas_stock", "cant_placas", "cantidad_placas", "cantidad_stock", "cant. placas stock", "cant.placas.stock"])))
            : 0
          const m2TotalesStock = Number.isFinite(this.parseNumber(this.getSheetValue(row, headerIndex, ["m2_totales_stock", "m2_totales", "m2_totales_stock"])))
            ? Number(this.parseNumber(this.getSheetValue(row, headerIndex, ["m2_totales_stock", "m2_totales", "m2_totales_stock"]))).toFixed(2)
            : 0

          return {
            codigo,
            proveedor,
            producto,
            espesorMm: espesorMm || 0,
            anchoMm: anchoMm || 0,
            largoMm: largoMm || 0,
            calidad,
            cantidadStock,
            m2TotalesStock: Number(m2TotalesStock)
          }
        }).filter((item) => item.codigo && item.proveedor)

        if (!parsed.length) {
          throw new Error("El archivo de placas no contiene datos válidos")
        }

        this.placasData = parsed
        this.selectedPlacasFile = null
        this.persistPlacasData()
        this.$notify.success("Datos de placas importados correctamente")
      } catch (error) {
        this.$notify.error(error?.message || "No se pudo importar el archivo de placas")
      } finally {
        this.isImportingPlacas = false
      }
    },
    async importTopBoxExcel() {
      if (!this.selectedTopBoxFile || this.isImportingTopBox) {
        return
      }

      this.isImportingTopBox = true
      try {
        const XLSX = await import("xlsx")
        const arrayBuffer = await this.selectedTopBoxFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames.find((name) =>
          this.normalizeSheetHeader(name).includes("cargar") || this.normalizeSheetHeader(name).includes("top_box")
        ) || workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })

        const headerRowIndex = rows.findIndex((row) => {
          const normalized = row.map((cell) => this.normalizeSheetHeader(cell))
          return normalized.includes("herrajes") && normalized.includes("funcion") && (normalized.includes("cod") || normalized.includes("codigo"))
        })

        if (headerRowIndex < 0) {
          throw new Error("No se encontró la fila de cabecera de herrajes Top Box en el archivo")
        }

        const headerIndex = this.buildHeaderIndex(rows[headerRowIndex])
        const dataRows = rows.slice(headerRowIndex + 1)
          .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))

        const parsed = dataRows.map((row) => {
          const herraje = String(this.getSheetValue(row, headerIndex, ["herrajes", "herraje"])).trim()
          const funcion = String(this.getSheetValue(row, headerIndex, ["funcion", "función"])).trim()
          const cod = String(this.getSheetValue(row, headerIndex, ["cod", "codigo", "cód"])).trim()
          const cantidadRaw = this.getSheetValue(row, headerIndex, ["cantidad", "cant"])
          const parsedCantidad = this.parseNumber(cantidadRaw)

          return {
            herraje,
            funcion,
            cod,
            cantidad: Number.isFinite(parsedCantidad) ? Math.round(parsedCantidad) : null
          }
        }).filter((item) => item.herraje || item.cod)

        if (!parsed.length) {
          throw new Error("El archivo de Top Box no contiene datos válidos")
        }

        this.topBoxData = parsed
        this.selectedTopBoxFile = null
        this.persistTopBoxData()
        this.$notify.success("Datos de herrajes Top Box importados correctamente")
      } catch (error) {
        this.$notify.error(error?.message || "No se pudo importar el archivo de herrajes")
      } finally {
        this.isImportingTopBox = false
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
    clearPlacasData() {
      if (confirm("¿Estás seguro de que quieres limpiar los datos de placas?")) {
        this.placasData = []
        localStorage.removeItem("stockPlacasData")
        this.$notify.success("Datos de placas limpiados")
      }
    },
    clearTopBoxData() {
      if (confirm("¿Estás seguro de que quieres limpiar los datos de herrajes Top Box?")) {
        this.topBoxData = []
        localStorage.removeItem("stockTopBoxData")
        this.$notify.success("Datos de herrajes limpiados")
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
        minute: "2-digit",
        second: "2-digit"
      })
    },
    normalizeProviderKey(providerName) {
      return String(providerName || "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
    },
    getSupplierEvaluation(providerName) {
      const providerKey = this.normalizeProviderKey(providerName)
      return this.supplierEvaluations[providerKey] || null
    },
    openSupplierDetails(providerName) {
      const fallback = {
        materiaPrima: "Sin datos",
        precios: "-",
        condiciones: "-",
        logistica: "-",
        calidadProducto: "-",
        calidadNoConformidades: "-",
        medioAmbiente: "-",
        condicionesEspeciales: "-",
        total: "-",
        puntaje: "-",
        calificacionInicial: "-",
        calificacionFinal: "-",
        observaciones: "Proveedor sin evaluacion en el excel 2023."
      }

      this.selectedSupplier = providerName
      this.selectedEvaluation = this.getSupplierEvaluation(providerName) || fallback
      this.isSupplierModalOpen = true
    },
    scoreClass(value) {
      const numeric = Number(value)
      if (numeric === 1) return "score-1"
      if (numeric === 2) return "score-2"
      if (numeric === 3) return "score-3"
      return "score-na"
    },
    scoreMeaning(value, isInverse = false) {
      const numeric = Number(value)
      if (![1, 2, 3].includes(numeric)) {
        return "Sin referencia"
      }

      if (isInverse) {
        if (numeric === 1) return "Menor flexibilidad"
        if (numeric === 2) return "Flexibilidad media"
        return "Mayor flexibilidad"
      }

      if (numeric === 1) return "Bueno"
      if (numeric === 2) return "Regular"
      return "Mal"
    },
    closeSupplierDetails() {
      this.isSupplierModalOpen = false
    }
  },
  async mounted() {
    await this.loadSupplies()
    await this.loadSyncStatus()
    this.loadPersistedData()
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

.import-actions-secondary {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.file-group {
  display: grid;
  gap: 0.45rem;
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

.data-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.data-indicator {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #2e7d32;
  font-size: 0.9rem;
  font-weight: 500;
}

.data-indicator i {
  color: #4caf50;
}

button.secondary.small {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
}

.list-header input {
  max-width: 300px;
}

.quick-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-bottom: 0.6rem;
  color: #455a64;
  font-size: 0.9rem;
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

.code {
  font-family: monospace;
  font-weight: 600;
  color: #2c5aa0;
}

.quantity {
  text-align: center;
  font-weight: 600;
}

.quantity .low-stock {
  color: #d32f2f;
  background: #ffebee;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.quantity .stock-unknown {
  color: #9e9e9e;
  font-style: italic;
}

.details-btn {
  width: auto;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  background: #2c5aa0;
  color: #fff;
  font-size: 0.85rem;
}

.status-stack {
  display: grid;
  gap: 0.2rem;
}

.status-stack small {
  color: #51616f;
  font-weight: 600;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 50;
}

.modal-card {
  width: min(680px, 92vw);
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7rem;
}

.modal-content p {
  margin: 0.35rem 0;
  white-space: normal;
}

.legend-box {
  margin: 0.6rem 0;
  padding: 0.55rem;
  border-radius: 10px;
  background: #f3f6fb;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.legend-note {
  color: #5a6570;
  font-size: 0.84rem;
}

.evaluation-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
}

.evaluation-table th,
.evaluation-table td {
  border-bottom: 1px solid #e7e7e7;
  padding: 0.4rem;
  white-space: normal;
}

.evaluation-note {
  color: #455a64;
  font-size: 0.9rem;
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
  min-width: 1.5rem;
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

.close-btn {
  width: auto;
  padding: 0.3rem 0.6rem;
  background: #6c757d;
}
</style>
