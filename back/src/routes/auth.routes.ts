import { Router } from 'express'
import { authController } from '../controller/controller.module';
import { authMiddleware } from "../middlewares/middleware.module";

export const authRouter = Router();
const base = '';

authRouter.post(`${base}/signin`, (req, res) => { authController.signin(res,req)})
authRouter.post(`${base}/login`, (req, res) => { authController.signin(res,req)})
authRouter.get(`${base}/refresh`, authMiddleware.verifyToken,(req, res) => { authController.refreshToken(res, req)})
authRouter.post(`${base}/refresh`, authMiddleware.verifyToken,(req, res) => { authController.refreshToken(res, req)})


