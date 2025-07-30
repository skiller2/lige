import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController, novedadController } from "../controller/controller.module.ts";
import { reset, start, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import { flowDescargaDocs } from './flowDescargaDocs.ts';

const delay = chatBotController.getDelay()
const linkVigenciaHs = (process.env.LINK_VIGENCIA)? Number(process.env.LINK_VIGENCIA):3

export const flowNovedad = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from
        const res = await personalController.getPersonalQuery(telefono,0)
        const resNovedad = await novedadController.getBackupNovedad(telefono)
        const novedad = resNovedad.length === 0 ? {} : resNovedad[0]
        
        if (res.length) {
            if (![2, 9, 23, 12, 10, 16, 28, 18, 26, 11, 20, 22].includes(res[0].PersonalSituacionRevistaSituacionId)) {
                await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio`, { delay: delay })
                stop(ctx, gotoFlow, state)
                return
            }
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })
        }
        console.log('----------------------');
        console.log('getMyState :', state.getMyState());
        await state.update({ novedad, reintento: 0 })
        if (!novedad.CodObjetivo) {
            return gotoFlow(flowNovedadCodObjetivo)
        } else if (!novedad.Tipo) {
            return gotoFlow(flowNovedadTipo)
        } else if (!novedad.Descripcion) {
            return gotoFlow(flowNovedadDescrip)
        } else if (!novedad.Hora) {
            return gotoFlow(flowNovedadHora)
        } else if (!novedad.Fecha) {
            return gotoFlow(flowNovedadFecha)
        }
        return gotoFlow(flowNovedadEnvio)
    })

export const flowLogin = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        start(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from
        await flowDynamic(`🙌 Bienvenido al área de consultas de la Cooperativa Lince Seguridad`, { delay: delay })
        const res = await personalController.getPersonalQuery(telefono,0)

        //force
        if (process.env.PERSONALID_TEST) {
            res.length = 0
            res.push({ cuit: '20300000001', codigo: '', PersonalSituacionRevistaSituacionId: 2, personalId: process.env.PERSONALID_TEST, name: 'Prueba probador' })
        }

        if (res.length) {
            if (![2,9,23,12,10,16,28,18,26,11,20,22].includes(res[0].PersonalSituacionRevistaSituacionId)) { 
                await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio ${res[0].PersonalSituacionRevistaSituacionId}`, { delay: delay })
                stop(ctx, gotoFlow, state)
                return
            }
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })

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

            const fistName = res[0].name.trim().split(" ")[0].trim();
            if (fistName)
                await flowDynamic(`${mensaje} ${fistName.charAt(0).toUpperCase() + fistName.slice(1).toLowerCase()}`, { delay: delay })

            if (res[0].codigo) {
                //Código pendiente de ingreso
//                return gotoFlow(flowValidateCode)
            } else {
//                return gotoFlow(flowMenu)
                return gotoFlow(flowDescargaDocs)
            }

        }
    })
    .addAnswer('El teléfono ingresado no lo pude localizar.  Desea registrarlo (Si/No)?', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const telefono = ctx.from
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const ret = await personalController.genTelCode(telefono)
                await flowDynamic(`Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${encodeURIComponent(ret.encTelNro)}`, { delay: delay })
                await flowDynamic(`Recuerda el enlace tiene una vigencia de ${linkVigenciaHs} horas, pasado este tiempo vuelve a saludarme para que te entrege uno nuevo`, { delay: delay })
                await state.update({ encTelNro: ret.encTelNro })
                stopSilence(ctx,gotoFlow, state)
                return endFlow()
            } else {
                stop(ctx,gotoFlow, state)
            }

        })

export const flowNovedadCodObjetivo = addKeyword(EVENTS.ACTION)
    .addAnswer([ 'Ingrese el código del objetivo donde se produjo el hecho' ], { capture: true, delay },
    async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from
        const CodObjetivo = ctx.body
        const data = state.getMyState()
        
        if (data?.codigo != CodObjetivo) {
            const reintento = (data.reintento)? data.reintento : 0
            if (reintento > 3) {
//                    const res = await personalController.delTelefonoPersona(telefono)
                await flowDynamic(`Demasiados reintentos`, { delay: delay })
                stop(ctx, gotoFlow, state)
                return
            }

            await state.update({ reintento: reintento + 1 })    
            return fallBack('Código ingresado incorrecto, reintente')
        }

        await flowDynamic(`Identidad verificada existosamente`, { delay: delay })
//                personalController.removeCode(telefono)
        const novedad = { CodObjetivo }
        await novedadController.saveNovedad(telefono, novedad)
        await state.update({ novedad, reintento: 0 })

        return gotoFlow(flowNovedadTipo)
    })

