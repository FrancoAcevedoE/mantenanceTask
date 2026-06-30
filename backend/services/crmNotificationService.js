import NotificationLog from "../models/notificationLogModel.js"
import Client from "../models/clientModel.js"
import Quote from "../models/quoteModel.js"
import Activity from "../models/activityModel.js"
import { sendPushToRoles } from "./pushService.js"

const CRM_ROLES = ['vendedor', 'admin_ventas']
const ADMIN_VENTAS_ROLES = ['admin_ventas']

const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

async function logAndPush({ title, body, type, severity = 'info', metadata = {}, pushUrl = '/crm', roles = CRM_ROLES }) {
  await NotificationLog.create({ title, body, type, severity, source: 'crm', metadata, audience: 'crm' })
  await sendPushToRoles(roles, { title, body, tag: type, url: pushUrl, data: metadata })
}

// ── Producto ──────────────────────────────────────────────────────────────────

export const notifyNewProduct = async (name) => {
  await logAndPush({
    title: 'Nuevo producto',
    body: `Se agregó el producto: ${name}`,
    type: 'crm-new-product',
    severity: 'info',
    metadata: { productName: name },
    pushUrl: '/inventory'
  })
}

export const notifyPriceChange = async (count = 1, detail = '') => {
  const body = count === 1
    ? `Se actualizó el precio de: ${detail}`
    : `Se actualizaron precios de ${count} productos${detail ? ': ' + detail : ''}`
  await logAndPush({
    title: 'Cambio de precios',
    body,
    type: 'crm-price-change',
    severity: 'warning',
    metadata: { count, detail },
    pushUrl: '/inventory'
  })
}

// ── Cliente ───────────────────────────────────────────────────────────────────

export const notifyNewClient = async (name) => {
  await logAndPush({
    title: 'Nuevo cliente',
    body: `Se agregó el cliente: ${name}`,
    type: 'crm-new-client',
    severity: 'info',
    metadata: { clientName: name },
    pushUrl: '/crm'
  })
}

// ── Cotización ────────────────────────────────────────────────────────────────

export const notifyQuoteSent = async (titulo, clienteName) => {
  await logAndPush({
    title: 'Cotización enviada',
    body: `"${titulo}" para ${clienteName}`,
    type: 'crm-quote-sent',
    severity: 'info',
    metadata: { titulo, clienteName },
    pushUrl: '/crm'
  })
}

// ── Color ─────────────────────────────────────────────────────────────────────

export const notifyNewColor = async (name, code) => {
  await logAndPush({
    title: 'Nuevo color',
    body: `Se agregó el color: ${name} (${code})`,
    type: 'crm-new-color',
    severity: 'info',
    metadata: { name, code },
    pushUrl: '/color-catalog'
  })
}

// ── Grupo ─────────────────────────────────────────────────────────────────────

export const notifyGroupModified = async (name) => {
  await logAndPush({
    title: 'Grupo modificado',
    body: `Se modificó el grupo: ${name}`,
    type: 'crm-group-modified',
    severity: 'info',
    metadata: { name },
    pushUrl: '/product-groups'
  })
}

// ── Cron: seguimiento cada dos días ──────────────────────────────────────────

export const notifyFollowupReminder = async () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const pendingStages = ['contactado', 'cotizacion_enviada', 'negociacion']
  const clients = await Client.find({
    pipelineEstado: { $in: pendingStages },
    isDeleted: { $ne: true }
  }).select('razonSocial name pipelineEstado updatedAt').lean()

  if (!clients.length) return

  // Filtra los que no tuvieron actividad en los últimos 2 días
  let clientesSinSeguimiento = []
  for (const c of clients) {
    const lastActivity = await Activity.findOne({ clientId: String(c._id) })
      .sort({ createdAt: -1 }).select('createdAt').lean()

    const lastDate = lastActivity?.createdAt || c.updatedAt || new Date(0)
    if (new Date(lastDate) < twoDaysAgo) {
      clientesSinSeguimiento.push(c.razonSocial || c.name || 'Sin nombre')
    }
  }

  if (!clientesSinSeguimiento.length) return

  const body = `${clientesSinSeguimiento.length} cliente(s) sin seguimiento:\n` +
    clientesSinSeguimiento.slice(0, 5).map(n => `• ${n}`).join('\n') +
    (clientesSinSeguimiento.length > 5 ? `\n...y ${clientesSinSeguimiento.length - 5} más` : '')

  await logAndPush({
    title: 'Recordatorio de seguimiento',
    body,
    type: 'crm-followup-reminder',
    severity: 'warning',
    metadata: { count: clientesSinSeguimiento.length },
    pushUrl: '/crm'
  })
}

