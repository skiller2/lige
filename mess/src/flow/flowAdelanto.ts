import { addKeyword, EVENTS } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController } from "../controller/controller.module.ts";
import { reset, stop } from "./flowIdle.ts";
import { PersonalController } from "../controller/personal.controller.ts";
import { botServer } from "../index.ts";

const delay = chatBotController.getDelay()

export const flowAdelanto = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Verificando estado y montos`, delay }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const actual = new Date()
        const anio = actual.getFullYear()
        const mes = actual.getMonth() + 1
        const maxImporte = 100000

        await state.update({ adelanto: { anio, mes, maxImporte } })

        const adelanto = await PersonalController.getPersonalAdelanto(personalId, anio, mes)
        if (adelanto.length == 0) {

        } else {
            await flowDynamic([{ body: `Ya posee un adelanto solicitado de pesos ${adelanto[0].PersonalPrestamoMonto}`, delay }])
            if (!adelanto[0].PersonalPrestamoFechaAprobacion)
                await flowDynamic([{ body: `No ha sido confirmado aún.  Quieres modicar el importe? (Si/No)`, delay }])
            else
                return gotoFlow(flowMenu)
        }

    })
    .addAction({ capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()
            const personalControler = new PersonalController()
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const myState = state.getMyState()
            const importe = parseInt(ctx.body)
            const maxImporte = myState.adelanto.maxImporte
            const anio = myState.adelanto.anio
            const mes = myState.adelanto.mes
            const personalId = myState.personalId


            if (importe < 0 || importe > maxImporte) {
                return fallBack('El valor ingresado no es válido')
            }

            await personalControler.setPersonalAdelanto(personalId, anio, mes, importe)
            await flowDynamic([{ body: `Solicitud de adelanto agregada`, delay }])
            return gotoFlow(flowMenu)
        })

//export default flowAdelanto