import express, {json, Application } from "express";
import { Router } from "express";
import * as pkg from "../package.json";
import { DataSource } from "typeorm";
import { existsSync, mkdir, mkdirSync } from "node:fs";

require("dotenv").config();

import * as http from "http";
import { randomBytes } from "node:crypto";

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
          .catch((err: any) => {
            console.error(
              `${err}, retry ${this.retriesCount} in ${this.timeOutDelay} ms.`
            );
            this.retriesCount++;
          });
      }, this.timeOutDelay);
    });
  }
}

export class WebServer {
  public upload;
  private port: number;
  private app: Application 

  constructor(port: number) {
    this.port = port;
    this.app =  express();
    this.app.use(json());
  }

  public async init(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const server = http.createServer(this.app);
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
    this.app.set("pkg", pkg);

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
