import { infoRouter } from "./info.routes";
import { WebServer } from "../server";
import { authRouter } from "./auth.routes";
import { liquidaRouter } from "./liquida.routes";
import { personalRouter } from "./personal.routes";
import { initRouter } from "./init.routes";
import { sucursalRouter } from "./sucursal.routes";
import { objetivoRouter } from "./objetivo.routes";
import { asistenciaRouter } from "./asistencia.routes";
import { adelantosRouter } from "../adelantos/adelantos.routes";
import { impuestosAfipRouter } from "../impuestos-afip/impuestos-afip.routes";
import { categoriasRouter } from "../categorias-cambio/categorias-cambio.routes";
import { objetivosPendasisRouter } from "../objetivos-pendasis/objetivos-pendasis.routes";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/auth", authRouter);
  server.setRoute("/api/liquida", liquidaRouter);
  server.setRoute("/api/personal", personalRouter);
  server.setRoute("/api/init", initRouter);
  server.setRoute("/api/sucursales", sucursalRouter);
  server.setRoute("/api/objetivos", objetivoRouter);
  server.setRoute("/api/asistencia", asistenciaRouter);
  server.setRoute("/api/adelantos", adelantosRouter);
  server.setRoute("/api/impuestos_afip", impuestosAfipRouter);
  server.setRoute("/api/categorias", categoriasRouter);
  server.setRoute("/api/objetivos-pendasis", objetivosPendasisRouter);
}
