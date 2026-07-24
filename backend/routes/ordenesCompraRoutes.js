import express from 'express'
import OrdenCompra from '../models/ordenCompraModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'

const CAN_USE    = ['admin', 'admin_compras', 'compras']
const CAN_MANAGE = ['admin', 'admin_compras']

const router = express.Router()

// GET /api/ordenes-compra  — con filtros opcionales: ?mes=2026-07&proveedor=ARAUCO&estado=recibido
router.get('/', verifyToken, checkRole(...CAN_USE), async (req, res) => {
  try {
    const query = { activo: true }
    if (req.query.proveedor) query.proveedorNombre = new RegExp(req.query.proveedor, 'i')
    if (req.query.producto)  query.producto = new RegExp(req.query.producto, 'i')
    if (req.query.estado)    query.estado = req.query.estado
    if (req.query.mes) {
      const [year, month] = req.query.mes.split('-').map(Number)
      query.fecha = {
        $gte: new Date(year, month - 1, 1),
        $lt:  new Date(year, month, 1),
      }
    }
    const items = await OrdenCompra.find(query).sort({ fecha: -1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', verifyToken, checkRole(...CAN_MANAGE), async (req, res) => {
  try {
    const item = new OrdenCompra(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id', verifyToken, checkRole(...CAN_MANAGE), async (req, res) => {
  try {
    const item = await OrdenCompra.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', verifyToken, checkRole(...CAN_MANAGE), async (req, res) => {
  try {
    await OrdenCompra.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
