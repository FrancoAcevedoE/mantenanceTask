import express from "express"
import {
  newMachineController,
  getAllMachinesController,
  getMachineByIdController,
  updateMachineController,
  deleteMachineController
} from "../controllers/machineController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

// GET all machines
router.get("/", verifyToken, getAllMachinesController)

// GET machine by ID
router.get("/:id", verifyToken, getMachineByIdController)

// POST new machine
router.post("/", verifyToken, checkRole("admin", "operario"), newMachineController)

// PUT update machine
router.put("/:id", verifyToken, checkRole("admin"), updateMachineController)

// DELETE machine
router.delete("/:id", verifyToken, checkRole("admin"), deleteMachineController)

export default router
