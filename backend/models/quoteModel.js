import mongoose from "mongoose"

const itemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  nombre: { type: String, default: '' },
  codigo: { type: String, default: '' },
  tipo: { type: String, default: '' },
  terminacion: { type: String, default: '' },
  espesor: { type: String, default: '' },
  color: { type: String, default: '' },
  cantidad: { type: Number, default: 1, min: 0 },
  unidad: { type: String, default: 'unidad' },
  precioUnitario: { type: Number, default: 0, min: 0 },
  descripcion: { type: String, default: '' },
  subtotal: { type: Number, default: 0 },
  discountLabel: { type: String, default: '' },
  discountPct: { type: Number, default: 0 },
}, { _id: false })

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, default: '' },
  empresa: { type: String, default: '' },
  email: { type: String, default: '' },
  telefono: { type: String, default: '' },
}, { _id: false })

const quoteSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },
  titulo: { type: String, required: true },
  cliente: { type: clienteSchema, default: () => ({}) },
  items: { type: [itemSchema], default: [] },
  descripcionGeneral: { type: String, default: '' },
  validezDias: { type: Number, default: 7 },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendedor: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['borrador', 'enviada', 'aceptada', 'rechazada'],
    default: 'borrador',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

quoteSchema.pre('save', async function () {
  if (this.isNew && !this.numero) {
    const last = await this.constructor.findOne({}, { numero: 1 }, { sort: { numero: -1 } })
    this.numero = last ? last.numero + 1 : 1
  }
  this.updatedAt = new Date()
})

export default mongoose.model("Quote", quoteSchema)
