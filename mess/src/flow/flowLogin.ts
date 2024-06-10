import { addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu'
import { chatBotController, personalController } from "../controller/controller.module";
import flowEnd from './flowEnd';

const delay = chatBotController.getDelay()


export const flowValidateCode = addKeyword("REGISTRO_FINAL")
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => { 

    })
    .addAnswer([`Ingrese el código proporcionado durante la verificación de DNI`], { capture: true,delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            const data = state.getMyState()
            const telefono = ctx.from

            if (data.codigo == ctx.body) {
                await flowDynamic(`identidad verificada`, { delay: delay })
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
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        const telefono = ctx.from
//        console.log('state', state.getMyState());
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
                await flowDynamic(`Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=${ret.encTelNro}`, { delay: delay })
//                await flowDynamic(`E`, { delay: delay })
                await state.update({ encTelNro: ret.encTelNro })
                return endFlow()
            } else {
                return endFlow(`Hasta la próxima`)
            }

        })
    /*
    .addAnswer('¿Cual es tu CUIT?',
        { capture: true, delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
            const cuit = ctx.body
            if (cuit.length != 11) {
                return fallBack(`El CUIT solo puede tener 11 digitos\n¿Cual es tu CUIT?`)
            }
            // await flowDynamic([{body:`⏱️ Dame un momento`}])
            const res = await personalController.searchQuery(Number(cuit))
            if (res.length != 1) {
                return fallBack(`CUIT no identificado\n¿Cual es tu CUIT?`)
            }
            await flowDynamic(`Gracias por tu CUIT! ${ctx.body}`)
            await state.update({ personalId: res[0].PersonalId })
            await state.update({ cuit: ctx.body })
        })
    .addAnswer('¿Cuánto fue el importe de tu último deposito realizado?',
        { capture: true, delay: delay },
        async (ctx, { state, gotoFlow, fallBack, flowDynamic, endFlow }) => {
            const tempInput = String(ctx.body).replace(/\,|\./gi, '')
            const deposito = (Number(tempInput)) ? Number(tempInput) / 100 : 0
            const myState = state.getMyState()
            console.log('myState', myState)
            const personalId = myState.personalId
            const telefono = ctx.from

            if (deposito < 1000) {
                return endFlow(`El importe ingresado no es correcto`)
            }

            await flowDynamic([{ body: `Valor ingresado ${deposito} \n⏱️ Dame un momento` }])
            const res = await personalController.getUltDepositoQuery(personalId)


            if (res.length == 0) {

                return endFlow(`No se puede verificar la información en este momento.  Debe comunicarse con personal`)
            }
            const ultDeposito = res[0].importe

            if (deposito < ultDeposito - 1 || deposito > ultDeposito + 1) {
                return fallBack(`Valor ${deposito} incorrecto\n¿Cuanto fue el importe de tu ultimo deposito?`)
            }
            await personalController.checkTelefonoPersonal(personalId, telefono, 'Bot', '')
            return gotoFlow(flowMenu)
        })
*/
//export default [flowLogin,flowValidateCode]