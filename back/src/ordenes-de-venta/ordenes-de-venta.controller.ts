import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, getOptionsFromRequest } from "../impuestos-afip/filtros-utils/filtros";
import { NextFunction, Request, Response } from "express";
import { ObjetivoController } from "src/controller/objetivo.controller";

const columnasGrilla: any[] = [
  {
    name: "id",
    type: "number",
    id: "id",
    field: "id",
    fieldName: "id",
    sortable: false,
    hidden: true,
    searchHidden: true
  },
  {
    name: "CUIT Cliente",
    type: "string",
    id: "ClienteFacturacionCUIT",
    field: "ClienteFacturacionCUIT",
    fieldName: "cli.ClienteFacturacionCUIT",
    sortable: true,
    searchHidden: true,
    hidden: false,
    maxWidth: 120,
  },
  {
    name: "Cliente",
    type: "string",
    id: "ElementoDependienteId",
    field: "ElementoDependienteId",
    fieldName: "cliele.ElementoDependienteId",
    searchComponent: "inpurForClientSearch",
    sortable: true,
    hidden: true,
    searchHidden: false
  },
  {
    name: "Nombre Cliente",
    type: "string",
    id: "ClienteDenominacion",
    field: "ClienteDenominacion",
    fieldName: "cli.ClienteDenominacion",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Cod Obj",
    type: "string",
    id: "codObj",
    field: "codObj",
    fieldName: "codObj",
    sortable: true,
    searchHidden: true,
    hidden: false,
    maxWidth: 80,
  },

  {
    name: "Objetivo",
    type: "number",
    id: "ObjetivoCodigo",
    field: "ObjetivoCodigo",
    fieldName: "carg.objetivo_id",
    searchComponent: "inpurForObjetivoSearch",
    hidden: true,
    searchHidden: false
  },
  {
    name: "Nombre Obj",
    type: "string",
    id: "ClienteElementoDependienteDescripcion",
    field: "ClienteElementoDependienteDescripcion",
    fieldName: "eledep.ClienteElementoDependienteDescripcion",
    sortable: true,
    searchHidden: true,
    hidden: false,
  },
  {
    name: "Mes",
    type: "number",
    id: "Mes",
    field: "Mes",
    fieldName: "Mes",
    sortable: false,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Año",
    type: "number",
    id: "Anio",
    field: "Anio",
    fieldName: "Anio",
    sortable: false,
    hidden: false,
    searchHidden: true,
  },
  {
    name: "Total Horas Real",
    type: "number",
    id: "TotalHorasReal",
    field: "TotalHorasReal",
    fieldName: "TotalHorasReal",
    sortable: true,
    hidden: false,
  },
  {
    name: "Total Horas",
    type: "number",
    id: "TotalHoras",
    field: "TotalHoras",
    fieldName: "TotalHoras",
    sortable: true,
    hidden: false,
  },
  {
    name: "Importe Hora",
    type: 'currency',
    searchType: "float",
    id: "ImporteHora",
    field: "ImporteHora",
    fieldName: "ImporteHora",
    sortable: true,
    hidden: false,
  },
  {
    name: "Importe Fijo",
    type: 'currency',
    searchType: "float",
    id: "ImporteFijo",
    field: "ImporteFijo",
    fieldName: "ImporteFijo",
    sortable: true,
    hidden: false,
    maxWidth: 100,
  },
  {
    name: "Importe a Facturar",
    type: "currency",
    searchType: "float",
    id: "ImporteAFacturar",
    field: "ImporteAFacturar",
    fieldName: "ImporteAFacturar",
    sortable: true,
    hidden: false,
    maxWidth: 100,
  },
  {
    name: "Nro Orden Venta",
    type: "string",
    id: "NroOrdenVenta",
    field: "NroOrdenVenta",
    fieldName: "NroOrdenVenta",
    sortable: true,
    hidden: false,
    maxWidth: 120,
  },
  {
    name: "Estado",
    type: "string",
    id: "EstadoOrdenVentaDescripcion",
    field: "EstadoOrdenVentaDescripcion",
    fieldName: "EstadoOrdenVentaDescripcion",
    sortable: true,
    searchHidden: false,
    hidden: false,
    maxWidth: 120,
  },

];


export class OrdenesDeVentaController extends BaseController {
  async getGridCols(req, res) {
    this.jsonRes(columnasGrilla, res);
  }




  async getListOrdenesDeVenta(
    req: any,
    res: Response,
    next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body.filters["options"].filtros, columnasGrilla);
    //const orderBy = orderToSQL(req.body.options.sort)
    const anio = req.body.anio
    const mes = req.body.mes
    const queryRunner = dataSource.createQueryRunner();
    try {

      const listCargaLicenciaHistory = await queryRunner.query(
        `
              SELECT ROW_NUMBER() OVER (ORDER BY objimpven.ClienteId, objimpven.ClienteElementoDependienteId) as id, 
              cli.ClienteId,
              fac.ClienteFacturacionCUIT,
               TRIM(cli.ClienteDenominacion) ClienteDenominacion, 
               CONCAT(cliele.ClienteId, '/',cliele.ClienteElementoDependienteId) codObj,
               cliele.ClienteElementoDependienteDescripcion,objimpven.Mes,
                objimpven.Anio,
                 objimpven.TotalHorasReal, 
                objimpven.TotalHoras, 
                cliele.ClienteElementoDependienteId,
                objimpven.ImporteHora, 
                objimpven.ImporteFijo,
                 ordven.NroOrdenVenta, 
                 estordven.Descripcion EstadoOrdenVentaDescripcion,
         				 ((ISNULL(objimpven.TotalHoras,0)*ISNULL(objimpven.ImporteHora,0))+ ISNULL(objimpven.ImporteFijo,0)) ImporteAFacturar

            FROM ObjetivoImporteVenta objimpven
            LEFT JOIN ItemOrdenVenta iteordven on iteordven.ClienteElementoDependienteId=objimpven.ClienteElementoDependienteId and iteordven.ClienteId=objimpven.ClienteId and iteordven.Anio=objimpven.Anio and iteordven.Mes=objimpven.Mes
            LEFT JOIN OrdenVenta ordven ON ordven.NroOrdenVenta=iteordven.NroOrdenVenta
            LEFT JOIN EstadoOrdenVenta estordven ON estordven.EstadoOrdenVentaCod=ordven.EstadoOrdenVentaCod
            LEFT JOIN ClienteElementoDependiente cliele on cliele.ClienteId=objimpven.ClienteId and cliele.ClienteElementoDependienteId=objimpven.ClienteElementoDependienteId
            LEFT JOIN Cliente cli on cli.ClienteId=cliele.ClienteId
            LEFT JOIN ClienteFacturacion fac
                        ON fac.ClienteId = cli.ClienteId
                        AND fac.ClienteFacturacionDesde <= @2
                        AND ISNULL(fac.ClienteFacturacionHasta, '9999-12-31') >= @2

            WHERE objimpven.Anio=@1 AND objimpven.Mes=@0`,
        [mes, anio, new Date()])
      this.jsonRes(
        {
          total: listCargaLicenciaHistory.length,
          list: listCargaLicenciaHistory,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }
}
