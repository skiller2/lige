import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "fs";
import { readFile, writeFile } from 'node:fs/promises';
import CryptoJS from 'crypto-js';

//import { botServer } from "../bot-server.ts";
import { dataSource } from "../data-source.ts";
import { botServer } from "../index.ts";
import { documentosController, personalController, novedadController, objetivoController } from "./controller.module.ts";
import { PersonalController } from "./personal.controller.ts";

export class ChatBotController extends BaseController {
  async setPrompt(req: any, res: any, next: any) {
    const iaPrompt = req.body.iaPrompt
    const iaPromptHash = req.body.iaPromptHash

    try {
      if (iaPromptHash !== botServer.iaPromptHash)
        throw new ClientException('Hay cambios posteriores a la última lectura')


      await writeFile(`${this.pathDocuments}/ia-prompt.txt`, iaPrompt, { encoding: 'utf8' })
      // await writeFile('C:/temp/listado.json', JSON.stringify(listado, null, 2), (err) => { })
      botServer.iaPrompt = iaPrompt

      botServer.iaPromptHash = CryptoJS.SHA256(iaPrompt).toString(CryptoJS.enc.Hex);


      botServer.chatmess = []
      const ret = { iaPrompt, iaPromptHash: botServer.iaPromptHash }
      return this.jsonRes(ret, res, 'ok');
    } catch (err) {
      return next(err)
      
    }
  }

  async setTools(req: any, res: any, next: any) {
    const iaTools = req.body.iaTools
    const iaToolsHash = req.body.iaToolsHash

    try {
      JSON.parse(iaTools)

    if (iaToolsHash !== botServer.iaToolsHash)
      throw new ClientException('Hay cambios posteriores a la última lectura')

      await writeFile(`${this.pathDocuments}/ia-tools.json`, iaTools, { encoding: 'utf8' })
      botServer.iaTools = JSON.parse(iaTools)
      botServer.iaToolsHash = CryptoJS.SHA256(iaTools).toString(CryptoJS.enc.Hex);

      botServer.chatmess = []
      const ret = { iaTools, iaToolsHash:botServer.iaToolsHash}

      return this.jsonRes(ret, res, 'ok');

    } catch (err) {
      if (err instanceof SyntaxError)
        err = new ClientException(`Error de syntaxis JSON ${err.message}`)
      return next(err)
    }

  }

  async getTools(req: any, res: any, next: any) {
    const ret = { iaTools: JSON.stringify(botServer.iaTools, null, 2), iaToolsHash: botServer.iaToolsHash }
    return this.jsonRes(ret, res, 'ok');
  }

  async getPrompt(req: any, res: any, next: any) {
    const ret = { iaPrompt: botServer.iaPrompt, iaPromptHash: botServer.iaPromptHash }
    return this.jsonRes(ret, res, 'ok');
  }

  async reinicia(req: Request, res: Response, next: NextFunction) {
    const chatId = req.body.chatId
    botServer.chatmess[chatId] = []
    const ret = {}
    return this.jsonRes(ret, res, 'ok');
  }





