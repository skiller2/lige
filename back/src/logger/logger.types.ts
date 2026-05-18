export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  message: string;
  time: number;
  context?: Record<string, unknown>;
}
