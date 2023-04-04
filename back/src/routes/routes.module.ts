import { infoRouter } from './info.routes'
import { WebServer } from '../server'
import { authRouter } from './auth.routes'
import { liquidaRouter } from './liquida.routes'
import { personalRouter } from './personal.routes'
import { initRouter } from './init.routes'

export function makeRoutes(server: WebServer) {
    server.setRoute("/api/info", infoRouter)
    server.setRoute("/api/auth", authRouter)
    server.setRoute("/api/liquida", liquidaRouter)
    server.setRoute("/api/personal", personalRouter)
    server.setRoute("/api/init", initRouter)
}
