import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';

const getOptionsPersonalPrestamoAprobado: any[] = [
  { label: 'Aprobado', value: 'S' },
  { label: 'Rechazado', value: 'N' },
  { label: 'Anulado', value: 'A' },
  { label: 'Pendiente', value: null }
]

const columnsExcepcionesAsistencia: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: '',
    type: 'string',
    searchType: 'string',
    sortable: true,
    hidden: true,
    searchHidden: true,
  },
  {
    id: "PersonalId", name: "Personal", field: "PersonalId",
    type: "number",
    fieldName: "per.PersonalId",
    searchComponent: "inpurForPersonalSearch",
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false,
  },
  {
    id: 'PersonalCUITCUILCUIT', name: 'CUIT', field: 'PersonalCUITCUILCUIT',
    fieldName: 'cuit.PersonalCUITCUILCUIT',
    type: 'number',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: 'ApellidoNombre', name: 'Apellido Nombre', field: 'ApellidoNombre',
    fieldName: 'ApellidoNombre',
    type: 'string',
    sortable: true,
    hidden: false,
    searchHidden: true,
  },
  {
    id: "ObjetivoCodigo", name: "Objetivo Código", field: "ObjetivoCodigo",
    fieldName: "ObjetivoCodigo",
    type: "number",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "ObjetivoId", name: "Objetivo", field: "ObjetivoId",
    fieldName: " obj.ObjetivoId",
    type: "number",
    searchComponent: "inpurForObjetivoSearch",
    searchType: 'number',
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    id: "ObjetivoDescripcion", name: "Descripcion Objetivo", field: "ObjetivoDescripcion",
    fieldName: "ObjetivoDescripcion",
    type: "string",
    sortable: true,
    hidden: false,
    searchHidden: true
  },
  {
    id: "PersonalArt14Autorizado", name: "Estado", field: "PersonalArt14Autorizado",
    type: "string",
    fieldName: "art.PersonalArt14Autorizado",
    formatter: 'collectionFormatter',
    params: { collection: getOptionsPersonalPrestamoAprobado, },
    searchComponent: "inpurForPrestamoAprobadoSearch",
    searchType: "string",
    sortable: true,
    searchHidden: false
  },
]

export class ExcepcionesAsistenciaController extends BaseController {

  async getGridColums(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columnsExcepcionesAsistencia, res)
  }

  async list(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, columnsExcepcionesAsistencia);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const periodo = req.body.periodo? new Date(req.body.periodo) : null
    const year = periodo? periodo.getFullYear() : 0
    const month = periodo? periodo.getMonth()+1 : 0
    try {
      const list = await queryRunner.query(`
        SELECT CONCAT(art.PersonalArt14Id,'-',per.PersonalId) as id, per.PersonalId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
          , art.PersonalArt14Autorizado, art.PersonalArt14FormaArt14, art.PersonalArt14CategoriaId
          , art.PersonalArt14TipoAsociadoId, art.PersonalArt14SumaFija, art.PersonalArt14AdicionalHora
          , art.PersonalArt14Horas, TRIM(cat.CategoriaPersonalDescripcion) AS CategoriaPersonalDescripcion
          , art.PersonalArt14Dia, art.PersonalArt14Tiempo, art.PersonalArt14DetalleMotivo 
          , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoDesde, art.PersonalArt14Desde) AS Desde
          , IIF(art.PersonalArt14Autorizado ='S',art.PersonalArt14AutorizadoHasta, art.PersonalArt14Hasta) AS Hasta
          , CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)) ObjetivoCodigo
          , obj.ObjetivoId
          , CONCAT(cli.ClienteDenominacion,' ',eledep.ClienteElementoDependienteDescripcion) ObjetivoDescripcion
          , art.PersonalArt14ConceptoId,con.ConceptoArt14Descripcion
          , IIF(art.PersonalArt14FormaArt14='S','Suma fija',IIF(art.PersonalArt14FormaArt14='E','Equivalencia',IIF(art.PersonalArt14FormaArt14='A','Adicional hora',IIF(art.PersonalArt14FormaArt14='H','Horas adicionales','')))) AS FormaDescripcion
          , 1 id
        FROM PersonalArt14 art 
        JOIN Personal per ON per.PersonalId = art.PersonalId
        JOIN Objetivo obj ON obj.ObjetivoId = art.PersonalArt14ObjetivoId
        JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
        JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
        LEFT JOIN ConceptoArt14 con ON con.ConceptoArt14Id = art.PersonalArt14ConceptoId
        LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId = art.PersonalArt14TipoAsociadoId  AND cat.CategoriaPersonalId = art.PersonalArt14CategoriaId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        WHERE 1=1
        -- art.PersonalId = @0 
        -- AND (art.PersonalArt14AutorizadoDesde <= @1 OR art.PersonalArt14AutorizadoDesde IS NULL) AND (art.PersonalArt14Desde <= @1 OR art.PersonalArt14Desde IS NULL) 
          AND ((art.PersonalArt14AutorizadoDesde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (ISNULL(art.PersonalArt14AutorizadoHasta,'9999-12-31') >= DATEFROMPARTS(@1,@2,1))) OR (art.PersonalArt14Autorizado is null AND (art.PersonalArt14Desde <= EOMONTH(DATEFROMPARTS(@1,@2,1))  AND (art.PersonalArt14Hasta >= DATEFROMPARTS(@1,@2,1)) )) )
          AND art.PersonalArt14Anulacion is null AND ${filterSql} ${orderBy}
      `, [ ,year,month])
      this.jsonRes(
          {
              total: list.length,
              list,
          },
          res
      );

    } catch (error) {
        return next(error)
    }

  }
}