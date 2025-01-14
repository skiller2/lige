"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ImpuestosAfipController = void 0;
var base_controller_1 = require("./base.controller");
var fs_1 = require("fs");
var data_source_1 = require("../data-source");
var ImpuestosAfipController = /** @class */ (function (_super) {
    __extends(ImpuestosAfipController, _super);
    function ImpuestosAfipController() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.directory = process.env.PATH_MONOTRIBUTO || "tmp";
        _this.apiPath = process.env.URL_API || "http://localhost:4200/mess/api";
        return _this;
    }
    ImpuestosAfipController.prototype.getURLDocComprobante = function (PersonalId, anio, mes) {
        return __awaiter(this, void 0, void 0, function () {
            var queryRunner, gettmpfilename, tmpURL, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = data_source_1.dataSource.createQueryRunner();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, this.getRutaFile(queryRunner, PersonalId, anio, mes)];
                    case 2:
                        gettmpfilename = _a.sent();
                        tmpURL = '';
                        if (gettmpfilename[0]) {
                            tmpURL = "".concat(this.apiPath, "/impuestos_afip/download/").concat(PersonalId, "/").concat(anio, "/").concat(mes);
                        }
                        else {
                            throw new base_controller_1.ClientException("Recibo no generado");
                        }
                        return [2 /*return*/, tmpURL];
                    case 3:
                        error_1 = _a.sent();
                        return [4 /*yield*/, this.rollbackTransaction(queryRunner)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, error_1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ImpuestosAfipController.prototype.getRutaFile = function (queryRunner, personalIdRel, year, month) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, queryRunner.query("\n     SELECT DISTINCT\n        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,\n\n        1\n        FROM PersonalComprobantePagoAFIP com WHERE com.PersonalId=@0 AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2\n", [personalIdRel, year, month])];
            });
        });
    };
    ImpuestosAfipController.prototype.downloadComprobante = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var queryRunner, PersonalId, anio, mes, comprobante, filename, downloadPath, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = data_source_1.dataSource.createQueryRunner();
                        PersonalId = req.params.PersonalId;
                        anio = req.params.anio;
                        mes = req.params.mes;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        return [4 /*yield*/, queryRunner.query("SELECT DISTINCT\n        per.PersonalId PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,\n        com.PersonalComprobantePagoAFIPAno,com.PersonalComprobantePagoAFIPMes,com.PersonalComprobantePagoAFIPImporte,\n        ga.GrupoActividadId, ga.GrupoActividadNumero, ga.GrupoActividadDetalle,\n        1\n        FROM Personal per\n        JOIN PersonalComprobantePagoAFIP com ON com.PersonalId=per.PersonalId AND com.PersonalComprobantePagoAFIPAno = @1 AND com.PersonalComprobantePagoAFIPMes = @2\n        LEFT JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)\n        LEFT JOIN GrupoActividadPersonal gap ON gap.GrupoActividadPersonalPersonalId = per.PersonalId AND EOMONTH(DATEFROMPARTS(@1,@2,1)) > gap.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(gap.GrupoActividadPersonalHasta , '9999-12-31')\n        LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId=gap.GrupoActividadId\n        WHERE per.PersonalId = @0", [PersonalId, anio, mes])];
                    case 2:
                        comprobante = (_a.sent())[0];
                        if (!comprobante)
                            throw new base_controller_1.ClientException("No se pudo encontrar el comprobante");
                        filename = "".concat(anio, "-").concat(mes.toString().padStart(2, '0'), "-").concat(comprobante.CUIT, "-").concat(comprobante.PersonalId, ".pdf");
                        downloadPath = "".concat(this.directory, "/").concat(anio, "/").concat(filename);
                        if (!(0, fs_1.existsSync)(downloadPath))
                            throw new base_controller_1.ClientException("El archivo no existe (".concat(downloadPath, ")."));
                        //      const uint8Array = readFileSync(downloadPath);
                        res.download(downloadPath, filename, function (error) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                if (error) {
                                    console.error('Error al descargar el archivo:', error);
                                    return [2 /*return*/, next(error)];
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        return [3 /*break*/, 5];
                    case 3:
                        error_2 = _a.sent();
                        return [4 /*yield*/, this.rollbackTransaction(queryRunner)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, next(error_2)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ImpuestosAfipController.prototype.getLastPeriodosOfComprobantes = function (personalId, cant) {
        return __awaiter(this, void 0, void 0, function () {
            var queryRunner, respuesta, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = data_source_1.dataSource.createQueryRunner();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, queryRunner.query("\n        SELECT TOP ".concat(cant, " des.PersonalId, des.PersonalComprobantePagoAFIPId, des.PersonalComprobantePagoAFIPMes mes, des.PersonalComprobantePagoAFIPAno anio\n        FROM PersonalComprobantePagoAFIP  des \n        WHERE des.PersonalId = @0 \n        ORDER BY des.PersonalComprobantePagoAFIPAno DESC, des.PersonalComprobantePagoAFIPMes DESC"), [personalId])
                            // await queryRunner.commitTransaction()
                        ];
                    case 2:
                        respuesta = _a.sent();
                        // await queryRunner.commitTransaction()
                        return [2 /*return*/, respuesta];
                    case 3:
                        error_3 = _a.sent();
                        // await this.rollbackTransaction(queryRunner)
                        return [2 /*return*/, error_3];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ImpuestosAfipController;
}(base_controller_1.BaseController));
exports.ImpuestosAfipController = ImpuestosAfipController;
