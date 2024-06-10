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

dotenv.config()
export const tmpName = (dir: string) => {
  while (true) {
    const name = randomBytes(8).toString("hex") + ".tmp";
    if (!existsSync(`${dir}/${name}`)) return name;
  }
};

export class BotServer {
  private adapterProvider: Provider

  public async sendMsg(telNro: string, message: string) {
    await this.adapterProvider.sendMessage(telNro,message,{})
  }

  public async runFlow(telNro: string,flow: string, ) {
    this.adapterProvider.emit('DISPATCH',{ from: '5491144050522', name: 'EVENT_REGISTER'})
  }

  public async init() {

  const adapterFlow = createFlow([flowLogin, flowValidateCode])
  this.adapterProvider = createProvider(Provider)
  const adapterDB = new Database({ filename: 'db.json' })

  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: this.adapterProvider,
    database: adapterDB,

  })
    this.adapterProvider.on('ready', handleCtx(async (bot) => { 
      console.log('ready')
//      await bot.dispatch('EVENT_REGISTER', { from: '5491144050522', name })

    }))

    this.adapterProvider.on('DISPATCH', handleCtx(async (params) => { 
      console.log('dispatch',params)
      //      await bot.dispatch('EVENT_REGISTER', { from: '5491144050522', name })
/*      
      this.adapterProvider.server.post('/v1/register', handleCtx(async (bot, req, res) => {
        const { number, name } = req.body
  
        await bot.dispatch('EVENT_REGISTER', { from: number, name })
        return res.end('trigger')
    }))    
  */

    }))

    httpServer(3008)


    this.adapterProvider.server.post('/v1/register', handleCtx(async (bot, req, res) => {
      const { number, name } = req.body

      await bot.dispatch('EVENT_REGISTER', { from: number, name })
      return res.end('trigger')
  }))    
}
}