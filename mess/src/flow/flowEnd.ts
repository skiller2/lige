import BotWhatsapp from '@bot-whatsapp/bot'

const { addKeyword } = BotWhatsapp

const flowEnd = addKeyword(['no'])
    .addAnswer(['Gracias por su tiempo',' Hasta luego 👋'], 
    {delay: 500},
    async (_, { endFlow, state }) => {
        await state.clear()
        return endFlow()
    })

export default flowEnd