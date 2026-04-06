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
