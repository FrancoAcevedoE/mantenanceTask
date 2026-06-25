import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    prefijo: { type: String },
    tipo: { type: String },
    espesor: { type: String },
    detalle: { type: String },
    terminacion: { type: String },
    color: { type: String },
    medida: { type: String },
    nomenclaturaMedida: { type: String },
    m2: { type: Number },
    grupo: { type: String },
    image: { type: String },
    precio: { type: Number },
    unidadPrecio: { type: String, default: 'hoja' },
    admiteDescuentos: { type: Boolean, default: true },
    comentario: { type: String },
    stock: { type: Number, default: 0 },
    colors: [{ type: String }],
    dimensions: { type: String },
    thicknesses: [{ type: String }],
    pricePerM2: { type: Number, default: null },
    precioGrupoI: { type: Number },
    precioGrupoII: { type: Number },
    precioGrupoIII: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

export default mongoose.model("Product", productSchema)
