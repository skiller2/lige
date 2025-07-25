import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu.ts'
import { chatBotController, personalController } from "../controller/controller.module.ts";
import { reset, start, stop, stopSilence } from './flowIdle.ts';
import { botServer } from '../index.ts';
import flowRemoveTel from './flowRemoveTel.ts';
import { flowDescargaDocs } from './flowDescargaDocs.ts';

const delay = chatBotController.getDelay()
const linkVigenciaHs = (process.env.LINK_VIGENCIA)? Number(process.env.LINK_VIGENCIA):3

export const flowIncidente = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        const telefono = ctx.from
        const res = await personalController.getPersonalQuery(telefono,0)
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
        if (res.length) {
            if (![2, 9, 23, 12, 10, 16, 28, 18, 26, 11, 20, 22].includes(res[0].PersonalSituacionRevistaSituacionId)) {
                await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio`, { delay: delay })
                stop(ctx, gotoFlow, state)
                return
            }
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })
        }
    })
    .addAnswer([`Ingrese el código del objetivo donde se produjo el hecho`], { capture: true, delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const data = state.getMyState()
            
            await state.update({ CodObjetivo: ctx.body })


            if (data?.codigo == ctx.body) {
                await flowDynamic(`Identidad verificada existosamente`, { delay: delay })
                personalController.removeCode(telefono)
                return gotoFlow(flowMenu)
            } else {
                const reintento = (data.reintento)?data.reintento:0
                if (reintento > 3) {
                    const res = await personalController.delTelefonoPersona(telefono)
                    await flowDynamic(`Demasiados reintentos`, { delay: delay })
                    stop(ctx,gotoFlow, state)
                    return
                }

                await state.update({ reintento: reintento + 1 })    
                return fallBack('Código ingresado incorrecto, reintente')
            }
        })

export const flowLogin = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        start(ctx, gotoFlow, botServer.globalTimeOutMs)

        const telefono = ctx.from
        await flowDynamic(`🙌 Bienvenido al área de consultas de la Cooperativa Lince Seguridad`, { delay: delay })
        const res = await personalController.getPersonalQuery(telefono,0)

        //force
        if (process.env.PERSONALID_TEST) {
            res.length = 0
            res.push({ cuit: '20300000001', codigo: '', PersonalSituacionRevistaSituacionId: 2, personalId: process.env.PERSONALID_TEST, name: 'Prueba probador' })
        }

        if (res.length) {
            if (![2,9,23,12,10,16,28,18,26,11,20,22].includes(res[0].PersonalSituacionRevistaSituacionId)) { 
                await flowDynamic(`No se encuentra dentro de una situación de revista habilitada para realizar operaciones por este medio ${res[0].PersonalSituacionRevistaSituacionId}`, { delay: delay })
                stop(ctx, gotoFlow, state)
                return
            }
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })

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

            const fistName = res[0].name.trim().split(" ")[0].trim();
            if (fistName)
                await flowDynamic(`${mensaje} ${fistName.charAt(0).toUpperCase() + fistName.slice(1).toLowerCase()}`, { delay: delay })

            if (res[0].codigo) {
                //Código pendiente de ingreso
//                return gotoFlow(flowValidateCode)
            } else {
//                return gotoFlow(flowMenu)
                return gotoFlow(flowDescargaDocs)
            }

        }
    })
    .addAnswer('El teléfono ingresado no lo pude localizar.  Desea registrarlo (Si/No)?', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            reset(ctx, gotoFlow, botServer.globalTimeOutMs)
            const telefono = ctx.from
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const ret = await personalController.genTelCode(telefono)
                await flowDynamic(`Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${encodeURIComponent(ret.encTelNro)}`, { delay: delay })
                await flowDynamic(`Recuerda el enlace tiene una vigencia de ${linkVigenciaHs} horas, pasado este tiempo vuelve a saludarme para que te entrege uno nuevo`, { delay: delay })
                await state.update({ encTelNro: ret.encTelNro })
                stopSilence(ctx,gotoFlow, state)
                return endFlow()
            } else {
                stop(ctx,gotoFlow, state)
            }

        })
