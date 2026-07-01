import express from "express"
import multer from "multer"
import SalesDoc from "../models/salesDocModel.js"
import File from "../models/fileModel.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      return cb(null, true)
    }
    cb(new Error('Solo se permiten archivos PDF'))
  }
})

const VALID_KEYS = ['guia_ventas', 'perfil_puesto']
const EDITOR_ROLES = ['admin', 'admin_ventas']

// GET — todos los roles autenticados pueden leer
router.get("/:key", verifyToken, async (req, res) => {
  const { key } = req.params
  if (!VALID_KEYS.includes(key)) return res.status(404).json({ message: "Documento no encontrado" })
  try {
    const doc = await SalesDoc.findOne({ key })
    res.json(doc || { key, title: '', content: '', updatedBy: '', updatedAt: null })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT — solo admin y admin_ventas pueden editar
router.put("/:key", verifyToken, checkRole(...EDITOR_ROLES), async (req, res) => {
  const { key } = req.params
  if (!VALID_KEYS.includes(key)) return res.status(404).json({ message: "Documento no encontrado" })
  try {
    const { content, title } = req.body
    const doc = await SalesDoc.findOneAndUpdate(
      { key },
      { content: content ?? '', title: title ?? '', updatedBy: req.user.name || req.user.role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.json(doc)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /:key/pdf — subir PDF (solo admin y admin_ventas)
router.post("/:key/pdf", verifyToken, checkRole(...EDITOR_ROLES), pdfUpload.single('pdf'), async (req, res) => {
  const { key } = req.params
  if (!VALID_KEYS.includes(key)) return res.status(404).json({ message: "Documento no encontrado" })
  if (!req.file) return res.status(400).json({ message: "No se envió ningún PDF" })
  try {
    const { extname } = await import('node:path')
    const base64  = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${base64}`
    const unique  = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(req.file.originalname)}`
    const file = await File.create({
      filename: unique,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      data: dataUri,
      size: req.file.size,
    })
    const pdfUrl = `/api/files/${file._id}`
    const doc = await SalesDoc.findOneAndUpdate(
      { key },
      { pdfUrl, pdfName: req.file.originalname, updatedBy: req.user.name || req.user.role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    res.json({ pdfUrl, pdfName: req.file.originalname, doc })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /:key/pdf — quitar PDF (solo admin y admin_ventas)
router.delete("/:key/pdf", verifyToken, checkRole(...EDITOR_ROLES), async (req, res) => {
  const { key } = req.params
  if (!VALID_KEYS.includes(key)) return res.status(404).json({ message: "Documento no encontrado" })
  try {
    const doc = await SalesDoc.findOneAndUpdate(
      { key },
      { pdfUrl: '', pdfName: '', updatedBy: req.user.name || req.user.role },
      { new: true }
    )
    res.json(doc)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
