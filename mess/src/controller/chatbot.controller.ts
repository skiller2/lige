import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from 'node:fs/promises';
import CryptoJS from 'crypto-js';

//import { botServer } from "../bot-server.ts";
import { dataSource } from "../data-source.ts";
import { botServer } from "../index.ts";
import { documentosController, personalController, novedadController, objetivoController } from "./controller.module.ts";
import { PersonalController } from "./personal.controller.ts";

export class ChatBotController extends BaseController {
  static activeAgents = new Map<string, string>();

  static agentConfigs: { [key: string]: { file: string, tools: string[] } } = {
    "orchestrator": {
      file: "bot-orchestrator-agent.md",
      tools: ["getPersonaState", "genTelCode", "removeCode", "delTelefonoPersona"]
    },
    "novedades": {
      file: "bot-novedades-agent.md",
      tools: ["getBackupNovedad", "saveNovedad", "getObjetivoByCodObjetivo", "getNovedadTipo", "addNovedad", "getNovedadesPendientesByResponsable", "setNovedadVisualizacion"]
    },
    "docs": {
      file: "bot-docs-agent.md",
      tools: ["getLastPeriodosOfComprobantesAFIP", "getLastPeriodoOfComprobantes", "getDocsPendDescarga", "getURLDocumentoNew"]
    },
    "finanzas": {
      file: "bot-finanzas-agent.md",
      tools: ["getAdelantoLimits", "getPersonalAdelanto", "deletePersonalAdelanto", "setPersonalAdelanto"]
    },
    "info": {
      file: "bot-info-agent.md",
      tools: ["getInfoPersonal", "getInfoEmpresa"]
    }
  };

  getAgentPrompt(agentName: string): string {
    const fileName = ChatBotController.agentConfigs[agentName]?.file || "bot-orchestrator-agent.md";
    try {
      return readFileSync(__dirname + '/../../agents/' + fileName, 'utf8');
    } catch (e) {
      console.log(`No se pudo leer el prompt del agente: ${fileName}`);
      // Por ahora no se usa el prompt viejo
      // return botServer.iaPrompt || "Eres un asistente virtual.";
    }
  }

  getAgentTools(agentName: string, allTools: any[]): any[] {
    const allowed = ChatBotController.agentConfigs[agentName]?.tools || [];
    return allTools.filter((t: any) => allowed.includes(t.function.name));
  }
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

  async getPrompt(req: any, res: any, next: any) {
    const ret = { iaPrompt: botServer.iaPrompt, iaPromptHash: botServer.iaPromptHash }
    return this.jsonRes(ret, res, 'ok');
  }

  async reinicia(req: Request, res: Response, next: NextFunction) {
    const chatId = req.body.chatId
    botServer.chatmess[chatId] = []
    ChatBotController.activeAgents.delete(chatId);
    const ret = {}
    return this.jsonRes(ret, res, 'ok');
  }





