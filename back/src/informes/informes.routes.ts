import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module";
import {
    informesController
} from "../controller/controller.module";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server";
import { ClientException } from "../controller/baseController";

export const informesRouter = Router();

informesRouter.post('/', [], async (req, res, next) => {
    await informesController.Report(req, res, next)
})

informesRouter.post('/descarga', [authMiddleware.verifyToken], async (req, res, next) => {
    await informesController.Report(req, res, next)
})
