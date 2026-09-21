import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from 'node:fs/promises';
import CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { documentosController, personalController, novedadController, objetivoController } from "./controller.module.ts";
import { PersonalController } from "./personal.controller.ts";

export class ChatBotController extends BaseController {
  private async getAgentsData(queryRunner: any) {
    const agents = await queryRunner.query(`
      SELECT
        prompt.ChatBotPromptCodigo,
        prompt.Descripcion,
        prompt.Prompt,
        prompt.IaTools
      FROM ChatBotPrompt prompt
      ORDER BY prompt.ChatBotPromptCodigo
    `)

    return { agents }
  }

  async getAgents(req: Request, res: Response, next: NextFunction) {
    const usuario = BaseController.getUser(res)
    const queryRunner = await dbServer.connection(usuario)

    try {
      return this.jsonRes(await this.getAgentsData(queryRunner), res, 'ok')
    } catch (err) {
      return next(err)
    } finally {
      await queryRunner.release()
    }
  }

  async setAgents(req: Request, res: Response, next: NextFunction) {
    const agents = req.body?.agents
    const deletedCodesInput = req.body?.deletedCodes ?? []
    if (!Array.isArray(agents))
      return next(new ClientException('No se recibió una lista de agentes válida'))
    if (!Array.isArray(deletedCodesInput))
      return next(new ClientException('No se recibió una lista de eliminaciones válida'))

    const normalizedAgents = agents.map((agent: any) => ({
      ChatBotPromptCodigo: String(agent?.ChatBotPromptCodigo ?? '').trim(),
      Descripcion: String(agent?.Descripcion ?? '').trim() || null,
      Prompt: agent?.Prompt == null ? null : String(agent.Prompt),
      IaTools: agent?.IaTools == null ? null : String(agent.IaTools)
    }))

    if (normalizedAgents.some((agent: any) => !agent.ChatBotPromptCodigo || agent.ChatBotPromptCodigo.length > 5))
      return next(new ClientException('El código del agente es obligatorio y admite hasta 5 caracteres'))

    if (normalizedAgents.some((agent: any) => !agent.Descripcion || agent.Descripcion.length > 50))
      return next(new ClientException('La descripción del agente es obligatoria y admite hasta 50 caracteres'))

    if (normalizedAgents.some((agent: any) => !agent.Prompt?.trim()))
      return next(new ClientException('El prompt del agente es obligatorio'))

    if (normalizedAgents.some((agent: any) => !agent.IaTools?.trim()))
      return next(new ClientException('IA Tools del agente es obligatorio'))

    const requestedCodes = new Set(normalizedAgents.map((agent: any) => agent.ChatBotPromptCodigo))
    if (requestedCodes.size !== normalizedAgents.length)
      return next(new ClientException('La lista contiene códigos de agentes repetidos'))

    const deletedCodes = deletedCodesInput.map((code: any) => String(code ?? '').trim())
    if (deletedCodes.some((code: string) => !code || code.length > 5))
      return next(new ClientException('La lista de eliminaciones contiene un código inválido'))

    const uniqueDeletedCodes = new Set(deletedCodes)
    if (uniqueDeletedCodes.size !== deletedCodes.length)
      return next(new ClientException('La lista de eliminaciones contiene códigos repetidos'))

    if (deletedCodes.some((code: string) => requestedCodes.has(code)))
      return next(new ClientException('Un agente no puede guardarse y eliminarse al mismo tiempo'))

    const usuario = BaseController.getUser(res)
    const ip = this.getRemoteAddress(req)
    const fecha = new Date()
    const queryRunner = await dbServer.connection(usuario)

    try {
      await queryRunner.startTransaction()

      const currentAgents = await queryRunner.query(`
        SELECT ChatBotPromptCodigo
        FROM ChatBotPrompt WITH (UPDLOCK, HOLDLOCK)
      `)
      const currentCodes = new Set(currentAgents.map((agent: any) => String(agent.ChatBotPromptCodigo).trim()))

      if (deletedCodes.some((code: string) => !currentCodes.has(code)))
        throw new ClientException('Uno de los agentes a eliminar ya no existe. Recargue la sección')

      for (const code of deletedCodes) {
        await queryRunner.query(`
          DELETE FROM ChatBotPrompt
          WHERE ChatBotPromptCodigo = @0
        `, [code])
      }

      for (const agent of normalizedAgents) {
        if (currentCodes.has(agent.ChatBotPromptCodigo)) {
          await queryRunner.query(`
            UPDATE ChatBotPrompt
            SET Descripcion = @1,
                Prompt = @2,
                IaTools = @3,
                AudFechaMod = @4,
                AudUsuarioMod = @5,
                AudIpMod = @6
            WHERE ChatBotPromptCodigo = @0
          `, [
            agent.ChatBotPromptCodigo,
            agent.Descripcion,
            agent.Prompt,
            agent.IaTools,
            fecha,
            usuario,
            ip
          ])
        } else {
          await queryRunner.query(`
            INSERT INTO ChatBotPrompt (
              ChatBotPromptCodigo,
              Descripcion,
              Prompt,
              IaTools,
              AudFechaIng,
              AudFechaMod,
              AudUsuarioIng,
              AudUsuarioMod,
              AudIpIng,
              AudIpMod
            ) VALUES (@0, @1, @2, @3, @4, @4, @5, @5, @6, @6)
          `, [
            agent.ChatBotPromptCodigo,
            agent.Descripcion,
            agent.Prompt,
            agent.IaTools,
            fecha,
            usuario,
            ip
          ])
        }
      }

      const data = await this.getAgentsData(queryRunner)
      await queryRunner.commitTransaction()
      return this.jsonRes(data, res, 'Agentes guardados')
    } catch (err) {
      await this.rollbackTransaction(queryRunner)
      return next(err)
    } finally {
      await queryRunner.release()
    }
  }

