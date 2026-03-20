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
    type: String,
    required: true
  },
  horometro: {
    type: Number,
    default: 0
  },
  instructions: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model("Machine", machineSchema)
