import mongoose from 'mongoose'

const ordenCompraSchema = new mongoose.Schema({
  nroOrden:       { type: String, required: true, trim: true },
  fecha:          { type: Date, required: true },
  proveedorNombre:{ type: String, required: true, trim: true },
  proveedorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', default: null },
  producto:       { type: String, required: true, trim: true },
  cantidad:       { type: Number, default: 0 },
  unidad:         { type: String, default: '' },
  precioUnitario: { type: Number, default: 0 },
  total:          { type: Number, default: 0 },
  estado:         { type: String, enum: ['pendiente', 'recibido', 'parcial', 'cancelado'], default: 'pendiente' },
  notas:          { type: String, default: '' },
  activo:         { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('OrdenCompra', ordenCompraSchema)
