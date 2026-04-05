import mongoose from "mongoose"

const UNFINISHED_REASON_CATEGORIES = [
    "",
    "Tiempo de parada insuficiente.",
    "Falta de personal.",
    "Falta de repuestos (en el acto)",
    "Falta de repuestos (Mas de una semana).",
    "Falta de presupuesto.",
    "Otros"
]

const maintenanceSchema = new mongoose.Schema({

    sector:{
        type:String,
        required:true
    },

    machine:{
        type:String,
        required:true
    },

    machinePart:{
        type:String,
        required:true
    },

    workDescription:{
        type:String,
        required:true
    },

    spareParts:{
        type:String
    },

    hoursWorked:{
        type:Number,
        required:true
    },

    machineRunning:{
        type:Boolean,
        required:true
    },

    jobFinished:{
        type:Boolean,
        required:true
    },

    unfinishedReason:{
        type:String,
        default: ""
    },

    unfinishedReasonCategory:{
        type:String,
        enum: UNFINISHED_REASON_CATEGORIES,
        default: ""
    },

    maintenanceType:{
        type:String,
        enum:["preventivo","correctivo","mejora","puesta en marcha","arreglo"],
        required:true
    },

    priority:{
        type:String,
        enum:["baja","media","alta"],
        default:"media"
    },

    reportedBy:{
        type:String
    },

    clientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    clientSnapshot:{
        userId:{
            type:String,
            default:""
        },
        name:{
            type:String,
            default:""
        },
        dni:{
            type:Number,
            default:null
        },
        role:{
            type:String,
            default:""
        }
    },

    photo:{
        type:String
    },

    status:{
        type:String
    },

    createdAt:{
        type:Date,
        default:Date.now
    },

    updatedAt:{
        type:Date
    },

    additionalWorkers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    additionalWorkersSnapshots:[{
        userId:{
            type:String,
            default:""
        },
        name:{
            type:String,
            default:""
        },
        dni:{
            type:Number,
            default:null
        },
        role:{
            type:String,
            default:""
        }
    }]

})

export default mongoose.model("Maintenance", maintenanceSchema)
