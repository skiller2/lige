import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'
import { recibosController } from "../controller/controller.module";
import { ClientException } from "src/controller/base.controller";
import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowRecibo = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body:`⏱️ Buscando recibos`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const periodosArray : any[] = await recibosController.getLastPeriodoOfComprobantes(personalId, 3).then(array =>{return array})
        console.log('periodos', periodosArray);
        let resPeriodos = ''
        if (periodosArray.length) {
            periodosArray.forEach((obj : any, index:number) => {
                if (obj.mes < 10) 
                    resPeriodos += `${index+1}- *${obj.mes}/${obj.anio}*\n`
                else
                    resPeriodos += `${index+1}- *${obj.mes}/${obj.anio}*\n`
            })
        } else {
            await flowDynamic([{ body:`No hay comprobantes`, delay }])
            return gotoFlow(flowMenu)
        }
        await state.update({recibo:{ periodosArray, periodosString: resPeriodos }}) 
    })
    .addAnswer('Ingrese el numero correspondiente al periodo del Recibo que deseas consultar:',
    { delay }, async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const resPeriodos = myState.recibo.periodosString
        await flowDynamic([{ body: resPeriodos}])
    })
    .addAction({ capture: true, delay },
    async (ctx, { flowDynamic, state, fallBack }) => {
        const myState = state.getMyState()
        const periodosArray : any[] = myState.recibo.periodosArray
        const msj = ctx.body
        if (parseInt(msj) > periodosArray.length) {
            return fallBack('El numero ingresado no aparece en la lista  📝\nIngrese otro')
        }
        const mes = periodosArray[parseInt(msj)-1].mes
        const anio = periodosArray[parseInt(msj)-1].anio
        const personalId = myState.personalId
        // await flowDynamic([{ body:`⏱️ Dame un momento`, delay: delay }])
        const urlDocRecibo = await recibosController.getURLDocRecibo(personalId, anio, mes)

        console.log('reciboPdf',urlDocRecibo)
        if (urlDocRecibo instanceof Error)
            await flowDynamic([{ body:`Error, no se encontró el recibo correspondiente`, delay }])
        else
            await flowDynamic([ { body:`Recibo`, media:urlDocRecibo } ]) 
//            await flowDynamic([ { body:`Rec`, media:"https://i.imgur.com/0HpzsEm.png" } ]) 
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay },  
    async (ctx , { gotoFlow, fallBack, state }) => {
        let myState = state.getMyState()
        delete myState.recibo
        await state.update(myState)
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowRecibo