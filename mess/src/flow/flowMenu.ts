import BotWhatsapp from '@bot-whatsapp/bot'
import flowMonotributo from './flowMonotributo'
import flowRecibo from './flowRecibo'
import flowConstMedica from './flowConstMedica'
import flowEnd from './flowEnd'

const { addKeyword, EVENTS } = BotWhatsapp

const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Ingrese el numero del tema a consultar',
        '1- *Monotributo*',
        '2- *Recibo de Retiro*',
        // '3- *Pedido de Licencia*',
        // '4- *Envío de Constancia médica*'
        '0- Si no desea consultar nada más'
    ], 
    { capture: true , delay: 500}, 
    async (ctx, { fallBack }) => {
        // const numeros = ['0','1','2','3','4']
        const numeros = ['0','1','2']
        if (!numeros.includes(ctx.body)) {
            return fallBack()
        }
    }, [flowMonotributo, flowRecibo, flowConstMedica, flowEnd])

export default flowMenu