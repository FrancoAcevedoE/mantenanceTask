import cron from "node-cron"
import {
  sendDailyStoppedPendingNotification,
  sendWeeklyCompletedMaintenanceNotification
} from "./notificationService.js"

const TIMEZONE = process.env.NOTIFICATION_TIMEZONE || "America/Argentina/Buenos_Aires"
const DAILY_CRON = process.env.DAILY_NOTIFICATION_CRON || "0 7 * * *"
const MONDAY_7AM_CRON = process.env.MONDAY_NOTIFICATION_CRON || "0 7 * * 1"

const runDailyJob = async (title) => {
  try {
    await sendDailyStoppedPendingNotification(title)
  } catch (error) {
    console.error("[CRON NOTIFICATION] Error ejecutando aviso diario:", error.message)
  }
}

const runWeeklyJob = async (title) => {
  try {
    await sendWeeklyCompletedMaintenanceNotification(title)
  } catch (error) {
    console.error("[CRON NOTIFICATION] Error ejecutando resumen semanal:", error.message)
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
      runDailyJob("Aviso diario 7 AM")
    },
    { timezone: TIMEZONE }
  )

  cron.schedule(
    MONDAY_7AM_CRON,
    () => {
      runWeeklyJob("Resumen semanal de completados")
    },
    { timezone: TIMEZONE }
  )

  console.log(`[CRON NOTIFICATION] Activo. Diario: ${DAILY_CRON} | Lunes: ${MONDAY_7AM_CRON} | TZ: ${TIMEZONE}`)

  if (process.env.NOTIFICATION_RUN_ON_STARTUP === "true") {
    runDailyJob("Prueba inicio diario")
    runWeeklyJob("Prueba inicio semanal")
  }
}
