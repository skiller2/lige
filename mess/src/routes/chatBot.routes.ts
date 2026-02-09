import { Router } from "express";
import { chatBotController,authMiddleware } from "../controller/controller.module.ts";

export const chatBotRouter = Router();
chatBotRouter.get(`/qr/:imgcount?`,[authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {chatBotController.getChatBotQR(req, res, next)});
chatBotRouter.get(`/status`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],(req, res, next) => {chatBotController.getChatBotStatus(req, res, next)});
chatBotRouter.get(`/delay`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],(req, res, next) => {chatBotController.getChatBotDelay(req, res, next)});
chatBotRouter.post(`/delay`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => {chatBotController.setChatBotDelay(req, res, next)});
chatBotRouter.post(`/sendAlert`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])],(req, res, next) => { chatBotController.sendAlert(req, res, next) });
chatBotRouter.post(`/gotoFlow`, (req, res, next) => { chatBotController.gotoFlow(req, res, next) });
chatBotRouter.post(`/chat`, [authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { chatBotController.chat(req, res, next) });
chatBotRouter.post(`/reinicia`,[authMiddleware.verifyToken, authMiddleware.hasGroup(['gSistemas'])], (req, res, next) => { chatBotController.reinicia(req, res, next) });
        
