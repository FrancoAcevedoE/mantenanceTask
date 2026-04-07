import mongoose from "mongoose"

const stockPurchaseRecordSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    trim: true
  },
  sourceFileName: {
    type: String,
    default: "",
    trim: true
  },
  importMode: {
    type: String,
    enum: ["overwrite", "accumulate"],
    default: "accumulate"
  },
  applyStock: {
    type: Boolean,
    default: true
  },
  rowNumber: {
    type: Number,
    required: true
  },
  code: {
    type: String,
    default: "",
    trim: true
  },
  supplier: {
    type: String,
    default: "",
    trim: true
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  quality: {
    type: String,
    default: "",
    trim: true
  },
  size: {
    type: String,
    default: "",
    trim: true
  },
  thicknessMm: {
    type: Number,
    default: 0,
    min: 0
  },
  widthM: {
    type: Number,
    default: 0,
    min: 0
  },
  lengthM: {
    type: Number,
    default: 0,
    min: 0
  },
  m2PerPlate: {
    type: Number,
    default: 0,
    min: 0
  },
  platesPerPallet: {
    type: Number,
    default: 1,
    min: 1
  },
  palletCount: {
    type: Number,
    default: 0,
    min: 0
  },
  platesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalM2: {
    type: Number,
    default: 0,
    min: 0
  },
  rawMaterialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RawMaterial",
    default: null
  },
  stockBeforePlates: {
    type: Number,
    default: 0,
    min: 0
  },
  stockAfterPlates: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model("StockPurchaseRecord", stockPurchaseRecordSchema)
