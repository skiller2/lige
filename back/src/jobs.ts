import 'dotenv/config';
import { logger } from "./logger/logger.ts";

import { DBServer, WebServer } from "./server.ts";
import { makeRoutes } from "./routes/routes.module.ts"

import { scheduleJob } from "node-schedule"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller.ts";
import { CargaLicenciaController } from "./carga-licencia/carga-licencia.controller.ts";
import { GrupoActividadController } from "./grupo-actividad/grupo-actividad.controller.ts";
import { AsistenciaController } from "./controller/asistencia.controller.ts";
import { SegurosController } from "./seguros/seguros.controller.ts";
import { Temporal } from "@js-temporal/polyfill";
import { ClientesController } from "./clientes/clientes.controller.ts";
import { HabilitacionesController } from "./habilitaciones/habilitaciones.controller.ts";
import { GestionDescuentosController } from "./gestion-descuentos/gestion-descuentos.controller.ts";

import { version, GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { ClientException } from './controller/base.controller.ts';
import { direccionesController, movimientoStockController } from './controller/controller.module.ts';



async function main() {
  // Init App
  const dbServer = new DBServer(5, 2000)

  scheduleJob('1 0 * * *', async function (fireDate) { //At 12:01 AM
  });


  let fechaActual = new Date()
  fechaActual.setHours(0, 0, 0, 0)

  let fechaAyer = new Date()
  fechaAyer.setDate(fechaAyer.getDate() - 1);
  fechaAyer.setHours(0, 0, 0, 0)
  logger.info('Fecha', { actual: fechaActual, ayer: fechaAyer })


  const currentDateTime = Temporal.Now.zonedDateTimeISO()
  const newDateTime = currentDateTime.subtract({ months: 1 });

  logger.info('New DateTime', { newDateTime: newDateTime.toString() });


  dbServer.init()
    .then((res) => {
      logger.info(`${res.res}`)


      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() - 1);
      const anio = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1

      //    const segurosController = new SegurosController()
      //    segurosController.updateSeguros(null,null,anio,mes,(ret: any) => ret)

      //  grupoActividadController.gruposPersonas(null, null, (ret: any) => ret)

    })
    .catch((error) => {
      logger.error(error)
      //    process.exit()
    })

    const mockReq: any = {
      body: { },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    }
    await direccionesController.jobUpdateDirecciones(mockReq, null, (ret: any) => ret)

}

main().catch((res) => logger.error(res.message, { stack: res.stack }));
