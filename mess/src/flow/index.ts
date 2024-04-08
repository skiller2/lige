import BotWhatsapp from '@bot-whatsapp/bot'
import flowLogin from './flowLogin'
import flowMenu from './flowMenu'
import flowLicencia from './flowLicencia'

export default BotWhatsapp.createFlow(
    [
        flowLogin,
        flowMenu,
    ]
)