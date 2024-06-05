import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMonotributo from './flowMonotributo'
import flowRecibo from './flowRecibo'
import flowConstMedica from './flowConstMedica'
import flowEnd from './flowEnd'
import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Ingrese el numero del tema a consultar',
        '1- *Monotributo*',
        '2- *Recibo de Retiro*',
        // '3- *Pedido de Licencia*',
        // '4- *Envío de Constancia médica*'
        '0- Si no desea consultar nada más'
    ], 
    { capture: true , delay }, 
    async (ctx, { fallBack }) => {
        const tema = parseInt(ctx.body)
        if (tema<0 || tema>2) {
            return fallBack()
        }
    }, [flowMonotributo, flowRecibo, flowConstMedica, flowEnd])

export default flowMenu