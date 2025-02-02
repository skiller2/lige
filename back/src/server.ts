import express, { json, Application, Router, NextFunction, Request, Response } from "express";
import { version, author, name, description } from "./version.json";
import { DataSource, QueryFailedError } from "typeorm";
import { existsSync, mkdir, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createServer } from "http";
import { ClientException } from "./controller/baseController";

import dotenv from "dotenv"
import { exit } from "process";

dotenv.config()
export const tmpName = (dir: string) => {
  while (true) {
    const name = randomBytes(8).toString("hex") + ".tmp";
    if (!existsSync(`${dir}/${name}`)) return name;
  }
};

export class DBServer {
  public dataSource: DataSource;
  private retriesCount: number = 1;
  private timeOutDelay: number;

  constructor(retries: number, timeOutDelay: number, dataSource: DataSource) {
    this.timeOutDelay = timeOutDelay;
    this.dataSource = dataSource;
  }
  public async init() {
    return new Promise<{ res: string; ds: DataSource }>((resolve, reject) => {
      const interval = setInterval(() => {
        this.dataSource
          .initialize()
          .then(() => {
            clearInterval(interval);
            resolve({
              res: `Success: connected to Database ${this.dataSource.options.database}`,
              ds: this.dataSource,
            });
          })
          .catch((error) => {
            console.error(
              `${error.message}, retry ${this.retriesCount} in ${this.timeOutDelay} ms.`
            );
            this.retriesCount++;
          });
      }, this.timeOutDelay);
    });
  }
}

const errorResponder = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction) => {
  res.locals.stopTime = performance.now()
  let data = {}
  let message:string[] = ["Error interno, avise al administrador del sistema"]
  let status = 500
  
  if (process.env.DEBUG) {
    console.error(error);
  }

  if (error instanceof ClientException) {
    message = error.messageArr
    status = 409
    data = error.extended
  } else if (error instanceof QueryFailedError) {
    if (error.message.indexOf('Violation') > 0) {
      message = ['El registro ya existe']
      status = 409
    }
    const error2:any=error
    if (error2.number ==8152 ||  error.message.indexOf('data would be truncated') > 0) {
      message = ['Tamaño del dato muy largo']
      status = 409
    }

    if (error2.number ==547 ||  error.message.indexOf('REFERENCE constraint') > 0) {
      message = ['No se puede eliminar el registro, tiene registros relacionados']
      status = 409
    }

  }

  res.status(status).json({ msg: message, data: data, stamp: new Date(), ms: res.locals.stopTime - res.locals.startTime });
}

export class WebServer {
  public upload;
  private port: number;
  private app: Application

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.app.use(json());
    this.app.set("trust proxy", true);


    /*
    * Agrega starTime a todas las peticiones de la api 
    */
    this.app.use("*", function (req, res, next) {
      res.locals.startTime = performance.now()
      return next()
    });
  }

  public async init(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const server = createServer(this.app);
      server.listen(this.port, () => {
        resolve(`Listening on port ${this.port}`);
      });

      server.on("error", function (e) {
        // Handle your error here
        reject(e);
      });
    });
  }

  public lateInit() {
/*
    this.app.use("*",function (req:Request, res:Response, next:NextFunction) {
      console.log('pasa por aca')
      res.locals.stopTime = performance.now()
      res.json({ hola: 'hola' })
      res.end()
    });
*/
    this.app.use(errorResponder)
    this.app.set("pkg", { version, author, name, description });

    this.app.get("/", (req, res) => {
      res.json({
        author: this.app.get("pkg").author,
        name: this.app.get("pkg").name,
        description: this.app.get("pkg").description,
        version: this.app.get("pkg").version,
      });
    });
  }

  public setRoute(apiPoint: string, route: Router): Router {
    this.app.use(apiPoint, route);
    return route;
    // this.app.get()
  }
}
