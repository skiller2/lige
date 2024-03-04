import { infoRouter } from "../info/info.routes";
import { WebServer } from "../server";
import { personalRouter } from "./personal.routes";
import { recibosRouter } from "./recibos.routes";
import { impuestosAfipRouter } from "./impuestos-afip.routes";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/personal", personalRouter);
  server.setRoute("/api/recibos", recibosRouter);
  server.setRoute("/api/impuestos_afip", impuestosAfipRouter);
}
