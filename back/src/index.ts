// import "reflect-metadata";
// import app from "./app";
import {
  DataSource,
} from "typeorm";
import { DBServer, WebServer} from "./server";
import { makeRoutes } from "./routes/routes.module"

require("dotenv").config();

// Init App
export const dbServer = new DBServer(5, 2000)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))

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
