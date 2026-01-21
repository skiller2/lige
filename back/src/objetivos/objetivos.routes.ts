import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import { objetivosController } from "../controller/controller.module";

export const objetivosRouter = Router();


objetivosRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  objetivosController.getGridCols(req, res);
});

objetivosRouter.get("/docs-cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  objetivosController.getDocsGridCols(req, res);
});

objetivosRouter.post('/list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.list(req, res, next)
})

objetivosRouter.post('/docs-list', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.listDocsObjetivo(req, res, next)
})

objetivosRouter.get('/getDescuento', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.getDescuento(req, res)
})

objetivosRouter.get('/infObjetivo/:ObjetivoId/:ClienteId/:ClienteElementoDependienteId', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.infObjetivo(req, res, next)
})

objetivosRouter.post('/update/:id', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial'])], (req, res, next) => {
  objetivosController.updateObjetivo(req, res, next)
})

objetivosRouter.delete("/", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial'])], (req, res, next) => {
  objetivosController.deleteObjetivo(req, res, next);
})

objetivosRouter.post('/add', [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial'])], (req, res, next) => {
  objetivosController.addObjetivo(req, res, next)
})

//////////

objetivosRouter.get("/colsHistoryContrato", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  objetivosController.getGridColsHistoryContrato(req, res);
});

objetivosRouter.get("/colsHistoryDomicilio", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  objetivosController.getGridColsHistoryDomicilio(req, res);
});

objetivosRouter.get("/colsHistoryGrupoActividad", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res) => {
  objetivosController.getGridColsHistoryGrupoActiviadad(req, res);
});

objetivosRouter.post("/listHistoryContrato", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.listHistoryContrato(req, res, next);
});

objetivosRouter.post("/listHistoryDomicilio", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.listHistoryDomicilio(req, res, next);
});

objetivosRouter.post("/listHistoryGrupoActividad", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gComercial', 'gComercialCon'])], (req, res, next) => {
  objetivosController.listHistoryGrupoActividad(req, res, next);
});
