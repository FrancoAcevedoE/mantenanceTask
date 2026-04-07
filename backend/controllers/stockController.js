import XLSX from "xlsx"
import mongoose from "mongoose"
import RawMaterial from "../models/rawMaterialModel.js"
import StockMovement from "../models/stockMovementModel.js"
import StockSyncState from "../models/stockSyncStateModel.js"
import StockPurchaseRecord from "../models/stockPurchaseRecordModel.js"
import User from "../models/userModels.js"
import { registerAuditEvent } from "../services/auditService.js"

const MAX_IMPORT_ROWS = 5000
const STOCK_SYNC_SCOPE = "raw-material"
const STOCK_PURCHASE_SYNC_SCOPE = "raw-material-purchases"

const FIELD_ALIASES = {
  name: [
    "nombre",
    "insumo",
    "material",
    "madera",
    "producto",
    "materia_prima_importada",
    "descripcion",
    "descripcion_material",
    "descripcion_del_producto",
    "detalle"
  ],
  materialType: [
    "tipo",
    "tipo_material",
    "familia",
    "categoria",
    "rubro"
  ],
  size: [
    "tamano",
    "tamano_medida",
    "tamaño",
    "medida",
    "dimension",
    "dimensiones",
    "medidas",
    "espesor_mm_",
    "espesor_mm"
  ],
  length: [
    "largo",
    "longitud",
    "length",
    "largo_m_",
    "largo_m"
  ],
  width: [
    "ancho",
    "width",
    "ancho_m_",
    "ancho_m"
  ],
  thickness: [
    "espesor",
    "grosor",
    "thickness",
    "espesor_mm_",
    "espesor_mm"
  ],
  dimensionUnit: [
    "unidad",
    "unidad_medida",
    "unidad_dimension"
  ],
  areaM2PerPlate: [
    "m2",
    "m2_por_placa",
    "metros2",
    "m2_placa",
    "m2_por_unidad",
    "superficie_m2",
    "m2_unitario",
    "m2_x_placa"
  ],
  platesPerPallet: [
    "placas_por_pallet",
    "cantidad_placas_por_pallet",
    "placas_pallet",
    "placas_x_pallet",
    "cant_placas_pallet",
    "cant_por_pallet",
    "hojas_x_pallet"
  ],
  stockPlates: [
    "stock_placas",
    "placas",
    "cantidad_placas",
    "stock_unidades",
    "stock",
    "cantidad",
    "cant_placas"
  ],
  stockPallets: [
    "stock_pallets",
    "pallets",
    "cantidad_pallets",
    "pallet",
    "cant_pallet"
  ],
  stockM2: [
    "stock_m2",
    "m2_stock",
    "metros2_stock",
    "m2_totales"
  ],
  notes: [
    "notas",
    "observaciones",
    "obs",
    "comentarios",
    "detalle"
  ],
  code: [
    "codigo",
    "cod",
    "id_producto"
  ],
  supplier: [
    "proveedor",
    "supplier"
  ],
  quality: [
    "calidad",
    "grade"
  ],
  ingress: [
    "ing_",
    "ing",
    "ingreso",
    "ingresos"
  ],
  balance: [
    "saldo",
    "balance"
  ]
}

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")

const normalizeHeader = (value = "") =>
  normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")

const HEADER_ALIAS_SET = new Set(
  Object.values(FIELD_ALIASES)
    .flat()
    .map(alias => normalizeHeader(alias))
)

const isEmptyLikeHeader = (header = "") => /^_?empty(?:_\d+)?$/.test(String(header || "").trim())

const detectHeaderRowIndex = (matrixRows = []) => {
  const maxScanRows = Math.min(40, matrixRows.length)

  let bestIndex = -1
  let bestScore = -1

  for (let rowIndex = 0; rowIndex < maxScanRows; rowIndex += 1) {
    const row = Array.isArray(matrixRows[rowIndex]) ? matrixRows[rowIndex] : []

    const normalizedHeaders = row
      .map(cell => normalizeHeader(cell))
      .filter(header => header && !isEmptyLikeHeader(header))

    const nonEmptyCount = normalizedHeaders.length
    const matchCount = normalizedHeaders.filter(header => HEADER_ALIAS_SET.has(header)).length
    const score = (matchCount * 10) + nonEmptyCount

    if (matchCount > 0 && nonEmptyCount >= 2 && score > bestScore) {
      bestIndex = rowIndex
      bestScore = score
    }
  }

  if (bestIndex >= 0) {
    return bestIndex
  }

  return 0
}

