import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import { recibosController } from "../controller/controller.module";
import { ClientException } from "src/controller/base.controller";
import { chatBotController } from "../controller/controller.module";
import { botServer } from "src";
import { reset } from "./flowIdle";

const delay = chatBotController.getDelay()

const flowRecibo = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Buscando recibos`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const periodosArray: any[] = await recibosController.getLastPeriodoOfComprobantes(personalId, 3).then(array => { return array })
        let resPeriodos = ''
        if (periodosArray.length) {
            periodosArray.forEach((obj: any, index: number) => {
                const today = new Date(obj.anio,obj.mes-1,1);
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
            // await flowDynamic([{ body:`⏱️ Dame un momento`, delay: delay }])
            const urlDocRecibo = await recibosController.getURLDocRecibo(personalId, anio, mes)

            if (urlDocRecibo instanceof Error)
                await flowDynamic([{ body: `Error, no se encontró el documento`, delay }])
            else
                await flowDynamic([{ body: `Recibo`, media: urlDocRecibo, delay }])
            //            await flowDynamic([ { body:`Rec`, media:"https://i.imgur.com/0HpzsEm.png" } ]) 
        })
    .addAnswer([
        '¿Desea consulta algo mas?',
        'Responda "Si" o "No"'
    ], { capture: true, delay },
        async (ctx, { gotoFlow, fallBack, state }) => {
            let myState = state.getMyState()
            delete myState.recibo
            await state.update(myState)
            const respuesta = ctx.body
            if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
                return gotoFlow(flowMenu)
            } else if (respuesta != 'no' && respuesta != 'No') {
                return fallBack()
            }
        }, [])

export default flowRecibo