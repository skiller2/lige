import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { cursoController, institucionesController } from "../controller/controller.module"

export const institucionesRouter = Router()

institucionesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  institucionesController.getGridCols(req, res);
  });

institucionesRouter.get("/colsEdit", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    institucionesController.getGridColsEdit(req, res);
  });
  
institucionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  institucionesController.list(req, res, next)
  });

institucionesRouter.post('/listEdit', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
  institucionesController.listEdit(req, res, next)
  });

institucionesRouter.post('/listHistory', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal', 'gPersonalCon'])], (req, res, next) => { 
    institucionesController.listHistory(req, res, next)
});

institucionesRouter.post('/setsede', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => { 
  institucionesController.setSede(req, res, next)
})

institucionesRouter.delete('/deletesede', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => { 
  institucionesController.deleteSede(req, res, next)
})
  
institucionesRouter.post('/setinstitucion', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gPersonal'])], (req, res, next) => { 
  institucionesController.setInstitucion(req, res, next)
})

  


  