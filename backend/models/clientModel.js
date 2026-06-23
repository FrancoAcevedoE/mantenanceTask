import mongoose from "mongoose"

const clientSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  company: { type: String, default: '' },

  razonSocial: { type: String, trim: true, default: '' },
  nombreComercial: { type: String, trim: true, default: '' },
  contactoPrincipal: { type: String, trim: true, default: '' },
  telefono: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  direccion: { type: String, trim: true, default: '' },
  observaciones: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  pipelineEstado: {
    type: String,
    enum: ['nuevo_lead', 'contactado', 'cotizacion_enviada', 'negociacion', 'ganado', 'perdido'],
    default: 'nuevo_lead'
  },
  lugar: { type: String, default: '' },
  latitud: { type: Number, default: null },
  longitud: { type: Number, default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdBy: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model("Client", clientSchema)
