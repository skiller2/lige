import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { reset, stop } from "./flowIdle.ts";
import { botServer } from "../index.ts";
import { PersonalController } from "../controller/personal.controller.ts";

const delay = chatBotController.getDelay()
const personalController = new PersonalController()

const flowInformacionEmpresa = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const infoEmpresa = personalController.getInfoEmpresa()
        await flowDynamic([{ body: infoEmpresa , delay}])

    })

    .addAction(async (ctx, { flowDynamic,gotoFlow }) => {
        await flowDynamic('¿Alguna otra consulta?\n("si" o "no")', { delay: delay * 3})
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
    })
    .addAction({ capture: true }, async (ctx, { gotoFlow, state,fallBack }): Promise<void> => {
            if (ctx?.type == 'dispatch')
                return fallBack()

        const respuesta = ctx.body
        return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)
    })

export default flowInformacionEmpresa
