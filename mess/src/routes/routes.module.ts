import { infoRouter } from "../info/info.routes.ts";
import { WebServer } from "../server.ts";
import { personalRouter } from "./personal.routes.ts";
import { documentosRouter } from "./documentos.routes.ts";
import { chatBotRouter } from "./chatbot.routes.ts";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/personal", personalRouter);
  server.setRoute("/api/documentos", documentosRouter);
  server.setRoute("/api/chatbot", chatBotRouter);
}
