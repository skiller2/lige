import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController, novedadController, objetivoController } from "../controller/controller.module.ts";
import { reset, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import { ChatBotController } from 'src/controller/chatbot.controller.ts';
import { ObjetivoController } from 'src/controller/objetivo.controller.ts';
import { existsSync, mkdirSync } from "fs";
import { FileUploadController } from 'src/controller/file-upload.controller.ts';

const delay = chatBotController.getDelay()

const dirtmp = `${process.env.PATH_DOCUMENTS}/temp`;
if (!existsSync(dirtmp)) {
    mkdirSync(dirtmp, { recursive: true });
}

export const flowNovedad = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)
        if (Object.keys(novedad).length === 0) {
            return gotoFlow(flowNovedadFecha)
        }
        await flowDynamic([
            `Novedad:\n` +
            `1 - Fecha: ${novedad.Fecha ? parseFecha(novedad.Fecha) : 's/d'}\n` +
            `2 - Hora: ${novedad.Hora ?? 's/d'}\n` +
            `3 - Cod.Objetivo: ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad.DesObjetivo ?? ''}\n` +
            `4 - Tipo de novedad: ${novedad.Tipo?.Descripcion ?? 's/d'}\n` +
            `5 - Descripción: ${novedad.Descripcion ?? 's/d'}\n` +
            `6 - Acción: ${novedad.Accion ?? 's/d'}`,

            `A - Adjuntar documento/foto/video\n` +
            `C - Limpiar campos\n` +
            `E - Enviar al responsable\n` +
            `M - Menú`
        ]
            , { delay: delay })
    })
    .addAnswer([],
        { capture: true, delay },
        async (ctx, { flowDynamic, fallBack, gotoFlow, state }) => {

            const personalId = state.get('personalId')
            const novedad = await novedadController.getBackupNovedad(personalId)
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
                case 'a':
                    return gotoFlow(flowNovedadRecibirDocs)
                    break;
                case 'c':
                    await novedadController.saveNovedad(personalId, {})
                    await flowDynamic(`Limpieza exitosa`, { delay: delay })
                    return gotoFlow(flowNovedad)
                    break;
                case 'e':
                    if (!novedad.Fecha || !novedad.Hora || !(novedad.ClienteId && novedad.ClienteElementoDependienteId) || !novedad.Tipo || !novedad.Descripcion || !novedad.Accion) {
                        await flowDynamic(`Se debe completar todos los campos para realizar esta acción`, { delay: delay })
                        return gotoFlow(flowNovedad)
                    }
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
    .addAnswer(['Ingrese el código del objetivo donde se produjo el hecho', 'M - Volver al menú',], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const CodObjetivo = ctx.body
            const personalId = state.get('personalId')

            const res = await objetivoController.getObjetivoByCodObjetivo(CodObjetivo)
            if (!res.length) {
                const reintento = state.get('reintento') ?? 0
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
            const novedad = await novedadController.getBackupNovedad(personalId)

            // novedad.CodObjetivo = CodObjetivo
            const array = CodObjetivo.split('/')
            novedad.ClienteId = parseInt(array[0])
            novedad.ClienteElementoDependienteId = parseInt(array[1])
            novedad.DesObjetivo = objetivo.descripcion

            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ reintento: 0 })

            return gotoFlow(flowNovedadRouter)
        })

export const flowNovedadTipo = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)

        const res = await novedadController.getNovedadTipo()
        const concatOptionsTipo = res.map((item: any, i: number) => `${i + 1}- ${item.Descripcion}`).join('\n');
        await flowDynamic([`${concatOptionsTipo}`, `M - Volver al menú`,], { delay: delay })
        novedad.OptionsTipo = res
        await novedadController.saveNovedad(personalId, novedad)

        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

    })
    .addAnswer(['Ingrese el número del tipo de situación', 'M - Volver al menú',], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const personalId = state.get('personalId')
            const novedad = await novedadController.getBackupNovedad(personalId)
            const OptionsTipo = novedad.OptionsTipo

            const indexTipo = parseInt(ctx.body)
            if (indexTipo < 1 || indexTipo > OptionsTipo.length) {
                const reintento = state.get('reintento') ?? 0
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
            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ reintento: 0 })
            return gotoFlow(flowNovedadRouter)
        })

export const flowNovedadAccion = addKeyword(EVENTS.ACTION)
    .addAnswer(['Describa la acción tomada'], { capture: true, delay },
        async (ctx, { state, gotoFlow, }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const personalId = state.get('personalId') ?? 0
            const novedad = await novedadController.getBackupNovedad(personalId)

            novedad.Accion = ctx.body
            await novedadController.saveNovedad(personalId, novedad)

            return gotoFlow(flowNovedadRouter)
        })


export const flowNovedadDescrip = addKeyword(EVENTS.ACTION)
    .addAnswer(['Describa la situación', 'M - Volver al menú',], { capture: true, delay },
        async (ctx, { state, gotoFlow, }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const personalId = state.get('personalId') ?? 0
            const novedad = await novedadController.getBackupNovedad(personalId)

            novedad.Descripcion = ctx.body
            await novedadController.saveNovedad(personalId, novedad)

            return gotoFlow(flowNovedadRouter)
        })

