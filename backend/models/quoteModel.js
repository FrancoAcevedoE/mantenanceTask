import mongoose from "mongoose"

const quoteSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantityM2: {
        type: Number,
        required: true
    },
    totalPriceWithoutDiscount: {
        type: Number,
        required: true
    },
    totalPriceWithDiscount: {
        type: Number,
        required: true
    },
    discountApplied: {
        type: Number, // percentage
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model("Quote", quoteSchema)