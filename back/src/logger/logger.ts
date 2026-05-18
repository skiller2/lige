import { Worker } from 'worker_threads';
import pino from 'pino';
import { type LogPayload, type LogLevel } from './logger.types.ts';

const isProd = process.env.NODE_ENV !== "dev";

class Logger {
  private worker: Worker;
  private devLogger?: pino.Logger;

  constructor() {
    const workerPath = isProd ? "./logger/worker/logger.worker.js" : "./worker/logger.worker.ts";
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

  private log(level: LogLevel, message: string, context?: any) {
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

  trace(msg: string, ctx?: any) { this.log('trace', msg, ctx); }
  debug(msg: string, ctx?: any) { this.log('debug', msg, ctx); }
  info(msg: string, ctx?: any, p0?: string, fechaAyer?: Date) { this.log('info', msg, ctx); }
  warn(msg: string, ctx?: any) { this.log('warn', msg, ctx); }
  error(msg: string, ctx?: any) { this.log('error', msg, ctx); }
}

export const logger = new Logger();
