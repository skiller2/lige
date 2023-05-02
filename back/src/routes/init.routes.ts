import { Router } from "express";
import { initController } from "../controller/controller.module";
import { authMiddleware } from "../middlewares/middleware.module";

export const initRouter = Router();
const base = "";

initRouter.get(`${base}/stats/horastrabajadas/:anio`,  authMiddleware.verifyToken, (req, res) => {
    initController.getHorasTrabajadas(req, res);
})

initRouter.get(`${base}/stats/adelantospendientes`,  authMiddleware.verifyToken, (req, res) => {
    initController.getAdelantosPendientes(req, res);
})

initRouter.get(`${base}/stats/excepcionespendientes`,  authMiddleware.verifyToken, (req, res) => {
    initController.getExcepcionesPendientes(req, res);
})


initRouter.get(`${base}/stats/objetivosactivos`,  authMiddleware.verifyToken, (req, res) => {
    initController.getObjetivosActivos(req, res);
})

initRouter.get(`${base}/stats/objetivossinasistencia/:anio/:mes`,  authMiddleware.verifyToken, (req, res) => {
    initController.getObjetivosSinAsistencia(req, res);
})

initRouter.get(`${base}/stats/clientesactivos`,  authMiddleware.verifyToken, (req, res) => {
    initController.getClientesActivos(req, res);
})
