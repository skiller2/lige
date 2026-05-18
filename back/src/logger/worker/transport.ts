import {
  createWriteStream,
  mkdirSync
} from "node:fs";

import * as path from 'path';
import { type LogPayload } from '../logger.types.ts';

const isDev = process.env.NODE_ENV === 'dev' ? true : false;
let stream = process.stdout;

// Ensure directory exists
if (!isDev && process.env.LOG_FILE) {
  const LOG_FILE = path.resolve(process.cwd(), process.env.LOG_FILE );
  mkdirSync(path.dirname(LOG_FILE), { recursive: true });

  /**
   * Write stream (high-performance, append mode)
   */
  stream = createWriteStream(LOG_FILE, {
    flags: 'a'
  });
}
/**
 * Buffer settings
 */
const BUFFER_SIZE = 50;        // flush after N logs
const FLUSH_INTERVAL = 1000;   // or every 1 second

let buffer: string[] = [];

/**
 * Serialize log
 */
function format(payload: LogPayload): string {
  return JSON.stringify({
    level: payload.level,
    time: new Date(payload.time).toISOString(),
    message: payload.message,
    ...payload.context
  });
}

/**
 * Flush buffer to file
 */
function flush() {
  if (buffer.length === 0) return;

  const chunk = buffer.join('\n') + '\n';
  buffer = [];

  stream.write(chunk);
}

/**
 * Periodic flush (time-based)
 */
setInterval(() => {
  flush();
}, FLUSH_INTERVAL);

/**
 * Public API
 */
export function sendToTransport(payload: LogPayload) {
  buffer.push(format(payload));

  if (buffer.length >= BUFFER_SIZE) {
    flush();
  }
}

/**
 * Graceful shutdown
 */
process.on('beforeExit', () => {
  flush();
  stream.end();
});

process.on('SIGINT', () => {
  flush();
  stream.end();
  process.exit();
});
