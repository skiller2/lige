import { addKeyword, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu'
import { chatBotController, personalController } from "../controller/controller.module";
import { reset, start, stop, stopSilence } from './flowIdle';
import { botServer } from 'src';
import { BaseController } from 'src/controller/base.controller';

const delay = chatBotController.getDelay()
const apiPath = (process.env.URL_API) ? process.env.URL_API : "http://localhost:4200/mess/api"

export const flowDescargaDocs = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const PersonalId = state.get('personalId')
        const docsPend:any[] = await personalController.getDocsPendDescarga(PersonalId)
        await state.update({ docsPend: docsPend })
        if (docsPend.length > 0) {
            let docsPendStr = (docsPend.length==1)?`Existe un documento pendiente de descarga\n`:`Existen ${docsPend.length} documentos pendientes de descarga:\n`
            docsPend.forEach(doc => {
                const periodo =  (doc.anio && doc.mes) ? `${doc.mes}/${doc.anio}` : ''
                docsPendStr += `- ${doc.detalle} ${periodo} Nro. ${doc.den_documento}\n`
            })
            await flowDynamic(docsPendStr, { delay: delay })
            await flowDynamic('Desea descargarlos (Si/No)?', { delay: delay })

        } else {
            await flowDynamic('No posee documentos pendientes de descarga', { delay: delay })
            return gotoFlow(flowMenu)            
        }
    })
    .addAnswer('', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const docsPend = await state.get('docsPend')
                const documento = docsPend.pop()
                
                const urlDoc = `${apiPath}/documentos/download/${documento.doc_id}/${documento.doctipo_id}-${documento.nombre_archivo}`;

                try {
                    await flowDynamic([{ body: documento.detalle, media: urlDoc, delay }])
                    await chatBotController.addToDocLog(documento.doc_id, ctx.from)
                } catch (error) {
                    console.log('Error descargando Archivo',error)
                    await flowDynamic([{ body: `El documento no se encuentra disponible, reintente mas tarde`, delay }])
                    return gotoFlow(flowMenu)

                }

                if (docsPend.length)
                    return fallBack('Desea descargar el siguiente documento de la lista? (Si/No)')
                else {
                    await flowDynamic('Cargando menu general', { delay: delay*3 })
                    return gotoFlow(flowMenu)
                }


            } else {
                stop(ctx, gotoFlow, state)
                return endFlow()
            }
        }
    )
