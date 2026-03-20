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
import User from "./models/userModels.js"

const DEFAULT_ADMIN = {
  name: "Franco Acevedo",
  dni: 40317809,
  password: 3121,
  role: "admin"
}

const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ dni: DEFAULT_ADMIN.dni })

  if (!existingAdmin) {
    await User.create(DEFAULT_ADMIN)
    console.log("Admin inicial creado")
  }
}

const app = express()

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost",
  "https://mantenance-task.vercel.app"
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    const isAllowedOrigin = allowedOrigins.includes(origin)
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)

    if (isAllowedOrigin || isVercelPreview) {
      return callback(null, true)
    }

    return callback(new Error("Origen no permitido por CORS"))
  },
  credentials: true
}))
app.use(express.json())
// conexion con mongoose

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mantenanceDB"

mongoose.connect(mongoURI)

.then(async()=>{
  console.log("Mongo conectado")
  await ensureDefaultAdmin()
})
.catch(err=>console.log(err))

app.use("/api/clients", clientRoutes)
app.use("/api/users", userRoutes)
app.use("/api/maintenance", maintenanceRoutes)
app.use("/api/machines", machineRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
})





