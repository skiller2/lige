import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { custodiaController } from "../controller/controller.module"

export const custodiaRouter = Router()

custodiaRouter.post('/add', authMiddleware.verifyToken, (req, res, next) => { custodiaController.addObjetivoCustodia(req, res, next) } )
custodiaRouter.post('/update/:id', authMiddleware.verifyToken, (req, res, next) => { custodiaController.updateObjetivoCustodia(req, res, next) } )
custodiaRouter.get('/list', authMiddleware.verifyToken, (req, res, next) => { custodiaController.listObjetivoCustodiaByResponsable(req, res, next) } )
custodiaRouter.get('/:id', authMiddleware.verifyToken, (req, res, next) => { custodiaController.infoObjCustodia(req, res, next) } )