export const flowNovedadTipo = addKeyword(EVENTS.ACTION)
    .addAnswer([
            'Indique el tipo de situación',
            '1- *Robo mercadería*',
            '2- *Robo cliente*',
            '3- *Merodeo*', 
        ], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const telefono = ctx.from
            const data = state.getMyState()
            const novedad = state.get('novedad')
            
            const tipo = parseInt(ctx.body)
            if (![1,2,3].includes(tipo)) {
                const reintento = (data.reintento)? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return
                }

                await state.update({ reintento: reintento + 1 })  
                return fallBack('Tipo de novedad ingresado incorrecto, reintente')
            }
            novedad.Tipo = tipo
            await novedadController.saveNovedad(telefono, novedad)
            await state.update({ novedad, reintento: 0 })
            return gotoFlow(flowNovedadDescrip)
    })

export const flowNovedadDescrip = addKeyword(EVENTS.ACTION)
    .addAnswer(['Describa la situación'], { capture: true, delay },
        async (ctx, { state, gotoFlow, }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const telefono = ctx.from
            const novedad = state.get('novedad')
            novedad.Descripcion = ctx.body
            await novedadController.saveNovedad(telefono, novedad)
            await state.update({ novedad })

            return gotoFlow(flowNovedadHora)
    })

export const flowNovedadHora = addKeyword(EVENTS.ACTION)
    .addAnswer(['Hora del novedad (hh:mm)'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const telefono = ctx.from
            const data = state.getMyState()
            const Hora = ctx.body

            if (!esHoraValida(Hora)) {
                const reintento = (data.reintento)? data.reintento: 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return
                }

                await state.update({ reintento: reintento + 1 })  
                return fallBack('El formato de hora ingresado es incorrecto, reintente')
            }

            const novedad = state.get('novedad')
            novedad.Hora = Hora
            await novedadController.saveNovedad(telefono, novedad)
            await state.update({ novedad, reintento: 0 })

            return gotoFlow(flowNovedadFecha)
    })

export const flowNovedadFecha = addKeyword(EVENTS.ACTION)
    .addAnswer(['Fecha del novedad (dd/mm/aaaa)'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const telefono = ctx.from
            const data = state.getMyState()
            const Fecha = ctx.body

            if (!esFechaValida(Fecha)) {
                const reintento = (data.reintento)? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return
                }

                await state.update({ reintento: reintento + 1 })  
                return fallBack('El formato de fecha ingresada es incorrecta, reintente')
            }
            const novedad = state.get('novedad')
            novedad.Fecha = Fecha
            await novedadController.saveNovedad(telefono, novedad)
            await state.update({ novedad, reintento: 0 })

            return gotoFlow(flowNovedadEnvio)
    })

export const flowNovedadEnvio = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

        const novedad = state.get('novedad')
        const tiposNovedad = ['Robo mercadería', 'Robo cliente', 'Merodeo']
        
        await flowDynamic([
            `*Informe de novedad*`,
            `-Cod.Objetivo: ${novedad.CodObjetivo}`,
            `-Tipo de novedad: ${tiposNovedad[novedad.Tipo-1]}`,
            `-Descripcion: ${novedad.Descripcion}`,
            `-Hora: ${novedad.Hora}`,
            `-Fecha: ${novedad.Fecha}`
        ], { delay: delay })

    })
    .addAnswer('Enviar al responsable (si/no)' , { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            let myState = state.getMyState()
            const novedad = state.get('novedad')
            const personalId = state.get('personalId')
            const respuesta = ctx.body
            const telefono = ctx.from
            if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
                // await novedadController.addNovedad(novedad, telefono, personalId)
                await flowDynamic(`Enviado al responsable`, { delay: delay })
            } else if (respuesta != 'no' && respuesta != 'No' && respuesta != 'NO') {
                return fallBack()
            }
            delete myState.novedad
            delete myState.reintento
            await state.update(myState)
            return gotoFlow(flowMenu)
    })

function esHoraValida(hora: string): boolean {
    const partes = hora.split(':')
    if (partes.length != 2) return false
    const hh = parseInt(partes[0])
    const mm = parseInt(partes[1])
    if (isNaN(hh) || hh < 0 || hh > 24) return false
    if (isNaN(mm) || mm < 0 || mm > 59) return false
    return true
}

function esFechaValida(fecha: string): boolean {
    const partes = fecha.split('/')
    if (partes.length != 3) return false
    if (partes[2].length != 4) return false
    const dd = parseInt(partes[0])
    const mm = parseInt(partes[1])
    const aaaa = parseInt(partes[2])
    if (isNaN(mm) || mm < 0 || mm > 12) return false
    if (isNaN(aaaa)) return false
    const daysInMonth = new Date(aaaa, mm, 0).getDate()
    if (isNaN(dd) || dd < 0 || dd > daysInMonth) return false
    return true
}

