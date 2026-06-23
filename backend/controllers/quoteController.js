import Quote from "../models/quoteModel.js"
import { registerAuditEvent } from "../services/auditService.js"

function calcItems(items = []) {
  return items.map(item => ({
    ...item,
    subtotal: Number(((item.cantidad || 0) * (item.precioUnitario || 0)).toFixed(2)),
    discountLabel: item.discountLabel || '',
    discountPct: item.discountPct || 0,
  }))
}

export const createQuote = async (req, res) => {
  try {
    const { titulo, cliente, items, descripcionGeneral, validezDias } = req.body
    const quote = new Quote({
      titulo,
      cliente: cliente || {},
      items: calcItems(items),
      descripcionGeneral: descripcionGeneral || '',
      validezDias: validezDias ?? 7,
      sellerId: req.user.id,
      vendedor: req.user.name || '',
    })
    await quote.save()
    await registerAuditEvent({
      action: "CREATE_QUOTE",
      entity: "Quote",
      entityId: quote._id,
      details: `Cotización #${quote.numero} "${titulo}" creada por ${req.user.name}`,
      performedBy: req.user.name,
    })
    res.status(201).json(quote)
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
    const { titulo, cliente, items, descripcionGeneral, validezDias, estado } = req.body
    const update = {
      titulo,
      cliente: cliente || {},
      items: calcItems(items),
      descripcionGeneral: descripcionGeneral || '',
      validezDias: validezDias ?? 7,
      estado,
      updatedAt: new Date(),
    }
    const quote = await Quote.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    if (!quote) return res.status(404).json({ message: "Cotización no encontrada" })
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
