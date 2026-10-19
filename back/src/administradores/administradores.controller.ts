import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException, ClientWarning } from "../controller/base.controller.ts";
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
      name: "id",
      field: "id",
      fieldName: "adm.AdministradorId",
      type: "number",
      hidden: true,
      sortable: true,
      searchHidden: true
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
      searchComponent:"inputForAdministradorSearch",
      searchType: "number",
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
      searchComponent:"inputForAdministradorSearch",
      searchType: "number",
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

  // Un 0 es un valor válido, por eso no se evalúa por truthy
  esVacio(valor: any):boolean { return (valor === null || valor === undefined || valor === '') }

  async validateForm(form: any, action: string, queryRunner: any) {
    let error: string[] = [];

    if (this.esVacio(form.AdministradorDenominacion)) {
      error.push('- Denominación');
    }
    if (this.esVacio(form.AdministradorNombreFantasia)) {
      error.push('- Nombre de Fantasia');
    }
    if (this.esVacio(form.AdministradorSucursalId)) {
      error.push('- Sucursal');
    }

    if (error.length) {
      error.unshift('Deben completar los siguientes campos:');
      throw new ClientWarning(error);
    }
    
    if (action == 'I') {
      // Validar que no haya duplicados
      const existing = await queryRunner.query(`
        SELECT adm.AdministradorId AS id 
        FROM Administrador adm
        WHERE adm.AdministradorDenominacion = @0
      `, [form.AdministradorDenominacion]);

      if (existing.length) {
        throw new ClientException('Ya existe un administrador con esa denominación');
      }
      
    }
  
    if (action == 'U') {
      // Validar que no haya duplicados
      const existing = await queryRunner.query(`
        SELECT adm.AdministradorId AS id 
        FROM Administrador adm
        WHERE adm.AdministradorId != @0 AND adm.AdministradorDenominacion = @1
      `, [form.AdministradorId, form.AdministradorDenominacion]);

      if (existing.length) {
        throw new ClientException('Ya existe un administrador con esa denominación');
      }

    }
  }

  async addAdminitrador(req: any, res: Response, next: NextFunction) {
    const administrador = req.body;
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      await this.validateForm(administrador, 'I', queryRunner);

      const inserted = await queryRunner.query(
        `INSERT INTO Administrador (
          AdministradorDenominacion,
          AdministradorApellidoNombre,
          AdministradorNombreFantasia,
          AdministradorInactivo,
          AdministradorSucursalId
        )
        OUTPUT INSERTED.AdministradorId
        VALUES (@0, @0, @1, @2, @3)`, 
        [ administrador.AdministradorDenominacion,
          administrador.AdministradorNombreFantasia,
          administrador.AdministradorInactivo,
          administrador.AdministradorSucursalId ]
      );

        const newId: number = inserted[0]?.AdministradorId ?? null;

      await queryRunner.commitTransaction();
      this.jsonRes({ AdministradorId: newId }, res, 'Carga Exitosa');
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async updateAdministrador(req: any, res: Response, next: NextFunction) {
    const administrador = req.body;
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      await this.validateForm(administrador, 'U', queryRunner);

      await queryRunner.query(
        `UPDATE Administrador SET
          AdministradorDenominacion = @0,
          AdministradorApellidoNombre = @0,
          AdministradorNombreFantasia = @1,
          AdministradorInactivo = @2,
          AdministradorSucursalId = @3
        WHERE AdministradorId = @4`,
        [ administrador.AdministradorDenominacion,
          administrador.AdministradorNombreFantasia,
          administrador.AdministradorInactivo,
          administrador.AdministradorSucursalId,
          administrador.AdministradorId ]
      );

      await queryRunner.commitTransaction();
      this.jsonRes({ }, res, 'Actualización Exitosa');
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

  async deleteAdministrador(req: any, res: Response, next: NextFunction) {
    const administradorId = req.params.id;
    const queryRunner = await getConnection(res.locals.userName);
    try {
      await queryRunner.startTransaction();

      throw new ClientException('DEBUG');

      // await this.validateForm(administrador, 'D', queryRunner);

      const clienteIds = await queryRunner.query(
        `SELECT ClienteId FROM ClienteAdministrador WHERE ClienteAdministradorId = @0 AND ClienteAdministradorHasta IS NULL`,
        [ administradorId ]
      );
      if (clienteIds.length > 0) {
        throw new ClientException('No se puede eliminar el administrador porque tiene clientes asociados');
      }

      await queryRunner.query(
        `DELETE FROM ClienteAdministrador WHERE ClienteAdministradorId = @0`,
        [ administradorId ]
      );

      await queryRunner.query(
        `DELETE FROM Administrador WHERE AdministradorId = @0`,
        [ administradorId ]
      );

      await queryRunner.commitTransaction();
      this.jsonRes({ }, res, 'Eliminación Exitosa');
    } catch (error) {
      return next(error)
    }finally {
      await queryRunner.release()
    }
  }

}