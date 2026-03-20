import express from "express"
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

app.use((req, res, next) => {
  const origin = req.headers.origin

  res.header("X-CORS-Version", "v4-open")

  res.header("Access-Control-Allow-Origin", origin || "*")
  res.header("Vary", "Origin")
  res.header("Access-Control-Allow-Credentials", "true")
  res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

  if (req.method === "OPTIONS") {
    return res.sendStatus(204)
  }

  return next()
})
app.use(express.json())
// conexion con mongoose

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/mantenanceDB"

if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en variables de entorno")
}

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

app.get("/api/health", (req, res) => {
  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  }

  res.json({
    ok: true,
    corsVersion: "v4-open",
    mongoState: mongoStateMap[mongoose.connection.readyState] || "unknown"
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
})





