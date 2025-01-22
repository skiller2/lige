import { impuestosAfipController } from "../controller/controller.module";
import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import { chatBotController } from "../controller/controller.module";
import { botServer } from "../index";
import { reset } from "./flowIdle";

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
        await flowDynamic([{ body:`⏱️ Buscando comprobantes`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const periodosArray : any[] = await impuestosAfipController.getLastPeriodosOfComprobantes(personalId, 3).then(array =>{return array})
        // console.log('periodos', periodosArray);
        let resPeriodos = ''
        if (periodosArray.length) {
            periodosArray.forEach((obj: any, index: number) => {
                const today = new Date(obj.anio,obj.mes-1,1);
                const month = today.toLocaleString('default', { month: 'short' });
                resPeriodos += `${index+1}- *${month.toUpperCase()}/${obj.anio}*\n`
            })
        } else {
            await flowDynamic([{ body:`No hay comprobantes`, delay }])
            return gotoFlow(flowMenu)
        }
        
        await state.update({recibo:{ periodosArray, periodosString: resPeriodos }}) 
    })
    .addAction(async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const resPeriodos = myState.recibo.periodosString
        await flowDynamic([{ body: resPeriodos }])
        await flowDynamic([{ body: 'Ingrese el número correspondiente a una fecha de la lista 📝'}])

    })
    .addAction({ capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
        reset(ctx,gotoFlow,botServer.globalTimeOutMs)

        const myState = state.getMyState()
        const periodosArray : any[] = myState.recibo.periodosArray
        const msj = ctx.body
        if (parseInt(msj)<1 || Number.isNaN(parseInt(msj)) || parseInt(msj) > periodosArray.length ) {
            return fallBack('El numero ingresado no aparece en la lista  📝\nIngrese otro')
        }
        const mes = periodosArray[parseInt(msj)-1]?.mes
        const anio = periodosArray[parseInt(msj)-1]?.anio
        const personalId = myState.personalId
        // await flowDynamic([{ body:`⏱️ Dame un momento`, delay: delay }])
        const urlDoc = await impuestosAfipController.getURLDocComprobante(personalId, anio, mes)

        if (urlDoc instanceof Error)
            await flowDynamic([{ body:`Error, no se encontró el documento`, delay }])
        else
                await flowDynamic([{ body: `Recibo`, media: urlDoc, delay }])
        //TODO Escribir en la base la descarga del archivo
        //    
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay },  
        async (ctx, { gotoFlow, fallBack, state }) => {
        reset(ctx,gotoFlow,botServer.globalTimeOutMs)

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
    }, [])

export default flowMonotributo