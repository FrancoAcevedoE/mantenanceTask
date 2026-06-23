import mongoose from 'mongoose'

const tramoSchema = new mongoose.Schema({
  desdeHojas: { type: Number },
  hastaHojas: { type: Number, default: null }, // null = sin límite
  porcCantidad: { type: Number },              // % dto por cantidad
  porcContado: { type: Number },               // % dto pago contado
  porc30dias: { type: Number },                // % dto a 30 días f.f.
  // Concatenados pre-calculados: (1 - (1-a)(1-b)) * 100
  porcCantidadContado: { type: Number },
  porcCantidad30dias: { type: Number },
  nota: { type: String },
}, { _id: false })

const productGroupSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descuentos: [tramoSchema],
  notas: { type: String },
}, { timestamps: true })

export default mongoose.model('ProductGroup', productGroupSchema)
