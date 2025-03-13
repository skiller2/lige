import { NextFunction, Response } from "express";
import { BaseController, ClientException } from "./baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { QueryRunner } from "typeorm";

const listaColumnas: any[] = [
  {
    id: "id",
    name: "id",
    field: "id",
    fieldName: "id",
    type: "number",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "CUIT",
    type: "string",
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Apellido Nombre",
    type: "string",
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    fieldName: "CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre))",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Tipo",
    type: "string",
    id: "TipoEstudioDescripcion",
    field: "TipoEstudioDescripcion",
    fieldName: "tipest.TipoEstudioDescripcion",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Título",
    type: "string",
    id: "PersonalEstudioTitulo",
    field: "PersonalEstudioTitulo",
    fieldName: "perest.PersonalEstudioTitulo",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Curso",
    type: "string",
    id: "CursoHabilitacionDescripcion",
    field: "CursoHabilitacionDescripcion",
    fieldName: "cur.CursoHabilitacionDescripcion",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Fecha Otorgado",
    type: "date",
    id: "PersonalEstudioOtorgado",
    field: "PersonalEstudioOtorgado",
    fieldName: "perest.PersonalEstudioOtorgado",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    name: "Hasta",
    type: "date",
    id: "PersonalEstudioHasta",
    field: "PersonalEstudioHasta",
    fieldName: "perest.PersonalEstudioHasta",
    sortable: true,
    hidden: false,
    searchHidden: true
  }
];

export class EstudioController extends BaseController {
  private async geEstadosEstudioQuery(queryRunner: any) {
    return await queryRunner.query(`
            SELECT est.EstadoEstudioId value, TRIM(est.EstadoEstudioDescripcion) label
            FROM EstadoEstudio est`)
  }

  async geEstadosEstudio(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.geEstadosEstudioQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getTiposEstudioQuery(queryRunner: any) {
    return await queryRunner.query(`
            SELECT tipo.TipoEstudioId value, TRIM(tipo.TipoEstudioDescripcion) label
            FROM TipoEstudio tipo`)
  }

  async getTiposEstudio(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTiposEstudioQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }


  async getGridCols(req, res) {
    this.jsonRes(listaColumnas, res);
  }


  async list(req: any, res: Response, next: NextFunction) {


    //const filterSql = filtrosToSql(req.body.filters["options"].filtros, listaColumnas)

    const filterSql = filtrosToSql(req.body.options.filtros, listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)

    //const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    try {
      const objetivos = await queryRunner.query(
        `SELECT 
          ROW_NUMBER() OVER (ORDER BY perest.PersonalEstudioId) as id,
          CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
          ,cuit.PersonalCUITCUILCUIT
          ,perest.PersonalEstudioId
          ,perest.PersonalId
          ,perest.PersonalEstudioTitulo
          ,perest.PersonalEstudioOtorgado
          ,perest.PersonalEstudioHasta
          ,tipest.TipoEstudioDescripcion
          ,cur.CursoHabilitacionDescripcion

        FROM PersonalEstudio perest

        LEFT JOIN TipoEstudio tipest ON tipest.TipoEstudioId=perest.TipoEstudioId
        LEFT JOIN Personal per ON per.PersonalId=perest.PersonalId
        LEFT JOIN CursoHabilitacion cur ON cur.CursoHabilitacionId=perest.PersonalEstudioCursoId
        LEFT JOIN ModalidadCurso modcur ON modcur.ModalidadCursoCodigo=cur.ModalidadCursoCodigo

        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId 
                AND cuit.PersonalCUITCUILId = (
                    SELECT MAX(cuitmax.PersonalCUITCUILId) 
                    FROM PersonalCUITCUIL cuitmax 
                    WHERE cuitmax.PersonalId = per.PersonalId
                )
        WHERE ${filterSql} ${orderBy}`
      )

      this.jsonRes(
        {
          total: objetivos.length,
          list: objetivos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }

  }
}