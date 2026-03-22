import User from "../models/userModels.js"
import Maintenance from "../models/mantenanceModels.js"

export const newMaintenanceController = async (req,res)=>{

    try{

        const data = req.body

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

res.json({

totalMaintenances,

machinesRegistered:machines.length,

operariosAttended: operarios.filter(Boolean).length,

pending,

stopped,

recentMaintenances

})

}catch(error){

res.status(500).json({
message:"Error cargando dashboard"
})

}

}

