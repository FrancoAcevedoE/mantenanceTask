import User from "../models/userModels.js"
import jwt from "jsonwebtoken"
import {
    getPushPublicConfig,
    removeUserPushSubscription,
    saveUserPushSubscription
} from "../services/pushService.js"
import AuditLog from "../models/auditLogModel.js"
import { buildAuditCsv, registerAuditEvent } from "../services/auditService.js"

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"

export const login = async (req, res) => {

    try {

        const dniRaw = String(req.body.dni ?? "").trim()
        const passwordRaw = String(req.body.password ?? "").trim()

        if (!/^\d{8}$/.test(dniRaw)) {
            return res.status(400).json({
                message: "El usuario debe ser un DNI de 8 digitos numericos"
            })
        }

        if (!/^\d{4}$/.test(passwordRaw)) {
            return res.status(400).json({
                message: "La contrasena debe tener 4 digitos numericos"
            })
        }

        const dniNumber = Number(dniRaw)
        const passwordNumber = Number(passwordRaw)

        const user = await User.findOne({
            dni: dniNumber,
            password: passwordNumber
        })

        if (!user) {
            return res.status(401).json({
                message: "Credenciales invalidas"
            })
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: "4h" }
        )

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                dni: user.dni,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al iniciar sesion",
            detail: error.message
        })
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("name dni role")
            .sort({ name: 1 })

        res.json(users)
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuarios"
        })
    }
}

export const getPushPublicKey = async (req, res) => {
    const pushConfig = getPushPublicConfig()

    res.json({
        ok: true,
        ...pushConfig
    })
}

export const subscribeToPush = async (req, res) => {
    try {
        const savedSubscription = await saveUserPushSubscription(req.user.id, req.body.subscription)

        res.json({
            ok: true,
            subscription: savedSubscription
        })
    } catch (error) {
        res.status(400).json({
            message: error.message || "No se pudo guardar la suscripcion push"
        })
    }
}

export const unsubscribeFromPush = async (req, res) => {
    try {
        await removeUserPushSubscription(req.user.id, req.body.endpoint)

        res.json({
            ok: true
        })
    } catch (error) {
        res.status(400).json({
            message: error.message || "No se pudo quitar la suscripcion push"
        })
    }
}

export const getOperarios = async (req, res) => {
    try {
        const operarios = await User.find({ role: "operario" })
            .select("name dni role")
            .sort({ name: 1 })

        res.json(operarios)
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener operarios"
        })
    }
}

export const createUser = async (req, res) => {
    try {
        const { name, role } = req.body
        const dniRaw = String(req.body.dni ?? "").trim()
        const passwordRaw = String(req.body.password ?? "").trim()

        if (!name || !dniRaw || !passwordRaw) {
            return res.status(400).json({
                message: "Nombre, documento y contrasena son obligatorios"
            })
        }

        if (!/^\d{8}$/.test(dniRaw)) {
            return res.status(400).json({
                message: "El documento debe tener exactamente 8 digitos numericos"
            })
        }

        if (!/^\d{4}$/.test(passwordRaw)) {
            return res.status(400).json({
                message: "La contrasena debe tener exactamente 4 digitos numericos"
            })
        }

        const dni = Number(dniRaw)
        const password = Number(passwordRaw)

        const existingUser = await User.findOne({ dni })

        if (existingUser) {
            return res.status(409).json({
                message: "Ya existe un usuario con ese documento"
            })
        }

        const user = await User.create({
            name,
            dni,
            password,
            role: role || "operario"
        })

        await registerAuditEvent({
            req,
            action: "USER_CREATED",
            entityType: "user",
            entityId: user._id,
            description: `Se creo el usuario ${user.name}`,
            metadata: {
                createdUser: {
                    id: String(user._id),
                    name: user.name,
                    dni: user.dni,
                    role: user.role
                }
            }
        })

        res.status(201).json({
            message: "Usuario creado correctamente",
            user: {
                id: user._id,
                name: user.name,
                dni: user.dni,
                role: user.role
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al crear usuario"
        })
    }
}

export const updateUser = async (req, res) => {
    try {
        const { name, role } = req.body
        const dniRaw = req.body.dni !== undefined ? String(req.body.dni).trim() : undefined
        const passwordRaw = req.body.password !== undefined ? String(req.body.password).trim() : undefined

        const updateData = {}

        if (name !== undefined) {
            const normalizedName = String(name).trim()
            if (!normalizedName) {
                return res.status(400).json({
                    message: "El nombre no puede estar vacio"
                })
            }
            updateData.name = normalizedName
        }

        if (role !== undefined) {
            if (!["admin", "operario", "supervisor"].includes(role)) {
                return res.status(400).json({
                    message: "Rol invalido"
                })
            }
            updateData.role = role
        }

        if (dniRaw !== undefined) {
            if (!/^\d{8}$/.test(dniRaw)) {
                return res.status(400).json({
                    message: "El documento debe tener exactamente 8 digitos numericos"
                })
            }

            const dni = Number(dniRaw)
            const existingUser = await User.findOne({ dni, _id: { $ne: req.params.id } })

            if (existingUser) {
                return res.status(409).json({
                    message: "Ya existe un usuario con ese documento"
                })
            }

            updateData.dni = dni
        }

        if (passwordRaw !== undefined && passwordRaw !== "") {
            if (!/^\d{4}$/.test(passwordRaw)) {
                return res.status(400).json({
                    message: "La contrasena debe tener exactamente 4 digitos numericos"
                })
            }
            updateData.password = Number(passwordRaw)
        }

        const previousUser = await User.findById(req.params.id)
            .select("name dni role")
            .lean()

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("name dni role")

        if (!updatedUser) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        await registerAuditEvent({
            req,
            action: "USER_UPDATED",
            entityType: "user",
            entityId: updatedUser._id,
            description: `Se actualizo el usuario ${updatedUser.name}`,
            metadata: {
                before: previousUser || {},
                changes: updateData,
                after: {
                    id: String(updatedUser._id),
                    name: updatedUser.name,
                    dni: updatedUser.dni,
                    role: updatedUser.role
                }
            }
        })

        res.json({
            message: "Usuario actualizado correctamente",
            user: updatedUser
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar usuario"
        })
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                message: "No puedes eliminar tu propio usuario"
            })
        }

        const user = await User.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            })
        }

        await registerAuditEvent({
            req,
            action: "USER_DELETED",
            entityType: "user",
            entityId: user._id,
            description: `Se elimino el usuario ${user.name}`,
            metadata: {
                deletedUser: {
                    id: String(user._id),
                    name: user.name,
                    dni: user.dni,
                    role: user.role
                }
            }
        })

        res.json({
            message: "Usuario eliminado correctamente"
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar usuario"
        })
    }
}

