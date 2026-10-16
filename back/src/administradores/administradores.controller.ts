import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { getConnection } from "../data-source.ts";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";


  
export class AdministradoresController extends BaseController {

  getOptions: any[] = [
    { label: 'No', value: '1' },
    { label: 'Si', value: '0' },
  ]

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
      name: "Clientes",
      id: "Clientes",
      field: "Clientes",
      type: "string",
      fieldName: "ca.ClienteId",
      searchComponent:"inputForClientSearch",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: 'AdministradorInactivo',
      field: 'AdministradorInactivo',
      fieldName: 'ISNULL(adm.AdministradorInactivo, 0)',
      name: 'Activo',
      type: 'string',
      formatter: 'collectionFormatter',
      params: { collection: this.getOptions },
      searchComponent: "inputForInactivo",
      searchType: "number",
      sortable: true,
      hidden: false,
      searchHidden: false,
    },

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
    // const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);

    try {

      const administradores = await queryRunner.query(
        `SELECT adm.AdministradorId AS id, adm.AdministradorDenominacion,
          CONVERT(VARCHAR(1), ISNULL(adm.AdministradorInactivo, 0)) AS AdministradorInactivo,
          STRING_AGG(TRIM(cli.ClienteDenominacion), ';\n') AS Clientes
        FROM Administrador adm
        LEFT JOIN ClienteAdministrador ca ON ca.ClienteAdministradorAdministradorId = adm.AdministradorId
        LEFT JOIN Cliente cli ON cli.ClienteId = ca.ClienteId
        WHERE ${filterSql}
        GROUP BY
          adm.AdministradorId,
          adm.AdministradorDenominacion,
          adm.AdministradorInactivo`, [])

      this.jsonRes(
        {
          total: administradores.length,
          list: administradores,
        },
        res
      );

    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async listAdministradoresClientes(req: any, res: Response, next: NextFunction) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnasClientes);
    const orderBy = orderToSQL(req.body.options.sort)
    const queryRunner = await getConnection(res.locals.userName);
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
    }finally {
      await queryRunner.release()
    }

  }

  async getAdminitradorInfoById(req: any, res: Response, next: NextFunction) {
    const administradorId = req.params.id;
    const queryRunner = await getConnection(res.locals.userName);
    try {
    const administradorInfo = await queryRunner.query(
      `SELECT adm.AdministradorId, adm.AdministradorDenominacion, adm.AdministradorNombreFantasia,
        adm.AdministradorInactivo, adm.AdministradorSucursalId
      FROM Administrador adm
      WHERE adm.AdministradorId = @0`, [administradorId])

      return this.jsonRes(administradorInfo, res)
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

}