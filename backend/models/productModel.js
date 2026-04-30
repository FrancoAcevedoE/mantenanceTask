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
        required: true
    },
    discounts: [{
        quantity: Number, // min quantity for discount
        discountPercent: Number
    }],
    image: {
        type: String // path to image
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