"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSource = void 0;
var typeorm_1 = require("typeorm");
exports.dataSource = new typeorm_1.DataSource({
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
