import express from 'express'
import Proveedor from '../models/proveedorModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await Proveedor.find({ activo: true }).sort({ nombre: 1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Proveedor.findById(req.params.id)
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    const item = new Proveedor(req.body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { evaluaciones, ...data } = req.body
    const item = await Proveedor.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Proveedor.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/proveedores/:id/evaluacion
router.post('/:id/evaluacion', verifyToken, async (req, res) => {
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
router.delete('/:id/evaluacion/:evId', verifyToken, async (req, res) => {
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
