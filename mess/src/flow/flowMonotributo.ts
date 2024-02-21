import { personalController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'

const { addKeyword } = BotWhatsapp



const flowMonotributo = addKeyword(['1','monotributo', 'mono', 'm'])
    .addAction(async (_, { flowDynamic, state }) => {
        const myState = state.getMyState()
        const fecha = new Date
        const personalId = myState.personalId
        const anio = fecha.getFullYear()
        const mes = fecha.getMonth()+1
        const cuit = myState.cuit
        const respuesta = await personalController.downloadComprobanteLink(personalId, cuit, anio, mes)
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

export default flowMonotributo