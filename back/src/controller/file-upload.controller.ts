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

          // switch (TipoSearch) {
          //   case "Cliente":
                ArchivosAnteriores = await dataSource.query(
                    `SELECT 
                        doc.doc_id AS id, 
                        doc.path, 
                        doc.nombre_archivo AS nombre,  
                        doc.aud_fecha_ins AS fecha 
                    FROM lige.dbo.docgeneral doc
                     JOIN lige.dbo.doctipo tipo ON doc.doctipo_id = tipo.doctipo_id
                    WHERE 
                        doc.cliente_id = @0 AND
                        tipo.detalle = @1 `,
                    [id,TipoSearch])
          //break;
          
          //}
    
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

       static async handlePDFUpload(
        id: number,
        tipoUpload: string,
        Archivo: any,
        usuario:any,
        ip:any    
      ) {
        const queryRunner = dataSource.createQueryRunner();
        let fechaActual = new Date();
        const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, fechaActual.getFullYear(), fechaActual.getMonth(), usuario, ip);
    
        try {
          const dirtmp = `${process.env.PATH_FILEUPLOAD}/temp`;
          const dirtmpNew = `${process.env.PATH_FILEUPLOAD}/${tipoUpload}/${id}`;
    
          for (const file of Archivo) {
            let docgeneral = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);
            const newFilePath = `${dirtmpNew}/${docgeneral}-${id}.pdf`;
            this.moveFile(`${file.fieldname}.pdf`, newFilePath, dirtmpNew);

            let tipoCodigo = tipoUpload === "Cliente" ? "CLI" : tipoUpload === "Objetivo" ? "OBJ" : "";

            if(tipoCodigo == "")
              throw new ClientException(`Error en el tipo de Codido al subir archivo `)
            
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
                    tipoCodigo,
                    null,
                    id
                  );
            
    
            
          }
          //this.jsonRes({}, res, 'PDF guardado con exito!');
        } catch (error) {
        }
      }
    
      static moveFile(filename: any, newFilePath: any, dirtmp: any) {
        const originalFilePath = `${process.env.PATH_FILEUPLOAD}/temp/${filename}`;
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

       static async setArchivos(
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

      static async getProxNumero(queryRunner: any, den_numerador: String, usuario: string, ip: string) {
        const fechaActual = new Date()
        let den_numero = 1
        const numerador = await queryRunner.query('SELECT den_numero FROM lige.dbo.genmanumerador WHERE den_numerador=@0', [den_numerador])
        if (numerador.length == 0) {
          await queryRunner.query(`INSERT INTO lige.dbo.genmanumerador (den_numerador,den_numero,aud_usuario_ins,aud_ip_ins,aud_fecha_ins,aud_usuario_mod,aud_ip_mod,aud_fecha_mod) 
          VALUES(@0,@1,@2,@3,@4,@5,@6,@7)`, [den_numerador, den_numero, usuario, ip, fechaActual, usuario, ip, fechaActual])
        } else {
          den_numero = numerador[0]['den_numero'] + 1
          await queryRunner.query(`UPDATE lige.dbo.genmanumerador SET den_numero=@1, aud_usuario_mod=@2,aud_ip_mod=@3,aud_fecha_mod=@4 WHERE den_numerador=@0`,
            [den_numerador, den_numero, usuario, ip, fechaActual])
        }
        return den_numero
      }

      async deleleTemporalFiles(req, res, next) {
        try {
    
          const tempFolderPath = path.join(process.env.PATH_FILEUPLOAD, 'temp');
          const files = await fs.promises.readdir(tempFolderPath);
          const limiteFecha = Date.now() - (24 * 60 * 60 * 1000);
          const deletePromises = files.map(async (file) => {
            const filePath = path.join(tempFolderPath, file);
            const stats = await stat(filePath);
            const fechaCreacion = stats.birthtime.getTime();
    
            if (fechaCreacion < limiteFecha) {
              await unlink(filePath);
              console.log(`Archivo ${file} borrado.`);
            }
          });
    
          await Promise.all(deletePromises);
          res.json({ message: 'Se borraron los archivos temporales con éxito' });
        } catch (error) {
          next(error);
        }
      }

}
