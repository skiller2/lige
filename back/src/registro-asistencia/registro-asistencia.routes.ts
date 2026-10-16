import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import { registroAsistenciaController } from "../controller/controller.module.ts";

export const registroAsistenciaRouter = Router();

// Rutas públicas (sin login), como acceso-bot: el marcado se hace desde un dispositivo sin sesión.
// Por el momento quedan comentados verifyToken y gSistemas; falta proteger /confirmar y /anular
// con comprobantes firmados y limitar los pedidos por IP.

registroAsistenciaRouter.get("/configuracion", /* [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], */ (req, res, next) => {
  registroAsistenciaController.getConfiguracion(req, res, next);
});

registroAsistenciaRouter.get("/tipos-lugar", /* [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], */ (req, res) => {
  registroAsistenciaController.getTiposLugar(req, res);
});

registroAsistenciaRouter.post("/confirmar", /* [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], */ (req, res, next) => {
  registroAsistenciaController.confirmar(req, res, next);
});

registroAsistenciaRouter.post("/anular", /* [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], */ (req, res, next) => {
  registroAsistenciaController.anular(req, res, next);
});

registroAsistenciaRouter.post("/marcar", /* [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], */ (req, res, next) => {
  registroAsistenciaController.marcar(req, res, next);
});

// ------------------------------------------------------------------------
// Consulta de registros de asistencia: a diferencia del marcado, con login
// ------------------------------------------------------------------------

registroAsistenciaRouter.get("/cols", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res) => {
  registroAsistenciaController.getGridCols(req, res);
});

registroAsistenciaRouter.post("/list", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  registroAsistenciaController.listRegistros(req, res, next);
});

// Calcula los vectores faciales de las fotos del personal (botón de la tuerca de la consulta)
registroAsistenciaRouter.post("/vectores-faciales/calcular", [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {
  registroAsistenciaController.iniciarCalculoVectoresFaciales(req, res, next);
});

