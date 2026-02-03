import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "fs";
//import { botServer } from "../bot-server.ts";
import { dataSource } from "../data-source.ts";
import { botServer } from "../index.ts";

export class ChatBotController extends BaseController {


  async reinicia(req: Request, res: Response, next: NextFunction) {
    const chatId = req.body.chatId
    botServer.chatmess = []
    const ret = {}
    return this.jsonRes(ret, res, 'ok');
  }

  checkPhoneNumber = {
    type: 'function',
    function: {
      name: 'checkPhoneNumber',
      description: 'Check if a phone number exists in the database',
      parameters: {
        type: 'object',
        required: ['phoneNumber'],
        properties: {
          phoneNumber: { type: 'string', description: 'The phone number to check' }
        }
      },
    },

  }

  checkPhoneNumberTool = async (args: any) => {
    return { Nombre: "Juan", Apellido: "Frensa" }
  }


  //availableFunctions = [this.checkPhoneNumber];


  async chat(req: Request, res: Response, next: NextFunction) {

    if (req.body.message.trim() == '')
      return this.jsonRes({ 'response': [] }, res, 'ok');

    let response = []
    if (botServer.chatmess.length == 0)
      botServer.chatmess.push({ role: "system", content: botServer.instrucciones });
    const chatId = req.body.chatId
    let rta: any

    botServer.chatmess.push({ role: "user", content: req.body.message })

    try {
      let recall = false
      do {
        recall = false
        const responseIA = await botServer.ollama.chat({
          model: "gpt-oss:120b",
          messages: botServer.chatmess,
          stream: false,
          tools: [this.checkPhoneNumber]

        });
        console.log('responseIA', responseIA)
        botServer.chatmess.push(responseIA.message);
        response.push(responseIA.message.content || JSON.stringify(responseIA.message.tool_calls))

        if (responseIA.message.tool_calls && responseIA.message.tool_calls.length > 0) {

          for (const tool of responseIA.message.tool_calls) {
            let functionToCall = null
            switch (tool.function.name) {
              case 'checkPhoneNumber':
                functionToCall = this.checkPhoneNumberTool
                break;
              default:
                throw new Error(`Función desconocida: ${tool.function.name}`);
            }

            //const output = functionToCall(tool.function.arguments);

            const output = { tool: "buscar_telefono", resultado: { Nombre: "Juan", Apellido: "Frensa" } }
            console.log('tool_calls', tool.function.name, output)

            botServer.chatmess.push({
              role: "tool", content: JSON.stringify(output), tool_name: tool.function.name,
            });
            response.push(JSON.stringify({ content: JSON.stringify(output), tool_name: tool.function.name }))
          }
          recall = true
        }
      } while (recall);

    } catch (error) {
      throw new ClientException(`Error al procesar el mensaje del chatbot: ${error.message}`, { error });
    }

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