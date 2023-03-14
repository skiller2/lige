import { infoRouter } from '../routes/info.routes'
import { Server } from '../server'

export function makeRoutes(server: Server) {
    server.setRoute("/api/info", infoRouter)
}