  async chat(req: Request, res: Response, next: NextFunction) {

    if (req.body.message.trim() == '')
      return this.jsonRes({ 'response': [] }, res, 'ok');
    const chatId: string = req.body.chatId
    if (!botServer.chatmess[chatId])
      botServer.chatmess[chatId] = []

    let activeAgent = ChatBotController.activeAgents.get(chatId) || "orchestrator";

    if (botServer.chatmess[chatId].length == 0)
      botServer.chatmess[chatId].push({ id: 0, role: "system", content: this.getAgentPrompt(activeAgent), sendIt: true });

    botServer.chatmess[chatId].push({ id: botServer.chatmess[chatId].length, role: "user", content: req.body.message })
    let agentChangeMessages: any[] = [];

    try {
      let recall = false
      do {
        recall = false
        const responseIA = await botServer.ollama.chat({
          model: "gpt-oss:120b",
          messages: botServer.chatmess[chatId],
          stream: false,
          tools: this.getAgentTools(activeAgent, botServer.iaTools),
        });

        botServer.chatmess[chatId].push({ id: botServer.chatmess[chatId].length, ...responseIA.message });

        let routeChanged = false;
        if (activeAgent === "orchestrator" && responseIA.message.content) {
          const content = responseIA.message.content.toLowerCase();
          let newAgent: string | null = null;
          if (content.includes("derivar a docs")) newAgent = "docs";
          else if (content.includes("derivar a novedades")) newAgent = "novedades";
          else if (content.includes("derivar a finanzas")) newAgent = "finanzas";
          else if (content.includes("derivar a info")) newAgent = "info";

          if (newAgent) {
            ChatBotController.activeAgents.set(chatId, newAgent);
            activeAgent = newAgent;
            // Remove the routing message from history so the new agent doesn't get confused
            const routingMsg = botServer.chatmess[chatId].pop();
            // Update System Prompt to the new agent
            botServer.chatmess[chatId][0].content = this.getAgentPrompt(newAgent);

            // Guardar el mensaje informativo SOLO para la respuesta HTTP (no toca Ollama)
            agentChangeMessages.push({
              id: new Date().getTime(),
              role: 'assistant',
              content: `🔄 **Cambio de agente:** Se derivó a \`${newAgent}\`.\n\n**Razonamiento del orquestador:**\n${routingMsg.content}`
            });

            routeChanged = true;
          }
        }

        if (routeChanged) {
          recall = true;
          continue;
        }

        if (responseIA.message.tool_calls && responseIA.message.tool_calls.length > 0) {

          const stateRes = await personalController.getPersonaState(chatId);
          const autoPersonalId = stateRes.stateData?.personalId;

          for (const tool of responseIA.message.tool_calls) {
            // Guardamos un mensaje visual extra para que el usuario vea qué agente está usando qué herramienta
            agentChangeMessages.push({
              id: new Date().getTime() + Math.random(),
              role: 'assistant',
              content: `⚙️ **[Agente: ${activeAgent}]** Ejecutando herramienta \`${tool.function.name}\`...`
            });

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
                output = await documentosController.getLastPeriodosOfComprobantesAFIP(pId, tool.function.arguments.cant).then(array => { return array })
                break;
              case 'getLastPeriodoOfComprobantes':
                output = await documentosController.getLastPeriodoOfComprobantes(pId, tool.function.arguments.cant).then(array => { return array })
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
                  output = await this.getURLDocumentoNew(tool.function.arguments.DocumentoId)
                } catch (e) {
                  output = { Error: e }
                }
                break;
              case 'getBackupNovedad':
                output = await novedadController.getBackupNovedad(pId)
                break;
              case 'saveNovedad':
                output = await novedadController.saveNovedad(pId, tool.function.arguments.novedad)
                break;
              case 'getObjetivoByCodObjetivo':
                output = await objetivoController.getObjetivoByCodObjetivo(tool.function.arguments.CodObjetivo)
                break;
              case 'getNovedadTipo':
                output = await novedadController.getNovedadTipo()
                break;
              case 'addNovedad':
                output = await novedadController.addNovedad(tool.function.arguments.novedad, chatId, pId)
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

    const response = botServer.chatmess[chatId].filter(m => m?.sendIt != true).map(m => {
      let finalContent = m.content;
      if (m.role === 'assistant' && finalContent && (!m.tool_calls || m.tool_calls.length === 0)) {
         finalContent = `👤 **[Agente: ${activeAgent}]**\n\n${finalContent}`;
      }
      return { id: m.id, content: finalContent, role: m.role, tool_calls: m.tool_calls, thinking: m.thinking };
    });

    // Inyectar los mensajes visuales de cambio de agente en la respuesta del frontend
    const finalResponse = [...agentChangeMessages, ...response];

    botServer.chatmess[chatId].forEach(m => m.sendIt = true)

    return this.jsonRes({ 'response': finalResponse }, res, 'ok');

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