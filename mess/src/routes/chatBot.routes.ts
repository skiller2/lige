import { Router } from "express";
import { chatBotController } from "../controller/controller.module";

export const chatBotRouter = Router();
chatBotRouter.get(`/qr/:imgcount?`, (req, res, next) => {chatBotController.getChatBotQR(req, res, next)});
chatBotRouter.get(`/status`, (req, res, next) => {chatBotController.getChatBotStatus(req, res, next)});
chatBotRouter.get(`/delay`, (req, res, next) => {chatBotController.getChatBotDelay(req, res, next)});
chatBotRouter.post(`/delay`, (req, res, next) => {chatBotController.setChatBotDelay(req, res, next)});