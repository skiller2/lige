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
exports.WebServer = exports.DBServer = exports.tmpName = void 0;
var express_1 = require("express");
var version_json_1 = require("./version.json");
var typeorm_1 = require("typeorm");
var node_fs_1 = require("node:fs");
var node_crypto_1 = require("node:crypto");
var http_1 = require("http");
var base_controller_1 = require("./controller/base.controller");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var tmpName = function (dir) {
    while (true) {
        var name_1 = (0, node_crypto_1.randomBytes)(8).toString("hex") + ".tmp";
        if (!(0, node_fs_1.existsSync)("".concat(dir, "/").concat(name_1)))
            return name_1;
    }
};
exports.tmpName = tmpName;
var DBServer = /** @class */ (function () {
    function DBServer(retries, timeOutDelay, dataSource) {
        this.retriesCount = 1;
        this.timeOutDelay = timeOutDelay;
        this.dataSource = dataSource;
    }
    DBServer.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var interval = setInterval(function () {
                            _this.dataSource
                                .initialize()
                                .then(function () {
                                clearInterval(interval);
                                resolve({
                                    res: "Success: connected to Database ".concat(_this.dataSource.options.database),
                                    ds: _this.dataSource,
                                });
                            })
                                .catch(function (error) {
                                console.error("".concat(error.message, ", retry ").concat(_this.retriesCount, " in ").concat(_this.timeOutDelay, " ms."));
                                _this.retriesCount++;
                            });
                        }, _this.timeOutDelay);
                    })];
            });
        });
    };
    return DBServer;
}());
exports.DBServer = DBServer;
var errorResponder = function (error, req, res, next) {
    res.locals.stopTime = performance.now();
    var data = {};
    var message = ["Error interno, avise al administrador del sistema"];
    var status = 500;
    if (process.env.DEBUG) {
        console.error(error);
    }
    if (error instanceof base_controller_1.ClientException) {
        console.log('error.message', error);
        message = error.messageArr;
        status = 409;
        data = error.extended;
    }
    else if (error instanceof typeorm_1.QueryFailedError) {
        if (error.message.indexOf('Violation') > 0) {
            message = ['El registro ya existe'];
            status = 409;
        }
    }
    res.status(status).json({ msg: message, data: data, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime });
};
var WebServer = /** @class */ (function () {
    function WebServer(port) {
        this.port = port;
        this.app = (0, express_1.default)();
        this.app.use((0, express_1.json)());
        this.app.set("trust proxy", true);
        /*
        * Agrega starTime a todas las peticiones de la api
        */
        this.app.use("*", function (req, res, next) {
            res.locals.startTime = performance.now();
            return next();
        });
    }
    WebServer.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var server = (0, http_1.createServer)(_this.app);
                        server.listen(_this.port, function () {
                            resolve("Listening on port ".concat(_this.port));
                        });
                        server.on("error", function (e) {
                            // Handle your error here
                            reject(e);
                        });
                    })];
            });
        });
    };
    WebServer.prototype.lateInit = function () {
        var _this = this;
        /*
            this.app.use("*",function (req:Request, res:Response, next:NextFunction) {
              console.log('pasa por aca')
              res.locals.stopTime = performance.now()
              res.json({ hola: 'hola' })
              res.end()
            });
        */
        this.app.use(errorResponder);
        this.app.set("pkg", { version: version_json_1.version, author: version_json_1.author, name: version_json_1.name, description: version_json_1.description });
        this.app.get("/", function (req, res) {
            res.json({
                author: _this.app.get("pkg").author,
                name: _this.app.get("pkg").name,
                description: _this.app.get("pkg").description,
                version: _this.app.get("pkg").version,
            });
        });
    };
    WebServer.prototype.setRoute = function (apiPoint, route) {
        this.app.use(apiPoint, route);
        return route;
        // this.app.get()
    };
    return WebServer;
}());
exports.WebServer = WebServer;
