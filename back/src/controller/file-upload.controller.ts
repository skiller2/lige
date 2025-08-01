import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response, query, text } from "express";
import { mkdirSync, renameSync, existsSync, copyFileSync } from "fs";
import { Utils } from "../liquidaciones/liquidaciones.utils";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
//import { OPS, getDocument } from "pdfjs-dist";
import { PNG } from 'pngjs';
import { randomBytes } from "crypto";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import { QueryRunner } from "typeorm";
import * as CryptoJS from 'crypto-js';
import { fileUploadController } from "./controller.module";
import { debug } from "console";


const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

export class FileUploadController extends BaseController {
  static pathDocuments = (process.env.PATH_DOCUMENTS) ? process.env.PATH_DOCUMENTS : '.'   //Los archivos de lige
  pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'   //Los archivos de Genexus
  tempFolderPath = path.join(FileUploadController.pathDocuments, 'temp');

  static async hashFile(filePath: string): Promise<string> {
    try {
      const hash = CryptoJS.algo.SHA256.create(); // Create a SHA256 hash instance
      const stream = fs.createReadStream(filePath);

      // Process the file in chunks
      for await (const chunk of stream) {
        hash.update(CryptoJS.enc.Latin1.parse(chunk.toString('latin1')));
      }

      // Finalize the hash
      const finalHash = hash.finalize().toString(CryptoJS.enc.Hex);
      return finalHash;
    } catch (error) {
      console.error('Error reading or hashing the file:', error);
      throw error;
    }
  }

