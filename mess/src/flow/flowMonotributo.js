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
var controller_module_1 = require("../controller/controller.module");
var bot_1 = require("@builderbot/bot");
var flowMenu_1 = require("./flowMenu");
var controller_module_2 = require("../controller/controller.module");
var src_1 = require("src");
var flowIdle_1 = require("./flowIdle");
var delay = controller_module_2.chatBotController.getDelay();
var flowMonotributo = (0, bot_1.addKeyword)(bot_1.EVENTS.ACTION)
    // .addAction(async (_, { flowDynamic, state }) => {
    //     await flowDynamic([{body:`⏱️ Dame un momento`}])
    //     const myState = state.getMyState()
    //     const personalId = myState.personalId
    //     const cuit = myState.cuit
    //     const monotributoPdf : any = await impuestosAfipController.downloadComprobante(personalId).then((data:any) => {return data})
    //     // console.log('monotributoPdf -->', monotributoPdf);
    //     if (monotributoPdf instanceof ClientException)
    //         await flowDynamic([{body:`Error. Avisé al administrador`, delay:delay}])
    //     else
    //         await flowDynamic([{ media:monotributoPdf, delay:delay }]) 
    // })
    .addAction(function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
    var myState, personalId, periodosArray, resPeriodos;
    var flowDynamic = _b.flowDynamic, state = _b.state, gotoFlow = _b.gotoFlow;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, flowDynamic([{ body: "\u23F1\uFE0F Buscando comprobantes", delay: delay }])];
            case 1:
                _c.sent();
                myState = state.getMyState();
                personalId = myState.personalId;
                return [4 /*yield*/, controller_module_1.impuestosAfipController.getLastPeriodosOfComprobantes(personalId, 3).then(function (array) { return array; })
                    // console.log('periodos', periodosArray);
                ];
            case 2:
                periodosArray = _c.sent();
                resPeriodos = '';
                if (!periodosArray.length) return [3 /*break*/, 3];
                periodosArray.forEach(function (obj, index) {
                    if (obj.mes < 10)
                        resPeriodos += "".concat(index + 1, "- *0").concat(obj.mes, "/").concat(obj.anio, "*\n");
                    else
                        resPeriodos += "".concat(index + 1, "- *").concat(obj.mes, "/").concat(obj.anio, "*\n");
                });
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, flowDynamic([{ body: "No hay comprobantes", delay: delay }])];
            case 4:
                _c.sent();
                return [2 /*return*/, gotoFlow(flowMenu_1.default)];
            case 5: return [4 /*yield*/, state.update({ recibo: { periodosArray: periodosArray, periodosString: resPeriodos } })];
            case 6:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); })
    .addAction(function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
    var myState, resPeriodos;
    var flowDynamic = _b.flowDynamic, state = _b.state;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                myState = state.getMyState();
                resPeriodos = myState.recibo.periodosString;
                return [4 /*yield*/, flowDynamic([{ body: resPeriodos }])];
            case 1:
                _c.sent();
                return [4 /*yield*/, flowDynamic([{ body: 'Ingrese el número correspondiente a una fecha de la lista 📝' }])];
            case 2:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); })
    .addAction({ capture: true, delay: delay }, function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var myState, periodosArray, msj, mes, anio, personalId, urlDoc;
    var _c, _d;
    var flowDynamic = _b.flowDynamic, state = _b.state, fallBack = _b.fallBack, gotoFlow = _b.gotoFlow;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                (0, flowIdle_1.reset)(ctx, gotoFlow, src_1.botServer.globalTimeOutMs);
                myState = state.getMyState();
                periodosArray = myState.recibo.periodosArray;
                msj = ctx.body;
                if (parseInt(msj) < 1 || Number.isNaN(parseInt(msj)) || parseInt(msj) > periodosArray.length) {
                    return [2 /*return*/, fallBack('El numero ingresado no aparece en la lista  📝\nIngrese otro')];
                }
                mes = (_c = periodosArray[parseInt(msj) - 1]) === null || _c === void 0 ? void 0 : _c.mes;
                anio = (_d = periodosArray[parseInt(msj) - 1]) === null || _d === void 0 ? void 0 : _d.anio;
                personalId = myState.personalId;
                return [4 /*yield*/, controller_module_1.impuestosAfipController.getURLDocComprobante(personalId, anio, mes)];
            case 1:
                urlDoc = _e.sent();
                if (!(urlDoc instanceof Error)) return [3 /*break*/, 3];
                return [4 /*yield*/, flowDynamic([{ body: "Error, no se encontr\u00F3 el documento", delay: delay }])];
            case 2:
                _e.sent();
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, flowDynamic([{ body: "Recibo", media: urlDoc, delay: delay }])];
            case 4:
                _e.sent();
                _e.label = 5;
            case 5: return [2 /*return*/];
        }
    });
}); })
    .addAnswer([
    '¿Desea consulta algo mas?',
    'Responda "Si" o "No"'
], { capture: true, delay: delay }, function (ctx_1, _a) { return __awaiter(void 0, [ctx_1, _a], void 0, function (ctx, _b) {
    var myState, respuesta;
    var gotoFlow = _b.gotoFlow, fallBack = _b.fallBack, state = _b.state;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                (0, flowIdle_1.reset)(ctx, gotoFlow, src_1.botServer.globalTimeOutMs);
                myState = state.getMyState();
                delete myState.recibo;
                return [4 /*yield*/, state.update(myState)];
            case 1:
                _c.sent();
                console.log('state.getMyState()', state.getMyState());
                respuesta = ctx.body;
                if (respuesta == 'Si' || respuesta == 'si' || respuesta == 'SI') {
                    return [2 /*return*/, gotoFlow(flowMenu_1.default)];
                }
                else if (respuesta != 'no' && respuesta != 'No') {
                    return [2 /*return*/, fallBack()];
                }
                return [2 /*return*/];
        }
    });
}); }, []);
exports.default = flowMonotributo;
