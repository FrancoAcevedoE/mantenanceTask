import express from "express"
import { createProductController, getProductsController, updateProductController, deleteProductController, deleteAllProductsController, getProductAuditLogController } from "../controllers/productController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post("/", verifyToken, checkRole("admin", "admin_ventas"), createProductController)
router.get("/", verifyToken, checkRole("admin", "admin_ventas", "vendedor"), getProductsController)
router.get("/audit-log", verifyToken, checkRole("admin", "admin_ventas", "vendedor"), getProductAuditLogController)
router.put("/:id", verifyToken, checkRole("admin", "admin_ventas"), updateProductController)
router.delete("/all", verifyToken, checkRole("admin", "admin_ventas"), deleteAllProductsController)
router.delete("/:id", verifyToken, checkRole("admin", "admin_ventas"), deleteProductController)

export default router
