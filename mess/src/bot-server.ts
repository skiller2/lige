import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

import readline from 'readline';

import dotenv from "dotenv"
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
//import {MemoryDB as Database } from '@builderbot/bot'
import { SqlServerAdapter as Database } from './sqlserver-database/sqlserver-database.ts'
import { BaileysProvider } from '@builderbot/provider-baileys'
import { TelegramProvider } from '@builderbot/provider-telegram'
import { MetaProvider } from '@builderbot/provider-meta'

import { flowLogin, flowValidateCode, flowSinRegistrar } from "./flow/flowLogin.ts";
import flowRecibo from "./flow/flowRecibo.ts";
import flowMonotributo from "./flow/flowMonotributo.ts";
import flowMenu from "./flow/flowMenu.ts";
import flowRemoveTel from "./flow/flowRemoveTel.ts";
import { idleFlow } from "./flow/flowIdle.ts";
import flowInformacionPersonal from "./flow/flowInformacionPersonal.ts";
import flowInformacionEmpresa from "./flow/flowInformacionEmpresa.ts";
import { flowDescargaDocs } from "./flow/flowDescargaDocs.ts";
import { flowAdelanto, flowFormAdelanto } from "./flow/flowAdelanto.ts";
import { Utils } from "./controller/util.ts";
import { flowNovedad, flowNovedadCodObjetivo, flowNovedadTipo, flowNovedadDescrip, flowNovedadHora, flowNovedadFecha, flowNovedadEnvio, flowNovedadAccion, flowNovedadRouter, flowNovedadRecibirDocs, flowNovedadPendiente, flowConsNovedadPendiente, flowProactivoNovedad } from "./flow/flowNovedad.ts";
import { toAsk, httpInject } from "@builderbot-plugins/openai-assistants/dist/index.cjs"


dotenv.config()
export const tmpName = (dir: string) => {
  while (true) {
    const name = randomBytes(8).toString("hex") + ".tmp";
    if (!existsSync(`${dir}/${name}`)) return name;
  }
};


function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}


export class BotServer {
  private adapterProvider: BaileysProvider | TelegramProvider | MetaProvider
  private providerId: string
  private botHandle: any
  private statusMsg: string
  public globalTimeOutMs: number
  private tgConfig: any
  private botPort: number
  private ASSISTANT_ID:string


  public userQueues = new Map();
  public userLocks = new Map(); // New lock mechanism


  constructor(provider: string) {
    this.ASSISTANT_ID = process.env.ASSISTANT_ID ?? ''
    switch (provider) {
      case "BAILEY":
        this.adapterProvider = createProvider(BaileysProvider, {
          version: [2, 3000, 1025190524],
          browser: ["Windows", "Chrome", "Chrome 114.0.5735.198"],
          writeMyself: "both",
          experimentalStore: true,
          timeRelease: 86400000
        })

        break;
      case "TELEGRAM":
        this.tgConfig = {
          apiId: process.env.TELEGRAM_API_ID, // api_id brindado por Telegram
          apiHash: process.env.TELEGRAM_API_HASH, // api_hash brindado por Telegram
          apiNumber: process.env.TELEGRAM_NUMBER, // Número de teléfono brindado por Telegram para enviar el número de verificación
          //apiPassword: process.env.TELEGRAM_PASSWORD, // Código de verificación enviado por Telegram hay que esperarlo
          getCode: async () => { return await ask('📱 Ingresá el código recibido: ') },
        }
        this.adapterProvider = createProvider(TelegramProvider, this.tgConfig)

        break;
      case 'META':
        this.adapterProvider = createProvider(MetaProvider, {
          downloadMedia: true,
          jwtToken: process.env.META_JWTOKEN,  // Token de acceso brindado por Meta (es permanente o se actualiza?)
          numberId: process.env.META_NUMBER_ID,  // ID de número brindado por Meta
          verifyToken: process.env.META_VERIFY_TOKEN,  // Token de verificación creado para webhook
          version: 'v22.0' // Version de la API Graph de Meta
        })
        break

      default:
        throw new Error("Proveedor no reconocido, verifique en el .env parámetro PROVIDER")
        break;
    }
    this.botPort = Number(process.env.BOT_PORT) || 3008
    this.providerId = provider + "_" + String(process.env.PROVIDER_ID) || ""
  }

  public sendMsg(telNro: string, message: string) {
    return this.adapterProvider.sendMessage(telNro, message, {})
  }

  public runFlow(from: string, name: string) {
    return this.adapterProvider.emit('message', {
      ...{ from, name },
      body: utils.encryptData(`_event_custom_${name}_`),
      name,
      from,
      type: 'dispatch'
    });
  }

  processUserMessage = async (ctx, { flowDynamic, state, provider }) => {
    await Utils.typing(ctx, provider);
    const response = await toAsk(this.ASSISTANT_ID, ctx.body, state);

    // Split the response into chunks and send them sequentially
    const chunks = response.split(/\n\n+/);
    for (const chunk of chunks) {
      const cleanedChunk = chunk.trim().replace(/【.*?】[ ] /g, "");
      await flowDynamic([{ body: cleanedChunk }]);
    }
  }

  handleQueue = async (userId) => {
    const queue = this.userQueues.get(userId);
    
    if (this.userLocks.get(userId)) {
        return; // If locked, skip processing
    }

    while (queue.length > 0) {
        this.userLocks.set(userId, true); // Lock the queue
        const { ctx, flowDynamic, state, provider } = queue.shift();
        try {
            await this.processUserMessage(ctx, { flowDynamic, state, provider });
        } catch (error) {
            console.error(`Error processing message for user ${userId}:`, error);
        } finally {
            this.userLocks.set(userId, false); // Release the lock
        }
    }

    this.userLocks.delete(userId); // Remove the lock once all messages are processed
    this.userQueues.delete(userId); // Remove the queue once all messages are processed
};

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
      flowNovedad, flowNovedadCodObjetivo, flowNovedadTipo, flowNovedadDescrip, flowNovedadHora, flowNovedadFecha, flowNovedadEnvio,
      flowNovedadAccion, flowNovedadRouter, flowNovedadRecibirDocs, flowNovedadPendiente, flowConsNovedadPendiente, flowProactivoNovedad, flowSinRegistrar,
      flowAdelanto, flowFormAdelanto
    ])


    //    this.adapterProvider = await createProvider(TelegramProvider, this.tgConfig )


    const adapterDB = new Database(this.providerId)
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


    this.botHandle.httpServer(this.botPort)
    //    console.log('botHandle', this.botHandle)
    //    console.log('adapterProvider', this.adapterProvider)
  }
}