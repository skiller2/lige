import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../../controller/baseController";
import { dataSource } from "../../data-source";
import { LiqBanco } from "../../schemas/ResponseJSON";
import { Filtro, Options } from "../../schemas/filtro";
import xlsx, { WorkSheet } from 'node-xlsx';
import Excel from 'exceljs';


//import path from "path";
import {
  PDFDocument,
  PDFEmbeddedPage,
  PDFPage,
  PDFPageDrawPageOptions,
  PageSizes,
  degrees,
  rgb,
} from "pdf-lib";

import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  write,
  writeFileSync,
  writeSync,
} from "fs";
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "./liquidaciones-banco.utils";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "../../impuestos-afip/filtros-utils/filtros";
import { tmpName } from "../../server";
import { format, promisify } from "node:util";
import { once } from "events";
import { Utils } from "../liquidaciones.utils";

export class LiquidacionesBancoController extends BaseController {

  directory = process.env.PATH_BANCO || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }

  listaColumnas: any[] = [
    {
      id: "PersonalId",
      name: "Personal Id",
      field: "PersonalId",
      fieldName: "per.PersonalId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
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
      name: "Situación Revista",
      type: "string",
      id: "SituacionRevistaDescripcion",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "CBU",
      type: "number",
      id: "PersonalBancoCBU",
      field: "PersonalBancoCBU",
      fieldName: "perban.PersonalBancoCBU",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "movpos.importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Banco",
      type: "string",
      id: "BancoDescripcion",
      field: "BancoDescripcion",
      fieldName: "banc.BancoDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "BancoId",
      type: "number",
      id: "BancoId",
      field: "BancoId",
      fieldName: "banc.BancoId",
      sortable: true,
      hidden: true,
      searchHidden: true
    }


  ];

  listaColumnasAyuda: any[] = [
    {
      id: "PersonalId",
      name: "Personal Id",
      field: "PersonalId",
      fieldName: "per.PersonalId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
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
      name: "Situación Revista",
      type: "string",
      id: "SituacionRevistaDescripcion",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "CBU",
      type: "number",
      id: "PersonalBancoCBU",
      field: "PersonalBancoCBU",
      fieldName: "perban.PersonalBancoCBU",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "ade.importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Banco",
      type: "string",
      id: "BancoDescripcion",
      field: "BancoDescripcion",
      fieldName: "banc.BancoDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    }

  ];

  listaColumnasMovimientos: any[] = [
    {
      id: "PersonalId",
      name: "Personal Id",
      field: "PersonalId",
      fieldName: "PersonalId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "ApellidoNombre",
      field: "ApellidoNombre",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "number",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "PersonalCUITCUILCUIT",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    // {
    //   name: "Situación Revista",
    //   type: "string",
    //   id: "SituacionRevistaDescripcion",
    //   field: "SituacionRevistaDescripcion",
    //   fieldName: "sit.SituacionRevistaDescripcion",
    //   sortable: true,
    //   hidden: false,
    //   searchHidden: false
    // },
    {
      name: "CBU",
      type: "number",
      id: "cbu",
      field: "cbu",
      fieldName: "cbu",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Banco",
      type: "string",
      id: "bancodescripcion",
      field: "bancodescripcion",
      fieldName: "bancodescripcion",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    //  {
    //    name: "Nro Envio",
    //    type: "number",
    //    id: "NroEnvio",
    //    field: "NroEnvio",
    //    fieldName: "Nro Envio",
    //    sortable: true,
    //    hidden: true,
    //    searchHidden: true
    // },
    {
      name: "Fecha",
      type: "string",
      id: "fecha",
      field: "fecha",
      fieldName: "fecha",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "Tipo Cuenta",
      type: "string",
      id: "tipocuenta_id",
      field: "tipocuenta_id",
      fieldName: "tipocuenta_id",
      sortable: true,
      hidden: false,
      searchHidden: false
    },


  ];

  async getBancoSaldo(anio: Number, mes: Number, filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaColumnas);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return dataSource.query(
      `SELECT CONCAT(per.PersonalId,movpos.tipocuenta_id) as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion,movpos.tipocuenta_id, movpos.importe, 'CUE' as ind_imputacion,
      sit.SituacionRevistaDescripcion
      FROM Personal per
      JOIN(SELECT liq.persona_id, liq.tipocuenta_id, SUM(liq.importe * tipo.signo) importe FROM lige.dbo.liqmamovimientos liq
      JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = liq.tipo_movimiento_id
      JOIN lige.dbo.liqmaperiodo per ON per.periodo_id = liq.periodo_id AND per.anio=@1 AND per.mes=@2

              GROUP BY liq.persona_id, liq.tipocuenta_id HAVING SUM(liq.importe* tipo.signo) > 0) AS movpos ON movpos.persona_id = per.PersonalId
      LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId  AND perban.PersonalBancoId = ( SELECT MAX(perbanmax.PersonalBancoId) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId AND ISNULL(perbanmax.PersonalBancoHasta,'9999-12-31') >= @0) 
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaDesde<=@0 AND  ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= @0
      LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
      
      
      LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId

        WHERE  (${filterSql}) 
        ${orderBy}
        `, [stmactual, anio, mes])

  }

  async getBancoSaldoAyudaAsistencial(anio: Number, mes: Number, filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaColumnas);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return dataSource.query(
      `SELECT CONCAT(per.PersonalId,'-',ade.PersonalAdelantoId ) as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,
      ade.PersonalAdelantoMontoAutorizado AS importe, ade.PersonalAdelantoAplicaEl,
      tipo.tipo_movimiento_id, tipo.des_movimiento,
      ade.PersonalAdelantoLiquidoFinanzas,
      'G' as tipocuenta_id,
      'ADE' as ind_imputacion,
      sit.SituacionRevistaDescripcion,
          1
              FROM Personal per
              JOIN PersonalAdelanto ade ON ade.PersonalId = per.PersonalId AND ade.PersonalAdelantoAprobado='S' AND ISNULL(ade.PersonalAdelantoLiquidoFinanzas,0) =0
              JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = 1
              LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.PersonalBancoId = ( SELECT MAX(perbanmax.PersonalBancoId) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId)
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaDesde<=@2 AND  ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= @2
              LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
            
              LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
              
      WHERE (${filterSql}) 
      ${orderBy}
      `, [anio, mes, stmactual])

  }

  async getMovimientosPendientes(filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaColumnasMovimientos);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return dataSource.query(
      `
      SELECT CONCAT(liq.banco_id,'-',liq.envio_nro,'-',liq.persona_id,'-',liq.tipocuenta_id) id, liq.persona_id,liq.cbu,liq.importe,liq.banco_id,liq.envio_nro,liq.fecha,liq.tipocuenta_id,banc.bancodescripcion, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre
      FROM lige.dbo.liqmvbanco liq
      JOIn Personal per ON per.PersonalId = liq.persona_id
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      JOIN banco AS banc ON banc.BancoId = liq.banco_id WHERE ${filterSql} ${orderBy}
    `)

  }


  async getByLiquidacionesBanco(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)

    try {
      const banco = await this.getBancoSaldo(anio, mes, req.body.options.filtros, req.body.options.sort)
      this.jsonRes(
        {
          total: banco.length,
          list: banco,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getByMovimientos(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)


    try {
      const movimientosPendientes = await this.getMovimientosPendientes(req.body.options.filtros, req.body.options.sort)

      this.jsonRes(
        {
          total: movimientosPendientes.length,
          list: movimientosPendientes,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getByLiquidacionesBancoAyudaAsistencial(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)

    try {

      const ayuda = await this.getBancoSaldoAyudaAsistencial(anio, mes, req.body.options.filtros, req.body.options.sort)

      this.jsonRes(
        {
          total: ayuda.length,
          list: ayuda,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getLiquidacionesBancoCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getLiquidacionesBancoMovimientosPendientesCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnasMovimientos, res);
  }

  async getLiquidacionesBancoColsAyuda(req: Request, res: Response) {
    this.jsonRes(this.listaColumnasAyuda, res);
  }




  async eliminaMovimientosBanco(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const banco_id = Number(req.body.banco_id)
      const pend = await queryRunner.query('SELECT * FROM lige.dbo.liqmvbanco WHERE banco_id = @0', [banco_id])

      if (pend.length == 0)
        throw new ClientException('No hay archivo generado pendiente para el banco seleccionado')

      await queryRunner.query('DELETE FROM lige.dbo.liqmvbanco WHERE banco_id = @0', [banco_id])
      await queryRunner.commitTransaction();
      return this.jsonRes([], res, `Se eliminó el archivo pendiente`);

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }


  async confirmaMovimientosBanco(req: Request, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner()
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const liqmvbanco = await queryRunner.query('SELECT mv.*, ban.BancoDescripcion, per.anio, per.mes FROM lige.dbo.liqmvbanco mv JOIN Banco ban ON ban.BancoId = mv.banco_id JOIN lige.dbo.liqmaperiodo per ON per.periodo_id=mv.periodo_id', [])


      if (liqmvbanco.length == 0)
        throw new ClientException('No hay movimientos pendientes de confirmar')

      let movimiento_id = await Utils.getMovimientoId(queryRunner)
      const tipo_movimiento_id_ade = 1 //Adelanto
      const tipo_movimiento_id = 11 //Depósito
      for (let row of liqmvbanco) {
        if (row.ind_imputacion == 'CUE') {
          await queryRunner.query(`INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe, tipocuenta_id,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
           VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13,@14)`,
            [++movimiento_id,
            row.periodo_id,
              tipo_movimiento_id,
              fechaActual,
            `Banco: ${row.BancoDescripcion.trim()}, Envio: ${row.envio_nro}, CBU ${LiquidacionesBancoController.isEmpty(row.cbu)?'No especificado':row.cbu}`,
              null,
            row.persona_id,
            row.importe,
            row.tipocuenta_id,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ])
        } else if (row.ind_imputacion == 'ADE') {
          await queryRunner.query(`UPDATE PersonalAdelanto SET PersonalAdelantoLiquidoFinanzas=1 WHERE PersonalId = @0 AND PersonalAdelantoMontoAutorizado = @1 AND PersonalAdelantoAplicaEl = @2 AND PersonalAdelantoLiquidoFinanzas IS NULL`,
            [row.persona_id,
            row.importe,
            row.mes.toString().padStart(2, '0') + '/' + row.anio.toString()
            ])

          //Adelanto Positivo          
          await queryRunner.query(`INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe, tipocuenta_id,
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
            [++movimiento_id,
            row.periodo_id,
              tipo_movimiento_id_ade,
              fechaActual,
              `Adelanto`,
              null,
            row.persona_id,
            row.importe,
            row.tipocuenta_id,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ])



          await queryRunner.query(`INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe, tipocuenta_id,
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
            [++movimiento_id,
            row.periodo_id,
              tipo_movimiento_id,
              fechaActual,
            `Banco: ${row.BancoDescripcion.trim()}, Envio: ${row.envio_nro}, CBU ${LiquidacionesBancoController.isEmpty(row.cbu)?'No especificado':row.cbu}`,
              null,
            row.persona_id,
            row.importe,
            row.tipocuenta_id,

              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ])


        }

      }

      await queryRunner.query('DELETE FROM lige.dbo.liqmvbanco', [])

      await queryRunner.commitTransaction();
      return this.jsonRes([], res, `Se confirmaron ${liqmvbanco.length} movimientos`);

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }

  }


  async downloadArchivoBanco(req: Request, res: Response, next: NextFunction) {
    const directory = process.env.PATH_LIQUIDACIONES || "tmp";
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    const queryRunner = dataSource.createQueryRunner();

    try {
      const periodo = getPeriodoFromRequest(req);
      let options: any = getOptionsFromRequest(req);
      const BancoId = Number(req.body.BancoId)
      const tabIndex = Number(req.body.tabIndex) //0-banco 1-adelanto

      const formattedMonth = String(periodo.month).padStart(2, "0");
      let fileName = `${periodo.year}-${formattedMonth}-banco-${(new Date()).toISOString()}.xlsx`
      const tmpfilename = `${directory}/${tmpName(directory)}`;
      let banco

      let fechaActual = new Date()
      let ip = this.getRemoteAddress(req)
      let usuario = res.locals.userName


      options.filtros.push({ index: 'BancoId', condition: 'AND', operador: '=', valor: [BancoId] })

      switch (tabIndex) {
        case 0:
          banco = await this.getBancoSaldo(periodo.year, periodo.month, req.body.options.filtros, req.body.options.sort)
          break;
        case 1:
          banco = await this.getBancoSaldoAyudaAsistencial(periodo.year, periodo.month, req.body.options.filtros, req.body.options.sort)
          break;
        default:
          throw new ClientException('Debe posicionarse en la sopapa Listado o Adelanto/Ayuda')
          break;
      }

      if (!banco || banco.length == 0)
        throw new ClientException('No hay registros para generar archivo')

      await queryRunner.connect();
      await queryRunner.startTransaction();
      const periodods = await queryRunner.query('SELECT periodo_id FROM lige.dbo.liqmaperiodo WHERE anio=@0 AND mes=@1', [periodo.year, periodo.month])
      const periodo_id = periodods[0]['periodo_id']

      if (!(Number(periodo_id) > 0))
        throw new ClientException('Período no localizado')

      const movpend = await queryRunner.query('SELECT * FROM lige.dbo.liqmvbanco WHERE banco_id=@0', [BancoId])
      if (movpend.length > 0)
        throw new ClientException('Existen movimientos pendientes de aplicar para el banco seleccionado')


      const nro_envio = await this.getProxNumero(queryRunner, `banco_${BancoId}`, usuario, ip)

      const FechaEnvio = (fechaActual.toISOString().split('T')[0]).replaceAll('-', '')  //YYYYMMDD


      for (const row of banco) {

        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmvbanco (banco_id, periodo_id, envio_nro, persona_id, importe, cbu, ind_imputacion, fecha, tipocuenta_id, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins)
          VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8,
            @9, @10, @11)`,
          [
            BancoId, periodo_id, nro_envio, row.PersonalId, row.importe, row.PersonalBancoCBU, row.ind_imputacion, fechaActual, row.tipocuenta_id,
            usuario, ip, fechaActual
          ]
        );
      }

      let exportData = []
      let buffer = null
      /*
            if (BancoId == 4) { //Patagonia
              exportData.push(['Código de concepto', 'Importe neto a acreditar', 'Apellido y Nombre (Opcional)', 'Tipo de documento', 'Nro. de documento'])
              for (let row of banco)
                exportData.push(['001', row.importe, row.PersonalApellidoNombre.replaceAll(',',''), '001', Number(String(row.PersonalCUITCUILCUIT).substring(2, 10))])
              buffer = xlsx.build([{ name: 'Registros', data: exportData, options: { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }] } }])
            } else if (BancoId == 11) { //Itau
              exportData.push(['Marca', 'Razon Social', 'Tipo Doc', 'Nro Doc', 'CUIT', 'Calle', 'Numero', 'Piso', 'Departamento', 'CP Prefijo', 'CP Número', 'CP Ubicacion', 'Localidad', 'Provincia', 'Telefono', 'Mail', 'CBU (*)', 'Importe (*)', 'Importe Adelanto', 'FechaPago (*)'])
              const exportDataGeneral = [[], ['Cuit:', '30643445510'], ['Producto:', '500'], ['Convenio:', '1'], [], [], ['NOTAS:', '(*) - Los campos identificados con (*), son obligatorios'], ['', '(**) - Se debe ingresar al menos uno de los campos identificados.'], [], ['Unidad:', 'C']]
              for (let row of banco)
                exportData.push(['X', row.PersonalApellidoNombre.replaceAll(',',''), '', '', row.PersonalCUITCUILCUIT, '', '', '', '', '', '', '', '', '', '', '', row.PersonalBancoCBU, row.importe, '', new Date()])
              buffer = xlsx.build([{ name: 'DatosGenerales', data: exportDataGeneral, options: {} }, { name: 'Datos', data: exportData, options: { '!cols': [{ wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 15 }] } }])
            }
            writeFileSync(tmpfilename, buffer);
      
      */
      const CUITEmpresa = "30643445510"

      if (BancoId == 4) { //Patagonia
        const cabeceraData = [['Número de Envio', 'Fecha de acreditación'], [nro_envio, fechaActual]]

        exportData.push(['Código de concepto', 'Importe neto a acreditar', 'Apellido y Nombre (Opcional)', 'Tipo de documento', 'Nro. de documento'])
        for (let row of banco) {
          const PersonalApellidoNombre = row.PersonalApellidoNombre.replaceAll(',', '').replaceAll('\'', ' ').toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
          exportData.push(['001', row.importe, '', 1, Number(String(row.PersonalCUITCUILCUIT).substring(2, 10))])
        }

        buffer = xlsx.build([
          { name: 'Cabecera', data: cabeceraData, options: { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }] } },
          { name: 'Registros', data: exportData, options: { '!cols': [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }] } }
        ])
        writeFileSync(tmpfilename, buffer);

      } else if (BancoId == 11) { //Itau
        const file = createWriteStream(tmpfilename, {
          flags: 'a' // 'a' means appending (old data will be preserved)
        })
        fileName = `${periodo.year}-${formattedMonth}-banco-${(new Date()).toISOString()}.txt`
        fileName = `${CUITEmpresa.toString().substring(0, 11)}500000001${FechaEnvio.substring(0, 8)}${nro_envio.toString().padStart(5, '0')}.txt`
        file.write(format("H%s500000001%s%s OP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           \r\n",
          CUITEmpresa.toString().substring(0, 11), nro_envio.toString().padStart(5, '0'), FechaEnvio.substring(0, 8)))
        let rowNum = 2
        let total = 0
        for (const row of banco) {
          const PersonalApellidoNombre = row.PersonalApellidoNombre.replaceAll(',', '').replaceAll('\'', ' ').toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")

          file.write(format("CACT%s         %s%s                              000000                                                             0000000000000000000000000000000000000000000000000000                                                                                                                                                                                                                                    %s                                                                                                                                                                                                                                                                                                                   \r\n",
            row.PersonalCUITCUILCUIT.toString().substring(0, 11).padStart(11, '0'), PersonalApellidoNombre.padEnd(62, ' '), row.PersonalCUITCUILCUIT.toString().substring(0, 11).padStart(22, '0'), FechaEnvio))
          file.write(format("F14%s       %s00000000000000000%s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      \r\n",
            row.PersonalBancoCBU.toString().padStart(22, '0'), Math.trunc(row.importe * 100).toString().padStart(17, '0'), FechaEnvio))
          file.write(format("DAOP%s%s000                                                                                                                                                                                         %s%s                                                                                                                        000000000000000000000000000000000000000000000000000000000000000000000000000000000                                                                                                                                                                        000000                                                                                                                                                                                          \r\n",
            FechaEnvio, (rowNum++).toString().padStart(14, '0'), FechaEnvio, Math.trunc(row.importe * 100).toString().padStart(17, '0')))
          total += Math.trunc(row.importe * 100)
        }
        file.write(format("T%s500000001%s%s%s%s                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        \r\n",
          CUITEmpresa.toString().substring(0, 11).padStart(11, '0'), nro_envio.toString().padStart(5, '0'), FechaEnvio, ((rowNum - 2) * 3).toString().padStart(5, '0'), total.toString().padStart(17, '0')))
        file.end()

        await once(file, 'finish')
      }


      res.download(tmpfilename, fileName, async (msg) => {

        await queryRunner.commitTransaction();
      });

    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    }
  }


  async handleDownloadComprobantesByFiltro(req: Request, res: Response, next: NextFunction) {
    try {

      const descuentoId = process.env.OTRO_DESCUENTO_ID;

      req.body.options.sort = [{ fieldName: 'ApellidoNombre', direction: 'ASC' }]

      const periodo = getPeriodoFromRequest(req);
      const options = getOptionsFromRequest(req);
      const cantxpag = req.body.cantxpag;
      const listdowload = req.body.listdowload;


      const formattedMonth = String(periodo.month).padStart(2, "0");
      const filesPath = this.directory + '/' + String(periodo.year)

      const liquidaciones: LiqBanco[] = await this.BancoByPeriodo({
        anio: String(periodo.year),
        mes: String(periodo.month),
        options,

      });
      const files = liquidaciones
        .filter(
          (liquidacion) => liquidacion.PersonalId !== null
        )
        .map((liquidacion, index) => {
          return {
            name: `${periodo.year}-${formattedMonth}-${liquidacion.CUIT}-${liquidacion.PersonalId}.pdf`,
            apellidoNombre: liquidacion.ApellidoNombre,
          };
        });

      const responsePDFBuffer = await this.PDFmergeFromFiles(files, filesPath, cantxpag);
      //const responsePDFBuffer = new Uint8Array([17, -45.3]);
      const filename = `${periodo.year}-${formattedMonth}-liquidacion.pdf`;

      SendFileToDownload(res, filename, responsePDFBuffer);
    } catch (error) {
      return next(error)
    }
  }


  async BancoByPeriodo(params: {
    anio: string;
    mes: string;
    options: Options;
  }) {

    return dataSource.query(`SELECT per.PersonalId as id,per.PersonalId, per.PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,movpos.importe
      FROM Personal per
      JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId
      JOIN PersonalCUITCUIL AS cuit ON cuit.PersonalId = per.PersonalId
      JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
      JOIN(SELECT liq.persona_id, SUM(liq.importe) importe FROM lige.dbo.liqmamovimientos liq
      GROUP BY liq.persona_id HAVING SUM(liq.importe) > 0) AS movpos ON movpos.persona_id = per.PersonalId`)
  }


  async PDFmergeFromFiles(
    files: {
      name: string;
      apellidoNombre: string;
    }[],
    filesPath: string,
    cantxpag: number
  ) {
    const newDocument = await PDFDocument.create();
    let currentFileBuffer: Buffer;
    let currentFilePDF: PDFDocument;
    let currentFilePDFPage: PDFPage;
    let lastPage: PDFPage;

    for (const [index, file] of files.entries()) {
      const locationIndex = (cantxpag == 4) ? index % 4 : 0
      currentFileBuffer = null;
      currentFilePDF = null;
      currentFilePDFPage = null;

      if (locationIndex === 0) lastPage = newDocument.addPage(PageSizes.A4);

      const filePath = filesPath + '/' + file.name
      const fileExists = existsSync(filePath);

      const pageWidth = lastPage.getWidth();
      const pageHeight = lastPage.getHeight();

      if (fileExists) {
        currentFileBuffer = readFileSync(filePath);
        currentFilePDF = await PDFDocument.load(currentFileBuffer);
        currentFilePDFPage = currentFilePDF.getPages()[0];

        let embeddedPage: PDFEmbeddedPage = null;
        let origenComprobante = "";

        if (
          currentFilePDFPage.getWidth() == 595.276 &&
          currentFilePDFPage.getHeight() == 841.89
        ) {
          origenComprobante = "PAGO"
          embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
            top: 790,
            bottom: 410,
            left: 53,
            right: 307,
          });
        } else if (
          currentFilePDFPage.getWidth() == 598 &&
          currentFilePDFPage.getHeight() == 845
        ) {
          origenComprobante = "AFIP"
          embeddedPage = await newDocument.embedPage(currentFilePDFPage, {
            top: 808,
            bottom: 385,
            left: 37,
            right: 560,
          });
        } else {
          embeddedPage = await newDocument.embedPage(currentFilePDFPage);
        }

        const imgWidthScale = (pageWidth / 2 - 20) / embeddedPage.width;
        const imgHeightScale = (pageHeight / 2 - 20) / embeddedPage.height;
        const scalePage = embeddedPage.scale(
          Math.min(imgWidthScale, imgHeightScale)
        );

        const positionFromIndex: PDFPageDrawPageOptions = {
          x:
            locationIndex % 2 == 0
              ? Math.abs(pageWidth / 2 - scalePage.width) / 2
              : (Math.abs(pageWidth / 2 - scalePage.width) + pageWidth) / 2,
          y:
            locationIndex < 2
              ? (Math.abs(pageHeight / 2 - scalePage.height) + pageHeight) / 2
              : Math.abs(pageHeight / 2 - scalePage.height) / 2,
          width: scalePage.width,
          height: scalePage.height,
        };

        lastPage.drawPage(embeddedPage, { ...positionFromIndex });


        switch (origenComprobante) {
          case "PAGO":
            lastPage.drawText(
              `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombre}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 60,
                size: 10,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            break
          default:
            lastPage.drawText(
              `${file.apellidoNombre}\n\nResponsable: ${file.apellidoNombre}`,
              {
                x: positionFromIndex.x + 22,
                y: positionFromIndex.y + 60,
                size: 10,
                color: rgb(0, 0, 0),
                lineHeight: 6,
                //opacity: 0.75,
              }
            );

            break
        }


        // newPage.drawText(`Comprobante: ${file.name}`);
      } else {
        const positionFromIndex: PDFPageDrawPageOptions = {
          x: locationIndex % 2 == 0 ? 20 : pageWidth / 2 + 20,
          y: locationIndex < 2 ? pageHeight / 2 + 20 : 20,
        };
        lastPage.drawText(`Falta el comprobante: ${file.name}`, {
          ...positionFromIndex,
          size: 15,
          rotate: degrees(65),
        });
      }
    }

    return newDocument.save();
  }

  async setDeleteMovimiento(req: Request, res: Response, next: NextFunction) {

    const persona_id = req.body.persona_id
    const banco_id = req.body.banco_id
    const envio_nro = req.body.envio_nro
    const tipocuenta_id = req.body.tipocuenta_id

    const queryRunner = dataSource.createQueryRunner();

    try {
      if (persona_id == null)
        throw new ClientException(`Debe seleccionar una persona`)

      await queryRunner.connect();
      await queryRunner.startTransaction();


      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmvbanco WHERE persona_id = @0 AND banco_id = @1 AND envio_nro = @2 AND tipocuenta_id = @3`,
        [persona_id, banco_id, envio_nro, tipocuenta_id]
      );

      await queryRunner.commitTransaction();

      this.jsonRes({ list: [] }, res, `Se eliminó el registro `);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }


  }

}




