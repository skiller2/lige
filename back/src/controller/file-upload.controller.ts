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
    const documentId = Number(req.params.id);
    const filename = req.params.filename;
    const tableForSearch = req.params.tableForSearch;
    let finalurl = '', docname=''
    try {
      if (documentId != 0) {
        const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.' 

        let document
        switch (tableForSearch) {
          case 'DocumentoImagenFoto':
          case 'DocumentoImagenDocumento':
          case 'DocumentoImagenEstudio':
          case 'DocumentoImagenImpuestoAFIP':
            document = await dataSource.query(
              `SELECT 
                doc.${tableForSearch}Id AS id, 
                CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableForSearch}BlobNombreArchivo)) path, 
                doc.${tableForSearch}BlobNombreArchivo AS name
              FROM ${tableForSearch} doc
              JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
              WHERE doc.${tableForSearch}Id = @0`, [documentId])
            break;
        case 'docgeneral':
            document = await this.getFilesInfo(documentId);
            break;
        default:
            throw new ClientException(`Falla en busqueda de Archivo`)
            break;
        }
        // console.log('document', document);
        
        finalurl = `${pathArchivos}/${document[0]["path"]}`
        docname = document[0]["name"]
      } else if (filename) {
        finalurl = `${process.env.PATH_DOCUMENTS}/temp/${filename}`
        docname = filename
      }

      if (!existsSync(finalurl))
        throw new ClientException(`Archivo ${docname} no localizado`, { path: finalurl })

      res.download(finalurl, docname, (msg) => { })

    } catch (error) {
      return next(error)
    }
  }

  async getFilesInfo(documentId: Number) {


    return dataSource.query(
      `SELECT doc_id AS id, path, nombre_archivo AS name FROM lige.dbo.docgeneral WHERE doc_id = @0`, [documentId])

  }

  async getArchivosAnteriores(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id
    const columnSearch = req.params.columnForSearch
    const TipoSearch = req.params.TipoSearch
    const tableSearch = req.params.tableForSearch
    try {
      const queryRunner = dataSource.createQueryRunner();
      // let usuario = res.locals.userName
      // let ip = this.getRemoteAddress(req)
      // let fechaActual = new Date()

      let ArchivosAnteriores = []
      switch (tableSearch) {
        case 'DocumentoImagenFoto':
        case 'DocumentoImagenDocumento':
        case 'DocumentoImagenEstudio':
        case 'DocumentoImagenImpuestoAFIP':
          ArchivosAnteriores = await queryRunner.query(`
            SELECT  doc.${tableSearch}Id AS id, 
            CONCAT('./', TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableSearch}BlobNombreArchivo)) path, 
            doc.${tableSearch}BlobNombreArchivo AS nombre , 'image' AS mimetype
            FROM ${tableSearch} doc
            JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE 
                doc.${columnSearch} = @0`,
            [id])
          
          /*  
            let imageUrl = ""
            if (ArchivosAnteriores.length && ArchivosAnteriores[0].path && (tableSearch == 'DocumentoImagenFoto' || tableSearch == 'DocumentoImagenDocumento')){
              const imagePath = process.env.PATH_ARCHIVOS ? process.env.PATH_ARCHIVOS : '.';
              imageUrl = `${imagePath}/${ArchivosAnteriores[0].path.slice(2)}`
              
            }
            // const path = (ArchivosAnteriores.length && ArchivosAnteriores[0].path)? ArchivosAnteriores[0].path :null
          // const response = path? await this.isAccessibleUrl(path) : false
          
            if (imageUrl != "") {
              const res = await fetch(imageUrl)
              const buffer = await res.arrayBuffer()
              const bufferStr = Buffer.from(buffer).toString('base64')
              ArchivosAnteriores[0].image = "data:image/jpeg;base64, " + bufferStr;
            }
*/
          break;

        case 'docgeneral':
          ArchivosAnteriores = await queryRunner.query(`
            SELECT 
                doc.doc_id AS id, 
                doc.path, 
                doc.nombre_archivo AS nombre,  
                doc.aud_fecha_ins AS fecha,
                'pdf' AS mimetype
            FROM lige.dbo.docgeneral doc
            JOIN lige.dbo.doctipo tipo ON doc.doctipo_id = tipo.doctipo_id
            WHERE 
                doc.${columnSearch} = @0 AND
                tipo.doctipo_id = @1 `,
            [id,TipoSearch])
          
          break;
      
        default:
          throw new ClientException(`Falla en busqueda de Archivo`)
          break;
      }
      // console.log('ArchivosAnteriores', ArchivosAnteriores);
      

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
    keyid: number,
    folder: string,
    doctipo_id: string,
    keyfield: string,
    Archivo: any,
    usuario: any,
    ip: any
  ) {
    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date();
    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, fechaActual.getFullYear(), fechaActual.getMonth(), usuario, ip);

    const dirtmpNew = `${process.env.PATH_DOCUMENTS}/${folder}/${keyid}`;
    for (const file of Archivo) {
      let docgeneral = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);
      const newFilePath = `${dirtmpNew}/${docgeneral}-${keyid}.pdf`;
      this.moveFile(`${file.fieldname}.pdf`, newFilePath, dirtmpNew);

      //let tipoCodigo = tipoUpload === "Cliente" ? "CLI" : tipoUpload === "Objetivo" ? "OBJ" : "";

      if (!folder)
        throw new ClientException(`Error subiendo archivo`)

      await this.setArchivos(
        queryRunner,
        Number(docgeneral),
        periodo_id,
        fechaActual,
        keyfield,
        keyid,
        file.originalname,
        newFilePath,
        usuario,
        ip,
        fechaActual,
        doctipo_id,
        null
      );



    }
  }

  static moveFile(filename: any, newFilePath: any, dirtmp: any) {
    const originalFilePath = `${process.env.PATH_DOCUMENTS}/temp/${filename}`;
    // console.log("originalFilePath ", originalFilePath)
    // console.log("newFilePath ", newFilePath)

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
    doc_id: number,
    periodo: number,
    fecha: Date,
    keyfield: string,
    keyid:number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string,
    den_documento: number,
  ) {

    let persona_id = 0, objetivo_id = 0, cliente_id = 0
    switch (keyfield) {
      case "objetivo_id":
        objetivo_id = keyid
        break;
      case "persona_id":
        persona_id = keyid
        break;
      case "cliente_id":
        cliente_id = keyid
        break;
  
      default:
        break;
    }
    
    
    
    return queryRunner.query(`INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id", "objetivo_id", "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "den_documento","cliente_id")
        VALUES
        (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14,@15);`,
      [
        doc_id,
        periodo,
        fecha,
        persona_id,
        objetivo_id,
        path,
        nombre_archivo,
        usuario, ip, fecha,
        usuario, ip, audfecha,
        doctipo_id, den_documento, cliente_id

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

      const tempFolderPath = path.join(process.env.PATH_DOCUMENTS, 'temp');
      const files = await fs.promises.readdir(tempFolderPath);
      const limiteFecha = Date.now() - (24 * 60 * 60 * 1000);
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(tempFolderPath, file);
        const stats = await stat(filePath);
        const fechaCreacion = stats.birthtime.getTime();

        if (fechaCreacion < limiteFecha) {
          await unlink(filePath);
          // console.log(`Archivo ${file} borrado.`);
        }
      });

      await Promise.all(deletePromises);
      res.json({ message: 'Se borraron los archivos temporales con éxito' });
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req, res, next) {
    const deleteId = Number(req.query[0])
    const tableForSearch = req.query[1];
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const document = await queryRunner.query(`
        SELECT doc.${tableForSearch}Id AS id, 
        CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableForSearch}BlobNombreArchivo)) path, 
        doc.${tableForSearch}BlobNombreArchivo AS name,
        doc.PersonalId, doc.DocumentoImagenParametroId
        FROM ${tableForSearch} doc
        JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
        WHERE doc.${tableForSearch}Id = @0`, [deleteId])
      const finalurl = `${document[0]["path"]}`
      const PersonalId = document[0]["PersonalId"]
      const DocumentoImagenParametroId = document[0]["DocumentoImagenParametroId"]

      if (document.length > 0) {
        if (!existsSync(finalurl)) {
          console.log(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })
        } else {
          await unlink(finalurl);
        }

        await queryRunner.query(`
          DELETE FROM ${tableForSearch}
          WHERE ${tableForSearch}Id = @0 AND PersonalId = @1
          `, [deleteId, PersonalId]
        )

        switch (tableForSearch) {
          case 'DocumentoImagenFoto':
            await queryRunner.query(`
              UPDATE Personal SET
              PersonalFotoId = NULL
              WHERE PersonalId = @0`, [PersonalId])
            break;
          case 'DocumentoImagenDocumento':
            if (DocumentoImagenParametroId == 12) {
              await queryRunner.query(`
                UPDATE PersonalDocumento SET
                PersonalDocumentoFrenteId = NULL
                WHERE PersonalId = @0`, [PersonalId])
            }
            if (DocumentoImagenParametroId == 13) {
              await queryRunner.query(`
                UPDATE PersonalDocumento SET
                PersonalDocumentoDorsoId = NULL
                WHERE PersonalId = @0`, [PersonalId])
            }
            break;
          case 'DocumentoImagenEstudio':
            await queryRunner.query(`
              UPDATE PersonalEstudio SET
              PersonalEstudioPagina1Id = NULL
              WHERE PersonalId = @0 AND PersonalEstudioPagina1Id = @1`, [PersonalId, deleteId])
            break;
          default:
            throw new ClientException(`Falla en busqueda de Archivo`)
            break;
        }
        await queryRunner.commitTransaction();
      }
      
      this.jsonRes({ list: [] }, res, `Archivo borrado con exito`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }


}
