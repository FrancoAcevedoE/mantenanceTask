import express from "express"
import multer from "multer"
import { dirname, resolve, extname } from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, mkdirSync } from "node:fs"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadsDir = resolve(__dirname, "..", "uploads")

if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${extname(file.originalname)}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx/
        const ext = allowed.test(extname(file.originalname).toLowerCase())
        const mime = allowed.test(file.mimetype)
        if (ext || mime) return cb(null, true)
        cb(new Error("Tipo de archivo no permitido"))
    },
})

const router = express.Router()

router.post(
    "/",
    verifyToken,
    checkRole("admin"),
    upload.single("file"),
    (req, res) => {
        if (!req.file) return res.status(400).json({ message: "No se envió ningún archivo" })
        const url = `/uploads/${req.file.filename}`
        res.json({ url, originalName: req.file.originalname })
    }
)

router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message })
    }
    if (err) return res.status(400).json({ message: err.message })
})

export default router
