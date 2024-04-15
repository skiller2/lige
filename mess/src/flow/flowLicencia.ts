// import { botController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'

const { addKeyword } = BotWhatsapp
const delay = 500

const flowLicencia = addKeyword(['3','licencia'])
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay: delay },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowLicencia