import BotWhatsapp from '@bot-whatsapp/bot'
import flowMonotributo from './flowMonotributo'
import flowRecibo from './flowRecibo'

const { addKeyword, EVENTS } = BotWhatsapp

const flowMenu = addKeyword(EVENTS.ACTION)
    .addAnswer([
        'Escribe el numero del tema a consultar',
        '1- *Monotributo*',
        '2- *Recibo de Retiro*',
        // '3- *Pedido de Licencia*',
        // '4- *Envío de Constancia médica*'
    ], 
    { capture: true }, 
    async (ctx, { fallBack }) => {
        const numeros = ['1','2','3','4']
        if (!numeros.includes(ctx.body)) {
            return fallBack()
        }
    }, [flowMonotributo, flowRecibo])

export default flowMenu