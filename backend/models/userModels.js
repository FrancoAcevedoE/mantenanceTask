const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

name:String,

dni:{
type:String,
unique:true
},

password:String,

role:{
type:String,
enum:["admin","operario","supervisor"],
default:"operario"
}

})

module.exports = mongoose.model("User",userSchema)