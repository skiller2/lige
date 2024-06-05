import { createFlow } from '@builderbot/bot'
import flowLogin from './flowLogin'
import flujoUsuariosNORegistrados from './flowLogin'
import flowMenu from './flowMenu'

export default createFlow(
    [
        flowLogin,
        flowMenu,
        flujoUsuariosNORegistrados
    ]
)