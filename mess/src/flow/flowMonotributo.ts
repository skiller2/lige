import { impuestosAfipController } from "../controller/controller.module";
import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'
import { ClientException } from "src/controller/base.controller";
import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowMonotributo = addKeyword(EVENTS.ACTION)
    // .addAction(async (_, { flowDynamic, state }) => {
    //     await flowDynamic([{body:`⏱️ Dame un momento`}])
    //     const myState = state.getMyState()
    //     const personalId = myState.personalId
    //     const cuit = myState.cuit
    //     const monotributoPdf : any = await impuestosAfipController.downloadComprobante(personalId).then((data:any) => {return data})
    //     // console.log('monotributoPdf -->', monotributoPdf);
    //     if (monotributoPdf instanceof ClientException)
    //         await flowDynamic([{body:`Error. Avisé al administrador`, delay:delay}])
    //     else
    //         await flowDynamic([{ media:monotributoPdf, delay:delay }]) 
    // })
    .addAction(async (_, { flowDynamic, state ,gotoFlow }) => {
        await flowDynamic([{ body:`⏱️ Dame un momento`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const periodosArray : any[] = await impuestosAfipController.getLastPeriodosOfComprobantes(personalId, 3).then(array =>{return array})
        // console.log('periodos', periodosArray);
        let resPeriodos = ''
        if (periodosArray.length) {
            periodosArray.forEach((obj : any, index: number) => {
                if (obj.mes < 10) 
                    resPeriodos += `${index+1}- *0${obj.mes}/${obj.anio}*\n`
                else
                    resPeriodos += `${index+1}- *${obj.mes}/${obj.anio}*\n`
            })
        } else {
            await flowDynamic([{ body:`No hay comprobantes`, delay }])
            return gotoFlow(flowMenu)
        }
        
        await state.update({recibo:{ periodosArray, periodosString: resPeriodos }}) 
    })
    .addAnswer('Ingrese el numero correspondiente a una fecha de la lista 📝',
    { delay },
    async (_, { flowDynamic, state }) => {
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
        const monotributoPdf = await impuestosAfipController.downloadComprobante(personalId, anio, mes).then(data => { return data })
        // console.log('reciboPdf -->', monotributoPdf);
        if (monotributoPdf instanceof ClientException)
            await flowDynamic([{ body:`Error. Avisé al administrador`, delay }])
        else
            await flowDynamic([ { body:'Monotributo', media: monotributoPdf, delay } ]) 
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay },  
    async (ctx , { gotoFlow, fallBack, state }) => {
        let myState = state.getMyState()
        delete myState.recibo
        await state.update(myState)
        console.log('state.getMyState()', state.getMyState());
        
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowMonotributo