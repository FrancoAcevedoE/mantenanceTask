import User from "../models/userModels.js"
import Maintenance from "../models/mantenanceModels.js"
import Machine from "../models/machineModels.js"
import NotificationLog from "../models/notificationLogModel.js"
import mongoose from "mongoose"
import {
    getMaintenanceNotificationsFeed,
    getMaintenanceNotificationSummary,
    sendMaintenanceStatusAlert,
    sendMaintenanceSummaryNotification
} from "../services/notificationService.js"

const formatSectorLabel = (value = "") =>
    value
        .split(" ")
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

const normalizeSector = (value = "") =>
    String(value)
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()

const ALLOWED_UNFINISHED_REASONS = [
"Tiempo de parada insuficiente.",
"Falta de personal.",
"Falta de repuestos (en el acto)",
"Falta de repuestos (Mas de una semana).",
"Falta de presupuesto.",
"Otros"
]

const normalizeUnfinishedReason = (value = "") =>
    String(value)
        .trim()
        .replace(/\s+/g, " ")

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/
const MAX_NOTIFICATION_READ_IDS = 300
const MAX_NOTIFICATION_HISTORY_READ_IDS = 1200

const normalizeNotificationReadIds = (rawIds) => {
    if (!Array.isArray(rawIds)) {
        return []
    }

    const uniqueIds = new Set()

    for (const rawId of rawIds) {
        const normalizedId = String(rawId || "").trim()

        if (!normalizedId) {
            continue
        }

        uniqueIds.add(normalizedId)

        if (uniqueIds.size >= MAX_NOTIFICATION_READ_IDS) {
            break
        }
    }

    return [...uniqueIds]
}

const normalizeNotificationHistoryReadIds = (rawIds) => {
    if (!Array.isArray(rawIds)) {
        return []
    }

    const uniqueIds = new Set()

    for (const rawId of rawIds) {
        const normalizedId = String(rawId || "").trim()

        if (!normalizedId) {
            continue
        }

        uniqueIds.add(normalizedId)

        if (uniqueIds.size >= MAX_NOTIFICATION_HISTORY_READ_IDS) {
            break
        }
    }

    return [...uniqueIds]
}

