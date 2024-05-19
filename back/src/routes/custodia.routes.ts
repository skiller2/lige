import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { custodiaController } from "../controller/controller.module"

export const custodiaRouter = Router()

custodiaRouter.post('/addobjetivo', authMiddleware.verifyToken, (req, res, next) => { custodiaController.addObjetivoCustodia(req, res, next) } )
custodiaRouter.get('/list', authMiddleware.verifyToken, (req, res, next) => { custodiaController.listObjetivoCustodiaByResponsable(req, res, next) } )
custodiaRouter.get('/:custodiaid', authMiddleware.verifyToken, (req, res, next) => { custodiaController.infoObjCustodia(req, res, next) } )