import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"
import { info } from "pdfjs-dist/types/src/shared/util";
import { QueryRunner } from "typeorm";
import { fileURLToPath } from 'url';
import { MultiFormatReader, BarcodeFormat, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, NotFoundException } from '@zxing/library';
import path from "path";
import qrCode from 'qrcode-reader';
import fs from "fs";
import { Jimp  } from "jimp"



export class AccesoBotController extends BaseController {

    listaColumnas: any[] = [
        {
            id: "id",
            name: "id",
            field: "id",
            fieldName: "cli.ClienteId",
            type: "number",
            sortable: false,
            hidden: true,
            searchHidden: true
        },
        {
            name: " fecha de modificación",
            type: "date",
            id: "aud_fecha_mod",
            field: "aud_fecha_mod",
            fieldName: "aud_fecha_mod",
            searchComponent: "inpurForPersonalSearch",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Nombre",
            type: "string",
            id: "Nombre",
            field: "Nombre",
            fieldName: "per.PersonalApellidoNombre",
            searchComponent: "inpurForPersonalSearch",
            searchType: "string",
            searchHidden: false
        },
        {
            name: "CUIT",
            type: "number",
            id: "PersonalCUITCUILCUIT",
            field: "PersonalCUITCUILCUIT",
            fieldName: "cuit.PersonalCUITCUILCUIT",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        
        {
            name: "DNI",
            type: "number",
            id: "PersonalDocumentoNro",
            field: "PersonalDocumentoNro",
            fieldName: "doc.PersonalDocumentoNro",
            sortable: true,
            hidden: false,
            searchHidden: false
        },
        {
            name: "Número de teléfono",
            type: "number",
            id: "telefono",
            field: "telefono",
            fieldName: "reg.telefono",
            sortable: true,
            hidden: false,
            searchHidden: false
        }
       
    ];

    async getGridCols(req, res) {
        this.jsonRes(this.listaColumnas, res);
    }


    async list(req: any, res: Response, next: NextFunction) {

        const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
        const orderBy = orderToSQL(req.body.options.sort)
        const queryRunner = dataSource.createQueryRunner();
        const fechaActual = new Date()

        try {

            const regtelefonopersonal = await queryRunner.query(
            `SELECT
                reg.personal_id AS id,
                per.PersonalApellidoNombre AS Nombre, 
                cuit.PersonalCUITCUILCUIT,
                doc.PersonalDocumentoNro,
                reg.telefono,
                aud_fecha_mod
                FROM lige.dbo.regtelefonopersonal AS reg
                JOIN personal AS per ON per.PersonalId = reg.personal_id

                JOIN PersonalDocumento AS doc ON doc.PersonalId = reg.personal_id
                AND doc.PersonalDocumentoId = ( SELECT MAX(docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId) 

                LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId 
                AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)       

                WHERE 
                    ${filterSql}
            ${orderBy}`, [fechaActual])

            this.jsonRes(
                {
                    total: regtelefonopersonal.length,
                    list: regtelefonopersonal,
                },
                res
            );

        } catch (error) {
            return next(error)
        }

    }

    async getAccess(req: Request, res: Response, next: NextFunction) {
        const PersonalId = Number(req.params.PersonalId)
        const queryRunner = dataSource.createQueryRunner();
    
        try {
    
          let result = await this.getAccessQuery(queryRunner, PersonalId)
          this.jsonRes(result[0], res);
        } catch (error) {
          return next(error)
        }
      }
    
      async getAccessQuery(queryRunner: QueryRunner,PersonalId: any) {
        let selectquery = `SELECT
                reg.personal_id AS PersonalId,
                doc.PersonalDocumentoNro,
                reg.telefono,
                des_doc_ident AS codigo
                FROM lige.dbo.regtelefonopersonal AS reg
                JOIN personal AS per ON per.PersonalId = reg.personal_id

                JOIN PersonalDocumento AS doc ON doc.PersonalId = reg.personal_id
                AND doc.PersonalDocumentoId = ( SELECT MAX(docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId)
                    
            WHERE reg.personal_id = @0 `
    
        const result = await queryRunner.query(selectquery, [PersonalId])
        return result
      }


      async deleteAccess(req: Request, res: Response, next: NextFunction) {

        const PersonalId = Number(req.params.PersonalId)

        console.log("PersonalId ", PersonalId)
        const queryRunner = dataSource.createQueryRunner();
        try {
          await queryRunner.connect();
          await queryRunner.startTransaction();

          await queryRunner.query(`DELETE FROM lige.dbo.regtelefonopersonal WHERE personal_id = @0`, [PersonalId])

          this.jsonRes({ list: [] }, res, `Acceso borrado con exito`);

          await queryRunner.commitTransaction();
    
        } catch (error) {
          await this.rollbackTransaction(queryRunner)
          return next(error)
        }
    
      }

      async getAccessDni(req: Request, res: Response, next: NextFunction) {
        const PersonalId = Number(req.params.PersonalId)
        const queryRunner = dataSource.createQueryRunner();
    
        try {
    
          let result = await this.getAccessDniQuery(queryRunner, PersonalId)
          this.jsonRes(result[0], res);
        } catch (error) {
          return next(error)
        }
      }
    
      async getAccessDniQuery(queryRunner: QueryRunner,PersonalId: any) {
        let selectquery = ` SELECT PersonalDocumentoNro FROM PersonalDocumento docmax WHERE PersonalId = @0 AND TipoDocumentoId = 1`
        const result = await queryRunner.query(selectquery, [PersonalId])
        return result
      }


      async updateAcess(req: any, res: Response, next: NextFunction) {
        const queryRunner = dataSource.createQueryRunner();

        try {
            await queryRunner.startTransaction()
            const usuario = res.locals.userName
            const ip = this.getRemoteAddress(req)


            let {
                PersonalId,
                PersonalDocumentoNro,
                telefono,
                codigo,
                nuevoCodigo,
                files
          
              } = req.body

            //validaciones
            //await this.FormValidations(ObjPersonalId)

            if(files.length > 0)
                await this.QrValidate(files)

            const ClienteFechaAlta = new Date()
            ClienteFechaAlta.setHours(0, 0, 0, 0)


            //let ClienteAdministradorId = await this.ClienteAdministrador(queryRunner, ObjCliente, ClienteId)

        
            await queryRunner.commitTransaction()
            return this.jsonRes(PersonalId, res, 'Modificación  Exitosa');
        } catch (error) {
            await this.rollbackTransaction(queryRunner)
            return next(error)
        } finally {
            await queryRunner.release()
        }
    }


    async FormValidations(form: any) {


        if (!form.PersonalDocumentoNro) {
            throw new ClientException(`No posee DNI.`)
        }

        if (!form.PersonalId) {
            throw new ClientException(`Debe completar el campo Persona.`)
        }

        if (!form.telefono || !/^(549)\d+$/.test(form.telefono)) {
            throw new ClientException(`Debe completar el campo telefono con un número válido que comience con "549".`);
        }

        // if (form.files <= 0 || form.files > 2) {
        //     throw new ClientException(`Debe cargar dos imagenes DNI frente y DNI Dorso".`);
        // }


    }


    async QrValidate(files:any){

    const results = [];

    for (const file of files) {

    const fullPath = path.join(file.destination, file.filename);
    const normalizedPath = fullPath.replace(/\\/g, '/');

        try {
          
            const readQRCode = async (fileName) => {
                const filePath = normalizedPath
                console.log("filePath ",filePath)
                try {
                    if (fs.existsSync(filePath)) {
                        const img = await Jimp.read(fs.readFileSync(filePath));
                        const qr = new qrCode();
                        const value = await new Promise((resolve, reject) => {
                            qr.callback = (err, v) => err != null ? reject(err) : resolve(v);
                            qr.decode(img.bitmap);
                        });
                        return value;
                    }
                } catch (error) {
                    return error.message
                }
            }
            
            readQRCode(normalizedPath).then(console.log).catch(console.log)
        } catch (error) {
            if (error instanceof NotFoundException) {
            console.error(`No se encontró un código QR en la imagen ${file.filename}.`);
            results.push({ error: "No se encontró un código QR en la imagen." });
            } else {
            console.error(`Error en la imagen ${file.filename}:`, error.message);
            results.push({ error: error.message });
            }
        }
    }

    return results;

    }
    
}
