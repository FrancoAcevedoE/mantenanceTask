import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    colors: [{
        type: String
    }],
    dimensions: {
        type: String // e.g., "200x300 cm"
    },
    thicknesses: [{
        type: String // e.g., "10mm", "15mm"
    }],
    pricePerM2: {
        type: Number,
        default: null
    },
    discounts: [{
        quantity: Number, // min quantity for discount
        discountPercent: Number
    }],
    image: {
        type: String
    },
    grupo: {
        type: String
    },
    tipo: {
        type: String
    },
    terminacion: {
        type: String
    },
    precioGrupoI: {
        type: Number
    },
    precioGrupoII: {
        type: Number
    },
    precioGrupoIII: {
        type: Number
    },
    precioEscolares: {
        type: Number
    },
    unidadPrecio: {
        type: String,
        default: 'm2'
    },
    comentario: {
        type: String
    },
    produccionMinima: {
        type: Number,
        default: null
    },
    admiteDescuentos: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model("Product", productSchema)