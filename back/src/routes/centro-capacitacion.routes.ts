import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { centroCapacitacionController } from "../controller/controller.module"

export const centroCapacitacionRouter = Router()

centroCapacitacionRouter.get('/search', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    centroCapacitacionController.search(req, res, next)
  })

centroCapacitacionRouter.get('/search/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    centroCapacitacionController.searchId(req, res, next)
  })

centroCapacitacionRouter.get('/searchSede', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    centroCapacitacionController.searchSede(req, res, next)
  })

