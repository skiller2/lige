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
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1

        const infoPersonal = await personalController.getPersonalQuery(ctx.from, personalId)
        const PersonalNroLegajo = infoPersonal[0].PersonalNroLegajo
        const PersonalFechaIngreso = (infoPersonal[0].PersonalFechaIngreso) ? new Date(infoPersonal[0].PersonalFechaIngreso) : null
        //TODO Agregar fecha de ingreso y nro de asociado.
        await provider.vendor.sendPresenceUpdate('composing', ctx.key.remoteJid)
        await Utils.waitT(5000)

        await flowDynamic(`Su número de socio: ${PersonalNroLegajo}`, { delay: delay * 3 })
        await flowDynamic(`Su fecha de ingreso: ${personalController.dateOutputFormat(PersonalFechaIngreso)}`, { delay })
        //await flowDynamic(`Su antigüedad: ${socioNro}`, { delay })

        const sitrevs: any[] = await PersonalController.getPersonalSitRevista(personalId, anio, mes)
        if (sitrevs.length > 0) {
            const sitrev = sitrevs[sitrevs.length - 1]
            //await flowDynamic([{ body: `Su situación de revista: ${sitrev.SituacionRevistaDescripcion.trim()} desde ${personalController.dateOutputFormat(sitrev.PersonalSituacionRevistaDesde)}`, delay }])
            await flowDynamic(`Su situación de revista actual: ${sitrev.SituacionRevistaDescripcion.trim()}`, { delay })
        } else {
            await flowDynamic(`No posee situación de revista aún`, { delay })
        }

        const categs: any[] = await PersonalController.getCategoriasPorPersonaQuery(anio, mes, personalId, 1)
        const catstring: string[] = categs.map(c => ' - ' + c.fullName)

        await provider.vendor.sendPresenceUpdate('composing', ctx.key.remoteJid)


        if (catstring.length == 1)
            catstring.unshift('Su categoría actual es:')
        else if (catstring.length > 1)
            catstring.unshift('Sus categorías actuales son:')
        else
            catstring.unshift('No posee categorías asignadas aún')

        await flowDynamic(catstring.join('\n'), { delay: delay * 2 })


        //        for (const cat of categs) {
        //            await flowDynamic([{ body: `Categoría: ${cat.fullName.trim()} desde ${personalController.dateOutputFormat(cat.PersonalCategoriaDesde)}`, delay }])
        //            await flowDynamic([{ body: `${cat.fullName.trim()}`, delay }])
        //        }

        const coordinadorgeneralrec: any[] = await PersonalController.getResponsablesListByPersonal(personalId)

        //        const coordinador = (coordinadorgeneralrec[0]) ? coordinadorgeneralrec[0].Supervisor.trim() + ' desde ' + personalController.dateOutputFormat(coordinadorgeneralrec[0].Desde) : 'No asignado aún'
        const coordinador = (coordinadorgeneralrec[0]) ? coordinadorgeneralrec[0].Supervisor.trim() : 'No asignado aún'

        await flowDynamic(`Su coordinador de zona es: ${coordinador}`, { delay })

        if (coordinadorgeneralrec[0].PersonalId) {
            const telrec = await PersonalController.getTelefono(coordinadorgeneralrec[0].PersonalId)
            if (telrec[0])
                await flowDynamic(`Contacto del coordinador 📞 ${telrec[0].Telefono}`, { delay })
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