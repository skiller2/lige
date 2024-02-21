import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'

const { addKeyword, EVENTS } = BotWhatsapp

// const flowEnd = addKeyword(['no'])
//     .addAnswer('Gracias por su tiempo y hasta luego')

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
    { capture: true, idle: 1000}, 
    async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
        const name = ctx.body
        if (name.length <= 2) {
            return fallBack()
        }
        await state.update({ name: ctx.body })
        return await flowDynamic(`Gracias por tu nombre! ${ctx.body}`)
    })
    .addAnswer(['Te vamos a pedir tu datos personales','¿Cual es tu CUIT?'], 
    { capture: true, idle: 1000},  
    async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
        const cuit = ctx.body
        if (cuit.length != 11) {
            return fallBack(`El CUIT solo puede tiener 11 digitos`)
        }
        await flowDynamic(`⏱️ Dame un momento`)
        // const res 
        // if (res.length != 1) {
        //     return fallBack(`CUIT no identificado`)
        // }
        // await state.update({ personalId: res[0].PersonalId })
        await state.update({ cuil: ctx.body })
        await flowDynamic(`Gracias por tu CUIT! ${ctx.body}`)
        return gotoFlow(flowMenu)
    })

export default BotWhatsapp.createFlow(
    [
        flowPrincipal,
        flowMenu
    ]
)