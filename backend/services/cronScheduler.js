import cron from "node-cron"
import {
  sendDailyStoppedPendingNotification,
  sendWeeklyCompletedMaintenanceNotification
} from "./notificationService.js"
import {
  notifyWeeklySalesSummary,
  notifyMonthlySalesSummary,
  notifyFollowupReminder,
  notifyPotentialFollowupAlert,
  transferStalePotentialClients,
  notifyClientsWithoutRecentQuote
} from "./crmNotificationService.js"

const TIMEZONE = process.env.NOTIFICATION_TIMEZONE || "America/Argentina/Buenos_Aires"
const DAILY_CRON = process.env.DAILY_NOTIFICATION_CRON || "0 7 * * *"
const MONDAY_7AM_CRON = process.env.MONDAY_NOTIFICATION_CRON || "0 7 * * 1"
// CRM: cada dos días a las 9 AM (lunes, miércoles, viernes, domingo)
const FOLLOWUP_CRON = "0 9 * * 1,3,5,0"
// CRM: resumen mensual el 1ro de cada mes a las 8 AM
const MONTHLY_CRON = "0 8 1 * *"
// CRM: alerta de potenciales sin seguimiento — todos los días a las 9 AM
const POTENTIAL_ALERT_CRON = "0 9 * * *"
// CRM: transferencia de potenciales >5 días hábiles — todos los días laborables a las 10 AM
const TRANSFER_STALE_CRON = "0 10 * * 1-5"

const safe = (fn, label) => async () => {
  try { await fn() } catch (err) { console.error(`[CRON] ${label}:`, err.message) }
}

export const startCronNotifications = () => {
  if (process.env.NOTIFICATION_CRON_ENABLED === "false") {
    console.log("[CRON NOTIFICATION] Deshabilitado por NOTIFICATION_CRON_ENABLED=false")
    return
  }

  // Mantenimiento
  cron.schedule(DAILY_CRON, safe(() => sendDailyStoppedPendingNotification("Aviso diario 7 AM"), "diario"), { timezone: TIMEZONE })
  cron.schedule(MONDAY_7AM_CRON, safe(() => sendWeeklyCompletedMaintenanceNotification("Resumen semanal de completados"), "semanal-mant"), { timezone: TIMEZONE })

  // CRM
  cron.schedule(MONDAY_7AM_CRON, safe(notifyWeeklySalesSummary, "resumen-semanal-ventas"), { timezone: TIMEZONE })
  cron.schedule(MONDAY_7AM_CRON, safe(notifyClientsWithoutRecentQuote, "clientes-sin-cotizacion"), { timezone: TIMEZONE })
  cron.schedule(FOLLOWUP_CRON, safe(notifyFollowupReminder, "seguimiento-crm"), { timezone: TIMEZONE })
  cron.schedule(MONTHLY_CRON, safe(notifyMonthlySalesSummary, "resumen-mensual-ventas"), { timezone: TIMEZONE })
  cron.schedule(POTENTIAL_ALERT_CRON, safe(notifyPotentialFollowupAlert, "alerta-potenciales"), { timezone: TIMEZONE })
  cron.schedule(TRANSFER_STALE_CRON, safe(transferStalePotentialClients, "transferir-potenciales"), { timezone: TIMEZONE })

  console.log(`[CRON] Activo. Diario: ${DAILY_CRON} | Lunes: ${MONDAY_7AM_CRON} | Seguimiento: ${FOLLOWUP_CRON} | Mensual: ${MONTHLY_CRON} | TZ: ${TIMEZONE}`)

  if (process.env.NOTIFICATION_RUN_ON_STARTUP === "true") {
    safe(() => sendDailyStoppedPendingNotification("Prueba inicio diario"), "startup-diario")()
    safe(notifyWeeklySalesSummary, "startup-ventas")()
  }
}
