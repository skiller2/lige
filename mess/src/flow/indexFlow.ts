import BotWhatsapp from '@bot-whatsapp/bot'
import flowLogin from './flowLogin'
import flowMenu from './flowMenu'

export default BotWhatsapp.createFlow(
    [
        flowLogin,
        flowMenu,
    ]
)