import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import {reportesController } from "../controller/controller.module";

export const reportesRouter = Router();

reportesRouter.get('/filterReport/:title',  [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    reportesController.filterReport(req, res, next) 
})

reportesRouter.post('/descarga',  [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { 
    reportesController.Report(req, res, next) 
})

