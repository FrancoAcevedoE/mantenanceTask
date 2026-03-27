import Maintenance from "../models/mantenanceModels.js"
import Machine from "../models/machineModels.js"

const WEBHOOK_URL = String(process.env.NOTIFICATION_WEBHOOK_URL || "").trim()

const getCurrentStoppedMachines = async () => {
  const allMachines = await Machine.find().select("name").lean()

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

const buildSummaryMessage = ({ stoppedMachinesCount, pendingMaintenancesCount }, title) => {
  return `${title}:\n\n⚠ ${stoppedMachinesCount} máquinas detenidas\n⚠ ${pendingMaintenancesCount} mantenimientos pendientes`
}

export const sendNotificationMessage = async (message) => {
  if (!WEBHOOK_URL) {
    console.log(`[CRON NOTIFICATION]\n${message}`)
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
  const message = buildSummaryMessage(summary, title)
  await sendNotificationMessage(message)
}
