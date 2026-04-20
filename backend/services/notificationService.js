import Maintenance from "../models/mantenanceModels.js"
import Machine from "../models/machineModels.js"
import NotificationLog from "../models/notificationLogModel.js"
import { sendPushNotificationToAllUsers } from "./pushService.js"

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
    const status = latestStatusMap.get(machineName) || "ok"

    if (status === "stopped") {
      stoppedCount += 1
    }
  }

  return stoppedCount
}

const getStoppedMachinesDetail = async () => {
  const allMachines = await Machine.find({ isDeleted: { $ne: true } }).select("name sector").lean()

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

  const latestStatusMap = new Map(
    latestMachineStatusRaw.map(item => [String(item._id || "").trim(), item])
  )

  return allMachines
    .map(machine => {
      const machineName = String(machine.name || "").trim()
      const latestStatus = latestStatusMap.get(machineName)

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
        sector: String(latestStatus.sector || machine.sector || "").trim(),
        createdAt: latestStatus.createdAt,
        severity: "error"
      }
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
}

const getPendingMaintenancesDetail = async () => {
  const pendingMaintenances = await Maintenance.find({ status: "pending" })
    .select("machine sector unfinishedReason createdAt priority clientId")
    .populate("clientId", "name company")
    .sort({ createdAt: -1 })
    .limit(NOTIFICATION_ITEM_LIMIT)
    .lean()

  return pendingMaintenances.map(item => {
    const operatorName = String(item?.clientId?.name || "").trim()
    const operatorCompany = String(item?.clientId?.company || "").trim()
    const operatorLabel = operatorCompany
      ? `${operatorName} - ${operatorCompany}`
      : operatorName

    return {
      id: `pending-${String(item._id)}`,
      type: "pending-maintenance",
      title: `Trabajo pendiente: ${String(item.machine || "Sin maquina").trim()}`,
      message: item.unfinishedReason
        ? `Motivo: ${item.unfinishedReason}`
        : "Hay un mantenimiento pendiente de cierre.",
      machine: String(item.machine || "").trim(),
      sector: String(item.sector || "").trim(),
      operator: operatorLabel,
      createdAt: item.createdAt,
      severity: item.priority === "alta" ? "error" : "warning"
    }
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
  const stoppedItems = feed.items.filter(item => item.type === "stopped-machine")
  const pendingItems = feed.items.filter(item => item.type === "pending-maintenance")
  const stoppedCount = feed.summary.stoppedMachinesCount
  const pendingCount = feed.summary.pendingMaintenancesCount

  let body = `Reporte diario 7 AM:\n\n⚠ Máquinas detenidas: ${stoppedCount}\n⚠ Mantenimientos pendientes: ${pendingCount}`

  const details = [...stoppedItems, ...pendingItems].slice(0, 5)

  if (details.length) {
    body += "\n\nDetalles:\n"
    body += details
      .map(item => {
        const prefix = item.type === "stopped-machine" ? "Detenida" : "Pendiente"
        const machineLabel = String(item.machine || "Sin máquina").trim()
        const sectorLabel = item.sector ? ` (${item.sector})` : ""
        return `• ${prefix}: ${machineLabel}${sectorLabel}`
      })
      .join("\n")

    if (details.length < stoppedItems.length + pendingItems.length) {
      body += `\n...y ${stoppedItems.length + pendingItems.length - details.length} más`
    }
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
  const [stoppedMachines, pendingMaintenances, pendingMaintenancesCount] = await Promise.all([
    getStoppedMachinesDetail(),
    getPendingMaintenancesDetail(),
    Maintenance.countDocuments({ status: "pending" })
  ])

  const items = [...stoppedMachines, ...pendingMaintenances]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, NOTIFICATION_ITEM_LIMIT * 2)

  return {
    summary: {
      stoppedMachinesCount: stoppedMachines.length,
      pendingMaintenancesCount,
      totalActive: stoppedMachines.length + pendingMaintenancesCount
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
