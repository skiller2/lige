import { infoRouter } from "../info/info.routes";
import { WebServer } from "../server";
import { personalRouter } from "./personal.routes";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/personal", personalRouter);
}
