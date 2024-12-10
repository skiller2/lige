import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { estudioController } from "../controller/controller.module"

export const estudioRouter = Router()

estudioRouter.get('/tipo/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.getTiposEstudio(req, res, next) } )
estudioRouter.get('/estado/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.geEstadosEstudio(req, res, next) } )