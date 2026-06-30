import express from "express"
import {
    createUser,
    deleteUser,
    deleteUserPermanent,
    downloadAuditLogController,
    listAuditLogController,
    getOperarios,
    getPushPublicKey,
    getUsers,
    login,
    restoreUser,
    subscribeToPush,
    unsubscribeFromPush,
    updateUser
} from "../controllers/userController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/login", login)

router.get(
    "/operarios",
    verifyToken,
    checkRole("admin", "supervisor", "operario"),
    getOperarios
)

router.get(
    "/push/public-key",
    verifyToken,
    checkRole("admin", "supervisor", "operario"),
    getPushPublicKey
)

router.post(
    "/push/subscribe",
    verifyToken,
    checkRole("admin", "supervisor", "operario"),
    subscribeToPush
)

router.delete(
    "/push/subscribe",
    verifyToken,
    checkRole("admin", "supervisor", "operario"),
    unsubscribeFromPush
)

router.get(
    "/",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    getUsers
)

router.get(
    "/audit-log/download",
    verifyToken,
    checkRole("admin"),
    downloadAuditLogController
)

router.get(
    "/audit-log",
    verifyToken,
    checkRole("admin"),
    listAuditLogController
)

router.post(
    "/",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    createUser
)

router.patch(
    "/:id",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    updateUser
)

router.delete(
    "/:id/permanent",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    deleteUserPermanent
)

router.patch(
    "/:id/restore",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    restoreUser
)

router.delete(
    "/:id",
    verifyToken,
    checkRole("admin", "admin_ventas"),
    deleteUser
)

export default router
