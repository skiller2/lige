import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { botServer } from "../index.ts";
import { reset, stop } from "./flowIdle.ts";
import { PersonalController } from "../controller/personal.controller.ts";
import { Utils } from "../controller/util.ts";

const delay = chatBotController.getDelay()
const personalController = new PersonalController()
const flowInformacionPersonal = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { provider, flowDynamic, state }) => {
        await flowDynamic([{ body: `⏱️ Buscando información ...`, delay: delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId

        
        const info = await personalController.getInfoPersonal(personalId, ctx.from)

        for (const infoLine of info) {
            await flowDynamic([{ body: infoLine, delay }])
        }
    })

    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        await flowDynamic(`¿Alguna otra consulta?\n("si" o "no")`, { delay: delay * 3 })
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
    })
    .addAction({ capture: true }, async (ctx, { gotoFlow, state, fallBack }): Promise<void> => {
        if (ctx?.type == 'dispatch')
            return fallBack()
        const respuesta = ctx.body
        return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)
    })


export default flowInformacionPersonal