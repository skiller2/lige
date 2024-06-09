import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import flowMenu from './flowMenu'
import { chatBotController, personalController } from "../controller/controller.module";
import flowMonotributo from './flowMonotributo';
import flowRecibo from './flowRecibo';
import flowEnd from './flowEnd';

//const { addKeyword, EVENTS } = ChatBot

const delay = chatBotController.getDelay()

// const flowPedidosDeLicencia = addKeyword(['3', 'pedidos de licencia', 'pedido de licencia', 'pedido', 'licencia', ])
//     .addAnswer('Area en mantenimiento')
//     .addAnswer(
//         'Fin del flujo',
//         { capture: false },
//         async (ctx, { flowDynamic, gotoFlow }) => {
//             await flowDynamic(`Yendo al menu`)
//             gotoFlow(flowMenu)
//         })

// const flowConstanciasMédicas = addKeyword(['4', 'constancias médicas', 'constancias medicas', 'constancia médica', 'constancias médica', 'constancia']).addAnswer(
//     ['Fin del flujo']
// )


    const flujoUsuariosNORegistrados = addKeyword(utils.setEvent('REGISTER_FLOW'))
    .addAnswer('¿Cual es tu email?',{capture:true},async(ctx, {flowDynamic, gotoFlow}) => {
    
//        const numero = ctx.from
    
        console.log(`registramos en base de datos el numero... ${ctx.body}`)
    
        await flowDynamic(`Ya te registramos..`)
        await gotoFlow(flowMenu)
    })
    


const flowRegister = addKeyword("REGISTRO_FINAL")
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => { 
        console.log('act',state)
        const data = state.getMyState()
        console.log('act', data)

    })
    .addAnswer([`Ingrese el código`], { capture: true,delay: delay },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            console.log('ingrese')

        })
    .addAnswer([`Ya fue`], { capture: false,delay: delay })


    const flowLogin = addKeyword('hola')
    .addAnswer('Bievenido!', null, async (ctx,{gotoFlow}) => {
    
        const numero = ctx.from
        console.log('consultando en base de datos si existe el numero registrado....')
    
        const ifExist = false
        if(ifExist){
            // Si existe lo enviamos al flujo de regostrados..
            gotoFlow(flowEnd)
        }else{
            // Si NO existe lo enviamos al flujo de NO registrados..
            gotoFlow(flujoUsuariosNORegistrados)
        }
    
    })
    


const flowLogin1 = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { state, gotoFlow, flowDynamic }) => {
        const telefono = ctx.from
        console.log('state', state.getMyState());

        const res = await personalController.getPersonalfromTelefonoQuery(telefono)
        if (res.length) {
            await state.update({ personalId: res[0].personalId })
            await state.update({ cuit: res[0].cuit })
            await state.update({ codigo: res[0].codigo })
            await state.update({ name: res[0].name.trim() })


            if (res[0].codigo) {
                //return gotoFlow(flowRegister)
                return gotoFlow(flujoUsuariosNORegistrados)
            }

        } else {
            await flowDynamic(`Bienvenido al área de consultas de Lince Seguridad`, { delay: delay })
        }
    })
    .addAnswer('El teléfono ingresado no se encuentra registrado.  Desea registrarlo?', { delay: delay, capture: true },
        async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
            const telefono = ctx.from
            const respSINO = ctx.body
            if (respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y') {
                const ret = await personalController.genTelCode(telefono)
                await flowDynamic(`Para continuar vaya a https://gestion.linceseguridad.com.ar/ext/init/ident;encTelNro=${ret.encTelNro}`, { delay: delay })

                await state.update({ encTelNro: ret.encTelNro })
            } else {
                return endFlow(`Hasta la próxima`)
            }

        })
    // .addAnswer('¿Cual es tu nombre?', 
    // { capture: true }, 
    // async (ctx, { flowDynamic, state, fallBack }) => {
    //     const name = ctx.body
    //     if (name.length <= 2) {
    //         return fallBack()
    //     }
    //     await state.update({ name: ctx.body })
    //     return await flowDynamic(`Gracias por tu nombre! ${ctx.body}`)
    // })
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

export default [flowLogin,flujoUsuariosNORegistrados]