"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recibosRouter = void 0;
var express_1 = require("express");
var controller_module_1 = require("../controller/controller.module");
exports.recibosRouter = (0, express_1.Router)();
exports.recibosRouter.get("/download/:doc_id?", function (req, res, next) {
    controller_module_1.recibosController.downloadRecibo(req, res, next);
});
