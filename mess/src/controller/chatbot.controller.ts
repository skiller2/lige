import { ClientException } from "./base.controller";
// import fetch, { Request } from "node-fetch";
import { Response } from "express-serve-static-core";
import { NextFunction } from "express";
import { existsSync } from "fs";


export class ChatBotController {
    delay : number = 500

    getDelay(){
        return this.delay
    }

    setDelay(delay:number){
        this.delay = delay
    }

    async getChatBotDelay(req: any, res: Response, next: NextFunction) {}

    async setChatBotDelay(req: any, res: Response, next: NextFunction) {}

    async getChatBotQR(req: any, res: Response, next: NextFunction) {
      const pathArchivos = 'C:/Users/bgcol/Desktop/Programación/LinceSeguridad/lige/mess/bot.qr.png' 
      try {
        if (!existsSync(pathArchivos))
          throw new ClientException(`El archivo Imagen no existe`,{'path':pathArchivos});
        console.log('PASANDO QR');
        console.log(pathArchivos);
        
        res.download(pathArchivos);
      } catch (error) {
        return next(error)
      }
    }

}