import { addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'

import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowLicencia = addKeyword(['3','licencia'])
    .addAnswer([
        '¿Desea consultar algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [])

export default flowLicencia