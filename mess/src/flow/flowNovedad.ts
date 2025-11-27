import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController, novedadController, objetivoController } from "../controller/controller.module.ts";
import { reset, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import { ChatBotController } from '../controller/chatbot.controller.ts';
import { ObjetivoController } from '../controller/objetivo.controller.ts';
import { existsSync, mkdirSync } from "fs";
import { FileUploadController } from '../controller/file-upload.controller.ts';
import { Utils } from '../controller/util.ts';

const delay = chatBotController.getDelay()
const apiPath = (process.env.URL_API) ? process.env.URL_API : "http://localhost:4200/mess/api"

const dirtmp = `${process.env.PATH_DOCUMENTS}/temp`;
if (!existsSync(dirtmp)) {
    mkdirSync(dirtmp, { recursive: true });
}

export const flowNovedad = addKeyword(utils.setEvent('EVENT_NOVEDAD'))
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedad = await novedadController.getBackupNovedad(personalId)
        if (!novedad.files)
            novedad.files = []

        if (Object.keys(novedad).length === 0) {
            return gotoFlow(flowNovedadFecha)
        }
        await flowDynamic([
            `Novedad:\n` +
            `1 - Fecha: ${novedad.Fecha ? parseFecha(novedad.Fecha) : 's/d'}\n` +
            `2 - Hora: ${novedad.Hora ?? 's/d'}\n` +
            `3 - Objetivo: ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad.Descripcion ?? ''}\n` +
            `4 - Tipo: ${novedad.Tipo?.Descripcion ?? 's/d'}\n` +
            `5 - Descripción: ${novedad.Descripcion ?? 's/d'}\n` +
            `6 - Acción: ${novedad.Accion ?? 's/d'}`,

            `A - Adjuntar documento/foto/video (cargados: ${novedad.files.length})\n` +
            `C - Limpiar campos\n` +
            `E - Enviar al responsable\n` +
            `M - Menú`
        ]
            , { delay: delay })
    })
    .addAnswer([],
        { capture: true, delay },
        async (ctx, { flowDynamic, fallBack, gotoFlow, state }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

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

export const flowNovedadCodObjetivo = addKeyword(EVENTS.ACTION)
    .addAnswer(['Ingrese el código del objetivo donde se produjo el hecho', 'M - Volver al menú',], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const CodObjetivo = ctx.body
            const personalId = state.get('personalId')

            const res = await objetivoController.getObjetivoByCodObjetivo(CodObjetivo)
            if (!res.length) {
                const reintento = state.get('reintento') ?? 0
                if (reintento > 3) {
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    return stop(ctx, gotoFlow, state)
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
        await flowDynamic([`${concatOptionsTipo} \n\n M - Volver al menú`], { delay: delay })
        novedad.OptionsTipo = res
        await novedadController.saveNovedad(personalId, novedad)

        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

    })
    .addAnswer(['Ingrese el número del tipo de situación'], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

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
                    return stop(ctx, gotoFlow, state)
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
    .addAnswer(['Describa la acción tomada', 'M - Volver al menú',], { capture: true, delay },
        async (ctx, { state, gotoFlow, fallBack }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

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
        async (ctx, { state, gotoFlow, fallBack }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

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
        'Ingrese la hora en la cual se produjo el hecho, en formato 24hs (hh:mm)',
        'H - Ingresar Hora actual',
        'M - Volver al menú',
    ], { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

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
                    return stop(ctx, gotoFlow, state)
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
            if (ctx?.type == 'dispatch')
                return fallBack()

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
                    return stop(ctx, gotoFlow, state)
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
    .addAnswer('Desea notificar al responsable? (Si/No)', { capture: true, delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const personalId = state.get('personalId')
            const novedad = await novedadController.getBackupNovedad(personalId)
            const telefono = ctx.from
            try {
                if (Utils.isOKResponse(ctx.body)) {
                    const novedadId = await novedadController.addNovedad(novedad, telefono, personalId)
                    novedad.novedadId = novedadId
                    novedad.telefonoOrigen = telefono
                    novedad.personalId = personalId

                    if (!novedad.files)
                        novedad.files = []

                    for (const doc of novedad.files) {
                        const resdoc: any = await FileUploadController.handleDOCUpload(null, null, null, null, new Date(novedad.Fecha), null, novedadId.toString(), null, null, doc, 'bot', '::1')
                        await novedadController.addRelNovedadDoc(novedadId, resdoc.doc_id, new Date())
                    }

                    await novedadController.sendMsgResponsable(novedad)

                    if (!process.env.PERSONALID_TEST)
                        await novedadController.saveNovedad(personalId, {})

                    await flowDynamic([`Enviado con éxito.`], { delay: delay })
                } else {
                    return gotoFlow(flowNovedad)
                }
                await state.update({ reintento: 0 })
                return gotoFlow(flowMenu)

            } catch (error) {
                console.log('error', error)
                await flowDynamic([`Ocurrio un error enviando la novedad al responsable. Informe al administrador del sistema.`], { delay: delay })
                return gotoFlow(flowMenu)

            }

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
    .addAnswer(["📎 Envíame un documento, foto o video", 'M - Volver al menú de novedad'], { capture: true },
        async (ctx, { gotoFlow, state, fallBack, provider, flowDynamic }) => {

            if (ctx?.type == 'dispatch') return fallBack()
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowNovedad)

            const personalId = state.get('personalId')
            const novedad = await novedadController.getBackupNovedad(personalId)

            try {
                // Descargar archivo
                const localPath = await provider.saveFile(ctx, { path: dirtmp })
                const tempfilename = localPath.split('\\').pop()

                // Obtener metadata usando la función helper
                const { mimetype, filename, mediaId } = Utils.getFileData(ctx)

                if (!mimetype) {
                    await flowDynamic(["No se pudo identificar el tipo de archivo."])
                    return gotoFlow(flowNovedad)
                }

                // Validar tipo usando la función helper
                if (!Utils.isValidFileType(mimetype)) {
                    const reintento = state.get('reintento') ?? 0
                    if (reintento > 3) {
                        await flowDynamic(`Demasiados reintentos, el archivo no es válido (Tipo: ${mimetype}).`, { delay: delay })
                        return gotoFlow(flowNovedad)
                    }
                    await state.update({ reintento: reintento + 1 })
                    return fallBack('Error validando el formato del archivo, reintente')
                }

                // Crear documento usando la función helper
                const doc = {
                    mimetype: mimetype,
                    doctipo_id: 'NOV',
                    tableForSearch: 'Documento',
                    tempfilename,
                    filename
                }

                if (!novedad.files) novedad.files = []
                novedad.files.push(doc)

                await novedadController.saveNovedad(personalId, novedad)
                await state.update({ reintento: 0 })
                await flowDynamic(["✅ Archivo recibido correctamente."])

            } catch (error) {
                console.log(error)
                await flowDynamic(["❌ Error al procesar el archivo."])
            }

            return gotoFlow(flowNovedad)
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

function parseFecha(fecha: string): string {
    const date: Date = new Date(fecha)
    return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
}

function parseHora(fecha: string): string {
    const date: Date = new Date(fecha)
    return date.getHours() + ':' + ((date.getMinutes() < 10) ? ('0' + date.getMinutes()) : date.getMinutes())
}


//Novedades pendientes por ver

export const flowNovedadPendiente = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedades = await novedadController.getNovedadesByResponsable(personalId)
        if (!novedades.length) {
            await flowDynamic([`No tienes ninguna novedad pendiente por ver`], { delay: delay })
            return gotoFlow(flowMenu)
        }

        let msg: string = 'Ingrese el número de la novedad a consultar:\n'
        novedades.forEach((nov: any, i: any) => {
            msg += `${nov.id} - Nov. #${nov.NovedadCodigo} - ${nov.Fecha ? parseFecha(nov.Fecha) : 's/d'} - ${(nov.ClienteId && nov.ClienteElementoDependienteId) ? (nov.ClienteId + '/' + nov.ClienteElementoDependienteId) : 's/d'} ${nov.ObjDescripcion ?? ''} \n`
        })
        msg += '\nM - Volver al menú'

        await flowDynamic(msg, { delay: delay })

        state.update({ novedades })
    })
    .addAnswer('', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            const novedades = state.get('novedades')
            const personalId = state.get('personalId')
            const index = ctx.body

            if (isNaN(index) || (parseInt(index) > novedades.length) || (parseInt(index) < 0)) {
                return fallBack()
            }

            try {
                const novedad = novedades.find((nov: any) => { return nov.id == index })
                state.update({ NovedadCodigo: novedad.NovedadCodigo })

                flowDynamic(
                    `*Novedad:*\n` +
                    `- Fecha: ${novedad.Fecha ? parseFecha(novedad.Fecha) : 's/d'}\n` +
                    `- Hora: ${novedad.Fecha ? parseHora(novedad.Fecha) : 's/d'}\n` +
                    `- Objetivo: ${(novedad.ClienteId && novedad.ClienteElementoDependienteId) ? (novedad.ClienteId + '/' + novedad.ClienteElementoDependienteId) : 's/d'} ${novedad.ObjDescripcion ?? ''}\n` +
                    `- Tipo: ${novedad.TipoDescripcion ?? 's/d'}\n` +
                    `- Descripción: ${novedad.Descripcion ?? 's/d'}\n` +
                    `- Acción: ${novedad.Accion ?? 's/d'}\n\n` +
                    `- Registrado por: ${novedad.PersonalFullName ?? 's/d'}\n` +
                    `- Teléfono: ${novedad.Telefono ?? 's/d'}\n\n` +
                    `- Documentos adjuntos: ${novedad.CantDocRelacionados}\n`
                    , { delay: delay })

                await novedadController.setNovedadVisualizacion(novedad.NovedadCodigo, ctx.from, personalId)

            } catch (error) {
                console.log('Error --->', error)
                await flowDynamic([`Ocurrio un error al mostrar la novedad. Informe al administrador del sistema. Redirigiendo al menú ...`], { delay: delay })
                return gotoFlow(flowMenu)
            }


        }
    )
    .addAnswer(['C - Consultar Documentos relacionados\nL - Volver al listado de novedades\nM - Volver al menú'], { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            if (String(ctx.body).toLowerCase() == 'm') {
                const MyState = state.getMyState()
                delete MyState.novedades
                delete MyState.NovedadCodigo
                state.update(MyState)
                return gotoFlow(flowMenu)
            }
            if (String(ctx.body).toLowerCase() == 'l') {
                const MyState = state.getMyState()
                delete MyState.novedades
                delete MyState.NovedadCodigo
                state.update(MyState)
                return gotoFlow(flowNovedadPendiente)
            }
            if (String(ctx.body).toLowerCase() != 'c') return fallBack()

            const NovedadCodigo = state.get('NovedadCodigo')
            const docsNov: any[] = await novedadController.getDocumentosByNovedadCodigo(NovedadCodigo)
            const PersonalId = await state.get('personalId')

            try {
                for (let index = 0; index < docsNov.length; index++) {
                    const documento = docsNov[index]

                    const urlDoc = `${apiPath}/documentos/download/${documento.DocumentoId}/${documento.DocumentoNombreArchivo}`;

                    await flowDynamic([{ body: `Novedad ${NovedadCodigo}, documento ${index + 1}/${docsNov.length}`, media: urlDoc, delay }])
                    await chatBotController.addToDocLog(documento.DocumentoId, ctx.from, PersonalId)
                }
                return gotoFlow(flowNovedadPendiente)
            } catch (error) {
                console.log('Error descargando Archivo', error)
                await flowDynamic([{ body: `El documento no se encuentra disponible, reintente mas tarde`, delay }])
                return gotoFlow(flowMenu)
            }
        }
    )


export const flowConsNovedadPendiente = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const personalId = state.get('personalId')
        const novedades = await novedadController.getNovedadesByResponsable(personalId)
        if (!novedades.length) {
            //await flowDynamic([`No tienes ninguna novedad pendiente por ver`], { delay: delay })
            return gotoFlow(flowMenu)
        }

        let msg: string = 'Existen novedades pendientes de visualización. ¿Desea verlas? (Si/No)\n'
        await flowDynamic(msg, { delay: delay })
    })
    .addAnswer('', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const respSINO = ctx.body
            if (Utils.isOKResponse(ctx.body)) return gotoFlow(flowNovedadPendiente)
            return gotoFlow(flowMenu)
        }
    )

export const flowProactivoNovedad = addKeyword(utils.setEvent("CONSULTA_NOVEDADES"))
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        const currState = state.getMyState()
        if (currState)
            return endFlow()

        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from

        const { activo, stateData, PersonalSituacionRevistaSituacionId, firstName, codigo } = await personalController.getPersonaState(telefono)
        await state.update(stateData)

        if (!activo)
            return stopSilence(ctx, gotoFlow, state, endFlow)
    })
    .addAnswer('¿Desea ver las novedades? (Si/No)', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            if (Utils.isOKResponse(ctx.body)) return gotoFlow(flowNovedadPendiente)

            return stop(ctx, gotoFlow, state)
        }
    )