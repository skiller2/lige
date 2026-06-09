import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import type { NextFunction, Request, Response } from "express";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";
import type { QueryRunner } from "typeorm";

const columns: any[] = [
  {
    id: 'id', name: 'id', field: 'id',
    fieldName: "obj.CustodiaCodigo",
    sortable: true,
    type: 'string',
    searchType: "string",
    searchHidden: true,
    hidden: true,
  },
  {
    id: "PersonalCUITCUILCUIT",
    field: "PersonalCUITCUILCUIT",
    name: "CUIT",
    fieldName: "cuit.PersonalCUITCUILCUIT",
    type: "string",
    sortable: true,
    searchHidden: true,
  },
  {
    id: "ApellidoNombre",
    field: "ApellidoNombre",
    name: "Apellido Nombre",
    type: "string",
    fieldName: "per.PersonalId",
    searchComponent: "inputForPersonalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SucursalDescripcion",
    field: "SucursalDescripcion",
    name: "Sucursal",
    type: "string",
    fieldName: "suc.SucursalId",
    searchComponent: "inputForSucursalSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: false,
  },
  {
    id: "SituacionRevistaId",
    field: "SituacionRevistaId",
    name: "Situacion Revista",
    type: "number",
    fieldName: "sitrev.PersonalSituacionRevistaSituacionId",
    searchComponent: "inputForSituacionRevistaSearch",
    searchType: "number",
    sortable: true,
    searchHidden: false,
    hidden: true,
  },
  {
    id: "GrupoActividadDetalle",
    field: "GrupoActividadDetalle",
    name: "Grupo Actividad",
    type: "string",
    fieldName: "ga.GrupoActividadId",
    searchComponent: 'inputForGrupoActividadSearch',
    searchType: "number",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoCBU",
    field: "PersonalBancoCBU",
    name: "CBU",
    type: "string",
    fieldName: "pb.PersonalBancoCBU",
    searchType: "string",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "BancoDescripcion",
    field: "BancoDescripcion",
    name: "Banco",
    type: "string",
    fieldName: "b.BancoDescripcion",
    searchType: "number",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoDesde",
    field: "PersonalBancoDesde",
    name: "Desde",
    type: "date",
    fieldName: "pb.PersonalBancoDesde",
    searchComponent: "inputForFechaSearch",
    searchType: "date",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "PersonalBancoHasta",
    field: "PersonalBancoHasta",
    name: "Hasta",
    type: "date",
    fieldName: "pb.PersonalBancoHasta",
    searchComponent: "inputForFechaSearch",
    searchType: "date",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
  {
    id: "IndNuevaCuenta",
    field: "IndNuevaCuenta",
    name: "Nueva Cuenta",
    type: "string",
    fieldName: "pb.IndNuevaCuenta",
    formatter: 'collectionFormatter',
    params: { collection: getOptionsSINO },
    // searchComponent: "inputForFechaSearch",
    searchType: "number",
    sortable: false,
    hidden: false,
    searchHidden: false
  },
]

export class CuentasBancariasController extends BaseController {

  async getColumnsGrid(req: any, res: Response, next: NextFunction) {
    return this.jsonRes(columns, res)
  }

  async getCuentasBancariasQuery(queryRunner: any, filterSql: any, orderBy: any) {
    const now = new Date();
    return await queryRunner.query(`
      SELECT CONCAT(pb.PersonalId, '-',PersonalBancoId, '-', pb.PersonalBancoCBU) id,
        pb.PersonalId, PersonalBancoId, pb.PersonalBancoBancoId, pb.PersonalBancoCBU, b.BancoDescripcion, pb.PersonalBancoDesde, pb.PersonalBancoHasta, CAST(pb.IndNuevaCuenta AS VARCHAR(1)) AS IndNuevaCuenta
        , CONCAT(TRIM(per.PersonalApellido), ', ', trim(per.PersonalNombre)) ApellidoNombre, sitrev.sitRevCom, sitrev.PersonalSituacionRevistaSituacionId
        , cuit.PersonalCUITCUILCUIT, suc.SucursalDescripcion, ga.GrupoActividadId, ga.GrupoActividadDetalle,
        1
      FROM PersonalBanco pb
      JOIN Banco b on b.BancoId=pb.PersonalBancoBancoId
      JOIN Personal per on per.PersonalId=pb.PersonalId
      LEFT JOIN (
        SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde,
          CASE 
            WHEN p.PersonalSituacionRevistaId IS NOT NULL THEN  
              CONCAT(TRIM(s.SituacionRevistaDescripcion), ' (Desde: ', 
                FORMAT(p.PersonalSituacionRevistaDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
                CASE WHEN p.PersonalSituacionRevistaHasta IS NULL THEN '' 
                    ELSE FORMAT(p.PersonalSituacionRevistaHasta, 'dd/MM/yyyy') 
                END, ')'
              )
            ELSE '' 
          END AS sitRevCom
        FROM PersonalSituacionRevista p
        JOIN SituacionRevista s
        ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= @0 AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >=@0
      ) sitrev ON sitrev.PersonalId = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN PersonalSucursalPrincipal sucper ON sucper.PersonalId = per.PersonalId AND sucper.PersonalSucursalPrincipalId = (SELECT MAX(a.PersonalSucursalPrincipalId) PersonalSucursalPrincipalId FROM PersonalSucursalPrincipal a WHERE a.PersonalId = per.PersonalId)
      LEFT JOIN Sucursal suc ON suc.SucursalId=sucper.PersonalSucursalPrincipalSucursalId
      LEFT JOIN (
          SELECT 
            gap.GrupoActividadPersonalPersonalId,
            ga.GrupoActividadNumero, ga.GrupoActividadId,gap.GrupoActividadPersonalDesde,gap.GrupoActividadPersonalHasta,

            CASE 
                WHEN ga.GrupoActividadId IS NOT NULL THEN  
                    CONCAT(TRIM(ga.GrupoActividadDetalle), ' (Desde: ', 
                            FORMAT(gap.GrupoActividadPersonalDesde, 'dd/MM/yyyy'), ' - Hasta: ', 
                            CASE WHEN gap.GrupoActividadPersonalHasta IS NULL THEN 'Actualidad' 
                                ELSE FORMAT(gap.GrupoActividadPersonalHasta, 'dd/MM/yyyy') 
                            END, ')'
                    )
                ELSE '' 
            END AS GrupoActividadDetalle
          FROM GrupoActividadPersonal gap
          LEFT JOIN GrupoActividad ga ON ga.GrupoActividadId = gap.GrupoActividadId
          WHERE CAST(gap.GrupoActividadPersonalDesde AS DATE) <= @0
            AND ISNULL(gap.GrupoActividadPersonalHasta,'9999-12-31') >= @0
      ) ga ON ga.GrupoActividadPersonalPersonalId= per.PersonalId

      Where ((@0 >=pb.PersonalBancoDesde and @0<= isnull(pb.PersonalBancoHasta, '9999-12-31')) or @0 <= pb.PersonalBancoDesde) 
      and (${filterSql})
      ${orderBy}
    `, [now])
  }

  async getCuentasBancarias(req: any, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName);
    try {
      const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null };
      const filterSql = filtrosToSql(options.filtros, columns);
      const orderBy = orderToSQL(options.sort)

      const lista: any[] = await this.getCuentasBancariasQuery(queryRunner, filterSql, orderBy)

      this.jsonRes(lista, res);
    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

}