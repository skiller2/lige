import { recibosController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'

const { addKeyword } = BotWhatsapp

const flowRecibo = addKeyword(['2','recibo de retiro', 'recibo', 'r'])
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic([{body:`⏱️ Dame un momento`}])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const date = new Date();
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const pdf = await recibosController.downloadComprobantesByPeriodo(personalId, month, year)
        await flowDynamic([ { media: pdf, delay: 500 } ]) 
    })
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay: 500 },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowRecibo