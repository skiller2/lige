import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import { personalController } from "../controller/controller.module";

const { addKeyword, EVENTS } = BotWhatsapp

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

const flowLogin = addKeyword(EVENTS.WELCOME)
    .addAction(async(ctx, {state, gotoFlow, flowDynamic}) => {
        const telefono = ctx.from
        const res = await personalController.getPersonalfromTelefonoQuery(telefono)
        if (res.length) {
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ name: res[0].name.trim() })
            await flowDynamic(`Hola ${res[0].name.trim()} y bienvenido al área de consultas de Lince Seguridad`)
            return gotoFlow(flowMenu)
        }
    })
    .addAnswer('Hola y bienvenido al área de consultas de Lince Seguridad', {delay: 500})
    // .addAnswer('¿Cual es tu nombre?', 
    // { capture: true }, 
    // async (ctx, { flowDynamic, state, fallBack }) => {
    //     const name = ctx.body
    //     if (name.length <= 2) {
    //         return fallBack()
    //     }
    //     await state.update({ name: ctx.body })
    //     return await flowDynamic(`Gracias por tu nombre! ${ctx.body}`)
    // })
    .addAnswer('¿Cual es tu CUIT?', 
    { capture: true, delay: 500 },  
    async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
        const cuit = ctx.body
        if (cuit.length != 11) {
            return fallBack(`El CUIT solo puede tener 11 digitos\n¿Cual es tu CUIT?`)
        }
        // await flowDynamic([{body:`⏱️ Dame un momento`}])
        const res = await personalController.searchQuery(cuit)
        if (res.length != 1) {
            return fallBack(`CUIT no identificado\n¿Cual es tu CUIT?`)
        }
        await flowDynamic(`Gracias por tu CUIT! ${ctx.body}`)
        await state.update({ personalId: res[0].PersonalId })
        await state.update({ cuit: ctx.body })
    })
    .addAnswer('¿Cuanto fue el importe de tu ultimo deposito?', 
    { capture: true, delay: 500 },  
    async (ctx, { state, gotoFlow, fallBack }) => {
        const deposito = parseFloat(ctx.body)
        const myState = state.getMyState()
        const personalId = myState.personalId
        const telefono = ctx.from
        // await flowDynamic([{body:`⏱️ Dame un momento`}])
        const res = await personalController.getUltDepositoQuery(personalId)
        console.log(res);
        const ultDeposito = res[0].importe
        if (res.length = 0) {
            return gotoFlow(flowMenu)
        }
        if (deposito < ultDeposito - 1 || deposito > ultDeposito + 1 ) {
            return fallBack(`Valor incorrecto\n¿Cuanto fue el importe de tu ultimo deposito?`)
        }
        await personalController.addTelefonoPersonalQuery(personalId, telefono, 'Bot', '')
        return gotoFlow(flowMenu)
    })

export default flowLogin