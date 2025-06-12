import { PersonalController } from "./personal.controller";
import { DocumentosController } from "./documentos.controller";
import { ChatBotController } from "./chatbot.controller";

export const personalController = new PersonalController();
export const documentosController = new DocumentosController();
export const chatBotController = new ChatBotController();