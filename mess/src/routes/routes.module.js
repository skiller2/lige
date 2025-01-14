"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRoutes = makeRoutes;
var info_routes_1 = require("../info/info.routes");
var personal_routes_1 = require("./personal.routes");
var recibos_routes_1 = require("./recibos.routes");
var impuestos_afip_routes_1 = require("./impuestos-afip.routes");
var chatbot_routes_1 = require("./chatbot.routes");
function makeRoutes(server) {
    server.setRoute("/api/info", info_routes_1.infoRouter);
    server.setRoute("/api/personal", personal_routes_1.personalRouter);
    server.setRoute("/api/recibos", recibos_routes_1.recibosRouter);
    server.setRoute("/api/impuestos_afip", impuestos_afip_routes_1.impuestosAfipRouter);
    server.setRoute("/api/chatbot", chatbot_routes_1.chatBotRouter);
}
