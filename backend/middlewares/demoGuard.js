/**
 * Sandbox mode for the test user (DNI 00000000 / isDemo: true in JWT).
 * GET requests pass through normally so the demo user sees real data.
 * POST  → returns the submitted body with a fake _id (nothing written to DB).
 * PUT/PATCH → reads the real document, merges with the submitted body, and
 *             returns the merged result (no write to DB).
 * DELETE → returns success without removing anything from DB.
 */
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './authMiddleware.js'
import { randomBytes } from 'crypto'
import mongoose from 'mongoose'

import Client           from '../models/clientModel.js'
import Activity         from '../models/activityModel.js'
import Quote            from '../models/quoteModel.js'
import Machine          from '../models/machineModels.js'
import Product          from '../models/productModel.js'
import ProductGroup     from '../models/productGroupModel.js'
import MateriaPrima     from '../models/materiaPrimaModel.js'
import Proveedor        from '../models/proveedorModel.js'
import FormulaResina    from '../models/formulaResinaModel.js'
import OrdenProduccion  from '../models/ordenProduccionModel.js'
import RegistroProduccion from '../models/registroProduccionModel.js'
import Color            from '../models/colorModel.js'
import Maintenance      from '../models/mantenanceModels.js'
import User             from '../models/userModels.js'

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// URL path segment → Mongoose model (used for PUT/PATCH reads)
const ROUTE_MODEL = {
  clients:          Client,
  activities:       Activity,
  quotes:           Quote,
  machines:         Machine,
  products:         Product,
  'product-groups': ProductGroup,
  'materias-primas': MateriaPrima,
  proveedores:      Proveedor,
  'formulas-resina': FormulaResina,
  ordenes:          OrdenProduccion,
  registros:        RegistroProduccion,
  colors:           Color,
  maintenance:      Maintenance,
  users:            User,
}

function fakeId() {
  return randomBytes(12).toString('hex')
}

function decodeToken(req) {
  const header = req.headers.authorization
  if (!header) return null
  const token = header.split(' ')[1]
  if (!token) return null
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}

// Returns { resource, id } from a path like /api/clients/abc123
// or /api/produccion/ordenes/abc123
function parsePath(url) {
  const parts = (url || '').split('?')[0].split('/').filter(Boolean)
  const start = parts.indexOf('api') >= 0 ? parts.indexOf('api') + 1 : 0
  const segs  = parts.slice(start)
  if (segs.length === 0) return { resource: null, id: null }
  if (segs.length === 1) return { resource: segs[0], id: null }
  return { resource: segs[segs.length - 2], id: segs[segs.length - 1] }
}

export const demoGuard = async (req, res, next) => {
  const method = req.method?.toUpperCase()
  if (!MUTATIONS.has(method)) return next()
  if (/\/login\b/.test(req.originalUrl)) return next()

  const decoded = decodeToken(req)
  if (!decoded?.isDemo) return next()

  const now = new Date().toISOString()

  if (method === 'DELETE') {
    return res.json({ ok: true, message: 'Eliminado' })
  }

  if (method === 'POST') {
    const body = req.body || {}
    return res.status(201).json({ ...body, _id: fakeId(), __v: 0, createdAt: now, updatedAt: now })
  }

  // PUT / PATCH — fetch the real document so the frontend gets the full object back
  const { resource, id } = parsePath(req.originalUrl)
  if (id && mongoose.Types.ObjectId.isValid(id)) {
    const Model = ROUTE_MODEL[resource]
    if (Model) {
      try {
        const existing = await Model.findById(id).lean()
        if (existing) {
          return res.json({ ...existing, ...req.body, _id: existing._id, updatedAt: now })
        }
      } catch { /* fall through to generic response */ }
    }
  }

  return res.json({ ...req.body, _id: id || fakeId(), updatedAt: now })
}
