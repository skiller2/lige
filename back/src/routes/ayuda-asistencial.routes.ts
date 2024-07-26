import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { ayudaAsistencialController } from "../controller/controller.module"

export const ayudaAsistencialRouter = Router()

ayudaAsistencialRouter.get('/cols', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.getGridColumns(req, res, next) } )
ayudaAsistencialRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.getAyudaAsistencialList(req, res, next) } )