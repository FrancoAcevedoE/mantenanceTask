const User = require("../models/User")

exports.createUser = async (req,res)=>{

const {name,dni,password,role} = req.body

const user = new User({

name,
dni,
password,
role

})

await user.save()

res.json(user)

}