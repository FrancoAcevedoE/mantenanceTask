import express from "express"

import {
createClient,
getClients,
getClientById,
updateClient,
deleteClient
} from "../controllers/clientController.js"

import { verifyToken } from "../middlewares/authMiddleware.js"
import { checkRole } from "../middlewares/roleMiddleware.js"

const router = express.Router()

router.post(
"/",
verifyToken,
checkRole("admin"),
createClient
)

router.get(
"/",
verifyToken,
getClients
)

router.get(
"/:id",
verifyToken,
getClientById
)

router.put(
"/:id",
verifyToken,
checkRole("admin"),
updateClient
)

router.delete(
"/:id",
verifyToken,
checkRole("admin"),
deleteClient
)

export default router