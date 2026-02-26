import { infoRouter } from "./info.routes.ts";
import { WebServer } from "../server.ts";
import { authRouter } from "./auth.routes.ts";
import { liquidaRouter } from "./liquida.routes.ts";
import { personalRouter } from "./personal.routes.ts";
import { clienteRouter } from "./cliente.routes.ts";
import { initRouter } from "./init.routes.ts";
import { sucursalRouter } from "./sucursal.routes.ts";
import { objetivoRouter } from "./objetivo.routes.ts";
import { asistenciaRouter } from "./asistencia.routes.ts";
import { adelantosRouter } from "../adelantos/adelantos.routes.ts";
import { impuestosAfipRouter } from "../impuestos-afip/impuestos-afip.routes.ts";
import { categoriasRouter } from "../categorias-cambio/categorias-cambio.routes.ts";
import { objetivosPendasisRouter } from "../objetivos-pendasis/objetivos-pendasis.routes.ts";
import { telefoniaRouter } from "../telefonia/telefonia.routes.ts";
import { liquidacionesRouter } from "../liquidaciones/liquidaciones.routes.ts";
import { informesRouter } from "../informes/informes.routes.ts";
import { pendieteRouter } from "./pendiente.routes.ts";
import { documentoRouter } from "../documento/documento.routes.ts";
import { recibosRouter } from "../recibos/recibos.routes.ts";
import { personalObjetivoRouter } from "../personal-objetivo/personal-objetivo.routes.ts";
import { listaPersmisoCargaRouter } from "../lista-permisocarga/lista-permisocarga.controller.routes.ts";
import { custodiaRouter } from "./custodia.routes.ts";
import { CargaLicenciaCargaRouter } from "../carga-licencia/carga-licencia.routes.ts"
import { inasistenciaRouter } from "../routes/inasistencia.routes.ts"
import { ayudaAsistencialRouter } from "./ayuda-asistencial.routes.ts"
import { clientesRouter } from "../clientes/clientes.routes.ts";
import { FileUploadRouter } from "./file-upload.routes.ts"
import { objetivosRouter } from "../objetivos/objetivos.routes.ts"
import { administradorRouter } from "./administrador.routes.ts";
import { rubroRouter } from "./rubro.routes.ts";
import { accesoBotRouter } from "../acceso-bot/acceso.routes.ts";
import { situacionrevistaRouter } from "../routes/situacionrevista.routes.ts";
import { domicilioRouter } from "../domicilio/domicilio.routes.ts";
import { estudioRouter } from "../routes/estudio.routes.ts";
import { preciosProductosRouter } from "../precios-productos/precios-productos.routes.ts";
import { descripcionProductoControllerRouter } from "./descripcion-producto.routes.ts";
import { grupoActividadRouter } from "../grupo-actividad/grupo-actividad.routes.ts";
import { segurosRouter } from "../seguros/seguros.routes.ts";
import { reportesRouter } from "../reportes/reportes.routes.ts";
import { gestionDescuentosRouter } from "../gestion-descuentos/gestion-descuentos.routes.ts";
import { cursoRouter } from "../routes/curso.routes.ts";
import { centroCapacitacionRouter } from "../routes/centro-capacitacion.routes.ts";
import { actasRouter } from "../actas/actas.routes.ts";
import { institucionesRouter } from "./instituciones.routes.ts";
import { AdministradoresRouter } from "../administradores/administradores.routes.ts";
import { importeVentaVigilanciaRouter } from "../importe-venta-vigilancia/importe-venta-vigilancia.routes.ts";
import { facturacionRouter } from "../facturacion/facturacion.routes.ts";
import { novedadesRouter } from "../novedades/novedades.routes.ts";
import { procesosAutomaticosRouter } from "../procesos-automaticos/procesos-automaticos.routes.ts";
import { excepcionesAsistenciaRouter } from "../excepciones-asistencia/excepciones-asistencia.routes.ts";
import { efectoRouter } from "../efecto/efecto.router.ts";
import { habilitacionesRouter } from "../habilitaciones/habilitaciones.routes.ts";
import { parametrosVentaRouter } from "../parametro-venta/parametro-venta.routes.ts";
import { salarioMinimoVitalMovilRouter } from "../salario-minimo-vital-movil/salario-minimo-vital-movil.routes.ts";
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
  server.setRoute("/api/file-upload", FileUploadRouter)
  server.setRoute("/api/objetivos", objetivosRouter)
  server.setRoute("/api/administrador", administradorRouter)
  server.setRoute("/api/rubro", rubroRouter)
  server.setRoute("/api/acceso-bot", accesoBotRouter)
  server.setRoute("/api/situacion-revista", situacionrevistaRouter)
  server.setRoute("/api/domicilio", domicilioRouter)
  server.setRoute("/api/estudio", estudioRouter)
  server.setRoute("/api/productos", preciosProductosRouter)
  server.setRoute("/api/descripcion-productos", descripcionProductoControllerRouter)
  server.setRoute("/api/grupo-actividad", grupoActividadRouter)
  server.setRoute("/api/seguros", segurosRouter)
  server.setRoute("/api/reportes", reportesRouter)
  server.setRoute("/api/gestion-descuentos", gestionDescuentosRouter)
  server.setRoute("/api/curso", cursoRouter)
  server.setRoute("/api/centro-capacitacion", centroCapacitacionRouter)
  server.setRoute("/api/instituciones", institucionesRouter)
  server.setRoute("/api/actas", actasRouter)
  server.setRoute("/api/administradores", AdministradoresRouter)
  server.setRoute("/api/importe-venta-vigilancia", importeVentaVigilanciaRouter)
  server.setRoute("/api/facturacion", facturacionRouter)
  server.setRoute("/api/novedades", novedadesRouter)
  server.setRoute("/api/procesos-automaticos", procesosAutomaticosRouter)
  server.setRoute("/api/excepciones-asistencia", excepcionesAsistenciaRouter)
  server.setRoute("/api/efecto", efectoRouter)
  server.setRoute("/api/habilitaciones", habilitacionesRouter)
  server.setRoute("/api/parametros-venta", parametrosVentaRouter)
  server.setRoute("/api/salario-minimo-vital-movil", salarioMinimoVitalMovilRouter)
}
