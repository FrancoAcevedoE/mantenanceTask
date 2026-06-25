import ProductGroup from '../models/productGroupModel.js'
import { registerAuditEvent } from '../services/auditService.js'

function concat(a, b) {
  return Math.round((1 - (1 - a / 100) * (1 - b / 100)) * 10000) / 100
}

export const getGroups = async (req, res) => {
  try {
    const groups = await ProductGroup.find().sort({ nombre: 1 })
    res.json(groups)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getGroupByNombre = async (req, res) => {
  try {
    const group = await ProductGroup.findOne({ nombre: req.params.nombre })
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' })
    res.json(group)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createGroup = async (req, res) => {
  try {
    const { nombre, descuentos, notas } = req.body
    if (!nombre?.trim()) return res.status(400).json({ message: 'El nombre es obligatorio' })

    const processed = (descuentos || []).map(t => ({
      ...t,
      porcCantidadContado: t.porcCantidadContado ?? concat(t.porcCantidad || 0, t.porcContado || 0),
      porcCantidad30dias: t.porcCantidad30dias ?? concat(t.porcCantidad || 0, t.porc30dias || 0),
    }))

    const group = await ProductGroup.create({ nombre: nombre.trim(), descuentos: processed, notas })

    await registerAuditEvent({
      req, action: 'CREATE_GROUP', entityType: 'ProductGroup',
      entityId: group._id, description: `Grupo creado: ${nombre}`,
    })

    res.status(201).json(group)
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Ya existe un grupo con ese nombre' })
    res.status(500).json({ message: err.message })
  }
}

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descuentos, notas } = req.body

    const processed = (descuentos || []).map(t => ({
      ...t,
      porcCantidadContado: t.porcCantidadContado ?? concat(t.porcCantidad || 0, t.porcContado || 0),
      porcCantidad30dias: t.porcCantidad30dias ?? concat(t.porcCantidad || 0, t.porc30dias || 0),
    }))

    const group = await ProductGroup.findByIdAndUpdate(id, {
      nombre, descuentos: processed, notas
    }, { returnDocument: 'after' })

    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' })

    await registerAuditEvent({
      req, action: 'UPDATE_GROUP', entityType: 'ProductGroup',
      entityId: group._id, description: `Grupo actualizado: ${nombre}`,
    })

    res.json(group)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const group = await ProductGroup.findByIdAndDelete(req.params.id)
    if (!group) return res.status(404).json({ message: 'Grupo no encontrado' })

    await registerAuditEvent({
      req, action: 'DELETE_GROUP', entityType: 'ProductGroup',
      entityId: group._id, description: `Grupo eliminado: ${group.nombre}`,
    })

    res.json({ message: 'Grupo eliminado' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
