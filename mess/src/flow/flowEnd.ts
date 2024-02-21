import BotWhatsapp from '@bot-whatsapp/bot'

const { addKeyword } = BotWhatsapp

const flowEnd = addKeyword(['no'])
    .addAction(async (_, { flowDynamic, endFlow, state }) => {
        await state.clear()
        await flowDynamic(['Gracias por su tiempo',' Hasta luego 👋'])
        return endFlow()
    })

export default flowEnd