const normalizeSheetRows = (sheet) => {
  const matrixRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false
  })

  if (!matrixRows.length) {
    return {
      rows: [],
      detectedHeaders: [],
      headerRowIndex: 0
    }
  }

  const headerRowIndex = detectHeaderRowIndex(matrixRows)
  const headerRow = Array.isArray(matrixRows[headerRowIndex]) ? matrixRows[headerRowIndex] : []

  const duplicatedHeaderCounter = new Map()

  const headerKeys = headerRow.map((cell, columnIndex) => {
    const normalized = normalizeHeader(cell)

    if (!normalized || isEmptyLikeHeader(normalized)) {
      return null
    }

    if (normalized === "base_de_datos") {
      return null
    }

    const baseKey = normalized || `col_${columnIndex + 1}`
    const count = (duplicatedHeaderCounter.get(baseKey) || 0) + 1
    duplicatedHeaderCounter.set(baseKey, count)

    if (count === 1) {
      return baseKey
    }

    return `${baseKey}__${count}`
  })

  const rows = matrixRows
    .slice(headerRowIndex + 1)
    .map((row) => {
      const normalizedRow = {}

      for (let columnIndex = 0; columnIndex < headerKeys.length; columnIndex += 1) {
        const key = headerKeys[columnIndex]
        if (!key) {
          continue
        }

        normalizedRow[key] = row[columnIndex] ?? ""
      }

      return normalizedRow
    })
    .filter(row => Object.values(row).some(value => String(value || "").trim() !== ""))

  const detectedHeaders = headerKeys.filter(Boolean)

  return {
    rows,
    detectedHeaders,
    headerRowIndex
  }
}

const parseNonNegativeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback
  }

  const normalizedRaw = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^0-9,.-]/g, "")

  let normalized = normalizedRaw

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".")
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".")
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return NaN
  }

  return parsed
}

const pickValue = (row, candidates = []) => {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key]
    }

    const prefixedKey = `${key}__`
    const duplicatedMatch = Object.keys(row).find(currentKey => currentKey.startsWith(prefixedKey) && String(row[currentKey] || "").trim() !== "")

    if (duplicatedMatch) {
      return row[duplicatedMatch]
    }
  }
  return ""
}

const collectValues = (row, candidates = []) => {
  const values = []

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key) && String(row[key] || "").trim() !== "") {
      values.push(row[key])
    }

    const prefixedKey = `${key}__`
    for (const currentKey of Object.keys(row)) {
      if (currentKey.startsWith(prefixedKey) && String(row[currentKey] || "").trim() !== "") {
        values.push(row[currentKey])
      }
    }
  }

  return values
}

const sumValuesByCandidates = (row, candidates = []) => {
  const values = collectValues(row, candidates)
  let total = 0

  for (const value of values) {
    const parsed = parseNonNegativeNumber(value, NaN)
    if (Number.isFinite(parsed)) {
      total += parsed
    }
  }

  return total
}

const getFieldValue = (row, fieldName) => {
  const aliases = FIELD_ALIASES[fieldName] || []
  return pickValue(row, aliases)
}

const buildSizeFromDimensions = (row) => {
  const existingSize = normalizeText(getFieldValue(row, "size"))
  if (existingSize) {
    return existingSize
  }

  const lengthRaw = parseNonNegativeNumber(getFieldValue(row, "length"), NaN)
  const widthRaw = parseNonNegativeNumber(getFieldValue(row, "width"), NaN)
  const thicknessRaw = parseNonNegativeNumber(getFieldValue(row, "thickness"), NaN)
  const unit = normalizeText(getFieldValue(row, "dimensionUnit") || "mm").toLowerCase()

  const parts = []
  if (Number.isFinite(lengthRaw) && lengthRaw > 0) parts.push(lengthRaw)
  if (Number.isFinite(widthRaw) && widthRaw > 0) parts.push(widthRaw)
  if (Number.isFinite(thicknessRaw) && thicknessRaw > 0) parts.push(thicknessRaw)

  if (!parts.length) {
    return ""
  }

  return `${parts.join("x")} ${unit}`
}

const inferAreaM2PerPlate = (row) => {
  const explicitArea = parseNonNegativeNumber(getFieldValue(row, "areaM2PerPlate"), NaN)
  if (Number.isFinite(explicitArea)) {
    return explicitArea
  }

  const lengthRaw = parseNonNegativeNumber(getFieldValue(row, "length"), NaN)
  const widthRaw = parseNonNegativeNumber(getFieldValue(row, "width"), NaN)

  if (!Number.isFinite(lengthRaw) || !Number.isFinite(widthRaw) || lengthRaw <= 0 || widthRaw <= 0) {
    return 0
  }

  const unit = normalizeText(getFieldValue(row, "dimensionUnit") || "mm").toLowerCase()

  if (unit === "m" || unit === "metro" || unit === "metros") {
    return lengthRaw * widthRaw
  }

  if (unit === "cm" || unit === "centimetro" || unit === "centimetros") {
    return (lengthRaw * widthRaw) / 10000
  }

  return (lengthRaw * widthRaw) / 1000000
}

const toResponseItem = (item) => {
  const stockPlates = Number(item.stockPlates || 0)
  const platesPerPallet = Number(item.platesPerPallet || 1)
  const areaM2PerPlate = Number(item.areaM2PerPlate || 0)

  return {
    _id: item._id,
    name: item.name,
    materialType: item.materialType,
    size: item.size,
    areaM2PerPlate,
    platesPerPallet,
    stockPlates,
    stockPalletsEquivalent: Math.round((stockPlates / Math.max(platesPerPallet, 1)) * 100) / 100,
    stockTotalM2: Math.round(stockPlates * areaM2PerPlate * 100) / 100,
    notes: item.notes || "",
    isDeleted: Boolean(item.isDeleted),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

const getActorInfo = async (req) => {
  const actorId = String(req.user?.id || "").trim()
  const actorRole = String(req.user?.role || "").trim()

  if (!actorId) {
    return {
      userId: "",
      name: "",
      role: actorRole
    }
  }

  const actor = await User.findById(actorId).select("name role").lean()

  return {
    userId: actorId,
    name: String(actor?.name || "").trim(),
    role: String(actor?.role || actorRole || "").trim()
  }
}

const normalizeImportMode = (rawMode = "") => {
  const mode = String(rawMode || "").trim().toLowerCase()
  if (mode === "accumulate") {
    return "accumulate"
  }
  return "overwrite"
}

const buildSyncPayload = (state) => ({
  lastImportAt: state?.lastImportAt || null,
  lastFileName: String(state?.lastFileName || ""),
  lastMode: String(state?.lastMode || "overwrite"),
  lastSummary: state?.lastSummary || {}
})

export const getStockSyncStatusController = async (req, res) => {
  try {
    const state = await StockSyncState.findOne({ scope: STOCK_SYNC_SCOPE }).lean()

    res.json({
      ok: true,
      sync: buildSyncPayload(state)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener estado de sincronizacion"
    })
  }
}

export const listRawMaterialsController = async (req, res) => {
  try {
    const includeDeleted = String(req.query.includeDeleted || "").trim().toLowerCase() === "true"
    const canIncludeDeleted = includeDeleted && req.user?.role === "admin"
    const query = canIncludeDeleted ? {} : { isDeleted: { $ne: true } }

    const items = await RawMaterial.find(query)
      .sort({ materialType: 1, name: 1, size: 1 })
      .lean()

    res.json(items.map(toResponseItem))
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener insumos"
    })
  }
}

export const createRawMaterialController = async (req, res) => {
  try {
    const name = normalizeText(req.body?.name)
    const materialType = normalizeText(req.body?.materialType || "madera").toLowerCase()
    const size = normalizeText(req.body?.size)
    const notes = normalizeText(req.body?.notes)

    if (!name) {
      return res.status(400).json({
        message: "El nombre del insumo es obligatorio"
      })
    }

    const areaM2PerPlate = parseNonNegativeNumber(req.body?.areaM2PerPlate, 0)
    const platesPerPallet = parseNonNegativeNumber(req.body?.platesPerPallet, 1)
    const stockPlates = parseNonNegativeNumber(req.body?.stockPlates, 0)

    if ([areaM2PerPlate, platesPerPallet, stockPlates].some(Number.isNaN) || platesPerPallet <= 0) {
      return res.status(400).json({
        message: "Revisa m2, placas por pallet y stock"
      })
    }

    const alreadyExists = await RawMaterial.findOne({
      name,
      materialType,
      size,
      isDeleted: { $ne: true }
    })

    if (alreadyExists) {
      return res.status(409).json({
        message: "Ya existe un insumo con ese nombre y tamaño"
      })
    }

    const item = await RawMaterial.create({
      name,
      materialType,
      size,
      areaM2PerPlate,
      platesPerPallet,
      stockPlates,
      notes
    })

    await registerAuditEvent({
      req,
      action: "STOCK_ITEM_CREATED",
      entityType: "raw-material",
      entityId: item._id,
      description: `Se creo insumo ${item.name}`,
      metadata: {
        item: {
          id: String(item._id),
          name: item.name,
          size: item.size,
          stockPlates: item.stockPlates
        }
      }
    })

    res.status(201).json({
      message: "Insumo creado",
      item: toResponseItem(item)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al crear insumo"
    })
  }
}

