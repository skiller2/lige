import { PersonalController } from "./personal.controller.ts";
import { DocumentosController } from "./documentos.controller.ts";
import { ChatBotController } from "./chatbot.controller.ts";
import { NovedadController } from "./novedad.controller.ts";

export const personalController = new PersonalController();
export const documentosController = new DocumentosController();
export const chatBotController = new ChatBotController();
export const novedadController = new NovedadController();