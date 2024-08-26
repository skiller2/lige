import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivosController} from "../controller/controller.module";

export const objetivosRouter = Router();


objetivosRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  objetivosController.getGridCols(req, res);
});

objetivosRouter.post('/list',  (req, res, next) => {
  objetivosController.list(req, res, next)
})

objetivosRouter.get('/getDescuento', authMiddleware.verifyToken, (req, res, next) => { 
  objetivosController.getDescuento(req, res) 
})

objetivosRouter.get('/infObjetivo/:ObjetivoId/:ClienteId/:ClienteElementoDependienteId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Administrativo'])],  (req, res, next) => { 
  objetivosController.infObjetivo(req, res, next) 
  })



