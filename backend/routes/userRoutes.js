import express from "express"
import { createUser, deleteUser, getUsers, login } from "../controllers/userController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/login", login)

router.get(
    "/",
    verifyToken,
    checkRole("admin"),
    getUsers
)

router.post(
    "/",
    verifyToken,
    checkRole("admin"),
    createUser
)

router.delete(
    "/:id",
    verifyToken,
    checkRole("admin"),
    deleteUser
)

export default router
