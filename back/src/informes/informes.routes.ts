import { Request, Router } from "express"
import { authMiddleware } from "../middlewares/middleware.module.ts";
import {
    informesController
} from "../controller/controller.module.ts";
import multer, { FileFilterCallback } from "multer";
import { existsSync, mkdirSync } from "fs";
import { tmpName } from "../server.ts";
import { ClientException } from "../controller/basecontroller.ts";

export const informesRouter = Router();

informesRouter.post('/', [], async (req, res, next) => {
    await informesController.Report(req, res, next)
})

informesRouter.post('/descarga', [authMiddleware.verifyToken], async (req, res, next) => {
    await informesController.Report(req, res, next)
})
