import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMonotributo from './flowMonotributo'
import flowRecibo from './flowRecibo'
import flowRemoveTel from './flowRemoveTel'
import { chatBotController } from "../controller/controller.module";
import { reset, stop } from "./flowIdle";
import { botServer } from "src";

const delay = chatBotController.getDelay()

const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Ingrese el número del tema a consultar',
        '1- *Monotributo*',
        '2- *Recibo de Retiro*',
        '9- *Desvincular teléfono*',
        // '3- *Pedido de Licencia*',
        // '4- *Envío de Constancia médica*'
        '0- Si no desea consultar nada más'
    ],
        { capture: true, delay },
        async (ctx, { fallBack, gotoFlow, state }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const tema = parseInt(ctx.body)

            switch (tema) {
                case 1:
                    return gotoFlow(flowMonotributo)
                    break;
                case 2:
                    return gotoFlow(flowRecibo)
                    break;
                case 9:
                    return gotoFlow(flowRemoveTel)
                    break;
                case 0:
                    stop(ctx, state)
                    break;
                default:
                    return fallBack()
                    break;
            }

        })

export default flowMenu