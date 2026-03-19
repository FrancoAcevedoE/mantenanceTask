import express from "express"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"
import { dashboardController } from "../controllers/maintenanceController.js"

import {
    historyController,
    newMaintenanceController,
    dashboardController
} from "../controllers/maintenanceController.js"

const router = express.Router()

router.get(
    "/history",
    verifyToken,
    checkRole("admin","operario","supervisor"),
    historyController
)

router.post(
    "/newmaintenance",
    verifyToken,
    checkRole("admin","operario"),
    newMaintenanceController
)
router.put(
"/finish/:id",
verifyToken,
checkRole("admin","operario"),
finishMaintenance
)

router.get(
    "/dashboard",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    dashboardController
)


export default router
