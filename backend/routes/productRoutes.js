import express from "express"
import { createProductController, getProductsController, updateProductController, deleteProductController, deleteAllProductsController, getProductAuditLogController } from "../controllers/productController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/", verifyToken, checkRole("admin"), createProductController)
router.get("/", verifyToken, checkRole("admin", "vendedor"), getProductsController)
router.get("/audit-log", verifyToken, checkRole("admin"), getProductAuditLogController)
router.put("/:id", verifyToken, checkRole("admin"), updateProductController)
router.delete("/all", verifyToken, checkRole("admin"), deleteAllProductsController)
router.delete("/:id", verifyToken, checkRole("admin"), deleteProductController)

export default router
