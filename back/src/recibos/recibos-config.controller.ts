import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";

import { Utils } from "../liquidaciones/liquidaciones.utils";
import { promises as fsPromises } from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import path from 'path';
import { mkdirSync, existsSync } from "fs";
import puppeteer, { Browser, Page } from 'puppeteer';
import { NumeroALetras, setSingular, setPlural, setCentsPlural, setCentsSingular } from "numeros_a_palabras/numero_to_word"
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "../liquidaciones/liquidaciones-banco/liquidaciones-banco.utils";
//import moment from 'moment';
import { QueryRunner } from "typeorm";

export class RecibosConfigController extends BaseController {


  async generaReciboConfig(req: Request, res: Response, next: NextFunction) {
    try {
        console.log("estoy en el back de configuracion de recibo");
    } catch (error) {
        console.error("Error en la configuracion de recibos :", error);
    }
  }

}




