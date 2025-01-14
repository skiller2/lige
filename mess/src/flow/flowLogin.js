"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowLogin = exports.flowValidateCode = void 0;
var bot_1 = require("@builderbot/bot");
var flowMenu_1 = require("./flowMenu");
var controller_module_1 = require("../controller/controller.module");
var flowIdle_1 = require("./flowIdle");
var src_1 = require("src");
var delay = controller_module_1.chatBotController.getDelay();
exports.flowValidateCode = (0, bot_1.addKeyword)(bot_1.utils.setEvent("REGISTRO_FINAL"))
    .addAction(function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var state = _b.state, gotoFlow = _b.gotoFlow, flowDynamic = _b.flowDynamic;
    return __generator(this, function (_c) {
        return [2 /*return*/];
    });
}); })
    .addAnswer(["Ingrese el c\u00F3digo proporcionado durante la verificaci\u00F3n de DNI"], { capture: true, delay: delay }, function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var telefono, res, data, reintento, res_1;
    var flowDynamic = _b.flowDynamic, state = _b.state, gotoFlow = _b.gotoFlow, fallBack = _b.fallBack;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, flowIdle_1.reset)(ctx, gotoFlow, src_1.botServer.globalTimeOutMs);
                telefono = ctx.from;
                return [4 /*yield*/, controller_module_1.personalController.getPersonalfromTelefonoQuery(telefono)];
            case 1:
                res = _c.sent();
                if (!res.length) return [3 /*break*/, 6];
                return [4 /*yield*/, state.update({ personalId: res[0].personalId })];
            case 2:
                _c.sent();
                return [4 /*yield*/, state.update({ cuit: res[0].cuit })];
            case 3:
                _c.sent();
                return [4 /*yield*/, state.update({ codigo: res[0].codigo })];
            case 4:
                _c.sent();
                return [4 /*yield*/, state.update({ name: res[0].name.trim() })];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                data = state.getMyState();
                if (!((data === null || data === void 0 ? void 0 : data.codigo) == ctx.body)) return [3 /*break*/, 8];
                return [4 /*yield*/, flowDynamic("identidad verificada", { delay: delay })];
            case 7:
                _c.sent();
                controller_module_1.personalController.removeCode(telefono);
                return [2 /*return*/, gotoFlow(flowMenu_1.default)];
            case 8:
                reintento = (data.reintento) ? data.reintento : 0;
                if (!(reintento > 3)) return [3 /*break*/, 11];
                return [4 /*yield*/, controller_module_1.personalController.delTelefonoPersona(telefono)];
            case 9:
                res_1 = _c.sent();
                return [4 /*yield*/, flowDynamic("Demasiados reintentos", { delay: delay })];
            case 10:
                _c.sent();
                (0, flowIdle_1.stop)(ctx, gotoFlow, state);
                return [2 /*return*/];
            case 11: return [4 /*yield*/, state.update({ reintento: reintento + 1 })];
            case 12:
                _c.sent();
                return [2 /*return*/, fallBack('Código ingresado incorrecto, reintente')];
        }
    });
}); });
exports.flowLogin = (0, bot_1.addKeyword)(bot_1.EVENTS.WELCOME)
    .addAction(function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var telefono, res;
    var state = _b.state, gotoFlow = _b.gotoFlow, flowDynamic = _b.flowDynamic;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, flowIdle_1.start)(ctx, gotoFlow, src_1.botServer.globalTimeOutMs);
                telefono = ctx.from;
                return [4 /*yield*/, flowDynamic("Bienvenido al \u00E1rea de consultas de la Cooperativa Lince Seguridad", { delay: delay })];
            case 1:
                _c.sent();
                return [4 /*yield*/, controller_module_1.personalController.getPersonalfromTelefonoQuery(telefono)];
            case 2:
                res = _c.sent();
                if (!res.length) return [3 /*break*/, 7];
                return [4 /*yield*/, state.update({ personalId: res[0].personalId })];
            case 3:
                _c.sent();
                return [4 /*yield*/, state.update({ cuit: res[0].cuit })];
            case 4:
                _c.sent();
                return [4 /*yield*/, state.update({ codigo: res[0].codigo })];
            case 5:
                _c.sent();
                return [4 /*yield*/, state.update({ name: res[0].name.trim() })];
            case 6:
                _c.sent();
                if (res[0].codigo) {
                    //Código pendiente de ingreso
                    return [2 /*return*/, gotoFlow(exports.flowValidateCode)];
                }
                else {
                    return [2 /*return*/, gotoFlow(flowMenu_1.default)];
                }
                _c.label = 7;
            case 7: return [2 /*return*/];
        }
    });
}); })
    .addAnswer('El teléfono ingresado no lo pude localizar.  Desea registrarlo?', { delay: delay, capture: true }, function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var telefono, respSINO, ret;
    var flowDynamic = _b.flowDynamic, state = _b.state, gotoFlow = _b.gotoFlow, fallBack = _b.fallBack, endFlow = _b.endFlow;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, flowIdle_1.reset)(ctx, gotoFlow, src_1.botServer.globalTimeOutMs);
                telefono = ctx.from;
                respSINO = ctx.body;
                if (!(respSINO.charAt(0).toUpperCase() == 'S' || respSINO.charAt(0).toUpperCase() == 'Y')) return [3 /*break*/, 4];
                return [4 /*yield*/, controller_module_1.personalController.genTelCode(telefono)];
            case 1:
                ret = _c.sent();
                return [4 /*yield*/, flowDynamic("Para continuar ingrese a https://gestion.linceseguridad.com.ar/ext/#/init/ident;encTelNro=".concat(encodeURIComponent(ret.encTelNro)), { delay: delay })];
            case 2:
                _c.sent();
                return [4 /*yield*/, state.update({ encTelNro: ret.encTelNro })];
            case 3:
                _c.sent();
                return [2 /*return*/, endFlow()];
            case 4:
                (0, flowIdle_1.stop)(ctx, gotoFlow, state);
                _c.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); });
