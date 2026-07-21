import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { efectoController } from "../controller/controller.module.ts";

export const efectoRouter = Router();

efectoRouter.get("/personal/:id", [authMiddleware.verifyToken,], (req, res, next) => {
  efectoController.getEfectoByPersonalId(req, res, next);
});
efectoRouter.get("/objetivo/:id", [authMiddleware.verifyToken,], (req, res, next) => {
  efectoController.getEfectoByObjetivoId(req, res, next);
});

efectoRouter.get("/colsPersonal", [authMiddleware.verifyToken], (req, res) => {
  efectoController.getGridColsPersonal(req, res);
});
efectoRouter.post("/getEfectoPersonal", [authMiddleware.verifyToken], (req, res, next) => {
  efectoController.getEfectoPersonal(req, res, next);
});

efectoRouter.get("/colsObjetivos", [authMiddleware.verifyToken], (req, res) => {
  efectoController.getGridColsObjetivos(req, res);
});
efectoRouter.post("/getEfectoObjetivos", [authMiddleware.verifyToken], (req, res, next) => {
  efectoController.getEfectoObjetivos(req, res, next);
});

efectoRouter.get("/colsDeposito", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res) => {
  efectoController.getGridColsDeposito(req, res);
});
efectoRouter.post("/getEfectoDeposito", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  efectoController.getEfectoDeposito(req, res, next);
});

efectoRouter.get("/colsProveedores", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res) => {
  efectoController.getGridColsProveedores(req, res);
});
efectoRouter.post("/getEfectoProveedores", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  efectoController.getEfectoProveedores(req, res, next);
});

efectoRouter.get("/colsEfectoGeneral", [authMiddleware.verifyToken], (req, res) => {
  efectoController.getGridColsEfectoGeneral(req, res);
});
efectoRouter.post("/getEfectoGeneral", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  efectoController.getEfectoGeneral(req, res, next);
});

efectoRouter.get("/colsMovimientos", [authMiddleware.verifyToken], (req, res) => {
  efectoController.getGridColsMovimientos(req, res);
});
efectoRouter.get("/filters", [authMiddleware.verifyToken, authMiddleware.verifyGrupoActividad, authMiddleware.filterSucursal, authMiddleware.authADGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  return efectoController.getGridFilters(req, res, next);
});
efectoRouter.post("/getEfectoMovimientos", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  efectoController.getEfectoMovimientos(req, res, next);
});
efectoRouter.get("/movimientoDetalle/:codigo", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gLogistica', 'gLogisticaCon'])], (req, res, next) => {
  efectoController.getEfectoMovimientoDetalle(req, res, next);
});

efectoRouter.post("/searchEfecto", authMiddleware.verifyToken, (req, res, next) => {
  efectoController.searchEfecto(req, res, next);
});

efectoRouter.post("/searchEfectoIndividual", authMiddleware.verifyToken, (req, res, next) => {
  efectoController.searchEfectoIndividual(req, res, next);
});

efectoRouter.get("/relaciones/:id", authMiddleware.verifyToken, (req, res, next) => {
  efectoController.getEfectoRelaciones(req, res, next);
});

efectoRouter.get("/ubicaciones/:id", authMiddleware.verifyToken, (req, res, next) => {
  efectoController.getEfectoUbicaciones(req, res, next);
});

efectoRouter.get("/atributos", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.getAtributos(req, res, next);
});

efectoRouter.get("/valores", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.getValores(req, res, next);
});

efectoRouter.get("/formulario/:id", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.getFormularioEfectoModifica(req, res, next);
});

efectoRouter.post("/modificacion", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  efectoController.guardarEfectoModifica(req, res, next);
});
