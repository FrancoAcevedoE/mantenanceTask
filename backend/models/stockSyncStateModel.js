import mongoose from "mongoose"

const stockSyncStateSchema = new mongoose.Schema({
  scope: {
    type: String,
    required: true,
    unique: true,
    default: "raw-material"
  },
  lastImportAt: {
    type: Date,
    default: null
  },
  lastFileName: {
    type: String,
    default: ""
  },
  lastMode: {
    type: String,
    enum: ["overwrite", "accumulate"],
    default: "overwrite"
  },
  lastSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

stockSyncStateSchema.pre("save", function preSave() {
  this.updatedAt = new Date()
})

export default mongoose.model("StockSyncState", stockSyncStateSchema)
