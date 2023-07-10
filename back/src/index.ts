import { DBServer, WebServer } from "./server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import { CategoriasController } from "./categorias-cambio/categorias-cambio.controller";
import { Response } from "express";

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
    const ret = await categoriasController.procesaCambios(null, null)
    console.log(`job run at ${fireDate}, response: ${ret}`);
  } catch (err) {
    console.log(`job run at ${fireDate}, response: ${err.message}`);
  }
});


dbServer.init()
  .then((res) => {
    console.info(`${res.res}`)
  })
  .catch((err) => {
    console.error(`${err}`)
    //    process.exit()
  })


webServer.init()
  .then((res) => {
    console.info(res)
    makeRoutes(webServer)
    webServer.lateInit()
  }).catch((err) => {
    console.error(err)

    process.exit()
  })
