import AuditLog from "../models/auditLogModel.js"
import User from "../models/userModels.js"

const toSafeString = (value) => String(value || "").trim()

const buildActorFromRequest = async (req) => {
  const actorId = toSafeString(req?.user?.id)
  const actorRole = toSafeString(req?.user?.role)

  if (!actorId) {
    return {
      userId: "",
      name: "Sistema",
      dni: null,
      role: actorRole || "system"
    }
  }

  const actorUser = await User.findById(actorId).select("name dni role").lean()

  return {
    userId: actorId,
    name: toSafeString(actorUser?.name),
    dni: Number.isFinite(Number(actorUser?.dni)) ? Number(actorUser.dni) : null,
    role: toSafeString(actorUser?.role) || actorRole
  }
}

export const registerAuditEvent = async ({
  req,
  action,
  entityType,
  entityId,
  description,
  metadata = {}
}) => {
  try {
    const actor = await buildActorFromRequest(req)

    await AuditLog.create({
      action,
      entityType,
      entityId: toSafeString(entityId),
      description,
      actor,
      metadata
    })
  } catch (error) {
    // No se interrumpe el flujo principal por un fallo de auditoria.
    console.error("No se pudo registrar evento de auditoria", error)
  }
}

export const buildAuditCsv = (items = []) => {
  const escapeCsv = (value) => {
    const normalized = String(value ?? "")
    if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
      return `"${normalized.replace(/\"/g, '""')}"`
    }
    return normalized
  }

  const header = [
    "fecha",
    "accion",
    "entidad",
    "entidadId",
    "actorId",
    "actorNombre",
    "actorDni",
    "actorRol",
    "descripcion",
    "metadata"
  ]

  const rows = items.map((item) => {
    const metadataJson = JSON.stringify(item.metadata || {})

    return [
      new Date(item.createdAt).toISOString(),
      item.action,
      item.entityType,
      item.entityId,
      item.actor?.userId || "",
      item.actor?.name || "",
      item.actor?.dni ?? "",
      item.actor?.role || "",
      item.description || "",
      metadataJson
    ].map(escapeCsv).join(",")
  })

  return [header.join(","), ...rows].join("\n")
}