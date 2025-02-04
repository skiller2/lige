import { DBServer, WebServer } from "./server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import { Response } from "express"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller";
import { ObjetivoController } from "./controller/objetivo.controller";
import { CargaLicenciaController } from "./carga-licencia/carga-licencia.controller";
import { FileUploadController } from "./controller/file-upload.controller"
//import packageConfig from "./../package.json" with { type: 'json' }; 
import dotenv from "dotenv"
import { GrupoActividadController } from "./grupo-actividad/grupo-actividad.controller";
import { AsistenciaController } from "./controller/asistencia.controller";



dotenv.config()

// Init App
const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))
const categoriasController = new CategoriasController()
const grupoActividadController = new GrupoActividadController()
const cargaLicenciaController = new CargaLicenciaController()
const asistenciaController = new AsistenciaController()

scheduleJob('*/1 * * * *', async function (fireDate) {
//  const ret = await categoriasController.procesaCambios(null, res, (ret: any) => ret)
//  console.log(`job run at ${fireDate}, response: ${ret}`, ret);
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


dbServer.init()
  .then((res) => {
    console.info(`${res.res}`)
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
