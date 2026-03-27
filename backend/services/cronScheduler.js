import cron from "node-cron"
import { sendMaintenanceSummaryNotification } from "./notificationService.js"

const TIMEZONE = process.env.NOTIFICATION_TIMEZONE || "America/Argentina/Buenos_Aires"
const DAILY_CRON = process.env.DAILY_NOTIFICATION_CRON || "0 9 * * *"
const MONDAY_7AM_CRON = process.env.MONDAY_NOTIFICATION_CRON || "0 7 * * 1"

const runSummaryJob = async (title) => {
  try {
    await sendMaintenanceSummaryNotification(title)
  } catch (error) {
    console.error("[CRON NOTIFICATION] Error ejecutando resumen:", error.message)
  }
}

export const startCronNotifications = () => {
  if (process.env.NOTIFICATION_CRON_ENABLED === "false") {
    console.log("[CRON NOTIFICATION] Deshabilitado por NOTIFICATION_CRON_ENABLED=false")
    return
  }

  cron.schedule(
    DAILY_CRON,
    () => {
      runSummaryJob("Aviso diario")
    },
    { timezone: TIMEZONE }
  )

  cron.schedule(
    MONDAY_7AM_CRON,
    () => {
      runSummaryJob("Lunes 7 AM")
    },
    { timezone: TIMEZONE }
  )

  console.log(`[CRON NOTIFICATION] Activo. Diario: ${DAILY_CRON} | Lunes: ${MONDAY_7AM_CRON} | TZ: ${TIMEZONE}`)

  if (process.env.NOTIFICATION_RUN_ON_STARTUP === "true") {
    runSummaryJob("Prueba inicio")
  }
}
