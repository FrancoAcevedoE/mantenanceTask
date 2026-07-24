import mongoose from 'mongoose'

const criterioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
}, { _id: false })

// Documento singleton — siempre hay uno solo con key='default'
const proveedorConfigSchema = new mongoose.Schema({
  key:      { type: String, default: 'default', unique: true },
  criterios:{ type: [criterioSchema], default: [] },
}, { timestamps: true })

export default mongoose.model('ProveedorConfig', proveedorConfigSchema)
