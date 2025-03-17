import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { cargaLicenciaController, estudioController } from "../controller/controller.module"

export const estudioRouter = Router()

estudioRouter.get('/tipo/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.getTiposEstudio(req, res, next) } )
estudioRouter.get('/estado/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.geEstadosEstudio(req, res, next) } )

estudioRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    estudioController.getGridCols(req, res);
  });

estudioRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    estudioController.list(req, res, next)
  })

estudioRouter.post('/search', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    estudioController.search(req, res, next)
  })

estudioRouter.post('/setestudio', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    estudioController.setEstudio(req, res, next)
  })

estudioRouter.get('/:PersonalId/:PersonalEstudioId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    estudioController.getEstudio(req, res, next)
  })


estudioRouter.delete("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    estudioController.deleteEstudio(req, res, next);
  });
  
  