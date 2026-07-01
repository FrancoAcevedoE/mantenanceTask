import express from "express"
import Quote    from "../models/quoteModel.js"
import Activity from "../models/activityModel.js"
import Client   from "../models/clientModel.js"
import User     from "../models/userModels.js"
import { verifyToken } from "../middlewares/authMiddleware.js"

const router = express.Router()

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end   = new Date(year, month,     0, 23, 59, 59, 999)
  return { start, end }
}

function qTotal(q) { return (q.items || []).reduce((s, i) => s + (i.subtotal || 0), 0) }

function buildStats(quotes, activities, newClients) {
  return {
    quotes: {
      total:       quotes.length,
      pending:     quotes.filter(q => ['borrador','enviada'].includes(q.estado)).length,
      approved:    quotes.filter(q => q.estado === 'aceptada').length,
      rejected:    quotes.filter(q => q.estado === 'rechazada').length,
      totalAmount: quotes.reduce((s, q) => s + qTotal(q), 0),
      soldAmount:  quotes.filter(q => q.estado === 'aceptada').reduce((s, q) => s + qTotal(q), 0),
    },
    activities: {
      total:  activities.length,
      recent: activities.slice(0, 7)
    },
    newClients
  }
}

// ── GET /api/dashboard/stats?year=YYYY&month=M&sellerId=optional ──────────────
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const year  = parseInt(req.query.year  || new Date().getFullYear())
    const month = parseInt(req.query.month || (new Date().getMonth() + 1))
    const { start, end } = monthRange(year, month)

    // Vendedor solo ve los suyos; admin/admin_ventas pueden filtrar por sellerId
    const sellerId = req.user.role === 'vendedor' ? String(req.user.id || req.user._id)
      : (req.query.sellerId || null)

    const quoteFilter    = { createdAt: { $gte: start, $lte: end }, ...(sellerId ? { sellerId } : {}) }
    const actFilter      = { createdAt: { $gte: start, $lte: end }, ...(sellerId ? { realizadoPorId: sellerId } : {}) }
    const clientFilter   = { isDeleted: { $ne: true }, createdAt: { $gte: start, $lte: end }, ...(sellerId ? { assignedToId: sellerId } : {}) }

    const [quotes, activities, newClients] = await Promise.all([
      Quote.find(quoteFilter).select('estado items').lean(),
      Activity.find(actFilter).sort({ createdAt: -1 }).limit(10)
        .select('tipo titulo clienteNombre realizadoPor createdAt completada').lean(),
      Client.countDocuments(clientFilter)
    ])

    res.json({ period: { year, month }, ...buildStats(quotes, activities, newClients) })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── GET /api/dashboard/history?months=6&sellerId=optional ────────────────────
router.get("/history", verifyToken, async (req, res) => {
  try {
    const nMonths  = Math.min(parseInt(req.query.months || 6), 24)
    const sellerId = req.user.role === 'vendedor' ? String(req.user.id || req.user._id)
      : (req.query.sellerId || null)

    const now  = new Date()
    const rows = []

    for (let i = 1; i <= nMonths; i++) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year  = d.getFullYear()
      const month = d.getMonth() + 1
      const { start, end } = monthRange(year, month)

      const qFilter = { createdAt: { $gte: start, $lte: end }, ...(sellerId ? { sellerId } : {}) }
      const quotes  = await Quote.find(qFilter).select('estado items').lean()

      rows.push({
        year, month,
        quotes:      quotes.length,
        approved:    quotes.filter(q => q.estado === 'aceptada').length,
        rejected:    quotes.filter(q => q.estado === 'rechazada').length,
        totalAmount: quotes.reduce((s, q) => s + qTotal(q), 0),
        soldAmount:  quotes.filter(q => q.estado === 'aceptada').reduce((s, q) => s + qTotal(q), 0),
      })
    }

    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── GET /api/dashboard/sellers ───────────────────────────────────────────────
router.get("/sellers", verifyToken, async (req, res) => {
  if (!['admin', 'admin_ventas'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado' })
  }
  try {
    const sellers = await User.find({ role: 'vendedor', isDeleted: { $ne: true } })
      .select('_id name role').lean()
    res.json(sellers)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
