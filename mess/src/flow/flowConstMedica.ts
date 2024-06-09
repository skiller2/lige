import { addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import flowEnd from './flowEnd'
import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowConstMedica = addKeyword(['4','constancia','constancia médica','constancia medica'])
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

export default flowConstMedica