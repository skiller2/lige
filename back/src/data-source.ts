import { DataSource } from "typeorm";

export const dataSource = new DataSource({
    type: "mssql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    maxQueryExecutionTime: Number(process.env.DB_MAX_EXEC_TIME),
    logging: "all",
    connectionTimeout: 10000, //ms
    //entities: [Photo],
    extra: {
        trustServerCertificate: true
    }
})