  async chat(req: Request, res: Response, next: NextFunction) {

    if (req.body.message.trim() == '')
      return this.jsonRes({ 'response': [] }, res, 'ok');
    const chatId: string = req.body.chatId
    if (!botServer.chatmess[chatId])
      botServer.chatmess[chatId] = []



    if (botServer.chatmess[chatId].length == 0)
      botServer.chatmess[chatId].push({ id: 0, role: "system", content: botServer.iaPrompt, sendIt: true });

    botServer.chatmess[chatId].push({ id: botServer.chatmess[chatId].length, role: "user", content: req.body.message })

    try {
      let recall = false
      do {
        recall = false
        const responseIA = await botServer.ollama.chat({
          model: "gpt-oss:120b",
          messages: botServer.chatmess[chatId],
          stream: false,
          tools: botServer.iaTools,
        });

        botServer.chatmess[chatId].push({ id: botServer.chatmess[chatId].length, ...responseIA.message });

        if (responseIA.message.tool_calls && responseIA.message.tool_calls.length > 0) {

          for (const tool of responseIA.message.tool_calls) {
            let output = {}
            switch (tool.function.name) {
              case 'genTelCode':
                const linkVigenciaHs: number = (process.env.LINK_VIGENCIA) ? Number(process.env.LINK_VIGENCIA) : 3
                const ret = await personalController.genTelCode(chatId)
                output = { url: `https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${encodeURIComponent(ret.encTelNro)}`, encTelNro: ret.encTelNro, linkVigenciaHs }
                break;
              case 'getPersonaState':
                output = await personalController.getPersonaState(chatId)
                break;
              case 'delTelefonoPersona':
                output = await personalController.delTelefonoPersona(chatId)
                break;
              case 'removeCode':
                output = await personalController.removeCode(chatId)
                break;
              case 'getInfoPersonal':
                output = await personalController.getInfoPersonal(tool.function.arguments.personalId, chatId)
                break;
              case 'getInfoEmpresa':
                output = await personalController.getInfoEmpresa()
                break;
              case 'getLastPeriodosOfComprobantesAFIP':
                output = await documentosController.getLastPeriodosOfComprobantesAFIP(tool.function.arguments.personalId, tool.function.arguments.cant).then(array => { return array })
                break;
              case 'getLastPeriodoOfComprobantes':
                output = await documentosController.getLastPeriodoOfComprobantes(tool.function.arguments.personalId, tool.function.arguments.cant).then(array => { return array })
                break;
              case 'getDocsPendDescarga':
                output = await personalController.getDocsPendDescarga(tool.function.arguments.personalId)
                break;
              case 'getAdelantoLimits':
                tool.function.arguments.fecha = new Date()
                output = await PersonalController.getAdelantoLimits(tool.function.arguments.fecha)
                break;
              case 'getPersonalAdelanto':
                output = await PersonalController.getPersonalAdelanto(tool.function.arguments.personalId, tool.function.arguments.anio, tool.function.arguments.mes)
                break;
              case 'deletePersonalAdelanto':
                await personalController.deletePersonalAdelanto(tool.function.arguments.personalId, tool.function.arguments.anio, tool.function.arguments.mes)
                output = { response: 'OK' }
                break;
              case 'setPersonalAdelanto':
                await personalController.setPersonalAdelanto(tool.function.arguments.personalId, tool.function.arguments.anio, tool.function.arguments.mes, tool.function.arguments.importe)
                output = { response: 'OK' }
                break;
              case 'getURLDocumentoNew':
                try {
                  output = await this.getURLDocumentoNew(tool.function.arguments.DocumentoId)
                } catch (e) {
                  output = { Error: e }
                }
                break;
              case 'getBackupNovedad':
                output = await novedadController.getBackupNovedad(tool.function.arguments.personalId)
                break;
              case 'saveNovedad':
                output = await novedadController.saveNovedad(tool.function.arguments.personalId, tool.function.arguments.novedad)
                break;
              case 'getObjetivoByCodObjetivo':
                output = await objetivoController.getObjetivoByCodObjetivo(tool.function.arguments.CodObjetivo)
                break;
              case 'getNovedadTipo':
                output = await novedadController.getNovedadTipo()
                break;
              case 'addNovedad':
                output = await novedadController.addNovedad(tool.function.arguments.novedad, chatId, tool.function.arguments.personalId)
                break;
              case 'getNovedadesPendientesByResponsable':
                output = await novedadController.getNovedadesPendientesByResponsable(tool.function.arguments.personalId)
                break;
              case 'setNovedadVisualizacion':
                //output = await novedadController.setNovedadVisualizacion(tool.function.arguments.NovedadCodigo,chatId,tool.function.arguments.personalId)
                output = {}
                break;

              default:
                throw new Error(`Función desconocida: ${tool.function.name}`);
            }

            //            const output = await functionToCall(tool.function.arguments);

            //console.log('tool_calls', tool.function.name, output)

            botServer.chatmess[chatId].push({
              id: botServer.chatmess[chatId].length, role: "tool", content: JSON.stringify(output), tool_name: tool.function.name,
            });
          }
          recall = true
        }
      } while (recall);

    } catch (err) {
      err= new ClientException(`Error al procesar el mensaje del chatbot: ${err.message}`, { err });
      return next(err)
    }

    const response = botServer.chatmess[chatId].filter(m => m?.sendIt != true).map(m => ({ id: m.id, content: m.content, role: m.role, tool_calls: m.tool_calls, thinking: m.thinking }))

    botServer.chatmess[chatId].forEach(m => m.sendIt = true)


    return this.jsonRes({ 'response': response }, res, 'ok');

  }


