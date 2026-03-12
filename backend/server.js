import express from "express"
import cors from "cors"
// esto levanta el servidor e importa las todas las rutas 
const app = express()

app.use(cors())
app.use(express.json())

app.get("/api/history", (req, res) => {
    res.json([
        { sector: "Producción", machine: "Torno 1", hoursWorked: 3 },
        { sector: "Mantenimiento", machine: "Compresor", hoursWorked: 2 }
    ])
})

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000")
})