import {
  type Logger,
  type QueryRunner
} from 'typeorm';
import { logger } from './logger.ts';

export class TypeOrmLogger implements Logger {

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    logger.debug('SQL Query', {
      query,
      parameters
    });
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    logger.error('SQL Query Error', {
      error: error instanceof Error ? error.message : error,
      query,
      parameters
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    logger.warn('Slow Query', {
      time,
      query,
      parameters
    });
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    logger.info('Schema Build', { message });
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    logger.info('Migration', { message });
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    if (level === 'log') {
      logger.debug(message);
    } else if (level === 'info') {
      logger.info(message);
    } else if (level === 'warn') {
      logger.warn(message);
    }
  }
}
