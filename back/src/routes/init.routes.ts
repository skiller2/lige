import { Router } from "express";
import { initController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const initRouter = Router();
const base = "";

initRouter.get(`${base}/stats/horastrabajadas/:anio`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getHorasTrabajadas(req, res, next)
})

initRouter.get(`${base}/stats/adelantospendientes`, authMiddleware.verifyToken, (req, res, next) => {
    initController.getAdelantosPendientes(req, res, next)
})

initRouter.get(`${base}/stats/excepcionespendientes`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getExcepcionesPendientes(req, res, next)
})

initRouter.get(`${base}/stats/objetivosactivos`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getObjetivosActivos(req, res, next)
})

initRouter.get(`${base}/stats/objetivossinasistencia/:anio/:mes`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getObjetivosSinAsistencia(req, res, next)
})

initRouter.get(`${base}/stats/licenciasinconsistentes/:anio/:mes`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getLicenciasInconsistentes(req, res, next)
})

initRouter.get(`${base}/stats/objetivossingrupo`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getObjetivosSinGrupo(req, res, next)
})

initRouter.get(`${base}/stats/clientesactivos`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getClientesActivos(req, res, next)
})

initRouter.get(`${base}/stats/cambioscategoria`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getCategoriasPendientes(req, res, next)
})

initRouter.get(`${base}/stats/custodiaspendientes/:anio/:mes`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getCustodiasPendientes(req, res, next)
})

initRouter.get(`${base}/stats/recibos`, authMiddleware.verifyToken, (req, res, next) => {
	initController.getRecibosPendDescarga(req, res, next)
})