// ── Cron: resumen semanal de ventas (lunes) ───────────────────────────────────

export const notifyWeeklySalesSummary = async () => {
  const now = new Date()
  const day = now.getDay()
  const daysBack = (day + 6) % 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysBack - 7)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [quotes, newClients, wonClients] = await Promise.all([
    Quote.find({ createdAt: { $gte: weekStart, $lte: weekEnd } }).select('titulo cliente items estado').lean(),
    Client.find({ createdAt: { $gte: weekStart, $lte: weekEnd } }).select('razonSocial name').lean(),
    Client.find({ pipelineEstado: 'ganado', updatedAt: { $gte: weekStart, $lte: weekEnd } }).select('razonSocial name').lean()
  ])

  const totalCotizaciones = quotes.length
  const totalMonto = quotes.reduce((sum, q) => sum + (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0), 0)
  const ganadas = quotes.filter(q => q.estado === 'aceptada').length

  const weekLabel = `${fmtDate(weekStart)} - ${fmtDate(weekEnd)}`
  let body = `Semana ${weekLabel}\n\n`
  body += `📋 Cotizaciones: ${totalCotizaciones} (${ganadas} aceptadas)\n`
  body += `💰 Monto total: $${totalMonto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}\n`
  body += `🆕 Nuevos clientes: ${newClients.length}\n`
  body += `✅ Clientes ganados: ${wonClients.length}`

  await logAndPush({
    title: 'Resumen semanal de ventas',
    body,
    type: 'crm-weekly-summary',
    severity: 'info',
    metadata: { totalCotizaciones, totalMonto, newClients: newClients.length, wonClients: wonClients.length },
    pushUrl: '/crm'
  })
}

// ── Cron: resumen mensual (1ro de cada mes, solo admin_ventas) ────────────────

export const notifyMonthlySalesSummary = async () => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  const monthLabel = monthStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const [quotes, newClients, wonClients, allStages] = await Promise.all([
    Quote.find({ createdAt: { $gte: monthStart, $lte: monthEnd } }).select('items estado').lean(),
    Client.find({ createdAt: { $gte: monthStart, $lte: monthEnd } }).select('_id').lean(),
    Client.find({ pipelineEstado: 'ganado', updatedAt: { $gte: monthStart, $lte: monthEnd } }).select('_id').lean(),
    Client.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$pipelineEstado', count: { $sum: 1 } } }
    ])
  ])

  const totalMonto = quotes.reduce((sum, q) => sum + (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0), 0)
  const ganadas = quotes.filter(q => q.estado === 'aceptada').length
  const stageMap = Object.fromEntries(allStages.map(s => [s._id, s.count]))

  let body = `Mes: ${monthLabel}\n\n`
  body += `📋 Cotizaciones: ${quotes.length} (${ganadas} aceptadas)\n`
  body += `💰 Monto total: $${totalMonto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}\n`
  body += `🆕 Nuevos clientes: ${newClients.length} | ✅ Ganados: ${wonClients.length}\n\n`
  body += `Pipeline actual:\n`
  const stageLabels = {
    nuevo_lead: 'Nuevos leads', contactado: 'Contactados',
    cotizacion_enviada: 'Cotiz. enviadas', negociacion: 'En negociación',
    ganado: 'Ganados', perdido: 'Perdidos'
  }
  body += Object.entries(stageLabels).map(([k, l]) => `• ${l}: ${stageMap[k] || 0}`).join('\n')

  await logAndPush({
    title: `Resumen mensual — ${monthLabel}`,
    body,
    type: 'crm-monthly-summary',
    severity: 'info',
    metadata: { monthLabel, totalQuotes: quotes.length, totalMonto, newClients: newClients.length, wonClients: wonClients.length },
    pushUrl: '/crm',
    roles: ADMIN_VENTAS_ROLES
  })
}
