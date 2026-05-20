import { documentosController } from "../controller/controller.module.ts";
import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { botServer } from "../index.ts";
import { reset, stop } from "./flowIdle.ts";
import { getConnection } from "../data-source.ts";

const delay = chatBotController.getDelay()

const flowMonotributo = addKeyword(EVENTS.ACTION)
    // .addAction(async (_, { flowDynamic, state }) => {
    //     await flowDynamic([{body:`⏱️ Dame un momento`}])
    //     const myState = state.getMyState()
    //     const personalId = myState.personalId
    //     const cuit = myState.cuit
    //     const monotributoPdf : any = await impuestosAfipController.downloadComprobante(personalId).then((data:any) => {return data})
    //      
    //     if (monotributoPdf instanceof ClientException)
    //         await flowDynamic([{body:`Error. Avisé al administrador`, delay:delay}])
    //     else
    //         await flowDynamic([{ media:monotributoPdf, delay:delay }]) 
    // })
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Buscando comprobantes`, delay }])
        const myState = state.getMyState()
        const queryRunner = await getConnection('bot')
        const personalId = myState.personalId
        const periodosArray: any[] = await documentosController.getLastPeriodosOfComprobantesAFIP(personalId, 3,queryRunner).then(array => { return array })
         
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
    .addAction(async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const resPeriodos = myState.recibo.periodosString
        await flowDynamic([{ body: resPeriodos }])
        await flowDynamic([{ body: 'Ingrese el número correspondiente al período listado 📝' }])

    })
    .addAction({ capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const queryRunner= await getConnection('bot')

            const myState = state.getMyState()
            const periodosArray: any[] = myState.recibo.periodosArray
            const msj = ctx.body
            if (parseInt(msj) < 1 || Number.isNaN(parseInt(msj)) || parseInt(msj) > periodosArray?.length) {
                return fallBack('El numero ingresado no aparece en la lista  📝\nIngrese otro')
            }
            const mes = periodosArray[parseInt(msj) - 1]?.mes
            const anio = periodosArray[parseInt(msj) - 1]?.anio
            const PersonalId = await state.get('personalId')


            try {
                const urlDoc = await documentosController.getURLDocumento(PersonalId, anio, mes, 'MONOT',queryRunner)
                await flowDynamic([{ body: `Monotributo`, media: urlDoc.URL, delay }])
                await chatBotController.addToDocLog(urlDoc.doc_id, ctx.from,PersonalId)
            } catch (error) {
                console.log(error)
                await flowDynamic([{ body: `El documento no se encuentra disponible, reintente mas tarde`, delay }])
            }
        })
    .addAnswer([
        '¿Desea consultar algo mas?',
        'Responda "Si" o "No"'
    ], { capture: true, delay },
        async (ctx, { gotoFlow, fallBack, state }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            let myState = state.getMyState()
            delete myState.recibo
            await state.update(myState)
            console.log('state.getMyState()', state.getMyState());

            const respuesta = ctx.body
            return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)

        }, [])

export default flowMonotributo