import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMonotributo from './flowMonotributo.ts'
import flowRecibo from './flowRecibo.ts'
import flowRemoveTel from './flowRemoveTel.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { reset, stop } from "./flowIdle.ts";
import { botServer } from "../index.ts";
import flowInformacionPersonal from "./flowInformacionPersonal.ts";
import flowInformacionEmpresa from "./flowInformacionEmpresa.ts";
import { flowDescargaDocs } from "./flowDescargaDocs.ts";
import { flowNovedad, flowNovedadPendiente } from "./flowNovedad.ts";

const delay = chatBotController.getDelay()

const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Ingrese el número del tema a consultar',
        '1- *Monotributo*',
        '2- *Recibo de Retiro*',
        '3- *Información Personal*',
        '4- *Información Cooperativa*',
        '5- *Documentación pendiente*',
        '6- *Informar novedad*',
        `7 - *Novedades pendientes por ver*`,
        '9- *Desvincular teléfono*',
        // '3- *Pedido de Licencia*',
        // '4- *Envío de Constancia médica*'
        '0- Si no desea consultar nada más'
    ],
        { capture: true, delay },
        async (ctx, { fallBack, gotoFlow, state }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const tema = parseInt(ctx.body)

            switch (tema) {
                case 1:
                    return gotoFlow(flowMonotributo)
                    break;
                case 2:
                    return gotoFlow(flowRecibo)
                    break;
                case 3:
                    return gotoFlow(flowInformacionPersonal)
                    break;
                case 4:
                    return gotoFlow(flowInformacionEmpresa)
                    break;
                case 5:
                    return gotoFlow(flowDescargaDocs)
                    break;
                case 6:
                    return gotoFlow(flowNovedad)
                    break;
                case 7:
                    return gotoFlow(flowNovedadPendiente)
                    break;
                case 9:
                    return gotoFlow(flowRemoveTel)
                    break;
                case 0:
                    stop(ctx,gotoFlow, state)
                    break;
                default:
                    return fallBack()
                    break;
            }

        })

export default flowMenu