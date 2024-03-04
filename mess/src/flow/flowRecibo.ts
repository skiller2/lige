import { recibosController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'

const { addKeyword } = BotWhatsapp



const flowRecibo = addKeyword(['2','recibo de retiro', 'recibo', 'r'])
    .addAction(async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const personalId = myState.personalId
        const respuesta = await recibosController.linkDownloadComprobanteRecibo(personalId)
        await flowDynamic(`📥 Link de descarga 📥`)
        await flowDynamic(respuesta)
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowRecibo