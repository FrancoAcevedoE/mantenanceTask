import Maintenance from "../models/mantenanceModels.js"
import Machine from "../models/machineModels.js"
import NotificationLog from "../models/notificationLogModel.js"
import { sendPushNotificationToAllUsers } from "./pushService.js"
import Activity from "../models/activityModel.js"
import MateriaPrima from "../models/materiaPrimaModel.js"

const WEBHOOK_URL = String(process.env.NOTIFICATION_WEBHOOK_URL || "").trim()
const NOTIFICATION_ITEM_LIMIT = 8

const getCurrentStoppedMachines = async () => {
  const allMachines = await Machine.find({ isDeleted: { $ne: true } }).select("name").lean()

  if (!allMachines.length) {
    return 0
  }

  const latestMachineStatusRaw = await Maintenance.aggregate([
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$machine",
        status: { $first: "$status" }
      }
    }
  ])

  const latestStatusMap = new Map(
    latestMachineStatusRaw.map(item => [String(item._id || "").trim(), item.status])
  )

  let stoppedCount = 0

  for (const machine of allMachines) {
    const machineName = String(machine.name || "").trim()
    const status = latestStatusMap.get(machineName)
      || latestStatusMap.get(String(machine._id))
      || "ok"

    if (status === "stopped") {
      stoppedCount += 1
    }
  }

  return stoppedCount
}

const getStoppedMachinesDetail = async () => {
  const allMachines = await Machine.find({
    isDeleted: { $ne: true }
  })
    .select("name sector")
    .lean()

  if (!allMachines.length) {
    return []
  }

  const latestMachineStatusRaw = await Maintenance.aggregate([
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$machine",
        status: { $first: "$status" },
        sector: { $first: "$sector" },
        createdAt: { $first: "$createdAt" },
        unfinishedReason: { $first: "$unfinishedReason" }
      }
    },
    {
      $match: {
        status: "stopped"
      }
    }
  ])

  console.log("latestMachineStatusRaw:")
  console.log(JSON.stringify(latestMachineStatusRaw, null, 2))

  const latestStatusMap = new Map(
    latestMachineStatusRaw.map(item => [
      String(item._id || "").trim(),
      item
    ])
  )

  console.log("latestStatusMap keys:")
  console.log([...latestStatusMap.keys()])

  console.log("allMachines:")
  console.log(allMachines.map(m => m.name))

  return allMachines
    .map(machine => {
      const machineName = String(machine.name || "").trim()
      const latestStatus = latestStatusMap.get(machineName)
        || latestStatusMap.get(String(machine._id))

      if (!latestStatus) {
        return null
      }

      return {
        id: `stopped-${machineName}`,
        type: "stopped-machine",
        title: `Maquina detenida: ${machineName}`,
        message: latestStatus.unfinishedReason
          ? `Motivo: ${latestStatus.unfinishedReason}`
          : "La maquina sigue en estado detenido.",
        machine: machineName,
        sector: String(
          latestStatus.sector || machine.sector || ""
        ).trim(),
        createdAt: latestStatus.createdAt,
        severity: "error"
      }
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        new Date(right.createdAt) - new Date(left.createdAt)
    )
}

const getPendingMaintenancesDetail = async () => {
  const pendingMaintenances = await Maintenance.aggregate([
    {
      $match: {
        status: "pending"
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $group: {
        _id: "$machine",
        machine: { $first: "$machine" },
        sector: { $first: "$sector" },
        unfinishedReason: { $first: "$unfinishedReason" },
        createdAt: { $first: "$createdAt" },
        priority: { $first: "$priority" }
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    }
  ])

  const isObjId = (val) => /^[a-f\d]{24}$/i.test(String(val || ""))
  const pendingOldIds = [...new Set(pendingMaintenances.map(i => i.machine).filter(isObjId))]
  const pendingIdToName = new Map()
  if (pendingOldIds.length) {
    const machines = await Machine.find({ _id: { $in: pendingOldIds } }).select("name").lean()
    machines.forEach(m => pendingIdToName.set(String(m._id), m.name))
  }

  return pendingMaintenances.map(item => {
    const rawMachine = String(item.machine || "").trim()
    const resolvedMachine = isObjId(rawMachine)
      ? (pendingIdToName.get(rawMachine) || "(Máquina eliminada)")
      : rawMachine

    return ({
    id: `pending-${String(item._id)}`,
    type: "pending-maintenance",
    title: `Trabajo pendiente: ${resolvedMachine || "Sin maquina"}`,
    message: item.unfinishedReason
      ? `Motivo: ${item.unfinishedReason}`
      : "Hay un mantenimiento pendiente de cierre.",
    machine: resolvedMachine,
    sector: String(item.sector || "").trim(),
    createdAt: item.createdAt,
    severity: item.priority === "alta" ? "error" : "warning"
  })
  })
}

const formatShortDate = (value) => {
  if (!value) return ""
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit"
  })
}

const getLastWeekRange = () => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const lastMonday = new Date(now)
  lastMonday.setDate(now.getDate() - daysSinceMonday - 7)
  lastMonday.setHours(0, 0, 0, 0)

  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  return { start: lastMonday, end: lastSunday }
}

const formatWeekRangeLabel = (start, end) => {
  const formatDate = (date) => new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit"
  })
  return `${formatDate(start)} - ${formatDate(end)}`
}

export const getMaintenanceNotificationSummary = async () => {
  const [stoppedMachinesCount, pendingMaintenancesCount] = await Promise.all([
    getCurrentStoppedMachines(),
    Maintenance.countDocuments({ status: "pending" })
  ])

  return {
    stoppedMachinesCount,
    pendingMaintenancesCount
  }
}

export const getWeeklyCompletedMaintenances = async () => {
  const { start, end } = getLastWeekRange()
  const completedMaintenances = await Maintenance.find({
    status: "finished",
    createdAt: { $gte: start, $lte: end }
  })
    .select("machine sector clientSnapshot createdAt")
    .sort({ createdAt: 1 })
    .lean()

  return { completedMaintenances, start, end }
}

export const sendDailyStoppedPendingNotification = async (title) => {
  const feed = await getMaintenanceNotificationsFeed()

  console.log("STOPPED:", feed.summary.stoppedMachinesCount)
  console.log("PENDING:", feed.summary.pendingMaintenancesCount)
  console.log("ITEMS:", feed.items)

  const stoppedItems = feed.items.filter(
    item => item.type === "stopped-machine"
  )

  const pendingItems = feed.items.filter(
    item => item.type === "pending-maintenance"
  )

  const stoppedCount = feed.summary.stoppedMachinesCount
  const pendingCount = feed.summary.pendingMaintenancesCount

  let body = "Reporte diario 7 AM\n\n"

  body += `Máquinas detenidas: ${stoppedCount}\n`

  if (stoppedItems.length) {
    body += stoppedItems
      .map(item => `- ${item.machine}`)
      .join("\n")
  }

  body += "\n\n"

  body += `Mantenimientos pendientes: ${pendingCount}\n`

  if (pendingItems.length) {
    body += pendingItems
      .map(item => `- ${item.machine}`)
      .join("\n")
  }

  await sendNotificationMessage({
    title,
    body,
    type: "daily-maintenance-status",
    severity: "warning",
    source: "cron",
    pushTag: "daily-maintenance-status",
    pushUrl: "/dashboard"
  })
}

export const sendWeeklyCompletedMaintenanceNotification = async (title) => {
  const { completedMaintenances, start, end } = await getWeeklyCompletedMaintenances()
  const total = completedMaintenances.length
  let body = `Resumen semanal completados (${formatWeekRangeLabel(start, end)}):\n\n`

  if (!total) {
    body += "No se registraron trabajos finalizados en la semana pasada."
  } else {
    body += `✅ Total completados: ${total}`
    const items = completedMaintenances.slice(0, 6).map(item => {
      const machineName = String(item.machine || "Sin máquina").trim()
      const sectorLabel = item.sector ? ` - ${item.sector}` : ""
      const operatorName = String(item.clientSnapshot?.name || "").trim()
      const operatorLabel = operatorName ? ` - ${operatorName}` : ""
      return `• ${machineName}${sectorLabel}${operatorLabel}`
    })
    body += `\n\n${items.join("\n")}`
    if (total > 6) {
      body += `\n...y ${total - 6} más`
    }
  }

  await sendNotificationMessage({
    title,
    body,
    type: "weekly-completion-summary",
    severity: "info",
    source: "cron",
    pushTag: "weekly-completion-summary",
    pushUrl: "/history"
  })
}

export const getMaintenanceNotificationsFeed = async () => {
  const [
    stoppedMachines,
    pendingMaintenances,
    pendingMaintenancesCount
  ] = await Promise.all([
    getStoppedMachinesDetail(),
    getPendingMaintenancesDetail(),
    Maintenance.countDocuments({ status: "pending" })
  ])

  const items = [
    ...stoppedMachines,
    ...pendingMaintenances
  ]
    .filter(item => item && item.createdAt)
    .sort(
      (left, right) =>
        new Date(right.createdAt) - new Date(left.createdAt)
    )

  return {
    summary: {
      stoppedMachinesCount: stoppedMachines.filter(Boolean).length,
      pendingMaintenancesCount,
      totalActive:
        stoppedMachines.filter(Boolean).length +
        pendingMaintenancesCount
    },
    items
  }
}

const buildSummaryMessage = ({ stoppedMachinesCount, pendingMaintenancesCount }, title) => {
  return `${title}:\n\n⚠ ${stoppedMachinesCount} máquinas detenidas\n⚠ ${pendingMaintenancesCount} mantenimientos pendientes`
}

const createNotificationLog = async ({
  title,
  body,
  type = "system",
  severity = "info",
  source = "system",
  machine = "",
  sector = "",
  metadata = {}
}) => {
  await NotificationLog.create({
    title,
    body,
    type,
    severity,
    source,
    machine,
    sector,
    metadata
  })
}

export const sendNotificationMessage = async ({
  title,
  body,
  type = "system",
  severity = "info",
  source = "system",
  machine = "",
  sector = "",
  metadata = {},
  pushTag = "maintenance-summary",
  pushUrl = "/dashboard"
}) => {
  await createNotificationLog({ title, body, type, severity, source, machine, sector, metadata })

  const message = `${title}:\n\n${body}`

  if (!WEBHOOK_URL) {
    console.log(`[CRON NOTIFICATION]\n${message}`)
  }

  try {
    await sendPushNotificationToAllUsers({
      title,
      body,
      tag: pushTag,
      url: pushUrl,
      data: metadata
    })
  } catch (error) {
    console.error("[WEB PUSH] Error enviando notificacion:", error.message)
  }

  if (!WEBHOOK_URL) {
    return
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: message })
    })

    if (!response.ok) {
      const responseBody = await response.text()
      console.error(`[CRON NOTIFICATION] Webhook HTTP ${response.status}: ${responseBody}`)
    }
  } catch (error) {
    console.error("[CRON NOTIFICATION] Error enviando webhook:", error.message)
  }
}

export const sendMaintenanceSummaryNotification = async (title) => {
  const summary = await getMaintenanceNotificationSummary()
  const body = `⚠ ${summary.stoppedMachinesCount} máquinas detenidas\n⚠ ${summary.pendingMaintenancesCount} mantenimientos pendientes`

  await sendNotificationMessage({
    title,
    body,
    type: "maintenance-summary",
    severity: "warning",
    source: "cron",
    metadata: summary,
    pushTag: "maintenance-summary",
    pushUrl: "/dashboard"
  })
}

