import mongoose from "mongoose"

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  materialType: {
    type: String,
    default: "madera",
    trim: true
  },
  size: {
    type: String,
    default: "",
    trim: true
  },
  areaM2PerPlate: {
    type: Number,
    default: 0,
    min: 0
  },
  platesPerPallet: {
    type: Number,
    default: 1,
    min: 1
  },
  stockPlates: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    default: "",
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: ""
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

rawMaterialSchema.pre("save", function preSave() {
  this.updatedAt = new Date()
})

export default mongoose.model("RawMaterial", rawMaterialSchema)
