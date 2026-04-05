import mongoose from "mongoose"

const auditActorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: ""
    },
    dni: {
      type: Number,
      default: null
    },
    role: {
      type: String,
      default: ""
    }
  },
  { _id: false }
)

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: String,
    default: "",
    trim: true
  },
  description: {
    type: String,
    default: "",
    trim: true
  },
  actor: {
    type: auditActorSchema,
    default: () => ({})
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

export default mongoose.model("AuditLog", auditLogSchema)