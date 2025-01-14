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
exports.PersonalController = void 0;
var base_controller_1 = require("./base.controller");
// import { PersonaObj } from "../schemas/personal.schemas";
// import fetch, { Request } from "node-fetch";
var data_source_1 = require("../data-source");
var CryptoJS = require("crypto-js");
var src_1 = require("src");
var PersonalController = /** @class */ (function (_super) {
    __extends(PersonalController, _super);
    function PersonalController() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PersonalController.prototype.removeCode = function (telefono) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, data_source_1.dataSource.query("UPDATE lige.dbo.regtelefonopersonal SET codigo=NULL WHERE telefono=@0", [telefono])];
            });
        });
    };
    PersonalController.prototype.delTelefonoPersona = function (telefono) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, data_source_1.dataSource.query("DELETE FROM lige.dbo.regtelefonopersonal WHERE telefono=@0", [telefono])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /*
      getRemoteAddress(req: any) {
        return req.headers['x-origin-ip'] ??
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
          req.socket.remoteAddress
      }
    
      async searchQuery(cuit: number) {
        const result = await dataSource.query(
          `SELECT per.PersonalId, CONCAT(TRIM(per.PersonalApellido) , ', ', TRIM(per.PersonalNombre), ' CUIT:' , cuit.PersonalCUITCUILCUIT) fullName
          FROM dbo.Personal per
          LEFT JOIN PersonalCUITCUIL cuit
          ON cuit.PersonalId = per.PersonalId
          AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId)
          FROM PersonalCUITCUIL cuitmax
          WHERE cuitmax.PersonalId = per.PersonalId)
          WHERE cuit.PersonalCUITCUILCUIT LIKE '%${cuit}%'`
        );
        return result
      }
      */
    /*
      async search(req: any, res: Response, next: NextFunction) {
        const cuit = req.params.cuit;
        try {
          const result = await this.searchQuery(cuit)
          return this.jsonRes(result, res);
        } catch (error) {
          return next(error)
        }
      }
    
      async checkTelefonoPersonal(personalId: number, telefono: string, usuario: string, ip: string) {
        try {
          let result: any
          const [telefonoPersonal] = await dataSource.query(
            `SELECT reg.personal_id personalId, reg.telefono telefonoPersonal
            FROM lige.dbo.regtelefonopersonal reg
            WHERE reg.personal_id = @0`,
            [personalId]
          );
    
          if (telefonoPersonal) {
            result = await this.updateTelefonoPersonalQuery(personalId, telefono, usuario, ip)
          } else {
            result = await this.addTelefonoPersonalQuery(personalId, telefono, usuario, ip)
          }
          return result
        } catch (error) {
          return error
        }
      }
    
      async addTelefonoPersonalQuery(personalId: number, telefono: string, usuario: string, ip: string) {
        const fecha = new Date
        return dataSource.query(
          `INSERT INTO lige.dbo.regtelefonopersonal (personal_id, telefono, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
          VALUES(@0,@1,@2,@3,@4,@2,@3,@4)`,
          [personalId, telefono, usuario, ip, fecha]
        );
      }
    */
    PersonalController.prototype.getPersonalfromTelefonoQuery = function (telefono) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, data_source_1.dataSource.query("SELECT reg.personal_id personalId, reg.telefono, per.PersonalNombre name, cuit.PersonalCUITCUILCUIT cuit, codigo\n      FROM lige.dbo.regtelefonopersonal reg\n      LEFT JOIN Personal per ON per.PersonalId = reg.personal_id\n      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = reg.personal_id\n      WHERE reg.telefono = @0", [telefono])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /*
      async getPersonalfromTelefono(req: any, res: Response, next: NextFunction) {
        const telefono = req.params.telefono;
        try {
          const result = await this.getPersonalfromTelefonoQuery(telefono)
          return this.jsonRes(result, res);
        } catch (error) {
          return next(error)
        }
      }
    
      async linkDownloadComprobanteRecibo(
        personalId: number,
        year: number,
        month: number,
      ) {
        const result = `http://localhost:3010/api/recibos/download/${year}/${month}/${personalId}`
        return result
      }
    
      async updateTelefonoPersonalQuery(personalId: number, telefono: string, usuario: string, ip: string) {
        const fecha = new Date
        return dataSource.query(
          `UPDATE lige.dbo.regtelefonopersonal SET telefono = @1, aud_usuario_mod = @2, aud_ip_mod= @3, aud_fecha_mod = @4
          WHERE personal_id = @0`,
          [personalId, telefono, usuario, ip, fecha]
        );
      }
    */
    PersonalController.prototype.genTelCode = function (telNro) {
        return __awaiter(this, void 0, void 0, function () {
            var _key, _iv, encrypted;
            return __generator(this, function (_a) {
                //const stmactual = new Date();
                //const usuario = 'anon'
                //const ip = 'localhost'
                //const queryRunner = dataSource.createQueryRunner();
                try {
                    _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
                    _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
                    encrypted = CryptoJS.default.AES.encrypt(telNro, _key, {
                        keySize: 16,
                        iv: _iv,
                        mode: CryptoJS.default.mode.ECB,
                        padding: CryptoJS.default.pad.Pkcs7
                    });
                    return [2 /*return*/, { encTelNro: encrypted.toString() }];
                }
                catch (error) {
                    console.log('encoding', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    PersonalController.prototype.getIdentCode = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var des_doc_ident, encTelNro, stmactual, usuario, ip, dni, des_doc_ident_parts, queryRunner, _key, _iv, decrypted, telNro, telValid, dniValid, result, PersonalId, codigo, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        des_doc_ident = req.query.identData;
                        encTelNro = req.query.encTelNro;
                        stmactual = new Date();
                        usuario = 'anon';
                        ip = this.getRemoteAddress(req);
                        dni = '';
                        des_doc_ident_parts = des_doc_ident.split('@');
                        queryRunner = data_source_1.dataSource.createQueryRunner();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 8]);
                        if (des_doc_ident_parts.length > 4) {
                            if (des_doc_ident_parts[0] == '')
                                dni = des_doc_ident_parts[1].trim();
                            else
                                dni = des_doc_ident_parts[4].trim();
                        }
                        else
                            throw new base_controller_1.ClientException('No se pudo obtener el número de dni', { des_doc_ident: des_doc_ident });
                        _key = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
                        _iv = CryptoJS.default.enc.Utf8.parse(process.env.KEY_IDENT_TEL);
                        decrypted = CryptoJS.default.AES.decrypt(encTelNro, _key, {
                            keySize: 16,
                            iv: _iv,
                            mode: CryptoJS.default.mode.ECB,
                            padding: CryptoJS.default.pad.Pkcs7
                        });
                        telNro = decrypted.toString(CryptoJS.default.enc.Utf8).replace(/\"/g, '');
                        telValid = /^\d+$/.test(telNro);
                        dniValid = /^\d+$/.test(dni);
                        if (!telValid || telNro.length < 8)
                            throw new base_controller_1.ClientException('No se puede verificar el número de teléfono', { telNro: telNro });
                        if (!dniValid || dni.length < 6)
                            throw new base_controller_1.ClientException('No se puede verificar el número de dni', { dni: dni });
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.query("SELECT DISTINCT\n        per.PersonalId, cuit2.PersonalCUITCUILCUIT AS CUIT, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,\n        1\n        FROM Personal per\n        JOIN PersonalCUITCUIL cuit2 ON cuit2.PersonalId = per.PersonalId AND cuit2.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)\n        WHERE cuit2.PersonalCUITCUILCUIT LIKE @0", ["%".concat(dni, "_")])];
                    case 3:
                        result = _a.sent();
                        if (result.length == 0)
                            throw new base_controller_1.ClientException('No se pudo verificar el documento, contáctese con personal');
                        if (result.length > 1)
                            throw new base_controller_1.ClientException('Se encontraron múltiples coincidencias para el DNI, contáctese con personal');
                        PersonalId = result[0].PersonalId;
                        codigo = Math.floor(Math.random() * (999999 - 100000) + 100000);
                        return [4 /*yield*/, queryRunner.query("IF EXISTS(select * from lige.dbo.regtelefonopersonal where personal_id=@0) UPDATE lige.dbo.regtelefonopersonal SET codigo=@1, telefono=@2, des_doc_ident=@6, aud_usuario_mod=@3, aud_ip_mod=@4, aud_fecha_mod=@5 WHERE personal_id=@0 ELSE INSERT INTO lige.dbo.regtelefonopersonal (personal_id, codigo, telefono, des_doc_ident, aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod) values(@0,@1,@2,@6,@3,@4,@5,@3,@4,@5)   ", [PersonalId, codigo, telNro, usuario, ip, stmactual, des_doc_ident])];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        src_1.botServer.runFlow(telNro, 'REGISTRO_FINAL');
                        this.jsonRes({ codigo: codigo }, res);
                        return [3 /*break*/, 8];
                    case 6:
                        error_1 = _a.sent();
                        return [4 /*yield*/, this.rollbackTransaction(queryRunner)];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, next(error_1)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return PersonalController;
}(base_controller_1.BaseController));
exports.PersonalController = PersonalController;
