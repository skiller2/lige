import { infoRouter } from "../info/info.routes";
import { WebServer } from "../server";
import { personalRouter } from "./personal.routes";
import { documentosRouter } from "./documentos.routes";
import { chatBotRouter } from "./chatbot.routes";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/personal", personalRouter);
  server.setRoute("/api/documentos", documentosRouter);
  server.setRoute("/api/chatbot", chatBotRouter);
}
