import express from 'express'
import MateriaPrima from '../models/materiaPrimaModel.js'
import NotificationLog from '../models/notificationLogModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'
import { sendPushToRoles } from '../services/pushService.js'

const CAN_MANAGE_COMPRAS = ['admin', 'admin_compras']
const CAN_USE_COMPRAS    = ['admin', 'admin_compras', 'compras']

const router = express.Router()

// GET /api/materias-primas
router.get('/', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const items = await MateriaPrima.find({ activo: true })
      .populate('proveedor', 'nombre')
      .sort({ nombre: 1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/materias-primas/:id
router.get('/:id', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const item = await MateriaPrima.findById(req.params.id)
      .populate('movimientos.proveedor', 'nombre')
      .populate('proveedor', 'nombre')
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/materias-primas
router.post('/', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    const item = new MateriaPrima(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// PUT /api/materias-primas/:id
router.put('/:id', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    const { movimientos, stock, ...data } = req.body
    const item = await MateriaPrima.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/materias-primas/:id (soft delete)
router.delete('/:id', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    await MateriaPrima.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/materias-primas/:id/movimiento — carga o descarga de stock
router.post('/:id/movimiento', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const item = await MateriaPrima.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })

    const { tipo, cantidad, motivo, proveedor, precio } = req.body
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return res.status(400).json({ error: 'Cantidad inválida' })

    const stockAntes = item.stock

    item.movimientos.push({
      tipo, cantidad: cant, motivo: motivo || '', proveedor, precio: precio || 0,
      fecha: new Date(), usuario: req.user?.name || ''
    })

    item.stock = tipo === 'entrada'
      ? item.stock + cant
      : Math.max(0, item.stock - cant)

    await item.save()

    // ── Alerta de stock bajo mínimo ──────────────────────────────────────────
    if (tipo === 'salida' && item.stockMinimo > 0) {
      const minimo = item.stockMinimo
      const cruzoMinimo   = item.stock <= minimo && stockAntes > minimo
      const cruzoAproximo = !cruzoMinimo && item.stock <= minimo * 1.2 && stockAntes > minimo * 1.2

      if (cruzoMinimo || cruzoAproximo) {
        const titulo = cruzoMinimo ? 'Stock bajo mínimo' : 'Stock cercano al mínimo'
        const cuerpo = cruzoMinimo
          ? `"${item.nombre}" llegó a ${item.stock} ${item.unidad} — mínimo configurado: ${minimo}`
          : `"${item.nombre}" se acerca al mínimo: ${item.stock} ${item.unidad} (mínimo: ${minimo})`

        await NotificationLog.create({
          title: titulo,
          body: cuerpo,
          type: 'stock_bajo',
          severity: cruzoMinimo ? 'error' : 'warning',
          source: 'compras',
          audience: 'all',
          metadata: { materiaPrimaId: item._id, nombre: item.nombre, stock: item.stock, stockMinimo: minimo }
        }).catch(() => {})

        sendPushToRoles(['admin', 'compras'], {
          title: titulo,
          body: cuerpo,
          tag: `stock-mp-${item._id}`,
          url: '/compras/materias-primas'
        }).catch(() => {})
      }
    }

    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
