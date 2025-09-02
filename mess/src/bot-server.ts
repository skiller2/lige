import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

import dotenv from "dotenv"
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
//import {MemoryDB as Database } from '@builderbot/bot'
import { SqlServerAdapter as Database } from './sqlserver-database/sqlserver-database.ts'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys/dist/index.cjs'
import { flowLogin, flowValidateCode } from "./flow/flowLogin.ts";
import flowRecibo from "./flow/flowRecibo.ts";
import flowMonotributo from "./flow/flowMonotributo.ts";
import flowMenu from "./flow/flowMenu.ts";
import flowRemoveTel from "./flow/flowRemoveTel.ts";
import { idleFlow } from "./flow/flowIdle.ts";
import flowInformacionPersonal from "./flow/flowInformacionPersonal.ts";
import flowInformacionEmpresa from "./flow/flowInformacionEmpresa.ts";
import { flowDescargaDocs } from "./flow/flowDescargaDocs.ts";
import { Utils } from "./controller/util.ts";
import { flowNovedad, flowNovedadCodObjetivo, flowNovedadTipo, flowNovedadDescrip, flowNovedadHora, flowNovedadFecha, flowNovedadEnvio, flowNovedadAccion, flowNovedadRouter, flowNovedadRecibirDocs, flowNovedadPendiente, flowConsNovedadPendiente } from "./flow/flowNovedad.ts";

dotenv.config()
export const tmpName = (dir: string) => {
  while (true) {
    const name = randomBytes(8).toString("hex") + ".tmp";
    if (!existsSync(`${dir}/${name}`)) return name;
  }
};

export class BotServer {
  private adapterProvider: Provider
  private botHandle: any
  private statusMsg: string
  public globalTimeOutMs: number
  public sendMsg(telNro: string, message: string) {
    return this.adapterProvider.sendMessage(telNro, message, {})
  }

  public runFlow(from: string, name: string) {
    return this.adapterProvider.emit('message', {
      ...{ from, name },
      body: utils.encryptData(`_event_custom_${name}_`),
      name,
      from,
    });
  }

  public status() {

    return { bot_online: this.statusMsg }
  }

  static getSaludo() {
    const ahora = new Date();
    const horas = ahora.getHours();
    let mensaje = "";

    if (horas >= 5 && horas < 12) {
      mensaje = "Buen día";
    } else if (horas >= 12 && horas < 20) {
      mensaje = "Buenas tardes";
    } else {
      mensaje = "Buenas noches";
    }
    return mensaje
  }

  public async init() {

    Utils.removeBotFileSessions()

    const adapterFlow = createFlow([
      flowLogin, flowMenu, flowValidateCode, flowRecibo, flowMonotributo,
      flowRemoveTel, idleFlow, flowInformacionPersonal, flowInformacionEmpresa, flowDescargaDocs,
      flowNovedad, flowNovedadCodObjetivo, flowNovedadTipo, flowNovedadDescrip, flowNovedadHora, flowNovedadFecha,
      flowNovedadEnvio, flowNovedadAccion, flowNovedadRouter, flowNovedadRecibirDocs, flowNovedadPendiente, flowConsNovedadPendiente
    ])
    this.adapterProvider = createProvider(Provider, {
      timeRelease: 10800000, // 3 hours in milliseconds
    })
    const adapterDB = new Database()
    this.globalTimeOutMs = 60000 * 5
    this.botHandle = await createBot({
      flow: adapterFlow,
      provider: this.adapterProvider,
      database: adapterDB,

    })

    this.adapterProvider.on('ready', () => {
      this.statusMsg = 'ONLINE'
      console.log('ready')
    })

    this.adapterProvider.on('require_action', (e) => {
      this.statusMsg = 'REQ_ACTION'
      console.log('event require_action', e)
    })

    this.adapterProvider.on('auth_failure', () => {
      this.statusMsg = 'AUTH_FAIL'
      console.log('event auth_failure')
    })


    this.botHandle.httpServer(3008)
//    console.log('botHandle', this.botHandle)
//    console.log('adapterProvider', this.adapterProvider)
  }
}