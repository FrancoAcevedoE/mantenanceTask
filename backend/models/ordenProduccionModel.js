import mongoose from 'mongoose'

const ordenProduccionSchema = new mongoose.Schema({
  numero:         { type: Number },
  producto:       { type: String, required: true },    // nombre del producto a fabricar
  productoId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  color:          { type: String, default: '' },
  terminacion:    { type: String, default: '' },
  tipo:           { type: String, default: '' },
  cantidad:       { type: Number, required: true },
  unidad:         { type: String, default: 'placa' },
  fechaProgramada:{ type: Date, required: true },
  fechaFin:       { type: Date },
  prioridad:      { type: String, enum: ['baja', 'normal', 'alta', 'urgente'], default: 'normal' },
  estado:         { type: String, enum: ['programada', 'en_proceso', 'completada', 'cancelada'], default: 'programada' },
  formulaResina:  { type: mongoose.Schema.Types.ObjectId, ref: 'FormulaResina' },
  notas:          { type: String, default: '' },
  operario:       { type: String, default: '' },
}, { timestamps: true })

ordenProduccionSchema.pre('save', async function (next) {
  if (!this.numero) {
    const last = await this.constructor.findOne({}, {}, { sort: { numero: -1 } })
    this.numero = last ? last.numero + 1 : 1
  }
  next()
})

export default mongoose.model('OrdenProduccion', ordenProduccionSchema)
