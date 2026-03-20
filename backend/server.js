import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import dotenv from "dotenv"
// esto levanta el servidor e importa las todas las rutas

dotenv.config() 
import userRoutes from "./routes/userRoutes.js"
import clientRoutes from './routes/clientRoutes.js'
import maintenanceRoutes from "./routes/mantenanceRoutes.js"
import machineRoutes from "./routes/machineRoutes.js"

const app = express()

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://mantenancedb-frontend.vercel.app", // Reemplaza con tu URL de Vercel
    "http://localhost"
  ],
  credentials: true
}))
app.use(express.json())
// conexion con mongoose

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mantenanceDB"

mongoose.connect(mongoURI)

.then(()=>console.log("Mongo conectado"))
.catch(err=>console.log(err))

app.use("/api/clients", clientRoutes)
app.use("/api/users", userRoutes)
app.use("/api/maintenance", maintenanceRoutes)
app.use("/api/machines", machineRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
})





