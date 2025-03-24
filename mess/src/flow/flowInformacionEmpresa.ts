import { EVENTS, addKeyword } from "@builderbot/bot";
import flowMenu from './flowMenu'
import { chatBotController } from "../controller/controller.module";
import { reset, stop } from "./flowIdle";
import { botServer } from "src";

const delay = chatBotController.getDelay()
const flowInformacionEmpresa = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow }) => {
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)

        await flowDynamic([{ body: `🟢 Información de la Cooperativa 
Razón Social: Cooperativa de Trabajo Lince Seguridad Limitada
CUIT: 30-64344551-0
📍 Ubicación 
Sede central: Av. Federico Lacroze 4168, Chacarita, Cdad. Aut. de Bs. As.
Formosa: Barrio Parque Urbano II Mz 215 Casa 4, Formosa
Mar del Plata: Av. Colón 3083 3° Piso, Mar del Plata, Pcia. de Buenos Aires
🌐 Página web: https://www.linceseguridad.com.ar/
📲 Redes sociales 
Instagram: https://www.instagram.com/linceseguridadoficial/
LinkedIn: https://ar.linkedin.com/company/lince-seguridad-oficial
Facebook: https://www.facebook.com/profile.php?id=100076266804842
Consejo de Administración (mandato hasta el 30/04/2025) 🗓
Presidente: Julio Marcelo Ruiz
Secretario: Ricardo Augusto Elicabe
Tesorero: Arnaldo Ramón Ayala Ramírez
Síndico: Omar Alberto Muñoz
`, delay
        }])

    })

    .addAction(async (ctx, { flowDynamic,gotoFlow }) => {
        await flowDynamic('¿Alguna otra consulta?\n("si" o "no")', { delay: delay * 3})
        reset(ctx, gotoFlow, botServer.globalTimeOutMs)
    })
    .addAction({ capture: true }, async (ctx, { gotoFlow, state }): Promise<void> => {
        const respuesta = ctx.body
        return (respuesta.toLocaleLowerCase().indexOf('s') != -1) ? gotoFlow(flowMenu) : stop(ctx, gotoFlow, state)
    })

export default flowInformacionEmpresa
