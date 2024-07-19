import { personalController } from "../controller/controller.module";
import { EVENTS, addKeyword } from "@builderbot/bot";
import { chatBotController } from "../controller/controller.module";
import { stop } from "./flowIdle";

const delay = chatBotController.getDelay()

const flowRemoveTel = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, {flowDynamic, state,gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ un momento`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const telefono = ctx.from

        const res = await personalController.delTelefonoPersona(telefono)
        stop(ctx,gotoFlow, state)
    })

export default flowRemoveTel