const formatMonth = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${year}-${month}`
}

const getMonthStart = (monthValue) => {
    if (!MONTH_REGEX.test(monthValue)) return null
    const [yearRaw, monthRaw] = monthValue.split("-")
    const year = Number(yearRaw)
    const monthIndex = Number(monthRaw) - 1
    return new Date(year, monthIndex, 1, 0, 0, 0, 0)
}

const getMonthEnd = (monthValue) => {
    if (!MONTH_REGEX.test(monthValue)) return null
    const [yearRaw, monthRaw] = monthValue.split("-")
    const year = Number(yearRaw)
    const monthIndex = Number(monthRaw) - 1
    return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
}

export const newMaintenanceController = async (req,res)=>{

    try{

        const data = {
            ...req.body,
            sector: normalizeSector(req.body?.sector)
        }

        const effectiveClientId = req.user?.role === "operario"
            ? req.user.id
            : data.clientId

        const normalizedMachinePart = String(data.machinePart || "").trim()
        const normalizedMaintenanceType = String(data.maintenanceType || "").trim()
        const normalizedWorkDescription = String(data.workDescription || "").trim()

        if (!normalizedMachinePart) {
            return res.status(400).json({
                message: "Debes seleccionar una parte de maquina"
            })
        }

        if (!normalizedMaintenanceType) {
            return res.status(400).json({
                message: "Debes seleccionar un tipo de mantenimiento"
            })
        }

        if (!normalizedWorkDescription) {
            return res.status(400).json({
                message: "Debes cargar la descripcion del trabajo realizado"
            })
        }
        data.machinePart = normalizedMachinePart
        data.maintenanceType = normalizedMaintenanceType
        data.workDescription = normalizedWorkDescription

        if (!effectiveClientId || !mongoose.Types.ObjectId.isValid(String(effectiveClientId))) {
            return res.status(400).json({
                message: "Debes seleccionar un operario valido"
            })
        }

        data.clientId = String(effectiveClientId)

        const normalizedHoursWorked = Number(data.hoursWorked)

        if (!Number.isFinite(normalizedHoursWorked) || normalizedHoursWorked <= 0) {
            return res.status(400).json({
                message: "Las horas trabajadas deben ser un numero mayor a 0"
            })
        }

        data.hoursWorked = normalizedHoursWorked

        const client = await User.findById(data.clientId)

        if(!client || client.role !== "operario"){
            return res.status(404).json({
                message:"Operario no encontrado"
            })
        }
console.log('paso 1')
        const additionalWorkerIds = Array.isArray(data.additionalWorkers) ? data.additionalWorkers : []

        for (const workerId of additionalWorkerIds) {
            if (!mongoose.Types.ObjectId.isValid(String(workerId))) {
                return res.status(400).json({ message: "Operario adicional no válido" })
            }

            const worker = await User.findById(workerId)
            if (!worker || worker.role !== "operario") {
                return res.status(400).json({ message: "Operario adicional no válido" })
            }
        }

        let status = "finished"

        if(!data.machineRunning){
            status = "stopped"
        }
console.log('paso 2')

        if(data.machineRunning && !data.jobFinished){
            status = "pending"
        }

        const requiresUnfinishedReason = status === "pending" || status === "stopped"
        const normalizedUnfinishedReason = normalizeUnfinishedReason(data.unfinishedReason)
        const unfinishedReasonCategory = normalizeUnfinishedReason(data.unfinishedReasonCategory)

        if (requiresUnfinishedReason) {
            if (!ALLOWED_UNFINISHED_REASONS.includes(unfinishedReasonCategory)) {
                return res.status(400).json({
                    message: "Debes seleccionar un motivo valido para tarea no terminada"
                })
            }

            if (unfinishedReasonCategory === "Otros") {
                if (!normalizedUnfinishedReason) {
                    return res.status(400).json({
                        message: "Debes detallar el motivo cuando seleccionas 'Otros'"
                    })
                }
                data.unfinishedReason = normalizedUnfinishedReason
            } else {
                data.unfinishedReason = unfinishedReasonCategory
            }

            data.unfinishedReasonCategory = unfinishedReasonCategory
        } else {
            data.unfinishedReason = ""
            data.unfinishedReasonCategory = ""
        }
console.log('paso 3')

        const maintenance = new Maintenance({
            ...data,
            additionalWorkers: additionalWorkerIds,
            reportedBy: req.user.id,
            status
        })
console.log('paso 4')

        console.log(maintenance)
        await maintenance.save()
        sendMaintenanceStatusAlert(maintenance).catch(() => {})

        res.json(maintenance)

    }catch(error){
        console.error("Error en newMaintenanceController:", error);
        if (error?.name === "CastError" || error?.name === "ValidationError") {
            return res.status(400).json({
                message: "Datos invalidos para registrar mantenimiento"
            })
        }

        res.status(500).json({
            message:"Error al registrar mantenimiento"
        })

    }

}


export const finishMaintenance = async (req,res)=>{

    try{

        const additionalHours = Number(req.body.hoursWorked)

        if (!Number.isFinite(additionalHours) || additionalHours <= 0) {
            return res.status(400).json({
                message: "Las horas adicionales deben ser un numero mayor a 0"
            })
        }

        const maintenance = await Maintenance.findById(req.params.id)

        if (!maintenance) {
            return res.status(404).json({
                message: "Mantenimiento no encontrado"
            })
        }

        maintenance.hoursWorked += additionalHours
        maintenance.jobFinished = true
        maintenance.machineRunning = true
        maintenance.status = "finished"
        maintenance.updatedAt = new Date()

        await maintenance.save()

        res.json(maintenance)

    }catch(error){

        res.status(500).json({
            message:"Error al terminar mantenimiento"
        })

    }

}




export const historyController = async (req, res) => {

    try {

        const history = await Maintenance.find()
            .populate("clientId", "name role company")
            .populate("additionalWorkers", "name role company")
            .sort({ createdAt: -1 })

        res.json(history)

    } catch (error) {

        res.status(500).json({
            message: "Error al obtener historial"
        })

    }

}

export const dashboardController = async (req,res)=>{

try{

const requestedStartMonth = String(req.query.startMonth || "").trim()
const requestedEndMonth = String(req.query.endMonth || "").trim()

const now = new Date()
const defaultStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0)
const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

const startDate = requestedStartMonth ? getMonthStart(requestedStartMonth) : defaultStartDate
const endDate = requestedEndMonth ? getMonthEnd(requestedEndMonth) : defaultEndDate

if (!startDate || !endDate) {
return res.status(400).json({
message: "Periodo invalido. Usa formato YYYY-MM"
})
}

if (startDate > endDate) {
return res.status(400).json({
message: "El periodo es invalido: inicio mayor que fin"
})
}

const periodFilter = {
createdAt: {
$gte: startDate,
$lte: endDate
}
}

const totalMaintenances = await Maintenance.countDocuments(periodFilter)

const machines = await Maintenance.distinct("machine", periodFilter)

const maintenancesForOperarioBreakdown = await Maintenance.find(periodFilter)
.select("clientId additionalWorkers")
.populate("clientId", "name company")
.populate("additionalWorkers", "name company")
.lean()

const operarioCountByLabel = new Map()
const uniqueOperarioIds = new Set()

for (const maintenance of maintenancesForOperarioBreakdown) {
const participants = []

if (maintenance?.clientId) {
participants.push(maintenance.clientId)
}

if (Array.isArray(maintenance?.additionalWorkers)) {
participants.push(...maintenance.additionalWorkers)
}

const maintenanceParticipantIds = new Set()

for (const participant of participants) {
if (!participant || !participant._id) continue

const participantId = String(participant._id)

if (maintenanceParticipantIds.has(participantId)) continue
maintenanceParticipantIds.add(participantId)
uniqueOperarioIds.add(participantId)

const participantName = String(participant.name || "").trim()
const participantCompany = String(participant.company || "").trim()

if (!participantName) continue

const label = participantCompany
? `${participantName} - ${participantCompany}`
: participantName

operarioCountByLabel.set(label, (operarioCountByLabel.get(label) || 0) + 1)
}
}

const operariosAttended = uniqueOperarioIds.size

const recentMaintenances = await Maintenance.find(periodFilter)
.populate("clientId", "name role")
.sort({ createdAt: -1 })

const pending = await Maintenance.countDocuments({
...periodFilter,
status:"pending"
})

const stopped = await Maintenance.countDocuments({
...periodFilter,
status:"stopped"
})

const statusBreakdownRaw = await Maintenance.aggregate([
{
$match: periodFilter
},
{
$group: {
_id: "$status",
count: { $sum: 1 }
}
}
])

const operarioBreakdownRaw = [...operarioCountByLabel.entries()]
.map(([operario, count]) => ({ _id: operario, count }))
.sort((left, right) => right.count - left.count)
.slice(0, 8)

const sectorBreakdownRaw = await Maintenance.aggregate([
{
$match: periodFilter
},
{
$addFields: {
normalizedSector: {
    $toLower: {
        $trim: {
            input: { $ifNull: ["$sector", ""] }
        }
    }
}
}
},
{
$match: {
normalizedSector: { $nin: [""] }
}
},
{
$group: {
_id: "$normalizedSector",
count: { $sum: 1 }
}
},
{
$sort: { count: -1 }
},
{
$limit: 8
}
])

const dailyRaw = await Maintenance.aggregate([
{
$match: periodFilter
},
{
$addFields: {
createdDay: {
$dateToString: {
format: "%Y-%m-%d",
date: "$createdAt"
}
}
}
},
{
$group: {
_id: "$createdDay",
count: { $sum: 1 }
}
},
{
$sort: { _id: 1 }
}
])

const dailySeries = dailyRaw.map(item => ({
date: item._id,
count: item.count
}))

const statusBreakdown = statusBreakdownRaw.map(item => ({
status: item._id || "sin_estado",
count: item.count
}))

const operarioBreakdown = operarioBreakdownRaw
.filter(item => item && item._id)
.map(item => ({
operario: item._id,
count: item.count
}))

const sectorBreakdown = sectorBreakdownRaw.map(item => ({
sector: formatSectorLabel(item._id),
count: item.count
}))

const unfinishedReasonBreakdownRaw = await Maintenance.aggregate([
{
$match: {
...periodFilter,
unfinishedReason: { $nin: [null, ""] }
}
},
{
$addFields: {
unfinishedReasonKey: {
$cond: [
{ $and: [
{ $ne: ["$unfinishedReasonCategory", null] },
{ $ne: ["$unfinishedReasonCategory", ""] }
] },
"$unfinishedReasonCategory",
"$unfinishedReason"
]
}
}
},
{
$group: {
_id: "$unfinishedReasonKey",
count: { $sum: 1 }
}
},
{
$sort: { count: -1 }
}
])

const unfinishedReasonBreakdown = unfinishedReasonBreakdownRaw.map(item => ({
reason: item._id || "sin motivo",
count: item.count
}))

const unfinishedOtherDetailsRaw = await Maintenance.aggregate([
{
$match: {
...periodFilter,
unfinishedReasonCategory: "Otros",
unfinishedReason: { $nin: [null, "", "Otros"] }
}
},
{
$group: {
_id: "$unfinishedReason",
count: { $sum: 1 }
}
},
{
$sort: { count: -1 }
},
{
$limit: 5
}
])

const unfinishedOtherDetailsTop = unfinishedOtherDetailsRaw.map(item => ({
detail: item._id,
count: item.count
}))

const unfinishedWithReasonTotal = unfinishedReasonBreakdown.reduce((accumulator, item) => {
return accumulator + item.count
}, 0)

const allMachines = await Machine.find()
.select("name sector")
.sort({ sector: 1, name: 1 })

const latestMachineStatusRaw = await Maintenance.aggregate([
{
$sort: { createdAt: -1 }
},
{
$group: {
_id: "$machine",
status: { $first: "$status" },
updatedAt: { $first: "$createdAt" }
}
}
])

const latestMachineStatusMap = new Map(
latestMachineStatusRaw.map(item => [item._id, item])
)

const machineStatusOverview = allMachines.map(machine => {
const latestStatus = latestMachineStatusMap.get(machine.name)
const currentStatus = latestStatus?.status || "ok"

return {
id: machine._id,
name: machine.name,
sector: formatSectorLabel(machine.sector || ""),
status: currentStatus,
indicator: currentStatus === "stopped"
? "red"
: currentStatus === "pending"
? "yellow"
: "green",
label: currentStatus === "stopped"
? "Detenida"
: currentStatus === "pending"
? "Pendiente"
: "Operativa",
updatedAt: latestStatus?.updatedAt || null
}
})

res.json({

totalMaintenances,

machinesRegistered:machines.length,

operariosAttended,

pending,

stopped,

recentMaintenances,

charts: {
statusBreakdown,
operarioBreakdown,
sectorBreakdown,
dailySeries
},
unfinishedReasonSummary: {
totalWithReason: unfinishedWithReasonTotal,
reasons: unfinishedReasonBreakdown,
otherDetailsTop: unfinishedOtherDetailsTop
},
machineStatusOverview,
period: {
startMonth: formatMonth(startDate),
endMonth: formatMonth(endDate)
}

})

}catch(error){

res.status(500).json({
message:"Error cargando dashboard"
})

}

}

export const notificationsController = async (req, res) => {

    try {

        const notificationsFeed = await getMaintenanceNotificationsFeed()
        const user = await User.findById(req.user.id).select("notificationReadIds")
        const persistedReadIds = normalizeNotificationReadIds(user?.notificationReadIds)
        const activeNotificationIds = new Set((notificationsFeed.items || []).map(item => String(item.id || "").trim()))
        const activeReadIds = persistedReadIds.filter(itemId => activeNotificationIds.has(itemId))

        if (user && JSON.stringify(activeReadIds) !== JSON.stringify(persistedReadIds)) {
            user.notificationReadIds = activeReadIds
            await user.save()
        }

        res.json({
            ok: true,
            ...notificationsFeed,
            readIds: activeReadIds
        })

    } catch (error) {

        res.status(500).json({
            message: "Error al obtener notificaciones"
        })

    }

}

export const markNotificationsReadController = async (req, res) => {
    try {
        const incomingReadIds = normalizeNotificationReadIds(req.body?.ids)

        if (!incomingReadIds.length) {
            return res.status(400).json({
                message: "Debes enviar al menos un id de notificacion"
            })
        }

        await User.updateOne(
            { _id: req.user.id },
            {
                $addToSet: {
                    notificationReadIds: {
                        $each: incomingReadIds
                    }
                }
            }
        )

        res.json({
            ok: true,
            readIds: incomingReadIds
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al marcar notificaciones como leidas"
        })
    }
}

export const clearNotificationReadsController = async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.user.id },
            {
                $set: {
                    notificationReadIds: []
                }
            }
        )

        res.json({
            ok: true
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al limpiar notificaciones leidas"
        })
    }
}

export const notificationsHistoryController = async (req, res) => {
    try {
        const readFilter = String(req.query.read || "all").trim().toLowerCase()
        const fromDateRaw = String(req.query.from || "").trim()
        const toDateRaw = String(req.query.to || "").trim()

        const query = {}

        if (fromDateRaw || toDateRaw) {
            query.createdAt = {}

            if (fromDateRaw) {
                const fromDate = new Date(`${fromDateRaw}T00:00:00.000Z`)
                if (!Number.isNaN(fromDate.valueOf())) {
                    query.createdAt.$gte = fromDate
                }
            }

            if (toDateRaw) {
                const toDate = new Date(`${toDateRaw}T23:59:59.999Z`)
                if (!Number.isNaN(toDate.valueOf())) {
                    query.createdAt.$lte = toDate
                }
            }

            if (!query.createdAt.$gte && !query.createdAt.$lte) {
                delete query.createdAt
            }
        }

        const [logs, user] = await Promise.all([
            NotificationLog.find(query)
                .sort({ createdAt: -1 })
                .limit(500)
                .lean(),
            User.findById(req.user.id).select("notificationHistoryReadIds")
        ])

        const readIds = normalizeNotificationHistoryReadIds(user?.notificationHistoryReadIds)
        const readSet = new Set(readIds)

        let items = logs.map(log => ({
            id: String(log._id),
            title: log.title,
            body: log.body,
            type: log.type,
            severity: log.severity,
            source: log.source,
            machine: log.machine,
            sector: log.sector,
            metadata: log.metadata,
            createdAt: log.createdAt,
            read: readSet.has(String(log._id))
        }))

        if (readFilter === "read") {
            items = items.filter(item => item.read)
        }

        if (readFilter === "unread") {
            items = items.filter(item => !item.read)
        }

        res.json({
            ok: true,
            items,
            summary: {
                total: items.length,
                read: items.filter(item => item.read).length,
                unread: items.filter(item => !item.read).length
            }
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al obtener historial de notificaciones"
        })
    }
}

export const markNotificationHistoryReadController = async (req, res) => {
    try {
        const incomingReadIds = normalizeNotificationHistoryReadIds(req.body?.ids)

        if (!incomingReadIds.length) {
            return res.status(400).json({
                message: "Debes enviar al menos un id de notificacion"
            })
        }

        await User.updateOne(
            { _id: req.user.id },
            {
                $addToSet: {
                    notificationHistoryReadIds: {
                        $each: incomingReadIds
                    }
                }
            }
        )

        res.json({
            ok: true,
            readIds: incomingReadIds
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al marcar historial como leido"
        })
    }
}

export const clearNotificationHistoryReadsController = async (req, res) => {
    try {
        await User.updateOne(
            { _id: req.user.id },
            {
                $set: {
                    notificationHistoryReadIds: []
                }
            }
        )

        res.json({
            ok: true
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al limpiar historial leido"
        })
    }
}

export const notifyTestController = async (req, res) => {
    try {
        const summary = await getMaintenanceNotificationSummary()

        await sendMaintenanceSummaryNotification("Prueba manual")

        res.json({
            ok: true,
            message: "Notificacion de prueba enviada",
            summary
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al enviar notificacion de prueba"
        })
    }
}

export const purgeMaintenanceDataController = async (req, res) => {
    try {
        const [maintenanceResult, notificationResult] = await Promise.all([
            Maintenance.deleteMany({}),
            NotificationLog.deleteMany({}),
            User.updateMany(
                {},
                {
                    $set: {
                        notificationReadIds: [],
                        notificationHistoryReadIds: []
                    }
                }
            )
        ])

        res.json({
            ok: true,
            message: "Historial y metricas reiniciadas",
            deletedMaintenances: maintenanceResult.deletedCount || 0,
            deletedNotificationLogs: notificationResult.deletedCount || 0
        })
    } catch (error) {
        res.status(500).json({
            message: "Error al limpiar historial y dashboard"
        })
    }
}

