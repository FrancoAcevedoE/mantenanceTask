import mongoose from "mongoose"

const clientSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    company:{
        type:String
    },

    phone:{
        type:String
    },

    email:{
        type:String
    },

    address:{
        type:String
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

})

export default mongoose.model("Client", clientSchema)