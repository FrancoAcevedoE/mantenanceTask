import express from "express"
import multer from "multer"
import { extname } from "node:path"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"
import File from "../models/fileModel.js"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx/
        const ext = allowed.test(extname(file.originalname).toLowerCase())
        const mime = allowed.test(file.mimetype)
        if (ext || mime) return cb(null, true)
        cb(new Error("Tipo de archivo no permitido"))
    },
})

const uploadRouter = express.Router()

uploadRouter.post(
    "/",
    verifyToken,
    checkRole("admin"),
    upload.single("file"),
    async (req, res) => {
        if (!req.file) return res.status(400).json({ message: "No se envió ningún archivo" })
        try {
            const base64 = req.file.buffer.toString("base64")
            const dataUri = `data:${req.file.mimetype};base64,${base64}`
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(req.file.originalname)}`

            const file = await File.create({
                filename: unique,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                data: dataUri,
                size: req.file.size,
            })

            const url = `/api/files/${file._id}`
            res.json({ url, originalName: req.file.originalname })
        } catch (err) {
            console.error("Upload error:", err)
            res.status(500).json({ message: "Error al guardar archivo" })
        }
    }
)

uploadRouter.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message })
    }
    if (err) return res.status(400).json({ message: err.message })
})

const filesRouter = express.Router()

filesRouter.get("/:id", async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
        if (!file) return res.status(404).json({ message: "Archivo no encontrado" })

        const matches = file.data.match(/^data:(.+);base64,(.+)$/)
        if (!matches) return res.status(500).json({ message: "Formato de archivo inválido" })

        const buffer = Buffer.from(matches[2], "base64")
        res.set("Content-Type", matches[1])
        res.set("Content-Disposition", `inline; filename="${file.originalName || file.filename}"`)
        res.set("Cache-Control", "public, max-age=31536000, immutable")
        res.send(buffer)
    } catch (err) {
        res.status(500).json({ message: "Error al obtener archivo" })
    }
})

export { uploadRouter, filesRouter }
export default uploadRouter
