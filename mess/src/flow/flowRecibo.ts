import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { documentosController } from "../controller/controller.module.ts";
import { chatBotController } from "../controller/controller.module.ts";
import { botServer } from "../index.ts";
import { reset, stop } from "./flowIdle.ts";

const delay = chatBotController.getDelay()

const flowRecibo = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Buscando recibos`, delay }])
        const myState = state.getMyState()
        console.log('myState', myState)
        const personalId = myState.personalId
        const periodosArray: any[] = await documentosController.getLastPeriodoOfComprobantes(personalId, 3).then(array => { return array })
        let resPeriodos = ''
        if (periodosArray && periodosArray?.length) {
            periodosArray.forEach((obj: any, index: number) => {
                const today = new Date(obj.anio, obj.mes - 1, 1);
                const month = today.toLocaleString('default', { month: 'short' });
                resPeriodos += `${index + 1}- *${month.toUpperCase()}/${obj.anio}*\n`
            })
        } else {
            await flowDynamic([{ body: `No hay comprobantes`, delay }])
            return gotoFlow(flowMenu)
        }
        await state.update({ recibo: { periodosArray, periodosString: resPeriodos } })
    })
    .addAction({ delay }, async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const resPeriodos = myState.recibo.periodosString
        await flowDynamic([{ body: resPeriodos }])
        await flowDynamic([{ body: 'Ingrese el número del período que desea descargar' }])
    })
    .addAction({ capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const myState = state.getMyState()
            const periodosArray: any[] = myState.recibo.periodosArray
            const msj = ctx.body
            if (parseInt(msj) < 1 || Number.isNaN(parseInt(msj)) || parseInt(msj) > periodosArray.length) {
                return fallBack('El numero ingresado no aparece en la lista  📝\nIngrese otro')
            }
            const mes = periodosArray[parseInt(msj) - 1]?.mes
            const anio = periodosArray[parseInt(msj) - 1]?.anio
            const personalId = myState.personalId
            try {
                const urlDocRecibo = await documentosController.getURLDocumento(personalId, anio, mes, 'REC')
                await flowDynamic([{ body: `Recibo`, media: urlDocRecibo.URL, delay }])
                await chatBotController.addToDocLog(urlDocRecibo.doc_id, ctx.from)
            } catch (error) {
                await flowDynamic([{ body: `El documento no se encuentra disponible, reintente mas tarde`, delay }])                
            }
        }
    )
    .addAnswer([
        '¿Desea consultar algo mas?',
        'Responda "Si" o "No"'
    ], { capture: true, delay },
        async (ctx, { gotoFlow, fallBack, state }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            const myState = state.getMyState()
            delete myState.recibo
            await state.update(myState)
            const respuesta = ctx.body

            return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)
        }, [])

export default flowRecibo