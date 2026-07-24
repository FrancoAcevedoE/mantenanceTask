import mongoose from 'mongoose'

const criterioCSchema = new mongoose.Schema({
  nombre: { type: String, default: '' },
  valor:  { type: String, enum: ['A', 'B', 'C'], default: 'A' },
}, { _id: false })

const calificacionSchema = new mongoose.Schema({
  fecha:     { type: Date, default: Date.now },
  criterios: [criterioCSchema],
  comentario:{ type: String, default: '' },
  usuario:   { type: String, default: '' },
}, { _id: true })

const evaluacionSchema = new mongoose.Schema({
  fecha:        { type: Date, default: Date.now },
  calidad:      { type: Number, min: 1, max: 5 },   // 1-5 estrellas
  tiempoEntrega:{ type: Number, min: 1, max: 5 },
  precio:       { type: Number, min: 1, max: 5 },
  servicio:     { type: Number, min: 1, max: 5 },
  comentario:   { type: String, default: '' },
  usuario:      { type: String, default: '' },
}, { _id: true })

const proveedorSchema = new mongoose.Schema({
  nombre:       { type: String, required: true, trim: true },
  razonSocial:  { type: String, default: '' },
  cuit:         { type: String, default: '' },
  contacto:     { type: String, default: '' },
  telefono:     { type: String, default: '' },
  email:        { type: String, default: '' },
  direccion:    { type: String, default: '' },
  ciudad:       { type: String, default: '' },
  categoria:    { type: String, default: '' },        // qué tipo de materia prima provee
  web:          { type: String, default: '' },
  notas:        { type: String, default: '' },
  evaluaciones:  [evaluacionSchema],
  calificaciones:[calificacionSchema],
  activo:        { type: Boolean, default: true },
}, { timestamps: true })

proveedorSchema.virtual('promedioEvaluacion').get(function () {
  if (!this.evaluaciones.length) return null
  const sum = this.evaluaciones.reduce((acc, e) => {
    return acc + ((e.calidad + e.tiempoEntrega + e.precio + e.servicio) / 4)
  }, 0)
  return Math.round((sum / this.evaluaciones.length) * 10) / 10
})

proveedorSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Proveedor', proveedorSchema)
