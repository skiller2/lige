import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response, query } from "express";
import { mkdirSync, renameSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import { Utils } from "../liquidaciones/liquidaciones.utils";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);


export class FileUploadController extends BaseController {
     
    async getByDownloadFile(req: any, res: Response, next: NextFunction) {
        const documentId = Number(req.body.documentId);
        try {
    
          const document = await this.getFilesInfo(documentId);
    
          const finalurl = `${document[0]["path"]}`
          if (!existsSync(finalurl))
            throw new ClientException(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })
    
          res.download(finalurl, document[0]["name"])
    
        } catch (error) {
          return next(error)
        }
      }

    async getFilesInfo(documentId: Number) {


        return dataSource.query(
          `SELECT doc_id AS id, path, nombre_archivo AS name FROM lige.dbo.docgeneral WHERE doc_id = @0`, [documentId])
    
    }

    async getArchivosAnteriores(
        id: string,
        TipoSearch: string,
        req: Request,
        res: Response,
        next: NextFunction
      ) {
    
        try {
          const queryRunner = dataSource.createQueryRunner();
          let usuario = res.locals.userName
          let ip = this.getRemoteAddress(req)
          let fechaActual = new Date()
          //const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, fechaActual.getFullYear(), fechaActual.getMonth(), usuario, ip)

          let ArchivosAnteriores = []

          switch (TipoSearch) {
            case "Cliente":
                ArchivosAnteriores = await dataSource.query(
                    `SELECT 
                        doc.doc_id AS id, 
                        doc.path, 
                        doc.nombre_archivo AS nombre,  
                        doc.aud_fecha_ins AS fecha 
                    FROM lige.dbo.docgeneral doc
                     JOIN lige.dbo.doctipo tipo ON doc.doctipo_id = tipo.doctipo_id
                    WHERE 
                        doc.cliente_id = @0
                        tipo.detalle = @1 `,
                    [id,TipoSearch])
              break;
          
          }
    
          this.jsonRes(
            {
              total: ArchivosAnteriores.length,
              list: ArchivosAnteriores,
            },
    
            res
          );
    
        } catch (error) {
          return next(error)
        }
      }

      async handlePDFUpload(
        id: number,
        tipoUpload: string,
        res: Response,
        req: Request,
        Archivo: any, next: NextFunction
      ) {
        const file = req.file;
        const queryRunner = dataSource.createQueryRunner();
        let usuario = res.locals.userName;
        let ip = this.getRemoteAddress(req);
        let fechaActual = new Date();
    
        const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, fechaActual.getFullYear(), fechaActual.getMonth(), usuario, ip);
    
        try {
          const dirtmp = `${process.env.PATH_FILEUPLOAD}/temp`;
          const dirtmpNew = `${process.env.PATH_FILEUPLOAD}/${tipoUpload}/${id}`;
    
          for (const file of Archivo) {
            let docgeneral = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);
            const newFilePath = `${dirtmpNew}/${docgeneral}-${id}.pdf`;
            this.moveFile(`${file.fieldname}.pdf`, newFilePath, dirtmpNew);


            if(tipoUpload == "Cliente"){
                await this.setArchivos(
                    queryRunner,
                    Number(docgeneral),
                    periodo_id,
                    fechaActual,
                    0,
                    0,
                    file.originalname, 
                    newFilePath,
                    usuario,
                    ip,
                    fechaActual,
                    'CLI',
                    null,
                    id
                  );
            }
    
            
          }
          //this.jsonRes({}, res, 'PDF guardado con exito!');
        } catch (error) {
          this.rollbackTransaction(queryRunner)
          //return next(error)
          return next('Error processing files:' + error)
        }
      }
    
      moveFile(filename: any, newFilePath: any, dirtmp: any) {
        const originalFilePath = `${process.env.PATH_LICENCIA}/temp/${filename}`;
        console.log("originalFilePath ", originalFilePath)
        console.log("newFilePath ", newFilePath)
    
        if (!existsSync(dirtmp)) {
          mkdirSync(dirtmp, { recursive: true });
        }
        try {
          renameSync(originalFilePath, newFilePath);
        } catch (error) {
          console.error('Error moviendo el archivo:', error);
        }
    
      }  

      async setArchivos(
        queryRunner: any,
        docgeneral: number,
        periodo: number,
        fecha: Date,
        persona_id: number,
        objetivo_id: number,
        nombre_archivo: string,
        path: string,
        usuario: string,
        ip: string,
        audfecha: Date,
        doctipo_id: string,
        den_documento: number,
        id:number
    
      ) {
    
        return queryRunner.query(`INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "den_documento","cliente_id")
        VALUES
        (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14,@15);`,
          [
            docgeneral,
            periodo,
            fecha,
            persona_id,
            objetivo_id,
            path,
            nombre_archivo,
            usuario, ip, fecha,
            usuario, ip, audfecha,
            doctipo_id, den_documento,id

          ])
    
      }  

}
