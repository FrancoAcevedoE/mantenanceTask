import express from "express"
import cors from "cors"
// esto levanta el servidor e importa las todas las rutas 
import userRoutes from "./routes/userRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api", userRoutes)

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000")
})





