import { BaseController, ClientException } from "./base.controller.ts";
import type { NextFunction, Request, Response } from "express";
import { existsSync, readFileSync } from "node:fs";
import CryptoJS from 'crypto-js';
import { botServer, dbServer } from "../index.ts";
import { documentosController, personalController, novedadController, objetivoController } from "./controller.module.ts";
import { PersonalController } from "./personal.controller.ts";
import { DocumentosController } from "./documentos.controller.ts";
import type { QueryRunner } from "typeorm";

export class ChatBotController extends BaseController {
  private async getAgentsData(queryRunner: any) {
    const agents = await queryRunner.query(`
      SELECT
        prompt.ChatBotPromptCodigo,
        prompt.Descripcion,
        prompt.Tipo,
        prompt.Prompt,
        prompt.IaTools,
        prompt.BasePrompt,
        prompt.Activo
      FROM ChatBotPrompt prompt
      ORDER BY prompt.ChatBotPromptCodigo
    `)

    const prompts = ['BMA', 'LP'].map(code => {
      const agent = agents.find((agent: any) => String(agent.ChatBotPromptCodigo).trim() === code)
      return { code, Prompt: agent ? agent.Prompt ?? '' : null, IaTools: agent ? agent.IaTools ?? '' : null }
    })
    return {
      agents,
      iaPromptHash: CryptoJS.SHA256(JSON.stringify(prompts.map(agent => [agent.code, agent.Prompt]))).toString(CryptoJS.enc.Hex),
      iaToolsHash: CryptoJS.SHA256(JSON.stringify(prompts.map(agent => [agent.code, agent.IaTools]))).toString(CryptoJS.enc.Hex)
    }
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
      IaTools: agent?.IaTools == null ? null : String(agent.IaTools),
      Tipo: String(agent?.Tipo ?? '').trim() || null,
      BasePrompt: !!agent?.BasePrompt,
      Activo: !!agent?.Activo
    }))

    if (normalizedAgents.some((agent: any) => !agent.ChatBotPromptCodigo || agent.ChatBotPromptCodigo.length > 5))
      return next(new ClientException('El código del agente es obligatorio y admite hasta 5 caracteres'))

    // if (normalizedAgents.some((agent: any) => !agent.Descripcion || agent.Descripcion.length > 50))
    //   return next(new ClientException('La descripción del agente es obligatoria y admite hasta 50 caracteres'))

    if (normalizedAgents.some((agent: any) => !agent.Tipo))
      return next(new ClientException('El tipo del agente es obligatorio'))

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

    if (deletedCodes.includes('BMA'))
      return next(new ClientException('No se puede eliminar el agente principal BMA'))
    if (deletedCodes.includes('LP'))
      return next(new ClientException('No se puede eliminar el Lige Prompt LP'))
    // if (deletedCodes.includes('BP'))
    //   return next(new ClientException('No se puede eliminar el Lige Prompt BP'))
    const mainAgent = normalizedAgents.find((agent: any) => agent.ChatBotPromptCodigo === 'BMA')
    const ligeAgent = normalizedAgents.find((agent: any) => agent.ChatBotPromptCodigo === 'LP')
    let mainTools: any[] | null = null
    // Valida que IaTools de cada agente sea un arreglo JSON
    for (const agent of normalizedAgents) {
      let tools: any
      try {
        tools = JSON.parse(agent.IaTools)
      } catch (err) {
        return next(new ClientException(`IA Tools de ${agent.ChatBotPromptCodigo} no contiene un JSON válido`))
      }
      if (!Array.isArray(tools))
        return next(new ClientException(`IA Tools de ${agent.ChatBotPromptCodigo} debe ser un arreglo JSON`))
      if (agent.ChatBotPromptCodigo === 'BMA')
        mainTools = tools
    }

    const usuario = BaseController.getUser(res)
    const ip = this.getRemoteAddress(req)
    const fecha = new Date()
    const queryRunner = await dbServer.connection(usuario)

    try {
      await queryRunner.startTransaction()

      const currentAgents = await queryRunner.query(`
        SELECT ChatBotPromptCodigo, Prompt, IaTools
        FROM ChatBotPrompt WITH (UPDLOCK, HOLDLOCK)
      `)
      const currentCodes = new Set(currentAgents.map((agent: any) => String(agent.ChatBotPromptCodigo).trim()))

      if (mainAgent) {
        const currentMain = currentAgents.find((agent: any) => String(agent.ChatBotPromptCodigo).trim() === 'BMA')
        if (!currentMain)
          throw new ClientException('No se encontró el agente principal BMA. Recargue la sección')
      }

      if (mainAgent || ligeAgent) {
        const prompts = ['BMA', 'LP'].map(code => {
          const agent = currentAgents.find((agent: any) => String(agent.ChatBotPromptCodigo).trim() === code)
          return { code, Prompt: agent ? agent.Prompt ?? '' : null, IaTools: agent ? agent.IaTools ?? '' : null }
        })
        const iaPromptHash = CryptoJS.SHA256(JSON.stringify(prompts.map(agent => [agent.code, agent.Prompt]))).toString(CryptoJS.enc.Hex)
        const iaToolsHash = CryptoJS.SHA256(JSON.stringify(prompts.map(agent => [agent.code, agent.IaTools]))).toString(CryptoJS.enc.Hex)
        if (req.body.iaPromptHash !== iaPromptHash || req.body.iaToolsHash !== iaToolsHash)
          throw new ClientException('Hay cambios posteriores a la última lectura')
      }

      const currentLige = currentAgents.find((agent: any) => String(agent.ChatBotPromptCodigo).trim() === 'LP')
      const lpChanged = !!ligeAgent && (
        !currentLige || ligeAgent.Prompt !== currentLige.Prompt || ligeAgent.IaTools !== currentLige.IaTools
      )

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
                AudIpMod = @6,
                Tipo = @7,
                BasePrompt = @8,
                Activo = @9
            WHERE ChatBotPromptCodigo = @0
          `, [
            agent.ChatBotPromptCodigo,
            agent.Descripcion,
            agent.Prompt,
            agent.IaTools,
            fecha,
            usuario,
            ip,
            agent.Tipo,
            agent.BasePrompt,
            agent.Activo
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
              AudIpMod,
              Tipo,
              BasePrompt,
              Activo
            ) VALUES (@0, @1, @2, @3, @4, @4, @5, @5, @6, @6, @7, @8, @9)
          `, [
            agent.ChatBotPromptCodigo,
            agent.Descripcion,
            agent.Prompt,
            agent.IaTools,
            fecha,
            usuario,
            ip,
            agent.Tipo,
            agent.BasePrompt,
            agent.Activo
          ])
        }
      }

      const data = await this.getAgentsData(queryRunner)
      await queryRunner.commitTransaction()
      let bmaChanged = false
      if (mainAgent) {
        const promptHash = CryptoJS.SHA256(mainAgent.Prompt).toString(CryptoJS.enc.Hex)
        const toolsHash = CryptoJS.SHA256(mainAgent.IaTools).toString(CryptoJS.enc.Hex)
        bmaChanged = promptHash !== botServer.iaPromptHash || toolsHash !== botServer.iaToolsHash
        botServer.iaPrompt = mainAgent.Prompt
        botServer.iaPromptHash = promptHash
        botServer.iaTools = mainTools
        botServer.iaToolsHash = toolsHash
      }
      // Se conserva el campo de respuesta existente para informar el reinicio por BMA o LP.
      bmaChanged = bmaChanged || lpChanged
      if (bmaChanged)
        botServer.chatmess = []
      return this.jsonRes({ ...data, bmaChanged }, res, 'Agentes guardados')
    } catch (err) {
      await this.rollbackTransaction(queryRunner)
      return next(err)
    } finally {
      await queryRunner.release()
    }
  }

  async getChatbotParameters(queryRunner?: any, promptCodigo = 'BMA') {
    const releaseQueryRunner = !queryRunner
    if (!queryRunner) {
      const usuario = BaseController.getUser(null)
      queryRunner = await dbServer.connection(usuario)
    }
    try {
      const rows = await queryRunner.query(`SELECT Prompt, IaTools, Tipo, Descripcion FROM ChatBotPrompt WHERE ChatBotPromptCodigo = @0`, [promptCodigo])
      return rows[0] ?? null
    } finally {
      if (releaseQueryRunner)
        await queryRunner.release()
    }
  }

  async reinicia(req: Request, res: Response, next: NextFunction) {
    const chatId = req.body.chatId
    botServer.chatmess[chatId] = []
    botServer.iaHistorial[chatId] = { msgs: [], tools: [], prompt: '', agent: '' }
    const ret = {}
    return this.jsonRes(ret, res, 'Chat reiniciado correctamente');
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
    } finally {
    }
  }

  async addToDocLog(doc_id: number, telefono: string, PersonalId: number) {
    const usuario = BaseController.getUser(null)
    const queryRunner = await dbServer.connection(usuario)
    const fechaActual = new Date()
    try {
      await queryRunner.query(`INSERT INTO DocumentoDescargaLog (DocumentoId, FechaDescarga, Telefono, PersonalId, AudUsuarioIng, AudIpIng, AudFechaIng)
        VALUES (@0,@1,@2,@3,@4,@5,@6)`,
        [doc_id, fechaActual, telefono, PersonalId, usuario, '127.0.0.1', fechaActual])
    } finally {
      await queryRunner.release()
    }
  }

  static async enqueBotMsg(personal_id: number, texto_mensaje: string, clase_mensaje: string, usuario: string, ip: string) {
    const queryRunner = await dbServer.connection(usuario)

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
    } finally {
      await queryRunner.release()
    }
  }


  static async getColaMsg() {
    const usuario = BaseController.getUser(null)
    const queryRunner = await dbServer.connection(usuario)
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
    const queryRunner = await dbServer.connection(usuario)
    const fechaActual = new Date()

    if (!method && !provider) throw new Error('Se debe especificar al menos method o provider para actualizar el mensaje en cola.');

    return queryRunner.query(`UPDATE BotColaMensajes SET FechaProceso = @0, AudUsuarioMod=@3, AudFechaMod=@0, AudIpMod=@4 , SentMethod=@5, SentProvider=@6
      WHERE FechaIngreso = @1 AND PersonalId = @2`, [fechaActual, fecha_ingreso, personal_id, usuario, '127.0.0.1', method, provider]);
  }


  async getChatBotAgent(queryRunner: QueryRunner, ChatBotPromptCodigo: string) {
    const rows = await queryRunner.query(
      `SELECT ChatBotPromptCodigo, Prompt, Tipo, IaTools, BasePrompt FROM ChatBotPrompt WHERE ChatBotPromptCodigo = @0 and Activo=1`,
      [ChatBotPromptCodigo]
    )
    if (rows.length === 0)
      throw new ClientException(`No se encontró el agente con código ${ChatBotPromptCodigo}`)

    if (rows[0].BasePrompt == 0) {
      // prompt base + agent
      const basePrompt = await queryRunner.query(`SELECT ChatBotPromptCodigo, Prompt, IaTools FROM ChatBotPrompt WHERE BasePrompt=1 and Activo=1`)
      if (basePrompt.length > 0) {
        // todo: inyectar prompt de agente en lugar especifico del prompt base
        rows[0].Prompt = `${basePrompt[0].Prompt}\n\n[Agente Activo: ${rows[0].Tipo}]\n\n${rows[0].Prompt}\n\n[Fin Agente Activo]`
        // Tools del base + las del agente
        const toolsBase = basePrompt[0].IaTools ? JSON.parse(basePrompt[0].IaTools) : []
        const toolsAgente = rows[0].IaTools ? JSON.parse(rows[0].IaTools) : []
        rows[0].IaTools = JSON.stringify([...toolsBase, ...toolsAgente])
        console.log('Combined prompt:', rows[0].Prompt)
        console.info('Combined IaTools:', rows[0].IaTools)
      }
    }
    // Fecha y hora actual para que la IA calcule fechas relativas y períodos
    const fechaActual = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' })
    rows[0].Prompt = `${rows[0].Prompt}\n\n[FECHA Y HORA ACTUAL]\n${fechaActual} (hora de Argentina)`
    return { ChatBotPromptCodigo: rows[0].ChatBotPromptCodigo, Prompt: rows[0].Prompt, IaTools: rows[0].IaTools }
  }

  async chatAgent(req: Request, res: Response, next: NextFunction) {
    const message = String(req.body.message ?? '').trim()
    if (!message)
      return this.jsonRes({ 'response': [] }, res, 'ok');
    //    const personalId = Number(req.body.personalId)
    //    if (!Number.isInteger(personalId) || personalId <= 0)
    //      return next(new ClientException('Debe seleccionar una persona'))
    const chatId = String(req.body.chatId ?? '').trim()
    if (!chatId)
      return next(new ClientException('El teléfono es obligatorio'))

    const usuario = BaseController.getUser(res)
    const queryRunner = await dbServer.connection(usuario)

    if (!botServer.chatmess[chatId]) {
      botServer.chatmess[chatId] = []
    }
    let recall = false
    let vuelta = 0

    if (!botServer.iaHistorial[chatId]?.msgs?.length) {
      const agent = await this.getChatBotAgent(queryRunner, 'AUTH')
      botServer.iaHistorial[chatId] = { msgs: [], tools: agent?.IaTools ? JSON.parse(agent.IaTools) : [], prompt: agent?.Prompt ?? '', agent: agent?.ChatBotPromptCodigo ?? '', debug: true }
      botServer.iaHistorial[chatId].msgs.push({ id: 0, role: "system", content: botServer.iaHistorial[chatId].prompt, sendIt: false, agent: agent?.ChatBotPromptCodigo ?? '', debug: true });
    }
    botServer.iaHistorial[chatId].msgs.push({ id: botServer.chatmess[chatId].length, role: "user", content: message, agent: botServer.iaHistorial[chatId].agent, debug: false })

    const now = new Date()

    try {
      do {
        recall = false
        vuelta++
        // Corte de seguridad ante un bucle de tool_calls
        if (vuelta > 10)
          throw new Error('Se superó el límite de 10 llamadas a la IA en un mismo mensaje')

        console.log('tools', botServer.iaHistorial[chatId].tools)
        const responseIA = await botServer.ollama.chat({
          model: "gpt-oss:120b",
          messages: botServer.iaHistorial[chatId].msgs.filter(m => m.agent == botServer.iaHistorial[chatId].agent),
          stream: false,
          tools: botServer.iaHistorial[chatId].tools,
        });
        botServer.iaHistorial[chatId].msgs.push({ id: botServer.iaHistorial[chatId].msgs.length, ...responseIA.message, agent: botServer.iaHistorial[chatId].agent, debug: !!responseIA.message.tool_calls?.length });

        if (responseIA.message.tool_calls && responseIA.message.tool_calls.length > 0) {

          const stateRes = await personalController.getPersonaState(chatId);
          const autoPersonalId = stateRes.stateData?.personalId;
          // meto control de descarga pendiente de docs para doble validacion al derivar y no alucine la ia?

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
                output = await documentosController.getLastPeriodosOfComprobantesAFIP(pId, tool.function.arguments.cant, queryRunner).then(array => { return array })
                break;
              case 'getLastPeriodoOfComprobantes':
                output = await documentosController.getLastPeriodoOfComprobantes(pId, tool.function.arguments.cant, queryRunner).then(array => { return array })
                break;
              case 'getDocsPendDescarga':
                output = await personalController.getDocsPendDescarga(pId)
                break;
              case 'getAdelantoLimits': {
                // El período es siempre el actual
                const { maxImporte, minImporte, fechaLimite, maxCantAdelantos } = PersonalController.getAdelantoLimits(now)
                output = {
                  periodo: `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
                  plazoVigente: now <= fechaLimite,
                  fechaLimite: fechaLimite.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                  minImporte, maxImporte, maxCantAdelantos
                }
                break;
              }
              case 'getPersonalAdelanto': {
                output = await PersonalController.getPersonalAdelanto(pId, now.getFullYear(), now.getMonth() + 1)
                break;
              }
              case 'deletePersonalAdelanto': {
                try {
                  const eliminado = await personalController.deletePersonalAdelanto(pId, now.getFullYear(), now.getMonth() + 1)
                  output = eliminado ? { response: 'OK' } : { Error: 'No hay un adelanto pendiente para anular en el período actual.' }
                } catch (e) {
                  console.error(`[IA][${chatId}] deletePersonalAdelanto falló: ${e?.message}`)
                  output = { Error: e instanceof ClientException ? e.message : 'No se pudo anular el adelanto.' }
                }
                break;
              }
              case 'setPersonalAdelanto': {
                try {
                  await personalController.setPersonalAdelanto(pId, now.getFullYear(), now.getMonth() + 1, Number(tool.function.arguments.importe))
                  output = { response: 'OK' }
                } catch (e) {
                  console.error(`[IA][${chatId}] setPersonalAdelanto falló: ${e?.message}`)
                  output = { Error: e instanceof ClientException ? e.message : 'No se pudo registrar el adelanto.' }
                }
                break;
              }
              case 'getURLDocumentoNew':
                try {
                  output = await this.getURLDocumentoNew(tool.function.arguments.DocumentoId, queryRunner)
                  // Registra la entrega igual que flowDescargaDocs
                  await this.addToDocLog(tool.function.arguments.DocumentoId, chatId, pId)
                } catch (e) {
                  console.error(`[IA][${chatId}] getURLDocumentoNew falló DocumentoId=${tool.function.arguments.DocumentoId}: ${e?.message}`, e?.extended ?? '')
                  output = { Error: 'ARCHIVO_NO_DISPONIBLE', mensaje: 'El archivo no se encuentra disponible.' }
                }
                break;
              case 'getBackupNovedad':
                output = await novedadController.getBackupNovedad(pId)
                break;
              case 'saveNovedad':
                output = await novedadController.saveNovedad(pId, tool.function.arguments.novedad, queryRunner)
                break;
              case 'getObjetivoByCodObjetivo':
                output = await objetivoController.getObjetivoByCodObjetivo(tool.function.arguments.CodObjetivo)
                break;
              case 'getNovedadTipo':
                output = await novedadController.getNovedadTipo()
                break;
              case 'addNovedad': {
                // Se envía el borrador guardado con saveNovedad
                const novedad = await novedadController.getBackupNovedad(pId)
                const faltantes = await novedadController.validarNovedad(novedad)
                if (faltantes.length) {
                  output = { Error: 'DATOS_INCOMPLETOS', faltantes, accion: 'Si el usuario ya informó estos datos, guardalos con saveNovedad y volvé a llamar addNovedad. Si no, pedíselos.' }
                  break;
                }
                const NovedadCodigo = await novedadController.addNovedad(novedad, chatId, pId, queryRunner)
                // Aviso al supervisor
                // await novedadController.sendMsgResponsable({ ...novedad, novedadId: NovedadCodigo }).catch(e => console.error(`[IA][${chatId}] sendMsgResponsable falló: ${e?.message}`))
                output = { NovedadCodigo }
                break;
              }
              case 'getNovedadesPendientesByResponsable':
                output = await novedadController.getNovedadesPendientesByResponsable(pId)
                break;
              case 'setNovedadVisualizacion':
                //output = await novedadController.setNovedadVisualizacion(tool.function.arguments.NovedadCodigo,chatId,tool.function.arguments.personalId)
                output = {}
                break;
              case 'getAgentes':
                output = await queryRunner.query(`Select ChatBotPromptCodigo,Descripcion from ChatBotPrompt where BasePrompt = 0 AND Activo=1`)
                break;
              case 'transferirAgente':
                // Solo se deriva con el acceso verificado por el backend
                if (!stateRes.activo || !stateRes.identificadorVinculado || stateRes.codigo) {
                  output = { Error: 'No se puede derivar: el acceso de la persona no está verificado. Completá la verificación antes de derivar.' }
                  break;
                }
                // Al salir de AUTH no deben quedar documentos pendientes de descarga
                if (botServer.iaHistorial[chatId].agent === 'AUTH') {
                  const docsPend = await personalController.getDocsPendDescarga(pId)
                  if (docsPend.length) {
                    output = { Error: 'No se puede derivar: la persona tiene documentos pendientes de descarga. Ofrecé descargarlos antes de derivar.' }
                    break;
                  }
                }
                output = await this.getChatBotAgent(queryRunner, tool.function.arguments.agentId)
                botServer.iaHistorial[chatId].tools = (output as any)?.IaTools ? JSON.parse((output as any).IaTools) : []
                botServer.iaHistorial[chatId].prompt = (output as any)?.Prompt ?? ''
                botServer.iaHistorial[chatId].agent = (output as any)?.ChatBotPromptCodigo ?? ''

                botServer.iaHistorial[chatId].msgs.push({ id: botServer.iaHistorial[chatId].msgs.length, role: "system", content: botServer.iaHistorial[chatId].prompt, sendIt: true, agent: botServer.iaHistorial[chatId].agent, debug: true });
                botServer.iaHistorial[chatId].msgs.push({ id: botServer.chatmess[chatId].length, role: "user", content: message, debug: true, agent: botServer.iaHistorial[chatId].agent })

                break;

              default:
                throw new Error(`Función desconocida: ${tool.function.name}`);
            }

            //            const output = await functionToCall(tool.function.arguments);

            const outputJson = JSON.stringify(output)

            botServer.iaHistorial[chatId].msgs.push({
              id: botServer.iaHistorial[chatId].msgs.length, role: "tool", content: outputJson, tool_name: tool.function.name, agent: botServer.iaHistorial[chatId].agent, debug: true
            });
          }
          recall = true
        }
      } while (recall);
      const nuevos = botServer.iaHistorial[chatId].msgs.filter(m => m?.sendIt != true)
      botServer.iaHistorial[chatId].msgs.forEach(m => m.sendIt = true)

      return this.jsonRes({ 'response': nuevos }, res, 'ok');
    } catch (err) {
      return next(new ClientException(err.message));
    } finally {
      await queryRunner.release()
    }
  }

}
