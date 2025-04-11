import { DBServer, WebServer } from "./server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller";
import { CargaLicenciaController } from "./carga-licencia/carga-licencia.controller";
import dotenv from "dotenv"
import { GrupoActividadController } from "./grupo-actividad/grupo-actividad.controller";
import { AsistenciaController } from "./controller/asistencia.controller";
import { SegurosController } from "./seguros/seguros.controller";
import { Temporal } from "@js-temporal/polyfill";
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

scheduleJob('1 0 * * *', async function (fireDate) {
  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() - 1);
  const anio = currentDate.getFullYear();
  const mes = currentDate.getMonth() + 1
  
  const segurosController = new SegurosController()
  segurosController.updateSeguros(null,null,anio,mes,(ret: any) => ret)
});

scheduleJob('1 0 * * *', async function (fireDate) {
  //TODO Se debería instanciar Response correctamente

  const ret = await categoriasController.procesaCambios(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('1 0 * * *', async function (fireDate) {
  //TODO Se debería instanciar Response correctamente

  const ret = await grupoActividadController.objetivosGrupos(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('1 0 * * *', async function (fireDate) {
  const ret = await cargaLicenciaController.deleleTemporalFiles(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('0 0 1 * *', async function (fireDate) {
  //TODO Se debería instanciar Response correctamente

  const ret = await grupoActividadController.gruposPersonas(null, null, (ret: any) => ret)
  console.log(`job run at ${fireDate}, response: ${ret}`);
});

scheduleJob('1 0 * * *', async function (fireDate) {
  //TODO Se debería instanciar Response correctamente
  const actual = new Date()
  const anio = actual.getFullYear()
  const mes = actual.getMonth() + 1
  const ret = await asistenciaController.getAccessControlAsistance(anio,mes)
  console.log(`job run at ${fireDate}, response: ${ret}`);
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
