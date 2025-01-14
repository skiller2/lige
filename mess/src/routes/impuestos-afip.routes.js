"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impuestosAfipRouter = void 0;
var express_1 = require("express");
var controller_module_1 = require("../controller/controller.module");
exports.impuestosAfipRouter = (0, express_1.Router)();
exports.impuestosAfipRouter.get("/download/:PersonalId/:anio/:mes/", function (req, res, next) {
    controller_module_1.impuestosAfipController.downloadComprobante(req, res, next);
});
