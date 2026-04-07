import express from "express"
import multer from "multer"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"
import {
  createRawMaterialController,
  exportRawMaterialsExcelController,
  getStockSyncStatusController,
  importRawMaterialsExcelController,
  listRawMaterialsController,
  listStockMovementsController,
  registerStockMovementController,
  updateRawMaterialController
} from "../controllers/stockController.js"

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  }
})

router.get(
  "/sync/status",
  verifyToken,
  checkRole("admin", "supervisor", "operario"),
  getStockSyncStatusController
)

router.get(
  "/items",
  verifyToken,
  checkRole("admin", "supervisor", "operario"),
  listRawMaterialsController
)

router.post(
  "/items",
  verifyToken,
  checkRole("admin", "supervisor"),
  createRawMaterialController
)

router.patch(
  "/items/:id",
  verifyToken,
  checkRole("admin", "supervisor"),
  updateRawMaterialController
)

router.get(
  "/movements",
  verifyToken,
  checkRole("admin", "supervisor", "operario"),
  listStockMovementsController
)

router.post(
  "/movements",
  verifyToken,
  checkRole("admin", "supervisor"),
  registerStockMovementController
)

router.post(
  "/import/excel",
  verifyToken,
  checkRole("admin", "supervisor"),
  upload.single("file"),
  importRawMaterialsExcelController
)

router.get(
  "/export/excel",
  verifyToken,
  checkRole("admin", "supervisor", "operario"),
  exportRawMaterialsExcelController
)

export default router
