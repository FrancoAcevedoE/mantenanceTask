import mongoose from "mongoose"

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
        type:String
    },

    maintenanceType:{
        type:String,
        enum:["preventivo","correctivo"],
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
    }

})

export default mongoose.model("Maintenance", maintenanceSchema)
