import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
// esto levanta el servidor e importa las todas las rutas
import { sendDailyStoppedPendingNotification } from "./services/notificationService.js"
import { startCronNotifications } from "./services/cronScheduler.js"

console.log("[server] startup begin")

process.on("uncaughtException", (error) => {
  console.error("[server] uncaughtException:", error)
})

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason)
})

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, ".env") })
console.log("[server] dotenv loaded")
import userRoutes from "./routes/userRoutes.js"
import clientRoutes from './routes/clientRoutes.js'
import maintenanceRoutes from "./routes/mantenanceRoutes.js"
import machineRoutes from "./routes/machineRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import productGroupRoutes from "./routes/productGroupRoutes.js"
import quoteRoutes from "./routes/quoteRoutes.js"
import activityRoutes from "./routes/activityRoutes.js"
import colorRoutes from "./routes/colorRoutes.js"
import { uploadRouter, filesRouter } from "./routes/uploadRoutes.js"
import User from "./models/userModels.js"

console.log("[server] imported routes and models")

const DEFAULT_ADMIN = {
  name: "Franco Acevedo",
  dni: 40317809,
  password: 3121,
  role: "admin"
}

const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ dni: DEFAULT_ADMIN.dni, isDeleted: { $ne: true } })

  if (!existingAdmin) {
    await User.findOneAndUpdate(
      { dni: DEFAULT_ADMIN.dni },
      {
        $set: {
          ...DEFAULT_ADMIN,
          isDeleted: false,
          deletedAt: null,
          deletedBy: ""
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    )
    console.log("Admin inicial creado")
  }
}

const app = express()

const allowedOriginsFromEnv = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)

const dynamicAllowedPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^http:\/\/localhost(?::\d+)?$/i,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/i
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOriginsFromEnv.includes(origin)) {
      return callback(null, true)
    }

    if (dynamicAllowedPatterns.some(pattern => pattern.test(origin))) {
      return callback(null, true)
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use((req, res, next) => {
  res.header("X-CORS-Version", "v5-cors-middleware")
  next()
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

  startCronNotifications()
})
.catch(err=>console.log(err))

app.use("/api/clients", clientRoutes)
app.use("/api/users", userRoutes)
app.use("/api/maintenance", maintenanceRoutes)
app.use("/api/machines", machineRoutes)
app.use("/api/products", productRoutes)
app.use("/api/product-groups", productGroupRoutes)
app.use("/api/quotes", quoteRoutes)
app.use("/api/activities", activityRoutes)
app.use("/api/colors", colorRoutes)
app.use("/api/upload", uploadRouter)
app.use("/api/files", filesRouter)
app.use("/uploads", express.static(resolve(__dirname, "uploads")))

app.get("/api/health", (req, res) => {
  const mongoStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  }

  res.json({
    ok: true,
    corsVersion: "v5-cors-middleware",
    mongoState: mongoStateMap[mongoose.connection.readyState] || "unknown"
  })
})

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || "0.0.0.0"

console.log("[server] before app.listen")
app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en ${HOST}:${PORT}`)
})





