import express, { json, Application, Router, NextFunction, Request, Response } from "express";
import { version, author, name, description } from "./version.json";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ClientException } from "./controller/base.controller";

import dotenv from "dotenv"
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
//import {MemoryDB as Database } from '@builderbot/bot'
import { SqlServerAdapter as Database } from './sqlserver-database/sqlserver-database'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { flowLogin, flowValidateCode } from "./flow/flowLogin";
import flowRecibo from "./flow/flowRecibo";
import flowMonotributo from "./flow/flowMonotributo";
import flowMenu from "./flow/flowMenu";
import flowRemoveTel from "./flow/flowRemoveTel";
import { idleFlow } from "./flow/flowIdle";
import flowInformacionPersonal from "./flow/flowInformacionPersonal";
import flowInformacionEmpresa from "./flow/flowInformacionEmpresa";

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

    const adapterFlow = createFlow([flowLogin, flowMenu, flowValidateCode, flowRecibo, flowMonotributo, flowRemoveTel,idleFlow,flowInformacionPersonal,flowInformacionEmpresa])
    this.adapterProvider = createProvider(Provider)
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