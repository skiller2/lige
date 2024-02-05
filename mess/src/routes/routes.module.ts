import { infoRouter } from "../info/info.routes";
import { WebServer } from "../server";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
}
