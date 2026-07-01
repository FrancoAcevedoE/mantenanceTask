import Quote from "../models/quoteModel.js"
import Client from "../models/clientModel.js"
import { registerAuditEvent } from "../services/auditService.js"
import { notifyQuoteSent } from "../services/crmNotificationService.js"

function calcItems(items = []) {
  return items.map(item => ({
    ...item,
    subtotal: Number(((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)),
    discountLabel: item.discountLabel || '',
    discountPct: item.discountPct || 0,
  }))
}

// Cuando una cotización pasa a "aceptada", convierte al cliente de potencial → normal
async function upgradeClientOnWin(clienteData, clienteId) {
  try {
    const patch = { tipoCliente: 'normal', pipelineEstado: 'ganado' }

    // 1. Link directo por clienteId (más preciso)
    if (clienteId) {
      await Client.findByIdAndUpdate(clienteId, { $set: patch })
      return
    }

    // 2. Fallback: match por email
    const email = (clienteData?.email || '').trim()
    if (email) {
      const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const hit = await Client.findOneAndUpdate(
        { email: new RegExp(`^${escaped}$`, 'i') },
        { $set: patch }
      )
      if (hit) return
    }

    // 3. Fallback: match por nombre de empresa o razón social
    const empresa = (clienteData?.empresa || clienteData?.nombre || '').trim()
    if (empresa) {
      const escaped = empresa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      await Client.findOneAndUpdate(
        { $or: [
          { razonSocial:     new RegExp(`^${escaped}$`, 'i') },
          { nombreComercial: new RegExp(`^${escaped}$`, 'i') },
          { name:            new RegExp(`^${escaped}$`, 'i') },
        ]},
        { $set: patch }
      )
    }
  } catch (err) {
    console.error('[upgradeClientOnWin] Error al actualizar cliente:', err.message)
  }
}

export const createQuote = async (req, res) => {
  try {
    const { titulo, cliente, items, descripcionGeneral, validezDias, clienteId } = req.body
    const quote = new Quote({
      titulo,
      cliente: cliente || {},
      items: calcItems(items),
      descripcionGeneral: descripcionGeneral || '',
      validezDias: validezDias ?? 7,
      clienteId: clienteId || null,
      sellerId: req.user.id,
      vendedor: req.user.name || '',
    })
    await quote.save()

    if (quote.estado === 'aceptada') {
      await upgradeClientOnWin(quote.cliente, clienteId)
    }

    // Actualizar fecha de última cotización en el cliente CRM
    if (clienteId) {
      Client.findByIdAndUpdate(clienteId, { lastQuoteAt: new Date() }).catch(() => {})
    }

    await registerAuditEvent({
      action: "CREATE_QUOTE",
      entity: "Quote",
      entityId: quote._id,
      details: `Cotización #${quote.numero} "${titulo}" creada por ${req.user.name}`,
      performedBy: req.user.name,
    })
    res.status(201).json(quote)
    const clienteName = quote.cliente?.nombre || quote.cliente?.empresa || quote.cliente?.razonSocial || 'cliente'
    notifyQuoteSent(titulo, clienteName).catch(() => {})
  } catch (error) {
    console.error("Error creating quote:", error)
    res.status(500).json({ message: "Error al crear cotización", error: error.message })
  }
}

export const getQuotes = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { sellerId: req.user.id }
    const quotes = await Quote.find(filter).sort({ createdAt: -1 })
    res.json(quotes)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cotizaciones", error: error.message })
  }
}

export const getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) return res.status(404).json({ message: "Cotización no encontrada" })
    res.json(quote)
  } catch (error) {
    res.status(500).json({ message: "Error al obtener cotización", error: error.message })
  }
}

export const updateQuote = async (req, res) => {
  try {
    const { titulo, cliente, items, descripcionGeneral, validezDias, estado, clienteId } = req.body

    // Leer estado anterior para detectar el cambio a "aceptada"
    const existing = await Quote.findById(req.params.id).lean()
    if (!existing) return res.status(404).json({ message: "Cotización no encontrada" })

    const update = {
      titulo,
      cliente: cliente || {},
      items: calcItems(items),
      descripcionGeneral: descripcionGeneral || '',
      validezDias: validezDias ?? 7,
      estado,
      updatedAt: new Date(),
    }
    if (clienteId !== undefined) update.clienteId = clienteId || null

    const quote = await Quote.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after' })

    // Auto-upgrade cliente cuando la cotización se marca como ganada
    const wasNotAccepted = existing.estado !== 'aceptada'
    const isNowAccepted  = estado === 'aceptada'
    if (wasNotAccepted && isNowAccepted) {
      await upgradeClientOnWin(
        update.cliente,
        clienteId ?? existing.clienteId
      )
    }

    // Actualizar fecha de última cotización en el cliente CRM
    const effectiveClienteId = clienteId ?? existing.clienteId
    if (effectiveClienteId) {
      Client.findByIdAndUpdate(effectiveClienteId, { lastQuoteAt: new Date() }).catch(() => {})
    }

    res.json(quote)
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cotización", error: error.message })
  }
}

export const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id)
    if (!quote) return res.status(404).json({ message: "Cotización no encontrada" })
    res.json({ message: "Cotización eliminada" })
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cotización", error: error.message })
  }
}
