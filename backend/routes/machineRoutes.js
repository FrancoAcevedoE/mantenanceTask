import express from "express"
import {
  newMachineController,
  getAllMachinesController,
  getMachineByIdController,
  updateMachineController,
  modifyMachineController,
  updateHorometroController,
  updateInstructionsController,
  updateMachinePartsController,
  updateSectorController,
  updateNameController,
  deleteMachineController,
  deleteMachinePermanentController,
  restoreMachineController
} from "../controllers/machineController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

// GET all machines
router.get("/", verifyToken, getAllMachinesController)

// GET machine by ID
router.get("/:id", verifyToken, getMachineByIdController)

// POST new machine
router.post("/", verifyToken, checkRole("admin"), newMachineController)

// PUT update machine
router.put("/:id", verifyToken, checkRole("admin"), updateMachineController)

// PATCH update machine fields
router.patch("/:id", verifyToken, checkRole("admin"), modifyMachineController)
router.patch("/:id/horometro", verifyToken, checkRole("admin"), updateHorometroController)
router.patch("/:id/horometro", verifyToken, checkRole("admin", "operario"), updateHorometroController)
router.patch("/:id/instructions", verifyToken, checkRole("admin"), updateInstructionsController)
router.patch("/:id/machine-parts", verifyToken, checkRole("admin"), updateMachinePartsController)
router.patch("/:id/sector", verifyToken, checkRole("admin"), updateSectorController)
router.patch("/:id/name", verifyToken, checkRole("admin"), updateNameController)

// DELETE machine
router.delete("/:id/permanent", verifyToken, checkRole("admin"), deleteMachinePermanentController)
router.delete("/:id", verifyToken, checkRole("admin"), deleteMachineController)
router.patch("/:id/restore", verifyToken, checkRole("admin"), restoreMachineController)

export default router
