import {
  type Logger,
  type QueryRunner
} from 'typeorm';
import { logger } from './logger.ts';

export class TypeOrmLogger implements Logger {

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    console.log('-------',queryRunner?.data)
    //TODO: Cuando proviene de .begintransaction or .commit queryRunner está vacio
    logger.debug('SQL Query', {
      query,
      parameters,
      user: queryRunner?.data.user || 'unknown'
    });
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    logger.error('SQL Query Error', {
      error: error instanceof Error ? error.message : error,
      query,
      parameters,
      user: queryRunner?.data.user || 'unknown'
    });
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    logger.warn('Slow Query', {
      time,
      query,
      parameters,
      user: queryRunner?.data.user || 'unknown'
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
