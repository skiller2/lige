import { personalController } from "../controller/controller.module";
import { addKeyword } from "@builderbot/bot";
import flowEnd from './flowEnd'
import { chatBotController } from "../controller/controller.module";

const delay = chatBotController.getDelay()

const flowRemoveTel = addKeyword(['9', 'remover'])
    .addAction(async (ctx, {flowDynamic, state, endFlow }) => {
        await flowDynamic([{ body: `⏱️ Dame un momento`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const telefono = ctx.from

        const res = await personalController.delTelefonoPersona(telefono)
        state.clear()
        return endFlow('Hasta la próxima')

    })

export default flowRemoveTel