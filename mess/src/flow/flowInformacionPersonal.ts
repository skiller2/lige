import { impuestosAfipController } from "../controller/controller.module";
import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import { chatBotController } from "../controller/controller.module";
import { botServer } from "../index";
import { reset } from "./flowIdle";
import { PersonalController } from "src/controller/personal.controller";

const delay = chatBotController.getDelay()
const personalController = new PersonalController()
const flowInformacionPersonal = addKeyword(EVENTS.ACTION)
    .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
        await flowDynamic([{ body: `⏱️ Buscando información ...`, delay:delay*2 }])
        const myState = state.getMyState()
        const personalId = myState.personalId
        const fechaActual = new Date()
        const anio = fechaActual.getFullYear()
        const mes = fechaActual.getMonth() + 1

        const coordinadorgeneralrec: any[] = await PersonalController.getResponsablesListByPersonal(personalId)

        const coordinador = (coordinadorgeneralrec[0]) ? coordinadorgeneralrec[0].Supervisor.trim() + ' desde ' + personalController.dateOutputFormat(coordinadorgeneralrec[0].Desde) : 'No asignado aún'

        await flowDynamic([{ body: `Su coordinador de zona es ${coordinador}`, delay }])

        if (coordinadorgeneralrec[0].PersonalId) {
            const telrec = await PersonalController.getTelefono(coordinadorgeneralrec[0].PersonalId)
            if (telrec[0])
                await flowDynamic([{ body: `contacto del coordinador ${telrec[0].telefono}`, delay }])
        }


        //TODO Agregar fecha de ingreso y nro de asociado.

        const sitrevs: any[] = await PersonalController.getPersonalSitRevista(personalId, anio, mes)
        if (sitrevs.length > 0) {
            const sitrev = sitrevs[sitrevs.length - 1]
            await flowDynamic([{ body: `Su situación de revista: ${sitrev.SituacionRevistaDescripcion.trim()} desde ${personalController.dateOutputFormat(sitrev.PersonalSituacionRevistaDesde)}`, delay }])
        } else {
            await flowDynamic([{ body: `No posee situación de revista aún`, delay }])
        }

        const categs: any[] = await PersonalController.getCategoriasPorPersonaQuery(anio, mes, personalId, 1)
        for (const cat of categs) {
//            await flowDynamic([{ body: `Categoría: ${cat.fullName.trim()} desde ${personalController.dateOutputFormat(cat.PersonalCategoriaDesde)}`, delay }])
            await flowDynamic([{ body: `Su categoría: ${cat.fullName.trim()}`, delay }])
        }

        await flowDynamic([{ body: `-------------------------------`, delay:delay*2 }])


        return gotoFlow(flowMenu)
        //return gotoEnd()
    }


    )

export default flowInformacionPersonal