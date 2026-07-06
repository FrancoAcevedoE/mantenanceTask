import express from 'express'
import FormulaResina from '../models/formulaResinaModel.js'
import MateriaPrima from '../models/materiaPrimaModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', verifyToken, async (req, res) => {
  try {
    const items = await FormulaResina.find({ activo: true })
      .populate('ingredientes.materiaPrima', 'nombre unidad precio')
      .sort({ nombre: 1 })
    res.json(items)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const item = await FormulaResina.findById(req.params.id)
      .populate('ingredientes.materiaPrima', 'nombre unidad precio')
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try {
    const body = req.body
    // Calcular costo total en base a ingredientes y precio de cada materia prima
    let costoTotal = 0
    for (const ing of (body.ingredientes || [])) {
      const mp = await MateriaPrima.findById(ing.materiaPrima)
      if (mp) costoTotal += (mp.precio || 0) * (ing.cantidad || 0)
    }
    body.costoTotal = costoTotal
    const item = new FormulaResina(body)
    await item.save()
    res.status(201).json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const body = req.body
    let costoTotal = 0
    for (const ing of (body.ingredientes || [])) {
      const mp = await MateriaPrima.findById(ing.materiaPrima)
      if (mp) costoTotal += (mp.precio || 0) * (ing.cantidad || 0)
    }
    body.costoTotal = costoTotal
    const item = await FormulaResina.findByIdAndUpdate(req.params.id, body, { new: true })
      .populate('ingredientes.materiaPrima', 'nombre unidad precio')
    if (!item) return res.status(404).json({ error: 'No encontrado' })
    res.json(item)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await FormulaResina.findByIdAndUpdate(req.params.id, { activo: false })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
