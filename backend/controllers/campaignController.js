import Campaign from "../models/campaignModel.js"

export const getCampaigns = async (req, res) => {
  try {
    const filter = {}
    if (req.query.estado) filter.estado = req.query.estado
    const campaigns = await Campaign.find(filter).sort({ createdAt: -1 })
    res.json(campaigns)
  } catch (err) {
    res.status(500).json({ message: "Error al obtener campañas", error: err.message })
  }
}

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: "Error al obtener campaña", error: err.message })
  }
}

export const createCampaign = async (req, res) => {
  try {
    const { nombre, tipo, estado, descripcion, fechaInicio, fechaFin, segmento, stats } = req.body
    if (!nombre?.trim()) return res.status(400).json({ message: "El nombre es obligatorio" })
    const campaign = await Campaign.create({
      nombre: nombre.trim(),
      tipo: tipo || 'email',
      estado: estado || 'borrador',
      descripcion: descripcion || '',
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      segmento: {
        tipoCliente:     segmento?.tipoCliente || '',
        pipelineEstados: segmento?.pipelineEstados || [],
        clienteIds:      segmento?.clienteIds || [],
      },
      stats: {
        enviados:    stats?.enviados    ?? 0,
        abiertos:    stats?.abiertos    ?? 0,
        respondidos: stats?.respondidos ?? 0,
        convertidos: stats?.convertidos ?? 0,
      },
      createdBy: req.user?.name || '',
    })
    res.status(201).json(campaign)
  } catch (err) {
    res.status(500).json({ message: "Error al crear campaña", error: err.message })
  }
}

export const updateCampaign = async (req, res) => {
  try {
    const { nombre, tipo, estado, descripcion, fechaInicio, fechaFin, segmento, stats } = req.body
    const update = {}
    if (nombre     !== undefined) update.nombre      = nombre.trim()
    if (tipo       !== undefined) update.tipo        = tipo
    if (estado     !== undefined) update.estado      = estado
    if (descripcion !== undefined) update.descripcion = descripcion
    if (fechaInicio !== undefined) update.fechaInicio = fechaInicio || null
    if (fechaFin   !== undefined) update.fechaFin    = fechaFin || null
    if (segmento !== undefined) {
      update.segmento = {
        tipoCliente:     segmento.tipoCliente || '',
        pipelineEstados: segmento.pipelineEstados || [],
        clienteIds:      segmento.clienteIds || [],
      }
    }
    if (stats !== undefined) {
      update['stats.enviados']    = stats.enviados    ?? 0
      update['stats.abiertos']    = stats.abiertos    ?? 0
      update['stats.respondidos'] = stats.respondidos ?? 0
      update['stats.convertidos'] = stats.convertidos ?? 0
    }
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, { $set: update }, { new: true, runValidators: true }
    )
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json(campaign)
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar campaña", error: err.message })
  }
}

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id)
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json({ message: "Campaña eliminada" })
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar campaña", error: err.message })
  }
}
