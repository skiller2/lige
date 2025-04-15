import { DBServer, WebServer } from "./server";
import { BotServer } from "./bot-server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import dotenv from "dotenv"
import { ChatBotController } from "./controller/chatbot.controller";
import { exit } from "process";
dotenv.config()

// Init App
export const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))
export const botServer = new BotServer()
//const categoriasController = new CategoriasController()
//const objetivoController = new ObjetivoController()

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

scheduleJob('0 7 * * *', async function (fireDate) {
  exit()
})

//  0 */4 * * *  cada 4 hs
//scheduleJob('*/1 * * * *', async function (fireDate) {
//  const status = botServer.status().bot_online
//  if (status != 'ONLINE') return
//  console.log('envio mensaje')
//  await botServer.sendMsg('', BotServer.getSaludo())


//})

scheduleJob('*/1 * * * *', async function (fireDate) {
  const status = botServer.status().bot_online
  if (status != 'ONLINE') return
  console.log('reviso cola')
  const ahora = new Date();
  const horas = ahora.getHours();
  if (horas >= 8 && horas <= 22) {
    const listmsg = await ChatBotController.getColaMsg()

    for (const msg of listmsg) {

      console.log('sendMsg', BotServer.getSaludo(), msg.telefono, msg.texto_mensaje)
      await botServer.sendMsg(msg.telefono, BotServer.getSaludo())
      await delay(1000)
      await botServer.sendMsg(msg.telefono, msg.texto_mensaje)
      await ChatBotController.updColaMsg(msg.fecha_ingreso, msg.personal_id)
      await delay(2000)
    }
  }
});




scheduleJob('1 0 * * *', async function (fireDate) {
  //TODO Se debería instanciar Response correctamente

});




let fechaActual = new Date()
fechaActual.setHours(0, 0, 0, 0)

let fechaAyer = new Date()
fechaAyer.setDate(fechaAyer.getDate() - 1);
fechaAyer.setHours(0, 0, 0, 0)
console.log('actual', fechaActual, 'ayer', fechaAyer)

await webServer.init()
  .then((res) => {
    console.info(res)
    makeRoutes(webServer)
    webServer.lateInit()
  }).catch((error) => {
    console.error(error)

    process.exit()
  })

await dbServer.init()
  .then((res) => {
    console.info(`${res.res}`)
  })
  .catch((error) => {
    console.error(error)
    //    process.exit()
  })


await botServer.init()
