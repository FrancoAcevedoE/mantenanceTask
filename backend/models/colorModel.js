import mongoose from 'mongoose'

const colorSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tipo: { type: String, default: '' },
    grupoColor: { type: Number, required: true, enum: [1, 2, 3] },
    image: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Color', colorSchema)
