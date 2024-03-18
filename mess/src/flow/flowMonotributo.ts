import { impuestosAfipController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'
import { ClientException } from "src/controller/base.controller";

const { addKeyword } = BotWhatsapp

const flowMonotributo = addKeyword(['1','monotributo', 'mono', 'm'])
    // .addAction(async (_, { flowDynamic, state }) => {
    //     await flowDynamic([{body:`⏱️ Dame un momento`}])
    //     const myState = state.getMyState()
    //     const personalId = myState.personalId
    //     const cuit = myState.cuit
    //     const monotributoPdf : any = await impuestosAfipController.downloadComprobante(personalId).then((data:any) => {return data})
    //     // console.log('monotributoPdf -->', monotributoPdf);
    //     if (monotributoPdf instanceof ClientException)
    //         await flowDynamic([{body:`Error. Avisé al administrador`, delay:500}])
    //     else
    //         await flowDynamic([{ media:monotributoPdf, delay:500 }]) 
    // })
    .addAction(async (_, { flowDynamic, state ,gotoFlow }) => {
        await flowDynamic([{ body:`⏱️ Dame un momento`, delay: 500 }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const periodosArray : any[] = await impuestosAfipController.getLastPeriodosOfComprobantes(personalId, 3).then(array =>{return array})
        console.log('periodos', periodosArray);
        let resPeriodos = ''
        if (periodosArray.length) {
            periodosArray.forEach((obj : any) => {
                if (obj.mes < 10) 
                    resPeriodos += `0${obj.mes}/${obj.anio}\n`
                else
                    resPeriodos += `${obj.mes}/${obj.anio}\n`
            })
        } else {
            await flowDynamic([{ body:`No hay comprobantes`, delay: 500 }])
            return gotoFlow(flowMenu)
        }
        
        await state.update({recibo:{ periodosArray, periodosString: resPeriodos }}) 
    })
    .addAnswer('Ingrese una fecha (MM/AAAA) de la lista 📝',
    { delay: 500 },
    async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const resPeriodos = myState.recibo.periodosString
        await flowDynamic([{ body: resPeriodos}])
    })
    .addAction({ capture: true, delay: 500 },
    async (ctx, { flowDynamic, state, fallBack }) => {
        const myState = state.getMyState()
        const periodosArray : any[] = myState.recibo.periodosArray
        const msj = ctx.body
        const regex = /^(0[1-9]|1[0-2])\/(19|20)\d{2}$/
        if (!regex.test(msj)) {
            return fallBack('Ingrese el periodo con el formato MM/AAAA \nEj: 8/2023')
        }
        const date = msj.split('/')
        const mes = parseInt(date[0])
        const anio = parseInt(date[1])
        const obj = periodosArray.filter(( obj: any) => {
            return (obj.anio == anio && obj.mes == mes)
        })
        if (!obj.length)
            return fallBack('La fecha ingresada no aparece en la lista\nIngrese una fecha de la lista')
        const personalId = myState.personalId
        // await flowDynamic([{ body:`⏱️ Dame un momento`, delay: 500 }])
        const monotributoPdf = await impuestosAfipController.downloadComprobante(personalId, anio, mes).then(data => { return data })
        // console.log('reciboPdf -->', monotributoPdf);
        if (monotributoPdf instanceof ClientException)
            await flowDynamic([{ body:`Error. Avisé al administrador`, delay: 500 }])
        else
            await flowDynamic([ { media: monotributoPdf, delay: 500 } ]) 
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay: 500 },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowMonotributo