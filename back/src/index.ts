import { DBServer, WebServer } from "./server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller";

require("dotenv").config();

// Init App
const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))
const categoriasController = new CategoriasController()


scheduleJob('*/1 * * * *', async function (fireDate) {
  //  const ret = await categoriasController.procesaCambios(null,null)
  //  console.log(`job run at ${fireDate}, response: ${ret}`);
});


scheduleJob('1 0 * * *', async function (fireDate) {
  try {
    const ret = await categoriasController.procesaCambios(null, null, null)
    console.log(`job run at ${fireDate}, response: ${ret}`);
  } catch (error) {
    console.log(`job run at ${fireDate}, response: ${error.message}`);
  }
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
