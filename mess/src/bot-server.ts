import express, { json, Application, Router, NextFunction, Request, Response } from "express";
import { version, author, name, description } from "./version.json";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ClientException } from "./controller/base.controller";

import dotenv from "dotenv"
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
import { JsonFileDB as Database } from '@builderbot/database-json'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { flowLogin, flowValidateCode } from "./flow/flowLogin";
import flowRecibo from "./flow/flowRecibo";
import flowMonotributo from "./flow/flowMonotributo";
import flowMenu from "./flow/flowMenu";
import flowRemoveTel from "./flow/flowRemoveTel";

dotenv.config()
export const tmpName = (dir: string) => {
  while (true) {
    const name = randomBytes(8).toString("hex") + ".tmp";
    if (!existsSync(`${dir}/${name}`)) return name;
  }
};

export class BotServer {
  private adapterProvider: Provider
  private botHandle:any

  public sendMsg(telNro: string, message: string) {
    return this.adapterProvider.sendMessage(telNro, message, {})
  }

  public runFlow(from: string, name: string) {
    return this.adapterProvider.emit('message', {
      ...{from,name},
      body: utils.encryptData(`_event_custom_${name}_`),
      name,
      from,
  });


  }

  public async init() {

    const adapterFlow = createFlow([flowLogin, flowMenu, flowValidateCode,flowRecibo,flowMonotributo,flowRemoveTel])
    this.adapterProvider = createProvider(Provider)
    const adapterDB = new Database({ filename: 'db.json' })

    this.botHandle = await createBot({
      flow: adapterFlow,
      provider: this.adapterProvider,
      database: adapterDB,

    })

    this.adapterProvider.on('ready',  () => {
      console.log('ready' )
    })


    this.botHandle.httpServer(3008)

  }
}