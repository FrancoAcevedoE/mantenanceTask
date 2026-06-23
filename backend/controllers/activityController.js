import Activity from "../models/activityModel.js"
import Client from "../models/clientModel.js"

export const createActivity = async (req, res) => {
  try {
    const { tipo, titulo, descripcion, clienteId, fechaProgramada, completada } = req.body

    if (!tipo || !titulo?.trim() || !clienteId) {
      return res.status(400).json({ message: "tipo, titulo y clienteId son obligatorios" })
    }

    const client = await Client.findById(clienteId).lean()

    const activity = await Activity.create({
      tipo,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      clienteId,
      clienteNombre: client?.razonSocial || client?.name || '',
      fechaProgramada: fechaProgramada || null,
      completada: completada ?? false,
      realizadoPor: req.user?.name || '',
      realizadoPorId: req.user?.id || null,
    })

    res.status(201).json(activity)
  } catch (error) {
    console.error("Error creating activity:", error)
    res.status(500).json({ message: "Error al crear actividad", error: error.message })
  }
}

export const getActivities = async (req, res) => {
  try {
    const { clienteId, tipo, completada } = req.query
    const filter = {}

    if (clienteId) filter.clienteId = clienteId
    if (tipo) filter.tipo = tipo
    if (completada !== undefined) filter.completada = String(completada) === 'true'

    const activities = await Activity.find(filter).sort({ createdAt: -1 }).limit(300)
    res.json(activities)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener actividades", error: error.message })
  }
}

export const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
    if (!activity) return res.status(404).json({ message: "Actividad no encontrada" })
    res.json(activity)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener actividad", error: error.message })
  }
}

export const updateActivity = async (req, res) => {
  try {
    const { tipo, titulo, descripcion, fechaProgramada, completada } = req.body
    const update = {}

    if (tipo !== undefined) update.tipo = tipo
    if (titulo !== undefined) update.titulo = titulo.trim()
    if (descripcion !== undefined) update.descripcion = descripcion
    if (fechaProgramada !== undefined) update.fechaProgramada = fechaProgramada || null
    if (completada !== undefined) update.completada = completada

    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
    if (!activity) return res.status(404).json({ message: "Actividad no encontrada" })
    res.json(activity)
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar actividad", error: error.message })
  }
}

export const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id)
    if (!activity) return res.status(404).json({ message: "Actividad no encontrada" })
    res.json({ message: "Actividad eliminada" })
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar actividad", error: error.message })
  }
}
