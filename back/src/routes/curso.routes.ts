import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module"
import { cursoController } from "../controller/controller.module"

export const cursoRouter = Router()

cursoRouter.post('/search', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    cursoController.search(req, res, next)
  })


cursoRouter.get("/cols", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
    cursoController.getCursosColumns(req, res, next);
});

cursoRouter.get("/colsHistory", [authMiddleware.verifyToken,authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  cursoController.getCursosColumnsHistory(req, res, next);
});

cursoRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  cursoController.list(req, res, next)
})

cursoRouter.post('/listHistory', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
  cursoController.listHistory(req, res, next)
})



  