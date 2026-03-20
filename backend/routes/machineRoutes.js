import express from "express"
import {
  newMachineController,
  getAllMachinesController,
  getMachineByIdController,
  updateMachineController,
  deleteMachineController
} from "../controllers/machineController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { roleMiddleware } from "../middlewares/roleMiddleware.js"

const router = express.Router()

// GET all machines
router.get("/", authMiddleware, getAllMachinesController)

// GET machine by ID
router.get("/:id", authMiddleware, getMachineByIdController)

// POST new machine
router.post("/", authMiddleware, roleMiddleware(["admin", "operario"]), newMachineController)

// PUT update machine
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateMachineController)

// DELETE machine
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteMachineController)

export default router
