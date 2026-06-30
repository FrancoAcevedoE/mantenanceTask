import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'
import Color from '../models/colorModel.js'
import { COLOR_CATALOG } from '../data/colorCatalog.js'

const router = Router()

async function ensureSeed() {
    const count = await Color.countDocuments()
    if (count === 0 && COLOR_CATALOG.length) {
        await Color.insertMany(COLOR_CATALOG.map(c => ({
            code: c.code,
            name: c.name,
            tipo: c.tipo || '',
            grupoColor: c.grupoColor,
            image: '',
        })))
        console.log(`[colors] seeded ${COLOR_CATALOG.length} colors`)
    }
}
ensureSeed().catch(err => console.error('[colors] seed error:', err))

router.get('/', verifyToken, async (req, res) => {
    try {
        const colors = await Color.find({}).sort({ grupoColor: 1, code: 1 }).lean()
        res.json(colors)
    } catch (err) {
        res.status(500).json({ message: 'Error fetching colors', error: err.message })
    }
})

router.post('/', verifyToken, checkRole('admin', 'admin_ventas'), async (req, res) => {
    try {
        const { code, name, tipo, grupoColor, image } = req.body
        if (!code || !name || !grupoColor) {
            return res.status(400).json({ message: 'Codigo, nombre y grupo son obligatorios' })
        }
        const color = await Color.create({ code, name, tipo: tipo || '', grupoColor, image: image || '' })
        res.status(201).json(color)
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Ya existe un color con ese codigo' })
        res.status(500).json({ message: 'Error creating color', error: err.message })
    }
})

router.put('/:id', verifyToken, checkRole('admin', 'admin_ventas'), async (req, res) => {
    try {
        const color = await Color.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' })
        if (!color) return res.status(404).json({ message: 'Color no encontrado' })
        res.json(color)
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Ya existe un color con ese codigo' })
        res.status(500).json({ message: 'Error updating color', error: err.message })
    }
})

router.delete('/:id', verifyToken, checkRole('admin', 'admin_ventas'), async (req, res) => {
    try {
        const color = await Color.findByIdAndDelete(req.params.id)
        if (!color) return res.status(404).json({ message: 'Color no encontrado' })
        res.json({ message: 'Color eliminado' })
    } catch (err) {
        res.status(500).json({ message: 'Error deleting color', error: err.message })
    }
})

export default router
