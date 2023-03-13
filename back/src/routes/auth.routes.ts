import { Router } from 'express'
import { authController } from '../controller/controller.module';
import { authMiddleware } from "../middlewares/middleware.module";

const router = Router();
const base = '';

router.post(`${base}/signin`, (req, res) => { authController.signin(res,req)})
router.post(`${base}/login`, (req, res) => { authController.signin(res,req)})
router.get(`${base}/refresh`, authMiddleware.verifyToken,(req, res) => { authController.refreshToken(res, req)})
router.post(`${base}/refresh`, authMiddleware.verifyToken,(req, res) => { authController.refreshToken(res, req)})


export default router;
