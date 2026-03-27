import express from "express"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

import {
    clearNotificationReadsController,
    clearNotificationHistoryReadsController,
    purgeMaintenanceDataController,
    finishMaintenance,
    historyController,
    markNotificationsReadController,
    markNotificationHistoryReadController,
    newMaintenanceController,
    dashboardController,
    notificationsHistoryController,
    notificationsController,
    notifyTestController
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

router.get(
    "/dashboard",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    dashboardController
)

router.get(
    "/notifications",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    notificationsController
)

router.post(
    "/notifications/read",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    markNotificationsReadController
)

router.delete(
    "/notifications/read",
    verifyToken,
    checkRole("admin","supervisor", "operario"),
    clearNotificationReadsController
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


export default router
