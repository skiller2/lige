import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";


  
export class AdministradoresController extends BaseController {

  listaColumnas: any[] = [
    
    {
        id: "id",
        name: "ID Administrador",
        field: "id",
        fieldName: "adm.AdministradorId",
        type: "number",
        sortable: true,
        searchHidden: false
      },
      {
        name: "Denominación",
        type: "string",
        id: "AdministradorDenominacion",
        field: "AdministradorDenominacion",
        fieldName: "adm.AdministradorDenominacion",
        sortable: true,
        searchHidden: true,
        hidden: false,
      },
      {
        name: "Administrador",
        type: "string",
        id: "AdministradorId",
        field: "AdministradorId",
        fieldName: "adm.AdministradorId",
        searchComponent:"inputForTipoSeguroSearch",
        sortable: true,
        searchHidden: false,
        hidden: true,
      },
      {
        name: "Inactivo",
        type: "string",
        id: "AdministradorInactivo",
        field: "AdministradorInactivo",
        fieldName: "adm.AdministradorInactivo",
        searchComponent: "inputForInactivoBoolean",
        sortable: true,
        searchHidden: false,
        hidden: false,
      }

  ];

  listaColumnasClientes: any[] = [
    
    {
        id: "id",
        name: "ID",
        field: "id",
        fieldName: "id",
        type: "number",
        sortable: true,
        searchHidden: true,
        hidden: true,
      },
      {
        name: "Administrador",
        type: "number",
        id: "AdministradorId",
        field: "AdministradorId",
        fieldName: "adm.AdministradorId",
        searchComponent:"inputForTipoSeguroSearch",
        sortable: true,
        searchHidden: false,
        hidden: false,
      },
      {
        name: "Denominación",
        type: "string",
        id: "AdministradorDenominacion",
        field: "AdministradorDenominacion",
        fieldName: "adm.AdministradorDenominacion",
        sortable: true,
        searchHidden: true,
        hidden: false,
      },
      {
        name: "Desde",
        type: "date",
        id: "ClienteAdministradorDesde",
        field: "ClienteAdministradorDesde",
        fieldName: "ca.ClienteAdministradorDesde",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        searchHidden: false,
        hidden: false,
      },
      {
        name: "Hasta",
        type: "date",
        id: "ClienteAdministradorHasta",
        field: "ClienteAdministradorHasta",
        fieldName: "ca.ClienteAdministradorHasta",
        searchComponent: "inputForFechaSearch",
        sortable: true,
        searchHidden: false,
        hidden: false,
      },
      {
        name: "Cliente",
        type: "string",
        id: "ClienteId",
        field: "ClienteId",
        fieldName: "cli.ClienteId",
        searchComponent: "inputForClientSearch",
        sortable: true,
        hidden: true,
        searchHidden: false
      },
      {
        name: "Cliente",
        type: "string",
        id: "ClienteDenominacion",
        field: "ClienteDenominacion",
        fieldName: "cli.ClienteDenominacion",
        sortable: true,
        searchHidden: true,
        hidden: false,
      }

  ];



  async getAdministradoresCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getAdministradoresColsClientes(req: Request, res: Response) {
    this.jsonRes(this.listaColumnasClientes, res);
  }

  async listAdministradores(req: any, res: Response, next: NextFunction) {

    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = dataSource.createQueryRunner();
    const fechaActual = new Date()

    try {

        const administradores = await queryRunner.query(
            `SELECT adm.AdministradorId as id,adm.AdministradorDenominacion,
                CASE WHEN AdministradorInactivo = 1 THEN 'Sí' ELSE 'No'
                END AS AdministradorInactivo
            FROM Administrador adm
            WHERE ${filterSql}
            ${orderBy}`, [fechaActual])

        this.jsonRes(
            {
                total: administradores.length,
                list: administradores,
            },
            res
        );

    } catch (error) {
        return next(error)
    }

}

async listAdministradoresClientes(req: any, res: Response, next: NextFunction) {
console.log("filtros",req.body.options.filtros)
  const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnasClientes);
  const orderBy = orderToSQL(req.body.options.sort)
  const queryRunner = dataSource.createQueryRunner();
  const fechaActual = new Date()

  try {

      const administradoresClientes = await queryRunner.query(
          `SELECT  ROW_NUMBER() OVER (ORDER BY adm.AdministradorId, ca.ClienteId) AS id, 
            adm.AdministradorId,adm.AdministradorDenominacion,adm.AdministradorInactivo,ca.ClienteAdministradorDesde,
            ca.ClienteAdministradorHasta,ca.ClienteId,cli.ClienteDenominacion
          FROM Administrador adm
          LEFT JOIN ClienteAdministrador ca ON ca.ClienteAdministradorAdministradorId = adm.AdministradorId
          LEFT JOIN Cliente cli ON cli.ClienteId = ca.ClienteId
          WHERE ${filterSql}
          ${orderBy}`)

      this.jsonRes(
          {
              total: administradoresClientes.length,
              list: administradoresClientes,
          },
          res
      );

  } catch (error) {
      return next(error)
  }

}

  }


