import { Router } from "express";
import { chatBotController } from "../controller/controller.module.ts";

export const chatBotRouter = Router();
chatBotRouter.get(`/qr/:imgcount?`, (req, res, next) => {chatBotController.getChatBotQR(req, res, next)});
chatBotRouter.get(`/status`, (req, res, next) => {chatBotController.getChatBotStatus(req, res, next)});
chatBotRouter.get(`/delay`, (req, res, next) => {chatBotController.getChatBotDelay(req, res, next)});
chatBotRouter.post(`/delay`, (req, res, next) => {chatBotController.setChatBotDelay(req, res, next)});
chatBotRouter.post(`/sendAlert`, (req, res, next) => { chatBotController.sendAlert(req, res, next) });
chatBotRouter.post(`/gotoFlow`, (req, res, next) => { chatBotController.gotoFlow(req, res, next) });
chatBotRouter.post(`/chat`, (req, res, next) => { chatBotController.chat(req, res, next) });
chatBotRouter.post(`/reinicia`, (req, res, next) => { chatBotController.reinicia(req, res, next) });
        
