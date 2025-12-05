import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { ayudaAsistencialController } from "../controller/controller.module"

export const ayudaAsistencialRouter = Router()

ayudaAsistencialRouter.get('/cols', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'])], (req, res, next) => { ayudaAsistencialController.getGridColumns(req, res, next) } )
ayudaAsistencialRouter.get('/tipos', [authMiddleware.verifyToken], (req, res, next) => { ayudaAsistencialController.getTipoPrestamo(req, res, next) } )
ayudaAsistencialRouter.get('/estados', [authMiddleware.verifyToken], (req, res, next) => { ayudaAsistencialController.getEstadoPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'])], (req, res, next) => { ayudaAsistencialController.getAyudaAsistencialList(req, res, next) } )
ayudaAsistencialRouter.post('/updaterow', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones',''])], (req, res, next) => { ayudaAsistencialController.updateRowPersonalPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/aprobar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.personalPrestamoAprobarList(req, res, next) } )
ayudaAsistencialRouter.post('/rechazar', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.personalPrestamoRechazarList(req, res, next) } )
ayudaAsistencialRouter.post('/addcuota', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.personalPrestamoListAddCuota(req, res, next) } )
ayudaAsistencialRouter.post('/addpres', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.addPersonalPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/updpres', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones'])], (req, res, next) => { ayudaAsistencialController.updatePersonalPrestamo(req, res, next) } )
ayudaAsistencialRouter.post('/personal', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'])], (req, res, next) => { ayudaAsistencialController.getPersonalPrestamoByPersonalId(req, res, next) } )
ayudaAsistencialRouter.post('/proxfecha', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'])], (req, res, next) => { ayudaAsistencialController.getProxAplicaEl(req, res, next) } )

ayudaAsistencialRouter.get('/cols/cuotas', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'])], (req, res, next) => { ayudaAsistencialController.getGridColumnsCuotas(req, res, next) } )
ayudaAsistencialRouter.post('/cuotas', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Liquidaciones','Liquidaciones Consultas'] )], (req, res, next) => { ayudaAsistencialController.getListAyudaAsistencialCuotas(req, res, next) } )