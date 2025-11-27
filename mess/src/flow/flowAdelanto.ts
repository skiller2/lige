import { addKeyword, EVENTS } from "@builderbot/bot";
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController } from "../controller/controller.module.ts";
import { reset, stop } from "./flowIdle.ts";
import { PersonalController } from "../controller/personal.controller.ts";
import { botServer } from "../index.ts";
import { Utils } from '../controller/util.ts';

const delay = chatBotController.getDelay()

export const flowAdelanto = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        const myState = state.getMyState()
        const personalId = myState.personalId
        const actual = new Date()
        const anio = actual.getFullYear()
        const mes = actual.getMonth() + 1
        const maxImporte = 100000
        const fechaLimite = new Date(actual.getFullYear(), actual.getMonth(), 18, 23, 59, 59); // 23:59 del día 18 del mes actual

        const adelanto = await PersonalController.getPersonalAdelanto(personalId, anio, mes)
        await state.update({ adelanto: { anio, mes, maxImporte } })

        if (actual > fechaLimite) {
            await flowDynamic([{ body: `⏳ No es posible solicitar, ni modificar adelantos. Dicha solicitud se puede hacer hasta las ${fechaLimite.getHours()}:${fechaLimite.getMinutes()} hs del día ${fechaLimite.getDate()} del mes actual.`, delay }])
            if (adelanto.length > 0) await flowDynamic([{ body: `Ya posee un adelanto solicitado de $${adelanto[0].PersonalPrestamoMonto.toLocaleString('es-AR')} para el período ${adelanto[0].PersonalPrestamoAplicaEl}`, delay }])
            return gotoFlow(flowMenu)
        }

        await flowDynamic([{ body: `⏱️ Verificando estado y montos`, delay }])

        if (adelanto.length == 0) {
            await state.update({ adelanto: { anio, mes, maxImporte } })
            await flowDynamic([{ body: `Aun no se ha solicitado un adelanto.`, delay }])
            return gotoFlow(flowFormAdelanto)
        } else {
            await flowDynamic([{ body: `Ya posee un adelanto solicitado de $${adelanto[0].PersonalPrestamoMonto.toLocaleString('es-AR')}`, delay }])
            switch (adelanto[0].PersonalPrestamoAprobado) {
                case 'N':
                    await flowDynamic([{ body: `Ha sido rechazado. No se puede solicitar un nuevo adelanto.`, delay }])
                    return gotoFlow(flowMenu)
                    break;
                case 'S':
                    await flowDynamic([{ body: `Ya ha sido confirmado. No se puede solicitar un nuevo adelanto.`, delay }])
                    return gotoFlow(flowMenu)
                    break;
                case 'A':
                    await flowDynamic([{ body: `Ha sido anulado. No puede solicitar un nuevo adelanto.`, delay }])
                    return gotoFlow(flowMenu)
                    break;
                default:
                    await state.update({ adelanto: { anio, mes, maxImporte, ...adelanto[0] } })
                    await flowDynamic([{ body: `No ha sido confirmado aún. ¿Desea modificarlo? (Si/No)`, delay }])
                    break;
            }

        }
    })
    .addAnswer('', { capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            if (Utils.isOKResponse(ctx.body)) {
                return gotoFlow(flowFormAdelanto)
            }

            const myState: any = state.getMyState()
            delete myState.adelanto
            state.update(myState)

            return gotoFlow(flowMenu)
        })

export const flowFormAdelanto = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        const myState = state.getMyState()
        const maxImporte = myState.adelanto.maxImporte

        let msg = `Ingrese el importe del adelanto`
        if (myState.adelanto.PersonalPrestamoMonto) msg += ` o 0 para anularlo`

        await flowDynamic([{ body: `${msg} (importe maximo: ${maxImporte})\n\nM - Volver al menú`, delay }])
    })
    .addAnswer('', { capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const myState: any = state.getMyState()


            const cleanedImporte = String(ctx.body).replace(/\./g, '').replace(',', '.');
            const importe: number = parseFloat(cleanedImporte)
            const maxImporte: number = myState.adelanto.maxImporte
            const anio: number = myState.adelanto.anio
            const mes: number = myState.adelanto.mes
            const personalId = myState.personalId

            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            if (isNaN(importe)) return fallBack('El valor ingresado no es válido, reintente.')

            if (importe > maxImporte || importe < 0) return fallBack(`El importe debe ser menor o igual a ${maxImporte}, reintente.`)

            try {
                if (importe == 0) {
                    await personalController.deletePersonalAdelanto(personalId, anio, mes)
                    await flowDynamic([`Se ha eliminado la solicitud de adelanto.`], { delay: delay })
                } else {
                    await personalController.setPersonalAdelanto(personalId, anio, mes, importe)
                    await flowDynamic([`Solicitud de adelanto agregada.`], { delay: delay })
                }
            } catch (error) {
                console.log('error', error)
                await flowDynamic([`Ocurrio un error. Informe al administrador del sistema.`], { delay: delay })
                return gotoFlow(flowMenu)
            }

            delete myState.adelanto
            state.update(myState)

            return gotoFlow(flowMenu)
        })

//export default flowAdelanto