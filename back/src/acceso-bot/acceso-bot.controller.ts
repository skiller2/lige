import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { QueryResult } from "typeorm";
import { FileUploadController } from "../controller/file-upload.controller"
import { info } from "pdfjs-dist/types/src/shared/util";
import { QueryRunner } from "typeorm";


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

  
    
}
