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
import { informesRouter } from "../informes/informes.routes";
import { pendieteRouter } from "./pendiente.routes";
import { documentoRouter } from "../documento/documento.routes";
import { recibosRouter } from "src/recibos/recibos.routes";
import { personalObjetivoRouter } from "src/personal-objetivo/personal-objetivo.routes";
import { listaPersmisoCargaRouter } from "src/lista-permisocarga/lista-permisocarga.controller.routes";
import { custodiaRouter } from "./custodia.routes";
import { CargaLicenciaCargaRouter } from "../carga-licencia/carga-licencia.routes"
import { inasistenciaRouter } from "../routes/inasistencia.routes"
import { ayudaAsistencialRouter } from "./ayuda-asistencial.routes"
import { clientesRouter } from "../clientes/clientes.routes";
import { FileUploadRouter } from "./file-upload.routes"
import { objetivosRouter } from "../objetivos/objetivos.routes"
import { administradorRouter } from "./administrador.routes";
import { rubroRouter } from "./rubro.routes";
import { accesoBotRouter } from "../acceso-bot/acceso.routes";
import { situacionrevistaRouter } from "../routes/situacionrevista.routes";
import { residenciaRouter } from "../routes/residencia.routes";
import { estudioRouter } from "../routes/estudio.routes";
import { preciosProductosRouter } from "../precios-productos/precios-productos.routes";
import { descripcionProductoControllerRouter } from "./descripcion-producto.routes";
import { grupoActividadRouter } from "../grupo-actividad/grupo-actividad.routes";
import { segurosRouter } from "../seguros/seguros.routes";
import { reportesRouter } from "../reportes/reportes.routes";
import { gestionDescuentosRouter } from "../gestion-descuentos/gestion-descuentos.routes";
import { cursoRouter } from "../routes/curso.routes";
import { centroCapacitacionRouter } from "../routes/centro-capacitacion.routes";
import { actasRouter } from "../actas/actas.routes";
import { institucionesRouter } from "./instituciones.routes"; 
import { AdministradoresRouter } from "../administradores/administradores.routes";

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
  server.setRoute("/api/informes", informesRouter);
  server.setRoute("/api/pendiente", pendieteRouter);
  server.setRoute("/api/documento", documentoRouter);
  server.setRoute("/api/recibos", recibosRouter);
  server.setRoute("/api/personalobjetivo", personalObjetivoRouter);
  server.setRoute("/api/custodia", custodiaRouter);
  server.setRoute("/api/lista-permisocarga", listaPersmisoCargaRouter);
  server.setRoute("/api/carga-licencia", CargaLicenciaCargaRouter);
  server.setRoute("/api/inasistencia", inasistenciaRouter);
  server.setRoute("/api/ayuda-asistencial", ayudaAsistencialRouter)
  server.setRoute("/api/clientes", clientesRouter)
  server.setRoute("/api/file-upload",FileUploadRouter)
  server.setRoute("/api/objetivos",objetivosRouter)
  server.setRoute("/api/administrador",administradorRouter)
  server.setRoute("/api/rubro",rubroRouter)
  server.setRoute("/api/acceso-bot",accesoBotRouter)
  server.setRoute("/api/situacion-revista",situacionrevistaRouter)
  server.setRoute("/api/residencia",residenciaRouter)
  server.setRoute("/api/estudio",estudioRouter)
  server.setRoute("/api/precios-productos",preciosProductosRouter)
  server.setRoute("/api/descripcion-productos",descripcionProductoControllerRouter)
  server.setRoute("/api/grupo-actividad",grupoActividadRouter)
  server.setRoute("/api/seguros",segurosRouter)
  server.setRoute("/api/reportes",reportesRouter)
  server.setRoute("/api/gestion-descuentos",gestionDescuentosRouter)
  server.setRoute("/api/curso",cursoRouter)
  server.setRoute("/api/centro-capacitacion",centroCapacitacionRouter)
  server.setRoute("/api/instituciones",institucionesRouter)
  server.setRoute("/api/actas",actasRouter)
  server.setRoute("/api/administradores",AdministradoresRouter)
}
