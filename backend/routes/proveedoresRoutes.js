import express from 'express'
import Proveedor from '../models/proveedorModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'

const CAN_MANAGE_COMPRAS = ['admin', 'admin_compras']
const CAN_USE_COMPRAS    = ['admin', 'admin_compras', 'compras']

const router = express.Router()

router.get('/', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const items = await Proveedor.find({ activo: true }).sort({ nombre: 1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const item = await Proveedor.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    const item = new Proveedor(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    const { evaluaciones, ...data } = req.body
    const item = await Proveedor.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', verifyToken, checkRole(...CAN_MANAGE_COMPRAS), async (req, res) => {
  try {
    await Proveedor.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/proveedores/:id/evaluacion
router.post('/:id/evaluacion', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const item = await Proveedor.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    item.evaluaciones.push({ ...req.body, usuario: req.user?.name || '', fecha: new Date() })
    await item.save()
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// DELETE /api/proveedores/:id/evaluacion/:evId
router.delete('/:id/evaluacion/:evId', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const item = await Proveedor.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    item.evaluaciones = item.evaluaciones.filter(e => String(e._id) !== req.params.evId)
    await item.save()
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
