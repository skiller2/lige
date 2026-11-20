import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";

import readline from 'readline';

import dotenv from "dotenv"
import { createBot, createProvider, createFlow, addKeyword, utils } from '@builderbot/bot'
//import {MemoryDB as Database } from '@builderbot/bot'
import { SqlServerAdapter as Database } from './sqlserver-database/sqlserver-database.ts'
import { BaileysProvider } from '@builderbot/provider-baileys';
import { TelegramProvider } from '@builderbot/provider-telegram'
import { MetaProvider } from '@builderbot/provider-meta'

import CryptoJS from 'crypto-js';

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
import { Ollama } from "ollama";
import { ClientException } from "./controller/base.controller.ts";
import { ModelArtsClient } from "./modelarts-client.ts";

const IA_HISTORIAL_TIMEOUT_MS = (Number(process.env.IA_HISTORIAL_TIMEOUT_SECS) || 30 * 60) * 1000;
const IA_HISTORIAL_CLEANUP_INTERVAL_MS = (Number(process.env.IA_HISTORIAL_CLEANUP_INTERVAL_SECS) || 1 * 60) * 1000;


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
  private ASSISTANT_ID: string
  
  public iaPromptHash: string
  public servicioIA: Ollama|ModelArtsClient = null

  public userQueues = new Map();
  public userLocks = new Map(); // New lock mechanism

  public iaHistorial: Record<string, any> = {};
  
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(provider: string) {
    this.ASSISTANT_ID = process.env.ASSISTANT_ID ?? ''
    switch (provider) {
      case "BAILEY":
        this.adapterProvider = createProvider(BaileysProvider, {
          version: [2, 3000, 1030817285],
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
          version: 'v25.0' // Version de la API Graph de Meta
        })
        break
      case 'DUMMY':
        this.adapterProvider = null as any
        break
      default:
        throw new Error("Proveedor no reconocido, verifique en el .env parámetro PROVIDER")
        break;
    }
    this.botPort = Number(process.env.BOT_PORT) || 3008
    this.providerId = provider + "_" + String(process.env.PROVIDER_ID) || ""

/*
    this.servicioIA = new Ollama({
      host: "https://ollama.com",
      headers: {
        Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
      },
    });
*/
    this.servicioIA = new ModelArtsClient({
      host: process.env.MODELARTS_HOST || "https://api-ap-southeast-1.modelarts-maas.com/openai/v1",
      apiKey: process.env.MODELARTS_API_KEY || "",
    });

  }

  public async sendMsgMeta24hs(telNro: string, message: string, saludo: string) {
    const resp = await this.adapterProvider.sendMessage(telNro, `${saludo}\n${message}`, {});

    const messageId = resp?.messages?.[0]?.id;
    if (!messageId) throw new Error("No se recibió ID del mensaje enviado")

    const statusPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.adapterProvider.off('notice', handler);
        resolve(true); // ✅ Éxito por timeout
      }, 3000); // Reducido a 3 segundos

      const handler = (noticeData: any) => {


        const errorMessage = noticeData?.instructions?.[0] || JSON.stringify(noticeData);
        const is24HourError = errorMessage?.includes('24 hours') ||
          errorMessage?.includes('24 hour') ||
          errorMessage?.includes('ventana');

        if (is24HourError) {
          clearTimeout(timeout);
          this.adapterProvider.off('notice', handler);
          reject(new Error(`Error ventana de 24 horas: ${errorMessage}`));
        }
      };

      this.adapterProvider.on('notice', handler);
    });

    return statusPromise
  }

  public async sendMsg(telNro: string, message: string) {
    // console.log(`Enviando mensaje a ${telNro}: ${message}`)
    const saludo = BotServer.getSaludo();
    const provider = process.env.PROVIDER ? process.env.PROVIDER : null

    const providerId = provider + '_' + String(process.env.PROVIDER_ID) || ''


    switch (provider) {
      // todo : ver manejo y devolucion de errores para que dsp no haga update en BotColaMensajes
      case 'META':
        try {
          // Enviar el mensaje
          await this.sendMsgMeta24hs(telNro, message, saludo);
          console.log("Mensaje enviado dentro de la ventana de 24hs.");
          return { method: 'sendMsgMeta24hs', provider: providerId }

        } catch (error) {
          console.log("Error sendMsgMeta24hs:", error);
        }

        try {
          await this.sendTemplateMsg(telNro, message);
          return { method: 'sendTemplateMsg', provider: providerId }
        } catch (error) {
          console.log("Error sendTemplate", error)
          throw error
        }

      case 'BAILEY':
        try {
          await this.adapterProvider.sendMessage(telNro, `${saludo}\n${message}`, {});
          return { method: 'sendMessage', provider: providerId }
        } catch (error) {
          console.log("Error sendMessage", error)
          return error
        }
        break

      default:
        throw new Error("Proveedor no reconocido, verifique en el .env parámetro PROVIDER")
    }
  }


  async sendTemplateMsg(telNro: string, message: string) {
    const template = "notificacion_general";
    const languageCode = "es_AR";

    const components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: message },
        ],
      },
    ]

    await this.adapterProvider.sendTemplate(telNro, template, languageCode, components);
    return
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

    const response = await this.servicioIA.chat({
      model: process.env.MODEL,
      messages: [{ role: "user", content: "Buenos dias" }],
      stream: true,
    });

    for await (const part of response as any) {
      process.stdout.write(part.message.content);
      await flowDynamic([{ body: part.message.content }]);
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
      mensaje = "Buen día.";
    } else if (horas >= 12 && horas < 20) {
      mensaje = "Buenas tardes.";
    } else {
      mensaje = "Buenas noches.";
    }
    return mensaje
  }

  private cleanupIaHistorial() {
    const now = Date.now();

    for (const [chatId, data] of Object.entries(this.iaHistorial)) {
      // Finalizada y sin leer durante otro TIMEOUT: se libera la memoria
      if (data.finished && now - data.timestamp > 2 * IA_HISTORIAL_TIMEOUT_MS) {
        delete this.iaHistorial[chatId];
        continue;
      }
      if (now - data.timestamp > IA_HISTORIAL_TIMEOUT_MS && !data.finished) {
        this.iaHistorial[chatId].msgs.push({ role: "assistant", content: "Sesion cerrada por inactividad. Por favor, inicie nuevamente la conversación." });
        this.iaHistorial[chatId].finished = true;
      }
    }
  }

  private startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanupIaHistorial();
    }, IA_HISTORIAL_CLEANUP_INTERVAL_MS);
  }

  private stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
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



    if (this.adapterProvider) {

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

      // Listener global para ver todos los webhooks de status
      this.adapterProvider.on('notice', (noticeData) => {

      });
    }

    this.startCleanupInterval();

    if (this.adapterProvider)
      this.botHandle.httpServer(this.botPort)
  }
}
