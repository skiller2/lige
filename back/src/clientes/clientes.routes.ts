import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { clientesController} from "../controller/controller.module";

export const clientesRouter = Router();


clientesRouter.get("/cols", authMiddleware.verifyToken, (req, res) => {
  clientesController.getGridCols(req, res);
});

clientesRouter.post('/list', authMiddleware.verifyToken,  (req, res, next) => {
  clientesController.listClientes(req, res, next)
})

clientesRouter.get('/infoCliente/:id', authMiddleware.verifyToken,  (req, res, next) => { 
clientesController.infoCliente(req, res, next) 
})


// clientesRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res) => {
//   clientesController.getGridCols(req, res);
// });

// clientesRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res, next) => {
//   clientesController.listClientes(req, res, next)
// })

// clientesRouter.get('/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['Adminitrativo'])], (req, res, next) => { 
// clientesController.infoCliente(req, res, next) 
// })

clientesRouter.get('/getCondicion', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getCondicionQuery(req, res, next) 
})

clientesRouter.get('/getProvincia', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getProvinciasQuery(req, res, next) 
})

clientesRouter.get('/getTipoTelefono', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getTipoTelefono(req, res, next) 
})

clientesRouter.get('/getLocalidad', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getLocalidadQuery(req, res, next) 
})

clientesRouter.get('/getBarrio', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.getBarrioQuery(req, res, next) 
})

clientesRouter.post('/update/:id', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.updateCliente(req, res, next)
} )

clientesRouter.delete("/", authMiddleware.verifyToken, (req, res, next) => {
  clientesController.deleteCliente(req, res, next);
});

clientesRouter.post('/add', authMiddleware.verifyToken, (req, res, next) => { 
  clientesController.addCliente(req, res, next) 
} )


