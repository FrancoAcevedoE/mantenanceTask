import express from 'express'
import MateriaPrima from '../models/materiaPrimaModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// GET /api/materias-primas
router.get('/', verifyToken, async (req, res) => {
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
router.get('/:id', verifyToken, async (req, res) => {
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
router.post('/', verifyToken, async (req, res) => {
  try {
    const item = new MateriaPrima(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// PUT /api/materias-primas/:id
router.put('/:id', verifyToken, async (req, res) => {
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
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await MateriaPrima.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/materias-primas/:id/movimiento — carga o descarga de stock
router.post('/:id/movimiento', verifyToken, async (req, res) => {
  try {
    const item = await MateriaPrima.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })

    const { tipo, cantidad, motivo, proveedor, precio } = req.body
    const cant = Number(cantidad)
    if (!cant || cant <= 0) return res.status(400).json({ error: 'Cantidad inválida' })

    item.movimientos.push({
      tipo, cantidad: cant, motivo: motivo || '', proveedor, precio: precio || 0,
      fecha: new Date(), usuario: req.user?.name || ''
    })

    item.stock = tipo === 'entrada'
      ? item.stock + cant
      : Math.max(0, item.stock - cant)

    await item.save()
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
