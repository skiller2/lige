import { PersonalController } from "./personal.controller";
import { RecibosController } from "./recibos.controller";
import { ImpuestosAfipController } from "./impuestos-afip.controller";
import { ChatBotController } from "./chatbot.controller";

export const personalController = new PersonalController();
export const recibosController = new RecibosController();
export const impuestosAfipController = new ImpuestosAfipController();
export const chatBotController = new ChatBotController();