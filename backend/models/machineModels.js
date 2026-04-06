import mongoose from "mongoose"

const machineSchema = new mongoose.Schema({
  sector: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  machineParts: {
    type: [String],
    required: true
  },
  horometro: {
    type: Number,
    default: 0
  },
  horometroHistory: {
    type: [
      {
        value: {
          type: Number,
          required: true,
          min: 0
        },
        recordedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    default: []
  },
  instructions: {
    type: String,
    default: ""
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
  }
})

export default mongoose.model("Machine", machineSchema)
