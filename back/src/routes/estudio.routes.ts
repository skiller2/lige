import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts"
import { cargaLicenciaController, estudioController } from "../controller/controller.module.ts"

export const estudioRouter = Router()

estudioRouter.get('/tipo/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.getTiposEstudio(req, res, next) } )
estudioRouter.get('/estado/options', [authMiddleware.verifyToken, ], (req, res, next) => { estudioController.geEstadosEstudio(req, res, next) } )

estudioRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    estudioController.getGridCols(req, res);
  });

estudioRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    estudioController.list(req, res, next)
  })

estudioRouter.get('/search', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    estudioController.search(req, res, next)
  })

estudioRouter.post('/setestudio', [authMiddleware.verifyToken,authMiddleware.hasAuthByDocId() , authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => { 
    estudioController.setEstudio(req, res, next)
  })

estudioRouter.get('/searchId/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    estudioController.searchId(req, res, next)
  })

estudioRouter.get('/:PersonalId/:PersonalEstudioId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    estudioController.getEstudio(req, res, next)
  })


estudioRouter.post("/delete", [authMiddleware.verifyToken, authMiddleware.hasAuthByDocId(), authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => {
    estudioController.deleteEstudio(req, res, next);
  });
  
  