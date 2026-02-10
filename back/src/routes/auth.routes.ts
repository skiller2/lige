import { Router } from 'express'
import { authController } from '../controller/controller.module.ts';
import { authMiddleware } from "../middlewares/middleware.module.ts";
import rateLimit from 'express-rate-limit'


export const authRouter = Router();
const base = '';

const loginLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 10 mins
	max: 5,
	message:
	{
		msg: "Demasiados reintentos de login fallidos, aguarde unos minutos y vuelva a intentarlo",
		data: [],
		stamp: new Date()
	},
	standardHeaders: true,
	legacyHeaders: false,

	keyGenerator: (req, res): any => {
		const requestIdentifier =
			req.headers['x-origin-ip'] ??
			(req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
			req.socket.remoteAddress
		return requestIdentifier

	}

})

authRouter.post(`${base}/signin`, loginLimiter, (req, res, next) => {
	authController.signin(req, res, next)
})

authRouter.post(`${base}/login`, loginLimiter, (req, res, next) => {
	authController.signin(req, res, next)
})

authRouter.post(`${base}/credentials`, loginLimiter, (req, res, next) => {
	authController.signin(req, res, next)
})


authRouter.get(`${base}/refresh`, authMiddleware.verifyToken, (req, res, next) => {
	authController.refreshToken(req, res, next)
})

authRouter.post(`${base}/refresh`, authMiddleware.verifyToken, (req, res, next) => {
	authController.refreshToken(req, res, next)
})