export const updateRawMaterialController = async (req, res) => {
  try {
    const { id } = req.params
    const item = await RawMaterial.findOne({ _id: id, isDeleted: { $ne: true } })

    if (!item) {
      return res.status(404).json({
        message: "Insumo no encontrado"
      })
    }

    if (req.body?.name !== undefined) {
      const nextName = normalizeText(req.body.name)
      if (!nextName) {
        return res.status(400).json({ message: "El nombre no puede estar vacio" })
      }
      item.name = nextName
    }

    if (req.body?.materialType !== undefined) {
      item.materialType = normalizeText(req.body.materialType || "madera").toLowerCase()
    }

    if (req.body?.size !== undefined) {
      item.size = normalizeText(req.body.size)
    }

    if (req.body?.notes !== undefined) {
      item.notes = normalizeText(req.body.notes)
    }

    if (req.body?.areaM2PerPlate !== undefined) {
      const parsedArea = parseNonNegativeNumber(req.body.areaM2PerPlate, 0)
      if (Number.isNaN(parsedArea)) {
        return res.status(400).json({ message: "m2 por placa invalido" })
      }
      item.areaM2PerPlate = parsedArea
    }

    if (req.body?.platesPerPallet !== undefined) {
      const parsedPlatesPerPallet = parseNonNegativeNumber(req.body.platesPerPallet, 1)
      if (Number.isNaN(parsedPlatesPerPallet) || parsedPlatesPerPallet <= 0) {
        return res.status(400).json({ message: "Placas por pallet invalido" })
      }
      item.platesPerPallet = parsedPlatesPerPallet
    }

    if (req.body?.stockPlates !== undefined) {
      const parsedStockPlates = parseNonNegativeNumber(req.body.stockPlates, 0)
      if (Number.isNaN(parsedStockPlates)) {
        return res.status(400).json({ message: "Stock en placas invalido" })
      }
      item.stockPlates = parsedStockPlates
    }

    item.updatedAt = new Date()
    await item.save()

    await registerAuditEvent({
      req,
      action: "STOCK_ITEM_UPDATED",
      entityType: "raw-material",
      entityId: item._id,
      description: `Se actualizo insumo ${item.name}`,
      metadata: {
        item: {
          id: String(item._id),
          name: item.name,
          size: item.size
        }
      }
    })

    res.json({
      message: "Insumo actualizado",
      item: toResponseItem(item)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar insumo"
    })
  }
}

export const listStockMovementsController = async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit || "80"), 10) || 80))

    const movements = await StockMovement.find()
      .populate("itemId", "name materialType size platesPerPallet areaM2PerPlate")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    res.json({
      ok: true,
      items: movements.map(item => ({
        _id: item._id,
        movementType: item.movementType,
        pallets: item.pallets,
        plates: item.plates,
        deltaPlates: item.deltaPlates,
        stockAfterPlates: item.stockAfterPlates,
        reason: item.reason || "",
        performedBy: item.performedBy || {},
        createdAt: item.createdAt,
        item: item.itemId
          ? {
              _id: item.itemId._id,
              name: item.itemId.name,
              materialType: item.itemId.materialType,
              size: item.itemId.size,
              platesPerPallet: item.itemId.platesPerPallet,
              areaM2PerPlate: item.itemId.areaM2PerPlate
            }
          : null
      }))
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener movimientos"
    })
  }
}

export const registerStockMovementController = async (req, res) => {
  try {
    const itemId = String(req.body?.itemId || "").trim()
    const movementType = String(req.body?.movementType || "").trim().toLowerCase()

    if (!itemId) {
      return res.status(400).json({
        message: "Debes seleccionar un insumo"
      })
    }

    if (!["in", "out"].includes(movementType)) {
      return res.status(400).json({
        message: "Tipo de movimiento invalido"
      })
    }

    const pallets = parseNonNegativeNumber(req.body?.pallets, 0)
    const plates = parseNonNegativeNumber(req.body?.plates, 0)
    const reason = normalizeText(req.body?.reason)

    if (Number.isNaN(pallets) || Number.isNaN(plates)) {
      return res.status(400).json({
        message: "Pallets y placas deben ser numeros no negativos"
      })
    }

    if (pallets <= 0 && plates <= 0) {
      return res.status(400).json({
        message: "Debes indicar pallets o placas"
      })
    }

    const item = await RawMaterial.findOne({ _id: itemId, isDeleted: { $ne: true } })

    if (!item) {
      return res.status(404).json({
        message: "Insumo no encontrado"
      })
    }

    const platesFromPallets = pallets * Math.max(1, Number(item.platesPerPallet || 1))
    const totalPlates = platesFromPallets + plates
    const signedDelta = movementType === "in" ? totalPlates : -totalPlates
    const nextStockPlates = Number(item.stockPlates || 0) + signedDelta

    if (nextStockPlates < 0) {
      return res.status(400).json({
        message: "No hay stock suficiente para descargar"
      })
    }

    item.stockPlates = nextStockPlates
    item.updatedAt = new Date()
    await item.save()

    const actor = await getActorInfo(req)

    const movement = await StockMovement.create({
      itemId: item._id,
      movementType,
      pallets,
      plates,
      deltaPlates: signedDelta,
      stockAfterPlates: nextStockPlates,
      reason,
      performedBy: actor
    })

    await registerAuditEvent({
      req,
      action: movementType === "in" ? "STOCK_IN" : "STOCK_OUT",
      entityType: "raw-material",
      entityId: item._id,
      description: `${movementType === "in" ? "Carga" : "Descarga"} de stock para ${item.name}`,
      metadata: {
        movement: {
          id: String(movement._id),
          movementType,
          pallets,
          plates,
          deltaPlates: signedDelta,
          stockAfterPlates: nextStockPlates
        },
        item: {
          id: String(item._id),
          name: item.name,
          size: item.size
        }
      }
    })

    res.status(201).json({
      message: "Movimiento registrado",
      item: toResponseItem(item)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar movimiento"
    })
  }
}

