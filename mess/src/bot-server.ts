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
import { Ollama } from "ollama";
import { ClientException } from "./controller/base.controller.ts";


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
  private instrucciones: string
  private ollama

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
    this.instrucciones = `

Sos un asistente virtual de una cooperativa de trabajo. Tu tarea es ayudar a los asociados con gestiones administrativas, responder consultas sobre su situación personal y cooperativa, y guiarlos en trámites. Siempre respondé de forma clara, amable y precisa. Estas son las acciones que los usuarios pueden solicitarte:

0. Si el usuario inicia la conversación con un saludo (por ejemplo: 'Hola', 'Buen día', '¿Estás ahí?'), no respondas directamente al usuario. generá internamente el siguiente mensaje para que el middleware lo capture:

{ \"accion\": \"buscar_telefono\", \"motivo\": \"inicio_conversacion\" }
El sistema responderá con:

{ \"accion\": \"buscar_telefono\", \"resultado\": { \"Nombre\": \"Juan\", \"Apellido\": \"Frensa\" } }
 
Usá esta información para continuar la conversación de forma personalizada.

1. Monotributo: Permití al usuario solicitar constancias de pago en PDF indicando el período en formato mm/aaaa. Generá internamente: { \"accion\": \"obtener_constancia_monotributo\ququi", \"periodo\": \"mm/aaaa\" }

2. Recibo de Retiro: Explicá cómo obtener el recibo, qué información contiene y permití descargar el PDF. Generá internamente: { \"accion\": \"descargar_recibo_retiro\" }

3. Información Personal: Mostrá o actualizá datos personales del asociado si está permitido. Generá internamente: { \"accion\": \"mostrar_info_personal\" }

4. Información Cooperativa: Mostrá datos como fecha de ingreso, categoría, estado actual, beneficios. Generá internamente: { \"accion\": \"mostrar_info_cooperativa\" }

5. Documentación pendiente: Informá qué documentos no fueron vistos y ofrecé descargar los PDF. Generá internamente: { \"accion\": \"documentacion_pendiente\" }

6. Informar novedad: Permití que el usuario comunique una novedad respecto de un incidente. Generá internamente: { \"accion\": \"informar_novedad\", \"detalle\": \"texto del usuario\" }

7. Novedades pendientes por ver: Mostrá las novedades que el usuario aún no ha leído. Generá internamente: { \"accion\": \"novedades_pendientes\" }

8. Solicitar Adelanto: Explicá el proceso, informá si ya tiene uno pendiente, el valor máximo a solicitar y la fecha límite. Generá internamente: { \"accion\": \"solicitar_adelanto\" }

9. Desvincular teléfono: Permití que el usuario desvincule su número de teléfono. Generá internamente: { \"accion\": \"desvincular_telefono\" }

Si el usuario hace una pregunta fuera de estas acciones, indicá que debe remitir la consulta al supervisor. Siempre mantené un tono cordial y profesional.

`
    this.ollama = new Ollama({
      host: "https://ollama.com",
      headers: {
        Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
      },
    });

  }

  public async sendMsgMeta24hs(telNro: string, message: string, saludo: string) {
    const resp = await this.adapterProvider.sendMessage(telNro, `${saludo}\n${message}`, {});

    const messageId = resp?.messages?.[0]?.id;
    if (!messageId) throw new Error("No se recibió ID del mensaje enviado")

    const statusPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.adapterProvider.off('notice', handler);
        reject(new Error('Time Out'));
      }, 5000); // 5 segundos de espera

      const handler = (noticeData: any) => {
        console.log('📨 Notice recibido en handler:', JSON.stringify(noticeData, null, 2));

        // Buscar errores relacionados con 24 horas
        const errorMessage = noticeData?.instructions?.[0] || JSON.stringify(noticeData);
        const is24HourError = errorMessage?.includes('24 hours') || errorMessage?.includes('24 hour') || errorMessage?.includes('ventana');

        clearTimeout(timeout);
        this.adapterProvider.off('notice', handler);
        
        if (is24HourError) {
          reject(new Error(`Error ventana de 24 horas: ${errorMessage}`));
        } else {
          resolve(true);
        }
      };

      this.adapterProvider.on('notice', handler);
    });

    return statusPromise
  }

  public async sendMsg(telNro: string, message: string) {
    console.log(`Enviando mensaje a ${telNro}: ${message}`)
    const saludo = BotServer.getSaludo();

    switch (process.env.PROVIDER) {
      case 'META':
        try {
          // Enviar el mensaje
          const a = await this.sendMsgMeta24hs(telNro, message, saludo);
          console.log("*****", a);
          return
        } catch (error) {
          console.log("Error sendMsgMeta24hs:", error);
        }

        try {
          await this.sendTemplateMsg(telNro, message);
        } catch (error) {
          console.log("Error sendTemplate", error)
          return error
        }

      case 'BAILEY':
        try {
          await this.adapterProvider.sendMessage(telNro, `${saludo}\n${message}`, {});
          return
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

    const respTemplate = await this.adapterProvider.sendTemplate(telNro, template, languageCode, components);
    console.log("✅ Template enviado correctamente:", respTemplate);
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


    //let mensajes = [{ role: "system", content: this.instrucciones }]


    const response = await this.ollama.chat({
      model: "gpt-oss:120b",
      messages: [{ role: "user", content: "Buenos dias" }],
      stream: true,
    });

    for await (const part of response) {
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

    // Listener global para ver todos los webhooks de status
    this.adapterProvider.on('notice', (noticeData) => {
      console.log('NOTICE RECIBIDO:', JSON.stringify(noticeData, null, 2));
    });

    this.botHandle.httpServer(this.botPort)
    //    console.log('botHandle', this.botHandle)
    //    console.log('adapterProvider', this.adapterProvider)



    /*
    
     
        let mensajes = [{ role: "system", content: this.instrucciones }]
    
        while (true) {
          const res = await ask('Pregunta: ')
          mensajes.push({ role: "user", content: res })
    
    
          const response = await this.ollama.chat({
            model: "gpt-oss:120b",
            messages: mensajes,
            stream: false,
            
          });
    
    
          process.stdout.write('Respuesta: '+response.message.content)
          process.stdout.write('\n')      
    
          mensajes.push(response.message)
    
    
        }
    */
  }
}