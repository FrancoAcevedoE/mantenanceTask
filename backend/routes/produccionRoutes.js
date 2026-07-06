import express from 'express'
import OrdenProduccion from '../models/ordenProduccionModel.js'
import RegistroProduccion from '../models/registroProduccionModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// ── Órdenes de producción (programación) ─────────────────────────────────────

router.get('/ordenes', verifyToken, async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query
    const filter = {}
    if (estado) filter.estado = estado
    if (desde || hasta) {
      filter.fechaProgramada = {}
      if (desde) filter.fechaProgramada.$gte = new Date(desde)
      if (hasta) filter.fechaProgramada.$lte = new Date(hasta)
    }
    const items = await OrdenProduccion.find(filter)
      .populate('formulaResina', 'nombre')
      .sort({ fechaProgramada: 1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/ordenes/:id', verifyToken, async (req, res) => {
  try {
    const item = await OrdenProduccion.findById(req.params.id)
      .populate('formulaResina', 'nombre')
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/ordenes', verifyToken, async (req, res) => {
  try {
    const item = new OrdenProduccion({ ...req.body, operario: req.user?.name || '' })
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/ordenes/:id', verifyToken, async (req, res) => {
  try {
    const item = await OrdenProduccion.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/ordenes/:id', verifyToken, async (req, res) => {
  try {
    await OrdenProduccion.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Registros de producción (seguimiento + calidad) ───────────────────────────

router.get('/registros', verifyToken, async (req, res) => {
  try {
    const { desde, hasta } = req.query
    const filter = {}
    if (desde || hasta) {
      filter.fecha = {}
      if (desde) filter.fecha.$gte = new Date(desde)
      if (hasta) filter.fecha.$lte = new Date(hasta)
    }
    const items = await RegistroProduccion.find(filter)
      .populate('formulaResina', 'nombre')
      .populate('ordenProduccion', 'numero')
      .sort({ fecha: -1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/registros', verifyToken, async (req, res) => {
  try {
    const item = new RegistroProduccion({ ...req.body, operario: req.user?.name || req.body.operario || '' })
    await item.save()

    // Si hay orden asociada y se completó, actualizar su estado
    if (item.ordenProduccion) {
      const total = (item.cantidadPrimera || 0) + (item.cantidadSegunda || 0)
      const orden = await OrdenProduccion.findById(item.ordenProduccion)
      if (orden && total >= orden.cantidad) {
        await OrdenProduccion.findByIdAndUpdate(item.ordenProduccion, { estado: 'completada' })
      } else if (orden && total > 0) {
        await OrdenProduccion.findByIdAndUpdate(item.ordenProduccion, { estado: 'en_proceso' })
      }
    }

    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/registros/:id', verifyToken, async (req, res) => {
  try {
    const item = await RegistroProduccion.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/registros/:id', verifyToken, async (req, res) => {
  try {
    await RegistroProduccion.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
