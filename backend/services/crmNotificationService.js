import NotificationLog from "../models/notificationLogModel.js"
import Client from "../models/clientModel.js"
import Quote from "../models/quoteModel.js"
import Activity from "../models/activityModel.js"
import User from "../models/userModels.js"
import { sendPushToRoles, sendPushToUserId } from "./pushService.js"

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function businessDaysSince(date) {
  const start = new Date(date)
  const now = new Date()
  let count = 0
  const d = new Date(start)
  d.setHours(0, 0, 0, 0)
  while (d < now) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

// ── Cron: alerta a vendedor por potencial sin seguimiento >2 días ─────────────

export const notifyPotentialFollowupAlert = async () => {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  const clients = await Client.find({
    tipoCliente: 'potencial',
    isDeleted: { $ne: true },
    $or: [
      { followupAlertSentAt: null },
      { followupAlertSentAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    ]
  }).lean()

  // Filtrar los que superan los 2 días considerando actividad Y cotización
  const stale = clients.filter(c => {
    const candidates = [c.lastActivityAt, c.lastQuoteAt, c.createdAt].filter(Boolean)
    const mostRecent = new Date(Math.max(...candidates.map(d => new Date(d).getTime())))
    return mostRecent < twoDaysAgo
  })

  if (!stale.length) return

  // Agrupar por vendedor (assignedToId)
  const byVendedor = {}
  for (const c of stale) {
    const key = c.assignedToId || '__global__'
    if (!byVendedor[key]) byVendedor[key] = []
    byVendedor[key].push(c.razonSocial || c.name || 'Sin nombre')
  }

  for (const [userId, names] of Object.entries(byVendedor)) {
    const body = `${names.length} potencial(es) sin contacto >2 días:\n` +
      names.slice(0, 5).map(n => `• ${n}`).join('\n') +
      (names.length > 5 ? `\n...y ${names.length - 5} más` : '')

    const notifPayload = {
      title: '⚠️ Clientes sin seguimiento',
      body,
      type: 'crm-potential-alert',
      severity: 'warning',
      metadata: { count: names.length },
      pushUrl: '/crm'
    }

    // Guardar log de notificación
    await NotificationLog.create({ ...notifPayload, source: 'crm', audience: 'crm' })

    // Enviar push al vendedor específico o a todos los vendedores si no hay asignado
    if (userId !== '__global__') {
      await sendPushToUserId(userId, notifPayload)
    } else {
      await sendPushToRoles(['vendedor'], notifPayload)
    }
  }

  // Marcar followupAlertSentAt en todos los clientes alertados
  const ids = stale.map(c => c._id)
  await Client.updateMany({ _id: { $in: ids } }, { followupAlertSentAt: new Date() })
}

// ── Cron: transferir potenciales sin seguimiento >8 días calendario ───────────

export const transferStalePotentialClients = async () => {
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

  const clients = await Client.find({
    tipoCliente: 'potencial',
    isDeleted: { $ne: true },
  }).lean()

  // Usar el más reciente entre lastActivityAt, lastQuoteAt y createdAt
  const toTransfer = clients.filter(c => {
    const candidates = [c.lastActivityAt, c.lastQuoteAt, c.createdAt].filter(Boolean)
    const mostRecent = new Date(Math.max(...candidates.map(d => new Date(d).getTime())))
    return mostRecent < eightDaysAgo
  })

  if (!toTransfer.length) return

  // Obtener admin_ventas para notificar
  const adminVentas = await User.find({ role: 'admin_ventas', isDeleted: { $ne: true } }).select('_id name').lean()
  const adminIds = adminVentas.map(u => u._id)

  for (const c of toTransfer) {
    const clientName = c.razonSocial || c.name || 'Sin nombre'
    const vendedorId = c.assignedToId
    const candidates = [c.lastActivityAt, c.lastQuoteAt, c.createdAt].filter(Boolean)
    const mostRecent = new Date(Math.max(...candidates.map(d => new Date(d).getTime())))
    const days = Math.floor((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))

    // Notificar al vendedor
    if (vendedorId) {
      await sendPushToUserId(vendedorId, {
        title: '⛔ Cliente transferido por inactividad',
        body: `"${clientName}" fue transferido a Administración de Ventas tras ${days} días hábiles sin seguimiento.`,
        tag: 'crm-client-transferred',
        url: '/crm'
      })
    }

    // Notificar a todos los admin_ventas
    for (const adminId of adminIds) {
      await sendPushToUserId(String(adminId), {
        title: '📥 Cliente recibido por inactividad',
        body: `"${clientName}" fue transferido desde ${c.createdBy || 'un vendedor'} por ${days} días hábiles sin seguimiento.`,
        tag: 'crm-client-received',
        url: '/crm'
      })
    }

    // Log de notificación
    await NotificationLog.create({
      title: 'Cliente transferido por inactividad',
      body: `${clientName} transferido tras ${days} días hábiles`,
      type: 'crm-client-transferred',
      severity: 'error',
      source: 'crm',
      audience: 'crm',
      metadata: { clientName, days, fromVendedor: c.createdBy }
    })

    // Transferir: asignar al primer admin_ventas disponible (o limpiar asignación)
    const newAssignedId = adminVentas[0] ? String(adminVentas[0]._id) : ''
    await Client.findByIdAndUpdate(c._id, {
      assignedToId: newAssignedId,
      createdBy: adminVentas[0]?.name || 'Admin ventas',
      // Reset de alertas para que el nuevo responsable comience limpio
      followupAlertSentAt: null,
      lastActivityAt: new Date(), // contar desde la transferencia
    })
  }
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

// ── Cron: clientes sin cotización en 60+ días (lunes) ────────────────────────

export const notifyClientsWithoutRecentQuote = async () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

  const clients = await Client.find({
    tipoCliente: 'normal',
    isDeleted: { $ne: true },
    $or: [
      { lastQuoteAt: { $lt: sixtyDaysAgo } },
      { lastQuoteAt: null }
    ]
  }).select('razonSocial name assignedToId createdBy lastQuoteAt createdAt').lean()

  if (!clients.length) return

  // Agrupar por vendedor
  const byVendedor = {}
  for (const c of clients) {
    const key = c.assignedToId || '__global__'
    if (!byVendedor[key]) byVendedor[key] = []
    byVendedor[key].push(c.razonSocial || c.name || 'Sin nombre')
  }

  for (const [userId, names] of Object.entries(byVendedor)) {
    const body = `${names.length} cliente(s) sin cotización en más de 60 días:\n` +
      names.slice(0, 5).map(n => `• ${n}`).join('\n') +
      (names.length > 5 ? `\n...y ${names.length - 5} más` : '')

    const payload = {
      title: '🟠 Clientes sin cotización reciente',
      body,
      type: 'crm-no-recent-quote',
      severity: 'warning',
      metadata: { count: names.length },
      pushUrl: '/crm'
    }

    await NotificationLog.create({ ...payload, source: 'crm', audience: 'crm' })

    if (userId !== '__global__') {
      await sendPushToUserId(userId, payload)
    } else {
      await sendPushToRoles(['vendedor', 'admin_ventas'], payload)
    }
  }
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
