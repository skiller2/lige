import { DBServer, WebServer } from "./server";
import { makeRoutes } from "./routes/routes.module"
import { dataSource } from "./data-source";
import { scheduleJob } from "node-schedule"
import dotenv from "dotenv"
import BotWhatsapp from '@bot-whatsapp/bot'
import ProviderWs from '@bot-whatsapp/provider/baileys'
import JsonFileAdapter from '@bot-whatsapp/database/json'
import flow from "./flow/indexFlow";
// import QRPortalWeb from '@bot-whatsapp/portal'

dotenv.config()

// Init App
const dbServer = new DBServer(5, 2000, dataSource)
const webServer = new WebServer(Number(process.env.SERVER_API_PORT))

//const categoriasController = new CategoriasController()
//const objetivoController = new ObjetivoController()


scheduleJob('*/1 * * * *', async function (fireDate) {
//  const ret = await categoriasController.procesaCambios(null, res, (ret: any) => ret)
//  console.log(`job run at ${fireDate}, response: ${ret}`, ret);
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
let globalState:any
const botInit = async () =>{
    return await BotWhatsapp.createBot({
    flow,
    database: new JsonFileAdapter(),
    provider: BotWhatsapp.createProvider(ProviderWs)
  },{delay:1000})
}

const {globalStateHandler} = await botInit()
console.log('bot',globalStateHandler)
