import User from "../models/userModels.js"
import Maintenance from "../models/mantenanceModels.js"

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

export const newMaintenanceController = async (req,res)=>{

    try{

        const data = {
            ...req.body,
            sector: normalizeSector(req.body?.sector)
        }

        const client = await User.findById(data.clientId)

        if(!client || client.role !== "operario"){
            return res.status(404).json({
                message:"Operario no encontrado"
            })
        }

        let status = "finished"

        if(!data.machineRunning){
            status = "stopped"
        }

        if(data.machineRunning && !data.jobFinished){
            status = "pending"
        }

        const maintenance = new Maintenance({
            ...data,
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

        const { hoursWorked } = req.body

        const maintenance = await Maintenance.findById(req.params.id)

        maintenance.hoursWorked += hoursWorked
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
            .populate("clientId", "name role")

        res.json(history)

    } catch (error) {

        res.status(500).json({
            message: "Error al obtener historial"
        })

    }

}

export const dashboardController = async (req,res)=>{

try{

const totalMaintenances = await Maintenance.countDocuments()

const machines = await Maintenance.distinct("machine")

const operarios = await Maintenance.distinct("clientId")

const recentMaintenances = await Maintenance.find()
.populate("clientId", "name role")
.sort({ createdAt: -1 })
.limit(5)

const pending = await Maintenance.countDocuments({
status:"pending"
})

const stopped = await Maintenance.countDocuments({
status:"stopped"
})

const statusBreakdownRaw = await Maintenance.aggregate([
{
$group: {
_id: "$status",
count: { $sum: 1 }
}
}
])

const typeBreakdownRaw = await Maintenance.aggregate([
{
$group: {
_id: "$maintenanceType",
count: { $sum: 1 }
}
}
])

const sectorBreakdownRaw = await Maintenance.aggregate([
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

const lastSevenDays = dailyRaw.slice(-7).map(item => ({
date: item._id,
count: item.count
}))

const statusBreakdown = statusBreakdownRaw.map(item => ({
status: item._id || "sin_estado",
count: item.count
}))

const typeBreakdown = typeBreakdownRaw.map(item => ({
type: item._id || "sin_tipo",
count: item.count
}))

const sectorBreakdown = sectorBreakdownRaw.map(item => ({
sector: formatSectorLabel(item._id),
count: item.count
}))

res.json({

totalMaintenances,

machinesRegistered:machines.length,

operariosAttended: operarios.filter(Boolean).length,

pending,

stopped,

recentMaintenances,

charts: {
statusBreakdown,
typeBreakdown,
sectorBreakdown,
lastSevenDays
}

})

}catch(error){

res.status(500).json({
message:"Error cargando dashboard"
})

}

}

