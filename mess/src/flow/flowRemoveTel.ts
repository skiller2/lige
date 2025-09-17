import { personalController } from "../controller/controller.module.ts";
import { EVENTS, addKeyword } from "@builderbot/bot";
import { chatBotController } from "../controller/controller.module.ts";
import { stop } from "./flowIdle.ts";

const delay = chatBotController.getDelay()

const flowRemoveTel = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        try {
            await flowDynamic([{ body: `⏱️ Un momento.`, delay }])
            const myState = state.getMyState()
            const personalId = myState.personalId
            const telefono = ctx.from

            const res = await personalController.delTelefonoPersona(telefono)
            return stop(ctx, gotoFlow, state)

        } catch (error) {
            console.log(error)
            await flowDynamic(`Ocurrió un error. Por favor, escriba "hola" para iniciar un nuevo chat.`, { delay: delay })
            return stop(ctx, gotoFlow, state)
        }
    })

export default flowRemoveTel