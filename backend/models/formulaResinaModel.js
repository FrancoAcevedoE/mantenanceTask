import mongoose from 'mongoose'

const ingredienteSchema = new mongoose.Schema({
  materiaPrima: { type: mongoose.Schema.Types.ObjectId, ref: 'MateriaPrima', required: true },
  cantidad:     { type: Number, required: true },   // en la unidad de la materia prima
  unidad:       { type: String, default: 'kg' },
}, { _id: true })

const formulaResinaSchema = new mongoose.Schema({
  nombre:        { type: String, required: true, trim: true },
  codigo:        { type: String, default: '' },
  descripcion:   { type: String, default: '' },
  ingredientes:  [ingredienteSchema],
  rendimiento:   { type: Number, default: 0 },      // litros / kg que produce
  unidadRendimiento: { type: String, default: 'kg' },
  costoTotal:    { type: Number, default: 0 },       // calculado
  activo:        { type: Boolean, default: true },
  notas:         { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('FormulaResina', formulaResinaSchema)
