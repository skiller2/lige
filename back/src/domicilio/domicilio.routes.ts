import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts"
import { domicilioController } from "../controller/controller.module.ts"

export const domicilioRouter = Router()

domicilioRouter.get('/paises', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getPaises(req, res, next) } )
domicilioRouter.get('/provincias/options', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getProvincias(req, res, next) } )
domicilioRouter.get('/localidades/options', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getLocalidad(req, res, next) } )
domicilioRouter.get('/barrios/options', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getBarrio(req, res, next) } )

domicilioRouter.post('/provincias', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getProvinciasByPais(req, res, next) } )
domicilioRouter.post('/localidades', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getLocalidadByProvincia(req, res, next) } )
domicilioRouter.post('/barrios', [authMiddleware.verifyToken, ], (req, res, next) => { domicilioController.getBarrioByLocalidad(req, res, next) } )