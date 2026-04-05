import mongoose from "mongoose"
import dotenv from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import Maintenance from "../models/mantenanceModels.js"
import User from "../models/userModels.js"
import AuditLog from "../models/auditLogModel.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, "../.env") })

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mantenanceDB"
const shouldWrite = process.argv.includes("--write")

const toUserSnapshot = (userDoc) => ({
  userId: userDoc?._id ? String(userDoc._id) : "",
  name: String(userDoc?.name || "").trim(),
  dni: Number.isFinite(Number(userDoc?.dni)) ? Number(userDoc?.dni) : null,
  role: String(userDoc?.role || "").trim()
})

const isValidSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object") return false
  const name = String(snapshot.name || "").trim()
  return Boolean(name)
}

const buildFallbackDeletedSnapshot = (userId) => ({
  userId: userId ? String(userId) : "",
  name: "Usuario eliminado",
  dni: null,
  role: "operario"
})

const run = async () => {
  await mongoose.connect(mongoURI)

  const maintenances = await Maintenance.find()
    .select("clientId additionalWorkers clientSnapshot additionalWorkersSnapshots")
    .lean()

  let scanned = 0
  let toUpdate = 0
  let updated = 0

  for (const maintenance of maintenances) {
    scanned += 1

    const updates = {}

    const clientId = maintenance?.clientId ? String(maintenance.clientId) : ""
    const hasValidClientSnapshot = isValidSnapshot(maintenance.clientSnapshot)

    if (!hasValidClientSnapshot) {
      if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
        const client = await User.findById(clientId).select("name dni role").lean()
        updates.clientSnapshot = client
          ? toUserSnapshot(client)
          : buildFallbackDeletedSnapshot(clientId)
      } else {
        updates.clientSnapshot = buildFallbackDeletedSnapshot(clientId)
      }
    }

    const workerIds = Array.isArray(maintenance.additionalWorkers)
      ? maintenance.additionalWorkers.map((id) => String(id)).filter(Boolean)
      : []

    const currentWorkerSnapshots = Array.isArray(maintenance.additionalWorkersSnapshots)
      ? maintenance.additionalWorkersSnapshots.filter(isValidSnapshot)
      : []

    const snapshotByUserId = new Map(
      currentWorkerSnapshots
        .filter((snapshot) => String(snapshot.userId || "").trim())
        .map((snapshot) => [String(snapshot.userId), snapshot])
    )

    const rebuiltSnapshots = []

    for (const workerId of workerIds) {
      if (snapshotByUserId.has(workerId)) {
        rebuiltSnapshots.push(snapshotByUserId.get(workerId))
        continue
      }

      if (mongoose.Types.ObjectId.isValid(workerId)) {
        const worker = await User.findById(workerId).select("name dni role").lean()
        rebuiltSnapshots.push(worker ? toUserSnapshot(worker) : buildFallbackDeletedSnapshot(workerId))
      } else {
        rebuiltSnapshots.push(buildFallbackDeletedSnapshot(workerId))
      }
    }

    if (workerIds.length && rebuiltSnapshots.length) {
      const hasSnapshotsBefore = currentWorkerSnapshots.length > 0
      const hasDifferentLength = rebuiltSnapshots.length !== currentWorkerSnapshots.length

      if (!hasSnapshotsBefore || hasDifferentLength) {
        updates.additionalWorkersSnapshots = rebuiltSnapshots
      }
    }

    if (Object.keys(updates).length) {
      toUpdate += 1

      if (shouldWrite) {
        await Maintenance.updateOne({ _id: maintenance._id }, { $set: updates })
        updated += 1
      }
    }
  }

  console.log("Backfill maintenance snapshots")
  console.log(`Scanned: ${scanned}`)
  console.log(`Need update: ${toUpdate}`)

  if (!shouldWrite) {
    console.log("Dry run mode (sin cambios). Ejecuta con --write para aplicar.")
  } else {
    await AuditLog.create({
      action: "MAINTENANCE_SNAPSHOT_BACKFILL",
      entityType: "maintenance",
      entityId: "bulk",
      description: "Backfill de snapshots historicos de mantenimiento",
      actor: {
        userId: "",
        name: "Sistema",
        dni: null,
        role: "system"
      },
      metadata: {
        scanned,
        updated
      }
    })

    console.log(`Updated: ${updated}`)
  }

  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error("Error en backfill:", error)
  try {
    await mongoose.disconnect()
  } catch {
    // noop
  }
  process.exit(1)
})
