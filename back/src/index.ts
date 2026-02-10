import { DBServer, WebServer } from "./server.ts";
import { makeRoutes } from "./routes/routes.module.ts"
import { dataSource } from "./data-source.ts";
import { scheduleJob } from "node-schedule"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller.ts";
import { CargaLicenciaController } from "./carga-licencia/carga-licencia.controller.ts";
import dotenv from "dotenv"
import { GrupoActividadController } from "./grupo-actividad/grupo-actividad.controller.ts";
import { AsistenciaController } from "./controller/asistencia.controller.ts";
import { SegurosController } from "./seguros/seguros.controller.ts";
import { Temporal } from "@js-temporal/polyfill";
import { ClientesController } from "./clientes/clientes.controller.ts";
import { HabilitacionesController } from "./habilitaciones/habilitaciones.controller.ts";
//import * as pdfWorker from "pdfjs-dist/build/pdf.worker.mjs";
//import { GlobalWorkerOptions } from "pdfjs-dist";

//GlobalWorkerOptions.workerSrc = pdfWorker


dotenv.config({})

// Init App
const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))
const categoriasController = new CategoriasController()
const grupoActividadController = new GrupoActividadController()
const cargaLicenciaController = new CargaLicenciaController()
const asistenciaController = new AsistenciaController()
const habilitacionesController = new HabilitacionesController()

scheduleJob('1 0 * * *', async function (fireDate) { //At 12:01 AM
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const anio = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1
  
  const segurosController = new SegurosController()
  segurosController.updateSeguros(null,null,anio,mes,(ret: any) => ret)
});

scheduleJob('2 0 * * *', async function (fireDate) { //At 12:02 AM
  //TODO Se debería instanciar Response correctamente

  const ret = await categoriasController.procesaCambios(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});
 
scheduleJob('3 0 * * *', async function (fireDate) { //At 12:03 AM
  //TODO Se debería instanciar Response correctamente

  const ret = await grupoActividadController.objetivosGrupos(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('4 0 * * *', async function (fireDate) {//At 12:04 AM
  const ret = await cargaLicenciaController.deleleTemporalFiles(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('0 0 1 * *', async function (fireDate) { //At 12:00 AM, on day 1 of the month

  const ret = await grupoActividadController.gruposPersonas(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('5 0 * * *', async function (fireDate) {  //At 12:05 AM
  const actual = new Date()
  const anio = actual.getFullYear()
  const mes = actual.getMonth() + 1
  
  const mockReq: any = {
    params: { anio, mes },
    headers: {},
    socket: { remoteAddress: '127.0.0.1' }
  }
  
  await asistenciaController.getListaAsistenciaControAcceso(mockReq, null, (ret: any) => ret)
});

scheduleJob('6 0 * * *', async function (fireDate) {  //At 12:06 AM
  const actual = new Date()
  const anio = actual.getFullYear()
  const mes = actual.getMonth() + 1
  
  const mockReq: any = {
    body: { anio, mes },
    headers: {},
    socket: { remoteAddress: '127.0.0.1' }
  }
  
  await habilitacionesController.jobHabilitacionNecesaria(mockReq, null, (ret: any) => ret)
});


let fechaActual = new Date()
fechaActual.setHours(0, 0, 0, 0)

let fechaAyer = new Date()
fechaAyer.setDate(fechaAyer.getDate() - 1);
fechaAyer.setHours(0, 0, 0, 0)
console.log('actual', fechaActual, 'ayer', fechaAyer)


const currentDateTime = Temporal.Now.zonedDateTimeISO()
const newDateTime = currentDateTime.subtract({ months: 1 });

console.log('newDateTime',newDateTime.toString())


dbServer.init()
  .then((res) => {
    console.info(`${res.res}`)


    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    const anio = currentDate.getFullYear();
    const mes = currentDate.getMonth() + 1
    
//    const segurosController = new SegurosController()
//    segurosController.updateSeguros(null,null,anio,mes,(ret: any) => ret)
  
//  grupoActividadController.gruposPersonas(null, null, (ret: any) => ret)

//ClientesController.AddContactosMigrados()
    
  })
  .catch((error) => {
    console.error(error)
    //    process.exit()
  })



webServer.init()
  .then((res) => {
    console.info(res)
    makeRoutes(webServer)
    webServer.lateInit()
  }).catch((error) => {
    console.error(error)

    process.exit()
  })