export const flowNovedadHora = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
    })
    .addAnswer([
        'Ingrese la hora de cuando se produjo el hecho (hh:mm)',
        'H - Ingresar Hora actual',
        'M - Volver al menú',
    ], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const personalId = state.get('personalId')

            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)
            if (String(ctx.body).toLowerCase() == 'h') {
                const HoraActual: Date = new Date()
                const novedad = await novedadController.getBackupNovedad(personalId)
                const NovedadFecha = new Date(novedad.Fecha)
                NovedadFecha.setHours(HoraActual.getHours(), HoraActual.getMinutes(), 0, 0);
                novedad.Fecha = NovedadFecha
                novedad.Hora = HoraActual.getHours() + ':' + HoraActual.getMinutes()
                await novedadController.saveNovedad(personalId, novedad)
                await state.update({ reintento: 0 })

                return gotoFlow(flowNovedadRouter)
            }

            const Hora = ctx.body

            if (!esHoraValida(Hora)) {
                const reintento = state.get('reintento') ?? 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('El formato de hora ingresado es incorrecto, reintente')
            }

            const novedad = await novedadController.getBackupNovedad(personalId)
            const [horas, minutos] = Hora.split(':').map(Number);
            const NovedadFecha = novedad.Fecha ? new Date(novedad.Fecha) : new Date()
            NovedadFecha.setHours(horas, minutos, 0, 0);
            novedad.Fecha = NovedadFecha
            novedad.Hora = Hora
            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ reintento: 0 })

            return gotoFlow(flowNovedadRouter)
        })

export const flowNovedadFecha = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Ingrese la fecha de cuando se produjo el hecho (dd/mm/aaaa)',
        'H - Ingresar Fecha actual',
        'M - Volver al menú',
    ], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const personalId = state.get('personalId')

            if (String(ctx.body).toLowerCase() == 'h') {
                const FechaActual: Date = new Date()
                const novedad = await novedadController.getBackupNovedad(personalId)
                const [horas, minutos] = novedad.Hora ? novedad.Hora.split(':').map(Number) : [0, 0];
                FechaActual.setHours(horas, minutos, 0, 0)
                novedad.Fecha = FechaActual
                await novedadController.saveNovedad(personalId, novedad)
                await state.update({ reintento: 0 })

                return gotoFlow(flowNovedadRouter)
            }

            const Fecha = ctx.body
            if (!esFechaValida(Fecha)) {
                const reintento = state.get('reintento') ?? 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx, gotoFlow, state)
                    return endFlow()
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('El formato de fecha ingresada es incorrecta, reintente')
            }
            const novedad = await novedadController.getBackupNovedad(personalId)
            const [dia, mes, anio] = Fecha.split('/').map(Number);
            novedad.Fecha = new Date(anio, mes - 1, dia)
            const [horas, minutos] = novedad.Hora ? novedad.Hora.split(':').map(Number) : [0, 0];
            novedad.Fecha.setHours(horas, minutos, 0, 0)
            await novedadController.saveNovedad(personalId, novedad)
            await state.update({ reintento: 0 })

            return gotoFlow(flowNovedadRouter)
        })


export const flowNovedadEnvio = addKeyword(EVENTS.ACTION)
    .addAnswer('Enviar al responsable (si/no)', { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const personalId = state.get('personalId')
            const novedad = await novedadController.getBackupNovedad(personalId)
            const respSINO = ctx.body
            const telefono = ctx.from
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const novedadId = await novedadController.addNovedad(novedad, telefono, personalId)
                novedad.telefonoOrigen = telefono
                await novedadController.sendMsgResponsable(novedad)

                console.log('archivos',novedad.file)
                if (novedad.file) {
                    const doc: any = await FileUploadController.handleDOCUpload(null, null, null, null, new Date(novedad.Fecha), null, novedadId.toString(), null, null, novedad.file, 'bot', '::1')
                    await novedadController.addRelNovedadDoc(novedadId,doc.doc_id,new Date())
                }

                if (!process.env.PERSONALID_TEST)
                    await novedadController.saveNovedad(personalId, {})

                await flowDynamic([`Enviado al responsable`, `Redirigiendo al Menu ...`], { delay: delay })
            } else {
                return fallBack()
            }
            await state.update({ reintento: 0 })




            return gotoFlow(flowMenu)
        })

export const flowNovedadRouter = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)
        if (!novedad.Fecha) {
            return gotoFlow(flowNovedadFecha)
        } else if (!novedad.Hora) {
            return gotoFlow(flowNovedadHora)
        } else if (!(novedad.ClienteId && novedad.ClienteElementoDependienteId)) {
            return gotoFlow(flowNovedadCodObjetivo)
        } else if (!novedad.Tipo) {
            return gotoFlow(flowNovedadTipo)
        } else if (!novedad.Descripcion) {
            return gotoFlow(flowNovedadDescrip)
        } else if (!novedad.Accion) {
            return gotoFlow(flowNovedadAccion)
        } else
            return gotoFlow(flowNovedad)
    })

export const flowNovedadRecibirDocs = addKeyword(EVENTS.MEDIA)
    .addAnswer("📎 Envíame un documento, foto o video:", { capture: true }, async (ctx, { gotoFlow, state, fallBack, provider }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)

        const localPath = await provider.saveFile(ctx, { path: `${dirtmp}` })
        let array = localPath.split('\\')

        const tempfilename = array[array.length - 1]
        let mimetype = null
        if (ctx.message.documentMessage) {
            mimetype = ctx.message.documentMessage.mimetype
        } else if (ctx.message.imageMessage) {
            mimetype = ctx.message.imageMessage.mimetype
        } else if (ctx.message.videoMessage) {
            mimetype = ctx.message.videoMessage.mimetype
        }

        const file = { mimetype: ctx.message.documentMessage.mimetype, doctipo_id: 'NOV', tableForSearch: 'Documento', tempfilename }

        novedad.file = file
        await novedadController.saveNovedad(personalId, novedad)
        return gotoFlow(flowNovedad)
    });

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

function parseFecha(fecha: string): string {
    const date: Date = new Date(fecha)
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
}
