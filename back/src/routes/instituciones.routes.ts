import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { institucionesController } from "../controller/controller.module"

export const institucionesRouter = Router()

institucionesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.getGridCols(req, res);
  });

institucionesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  institucionesController.list(req, res, next)
  });


  