import BotWhatsapp from '@bot-whatsapp/bot'

const flowEnd = BotWhatsapp.addKeyword(['no'])
    .addAnswer('Gracias por su tiempo y hasta luego')

const flowMonotributo = BotWhatsapp.addKeyword(['monotributo', 'mono', 'm'])
    .addAnswer('Fin del flujo')
    // .addAnswer(['¿Desea consulta algo mas?', 'Responda SI o NO'], null, null, [flowMenu, flowEnd])

const flowReciboDeRetiro = BotWhatsapp.addKeyword(['recibo de retiro', 'recibo', 'retiro'])
    .addAction(async (ctx, { flowDynamic, state }) => {
        const myState = state.getMyState()
        await flowDynamic(`Estado de recibo de ${myState.name}:  Pendiente`)
        await flowDynamic(`Fin del flujo`)
        }
    )

const flowPedidosDeLicencia = BotWhatsapp.addKeyword(['pedidos de licencia', 'pedido', 'licencia', ])
    .addAnswer(
        [
            'Area en mantenimiento',
            'Fin del flujo'
        ],
    )

const flowConstanciasMédicas = BotWhatsapp.addKeyword(['constancias médicas', 'constancias medicas', 'constancia médica', 'constancias médica', 'constancia']).addAnswer(
    ['Fin del flujo']
)
const flowMenu = BotWhatsapp.addKeyword('consultar')
    .addAnswer(`Escribe el tema a consultar`)
    .addAnswer([
        `- *Monotributo*`,
        `- *Recibo de Retiro*`,
        `- *Pedidos de Licencia*`,
        `- *Envío de Constancias médicas*`
    ], null, null, [flowMonotributo, flowReciboDeRetiro, flowPedidosDeLicencia, flowConstanciasMédicas])

const flowPrincipal = BotWhatsapp.addKeyword(['hola', 'alo'])
    .addAnswer(['Buenas! ¿Cual es tu nombre?'])
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow }) => {
        await state.update({ name: ctx.body })
        await flowDynamic(`Gracias por tu nombre! ${ctx.body}`)
    })
    .addAnswer([
        `Escribe el tema a consulta`,
        `- *Monotributo*`,
        `- *Recibo de Retiro*`,
        `- *Pedidos de Licencia*`,
        `- *Envío de Constancias médicas*`
    ]
    ,null,null, [flowMonotributo, flowReciboDeRetiro, flowPedidosDeLicencia, flowConstanciasMédicas])


export default BotWhatsapp.createFlow(
    [
        flowPrincipal
    ]
)