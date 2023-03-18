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

    private retriesLeft: number
    private retriesCount: number = 1
    private timeOutDelay: number
    private port: string

    constructor(retries: number, timeOutDelay: number, port: string) { this.retriesLeft = retries; this.timeOutDelay = timeOutDelay; this.port = port  }
    public async init(): Promise<Connection> {

        return new Promise<Connection>((resolve, reject) => {
            this.app.listen(this.port, () => {
                console.log(`Now listening on port ${this.port}.`)
            })

            const interval = setInterval(() => {
                createConnection(this.connectionOptions)
                    .then((connection) => {
                        resolve(connection)
                        clearInterval(interval)
                    })
                    .catch((err) => {
                        console.log(`Retry ${this.retriesCount}.`)
                        this.retriesCount++
                        // if (this.retriesLeft > 0) { console.log(`Retrying to connect with ${this.retriesLeft} remaining.`); this.retriesLeft -= 1;}
                        // else { reject(err); clearInterval(interval) }
                    })

            }, this.timeOutDelay)
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