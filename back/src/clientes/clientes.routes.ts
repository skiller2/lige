import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { clientesController} from "../controller/controller.module";

export const clientesRouter = Router();

clientesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res) => {
    clientesController.getGridCols(req, res);
  });

clientesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res, next) => {
    clientesController.listClientes(req, res, next)
})

clientesRouter.get('/obj/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res, next) => { 
  clientesController.infoCliente(req, res, next) 
})

clientesRouter.get('/getProvincia', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getProvinciasQuery(req, res, next) 
})

clientesRouter.get('/getLocalidad', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getLocalidadQuery(req, res, next) 
})

clientesRouter.get('/getBarrio', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getBarrioQuery(req, res, next) 
})
