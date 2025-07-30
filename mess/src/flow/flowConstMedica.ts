import { addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";

const delay = chatBotController.getDelay()

const flowConstMedica = addKeyword(['4','constancia','constancia médica','constancia medica'])
    .addAnswer([
        '¿Desea consultar algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay: delay },  
    async (ctx , { gotoFlow, fallBack }) => {
        const respuesta = ctx.body
        if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
            return gotoFlow(flowMenu)
        } else if (respuesta != 'no' && respuesta != 'No') {
            return fallBack()
        }
    }, [])

export default flowConstMedica