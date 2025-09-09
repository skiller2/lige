import { addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { stop } from "./flowIdle.ts";

const delay = chatBotController.getDelay()

const flowLicencia = addKeyword(['3','licencia'])
    .addAnswer([
        '¿Desea consultar algo mas?', 
        'Responda "Si" o "No"'
    ], { capture: true, delay },  
    async (ctx , { gotoFlow, state }) => {
        const respuesta = ctx.body

        return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)
    }, [])

export default flowLicencia