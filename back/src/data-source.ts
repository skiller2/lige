import { DataSource, QueryRunner } from "typeorm";

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
  pool:{max:1000}
});

export async function getConnection(): Promise<QueryRunner> {
  const ds = dataSource
  while (!ds.isInitialized) {
    console.log('esparando inicialización')
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log('creo queryRunner')
  //return ds.createQueryRunner();
  return null
  }

