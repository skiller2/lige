import { impuestosAfipController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'

const { addKeyword } = BotWhatsapp



const flowMonotributo = addKeyword(['1','monotributo', 'mono', 'm'])
    .addAction(async (_, { flowDynamic, state }) => {
        await flowDynamic([{body:`⏱️ Dame un momento`}])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const cuit = myState.cuit
        const respuesta = await impuestosAfipController.downloadComprobante(personalId)
        // console.log(respuesta);
        await flowDynamic([{ media:respuesta, delay:500 }]) 
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

export default flowMonotributo