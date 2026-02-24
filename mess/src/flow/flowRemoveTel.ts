import { personalController } from "../controller/controller.module.ts";
import { EVENTS, addKeyword } from "@builderbot/bot";
import { chatBotController } from "../controller/controller.module.ts";
import { stop, reset } from "./flowIdle.ts";
import { Utils } from '../controller/util.ts';
import flowMenu from './flowMenu.ts'

const delay = chatBotController.getDelay()

const flowRemoveTel = addKeyword(EVENTS.ACTION)
.addAnswer('¿Desea desvincular el telefono? (Si/No)', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()
            // reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            if (!Utils.isOKResponse(ctx.body)) return gotoFlow(flowMenu)
        }
    )
    .addAction(async (ctx, {flowDynamic, state,gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Un momento.`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const telefono = ctx.from

        const res = await personalController.delTelefonoPersona(telefono)
        return stop(ctx,gotoFlow, state)
    })

export default flowRemoveTel