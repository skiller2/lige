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

        const { maxImporte, minImporte, fechaLimite, maxCantAdelantos } = PersonalController.getAdelantoLimits(actual)


        const adelantos = await PersonalController.getPersonalAdelanto(personalId, anio, mes)
        await state.update({ adelanto: { anio, mes, maxImporte, minImporte } })

        if (actual > fechaLimite) {
            const limitTime = `${fechaLimite.getHours().toString().padStart(2, '0')}:${fechaLimite.getMinutes().toString().padStart(2, '0')}`
            await flowDynamic([{ body: `⏳ *Período cerrado:* No es posible solicitar ni modificar adelantos en este momento.\n\nLas solicitudes se reciben hasta las *${limitTime} hs* del día *${fechaLimite.getDate()}* de cada mes.`, delay }])
            for (const adelanto of adelantos) {
                await flowDynamic([{ body: `📝 Registramos que ya tienes un adelanto de *$${adelanto.PersonalPrestamoMonto.toLocaleString('es-AR')}* para el período *${adelanto.PersonalPrestamoAplicaEl}*.`, delay }])
            }
            return gotoFlow(flowMenu)
        }

        await flowDynamic([{ body: `⏱️ Verificando estado y montos`, delay }])

        if (adelantos.length == 0) {
            await state.update({ adelanto: { anio, mes, maxImporte, minImporte } })
            await flowDynamic([{ body: `ℹ️ No hemos encontrado solicitudes de adelanto para este período.`, delay }])
            return gotoFlow(flowFormAdelanto)
        } else {
            const adelanto = adelantos[adelantos.length - 1]   //Leo el último adelanto

            await flowDynamic([{ body: `💳 Ya tienes una solicitud de adelanto por *$${adelanto.PersonalPrestamoMonto.toLocaleString('es-AR')}* para el período *${adelanto.PersonalPrestamoAplicaEl}*\n(Fecha solicitado: ${adelanto.PersonalPrestamoAudFechaIng?.toLocaleDateString()}).`, delay }])
            switch (adelanto.PersonalPrestamoAprobado) {
                case 'N':
                    await flowDynamic([{ body: `❌ Tu solicitud ha sido rechazada. No se puede solicitar un nuevo adelanto.`, delay }])
                    if (adelantos.length >= maxCantAdelantos)
                        return gotoFlow(flowMenu)
                    else
                        return gotoFlow(flowFormAdelanto)
                    break;
                case 'S':
                    console.log('adelanto', adelanto)
                    await flowDynamic([{ body: `✅ Tu solicitud ya ha sido confirmada (Código: ${adelanto.PersonalId}/${adelanto.PersonalPrestamoId}).`, delay }])
                    if (adelantos.length >= maxCantAdelantos) {
                        await flowDynamic([{ body: `📊 Has alcanzado el límite máximo de ${maxCantAdelantos} adelantos permitidos. No puedes solicitar más por ahora.`, delay }])
                        return gotoFlow(flowMenu)
                    }
                    else
                        return gotoFlow(flowFormAdelanto)
                    break;
                case 'A':
                    await flowDynamic([{ body: `🚫 Tu solicitud ha sido anulada (Código: ${adelanto.PersonalId}/${adelanto.PersonalPrestamoId}). No puedes solicitar un nuevo adelanto.`, delay }])
                    if (adelantos.length >= maxCantAdelantos)
                        return gotoFlow(flowMenu)
                    else
                        return gotoFlow(flowFormAdelanto)
                    break;
                default:
                    await state.update({ adelanto: { anio, mes, maxImporte, minImporte, ...adelanto } })
                    await flowDynamic([{ body: `🔄 Tu solicitud aún no ha sido confirmada. ¿Deseas modificar el monto? (*Si/No*)`, delay }])
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
        const { maxImporte } = PersonalController.getAdelantoLimits(new Date())

        let msg = `Ingresa el importe del adelanto`
        if (myState.adelanto.PersonalPrestamoMonto) msg += ` o 0 para anularlo`

        let helpText = `(Límite máximo: *$${maxImporte.toLocaleString('es-AR')}*)`
        if (myState.adelanto.PersonalPrestamoMonto) helpText += `\n\n💡 _Ingresa *0* si deseas anular la solicitud actual._`

        await flowDynamic([{ body: `💰 *${msg}* ${helpText}\n\n*M* - Volver al menú`, delay }])
    })
    .addAnswer('', { capture: true, delay },
        async (ctx, { flowDynamic, state, fallBack, gotoFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)

            const myState: any = state.getMyState()


            const cleanedImporte = String(ctx.body).replace(/[\$\.\s]/g, '').replace(',', '.');
            const importe: number = parseFloat(cleanedImporte)

            if (String(ctx.body).toLowerCase() == 'm') return gotoFlow(flowMenu)

            // Validar que cleanedImporte solo contenga dígitos y opcionalmente un punto decimal
            if (!/^\d+(\.\d+)?$/.test(cleanedImporte)) {
                return fallBack('El valor ingresado contiene caracteres no válidos. Ingrese solo números, reintente.')
            }

            const { maxImporte, minImporte } = PersonalController.getAdelantoLimits(new Date())
            const anio: number = myState.adelanto.anio
            const mes: number = myState.adelanto.mes
            const personalId = myState.personalId

            if (isNaN(importe)) return fallBack('El valor ingresado no es válido, reintente.')

            if (importe > maxImporte || importe < 0) return fallBack(`El importe debe ser menor o igual a $${maxImporte.toLocaleString('es-AR')}, reintente.`)
            if (importe < minImporte && importe != 0) return fallBack(`El importe mínimo es de $${minImporte.toLocaleString('es-AR')}, reintente.`)

            try {
                if (importe == 0) {
                    await personalController.deletePersonalAdelanto(personalId, anio, mes)
                    await flowDynamic([`🗑️ La solicitud de adelanto para el período *${mes}/${anio}* ha sido eliminada correctamente.`], { delay: delay })
                } else {
                    await personalController.setPersonalAdelanto(personalId, anio, mes, importe)
                    await flowDynamic([`✅ ¡Listo! Tu solicitud de adelanto por *$${importe.toLocaleString('es-AR')}* para el período *${mes}/${anio}* ha sido registrada exitosamente.`], { delay: delay })
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