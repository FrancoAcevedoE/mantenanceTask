import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'
import { getGroups, getGroupByNombre, createGroup, updateGroup, deleteGroup } from '../controllers/productGroupController.js'

const router = Router()

router.get('/', verifyToken, getGroups)
router.get('/:nombre', verifyToken, getGroupByNombre)
router.post('/', verifyToken, checkRole('admin', 'admin_ventas'), createGroup)
router.put('/:id', verifyToken, checkRole('admin', 'admin_ventas'), updateGroup)
router.delete('/:id', verifyToken, checkRole('admin', 'admin_ventas'), deleteGroup)

export default router
