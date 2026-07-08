import mongoose from "mongoose"

const campaignSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  tipo:        { type: String, enum: ['email', 'whatsapp', 'mixta', 'llamada'], default: 'email' },
  estado:      { type: String, enum: ['borrador', 'activa', 'pausada', 'finalizada'], default: 'borrador' },
  descripcion: { type: String, default: '' },
  fechaInicio: { type: Date, default: null },
  fechaFin:    { type: Date, default: null },
  segmento: {
    tipoCliente:     { type: String, default: '' },
    pipelineEstados: { type: [String], default: [] },
    clienteIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
  },
  stats: {
    enviados:    { type: Number, default: 0 },
    abiertos:    { type: Number, default: 0 },
    respondidos: { type: Number, default: 0 },
    convertidos: { type: Number, default: 0 },
  },
  coverImage: {
    url:      { type: String, default: '' },
    name:     { type: String, default: '' },
    mimetype: { type: String, default: '' },
  },
  attachments: [{
    url:      { type: String },
    name:     { type: String },
    mimetype: { type: String },
    size:     { type: Number },
  }],
  createdBy: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Campaign', campaignSchema)
