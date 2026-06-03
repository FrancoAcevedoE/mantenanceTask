import express from "express"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

import {
    clearNotificationHistoryReadsController,
    purgeMaintenanceDataController,
    finishMaintenance,
    historyController,
    markNotificationHistoryReadController,
    newMaintenanceController,
    dashboardController,
    notificationsHistoryController,
    notifyTestController,
    deleteMaintenanceController
} from "../controllers/mantenanceController.js"

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

router.delete(
    "/:id",
    verifyToken,
    checkRole("admin"),
    deleteMaintenanceController
)

router.get(
    "/dashboard",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    dashboardController
)

router.get(
    "/notifications/history",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    notificationsHistoryController
)

router.post(
    "/notifications/history/read",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    markNotificationHistoryReadController
)

router.delete(
    "/notifications/history/read",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    clearNotificationHistoryReadsController
)

router.post(
    "/notify-test",
    verifyToken,
    checkRole("admin"),
    notifyTestController
)

router.delete(
    "/purge-all",
    verifyToken,
    checkRole("admin"),
    purgeMaintenanceDataController
)
console.log("maintenance routes loaded")
export default router
