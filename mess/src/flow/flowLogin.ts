import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController } from "../controller/controller.module.ts";
import { reset, start, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import flowRemoveTel from './flowRemoveTel.ts';
import { flowDescargaDocs } from './flowDescargaDocs.ts';

const delay = chatBotController.getDelay()
const linkVigenciaHs = (process.env.LINK_VIGENCIA) ? Number(process.env.LINK_VIGENCIA) : 3

export const flowValidateCode = addKeyword(utils.setEvent("REGISTRO_FINAL"))
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
    })
    .addAnswer([`Ingrese el código proporcionado en la página web 'Validación de Identidad', en caso de desconocerlo ingrese 0 para ir al inicio`], { capture: true, delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const telefono = ctx.from

            const { activo, stateData, PersonalSituacionRevistaSituacionId, firstName, codigo } = await personalController.getPersonaState(telefono)
            await state.update(stateData)

            if (!activo) {
                await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio ${PersonalSituacionRevistaSituacionId}`, { delay: delay })
                return stop(ctx, gotoFlow, state)
            }

            const data = state.getMyState()

            if (ctx.body == '0') {
                return gotoFlow(flowRemoveTel)
            }

            if (data?.codigo == ctx.body) {
                await flowDynamic(`Identidad verificada existosamente`, { delay: delay })
                personalController.removeCode(telefono)
                return gotoFlow(flowMenu)
            } else {
                const reintento = (data.reintento) ? data.reintento : 0
                if (reintento > 3) {
                    const res = await personalController.delTelefonoPersona(telefono)
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    return stop(ctx, gotoFlow, state)
                }

                await state.update({ reintento: reintento + 1 })
                return fallBack('Código ingresado incorrecto, reintente')
            }
        })

export const flowLogin = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic, endFlow }) => {
        //FIX por si entra 2 veces, ignora la segunda
        const currState = state.getMyState()
        if (currState?.flowLogin == 1)
            return endFlow()

        await state.update({ flowLogin: 1 })

        start(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from
        await flowDynamic(`🙌 Bienvenido al área de consultas de la Cooperativa Lince Seguridad`, { delay: delay })

        const { activo, stateData, PersonalSituacionRevistaSituacionId, firstName, codigo } = await personalController.getPersonaState(telefono)
        await state.update(stateData)

        if (!activo) {
            await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio ${PersonalSituacionRevistaSituacionId}`, { delay: delay })
            return stop(ctx, gotoFlow, state)
        }

        const ahora = new Date();
        const horas = ahora.getHours();
        let mensaje = "";

        if (horas >= 5 && horas < 12) {
            mensaje = "Buen día";
        } else if (horas >= 12 && horas < 20) {
            mensaje = "Buenas tardes";
        } else {
            mensaje = "Buenas noches";
        }

        if (firstName)
            await flowDynamic(`${mensaje} ${firstName}`, { delay: delay })

        await state.update({ flowLogin: 0 })
        if (codigo)
            return gotoFlow(flowValidateCode)

        return gotoFlow(flowDescargaDocs)

    })
    .addAnswer('El teléfono ingresado no lo pude localizar.  Desea registrarlo (Si/No)?', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            if (ctx?.type == 'dispatch')
                return fallBack()

            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const telefono = ctx.from
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const ret = await personalController.genTelCode(telefono)
                await flowDynamic(`Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${encodeURIComponent(ret.encTelNro)}`, { delay: delay })
                await flowDynamic(`Recuerda el enlace tiene una vigencia de ${linkVigenciaHs} horas, pasado este tiempo vuelve a saludarme para que te entrege uno nuevo`, { delay: delay })
                await state.update({ encTelNro: ret.encTelNro })
                return stopSilence(ctx, gotoFlow, state, endFlow)
                
            } else {
                return stop(ctx, gotoFlow, state)
            }

        })
