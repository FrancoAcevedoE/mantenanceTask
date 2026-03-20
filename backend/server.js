import express from "express"
import cors from "cors"
import mongoose from "mongoose"
// esto levanta el servidor e importa las todas las rutas 
import userRoutes from "./routes/userRoutes.js"
import clientRoutes from './routes/clientRoutes.js'
import maintenanceRoutes from "./routes/mantenanceRoutes.js"
import machineRoutes from "./routes/machineRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())
// conexion con mongoose

mongoose.connect("mongodb://localhost:27017/mantenanceDB")

.then(()=>console.log("Mongo conectado"))
.catch(err=>console.log(err))

app.use("/api/clients", clientRoutes)
app.use("/api/users", userRoutes)
app.use("/api/maintenance", maintenanceRoutes)
app.use("/api/machines", machineRoutes)

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000")
})





