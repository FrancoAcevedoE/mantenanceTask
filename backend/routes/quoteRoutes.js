import express from "express"
import { createQuoteController, getQuotesController } from "../controllers/quoteController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/", verifyToken, checkRole("vendedor"), createQuoteController)
router.get("/", verifyToken, checkRole("vendedor"), getQuotesController)

export default router