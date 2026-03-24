import User from "../models/userModels.js"
import Maintenance from "../models/mantenanceModels.js"
import Machine from "../models/machineModels.js"

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

        const additionalWorkerIds = Array.isArray(data.additionalWorkers) ? data.additionalWorkers : []

        for (const workerId of additionalWorkerIds) {
            const worker = await User.findById(workerId)
            if (!worker || worker.role !== "operario") {
                return res.status(400).json({ message: "Operario adicional no válido" })
            }
        }

        let status = "finished"

        if(!data.machineRunning){
            status = "stopped"
        }

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

        const maintenance = new Maintenance({
            ...data,
            additionalWorkers: additionalWorkerIds,
            reportedBy: req.user.id,
            status
        })

        await maintenance.save()

        res.json(maintenance)

    }catch(error){

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

const operariosAttendedRaw = await Maintenance.aggregate([
{
$match: periodFilter
},
{
$project: {
involvedOperarios: {
$setUnion: [
{
$concatArrays: [
["$clientId"],
{ $ifNull: ["$additionalWorkers", []] }
]
},
[]
]
}
}
},
{
$unwind: "$involvedOperarios"
},
{
$match: {
involvedOperarios: { $ne: null }
}
},
{
$group: {
_id: null,
operarioIds: { $addToSet: "$involvedOperarios" }
}
},
{
$project: {
_id: 0,
count: { $size: "$operarioIds" }
}
}
])

const operariosAttended = operariosAttendedRaw[0]?.count || 0

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

const operarioBreakdownRaw = await Maintenance.aggregate([
{
$match: periodFilter
},
{
$project: {
involvedOperarios: {
$setUnion: [
{
$concatArrays: [
["$clientId"],
{ $ifNull: ["$additionalWorkers", []] }
]
},
[]
]
}
}
},
{
$unwind: "$involvedOperarios"
},
{
$match: {
involvedOperarios: { $ne: null }
}
},
{
$group: {
_id: "$involvedOperarios",
count: { $sum: 1 }
}
},
{
$lookup: {
from: "users",
localField: "_id",
foreignField: "_id",
as: "operario"
}
},
{
$unwind: "$operario"
},
{
$project: {
_id: {
$cond: [
{ $and: [
{ $ne: ["$operario.company", null] },
{ $ne: ["$operario.company", ""] }
] },
{ $concat: ["$operario.name", " - ", "$operario.company"] },
"$operario.name"
]
},
count: 1
}
},
{
$match: {
_id: { $nin: [null, ""] }
}
},
{
$group: {
_id: "$_id",
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

