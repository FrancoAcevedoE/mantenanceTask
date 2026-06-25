import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { COLOR_CATALOG } from '../data/colorCatalog.js'

const router = Router()

router.get('/', verifyToken, (req, res) => {
  res.json(COLOR_CATALOG)
})

export default router
