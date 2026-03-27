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
},

pushSubscriptions:[{
endpoint:{
type:String,
trim:true
},
expirationTime:{
type:Number,
default:null
},
keys:{
auth:{
type:String,
trim:true
},
p256dh:{
type:String,
trim:true
}
},
createdAt:{
type:Date,
default:Date.now
},
updatedAt:{
type:Date,
default:Date.now
}
}],

notificationReadIds:[{
type:String,
trim:true
}],

notificationHistoryReadIds:[{
type:String,
trim:true
}]

})

export default mongoose.model("User",userSchema)