import mongoose from "mongoose"

const notificationLogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    default: "system",
    trim: true
  },
  severity: {
    type: String,
    enum: ["success", "warning", "error", "info"],
    default: "info"
  },
  source: {
    type: String,
    default: "system",
    trim: true
  },
  machine: {
    type: String,
    default: "",
    trim: true
  },
  sector: {
    type: String,
    default: "",
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model("NotificationLog", notificationLogSchema)