  async gotoFlow(req: Request, res: Response, next: NextFunction) {
    const telefono = req.body.telefono
    const flow = req.body.flow

    await botServer.runFlow(telefono, flow)

    const ret = null
    return this.jsonRes(ret, res);

  }
  getChatBotStatus(req: Request, res: Response, next: NextFunction) {
    //  const ret = botServer.status()
    const ret = null
    return this.jsonRes(ret, res);
  }
  delay: number = 1000

  getDelay() {
    return this.delay
  }

  setDelay(delay: number) {
    this.delay = delay
  }

  async getChatBotDelay(req: any, res: Response, next: NextFunction) {
    const delay = this.getDelay()
    return this.jsonRes(delay, res);
  }

  async setChatBotDelay(req: any, res: Response, next: NextFunction) {
    const ms = req.body.ms
    this.setDelay(ms)
    return this.getDelay()
  }

  async sendAlert(req: any, res: Response, next: NextFunction) {
    const nodo = req.body.nodo
    const estado = req.body.estado
    const apiKey = req.body.apiKey
    const ret = null

    if (apiKey != "12345678")
      return this.jsonRes(ret, res);

    try {
      //await botServer.sendMsg('5491144050522', `Nodo ${nodo} ${estado}`)
      //await botServer.sendMsg('5491131624773', `Nodo ${nodo} ${estado}`)

    } catch (error) {
      //      console.log('Error enviando msg',error)    
    }

    return this.jsonRes(ret, res);

  }

  async getChatBotQR(req: any, res: Response, next: NextFunction) {
    const pathArchivos = './bot.qr.png'
    try {
      if (!existsSync(pathArchivos))
        throw new ClientException(`El archivo Imagen no existe`, { 'path': pathArchivos });

      const resBuffer = readFileSync(pathArchivos)
      res.setHeader('Content-Length', resBuffer.length);
      res.write(resBuffer);
      res.end();
    } catch (error) {
      return next(error)
    }
  }

  async addToDocLog(doc_id: number, telefono: string, PersonalId: number) {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    await queryRunner.query(`INSERT INTO DocumentoDescargaLog (DocumentoId, FechaDescarga, Telefono, PersonalId, AudUsuarioIng, AudIpIng, AudFechaIng)
      VALUES (@0,@1,@2,@3,@4,@5,@6)`,
      [doc_id, fechaActual, telefono, PersonalId, 'bot', '127.0.0.1', fechaActual])
  }

  static async enqueBotMsg(personal_id: number, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string) {
    const queryRunner = dataSource.createQueryRunner()
    const fechaActual = new Date()
    try {
      const existsTel = await queryRunner.query(`SELECT PersonalId FROM BotRegTelefonoPersonal WHERE PersonalId = @0`, [personal_id])
      if (existsTel.length == 0) throw new ClientException(`El personal no tiene un telefono registrado.`)

      await queryRunner
        .query(`INSERT INTO BotColaMensajes (FechaIngreso, PersonalId, ClaseMensaje, TextoMensaje, FechaProceso, AudUsuarioIng, AudIpIng, AudFechaIng, AudUsuarioMod, AudFechaMod, AudIpMod) 
            VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10)`, [fechaActual, personal_id, clase_mensaje, texto_mensaje, null, usuario, ip, fechaActual, usuario, fechaActual, ip])
      return true

    } catch (error) {
      return false
    }
  }


  static async getColaMsg() {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    return queryRunner.query(`
      SELECT col.FechaIngreso, col.PersonalId, tel.Telefono, col.TextoMensaje,
      1 
      FROM BotColaMensajes col 
      JOIN BotRegTelefonoPersonal tel ON tel.PersonalId = col.PersonalId
      WHERE col.FechaProceso IS NULL`, [])
  }

  static async updColaMsg(fecha_ingreso: Date, personal_id: number, method: string, provider: string) {
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()

    if (!method && !provider) throw new Error('Se debe especificar al menos method o provider para actualizar el mensaje en cola.');

    return queryRunner.query(`UPDATE BotColaMensajes SET FechaProceso = @0, AudUsuarioMod=@3, AudFechaMod=@0, AudIpMod=@4 , SentMethod=@5, SentProvider=@6
      WHERE FechaIngreso = @1 AND PersonalId = @2`, [fechaActual, fecha_ingreso, personal_id, 'bot', '127.0.0.1', method, provider]);
  }

}