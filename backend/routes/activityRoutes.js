import express from "express"
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity
} from "../controllers/activityController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/", verifyToken, createActivity)
router.get("/", verifyToken, getActivities)
router.get("/:id", verifyToken, getActivityById)
router.put("/:id", verifyToken, updateActivity)
router.delete("/:id", verifyToken, deleteActivity)

export default router
