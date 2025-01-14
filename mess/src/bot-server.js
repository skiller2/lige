"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.BotServer = exports.tmpName = void 0;
var node_fs_1 = require("node:fs");
var node_crypto_1 = require("node:crypto");
var dotenv_1 = require("dotenv");
var bot_1 = require("@builderbot/bot");
var database_json_1 = require("@builderbot/database-json");
var provider_baileys_1 = require("@builderbot/provider-baileys");
var flowLogin_1 = require("./flow/flowLogin");
var flowRecibo_1 = require("./flow/flowRecibo");
var flowMonotributo_1 = require("./flow/flowMonotributo");
var flowMenu_1 = require("./flow/flowMenu");
var flowRemoveTel_1 = require("./flow/flowRemoveTel");
var flowIdle_1 = require("./flow/flowIdle");
dotenv_1.default.config();
var tmpName = function (dir) {
    while (true) {
        var name_1 = (0, node_crypto_1.randomBytes)(8).toString("hex") + ".tmp";
        if (!(0, node_fs_1.existsSync)("".concat(dir, "/").concat(name_1)))
            return name_1;
    }
};
exports.tmpName = tmpName;
var BotServer = /** @class */ (function () {
    function BotServer() {
    }
    BotServer.prototype.sendMsg = function (telNro, message) {
        return this.adapterProvider.sendMessage(telNro, message, {});
    };
    BotServer.prototype.runFlow = function (from, name) {
        return this.adapterProvider.emit('message', __assign({ from: from, name: name }, { body: bot_1.utils.encryptData("_event_custom_".concat(name, "_")), name: name, from: from }));
    };
    BotServer.prototype.status = function () {
        return { bot_online: this.statusMsg };
    };
    BotServer.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adapterFlow, adapterDB, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        adapterFlow = (0, bot_1.createFlow)([flowLogin_1.flowLogin, flowMenu_1.default, flowLogin_1.flowValidateCode, flowRecibo_1.default, flowMonotributo_1.default, flowRemoveTel_1.default, flowIdle_1.idleFlow]);
                        this.adapterProvider = (0, bot_1.createProvider)(provider_baileys_1.BaileysProvider);
                        adapterDB = new database_json_1.JsonFileDB({ filename: 'db.json' });
                        this.globalTimeOutMs = 60000 * 5;
                        _a = this;
                        return [4 /*yield*/, (0, bot_1.createBot)({
                                flow: adapterFlow,
                                provider: this.adapterProvider,
                                database: adapterDB,
                            })];
                    case 1:
                        _a.botHandle = _b.sent();
                        this.adapterProvider.on('ready', function () {
                            _this.statusMsg = 3;
                            console.log('ready');
                        });
                        this.adapterProvider.on('require_action', function (e) {
                            _this.statusMsg = 1;
                            console.log('event', e);
                        });
                        this.adapterProvider.on('auth_failure', function () {
                            _this.statusMsg = 2;
                            console.log('event');
                        });
                        this.botHandle.httpServer(3008);
                        console.log('botHandle', this.botHandle);
                        console.log('adapterProvider', this.adapterProvider);
                        return [2 /*return*/];
                }
            });
        });
    };
    return BotServer;
}());
exports.BotServer = BotServer;
