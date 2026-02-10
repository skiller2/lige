import { Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import {reportesController } from "../controller/controller.module.ts";

export const reportesRouter = Router();

reportesRouter.get('/filterReport/:title',  [authMiddleware.verifyToken], (req, res, next) => { 
    reportesController.filterReport(req, res, next) 
})

reportesRouter.post('/descarga',  [authMiddleware.verifyToken], (req, res, next) => { 
    reportesController.Report(req, res, next) 
})

