import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { custodiaController } from "../controller/controller.module"

export const custodiaRouter = Router()

custodiaRouter.post('/addobjetivo', authMiddleware.verifyToken, (req, res, next) => { custodiaController.addObjetivoCustodia(req, res, next) } )