export const downloadAuditLogController = async (req, res) => {
    try {
        const fromRaw = String(req.query.from || "").trim()
        const toRaw = String(req.query.to || "").trim()
        const query = {}

        if (fromRaw || toRaw) {
            query.createdAt = {}

            if (fromRaw) {
                const fromDate = new Date(`${fromRaw}T00:00:00.000Z`)
                if (!Number.isNaN(fromDate.valueOf())) {
                    query.createdAt.$gte = fromDate
                }
            }

            if (toRaw) {
                const toDate = new Date(`${toRaw}T23:59:59.999Z`)
                if (!Number.isNaN(toDate.valueOf())) {
                    query.createdAt.$lte = toDate
                }
            }

            if (!query.createdAt.$gte && !query.createdAt.$lte) {
                delete query.createdAt
            }
        }

        const items = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .lean()

        const csv = buildAuditCsv(items)
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

        res.setHeader("Content-Type", "text/csv; charset=utf-8")
        res.setHeader("Content-Disposition", `attachment; filename=auditoria-${timestamp}.csv`)
        res.status(200).send(csv)
    } catch (error) {
        res.status(500).json({
            message: "Error al descargar log de auditoria"
        })
    }
}

export const listAuditLogController = async (req, res) => {
    try {
        const fromRaw = String(req.query.from || "").trim()
        const toRaw = String(req.query.to || "").trim()
        const actionRaw = String(req.query.action || "").trim()
        const entityTypeRaw = String(req.query.entityType || "").trim()
        const actorIdRaw = String(req.query.actorId || "").trim()

        const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1)
        const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit || "20"), 10) || 20))

        const query = {}

        if (fromRaw || toRaw) {
            query.createdAt = {}

            if (fromRaw) {
                const fromDate = new Date(`${fromRaw}T00:00:00.000Z`)
                if (!Number.isNaN(fromDate.valueOf())) {
                    query.createdAt.$gte = fromDate
                }
            }

            if (toRaw) {
                const toDate = new Date(`${toRaw}T23:59:59.999Z`)
                if (!Number.isNaN(toDate.valueOf())) {
                    query.createdAt.$lte = toDate
                }
            }

            if (!query.createdAt.$gte && !query.createdAt.$lte) {
                delete query.createdAt
            }
        }

        if (actionRaw) {
            query.action = actionRaw
        }

        if (entityTypeRaw) {
            query.entityType = entityTypeRaw
        }

        if (actorIdRaw) {
            query["actor.userId"] = actorIdRaw
        }

        const skip = (page - 1) * limit

        const [total, items] = await Promise.all([
            AuditLog.countDocuments(query),
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ])

        const totalPages = total > 0 ? Math.ceil(total / limit) : 0

        res.json({
            ok: true,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                from: fromRaw || null,
                to: toRaw || null,
                action: actionRaw || null,
                entityType: entityTypeRaw || null,
                actorId: actorIdRaw || null
            },
            items
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener log de auditoria"
        })
    }
}
