import mongoose from "mongoose"

const salesDocSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  title:     { type: String, default: '' },
  content:   { type: String, default: '' },
  updatedBy: { type: String, default: '' },
  pdfUrl:    { type: String, default: '' },
  pdfName:   { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model("SalesDoc", salesDocSchema)
