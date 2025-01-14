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
exports.idleFlow = exports.stop = exports.reset = exports.start = void 0;
var bot_1 = require("@builderbot/bot");
// Object to store timers for each user
var timers = {};
// Flow for handling inactivity
var idleFlow = (0, bot_1.addKeyword)(bot_1.EVENTS.ACTION).addAction(function (_1, _a) { return __awaiter(void 0, [_1, _a], void 0, function (_, _b) {
    var endFlow = _b.endFlow;
    return __generator(this, function (_c) {
        return [2 /*return*/, endFlow('Gracias por su tiempo, hasta la próxima 👋')];
    });
}); });
exports.idleFlow = idleFlow;
// Function to start the inactivity timer for a user
var start = function (ctx, gotoFlow, ms) {
    timers[ctx.from] = setTimeout(function () {
        console.log("User timeout: ".concat(ctx.from));
        return gotoFlow(idleFlow);
    }, ms);
};
exports.start = start;
// Function to reset the inactivity timer for a user
var reset = function (ctx, gotoFlow, ms) {
    if (timers[ctx.from]) {
        console.log("reset countdown for the user: ".concat(ctx.from));
        clearTimeout(timers[ctx.from]);
    }
    start(ctx, gotoFlow, ms);
};
exports.reset = reset;
// Function to stop the inactivity timer for a user
var stop = function (ctx, gotoFlow, state) {
    if (timers[ctx.from]) {
        clearTimeout(timers[ctx.from]);
    }
    state.clear();
    console.log("User stop: ".concat(ctx.from));
    return gotoFlow(idleFlow);
};
exports.stop = stop;
