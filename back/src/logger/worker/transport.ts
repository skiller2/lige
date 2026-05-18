import { EOL } from "node:os";
import { type LogPayload } from "../logger.types.ts";

/**
 * Buffer config
 */
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 1000;

let buffer: string[] = [];
let flushing = false;

/**
 * Injected stream (set by logger.ts)
 */
let stream: NodeJS.WritableStream | null = null;

/**
 * INIT → called once from logger.ts
 */
export function initTransport(targetStream: NodeJS.WritableStream) {
  stream = targetStream;
}

/**
 * FORMAT
 */
function format(payload: LogPayload): string {
  return JSON.stringify({
    level: payload.level,
    time: new Date(payload.time).toISOString(),
    user: payload.user,
    message: payload.message,
    ...payload.context
  });
}

/**
 * FLUSH
 */
function flush() {
  if (!stream || flushing || buffer.length === 0) return;

  flushing = true;

  const chunk = buffer.join(EOL) + EOL;
  buffer = [];

  if (!stream.write(chunk)) {
    stream.once("drain", () => {
      flushing = false;
    });
  } else {
    flushing = false;
  }
}

/**
 * AUTO FLUSH
 */
setInterval(flush, FLUSH_INTERVAL).unref();

/**
 * PUBLIC API
 */
export function sendToTransport(payload: LogPayload) {
  buffer.push(format(payload));

  if (buffer.length >= BUFFER_SIZE) {
    flush();
  }
}

/**
 * SHUTDOWN
 */
export function shutdownTransport() {
  flush();
}
