import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String },
    mimetype: { type: String },
    data: { type: String, required: true },
    size: { type: Number },
}, { timestamps: true })

export default mongoose.model('File', fileSchema)
