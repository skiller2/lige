"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.infoRouter = void 0;
var express_1 = require("express");
var info_controller_1 = require("../info/info.controller");
//import { authMiddleware } from "../middlewares/middleware.module";
exports.infoRouter = (0, express_1.Router)();
var base = "";
var infoController = new info_controller_1.InfoController();
//router.get(`${base}/dbstatus`, authMiddleware.verifyToken, (req, res) => {
exports.infoRouter.get("".concat(base, "/dbstatus"), function (req, res, next) {
    infoController.dbstatus(req, res, next);
});
