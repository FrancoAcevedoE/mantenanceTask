import express from "express"
import {
  createQuote,
  getQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
} from "../controllers/quoteController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()
const canQuote = checkRole("vendedor", "admin")

router.post("/",     verifyToken, canQuote, createQuote)
router.get("/",      verifyToken, canQuote, getQuotes)
router.get("/:id",   verifyToken, canQuote, getQuoteById)
router.put("/:id",   verifyToken, canQuote, updateQuote)
router.delete("/:id", verifyToken, canQuote, deleteQuote)

export default router
