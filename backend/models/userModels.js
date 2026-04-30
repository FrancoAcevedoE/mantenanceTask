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
enum:["admin","operario","supervisor","vendedor"],
default:"operario"
},

isDeleted:{
type:Boolean,
default:false
},

deletedAt:{
type:Date,
default:null
},

deletedBy:{
type:String,
default:""
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