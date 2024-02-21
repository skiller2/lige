import { personalController } from "../controller/controller.module";
import BotWhatsapp from '@bot-whatsapp/bot'
import flowMenu from './flowMenu'

const { addKeyword, EVENTS } = BotWhatsapp

const flowEnd = addKeyword(['no'])
    .addAnswer('Gracias por su tiempo y hasta luego')

const flowMonotributo = addKeyword(['1','monotributo', 'mono', 'm'])
    .addAnswer('Fin del flujo')
    .addAnswer([
        '¿Desea consulta algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, idle: 1000},  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'No') {
            return fallBack()
        }
    }, [flowEnd])

export default flowMonotributo