export const importRawMaterialsExcelController = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        message: "Debes adjuntar un archivo Excel"
      })
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return res.status(400).json({
        message: "El archivo no contiene hojas"
      })
    }

    const sheet = workbook.Sheets[firstSheetName]
    const { rows, detectedHeaders, headerRowIndex } = normalizeSheetRows(sheet)

    if (!rows.length) {
      return res.status(400).json({
        message: "El archivo no contiene filas de datos"
      })
    }

    const limitedRows = rows.slice(0, MAX_IMPORT_ROWS)
    const importMode = normalizeImportMode(req.body?.mode)

    let created = 0
    let updated = 0
    let skipped = 0
    const rowErrors = []
    const report = []

    for (let rowIndex = 0; rowIndex < limitedRows.length; rowIndex += 1) {
      const row = limitedRows[rowIndex]

      try {
        const name = normalizeText(getFieldValue(row, "name"))
        const materialType = normalizeText(getFieldValue(row, "materialType")) || "madera"
        const size = buildSizeFromDimensions(row)

        if (!name) {
          skipped += 1
          continue
        }

        const areaM2PerPlate = inferAreaM2PerPlate(row)
        const platesPerPallet = parseNonNegativeNumber(getFieldValue(row, "platesPerPallet"), 1)
        const stockPlatesDirect = parseNonNegativeNumber(getFieldValue(row, "stockPlates"), NaN)
        const stockPallets = parseNonNegativeNumber(getFieldValue(row, "stockPallets"), 0)
        const stockM2 = parseNonNegativeNumber(getFieldValue(row, "stockM2"), NaN)
        const notes = normalizeText(getFieldValue(row, "notes"))

        if (Number.isNaN(areaM2PerPlate) || Number.isNaN(platesPerPallet) || Number.isNaN(stockPallets)) {
          skipped += 1
          continue
        }

        const normalizedPlatesPerPallet = Math.max(1, Number(platesPerPallet || 1))
        let stockPlates = 0

        if (Number.isFinite(stockPlatesDirect)) {
          stockPlates = Number(stockPlatesDirect)
        } else if (Number.isFinite(stockM2) && stockM2 > 0 && areaM2PerPlate > 0) {
          stockPlates = stockM2 / areaM2PerPlate
        } else {
          stockPlates = stockPallets * normalizedPlatesPerPallet
        }

        stockPlates = Math.max(0, Math.round(stockPlates * 100) / 100)

        const query = {
          name,
          materialType: materialType.toLowerCase(),
          size
        }

        const existing = await RawMaterial.findOne(query)

        if (!existing) {
          const nextStockPlates = Number(stockPlates || 0)

          await RawMaterial.create({
            ...query,
            areaM2PerPlate: Number(areaM2PerPlate || 0),
            platesPerPallet: normalizedPlatesPerPallet,
            stockPlates: nextStockPlates,
            notes
          })

          report.push({
            rowNumber: headerRowIndex + 2 + rowIndex,
            key: `${name} | ${size || "sin tamaño"}`,
            action: "created",
            mode: importMode,
            beforeStockPlates: 0,
            importedStockPlates: nextStockPlates,
            afterStockPlates: nextStockPlates
          })

          created += 1
        } else {
          const previousStockPlates = Number(existing.stockPlates || 0)
          const importedStockPlates = Number(stockPlates || 0)
          const nextStockPlates = importMode === "accumulate"
            ? previousStockPlates + importedStockPlates
            : importedStockPlates

          existing.isDeleted = false
          existing.deletedAt = null
          existing.deletedBy = ""
          existing.areaM2PerPlate = Number(areaM2PerPlate || 0)
          existing.platesPerPallet = normalizedPlatesPerPallet
          existing.stockPlates = Math.max(0, Math.round(nextStockPlates * 100) / 100)
          existing.notes = notes || existing.notes
          existing.updatedAt = new Date()
          await existing.save()

          report.push({
            rowNumber: headerRowIndex + 2 + rowIndex,
            key: `${name} | ${size || "sin tamaño"}`,
            action: "updated",
            mode: importMode,
            beforeStockPlates: previousStockPlates,
            importedStockPlates,
            afterStockPlates: existing.stockPlates
          })

          updated += 1
        }
      } catch (rowError) {
        skipped += 1

        if (rowErrors.length < 10) {
          rowErrors.push({
            rowNumber: headerRowIndex + 2 + rowIndex,
            message: rowError?.message || "Error desconocido en fila"
          })
        }
      }
    }

    await registerAuditEvent({
      req,
      action: "STOCK_IMPORT_EXCEL",
      entityType: "raw-material",
      entityId: "bulk-import",
      description: "Se importo stock desde archivo Excel",
      metadata: {
        summary: {
          mode: importMode,
          created,
          updated,
          skipped,
          totalRows: limitedRows.length,
          headerRowNumber: headerRowIndex + 1
        },
        sourceFile: req.file.originalname,
        detectedHeaders,
        rowErrors
      }
    })

    const summary = {
      mode: importMode,
      created,
      updated,
      skipped,
      totalRows: limitedRows.length,
      headerRowNumber: headerRowIndex + 1,
      detectedHeaders,
      rowErrors
    }

    const syncState = await StockSyncState.findOneAndUpdate(
      { scope: STOCK_SYNC_SCOPE },
      {
        $set: {
          scope: STOCK_SYNC_SCOPE,
          lastImportAt: new Date(),
          lastFileName: req.file.originalname,
          lastMode: importMode,
          lastSummary: summary,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({
      ok: true,
      message: "Importacion completada",
      summary,
      report,
      sync: buildSyncPayload(syncState)
    })
  } catch (error) {
    console.error("Error importando stock desde Excel", {
      message: error?.message,
      stack: error?.stack
    })

    res.status(500).json({
      message: "Error al importar archivo de stock",
      detail: error?.message || "Error desconocido"
    })
  }
}

export const exportRawMaterialsExcelController = async (req, res) => {
  try {
    const includeDeleted = String(req.query.includeDeleted || "").trim().toLowerCase() === "true"
    const canIncludeDeleted = includeDeleted && req.user?.role === "admin"
    const query = canIncludeDeleted ? {} : { isDeleted: { $ne: true } }

    const [items, movements] = await Promise.all([
      RawMaterial.find(query).sort({ materialType: 1, name: 1, size: 1 }).lean(),
      StockMovement.find()
        .populate("itemId", "name materialType size")
        .sort({ createdAt: -1 })
        .limit(3000)
        .lean()
    ])

    const workbook = XLSX.utils.book_new()

    const suppliesRows = items.map((item) => {
      const parsed = toResponseItem(item)
      return {
        nombre: parsed.name,
        tipo: parsed.materialType,
        tamano: parsed.size,
        m2_por_placa: parsed.areaM2PerPlate,
        placas_por_pallet: parsed.platesPerPallet,
        stock_placas: parsed.stockPlates,
        stock_pallets_equivalente: parsed.stockPalletsEquivalent,
        stock_total_m2: parsed.stockTotalM2,
        notas: parsed.notes,
        eliminado: parsed.isDeleted ? "si" : "no"
      }
    })

    const movementRows = movements.map((movement) => ({
      fecha: movement.createdAt ? new Date(movement.createdAt).toISOString() : "",
      insumo: movement.itemId?.name || "",
      tipo: movement.itemId?.materialType || "",
      tamano: movement.itemId?.size || "",
      movimiento: movement.movementType,
      pallets: movement.pallets,
      placas: movement.plates,
      delta_placas: movement.deltaPlates,
      stock_resultante_placas: movement.stockAfterPlates,
      motivo: movement.reason || "",
      usuario: movement.performedBy?.name || "",
      rol: movement.performedBy?.role || ""
    }))

    const suppliesSheet = XLSX.utils.json_to_sheet(suppliesRows)
    const movementsSheet = XLSX.utils.json_to_sheet(movementRows)

    XLSX.utils.book_append_sheet(workbook, suppliesSheet, "Insumos")
    XLSX.utils.book_append_sheet(workbook, movementsSheet, "Movimientos")

    const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=stock-materia-prima-${timestamp}.xlsx`)
    res.status(200).send(fileBuffer)
  } catch (error) {
    res.status(500).json({
      message: "Error al exportar stock"
    })
  }
}

const toPurchaseResponse = (item) => ({
  _id: item._id,
  batchId: item.batchId,
  sourceFileName: item.sourceFileName,
  importMode: item.importMode,
  applyStock: Boolean(item.applyStock),
  rowNumber: item.rowNumber,
  code: item.code,
  supplier: item.supplier,
  product: item.product,
  quality: item.quality,
  size: item.size,
  thicknessMm: Number(item.thicknessMm || 0),
  widthM: Number(item.widthM || 0),
  lengthM: Number(item.lengthM || 0),
  m2PerPlate: Number(item.m2PerPlate || 0),
  platesPerPallet: Number(item.platesPerPallet || 1),
  palletCount: Number(item.palletCount || 0),
  platesCount: Number(item.platesCount || 0),
  totalM2: Number(item.totalM2 || 0),
  rawMaterialId: item.rawMaterialId || null,
  stockBeforePlates: Number(item.stockBeforePlates || 0),
  stockAfterPlates: Number(item.stockAfterPlates || 0),
  createdAt: item.createdAt
})

export const getPurchasesSyncStatusController = async (req, res) => {
  try {
    const state = await StockSyncState.findOne({ scope: STOCK_PURCHASE_SYNC_SCOPE }).lean()

    res.json({
      ok: true,
      sync: buildSyncPayload(state)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener estado de sincronizacion de compras"
    })
  }
}

export const listPurchaseRecordsController = async (req, res) => {
  try {
    const limit = Math.min(1000, Math.max(1, Number.parseInt(String(req.query.limit || "300"), 10) || 300))
    const month = normalizeText(req.query.month || "")
    const query = {}

    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      const start = new Date(`${month}-01T00:00:00.000Z`)
      const end = new Date(start)
      end.setUTCMonth(end.getUTCMonth() + 1)

      query.createdAt = {
        $gte: start,
        $lt: end
      }
    }

    const items = await StockPurchaseRecord.find(query)
      .sort({ createdAt: -1, rowNumber: -1 })
      .limit(limit)
      .lean()

    res.json({
      ok: true,
      items: items.map(toPurchaseResponse)
    })
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener compras importadas"
    })
  }
}

export const importPurchasesExcelController = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        message: "Debes adjuntar un archivo Excel"
      })
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return res.status(400).json({
        message: "El archivo no contiene hojas"
      })
    }

    const sheet = workbook.Sheets[firstSheetName]
    const { rows, detectedHeaders, headerRowIndex } = normalizeSheetRows(sheet)

    if (!rows.length) {
      return res.status(400).json({
        message: "El archivo no contiene filas de datos"
      })
    }

    const limitedRows = rows.slice(0, MAX_IMPORT_ROWS)
    const importMode = normalizeImportMode(req.body?.mode || "accumulate")
    const applyStock = String(req.body?.applyStock ?? "true").trim().toLowerCase() !== "false"

    const actor = await getActorInfo(req)
    const batchId = String(new mongoose.Types.ObjectId())

    let created = 0
    let updated = 0
    let skipped = 0
    const rowErrors = []
    const report = []

    for (let rowIndex = 0; rowIndex < limitedRows.length; rowIndex += 1) {
      const row = limitedRows[rowIndex]

      try {
        const code = normalizeText(getFieldValue(row, "code"))
        const supplier = normalizeText(getFieldValue(row, "supplier"))
        const product = normalizeText(getFieldValue(row, "name"))
        const quality = normalizeText(getFieldValue(row, "quality"))

        if (!product) {
          skipped += 1
          continue
        }

        const size = buildSizeFromDimensions(row)
        const thicknessMm = parseNonNegativeNumber(getFieldValue(row, "thickness"), 0)
        const widthM = parseNonNegativeNumber(getFieldValue(row, "width"), 0)
        const lengthM = parseNonNegativeNumber(getFieldValue(row, "length"), 0)
        const m2PerPlate = inferAreaM2PerPlate(row)
        const platesPerPallet = Math.max(1, parseNonNegativeNumber(getFieldValue(row, "platesPerPallet"), 1))
        const palletCount = parseNonNegativeNumber(getFieldValue(row, "stockPallets"), 0)
        const directPlates = parseNonNegativeNumber(getFieldValue(row, "stockPlates"), NaN)
        const ingressTotal = sumValuesByCandidates(row, FIELD_ALIASES.ingress)
        const balanceTotal = sumValuesByCandidates(row, FIELD_ALIASES.balance)
        const m2Totals = parseNonNegativeNumber(getFieldValue(row, "stockM2"), NaN)

        if ([thicknessMm, widthM, lengthM, m2PerPlate, platesPerPallet, palletCount].some(Number.isNaN)) {
          skipped += 1
          continue
        }

        let platesCount = 0

        if (Number.isFinite(ingressTotal) && ingressTotal > 0) {
          platesCount = ingressTotal
        } else if (Number.isFinite(directPlates)) {
          platesCount = directPlates
        } else if (Number.isFinite(balanceTotal) && balanceTotal > 0) {
          platesCount = balanceTotal
        } else if (Number.isFinite(m2Totals) && m2Totals > 0 && m2PerPlate > 0) {
          platesCount = m2Totals / m2PerPlate
        } else {
          platesCount = palletCount * platesPerPallet
        }

        platesCount = Math.max(0, Math.round(platesCount * 100) / 100)
        const totalM2 = Number.isFinite(m2Totals)
          ? m2Totals
          : Math.round(platesCount * m2PerPlate * 100) / 100

        const itemQuery = {
          name: product,
          materialType: "madera",
          size
        }

        let item = await RawMaterial.findOne(itemQuery)
        const beforeStockPlates = Number(item?.stockPlates || 0)
        let afterStockPlates = beforeStockPlates
        let action = "updated"

        if (!item) {
          item = new RawMaterial({
            ...itemQuery,
            areaM2PerPlate: Number(m2PerPlate || 0),
            platesPerPallet,
            stockPlates: 0,
            notes: quality || ""
          })
          action = "created"
          created += 1
        } else {
          updated += 1
        }

        item.isDeleted = false
        item.deletedAt = null
        item.deletedBy = ""
        item.areaM2PerPlate = Number(m2PerPlate || item.areaM2PerPlate || 0)
        item.platesPerPallet = platesPerPallet

        if (applyStock) {
          afterStockPlates = importMode === "accumulate"
            ? beforeStockPlates + platesCount
            : platesCount
          item.stockPlates = Math.max(0, Math.round(afterStockPlates * 100) / 100)
        }

        item.updatedAt = new Date()
        await item.save()

        if (applyStock && importMode === "accumulate" && platesCount > 0) {
          const platesFromPallets = Math.min(platesCount, palletCount * platesPerPallet)
          const extraPlates = Math.max(0, platesCount - platesFromPallets)

          await StockMovement.create({
            itemId: item._id,
            movementType: "in",
            pallets: palletCount,
            plates: extraPlates,
            deltaPlates: platesCount,
            stockAfterPlates: item.stockPlates,
            reason: `Importacion compras: ${req.file.originalname}`,
            performedBy: actor
          })
        }

        await StockPurchaseRecord.create({
          batchId,
          sourceFileName: req.file.originalname,
          importMode,
          applyStock,
          rowNumber: headerRowIndex + 2 + rowIndex,
          code,
          supplier,
          product,
          quality,
          size,
          thicknessMm: Number(thicknessMm || 0),
          widthM: Number(widthM || 0),
          lengthM: Number(lengthM || 0),
          m2PerPlate: Number(m2PerPlate || 0),
          platesPerPallet,
          palletCount: Number(palletCount || 0),
          platesCount,
          totalM2,
          rawMaterialId: item._id,
          stockBeforePlates: beforeStockPlates,
          stockAfterPlates: item.stockPlates
        })

        report.push({
          rowNumber: headerRowIndex + 2 + rowIndex,
          key: `${product} | ${size || "sin tamaño"}`,
          supplier,
          code,
          action,
          mode: importMode,
          applyStock,
          beforeStockPlates,
          importedStockPlates: platesCount,
          afterStockPlates: item.stockPlates,
          totalM2
        })
      } catch (rowError) {
        skipped += 1

        if (rowErrors.length < 10) {
          rowErrors.push({
            rowNumber: headerRowIndex + 2 + rowIndex,
            message: rowError?.message || "Error desconocido en fila"
          })
        }
      }
    }

    const summary = {
      mode: importMode,
      applyStock,
      created,
      updated,
      skipped,
      totalRows: limitedRows.length,
      headerRowNumber: headerRowIndex + 1,
      detectedHeaders,
      rowErrors,
      batchId
    }

    await registerAuditEvent({
      req,
      action: "STOCK_PURCHASES_IMPORT_EXCEL",
      entityType: "raw-material-purchases",
      entityId: batchId,
      description: "Se importo planilla de compras mensuales",
      metadata: {
        summary,
        sourceFile: req.file.originalname
      }
    })

    const syncState = await StockSyncState.findOneAndUpdate(
      { scope: STOCK_PURCHASE_SYNC_SCOPE },
      {
        $set: {
          scope: STOCK_PURCHASE_SYNC_SCOPE,
          lastImportAt: new Date(),
          lastFileName: req.file.originalname,
          lastMode: importMode,
          lastSummary: summary,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({
      ok: true,
      message: "Importacion de compras completada",
      summary,
      report,
      sync: buildSyncPayload(syncState)
    })
  } catch (error) {
    console.error("Error importando compras desde Excel", {
      message: error?.message,
      stack: error?.stack
    })

    res.status(500).json({
      message: "Error al importar compras",
      detail: error?.message || "Error desconocido"
    })
  }
}

export const exportPurchaseRecordsExcelController = async (req, res) => {
  try {
    const items = await StockPurchaseRecord.find()
      .sort({ createdAt: -1, rowNumber: -1 })
      .limit(5000)
      .lean()

    const rows = items.map(item => ({
      fecha: item.createdAt ? new Date(item.createdAt).toISOString() : "",
      lote: item.batchId,
      archivo: item.sourceFileName,
      modo: item.importMode,
      aplica_stock: item.applyStock ? "si" : "no",
      fila: item.rowNumber,
      codigo: item.code,
      proveedor: item.supplier,
      producto: item.product,
      calidad: item.quality,
      tamano: item.size,
      espesor_mm: item.thicknessMm,
      ancho_m: item.widthM,
      largo_m: item.lengthM,
      m2_x_placa: item.m2PerPlate,
      hojas_x_pallet: item.platesPerPallet,
      cant_pallet: item.palletCount,
      cant_placas: item.platesCount,
      m2_totales: item.totalM2,
      stock_antes: item.stockBeforePlates,
      stock_despues: item.stockAfterPlates
    }))

    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, sheet, "Compras")

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=compras-mensuales-${timestamp}.xlsx`)
    res.status(200).send(buffer)
  } catch (error) {
    res.status(500).json({
      message: "Error al exportar compras"
    })
  }
}
