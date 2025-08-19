import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController, novedadController, objetivoController } from "../controller/controller.module.ts";
import { reset, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';

const delay = chatBotController.getDelay()

export const flowNovedad = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)
        await flowDynamic([
            `Novedad:\n` +
            `1 - Fecha: ${novedad.Fecha ?? 's/d'}\n` +
            `2 - Hora: ${novedad.Hora ?? 's/d'}\n` +
            `3 - Cod.Objetivo: ${novedad.CodObjetivo ?? 's/d'}\n` +
            `4 - Tipo de novedad: ${novedad.Tipo?.Descripcion ?? 's/d'}\n` +
            `5 - Descripcion: ${novedad.Descripcion ?? 's/d'}`,
            `6 - Acción: ${novedad.Accion ?? 's/d'}`,

            `C - Limpar campos`,
            `E - Enviar al responsable`,
            `M - Menú`
        ]
            , { delay: delay })
    })

    .addAnswer([],
        { capture: true, delay },
        async (ctx, { fallBack, gotoFlow, state }) => {
            switch (String(ctx.body).toLowerCase()) {
                case '1':
                    return gotoFlow(flowNovedadFecha)
                    break;
                case '2':
                    return gotoFlow(flowNovedadHora)
                    break;
                case '3':
                    return gotoFlow(flowNovedadCodObjetivo)
                    break;
                case '4':
                    return gotoFlow(flowNovedadTipo)
                    break;
                case '5':
                    return gotoFlow(flowNovedadDescrip)
                    break;
                case '6':
                    return gotoFlow(flowNovedadAccion)
                    break;
                case 'c':
                    //return gotoFlow(flowNovedad)
                    break;
                case 'e':
                    return gotoFlow(flowNovedadEnvio)
                    break;
                case 'm':
                    return gotoFlow(flowMenu)
                    break;
                default:
                    return fallBack()
                    break;
            }
        })


/*
export const flowNovedad1 = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic,endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const telefono = ctx.from
        const novedad = await novedadController.getBackupNovedad(telefono)
        await flowDynamic(
            `*Informe de novedad*\n-Cod.Objetivo: ${novedad.CodObjetivo}\n-Tipo de novedad: ${novedad.Tipo.Descripcion}\n-Descripcion: ${novedad.Descripcion}\n-Hora: ${novedad.Hora}\n-Fecha: ${novedad.Fecha}`
            , { delay: delay })



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
        return gotoFlow(flowNovedad)
    })
*/
export const flowNovedadCodObjetivo = addKeyword(EVENTS.ACTION)
    .addAnswer(['Ingrese el código del objetivo donde se produjo el hecho'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const CodObjetivo = ctx.body
            const data = state.getMyState()
            
            const res = await objetivoController.getObjetivoByCodObjetivo(CodObjetivo)
            if (!res.length) {
                const reintento = (data.reintento) ? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('Código ingresado incorrecto, reintente')
            }
            const objetivo = res[0]
            await flowDynamic([`Objetivo: ${objetivo.descripcion}`], { delay: delay })
            const novedad = state.get('novedad') ?? {}
            novedad.CodObjetivo = CodObjetivo
            await novedadController.saveNovedad(data.personalId, novedad)
            await state.update({ novedad, reintento: 0 })

            return gotoFlow(flowNovedad)
        })

export const flowNovedadTipo = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state,gotoFlow }) => {
        const res = await novedadController.getNovedadTipo()
        const novedad = state.get('novedad')
        const concatOptionsTipo = res.map((item: any, i: number) => `${i + 1}- ${item.Descripcion}`).join('\n');
        await flowDynamic(`${concatOptionsTipo}`, { delay: delay })
        novedad.OptionsTipo = res
        await state.update({ novedad })
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

    })
    .addAnswer('Ingrese el número del tipo de situación', { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {

            const data = state.getMyState()
            const novedad = state.get('novedad') ?? {}
            const OptionsTipo = novedad.OptionsTipo

            const indexTipo = parseInt(ctx.body)
            if (indexTipo < 1 || indexTipo > OptionsTipo.length) {
                const reintento = (data.reintento) ? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('Tipo de novedad ingresado incorrecto, reintente')
            }
            novedad.Tipo = OptionsTipo[indexTipo - 1]
            delete novedad.OptionsTipo
            await novedadController.saveNovedad(data.personalId, novedad)
            await state.update({ novedad, reintento: 0 })
            return gotoFlow(flowNovedad)
        })

export const flowNovedadAccion = addKeyword(EVENTS.ACTION)
    .addAnswer(['Describa la acción tomada'], { capture: true, delay },
        async (ctx, { state, gotoFlow, }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const novedad = state.get('novedad') ?? {}
            const personalId = state.get('personalId') ?? {}
            novedad.Descripcion = ctx.body
            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ novedad })

            return gotoFlow(flowNovedad)
        })


export const flowNovedadDescrip = addKeyword(EVENTS.ACTION)
    .addAnswer(['Describa la situación'], { capture: true, delay },
        async (ctx, { state, gotoFlow, }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const novedad = state.get('novedad') ?? {}
            const personalId = state.get('personalId') ?? {}
            novedad.Descripcion = ctx.body
            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ novedad })

            return gotoFlow(flowNovedad)
        })

export const flowNovedadHora = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state,gotoFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
    })
    
    .addAnswer(['Ingrese la hora de cuando se produjo el hecho (hh:mm)'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const data = state.getMyState()
            const Hora = ctx.body

            if (!esHoraValida(Hora)) {
                const reintento = (data.reintento) ? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('El formato de hora ingresado es incorrecto, reintente')
            }

            const novedad = state.get('novedad') ?? {}
            novedad.Hora = Hora
            await novedadController.saveNovedad(data.personalId, novedad)
            await state.update({ novedad, reintento: 0 })

            return gotoFlow(flowNovedad)
        })

export const flowNovedadFecha = addKeyword(EVENTS.ACTION)
    .addAnswer(['Ingrese la fecha de cuando se produjo el hecho (dd/mm/aaaa)'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const data = state.getMyState()
            const Fecha = ctx.body

            if (!esFechaValida(Fecha)) {
                const reintento = (data.reintento) ? data.reintento : 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('El formato de fecha ingresada es incorrecta, reintente')
            }
            const novedad = state.get('novedad') ?? {}
            novedad.Fecha = Fecha
            await novedadController.saveNovedad(data.personalId, novedad)
            await state.update({ novedad, reintento: 0 })

            return gotoFlow(flowNovedad)
        })


export const flowNovedadEnvio = addKeyword(EVENTS.ACTION)
    .addAnswer('Enviar al responsable (si/no)', { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const novedad = state.get('novedad')
            const personalId = state.get('personalId')
            const respSINO = ctx.body
            const telefono = ctx.from
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                await novedadController.addNovedad(novedad, telefono, personalId)
                await novedadController.saveNovedad(personalId, {})
                await flowDynamic([`Enviado al responsable`, `Redirigiendo al Menu ...`], { delay: delay })
            } else {
                return fallBack()
            }
            await state.update({ nodedad:{},reintento:0 })
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

