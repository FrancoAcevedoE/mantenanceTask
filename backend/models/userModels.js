import mongoose from "mongoose"

const userSchema = new mongoose.Schema({

name:String,

dni:{
type:Number,
unique:true
},

password:Number,

role:{
type:String,
enum:["admin","operario","supervisor"],
default:"operario"
}

})

export default mongoose.model("User",userSchema)