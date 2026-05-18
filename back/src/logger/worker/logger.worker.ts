import { parentPort, workerData } from "worker_threads";
import { initTransport, sendToTransport } from "./transport.ts";
import { createWriteStream } from "node:fs";
import path from "node:path";

/**
 * Receive config from main thread
 */
const { logFile } = workerData;

/**
 * Decide stream INSIDE worker ✅
 */
let stream: NodeJS.WritableStream;

if (logFile === 'STDOUT') {
  stream = process.stdout;
} else {
  const filePath = path.resolve(process.cwd(), logFile);
  stream = createWriteStream(filePath, { flags: "a" });
}

initTransport(stream);

/**
 * Listen logs
 */
parentPort?.on("message", (payload) => {
  sendToTransport(payload);
});
