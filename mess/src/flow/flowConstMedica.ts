import { addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { stop } from "./flowIdle.ts";

const delay = chatBotController.getDelay()

const flowConstMedica = addKeyword(['4','constancia','constancia médica','constancia medica'])
    .addAnswer([
        '¿Desea consultar algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay: delay },  
        async (ctx, { gotoFlow, state,fallBack }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()
        
        const respuesta = ctx.body

        return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)

    }, [])

export default flowConstMedica