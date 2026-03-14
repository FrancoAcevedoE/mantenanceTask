import express from "express"
import { login } from "../controllers/userController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/login", login)

router.post(
    "/createuser",
    verifyToken,
    checkRole("admin"),
    (req,res)=>{
        res.json({message:"usuario creado"})
    }
)

export default router