  async setPrompt(req: any, res: any, next: any) {
    const iaPrompt = req.body.iaPrompt
    const iaPromptHash = req.body.iaPromptHash
    const usuario = BaseController.getUser(null)
    const queryRunner = await dbServer.connection(usuario)
    const ParametroGeneralCodigo = 'BOT'
    
    try {
      if (iaPromptHash !== botServer.iaPromptHash)
        throw new ClientException('Hay cambios posteriores a la última lectura')

      const ParametroGeneral = await queryRunner.query(`SELECT ParametroGeneralCodigo FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`, [ParametroGeneralCodigo])
      if (ParametroGeneral.length) {
        let Parametros = JSON.parse(ParametroGeneral[0])
        Parametros.iaPrompt = iaPrompt
        await queryRunner.query(
          `UPDATE ParametroGeneral 
          SET Parametros = @1, AudFechaMod= @2, AudUsuarioMod= @3, AudIpMod= @4
          WHERE ParametroGeneralCodigo = @0`, 
          [ParametroGeneralCodigo, JSON.stringify(Parametros), new Date(), usuario, '127.0.0.1']
        )
      } else {
        await queryRunner.query(
          `INSERT INTO ParametroGeneral (
          ParametroGeneralCodigo,Parametros,AudFechaIng,AudFechaMod,AudUsuarioIng,AudUsuarioMod,AudIpIng,AudIpMod
          ) VALUES (@0,@1,@2,@2,@3,@3,@4,@4)`, 
          [ParametroGeneralCodigo, JSON.stringify({iaPrompt}), new Date(), usuario, '127.0.0.1']
        )
      }

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
      const ret = { iaTools, iaToolsHash: botServer.iaToolsHash }

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

  async getChatbotParameters() {
    const usuario = BaseController.getUser(null)
    const queryRunner = await dbServer.connection(usuario)
    const ParametroGeneral = await queryRunner.query(`SELECT ParametroGeneralCodigo FROM ParametroGeneral WHERE ParametroGeneralCodigo = @0`, ['BOT'])
    return ParametroGeneral[0]? JSON.parse(ParametroGeneral[0]) : null
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
    const usuario = BaseController.getUser(res)
    const queryRunner= await dbServer.connection(usuario)
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

          const stateRes = await personalController.getPersonaState(chatId);
          const autoPersonalId = stateRes.stateData?.personalId;

          for (const tool of responseIA.message.tool_calls) {
            let output = {}
            const pId = autoPersonalId || tool.function.arguments.personalId;
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
                output = await personalController.getInfoPersonal(pId, chatId)
                break;
              case 'getInfoEmpresa':
                output = await personalController.getInfoEmpresa()
                break;
              case 'getLastPeriodosOfComprobantesAFIP':
                output = await documentosController.getLastPeriodosOfComprobantesAFIP(pId, tool.function.arguments.cant,queryRunner).then(array => { return array })
                break;
              case 'getLastPeriodoOfComprobantes':
                output = await documentosController.getLastPeriodoOfComprobantes(pId, tool.function.arguments.cant,queryRunner).then(array => { return array })
                break;
              case 'getDocsPendDescarga':
                output = await personalController.getDocsPendDescarga(pId)
                break;
              case 'getAdelantoLimits':
                tool.function.arguments.fecha = new Date()
                output = await PersonalController.getAdelantoLimits(tool.function.arguments.fecha)
                break;
              case 'getPersonalAdelanto':
                const anioA = tool.function.arguments.anio || new Date().getFullYear();
                const mesA = tool.function.arguments.mes || new Date().getMonth() + 1;
                output = await PersonalController.getPersonalAdelanto(pId, anioA, mesA)
                break;
              case 'deletePersonalAdelanto':
                const anioD = tool.function.arguments.anio || new Date().getFullYear();
                const mesD = tool.function.arguments.mes || new Date().getMonth() + 1;
                await personalController.deletePersonalAdelanto(pId, anioD, mesD)
                output = { response: 'OK' }
                break;
              case 'setPersonalAdelanto':
                const anioS = tool.function.arguments.anio || new Date().getFullYear();
                const mesS = tool.function.arguments.mes || new Date().getMonth() + 1;
                await personalController.setPersonalAdelanto(pId, anioS, mesS, tool.function.arguments.importe)
                output = { response: 'OK' }
                break;
              case 'getURLDocumentoNew':
                try {
                  output = await this.getURLDocumentoNew(tool.function.arguments.DocumentoId,queryRunner)
                } catch (e) {
                  output = { Error: e }
                }
                break;
              case 'getBackupNovedad':
                output = await novedadController.getBackupNovedad(pId)
                break;
              case 'saveNovedad':
                output = await novedadController.saveNovedad(pId, tool.function.arguments.novedad,queryRunner)
                break;
              case 'getObjetivoByCodObjetivo':
                output = await objetivoController.getObjetivoByCodObjetivo(tool.function.arguments.CodObjetivo)
                break;
              case 'getNovedadTipo':
                output = await novedadController.getNovedadTipo()
                break;
              case 'addNovedad':
                output = await novedadController.addNovedad(tool.function.arguments.novedad, chatId, pId,queryRunner)
                break;
              case 'getNovedadesPendientesByResponsable':
                output = await novedadController.getNovedadesPendientesByResponsable(pId)
                break;
              case 'setNovedadVisualizacion':
                //output = await novedadController.setNovedadVisualizacion(tool.function.arguments.NovedadCodigo,chatId,tool.function.arguments.personalId)
                output = {}
                break;

              default:
                throw new Error(`Función desconocida: ${tool.function.name}`);
            }

            //            const output = await functionToCall(tool.function.arguments);

             

            botServer.chatmess[chatId].push({
              id: botServer.chatmess[chatId].length, role: "tool", content: JSON.stringify(output), tool_name: tool.function.name,
            });
          }
          recall = true
        }
      } while (recall);

    } catch (err) {
      err = new ClientException(`Error al procesar el mensaje del chatbot: ${err.message}`, { err });
      return next(err)
    }

    const response = botServer.chatmess[chatId].filter(m => m?.sendIt != true).map(m => ({
      id: m.id, content: m.content, role: m.role, tool_calls: m.tool_calls, thinking: m.thinking
    }));

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
    }finally {
    }
  }

  async addToDocLog(doc_id: number, telefono: string, PersonalId: number) {
    const usuario = BaseController.getUser(null)
    const queryRunner= await dbServer.connection(usuario)
    const fechaActual = new Date()
    await queryRunner.query(`INSERT INTO DocumentoDescargaLog (DocumentoId, FechaDescarga, Telefono, PersonalId, AudUsuarioIng, AudIpIng, AudFechaIng)
      VALUES (@0,@1,@2,@3,@4,@5,@6)`,
      [doc_id, fechaActual, telefono, PersonalId, usuario, '127.0.0.1', fechaActual])
  }

  static async enqueBotMsg(personal_id: number, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string) {
    const queryRunner= await dbServer.connection(usuario)

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
    const usuario = BaseController.getUser(null)
    const queryRunner= await dbServer.connection(usuario)
    const fechaActual = new Date()
    return queryRunner.query(`
      SELECT col.FechaIngreso, col.PersonalId, tel.Telefono, col.TextoMensaje,
      1 
      FROM BotColaMensajes col 
      JOIN BotRegTelefonoPersonal tel ON tel.PersonalId = col.PersonalId
      WHERE col.FechaProceso IS NULL`, [])
  }

  static async updColaMsg(fecha_ingreso: Date, personal_id: number, method: string, provider: string) {
    const usuario = BaseController.getUser(null)
    const queryRunner= await dbServer.connection(usuario)
    const fechaActual = new Date()

    if (!method && !provider) throw new Error('Se debe especificar al menos method o provider para actualizar el mensaje en cola.');

    return queryRunner.query(`UPDATE BotColaMensajes SET FechaProceso = @0, AudUsuarioMod=@3, AudFechaMod=@0, AudIpMod=@4 , SentMethod=@5, SentProvider=@6
      WHERE FechaIngreso = @1 AND PersonalId = @2`, [fechaActual, fecha_ingreso, personal_id, usuario, '127.0.0.1', method, provider]);
  }

}
