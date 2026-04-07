import mongoose from "mongoose"

const stockMovementSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RawMaterial",
    required: true
  },
  movementType: {
    type: String,
    enum: ["in", "out"],
    required: true
  },
  pallets: {
    type: Number,
    default: 0,
    min: 0
  },
  plates: {
    type: Number,
    default: 0,
    min: 0
  },
  deltaPlates: {
    type: Number,
    required: true
  },
  stockAfterPlates: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    default: "",
    trim: true
  },
  performedBy: {
    userId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      default: ""
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model("StockMovement", stockMovementSchema)
