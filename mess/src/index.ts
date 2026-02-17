import { DBServer, WebServer } from "./server.ts";
import { BotServer } from "./bot-server.ts";
import { makeRoutes } from "./routes/routes.module.ts"
import { dataSource } from "./data-source.ts";
import { scheduleJob } from "node-schedule"
import dotenv from "dotenv"
import { ChatBotController } from "./controller/chatbot.controller.ts";
import { exit } from "process";
dotenv.config()

// Init App
export const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))
export const botServer = new BotServer(process.env.PROVIDER)
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

const ENABLE_QUEUE_MSGS = ['true', '1', 'yes'].includes((process.env.ENABLE_QUEUE_MSGS || '').toLowerCase());

if (ENABLE_QUEUE_MSGS) {
  console.log('Envío mensajes en cola habilitada')
  scheduleJob('*/1 * * * *', async function (fireDate) {
    const status = botServer.status().bot_online
    if (status != 'ONLINE') return

    const ahora = new Date();
    const horas = ahora.getHours();

    const listmsg = await ChatBotController.getColaMsg()
    console.log(`Reviso cola, ${listmsg.length} pendientes`)

    for (const msg of listmsg) {
      try {
        if (msg.ClaseMensaje?.includes('NOVEDAD') || (horas >= 8 && horas <= 22)) {
          const texto = String(msg.TextoMensaje || '').trim()

          if (texto == '') throw new Error(`Mensaje vacío, no se envió TextoMensaje`)

          const result = await botServer.sendMsg(msg.Telefono, texto);
          // console.log(`Mensaje enviado a ${msg.Telefono}, resultado: ${result?.method || 'N/A'} - ${result?.provider || 'N/A'}`);
          await ChatBotController.updColaMsg(msg.FechaIngreso, msg.PersonalId, result?.method, result?.provider); // todo: con meta, ver caso que no envia mensaje si el contacto no inicio la conversación dentro de las 24hs

        }

        //        await delay(1000);
      } catch (err) {
        console.error(`Error procesando mensaje ${msg.telefono}:`, err);
      }
    }

  });
}



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

