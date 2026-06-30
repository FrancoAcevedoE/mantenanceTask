import Client from "../models/clientModel.js"
import { notifyNewClient } from "../services/crmNotificationService.js"

export const createClient = async (req, res) => {
  try {
    const {
      razonSocial, nombreComercial, contactoPrincipal,
      cuitCuil, telefono, telefonos, email, direccion, observaciones, estado, pipelineEstado,
      lugar, latitud, longitud
    } = req.body

    const displayName = (razonSocial || '').trim()
    if (!displayName) {
      return res.status(400).json({ message: "La razón social es obligatoria" })
    }

    const cleanTelefonos = Array.isArray(telefonos)
      ? telefonos.filter(t => (t.numero || '').trim())
      : []

    const client = await Client.create({
      razonSocial: displayName,
      nombreComercial: (nombreComercial || '').trim(),
      contactoPrincipal: (contactoPrincipal || '').trim(),
      cuitCuil: (cuitCuil || '').trim(),
      telefono: (telefono || '').trim(),
      telefonos: cleanTelefonos,
      email: (email || '').trim(),
      direccion: (direccion || '').trim(),
      observaciones: observaciones || '',
      estado: estado || 'activo',
      pipelineEstado: pipelineEstado || 'nuevo_lead',
      tipoCliente: req.body.tipoCliente || 'potencial',
      lugar: (lugar || '').trim(),
      latitud: latitud != null ? Number(latitud) : null,
      longitud: longitud != null ? Number(longitud) : null,
      createdBy: req.user?.name || '',
    })

    res.status(201).json(client)
    notifyNewClient(client.razonSocial || client.name || '').catch(() => {})
  } catch (error) {
    console.error("Error creating client:", error)
    res.status(500).json({ message: "Error al crear cliente", error: error.message })
  }
}

export const getClients = async (req, res) => {
  try {
    const { search, estado, pipelineEstado, includeDeleted } = req.query
    const filter = {}

    if (String(includeDeleted || '').toLowerCase() !== 'true') {
      filter.isDeleted = { $ne: true }
    }

    if (estado) filter.estado = estado
    if (pipelineEstado) filter.pipelineEstado = pipelineEstado

    if (search?.trim()) {
      const rx = new RegExp(search.trim(), 'i')
      filter.$or = [
        { razonSocial: rx },
        { nombreComercial: rx },
        { contactoPrincipal: rx },
        { email: rx },
        { telefono: rx },
        { 'telefonos.numero': rx },
        { name: rx },
        { company: rx },
      ]
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes", error: error.message })
  }
}

export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" })
    res.json(client)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cliente", error: error.message })
  }
}

export const updateClient = async (req, res) => {
  try {
    const {
      razonSocial, nombreComercial, contactoPrincipal,
      cuitCuil, telefono, telefonos, email, direccion, observaciones, estado, pipelineEstado,
      lugar, latitud, longitud
    } = req.body

    const update = {}
    if (razonSocial !== undefined) update.razonSocial = razonSocial.trim()
    if (nombreComercial !== undefined) update.nombreComercial = nombreComercial.trim()
    if (contactoPrincipal !== undefined) update.contactoPrincipal = contactoPrincipal.trim()
    if (cuitCuil !== undefined) update.cuitCuil = cuitCuil.trim()
    if (telefono !== undefined) update.telefono = telefono.trim()
    if (telefonos !== undefined) {
      update.telefonos = Array.isArray(telefonos)
        ? telefonos.filter(t => (t.numero || '').trim())
        : []
    }
    if (email !== undefined) update.email = email.trim()
    if (direccion !== undefined) update.direccion = direccion.trim()
    if (observaciones !== undefined) update.observaciones = observaciones
    if (estado !== undefined) update.estado = estado
    if (pipelineEstado !== undefined) update.pipelineEstado = pipelineEstado
    if (lugar !== undefined) update.lugar = lugar.trim()
    if (latitud !== undefined) update.latitud = latitud != null ? Number(latitud) : null
    if (longitud !== undefined) update.longitud = longitud != null ? Number(longitud) : null
    if (req.body.tipoCliente !== undefined) update.tipoCliente = req.body.tipoCliente

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    )
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" })
    res.json(client)
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error: error.message })
  }
}

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!client) return res.status(404).json({ message: "Cliente no encontrado" })
    res.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cliente", error: error.message })
  }
}
