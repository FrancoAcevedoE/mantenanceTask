import express from "express"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign } from "../controllers/campaignController.js"

const router = express.Router()

router.use(verifyToken)

router.get("/",      getCampaigns)
router.get("/:id",   getCampaignById)
router.post("/",     createCampaign)
router.put("/:id",   updateCampaign)
router.delete("/:id", deleteCampaign)

export default router
