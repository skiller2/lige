import { chatBotController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'

const { addKeyword } = BotWhatsapp
const delay = chatBotController.getDelay() || 500

const flowEnd = addKeyword(['no', '0'])
    .addAnswer(['Gracias por su tiempo',' Hasta luego 👋'], 
    {delay: delay},
    async (_, { endFlow, state }) => {
        await state.clear()
        return endFlow()
    })

export default flowEnd