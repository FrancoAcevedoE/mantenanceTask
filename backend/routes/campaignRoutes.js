import express from "express"
import multer from "multer"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign } from "../controllers/campaignController.js"
import Campaign from "../models/campaignModel.js"
import File from "../models/fileModel.js"

const router = express.Router()

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

router.use(verifyToken)

router.get("/",      getCampaigns)
router.get("/:id",   getCampaignById)
router.post("/",     createCampaign)
router.put("/:id",   updateCampaign)
router.delete("/:id", deleteCampaign)

// ── Imagen de carátula ──────────────────────────────────────────────────────
router.post("/:id/cover", fileUpload.single("cover"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No se envió ningún archivo" })
  try {
    const { extname } = await import("node:path")
    const base64  = req.file.buffer.toString("base64")
    const dataUri = `data:${req.file.mimetype};base64,${base64}`
    const unique  = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(req.file.originalname)}`
    const file = await File.create({
      filename: unique,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      data: dataUri,
      size: req.file.size,
    })
    const coverImage = {
      url: `/api/files/${file._id}`,
      name: req.file.originalname,
      mimetype: req.file.mimetype,
    }
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, { $set: { coverImage } }, { new: true }
    )
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json({ coverImage, campaign })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete("/:id/cover", async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: { coverImage: { url: "", name: "", mimetype: "" } } },
      { new: true }
    )
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Adjuntos ───────────────────────────────────────────────────────────────
router.post("/:id/attachments", fileUpload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No se envió ningún archivo" })
  try {
    const { extname } = await import("node:path")
    const base64  = req.file.buffer.toString("base64")
    const dataUri = `data:${req.file.mimetype};base64,${base64}`
    const unique  = `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(req.file.originalname)}`
    const file = await File.create({
      filename: unique,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      data: dataUri,
      size: req.file.size,
    })
    const attachment = {
      url: `/api/files/${file._id}`,
      name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, { $push: { attachments: attachment } }, { new: true }
    )
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    const added = campaign.attachments[campaign.attachments.length - 1]
    res.json({ attachment: added, campaign })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete("/:id/attachments/:attachId", async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $pull: { attachments: { _id: req.params.attachId } } },
      { new: true }
    )
    if (!campaign) return res.status(404).json({ message: "Campaña no encontrada" })
    res.json({ ok: true, campaign })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
