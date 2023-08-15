import { Router } from 'express'
import { authController } from '../controller/controller.module';
import { authMiddleware } from "../middlewares/middleware.module";
import rateLimit from 'express-rate-limit'


export const authRouter = Router();
const base = '';

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 10 mins
	max: 5,
	message:
		{msg:"Demasiados reintentos de login fallidos, aguarde unos minutos y vuelva a intentarlo"},
	standardHeaders: true, 
	legacyHeaders: false, 
})

authRouter.post(`${base}/signin`, (req, res, next) => {
	authController.signin(req, res, next)
})
	
authRouter.post(`${base}/login`, loginLimiter, (req, res, next) => {
	authController.signin(req, res, next)
})

authRouter.post(`${base}/credentials`, (req, res, next) => {
	authController.signin(req, res, next)
})


authRouter.get(`${base}/refresh`, authMiddleware.verifyToken, (req, res, next) => {
	authController.refreshToken(req, res, next)
})

authRouter.post(`${base}/refresh`, authMiddleware.verifyToken, (req, res, next) => {
	authController.refreshToken(req, res, next)
})
