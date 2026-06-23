import mongoose from "mongoose"

const activitySchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['llamada', 'reunion', 'correo', 'nota'],
    required: true
  },
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  clienteNombre: { type: String, default: '' },
  fechaProgramada: { type: Date, default: null },
  completada: { type: Boolean, default: false },
  realizadoPor: { type: String, default: '' },
  realizadoPorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

export default mongoose.model("Activity", activitySchema)
