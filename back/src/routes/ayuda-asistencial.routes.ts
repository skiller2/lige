import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { ayudaAsistencialController } from "../controller/controller.module"

export const ayudaAsistencialRouter = Router()

ayudaAsistencialRouter.get('/cols', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.getGridColumns(req, res, next) } )
ayudaAsistencialRouter.get('/estados', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.getTipoPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.getAyudaAsistencialList(req, res, next) } )
ayudaAsistencialRouter.post('/updaterow', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.updateRowPersonalPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/aprobar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.personalPrestamoAprobarList(req, res, next) } )
ayudaAsistencialRouter.post('/rechazar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.personalPrestamoRechazarList(req, res, next) } )