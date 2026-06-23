import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { getGroups, getGroupByNombre } from '../controllers/productGroupController.js'

const router = Router()

router.get('/', verifyToken, getGroups)
router.get('/:nombre', verifyToken, getGroupByNombre)

export default router
