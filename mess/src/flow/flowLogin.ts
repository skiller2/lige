import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu'
import { chatBotController, personalController } from "../controller/controller.module";
import flowEnd from './flowEnd';

const delay = chatBotController.getDelay()


export const flowValidateCode = addKeyword(utils.setEvent("REGISTRO_FINAL"))
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => { 

    })
    .addAnswer([`Ingrese el código proporcionado durante la verificación de DNI`], { capture: true,delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            const telefono = ctx.from
            const res = await personalController.getPersonalfromTelefonoQuery(telefono)
            if (res.length) {
                await state.update({ personalId: res[0].personalId })
                await state.update({ cuit: res[0].cuit })
                await state.update({ codigo: res[0].codigo })
                await state.update({ name: res[0].name.trim() })
            }    
            const data = state.getMyState()

            if (data?.codigo == ctx.body) {
                await flowDynamic(`identidad verificada`, { delay: delay })
                personalController.removeCode(telefono)
                return gotoFlow(flowMenu)
            } else {
                const reintento = (data.reintento)?data.reintento:0
                if (reintento > 3) {
                    const res = await personalController.delTelefonoPersona(telefono)
                    return endFlow('Demasiados reintentos, hasta la próxima')
                }

                await state.update({ reintento: reintento + 1 })    
                return fallBack('Código ingresado incorrecto, reintente')
            }
        })


export const flowLogin = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, {  state, gotoFlow, flowDynamic }) => {
        const telefono = ctx.from
        await flowDynamic(`Bienvenido al área de consultas de la Cooperativa Lince Seguridad`, { delay: delay })
        const res = await personalController.getPersonalfromTelefonoQuery(telefono)
        if (res.length) {
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })

            if (res[0].codigo) {
                //Código pendiente de ingreso
                return gotoFlow(flowValidateCode)
            } else {
                return gotoFlow(flowMenu)
            }

        }
    })
    .addAnswer('El teléfono ingresado no lo pude localizar.  Desea registrarlo?', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            const telefono = ctx.from
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const ret = await personalController.genTelCode(telefono)
                await flowDynamic(`Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${encodeURIComponent(ret.encTelNro)}`, { delay: delay })
//                await flowDynamic(`E`, { delay: delay })
                await state.update({ encTelNro: ret.encTelNro })
                return endFlow()
            } else {
                return endFlow(`Hasta la próxima`)
            }

        })