  async getSelectTipoinFile(req: any, res: Response, next: NextFunction) {

    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.startTransaction()

      let info = await queryRunner.query(`SELECT doctipo_id,detalle FROM lige.dbo.doctipo`)
      await queryRunner.commitTransaction()
      return this.jsonRes(info, res);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }

  }


  async getByDownloadFile(req: any, res: Response, next: NextFunction) {

    const documentId = req.params.id;
    const filename = req.params.filename;
    const tableForSearch = req.params.tableForSearch;
    let finalurl = '', docname = ''
    let document = ''
    let deleteFile = false


    try {
      if (documentId == '0' || documentId=='null') throw new ClientException(`Archivo no localizado`)

      switch (tableForSearch) {
        case 'DocumentoImagenFoto':
        case 'DocumentoImagenDocumento':
        case 'DocumentoImagenEstudio':
        case 'DocumentoImagenImpuestoAFIP':
        case 'DocumentoImagenCUITCUIL':
        case 'DocumentoImagenCurso':
        case 'DocumentoImagenHabilitacion':
        case 'DocumentoImagenPsicofisico':
        case 'DocumentoImagenRenar':
        case 'DocumentoImagenCertificadoReincidencia':
        case 'DocumentoImagenPreocupacional':
          document = await dataSource.query(
            `SELECT 
                doc.${tableForSearch}Id AS id, 
                CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableForSearch}BlobNombreArchivo)) path, 
                doc.${tableForSearch}BlobNombreArchivo AS name
              FROM ${tableForSearch} doc
              JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
              WHERE doc.${tableForSearch}Id = @0`, [documentId])
          finalurl = `${this.pathArchivos}/${document[0]["path"]}`
          docname = document[0]["name"]

          break;
        case 'docgeneral':
          document = await dataSource.query(`SELECT docgen.doc_id AS id , docgen.doctipo_id, docgen.persona_id, docgen.path, docgen.nombre_archivo AS name
                FROM lige.dbo.docgeneral docgen
                LEFT JOIN lige.dbo.doctipo doctip ON doctip.doctipo_id=docgen.doctipo_id
                WHERE doc_id = @0`, [documentId]);



          finalurl = path.join(FileUploadController.pathDocuments, document[0]["path"])
          docname = document[0]["name"]
          break;
        case 'documento':
          document = await dataSource.query(`SELECT doc.DocumentoId AS id , doc.DocumentoTipoCodigo AS doctipo_id, doc.PersonalId AS persona_id, doc.DocumentoPath AS path, doc.DocumentoNombreArchivo AS name
                FROM documento doc
                LEFT JOIN lige.dbo.doctipo doctip ON doctip.doctipo_id = doc.DocumentoTipoCodigo
                WHERE doc.DocumentoId = @0`, [documentId]);

          finalurl = path.join(FileUploadController.pathDocuments, document[0]["path"])
          docname = document[0]["name"]

          break;
        case 'temp':
          finalurl = `${process.env.PATH_DOCUMENTS}/temp/${documentId}`
          docname = documentId
          break;
        default:
          throw new ClientException(`Falla en busqueda de Archivo`)
          break;
      }

      if (!existsSync(finalurl))
        throw new ClientException(`Archivo ${docname} no localizado`, { path: finalurl })
      if (tableForSearch == 'DocumentoImagenFoto' && finalurl.toLocaleLowerCase().endsWith('.pdf') && filename == 'image') {
        console.log('lo convierto');
        finalurl = await this.pdf2img(finalurl)
        deleteFile = true
        docname = docname.replace('.pdf', '.png')
      }

      if (finalurl.toLocaleLowerCase().endsWith('.pdf') && filename == 'thumb') {

        //finalurl = await this.pdfThumb(finalurl)
        ////deleteFile = true
        //docname = docname.replace('.pdf', '.png')
      }

      res.download(finalurl, docname, async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
        if (deleteFile) {
          await unlink(finalurl);
        }
      });
    } catch (error) {
      return next(error)
    }
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
        case 'DocumentoImagenCUITCUIL':
        case 'DocumentoImagenCurso':
        case 'DocumentoImagenHabilitacion':
        case 'DocumentoImagenPsicofisico':
        case 'DocumentoImagenRenar':
        case 'DocumentoImagenCertificadoReincidencia':
        case 'DocumentoImagenPreocupacional':
          ArchivosAnteriores = await queryRunner.query(`
            SELECT  doc.${tableSearch}Id AS id, 
            CONCAT('./', TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableSearch}BlobNombreArchivo)) path, 
            doc.${tableSearch}BlobNombreArchivo AS nombre , ${tableSearch}BlobTipoArchivo AS TipoArchivo
            FROM ${tableSearch} doc
            JOIN DocumentoImagenParametro param ON param.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE 
                doc.${columnSearch} = @0 AND param.DocumentoImagenParametroDe = @1`,
            [id, TipoSearch])

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
          ArchivosAnteriores = await FileUploadController.getArchivosAnterioresBydocgeneral(queryRunner, columnSearch, TipoSearch, id)
          break;
        case 'documento':
          ArchivosAnteriores = await FileUploadController.getArchivosAnterioresBydocumento(queryRunner, columnSearch, TipoSearch, id)
          break;

        default:
          throw new ClientException(`Falla en busqueda de Archivo`)
          break;
      }

      ArchivosAnteriores = await FileUploadController.mapArchivosAnteriores(ArchivosAnteriores, id)

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

  static async mapArchivosAnteriores(ArchivosAnteriores: any[], id: any) {
    ArchivosAnteriores.map((archivo) => {
      const TipoArchivo = archivo.nombre.split('.')[1]
      if (TipoArchivo.toLowerCase() == 'jpeg' || TipoArchivo.toLowerCase() == 'jpg' || TipoArchivo.toLowerCase() == 'png')
        archivo.mimetype = 'image'
      else if (TipoArchivo.toLowerCase() == 'pdf')
        archivo.mimetype = 'pdf'
      else
        archivo.mimetype = 'unknown'

      archivo.url = `api/file-upload/downloadFile/${id}/docgeneral/original`
      return archivo
    })
    return ArchivosAnteriores
  }

  static async getArchivosAnterioresBydocgeneral(queryRunner: QueryRunner, columnSearch: any, TipoSearch: any, id: any) {

    const ids = String(id).split(',').map(x => x.trim())
    let ArchivosAnteriores: any[] = []

    for (const singleId of ids) {
      const result = await queryRunner.query(`
        SELECT 
            doc.doc_id AS id, 
            doc.doctipo_id,
            doc.persona_id,
            doc.den_documento,
            doc.objetivo_id,
            doc.cliente_id,
            doc.fec_doc_ven,
            doc.path, 
            'docgeneral' AS tableForSearch,
            doc.nombre_archivo AS nombre
        FROM lige.dbo.docgeneral doc
        JOIN lige.dbo.doctipo tipo ON doc.doctipo_id = tipo.doctipo_id
        WHERE 
            doc.${columnSearch} = @0 AND
            ('${columnSearch}' = 'doc_id' OR tipo.doctipo_id = @1)
      `, [singleId, TipoSearch])

      ArchivosAnteriores.push(...result)
    }

    return ArchivosAnteriores

  }

  static async getArchivosAnterioresBydocumento(queryRunner: QueryRunner, columnSearch: any, TipoSearch: any, id: any) {

    const ids = String(id).split(',').map(x => x.trim())
    let ArchivosAnteriores: any[] = []

    for (const singleId of ids) {
      const result = await queryRunner.query(`
        SELECT 
            doc.DocumentoId AS id, 
            doc.DocumentoTipoCodigo AS doctipo_id,
            doc.PersonalId AS persona_id,
            doc.DocumentoDenominadorDocumento AS den_documento,
            doc.ObjetivoId AS objetivo_id,
            doc.DocumentoClienteId AS cliente_id,
            doc.DocumentoFechaDocumentoVencimiento AS fec_doc_ven,
            doc.DocumentoPath AS path, 
            'documento' AS tableForSearch,
            doc.DocumentoNombreArchivo AS nombre
        FROM documento doc
        JOIN lige.dbo.doctipo tipo ON doc.DocumentoTipoCodigo = tipo.doctipo_id
        WHERE 
            doc.${columnSearch} = @0 AND  tipo.doctipo_id = @1
      `, [singleId, TipoSearch])

      ArchivosAnteriores.push(...result)
    }

    return ArchivosAnteriores

  }

  static async handleDOCUpload(
    personal_id: number,
    objetivo_id: number,
    cliente_id: number,
    doc_id: number,
    fecha: Date,
    fec_doc_ven: Date,
    den_documento: string,
    anio: number,
    mes: number,
    file: any,
    usuario: any,
    ip: any,
    queryRunner: QueryRunner,
    DocumentoCliente?: any
  ) {
    let periodo_id = 0
    let fechaActual = new Date();
    if (anio && mes){
      periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)
    }else{
      anio = fecha.getFullYear()
      mes = fecha.getMonth() + 1
      periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)
    }
     
    let DocumentoClienteId = DocumentoCliente ? DocumentoCliente : null
    let detalle_documento = ''
    const doctipo_id = file.doctipo_id
    const tableForSearch = file.tableForSearch
    const ind_descarga_bot: number = file.ind_descarga_bot ? 1 : 0
    let ArchivosAnteriores = []

    if (!tableForSearch)
      throw new ClientException(`No se especificó destino -tableForSearch-`)
    if (!doctipo_id)
      throw new ClientException(`No se especificó destino -doctipo_id-`)

    //throw new ClientException(`test`)
    //if (doc_id>0 && (!file.tempfilename || file.tempfilename === '')) {
    //  throw new ClientException(`No se especificó archivo a actualizar`)
    //}

    const doctipo = await queryRunner.query(`SELECT tipo.doctipo_id value, TRIM(tipo.detalle) label, tipo.des_den_documento, tipo.path_origen FROM lige.dbo.doctipo tipo 
          WHERE tipo.doctipo_id = @0`, [doctipo_id])
    if (!doctipo.length)
      throw new ClientException(`Tipo de documento no existe`)

    const folder = fecha.getFullYear() + doctipo[0]['path_origen']
    if (!folder)
      throw new ClientException(`Error subiendo archivo`)

    let newFilePath = ''
    //let tipoCodigo = tipoUpload === "Cliente" ? "CLI" : tipoUpload === "Objetivo" ? "OBJ" : "";

    switch (file.tableForSearch) {

      case "documento":

      if (!doc_id) {
        // INSERT DOCUMENTO
        doc_id = await this.getProxNumero(queryRunner, 'documento', usuario, ip);
   
        const type = file.mimetype.split('/')[1]

        if (type == 'pdf') {
          detalle_documento = await FileUploadController.FileData(file.tempfilename)
        }

        newFilePath = `${folder}${doc_id}-${doctipo_id}-${den_documento}.${type}`;
        //console.log("newFilePath", newFilePath)
        //console.log("file.tempfilename", file.tempfilename)
        this.copyTmpFile(file.tempfilename, `${process.env.PATH_DOCUMENTS}/${newFilePath}`)

        const namefile = `${doc_id}-${doctipo_id}-${den_documento}.${type}`

        var maxid = await queryRunner.query(`Select MAX( DocumentoId ) AS DocumentoId FROM  Documento`)
        //console.log("maxid..................", maxid)

        
        await queryRunner.query(`INSERT INTO Documento (
          DocumentoId,
          DocumentoTipoCodigo, 
          PersonalId, 
          ObjetivoId, 
          DocumentoDenominadorDocumento,
          DocumentoNombreArchivo,
          DocumentoFecha,
          DocumentoFechaDocumentoVencimiento, 
          DocumentoPath,
          DocumentoDetalleDocumento, 
          DocumentoIndividuoDescargaBot, 
          DocumentoAudFechaIng,
          DocumentoAudUsuarioIng, 
          DocumentoAudIpIng, 
          DocumentoAudFechaMod, 
          DocumentoAudUsuarioMod,
          DocumentoAudIpMod,
          DocumentoClienteId,
          DocumentoAnio,
          DocumentoMes
        ) VALUES (
          @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15,@16,@17,@18,@19
        )`,
          [
            doc_id,
            doctipo_id,
            personal_id,
            objetivo_id,
            den_documento,
            namefile,
            fecha,
            fec_doc_ven,
            newFilePath,
            detalle_documento,
            ind_descarga_bot,
            fechaActual, 
            usuario, 
            ip, 
            fechaActual, 
            usuario, 
            ip,
            DocumentoClienteId,
            anio, 
            mes
          ])


          var maxid2 = await queryRunner.query(`Select MAX( DocumentoId ) AS DocumentoId FROM  Documento`)
          //console.log("maxid2..................", maxid2)

      } else {
        // UPDATE DOCUMENTO
        console.log("file update", file)
        // TODO: AGREGAR FUNCION DE ACTUALIZAR EL NOMBRE DEL ARCHIVO EN CASO DE QUE SE HAYA HECHO MODIFICACION DEL doctipo_id O den_documento
        if (file?.tempfilename != '' && file?.tempfilename != null) {

          const path = await queryRunner.query(`SELECT path FROM documento WHERE DocumentoId = @0`, [doc_id])

          const filePath = `${process.env.PATH_DOCUMENTS}/${path[0].path}`;
          const tempFilePath = `${process.env.PATH_DOCUMENTS}/temp/${file.tempfilename}`;

          // Borra el archivo si existe
          if (existsSync(filePath)) {
            await unlink(filePath);
          }

          // Copia el nuevo archivo
          copyFileSync(tempFilePath, filePath);

        }

        // Actualiza el registro
        await queryRunner.query(`
          UPDATE documento
          SET DocumentoPeriodo = @1, DocumentoFecha = @2, 
          DocumentoTipoCodigo = @5, DocumentoPersonalId = @6, DocumentoObjetivoId = @7, DocumentoDenominadorDocumento = @8, 
          DocumentoClienteId = @9, DocumentoFechaDocumentoVencimiento = @10, DocumentoIndividuoDescargaBot = @15,
          DocumentoAudUsuarioMod = @11, DocumentoAudIpMod = @12, DocumentoAudFechaMod = @13 
          WHERE DocumentoId = @0
        `, [doc_id, periodo_id, fecha, null, null, doctipo_id, personal_id, objetivo_id,
          den_documento, cliente_id, fec_doc_ven, usuario, ip, fechaActual, detalle_documento, ind_descarga_bot])


        ArchivosAnteriores = await FileUploadController.getArchivosAnterioresBydocumento(queryRunner, 'DocumentoId', doctipo_id, doc_id)

      }
      //throw new ClientException(`Error al actualizar el documento test`)
      return { doc_id, ArchivosAnteriores }

      case "DocumentoImagenEstudio":
        const DocumentoImagenParametroId = 20 // CURSO
        const DocumentoImagenParametroDirectorioId = 1 // TEMP

        const DocumentoImagenEstudioId = await queryRunner.query('SELECT MAX(DocumentoImagenEstudioId) AS DocumentoImagenEstudioId FROM DocumentoImagenEstudio')
        const den_numero = DocumentoImagenEstudioId[0]['DocumentoImagenEstudioId'] + 1
        let nameFile = `${personal_id}-${den_numero}-CERTEST.${file.originalname.split('.')[1]}`

        const DocumentoImagenEstudioRuta = await queryRunner.query('SELECT DocumentoImagenParametroDirectorioPath from DocumentoImagenParametroDirectorio WHERE DocumentoImagenParametroId = @0', [DocumentoImagenParametroId])
        const finalUrl = `${process.env.PATH_ARCHIVOS}/${DocumentoImagenEstudioRuta[0]['DocumentoImagenParametroDirectorioPath'].replace(/\\/g, '/').replace(/\/$/, '')}`

        newFilePath = `${finalUrl}/${nameFile}`
        this.copyTmpFile(`${file.fieldname}.pdf`, newFilePath)

        await this.setArchivosDocumentoImagenEstudio(
          queryRunner,
          personal_id,
          file.originalname.split('.')[1],
          nameFile,
          DocumentoImagenParametroId,
          DocumentoImagenParametroDirectorioId
        )

        ArchivosAnteriores = await FileUploadController.mapArchivosAnteriores(ArchivosAnteriores, doc_id)
        return 0
        break;
      default:

        if (!doc_id) {
          // INSERT DOCUMENTO
          doc_id = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);

          const type = file.mimetype.split('/')[1]

          // Warning: UnknownErrorException: Ensure that the `standardFontDataUrl` API parameter is provided.
          if (type == 'pdf') {
            console.log("leo", file.tempfilename)

            detalle_documento = await FileUploadController.FileData(file.tempfilename)
          }

          newFilePath = `${folder}${doc_id}-${doctipo_id}-${den_documento}.${type}`;
          console.log("newFilePath", newFilePath)
          console.log("file.tempfilename", file.tempfilename)
          this.copyTmpFile(file.tempfilename, `${process.env.PATH_DOCUMENTS}/${newFilePath}`)

          const namefile = `${doc_id}-${doctipo_id}-${den_documento}.${type}`

          await queryRunner.query(`INSERT INTO lige.dbo.docgeneral (doc_id, periodo, fecha, fec_doc_ven, persona_id, 
            objetivo_id, cliente_id, path, nombre_archivo, doctipo_id, 
            den_documento, detalle_documento,ind_descarga_bot,

            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES
          (@0, @1, @2, @3, @4, 
          @5, @6, @7, @8, @9, 
          @10, @11, @12, @13, @14,
          @15,@16,@17,@18)`,
            [
              doc_id, periodo_id, fecha, fec_doc_ven, personal_id,
              objetivo_id, cliente_id, newFilePath, namefile, doctipo_id,
              den_documento, detalle_documento, ind_descarga_bot,
              usuario, ip, fechaActual, usuario, ip, fechaActual
            ])

        } else {
          // UPDATE DOCUMENTO
          console.log("file update", file)
          // TODO: AGREGAR FUNCION DE ACTUALIZAR EL NOMBRE DEL ARCHIVO EN CASO DE QUE SE HAYA HECHO MODIFICACION DEL doctipo_id O den_documento
          if (file?.tempfilename != '' && file?.tempfilename != null) {

            const path = await queryRunner.query(`SELECT path FROM lige.dbo.docgeneral WHERE doc_id = @0`, [doc_id])

            const filePath = `${process.env.PATH_DOCUMENTS}/${path[0].path}`;
            const tempFilePath = `${process.env.PATH_DOCUMENTS}/temp/${file.tempfilename}`;

            // Borra el archivo si existe
            if (existsSync(filePath)) {
              await unlink(filePath);
            }

            // Copia el nuevo archivo
            copyFileSync(tempFilePath, filePath);

          }

          // Actualiza el registro
          await queryRunner.query(`
            UPDATE lige.dbo.docgeneral
            SET periodo = @1, fecha = @2, 
            -- path = @3, nombre_archivo = @4, detalle_documento = @14
            doctipo_id = @5, persona_id = @6, objetivo_id = @7, den_documento = @8, cliente_id = @9, fec_doc_ven = @10, ind_descarga_bot = @15,
            aud_usuario_mod = @11, aud_ip_mod = @12, aud_fecha_mod = @13 
            WHERE doc_id = @0
          `, [doc_id, periodo_id, fecha, null, null, doctipo_id, personal_id, objetivo_id,
            den_documento, cliente_id, fec_doc_ven, usuario, ip, fechaActual, detalle_documento, ind_descarga_bot])


          ArchivosAnteriores = await FileUploadController.getArchivosAnterioresBydocgeneral(queryRunner, 'doc_id', doctipo_id, doc_id)

        }
        //throw new ClientException(`Error al actualizar el documento test`)
        return { doc_id, ArchivosAnteriores }
        break;
    }
  }


  static copyTmpFile(filename: any, newFilePath: any) {
    const originalFilePath = `${process.env.PATH_DOCUMENTS}/temp/${filename}`;
    const filePath = path.dirname(newFilePath);

    if (!existsSync(filePath)) {
      // Crea el directorio y todos los directorios padres necesarios de forma recursiva
      mkdirSync(filePath, { recursive: true });
    }
    try {
      copyFileSync(originalFilePath, newFilePath);
    } catch (error) {
      console.error('Error moviendo el archivo:', error);
    }

  }

  static async setArchivosDocumentoImagenEstudio(
    queryRunner: any,
    PersonalId: number,
    DocumentoImagenEstudioBlobTipoArchivo: string,
    DocumentoImagenEstudioBlobNombreArchivo: string,
    DocumentoImagenParametroId: number,
    DocumentoImagenParametroDirectorioId: number,

  ) {
    return queryRunner.query(
      `INSERT INTO DocumentoImagenEstudio (
        "PersonalId",
        "DocumentoImagenEstudioBlobTipoArchivo",
        "DocumentoImagenEstudioBlobNombreArchivo",
        "DocumentoImagenParametroId",
        "DocumentoImagenParametroDirectorioId"
      ) VALUES (
        @0, @1, @2, @3, @4
      );`,
      [
        PersonalId,
        DocumentoImagenEstudioBlobTipoArchivo,
        DocumentoImagenEstudioBlobNombreArchivo,
        DocumentoImagenParametroId,
        DocumentoImagenParametroDirectorioId
      ]
    );
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

      const files = await fs.promises.readdir(this.tempFolderPath);
      const limiteFecha = Date.now() - (24 * 60 * 60 * 1000);
      const deletePromises = files.map(async (file) => {
        const filePath = path.join(this.tempFolderPath, file);
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

  async deleteDocumento(req, res, next) {
    const deleteId = Number(req.query[0])
    const tableForSearch = req.query[1];
    const queryRunner = dataSource.createQueryRunner();

    let document: any
    let finalurl: any

    // console.log('deleteId', deleteId, 'req.query', req.query)
    // console.log('tableForSearch', tableForSearch)

    if (!deleteId || !tableForSearch) throw new ClientException(`No se ha proporcionado un id o tabla para eliminar el archivo.`);

    try {

      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Verificar si el documento tiene descargas asociadas
      const telefonos = await dataSource.query(`
          SELECT telefono
          FROM lige.dbo.doc_descaga_log
          WHERE doc_id IN (@0)
          `, [deleteId])

      if (telefonos.length) throw new ClientException('No se puede eliminar Documentos que tienen movimientos de descarga.')

      // 
      switch (tableForSearch) {
        case 'Documento':
          document = await dataSource.query(`
                  SELECT DocumentoId AS id, path, nombre_archivo AS name
                  FROM Documento
                  WHERE DocumentoId = @0
                  `, [deleteId])
          finalurl = `${document[0]["path"]}`

          if (document.length === 0 && !finalurl) throw new ClientException(`No se ha encontrado el archivo para eliminar.`)

          if (!existsSync(finalurl)) {
            console.log(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })
          } else {
            await unlink(finalurl)
          }

          await queryRunner.query(`DELETE FROM Documento WHERE DocumentoId = @0`, [deleteId])

          break;
        case 'docgeneral':
          document = await dataSource.query(`
                  SELECT doc_id AS id, path, nombre_archivo AS name
                  FROM lige.dbo.docgeneral
                  WHERE doc_id = @0
                  `, [deleteId])
          finalurl = `${document[0]["path"]}`

          if (document.length === 0 && !finalurl) throw new ClientException(`No se ha encontrado el archivo para eliminar.`)

          if (!existsSync(finalurl)) {
            console.log(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })
          } else {
            await unlink(finalurl)
          }

          await queryRunner.query(`DELETE FROM lige.dbo.docgeneral WHERE doc_id = @0`, [deleteId])

          break;
        default:
          document = await queryRunner.query(`
            SELECT doc.${tableForSearch}Id AS id, 
            CONCAT(TRIM(dir.DocumentoImagenParametroDirectorioPathWeb), TRIM(doc.${tableForSearch}BlobNombreArchivo)) path, 
            doc.${tableForSearch}BlobNombreArchivo AS name,
            doc.PersonalId, doc.DocumentoImagenParametroId
            FROM ${tableForSearch} doc
            JOIN DocumentoImagenParametroDirectorio dir ON dir.DocumentoImagenParametroId = doc.DocumentoImagenParametroId
            WHERE doc.${tableForSearch}Id = @0`, [deleteId])
          finalurl = `${document[0]["path"]}`
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

          }
          break;
      }
      // 
      await queryRunner.commitTransaction();
      this.jsonRes({ list: [] }, res, `Archivo borrado con exito`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }

  static async deleteFile(deleteId: number, tableForSearch: string, queryRunner: QueryRunner) {

    try {

      switch (tableForSearch) {
        case 'Documento':
          await queryRunner.query(`DELETE FROM Documento WHERE DocumentoId = @0`, [deleteId])
          break;
        case 'docgeneral':
          await queryRunner.query(`DELETE FROM lige.dbo.docgeneral WHERE doc_id = @0`, [deleteId])
          break;
        default:
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

          }
          break;
      }

    } catch (error) {
      throw error
    }
  }

  addAlphaChannelToUnit8ClampedArray(unit8Array, imageWidth, imageHeight) {
    const newImageData = new Uint8ClampedArray(imageWidth * imageHeight * 4);

    for (let j = 0, k = 0, jj = imageWidth * imageHeight * 4; j < jj;) {
      newImageData[j++] = unit8Array[k++];
      newImageData[j++] = unit8Array[k++];
      newImageData[j++] = unit8Array[k++];
      newImageData[j++] = 255;
    }

    return newImageData;
  }


  saveRawImageAsPng(data: Uint8ClampedArray, width: number, height: number, outputPath: string) {
  }


  getRandomTempFileName(extension: string = ''): string {
    //    const tempDir = os.tmpdir();
    const uniqueID = randomBytes(16).toString("hex")
    const fileName = `tempfile_${uniqueID}${extension}`;
    return path.join(this.tempFolderPath, fileName);
  }

  async pdf2img(finalurl: string): Promise<string> {
    const loadingTask = getDocument(finalurl);

    const pdfDoc = await loadingTask.promise;
    const pdfPage = await pdfDoc.getPage(1);
    const operatorList = await pdfPage.getOperatorList();

    //    console.log('operatorList',operatorList)

    //    operatorList.fnArray.


    const imgIndexArr = operatorList.fnArray.reduce((acc: number[], curr: any, index: number) => {
      if (curr === OPS.paintImageXObject) {
        acc.push(index);
      }
      return acc;
    }, [])

    //const imgIndex = operatorList.fnArray.indexOf(OPS.paintImageXObject);

    let maxresol = 0
    let imgArgsFoto = []
    for (const imgIndex of imgIndexArr) {
      const imgArgs = operatorList.argsArray[imgIndex];

      const resol = Number(imgArgs[1]) * Number(imgArgs[2])
      if (resol > maxresol) {
        maxresol = resol
        imgArgsFoto = imgArgs
      }
    }

    const imgData: any = await new Promise((resolve, reject) => {
      if (imgArgsFoto[0] && imgArgsFoto[0].startsWith("g_"))
        pdfPage.commonObjs.get(imgArgsFoto[0], (imgData: any) => { resolve(imgData) })
      else
        pdfPage.objs.get(imgArgsFoto[0], (imgData: any) => { resolve(imgData) })
    })


    const png = new PNG({ width: imgData.width, height: imgData.height })
    for (let j = 0, k = 0, jj = imgData.width * imgData.height * 4; j < jj;) {
      png.data[j++] = imgData.data[k++];
      png.data[j++] = imgData.data[k++];
      png.data[j++] = imgData.data[k++];
      png.data[j++] = 255;
    }

    const outputFileName = this.getRandomTempFileName('.png');

    return new Promise((resolve, reject) => {
      png.on('end', () => { resolve(outputFileName) })
      png.on('error', (error) => { reject(error); })
      png.pack().pipe(fs.createWriteStream(outputFileName))
    })

  }

  async pdfThumb(finalurl: string): Promise<string> {
    const loadingTask = getDocument(finalurl);

    const pdfDoc = await loadingTask.promise;
    const pdfPage = await pdfDoc.getPage(1);
    const viewport = pdfPage.getViewport({ scale: 0.5 });
    const canvasFactory: any = pdfDoc.canvasFactory;

    //    viewport.width=viewport.width*2,
    //    viewport.height=viewport.height*2


    //console.log('viewport',viewport)

    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    );

    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
    };


    const renderTask = pdfPage.render(renderContext);

    await renderTask.promise;

    //  console.log('canvasAndContext',canvasAndContext)
    let imageBuffer = await canvasAndContext.canvas.encode("png");




    const image = canvasAndContext.canvas.toBuffer("image/png");
    fs.writeFileSync('C:/temp/test1.png', imageBuffer);
    fs.writeFileSync('C:/temp/test.png', imageBuffer);

    console.log('grabe')




    /*
        const operatorList = await pdfPage.getOperatorList();
        const imgIndex = operatorList.fnArray.indexOf(OPS.paintImageXObject);
        const imgArgs = operatorList.argsArray[imgIndex];
    
    
        const imgData: any = await new Promise((resolve, reject) => {
          if (imgArgs[0].startsWith("g_"))
            pdfPage.commonObjs.get(imgArgs[0], (imgData: any) => { resolve(imgData) })
          else
            pdfPage.objs.get(imgArgs[0], (imgData: any) => { resolve(imgData) })
        })
    
    
        const png = new PNG({ width: imgData.width, height: imgData.height })
        for (let j = 0, k = 0, jj = imgData.width * imgData.height * 4; j < jj;) {
          png.data[j++] = imgData.data[k++];
          png.data[j++] = imgData.data[k++];
          png.data[j++] = imgData.data[k++];
          png.data[j++] = 255;
        }
    
        const outputFileName = this.getRandomTempFileName('.png');
    
        return new Promise((resolve, reject) => {
          png.on('end', () => { resolve(outputFileName) })
          png.on('error', (error) => { reject(error); })
          png.pack().pipe(fs.createWriteStream(outputFileName))
        })
    */
    return 'C:/temp/test.png'
  }

  static async FileData(tempfilename: any) {

    let detalle_documento = ''
    const loadingTask = getDocument(`${process.env.PATH_DOCUMENTS}/temp/${tempfilename}`)
    const document = await loadingTask.promise;//Error
    for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
      const page = await document.getPage(pagenum);
      const textContent = await page.getTextContent();
      textContent.items.forEach((item: TextItem) => {
        detalle_documento += item.str + ((item.hasEOL) ? '\n' : '')
      });
    }

    return detalle_documento

  }

  static async getDocumentoIdByPeriodo(PersonalId: number, anio: number, mes: number, DocumentoTipoId: string) {
    if (!PersonalId || !anio || !mes || !DocumentoTipoId) throw new ClientException('Campos incompletos para obtener informacion del Documento')

    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()
      const doc = await queryRunner.query(`
        SELECT docgen.doc_id
        FROM lige.dbo.docgeneral docgen
        LEFT JOIN lige.dbo.liqmaperiodo perliq ON perliq.periodo_id=docgen.periodo
        WHERE docgen.persona_id=@0 AND docgen.doctipo_id=@3 and perliq.anio=@1 and perliq.mes=@2
      `, [PersonalId, anio, mes, DocumentoTipoId])

      if (doc.length > 0) {
        await queryRunner.commitTransaction()
        return doc[0].doc_id
      } else {
        await queryRunner.commitTransaction()
        return 0
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw new ClientException('Error al obtener el documento: ' + error.message);
    } finally {
      await queryRunner.release()
    }
  }



}

