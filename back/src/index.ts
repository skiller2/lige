import "reflect-metadata";
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  getConnectionOptions,
} from "typeorm";
require("dotenv").config();
import app from "./app";

app.listen(process.env.SERVER_API_PORT, () =>
  console.log(`listening on port ${process.env.SERVER_API_PORT}!`)
);

let connectionIfExists = null;

const logger = console;

//console.log("aver", process.env);


export const connectWithRetry = async (retries = 5, timeout = 500) => {
  const connectionOptions = Object.assign(
      await getConnectionOptions(),
      {
          host: process.env.DB_HOST,
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        type: "mssql",
        maxQueryExecutionTime: process.env.DB_MAX_EXEC_TIME,
        logging: "all",

      },
      process.env.NODE_ENV === "production"
          ? {
                entities: [process.env.TYPEORM_ENTITIES_DIR],
                subscribers: [process.env.TYPEORM_SUBSCRIBERS_DIR],
                migrations: [process.env.TYPEORM_MIGRATIONS_DIR]
            }
          : {}
  );

  try {
    connectionIfExists = await createConnection(connectionOptions);
      logger.info("DB Connected");
  } catch (e) {
      logger.error('Error conecting to DB',e);

      if (retries > 0) {
          setTimeout(() => {
              logger.warn(
                  `Retrying connection, retrys remaining: ${retries}, timeout: ${timeout}`
              );
              connectWithRetry(retries - 1, timeout);
          }, timeout);
      } else {
          logger.error(new Error(`DB connection failed with retrys`));
          return;
      }
  }
};

connectWithRetry(5, 5000);