export const sendMaintenanceStatusAlert = async ({ status, machine, sector, unfinishedReason }) => {
  if (!["pending", "stopped"].includes(status)) {
    return
  }

  const isStopped = status === "stopped"
  const title = isStopped ? `Maquina detenida: ${machine}` : `Trabajo pendiente: ${machine}`
  const bodyParts = [
    sector ? `Sector: ${sector}` : "",
    unfinishedReason ? `Motivo: ${unfinishedReason}` : isStopped ? "La maquina quedo detenida." : "Hay un mantenimiento pendiente de cierre."
  ].filter(Boolean)

  const body = bodyParts.join(" | ")

  await createNotificationLog({
    title,
    body,
    type: "maintenance-status",
    severity: isStopped ? "error" : "warning",
    source: "maintenance",
    machine,
    sector,
    metadata: {
      machine,
      status
    }
  })

  await sendPushNotificationToAllUsers({
    title,
    body,
    tag: `${status}-${String(machine || "sin-maquina").trim()}`,
    url: "/history",
    data: {
      machine,
      status
    }
  })
}

const TYPE_LABELS = {
  llamada: "Llamada",
  reunion: "Reunión",
  correo: "Correo",
  nota: "Nota",
  difusion: "Difusión",
}

export const getCrmNotificationsFeed = async () => {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [overdueActivities, todayActivities] = await Promise.all([
    Activity.find({
      completada: false,
      fechaProgramada: { $lt: todayStart },
    })
      .select("tipo titulo clienteNombre fechaProgramada")
      .sort({ fechaProgramada: 1 })
      .limit(NOTIFICATION_ITEM_LIMIT)
      .lean(),

    Activity.find({
      completada: false,
      fechaProgramada: { $gte: todayStart, $lte: todayEnd },
    })
      .select("tipo titulo clienteNombre fechaProgramada")
      .sort({ fechaProgramada: 1 })
      .limit(4)
      .lean(),
  ])

  const overdueItems = overdueActivities.map((act) => ({
    id: `crm-overdue-${act._id}`,
    type: "crm-overdue",
    title: `${TYPE_LABELS[act.tipo] || act.tipo} vencida`,
    message: `${act.titulo}${act.clienteNombre ? ` · ${act.clienteNombre}` : ""}`,
    createdAt: act.fechaProgramada,
    severity: "warning",
  }))

  const todayItems = todayActivities.map((act) => ({
    id: `crm-today-${act._id}`,
    type: "crm-today",
    title: `Hoy: ${TYPE_LABELS[act.tipo] || act.tipo}`,
    message: `${act.titulo}${act.clienteNombre ? ` · ${act.clienteNombre}` : ""}`,
    createdAt: act.fechaProgramada,
    severity: "info",
  }))

  const items = [...overdueItems, ...todayItems]

  return {
    summary: {
      overdueCount: overdueActivities.length,
      todayCount: todayActivities.length,
      totalActive: items.length,
    },
    items,
  }
}

export const getComprasNotificationsFeed = async () => {
  const lowStockMaterials = await MateriaPrima.find({
    activo: { $ne: false },
    stockMinimo: { $gt: 0 },
    $expr: { $lte: ["$stock", "$stockMinimo"] },
  })
    .select("nombre stock stockMinimo unidad categoria")
    .sort({ stock: 1 })
    .limit(NOTIFICATION_ITEM_LIMIT)
    .lean()

  const criticalMaterials = lowStockMaterials.filter((m) => m.stock <= 0)
  const lowMaterials = lowStockMaterials.filter((m) => m.stock > 0)

  const items = [
    ...criticalMaterials.map((m) => ({
      id: `compras-critical-${m._id}`,
      type: "stock-critical",
      title: `Sin stock: ${m.nombre}`,
      message: `Stock: ${m.stock} ${m.unidad}${m.categoria ? ` · ${m.categoria}` : ""} — Mínimo: ${m.stockMinimo} ${m.unidad}`,
      createdAt: new Date(),
      severity: "error",
    })),
    ...lowMaterials.map((m) => ({
      id: `compras-low-${m._id}`,
      type: "stock-low",
      title: `Stock bajo: ${m.nombre}`,
      message: `Stock: ${m.stock} ${m.unidad}${m.categoria ? ` · ${m.categoria}` : ""} — Mínimo: ${m.stockMinimo} ${m.unidad}`,
      createdAt: new Date(),
      severity: "warning",
    })),
  ]

  return {
    summary: {
      criticalCount: criticalMaterials.length,
      lowStockCount: lowMaterials.length,
      totalActive: items.length,
    },
    items,
  }
}
