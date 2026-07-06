import mongoose from 'mongoose'

const movimientoSchema = new mongoose.Schema({
  tipo:        { type: String, enum: ['entrada', 'salida'], required: true },
  cantidad:    { type: Number, required: true },
  motivo:      { type: String, default: '' },
  proveedor:   { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor' },
  precio:      { type: Number, default: 0 },
  fecha:       { type: Date, default: Date.now },
  usuario:     { type: String, default: '' },
}, { _id: true })

const materiaPrimaSchema = new mongoose.Schema({
  nombre:       { type: String, required: true, trim: true },
  codigo:       { type: String, default: '', trim: true },
  categoria:    { type: String, default: '' },          // Pigmento, Resina, Solvente, Aditivo, etc.
  unidad:       { type: String, default: 'kg' },        // kg, lt, unidad, etc.
  stock:        { type: Number, default: 0 },
  stockMinimo:  { type: Number, default: 0 },
  precio:       { type: Number, default: 0 },           // precio unitario actual
  proveedor:    { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor' },
  descripcion:  { type: String, default: '' },
  movimientos:  [movimientoSchema],
  activo:       { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('MateriaPrima', materiaPrimaSchema)
