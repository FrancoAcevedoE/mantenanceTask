import mongoose from 'mongoose'

const registroProduccionSchema = new mongoose.Schema({
  ordenProduccion: { type: mongoose.Schema.Types.ObjectId, ref: 'OrdenProduccion' },
  producto:        { type: String, required: true },
  productoId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  color:           { type: String, default: '' },
  terminacion:     { type: String, default: '' },
  tipo:            { type: String, default: '' },
  espesor:         { type: String, default: '' },
  cantidadProgramada: { type: Number, default: 0 },
  cantidadPrimera: { type: Number, default: 0 },   // 1ra calidad
  cantidadSegunda: { type: Number, default: 0 },   // 2da calidad
  cantidadDesecho: { type: Number, default: 0 },   // desecho / rezago
  unidad:          { type: String, default: 'placa' },
  fecha:           { type: Date, default: Date.now },
  turno:           { type: String, enum: ['mañana', 'tarde', 'noche', ''], default: '' },
  operario:        { type: String, default: '' },
  formulaResina:   { type: mongoose.Schema.Types.ObjectId, ref: 'FormulaResina' },
  comentarios:     { type: String, default: '' },
  observacionCalidad: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('RegistroProduccion', registroProduccionSchema)
