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
exports.BaseController = exports.ClientException = void 0;
var ClientException = /** @class */ (function (_super) {
    __extends(ClientException, _super);
    function ClientException(message, extended, code) {
        if (extended === void 0) { extended = ''; }
        if (code === void 0) { code = 0; }
        var _this = this;
        _this.extended = extended;
        _this.code = code;
        if (message instanceof Array) {
            _this = _super.call(this, message.join(', ')) || this;
            _this.messageArr = message;
        }
        else {
            _this = _super.call(this, message) || this;
            _this.messageArr = [message];
        }
        _this.name = "ClientException";
        if (extended)
            _this.stack += "\nExtra: " + extended;
        return _this;
    }
    return ClientException;
}(Error));
exports.ClientException = ClientException;
var BaseController = /** @class */ (function () {
    function BaseController() {
    }
    /**
     * Sends the document as JSON in the body of response, and sets status to 200
     * @param recordset the Database recordset to be returned to the client as JSON
     * @param res the response object that will be used to send http response
     */
    BaseController.prototype.jsonRes = function (recordset, res, msg) {
        if (msg === void 0) { msg = "ok"; }
        res.locals.stopTime = performance.now();
        res.status(200).json({ msg: msg, data: recordset, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime });
    };
    BaseController.prototype.jsonResDirect = function (data, res, msg) {
        if (msg === void 0) { msg = "ok"; }
        res.status(200).json(data);
    };
    BaseController.prototype.getRemoteAddress = function (req) {
        var _a, _b, _c;
        return (_c = (_a = req.headers['x-origin-ip']) !== null && _a !== void 0 ? _a : (_b = req.headers['x-forwarded-for']) === null || _b === void 0 ? void 0 : _b.split(',')[0]) !== null && _c !== void 0 ? _c : req.socket.remoteAddress;
    };
    BaseController.prototype.hasGroup = function (req, group) {
        return __awaiter(this, void 0, void 0, function () {
            var inGroup, _i, _a, rowgroup;
            return __generator(this, function (_b) {
                inGroup = false;
                if (req === null || req === void 0 ? void 0 : req.groups) {
                    for (_i = 0, _a = req === null || req === void 0 ? void 0 : req.groups; _i < _a.length; _i++) {
                        rowgroup = _a[_i];
                        if (rowgroup.toLowerCase().indexOf(group.toLowerCase()) != -1)
                            inGroup = true;
                    }
                }
                return [2 /*return*/, (inGroup) ? true : false];
            });
        });
    };
    BaseController.prototype.hasAuthPersona = function (res, anio, mes, PersonalId_auth, queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            var fechaHastaAuth, PersonalId, grupos, listGrupos, _i, grupos_1, row, resPers, ObjetivoIdList, resultObjs, _a, resultObjs_1, row, resultPers;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fechaHastaAuth = new Date(anio, mes, 1);
                        fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
                        PersonalId = res.locals.PersonalId;
                        if (PersonalId == PersonalId_auth)
                            return [2 /*return*/, true];
                        if (PersonalId < 1) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)];
                    case 1:
                        grupos = _b.sent();
                        listGrupos = [];
                        for (_i = 0, grupos_1 = grupos; _i < grupos_1.length; _i++) {
                            row = grupos_1[_i];
                            listGrupos.push(row.GrupoActividadId);
                        }
                        if (!(listGrupos.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.query("\n      SELECT gap.GrupoActividadPersonalPersonalId FROM GrupoActividadPersonal gap \n      WHERE gap.GrupoActividadPersonalPersonalId = @0  AND gap.GrupoActividadPersonalDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND\n      ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (".concat(listGrupos.join(','), ")\n      UNION\n      SELECT gap.GrupoActividadJerarquicoPersonalId FROM GrupoActividadJerarquico gap \n      WHERE gap.GrupoActividadJerarquicoPersonalId = @0  AND gap.GrupoActividadJerarquicoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND\n      ISNULL(gap.GrupoActividadJerarquicoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1) AND gap.GrupoActividadId IN (").concat(listGrupos.join(','), ")\n      AND gap.GrupoActividadJerarquicoComo = 'J'\n      "), [PersonalId_auth, anio, mes])];
                    case 2:
                        resPers = _b.sent();
                        if (resPers.length > 0)
                            return [2 /*return*/, true];
                        _b.label = 3;
                    case 3:
                        ObjetivoIdList = [];
                        return [4 /*yield*/, queryRunner.query("SELECT suc.SucursalId,\n         \n      obj.ObjetivoId, \n      obj.ClienteId,\n      obj.ClienteElementoDependienteId,\n      obj.ObjetivoDescripcion,\n      \n      opj.GrupoActividadObjetivoDesde,\n      opj.GrupoActividadObjetivoHasta,\n      1\n      \n      FROM Objetivo obj \n     JOIN GrupoActividadObjetivo opj ON opj.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND  opj.GrupoActividadObjetivoDesde  <= @0 AND ISNULL(opj.GrupoActividadObjetivoHasta,'9999-12-31') >= @0\n      JOIN GrupoActividadJerarquico gaj ON gaj.GrupoActividadId = opj.GrupoActividadId AND  gaj.GrupoActividadJerarquicoDesde  <= @0 AND ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31') >= @0\n  \n  \n      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId\n      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId\n      \n      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)\n  \n      WHERE gaj.GrupoActividadJerarquicoPersonalId=@1", [fechaHastaAuth, PersonalId])];
                    case 4:
                        resultObjs = _b.sent();
                        for (_a = 0, resultObjs_1 = resultObjs; _a < resultObjs_1.length; _a++) {
                            row = resultObjs_1[_a];
                            ObjetivoIdList.push(row.ObjetivoId);
                        }
                        if (!(ObjetivoIdList.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryRunner.query("\n    SELECT DISTINCT \n                persona.PersonalId,\n                1 as last\n                FROM ObjetivoAsistenciaAnoMesPersonalDias objd\n                JOIN ObjetivoAsistenciaAnoMes objm ON objm.ObjetivoAsistenciaAnoMesId = objd.ObjetivoAsistenciaAnoMesId AND objm.ObjetivoAsistenciaAnoId = objd.ObjetivoAsistenciaAnoId AND objm.ObjetivoId = objd.ObjetivoId\n                JOIN ObjetivoAsistenciaAno obja ON obja.ObjetivoAsistenciaAnoId = objm.ObjetivoAsistenciaAnoId AND obja.ObjetivoId = objm.ObjetivoId\n                JOIN Objetivo obj ON obj.ObjetivoId = obja.ObjetivoId\n                JOIN Personal persona ON persona.PersonalId = objd.ObjetivoAsistenciaMesPersonalId\n                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = persona.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = persona.PersonalId) \n                JOIN CategoriaPersonal cat ON cat.CategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND cat.TipoAsociadoId=objd.ObjetivoAsistenciaTipoAsociadoId\n                \n                LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId\n                LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId\n                \n                LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)\n                LEFT JOIN ValorLiquidacion val ON val.ValorLiquidacionSucursalId = suc.SucursalId AND val.ValorLiquidacionTipoAsociadoId = objd.ObjetivoAsistenciaTipoAsociadoId AND val.ValorLiquidacionCategoriaPersonalId = objd.ObjetivoAsistenciaCategoriaPersonalId AND \n                \n                DATEFROMPARTS(obja.ObjetivoAsistenciaAnoAno,objm.ObjetivoAsistenciaAnoMesMes,1)BETWEEN \n                    val.ValorLiquidacionDesde AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31')\n                \n                WHERE obja.ObjetivoAsistenciaAnoAno = @1 \n                AND objm.ObjetivoAsistenciaAnoMesMes = @2 \n                AND obj.ObjetivoId IN (".concat(ObjetivoIdList.join(','), ") \n                AND persona.PersonalId = @0\n                "), [PersonalId_auth, anio, mes])];
                    case 5:
                        resultPers = _b.sent();
                        if (resultPers.length > 0) {
                            //Encontré la persona.  Tengo permiso
                            return [2 /*return*/, true];
                        }
                        _b.label = 6;
                    case 6: return [2 /*return*/, false];
                }
            });
        });
    };
    BaseController.prototype.hasAuthObjetivo = function (anio, mes, res, ObjetivoId, queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            var fechaHastaAuth, authSucursal, authAdministrativo, PersonalId, grupos, listGrupos, _i, grupos_2, row, resultAuth;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fechaHastaAuth = new Date(anio, mes, 1);
                        fechaHastaAuth.setDate(fechaHastaAuth.getDate() - 1);
                        authSucursal = false;
                        authAdministrativo = false;
                        PersonalId = res.locals.PersonalId;
                        if (PersonalId == "")
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.getGruposActividad(queryRunner, res.locals.PersonalId, anio, mes)];
                    case 1:
                        grupos = _a.sent();
                        listGrupos = [];
                        for (_i = 0, grupos_2 = grupos; _i < grupos_2.length; _i++) {
                            row = grupos_2[_i];
                            listGrupos.push(row.GrupoActividadId);
                        }
                        if (!(listGrupos.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.query("SELECT suc.SucursalId,\n           \n      obj.ObjetivoId, \n      obj.ClienteId,\n      obj.ClienteElementoDependienteId,\n      obj.ObjetivoDescripcion,\n      \n      1\n      \n      FROM Objetivo obj \n      LEFT JOIN GrupoActividadObjetivo gao ON gao.GrupoActividadObjetivoObjetivoId = obj.ObjetivoId AND gao.GrupoActividadObjetivoDesde  <= EOMONTH(DATEFROMPARTS(@1,@2,1)) AND ISNULL(gao.GrupoActividadObjetivoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1)\n      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId\n      LEFT JOIN ClienteElementoDependiente clidep ON clidep.ClienteId = obj.ClienteId  AND clidep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId\n      LEFT JOIN Sucursal suc ON suc.SucursalId = ISNULL(ISNULL(clidep.ClienteElementoDependienteSucursalId,cli.ClienteSucursalId),1)\n      \n  \n      WHERE obj.ObjetivoId=@0 AND gao.GrupoActividadId IN (".concat(listGrupos, ")"), [ObjetivoId, anio, mes, fechaHastaAuth])];
                    case 2:
                        resultAuth = _a.sent();
                        if (resultAuth.length > 0)
                            return [2 /*return*/, true];
                        _a.label = 3;
                    case 3:
                        /*
                     
                         res.locals.groups.forEach(group => {
                           switch (SucursalId) {
                             case 0: //Sin sucursal
                               authSucursal = true;
                               break;
                             case 1:  //Central
                               if (group.indexOf("CENTRAL")!=-1)
                                 authSucursal = true;
                               break;
                             case 2: //Formosa
                               if (group.indexOf("FORMOSA")!=-1)
                                 authSucursal = true;
                               break;
                             case 3: //MDQ
                               if (group.indexOf("MDQ")!=-1)
                                 authSucursal = true;
                               break;
                     
                             default:
                               break;
                           }
                           if (group.indexOf("Administrativo")!=-1)
                             authAdministrativo = true;
                         })
                     
                         authSucursal = true;
                         if (!authSucursal)
                           throw new ClientException(`No tiene permisos para realizar operación en la sucursal ${SucursalId}`)
                     */
                        if (authAdministrativo)
                            return [2 /*return*/, true]; //Si es administrativo no analizo el CUIT    
                        return [2 /*return*/, false];
                }
            });
        });
    };
    BaseController.prototype.getProxNumero = function (queryRunner, den_numerador, usuario, ip) {
        return __awaiter(this, void 0, void 0, function () {
            var fechaActual, den_numero, numerador;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fechaActual = new Date();
                        den_numero = 1;
                        return [4 /*yield*/, queryRunner.query('SELECT den_numero FROM lige.dbo.genmanumerador WHERE den_numerador=@0', [den_numerador])];
                    case 1:
                        numerador = _a.sent();
                        if (!(numerador.length == 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.query("INSERT INTO lige.dbo.genmanumerador (den_numerador,den_numero,aud_usuario_ins,aud_ip_ins,aud_fecha_ins,aud_usuario_mod,aud_ip_mod,aud_fecha_mod) \n      VALUES(@0,@1,@2,@3,@4,@5,@6,@7)", [den_numerador, den_numero, usuario, ip, fechaActual, usuario, ip, fechaActual])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        den_numero = numerador[0]['den_numero'] + 1;
                        return [4 /*yield*/, queryRunner.query("UPDATE lige.dbo.genmanumerador SET den_numero=@1, aud_usuario_mod=@2,aud_ip_mod=@3,aud_fecha_mod=@4 WHERE den_numerador=@0", [den_numerador, den_numero, usuario, ip, fechaActual])];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, den_numero];
                }
            });
        });
    };
    BaseController.prototype.getGruposActividad = function (queryRunner, PersonalId, anio, mes) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, queryRunner.query("SELECT DISTINCT gaj.GrupoActividadId, gaj.GrupoActividadJerarquicoComo, 1\n      FroM GrupoActividadJerarquico gaj \n      WHERE gaj.GrupoActividadJerarquicoPersonalId = @0\n      AND EOMONTh(DATEFROMPARTS(@1,@2,1)) >   gaj.GrupoActividadJerarquicoDesde  AND DATEFROMPARTS(@1,@2,1) <  ISNULL(gaj.GrupoActividadJerarquicoHasta,'9999-12-31')", [PersonalId, anio, mes])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    BaseController.prototype.rollbackTransaction = function (queryRunner) {
        return __awaiter(this, void 0, void 0, function () {
            var error2_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!queryRunner.isTransactionActive) return [3 /*break*/, 2];
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error2_1 = _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return BaseController;
}());
exports.BaseController = BaseController;
