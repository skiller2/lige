import { infoRouter } from '../routes/info.routes'
import { Server } from '../server'
import { authRouter } from './auth.routes'
import { liquidaRouter } from './liquida.routes'
import { personalRouter } from './personal.routes'
import { usersRouter } from './users.routes'

export function makeRoutes(server: Server) {
    server.setRoute("/api/info", infoRouter)
    server.setRoute("/api/auth", authRouter)
    server.setRoute("/api/liquida", liquidaRouter)
    server.setRoute("/api/usuarios", usersRouter)
    server.setRoute("/api/personal", personalRouter)
}
