import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { residenciaController } from "../controller/controller.module"

export const residenciaRouter = Router()

residenciaRouter.post('/paises', [authMiddleware.verifyToken, ], (req, res, next) => { residenciaController.getPaises(req, res, next) } )
residenciaRouter.post('/provincias', [authMiddleware.verifyToken, ], (req, res, next) => { residenciaController.getProvinciasByPais(req, res, next) } )
residenciaRouter.post('/localidades', [authMiddleware.verifyToken, ], (req, res, next) => { residenciaController.getLocalidadByProvincia(req, res, next) } )
residenciaRouter.post('/barrios', [authMiddleware.verifyToken, ], (req, res, next) => { residenciaController.getBarrioByLocalidad(req, res, next) } )
