import * as express from 'express'
import { Router } from 'express'
import * as morgan from "morgan";
import * as pkg from "../package.json";
import { Connection, ConnectionOptions, createConnection, getConnectionOptions } from 'typeorm'
require("dotenv").config();


export class Server {

    private app: express.Application = express()
    private connectionOptions: ConnectionOptions = {
        type: "mssql",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        maxQueryExecutionTime: Number(process.env.DB_MAX_EXEC_TIME),
        logging: "all",

    }

    constructor() { }
    public async init(): Promise<Connection> {

        return new Promise<Connection>((resolve, reject) => {
            this.app.listen(process.env.SERVER_API_PORT, () => {
                console.log(`Now listening on port ${process.env.SERVER_API_PORT}.`)
            })

            createConnection(this.connectionOptions)
                .then((connection) => {
                    resolve(connection)
                })
                .catch((error: Error) => {
                    reject()
                })
        }
        )
    }

    public lateInit() {

        this.app.use(morgan('dev'));
        this.app.use(express.json());

        this.app.set('pkg', pkg);

        this.app.get("/", (req, res) => {
            res.json({
                author: this.app.get('pkg').author,
                name: this.app.get('pkg').name,
                description: this.app.get('pkg').description,
                version: this.app.get('pkg').version,
            });
        })

    }

    public setRoute(apiPoint: string, route: Router): Router {
        this.app.use(apiPoint, route)

        return route
        // this.app.get()
    }


}