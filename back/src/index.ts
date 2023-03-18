// import "reflect-metadata";
// import app from "./app";
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  getConnectionOptions,
} from "typeorm";
import { Server } from "./server";
import { makeRoutes } from "./routes/routes.module"

require("dotenv").config();

// Init App
export const server = new Server(5, 500, process.env.SERVER_API_PORT)

// try {
//   const connection = await server.init()
//   console.info(`Success: connected to Database`, connection.options.database)
//   server.lateInit()
//   makeRoutes(server)
// }
// catch (error) {
//   console.error(`Error: could not connect to Database`)
//   process.exit()
// }
server.init()
  .then((connection: Connection) => {
    console.info(`Success: connected to Database`, connection.options.database)
    server.lateInit()
    makeRoutes(server)
  })
  .catch((_) => {
    console.error(`Error: could not connect to Database`)
    process.exit()
})


// app.listen(process.env.SERVER_API_PORT, () =>
//   console.log(`listening on port ${process.env.SERVER_API_PORT}!`)
// );

// let connectionIfExists = null;

// const connectWithRetry = async (retries = 5, timeout = 500) => {
//   const connectionOptions = Object.assign(
//       await getConnectionOptions(),
//       {
//           host: process.env.DB_HOST,
//           port: process.env.DB_PORT,
//           username: process.env.DB_USER,
//           password: process.env.DB_PASS,
//         database: process.env.DB_DATABASE,
//         type: "mssql",
//         maxQueryExecutionTime: process.env.DB_MAX_EXEC_TIME,
//         logging: "all",

//       },
//       process.env.NODE_ENV === "production"
//           ? {
//                 entities: [process.env.TYPEORM_ENTITIES_DIR],
//                 subscribers: [process.env.TYPEORM_SUBSCRIBERS_DIR],
//                 migrations: [process.env.TYPEORM_MIGRATIONS_DIR]
//             }
//           : {}
//   );

//   try {
//     connectionIfExists = await createConnection(connectionOptions);
//       console.info("DB Connected");
//   } catch (e) {
//     console.error('Error conecting to DB',e);

//       if (retries > 0) {
//           setTimeout(() => {
//             console.warn(
//                   `Retrying connection, retrys remaining: ${retries}, timeout: ${timeout}`
//               );
//               connectWithRetry(retries - 1, timeout);
//           }, timeout);
//       } else {
//         console.error(new Error(`DB connection failed with retrys`));
//           return;
//       }
//   }
// };

// connectWithRetry(5, 5000);