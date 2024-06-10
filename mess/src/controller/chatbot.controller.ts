import { BaseController, ClientException } from "./base.controller";
// import fetch, { Request } from "node-fetch";
import { Response } from "express-serve-static-core";
import { NextFunction } from "express";
import { existsSync, readFileSync } from "fs";


export class ChatBotController extends BaseController {
    delay : number = 1000

    getDelay(){
        return this.delay
    }

    setDelay(delay:number){
        this.delay = delay
    }

    async getChatBotDelay(req: any, res: Response, next: NextFunction) {
      const delay = this.getDelay()
      return this.jsonRes(delay, res); 
    }

    async setChatBotDelay(req: any, res: Response, next: NextFunction) {
      const ms = req.body.ms
      this.setDelay(ms)
      return this.getDelay()
    }

    async getChatBotQR(req: any, res: Response, next: NextFunction) {
      const pathArchivos = './bot.qr.png' 
      try {
        if (!existsSync(pathArchivos))
          throw new ClientException(`El archivo Imagen no existe`,{'path':pathArchivos});
        
        const resBuffer = readFileSync(pathArchivos)
        res.setHeader('Content-Length', resBuffer.length);
        res.write(resBuffer);
        res.end();
      } catch (error) {
        return next(error)
      }
    }

}