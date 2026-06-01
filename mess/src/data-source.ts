import { DataSource, type QueryRunner } from "typeorm";

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
  },
});

export async function getConnection(user: string): Promise<QueryRunner> {
  const ds = dataSource
  while (!ds.isInitialized) {
    console.info('esparando inicialización')
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const queryRunner = ds.createQueryRunner();
  queryRunner.data.user = user
  return queryRunner
  //return null

}
