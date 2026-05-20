import { DataSource } from "typeorm";
import type { QueryRunner } from "typeorm";
import { logger } from "./logger/logger.ts";
import { TypeOrmLogger } from "./logger/typeorm.logger.ts";

export const dataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  maxQueryExecutionTime: Number(process.env.DB_MAX_EXEC_TIME),
  logging: process.env.DEBUG === "true" ? true : false,
  connectionTimeout: 10000, //ms
  //entities: [Photo],
  extra: {
    trustServerCertificate: true,
    encrypt: false,

  },
  pool:{max:1000},
  
  logger: new TypeOrmLogger(),

  // optional: control what gets logged
  //logging: ['query', 'error', 'warn', 'migration']

});

export async function getConnection(user: string="local"): Promise<QueryRunner> {
  const ds = dataSource
  while (!ds.isInitialized) {
    logger.info('esparando inicialización')
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  ds.options.extra.user=user
  const queryRunner = ds.createQueryRunner();
  queryRunner.data.user=user
  return queryRunner
  //return null
  }

