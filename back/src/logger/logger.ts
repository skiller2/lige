import { Worker } from 'worker_threads';
import pino from 'pino';
import { type LogPayload, type LogLevel } from './logger.types.ts';
import { Console } from "node:console";


const isProd = process.env.NODE_ENV !== "dev";

class Logger {
  private worker: Worker;
  private devLogger?: pino.Logger;

  constructor() {
    const workerPath = isProd ? "./logger.worker.mjs" : "./worker/logger.worker.ts";
    this.worker = new Worker(
      new URL(workerPath, import.meta.url),
      {
        workerData: {
          logFile: process.env.LOG_FILE || 'STDOUT',
        }
      }
    );

    // ✅ Dev console logger (ONLY in development)
    if (!isProd) {
      this.devLogger = pino({
        level: 'trace',
        transport: {
          target: 'pino-pretty', // optional but recommended
          options: {
            colorize: true
          }
        }
      });
    }

    this.worker.on('error', (err) => {
      console.error('Logger worker error:', err);
    });
  }

  private log(level: LogLevel, ...args: any[]) {
    let message = '';
    let context: any;

    if (args.length === 1) {
      message = String(args[0]);
    } else if (args.length >= 2) {
      if (typeof args[1] === 'object' && args[1] !== null) {
        message = String(args[0]);
        context = args[1];
      } else {
        message = args.map((arg) => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      }
    }

    const payload: LogPayload = {
      level,
      message,
      context,
      time: Date.now()
    };

    if (isProd) {
      this.worker.postMessage(payload);
    } else {
      this.devLogger[level](context || {}, message);
    }
  }
/*
  trace(msg: string, ctx?: any) { this.log('trace', msg, ctx); }
  debug(msg: string, ctx?: any) { this.log('debug', msg, ctx); }
  info(msg: string, ctx?: any, p0?: string, fechaAyer?: Date) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: any) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: any) { this.log('error', msg, ctx); }
*/
  trace(...args: any[]) { this.log('trace', ...args); }
  debug(...args: any[]) { this.log('debug', ...args); }
  info(...args: any[]) { this.log('info', ...args); }
  warn(...args: any[]) { this.log('warn', ...args); }
  error(...args: any[]) { this.log('error', ...args); }
}

export const logger = new Logger();

const original = globalThis.console;

globalThis.console = new Proxy(original, {
  get(target, prop: string) {
    const loggers: Record<string, (...args: any[]) => void> = {
      log: (...args: any[]) => logger.info(...args),
      info: (...args: any[]) => logger.info(...args),
      warn: (...args: any[]) => logger.warn(...args),
      error: (...args: any[]) => logger.error(...args),
      debug: (...args: any[]) => logger.debug(...args),
      trace: (...args: any[]) => logger.trace(...args),
      dir: (...args: any[]) => logger.info(...args),
      assert: (assertion: boolean, ...args: any[]) => {
        if (!assertion) logger.error('Assertion failed:', ...args);
      },
      // Keep time methods working or implement them
      time: (label: string) => original.time(label),
      timeEnd: (label: string) => original.timeEnd(label),
      timeLog: (label: string, ...args: any[]) => original.timeLog(label, ...args),
    };
    
    return loggers[prop] ?? target[prop as keyof Console];
  },
});
