import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { checkRole } from '../middlewares/roleMiddleware.js'
import { getGroups, getGroupByNombre, createGroup, updateGroup, deleteGroup } from '../controllers/productGroupController.js'

const router = Router()

router.get('/', verifyToken, getGroups)
router.get('/:nombre', verifyToken, getGroupByNombre)
router.post('/', verifyToken, checkRole('admin'), createGroup)
router.put('/:id', verifyToken, checkRole('admin'), updateGroup)
router.delete('/:id', verifyToken, checkRole('admin'), deleteGroup)

export default router
