import { infoRouter } from "./info.routes";
import { WebServer } from "../server";
import { authRouter } from "./auth.routes";
import { liquidaRouter } from "./liquida.routes";
import { personalRouter } from "./personal.routes";
import { clienteRouter } from "./cliente.routes";
import { initRouter } from "./init.routes";
import { sucursalRouter } from "./sucursal.routes";
import { objetivoRouter } from "./objetivo.routes";
import { asistenciaRouter } from "./asistencia.routes";
import { adelantosRouter } from "../adelantos/adelantos.routes";
import { impuestosAfipRouter } from "../impuestos-afip/impuestos-afip.routes";
import { categoriasRouter } from "../categorias-cambio/categorias-cambio.routes";
import { objetivosPendasisRouter } from "../objetivos-pendasis/objetivos-pendasis.routes";
import { telefoniaRouter } from "../telefonia/telefonia.routes";
import { liquidacionesRouter } from "../liquidaciones/liquidaciones.routes";

export function makeRoutes(server: WebServer) {
  server.setRoute("/api/info", infoRouter);
  server.setRoute("/api/auth", authRouter);
  server.setRoute("/api/liquida", liquidaRouter);
  server.setRoute("/api/personal", personalRouter);
  server.setRoute("/api/cliente", clienteRouter);
  server.setRoute("/api/init", initRouter);
  server.setRoute("/api/sucursales", sucursalRouter);
  server.setRoute("/api/objetivos", objetivoRouter);
  server.setRoute("/api/asistencia", asistenciaRouter);
  server.setRoute("/api/adelantos", adelantosRouter);
  server.setRoute("/api/impuestos_afip", impuestosAfipRouter);
  server.setRoute("/api/categorias", categoriasRouter);
  server.setRoute("/api/objetivos-pendasis", objetivosPendasisRouter);
  server.setRoute("/api/telefonia", telefoniaRouter);
  server.setRoute("/api/liquidaciones", liquidacionesRouter);
}
