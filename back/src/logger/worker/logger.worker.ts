import { parentPort } from 'worker_threads';
import pino from 'pino';
import { sendToTransport } from './transport.ts';
import { type LogPayload } from '../logger.types.ts';

const logger = pino({
  level: 'trace'
});

if (!parentPort) {
  throw new Error('Worker must be started via worker_threads');
}

parentPort.on('message', (payload: LogPayload) => {
  
  const { level, message, context } = payload;

  //logger[level]?.(context || {}, message);

  sendToTransport(payload);
  
});