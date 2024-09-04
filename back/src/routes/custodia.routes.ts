import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { custodiaController } from "../controller/controller.module"

export const custodiaRouter = Router()

custodiaRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo','Custodias'])], (req, res, next) => { custodiaController.addObjetivoCustodia(req, res, next) } )
custodiaRouter.post('/update/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo','Custodias'])], (req, res, next) => { custodiaController.updateObjetivoCustodia(req, res, next) } )
custodiaRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo','Custodias'])], (req, res, next) => { custodiaController.listObjetivoCustodiaByResponsable(req, res, next) } )
custodiaRouter.post('/patente', authMiddleware.verifyToken, (req, res, next) => { custodiaController.searhPatente(req, res, next) } )
custodiaRouter.post('/lastdueno', authMiddleware.verifyToken, (req, res, next) => { custodiaController.getPersonalByPatente(req, res, next) } )
custodiaRouter.post('/requirente/search', authMiddleware.verifyToken, (req, res, next) => { custodiaController.searchRequirente(req, res, next) } )
custodiaRouter.post('/requirente', authMiddleware.verifyToken, (req, res, next) => { custodiaController.getRequirenteByCliente(req, res, next) } )
custodiaRouter.post('/setestado', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo','Custodias'])], (req, res, next) => { custodiaController.setEstados(req, res, next) } )
custodiaRouter.get('/cols', authMiddleware.verifyToken, (req, res, next) => { custodiaController.getGridColumns(req, res, next) } )
custodiaRouter.get('/obj/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo','Custodias'])], (req, res, next) => { custodiaController.infoObjCustodia(req, res, next) } )
custodiaRouter.get('/estados', authMiddleware.verifyToken, (req, res, next) => { custodiaController.getEstados(req, res, next) } )