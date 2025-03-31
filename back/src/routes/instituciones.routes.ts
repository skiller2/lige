import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { cursoController, institucionesController } from "../controller/controller.module"

export const institucionesRouter = Router()

institucionesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.getGridCols(req, res);
  });

institucionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.list(req, res, next)
  });

institucionesRouter.post('/listHistory', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    institucionesController.listHistory(req, res, next)
});

institucionesRouter.post('/setinstitucion', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.setInstitucion(req, res, next)
})

institucionesRouter.post('/setsede', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.setSede(req, res, next)
})
  

  


  