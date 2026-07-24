import express from 'express'
import ProveedorConfig from '../models/proveedorConfigModel.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'

const CAN_USE_COMPRAS = ['admin', 'admin_compras', 'compras']

const router = express.Router()

// GET /api/proveedores-config — cualquiera del módulo puede leer los criterios
router.get('/', verifyToken, checkRole(...CAN_USE_COMPRAS), async (req, res) => {
  try {
    const cfg = await ProveedorConfig.findOneAndUpdate(
      { key: 'default' },
      { $setOnInsert: { key: 'default', criterios: [] } },
      { upsert: true, new: true }
    )
    res.json(cfg)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/proveedores-config — solo admin puede modificar
router.put('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const cfg = await ProveedorConfig.findOneAndUpdate(
      { key: 'default' },
      { criterios: req.body.criterios || [] },
      { upsert: true, new: true }
    )
    res.json(cfg)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
