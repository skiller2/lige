import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response, query } from "express";
import { mkdirSync, renameSync, existsSync} from "fs";
import { Utils } from "../liquidaciones/liquidaciones.utils";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
//import { OPS, getDocument } from "pdfjs-dist";
import { PNG } from 'pngjs';
import { randomBytes } from "crypto";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";



const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);


export class FileUploadController extends BaseController {
  pathDocuments  = (process.env.PATH_DOCUMENTS) ? process.env.PATH_DOCUMENTS : '.' 
  pathArchivos   = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
  tempFolderPath = path.join(this.pathDocuments, 'temp');

  async getByDownloadFile(req: any, res: Response, next: NextFunction) {
    const documentId = req.params.id;
    const filename = req.params.filename;
    const tableForSearch = req.params.tableForSearch;
    let finalurl = '', docname = ''
    let document = ''
    let deleteFile = false
 
    try {
      if (documentId == '0')
        throw new ClientException(`Archivo no localizado`)
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
          document = await dataSource.query(`SELECT doc_id AS id, path, nombre_archivo AS name FROM lige.dbo.docgeneral WHERE doc_id = @0`, [documentId])
          finalurl = path.join(this.pathDocuments, document[0]["path"])
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
        finalurl = await this.pdfThumb(finalurl)
        deleteFile = true
        docname = docname.replace('.pdf', '.png')
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
          ArchivosAnteriores = await queryRunner.query(`
            SELECT 
                doc.doc_id AS id, 
                doc.path, 
                doc.nombre_archivo AS nombre,  
                doc.aud_fecha_ins AS fecha,
                'pdf' AS TipoArchivo
            FROM lige.dbo.docgeneral doc
            JOIN lige.dbo.doctipo tipo ON doc.doctipo_id = tipo.doctipo_id
            WHERE 
                doc.${columnSearch} = @0 AND
                tipo.doctipo_id = @1 `,
            [id, TipoSearch])

          break;

        default:
          throw new ClientException(`Falla en busqueda de Archivo`)
          break;
      }
      // console.log('ArchivosAnteriores', ArchivosAnteriores);
      ArchivosAnteriores.map((archivo) => { return archivo.TipoArchivo = archivo.TipoArchivo.toUpperCase().trim() })

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
    ip: any,
  ) {
    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date();
    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, fechaActual.getFullYear(), fechaActual.getMonth(), usuario, ip);

    const dirtmpNew = `${process.env.PATH_DOCUMENTS}/${folder}/${keyid}`;


    for (const file of Archivo) {

      let newFilePath = ''
      //let tipoCodigo = tipoUpload === "Cliente" ? "CLI" : tipoUpload === "Objetivo" ? "OBJ" : "";

      if (!folder)
        throw new ClientException(`Error subiendo archivo`)

      console.log("file.tableForSearch", file.tableForSearch)
      switch (file.tableForSearch) {
        case "DocumentoImagenEstudio":

       

        const DocumentoImagenParametroId = 20 // CURSO
        const DocumentoImagenParametroDirectorioId = 1 // TEMP

        const DocumentoImagenEstudioId = await  queryRunner.query('SELECT MAX(DocumentoImagenEstudioId) AS DocumentoImagenEstudioId FROM DocumentoImagenEstudio')
        const den_numero = DocumentoImagenEstudioId[0]['DocumentoImagenEstudioId'] + 1
        let nameFile = `${keyid}-${den_numero}-CERTEST.${file.originalname.split('.')[1]}`
        newFilePath = `${dirtmpNew}/${nameFile}`;
        this.moveFile(`${file.fieldname}.pdf`, newFilePath, dirtmpNew);

          await this.setArchivosDocumentoImagenEstudio(
            queryRunner,
            keyid,
            file.originalname.split('.')[1],
            nameFile,
            DocumentoImagenParametroId,
            DocumentoImagenParametroDirectorioId
          )

        
          break;
        default:

        let docgeneral = await this.getProxNumero(queryRunner, 'docgeneral', usuario, ip);
         newFilePath = `${dirtmpNew}/${docgeneral}-${keyid}.pdf`;

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
          break;
      }
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
  

  static async setArchivos(
    queryRunner: any,
    doc_id: number,
    periodo: number,
    fecha: Date,
    keyfield: string,
    keyid: number,
    nombre_archivo: string,
    path: string,
    usuario: string,
    ip: string,
    audfecha: Date,
    doctipo_id: string,
    den_documento: number,
  ) {

    let persona_id = 0, objetivo_id = 0, cliente_id = 0, personalId = 0
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
      case "personalId":
        personalId = keyid
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
      if (imgArgsFoto[0].startsWith("g_"))
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


}
