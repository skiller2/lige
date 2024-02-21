import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import { personalController } from "../controller/controller.module";

const { addKeyword, EVENTS } = BotWhatsapp

// const flowMonotributo = addKeyword(['1','monotributo', 'mono', 'm'])
//     .addAnswer('Fin del flujo')
//     .addAnswer(['¿Desea consulta algo mas?', 'Responda SI o NO'], null, null, [flowEnd])

// const flowReciboDeRetiro = addKeyword(['2','recibo de retiro', 'recibo', 'retiro'])
//     .addAction(async (ctx, { flowDynamic, state }) => {
//         const myState = state.getMyState()
//         await flowDynamic(`Estado de recibo de ${myState.name}:  Pendiente`)
//         await flowDynamic(`Fin del flujo`)
//         }
//     )

// const flowPedidosDeLicencia = addKeyword(['3', 'pedidos de licencia', 'pedido de licencia', 'pedido', 'licencia', ])
//     .addAnswer('Area en mantenimiento')
//     .addAnswer(
//         'Fin del flujo', 
//         { capture: false }, 
//         async (ctx, { flowDynamic, gotoFlow }) => {
//             await flowDynamic(`Yendo al menu`)
//             gotoFlow(flowMenu)
//         })

// const flowConstanciasMédicas = addKeyword(['4', 'constancias médicas', 'constancias medicas', 'constancia médica', 'constancias médica', 'constancia']).addAnswer(
//     ['Fin del flujo']
// )

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAnswer('Hola y bienvenido al área de consultas de Lince Seguridad')
    // .addAnswer('Esta área es solo para empleados, si usted no pertenece a Lince Seguridad le recomendamos que ignore este chat')
    .addAnswer('¿Cual es tu nombre?', 
    { capture: true }, 
    async (ctx, { flowDynamic, state, fallBack }) => {
        const name = ctx.body
        if (name.length <= 2) {
            return fallBack()
        }
        await state.update({ name: ctx.body })
        return await flowDynamic(`Gracias por tu nombre! ${ctx.body}`)
    })
    .addAnswer('¿Cual es tu CUIT?', 
    { capture: true },  
    async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
        const cuit = ctx.body
        if (cuit.length != 11) {
            return fallBack(`El CUIT solo puede tener 11 digitos`)
        }
        await flowDynamic(`⏱️ Dame un momento`)
        const res = await personalController.searchQuery(cuit)
        if (res.length != 1) {
            return fallBack(`CUIT no identificado`)
        }
        await state.update({ personalId: res[0].PersonalId })
        await state.update({ cuit: ctx.body })
        await flowDynamic(`Gracias por tu CUIT! ${ctx.body}`)
        return gotoFlow(flowMenu)
    })
    // .addAnswer('¿Cuanto fue el valor de tu ultimo deposito?', 
    // { capture: true },  
    // async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
    //     const deposito = parseFloat(ctx.body)
    //     const myState = state.getMyState()
    //     await flowDynamic(`⏱️ Dame un momento`)
    //     const res = await personalController.getUltDeposito(myState.personalId)
    //     if (res.length = 0) {
    //         return gotoFlow(flowMenu)
    //     }
    //     const ultDeposito = res[0].importe
    //     if (deposito < ultDeposito - 1 && deposito > ultDeposito + 1 ) {
    //         await flowDynamic(`Valor incorrecto`)
    //         return fallBack()
    //     }
    //     return gotoFlow(flowMenu)
    // })

export default BotWhatsapp.createFlow(
    [
        flowPrincipal,
        flowMenu
    ]
)