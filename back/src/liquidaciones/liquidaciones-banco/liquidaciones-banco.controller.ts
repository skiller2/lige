import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../../controller/base.controller.ts";
import { getConnection } from "../../data-source.ts";
import type { LiqBanco } from "../../schemas/ResponseJSON.ts";
import type { Options } from "../../schemas/filtro.ts";
import xlsx from 'node-xlsx';
import { recibosController } from "../../controller/controller.module.ts";


//import path from "path";
import {
  PDFDocument,
  PDFEmbeddedPage,
  PDFPage,
  PageSizes,
  degrees,
  rgb,
} from "pdf-lib";

import type { PDFPageDrawPageOptions } from "pdf-lib";

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  SendFileToDownload,
  getPeriodoFromRequest,
} from "./liquidaciones-banco.utils.ts";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "../../impuestos-afip/filtros-utils/filtros.ts";
import { tmpName } from "../../server.ts";
import { format, promisify } from "node:util";
import { once } from "events";
import { Utils } from "../liquidaciones.utils.ts";
import type { QueryRunner } from "typeorm";


const getOptsSINO: any[] = [
  { label: 'Si', value: '1' },
  { label: 'No', value: '0' },
]


export class LiquidacionesBancoController extends BaseController {
  //   hidden: false,
  //   searchHidden: false
  // },

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
      searchComponent: "inputForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "string",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "Situación Revista",
      type: "number",
      id: "SituacionRevistaId",
      field: "SituacionRevistaId",
      fieldName: "sit.SituacionRevistaId",
      searchComponent: "inputForSituacionRevistaSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true,
    },
    {
      name: "Situación Revista",
      type: "string",
      id: "SituacionRevistaDescripcion",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: true
    },
    {
      name: "CBU",
      type: "string",
      id: "PersonalBancoCBU",
      field: "PersonalBancoCBU",
      fieldName: "perban.PersonalBancoCBU",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "movpos.importe",
      searchComponent: "inputForNumberAdvancedSearch",
      searchType: "numberAdvanced",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Cuenta",
      type: "string",
      id: "tipocuenta_id",
      field: "tipocuenta_id",
      fieldName: "movpos.tipocuenta_id",
      searchComponent: "inputForTipoCuentaSearch",
      searchType: "string",
      sortable: true,
      hidden: false,
      searchHidden: false
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
    },
    {
      name: "Excede Importe",
      type: "string",
      id: "ExcedeImporte",
      field: "ExcedeImporte",
      fieldName: "calc.ExcedeImporte",
      formatter: 'collectionFormatter',
      params: { collection: getOptsSINO, },
      sortable: true,
      hidden: false,
      searchComponent: "inputForActivo",
      maxWidth: 60,
    },



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
      searchComponent: "inputForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "string",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "Situación Revista",
      type: "number",
      id: "SituacionRevistaId",
      field: "SituacionRevistaId",
      fieldName: "sit.SituacionRevistaId",
      searchComponent: "inputForSituacionRevistaSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true,
    },
    {
      name: "Situación Revista",
      type: "string",
      id: "SituacionRevistaDescripcion",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: false,
      searchHidden: true
    },
    {
      name: "CBU",
      type: "string",
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
      fieldName: "pre.importe",
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
      searchComponent: "inputForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "CUIT",
      type: "string",
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
      type: "string",
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

  async getSaldoCuentas(anio: Number, mes: Number, filtros: any, sort: any, queryRunner: QueryRunner) {
    const filterSql = filtrosToSql(filtros, this.listaColumnas);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()
    stmactual.setHours(0, 0, 0, 0)
    return queryRunner.query(
      `
WITH Movimientos AS (
	SELECT 
		liq.persona_id,
		liq.tipocuenta_id,
		SUM(liq.importe * tipo.signo) AS importe
	FROM lige.dbo.liqmamovimientos liq
	JOIN lige.dbo.liqcotipomovimiento tipo 
		ON tipo.tipo_movimiento_id = liq.tipo_movimiento_id
	JOIN lige.dbo.liqmaperiodo per 
		ON per.periodo_id = liq.periodo_id 
		AND per.anio = @1 
		AND per.mes = @2
	GROUP BY 
		liq.persona_id, 
		liq.tipocuenta_id
	HAVING SUM(liq.importe * tipo.signo) <> 0
),
ValorHora AS (
	SELECT 
		MAX(val.ValorLiquidacionHoraNormal) AS ValorLiquidacionHoraNormal
	FROM ValorLiquidacion val
	WHERE val.ValorLiquidacionDesde <= DATEFROMPARTS(@1,@2,1)
		AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') > DATEFROMPARTS(@1,@2,1)
)

SELECT 
	CONCAT(per.PersonalId, movpos.tipocuenta_id) AS id,
	per.PersonalId,
	CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) AS PersonalApellidoNombre,
	cuit.PersonalCUITCUILCUIT,
	perban.PersonalBancoCBU,
	banc.BancoDescripcion,
	movpos.tipocuenta_id,
	movpos.importe,
	'CUE' AS ind_imputacion,
	'' AS clave_id,
	sit.SituacionRevistaDescripcion,

	calc.PonHoras,
	calc.ExcedeImporte

FROM Personal per

JOIN Movimientos movpos 
	ON movpos.persona_id = per.PersonalId

CROSS JOIN ValorHora val

CROSS APPLY (
	SELECT
		movpos.importe / val.ValorLiquidacionHoraNormal AS PonHoras,

		IIF(
			ISNULL(per.HorasAutorizadasMax,0) < 
			(movpos.importe / val.ValorLiquidacionHoraNormal),
			'1',
			'0'
		) AS ExcedeImporte
) calc

LEFT JOIN PersonalBanco perban 
	ON perban.PersonalId = per.PersonalId
	AND perban.PersonalBancoId = (
		SELECT MAX(perbanmax.PersonalBancoId)
		FROM PersonalBanco perbanmax
		WHERE perbanmax.PersonalId = per.PersonalId
			AND ISNULL(perbanmax.PersonalBancoHasta,'9999-12-31') >= @0 AND perbanmax.IndNuevaCuenta = 0
	)

LEFT JOIN PersonalCUITCUIL cuit 
	ON cuit.PersonalId = per.PersonalId
	AND cuit.PersonalCUITCUILId = (
		SELECT MAX(cuitmax.PersonalCUITCUILId)
		FROM PersonalCUITCUIL cuitmax
		WHERE cuitmax.PersonalId = per.PersonalId
	)

LEFT JOIN PersonalSituacionRevista sitrev 
	ON sitrev.PersonalId = per.PersonalId
	AND sitrev.PersonalSituacionRevistaDesde <= @0
	AND ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= @0

LEFT JOIN SituacionRevista sit 
	ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId

LEFT JOIN banco banc 
	ON banc.BancoId = perban.PersonalBancoBancoId



        WHERE  (${filterSql}) 
        ${orderBy}
        `, [stmactual, anio, mes])

  }

  async getBancoSaldoAyudaAsistencial(anio: Number, mes: Number, filtros: any, sort: any, queryRunner: QueryRunner) {
    const filterSql = filtrosToSql(filtros, this.listaColumnas);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()
    return queryRunner.query(
      `SELECT CONCAT(per.PersonalId,'-',pre.PersonalPrestamoId ) as id,per.PersonalId, pre.PersonalPrestamoId as clave_id, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) as PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,
      pre.PersonalPrestamoMonto AS importe, pre.PersonalPrestamoAplicaEl,
      tipo.tipo_movimiento_id, tipo.des_movimiento,
      pre.PersonalPrestamoLiquidoFinanzas,
      'G' as tipocuenta_id,
      'PRE' as ind_imputacion,
      sit.SituacionRevistaDescripcion,
          1
              FROM Personal per
              JOIN PersonalPrestamo pre ON pre.PersonalId = per.PersonalId AND pre.PersonalPrestamoAprobado='S' AND ISNULL(pre.PersonalPrestamoLiquidoFinanzas,0) =0
              JOIN lige.dbo.liqcotipomovimiento tipo ON tipo.tipo_movimiento_id = 1
              LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.PersonalBancoId = ( SELECT MAX(perbanmax.PersonalBancoId) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId AND ISNULL(perbanmax.PersonalBancoHasta,'9999-12-31') >= @0 AND perbanmax.IndNuevaCuenta = 0 )
              LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
              LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaDesde<=@0 AND  ISNULL(sitrev.PersonalSituacionRevistaHasta,'9999-12-31') >= @0
              LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId
            
              LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId
              
      WHERE (${filterSql}) 
      ${orderBy}
      `, [stmactual, anio, mes])

  }

  async getMovimientosPendientes(filtros: any, sort: any, queryRunner: QueryRunner) {
    const filterSql = filtrosToSql(filtros, this.listaColumnasMovimientos);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return queryRunner.query(
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
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const banco = await this.getSaldoCuentas(anio, mes, req.body.options?.filtros, req.body.options?.sort, queryRunner)

      this.jsonRes(
        {
          total: banco.length,
          list: banco,
        },
        res
      );

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async getByMovimientos(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)

    const queryRunner = await getConnection(res.locals.userName);

    try {
      const movimientosPendientes = await this.getMovimientosPendientes(req.body.options.filtros, req.body.options.sort, queryRunner)

      this.jsonRes(
        {
          total: movimientosPendientes.length,
          list: movimientosPendientes,
        },
        res
      );

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
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
    const queryRunner = await getConnection(res.locals.userName);

    try {
      const ayuda = await this.getBancoSaldoAyudaAsistencial(anio, mes, req.body.options.filtros, req.body.options.sort, queryRunner)

      this.jsonRes(
        {
          total: ayuda.length,
          list: ayuda,
        },
        res
      );

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
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
    const queryRunner = await getConnection(res.locals.userName)
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName


    await queryRunner.startTransaction();

    try {
      const banco_id = Number(req.body.banco_id)
      const pend = await queryRunner.query('SELECT banco_id FROM lige.dbo.liqmvbanco WHERE banco_id = @0', [banco_id])

      if (pend.length == 0)
        throw new ClientException('No hay archivo generado pendiente para el banco seleccionado')

      await queryRunner.query('DELETE FROM lige.dbo.liqmvbanco WHERE banco_id = @0', [banco_id])
      await queryRunner.commitTransaction();
      return this.jsonRes([], res, `Se eliminó el archivo pendiente`);

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }

  }


  async confirmaMovimientosBanco(req: Request, res: Response, next: NextFunction) {
    const queryRunner = await getConnection(res.locals.userName)
    const fechaActual = new Date()
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    let anio = Number(req.body.selectedPeriod.year)
    let mes = Number(req.body.selectedPeriod.month)


    await queryRunner.startTransaction();
    try {

      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`)

      const liqmvbanco = await queryRunner.query('SELECT mv.*, ban.BancoDescripcion, per.anio, per.mes FROM lige.dbo.liqmvbanco mv JOIN Banco ban ON ban.BancoId = mv.banco_id JOIN lige.dbo.liqmaperiodo per ON per.periodo_id=mv.periodo_id', [])


      if (liqmvbanco.length == 0)
        throw new ClientException('No hay movimientos pendientes de confirmar')

      let movimiento_id = await Utils.getMovimientoId(queryRunner)
      const tipo_movimiento_id_ade = 1 //Ayuda Asitencial
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
            `Banco: ${row.BancoDescripcion.trim()}, Envio: ${row.envio_nro}, CBU ${LiquidacionesBancoController.isEmpty(row.cbu) ? 'No especificado' : row.cbu}`,
              null,
            row.persona_id,
            row.importe,
            row.tipocuenta_id,
              usuario, ip, fechaActual, usuario, ip, fechaActual,
            ])
        } else if (row.ind_imputacion == 'PRE') {
          await queryRunner.query(`UPDATE PersonalPrestamo SET PersonalPrestamoLiquidoFinanzas=1 WHERE PersonalId = @0 AND PersonalPrestamoMonto = @1 AND PersonalPrestamoId=@2 AND ISNULL(PersonalPrestamoLiquidoFinanzas,0) =0`,
            [row.persona_id,
            row.importe,
            row.clave_id
            ])
          const prestamo = await queryRunner.query(`SELECT pre.PersonalPrestamoId, frm.FormaPrestamoDescripcion FROM PersonalPrestamo pre 
            JOIN FormaPrestamo frm ON frm.FormaPrestamoId = pre.FormaPrestamoId
            WHERE pre.PersonalId = @0 AND pre.PersonalPrestamoMonto = @1 AND pre.PersonalPrestamoId=@2
            `, [row.persona_id,
          row.importe,
          row.clave_id
          ])


          //Prestamo Positivo




          await queryRunner.query(`INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, fecha, detalle, objetivo_id, persona_id, importe, tipocuenta_id,
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
              VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
            [++movimiento_id,
            row.periodo_id,
              tipo_movimiento_id_ade,
              fechaActual,
            `${prestamo[0].FormaPrestamoDescripcion} ${row.persona_id + '/' + row.clave_id}`,
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
            `Banco: ${row.BancoDescripcion.trim()}, Envio: ${row.envio_nro}, CBU ${LiquidacionesBancoController.isEmpty(row.cbu) ? 'No especificado' : row.cbu}`,
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
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }

  }


  formatDDMMAAAA(value: Date): string {
    const d = new Date(value);

    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear()
    ].join('');
  }


  normalizarPiso(input: string): string | null {

    const regex = /^(?:\s+|PB|[1-4]|(?:0[1-9]|[1-8][0-9]|9[0-8]))$/;

    if (input == null) return "PB";

    const original = input;
    const value = input.trim().toUpperCase();

    // Caso: solo espacios → devolver tal cual
    if (/^\s+$/.test(original)) {
      return original;
    }

    // Validación
    if (!regex.test(value)) {
      return "PB";
    }

    // Transformación
    if (/^[1-4]$/.test(value)) {
      return `0${value}`;
    }

    return value;
  }


  async archivoCuentaNuevaPatagonia //   hidden: false,
    (req: any, res: any, next: any) {
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName
    const stmactual = new Date()

    const queryRunner = await getConnection(usuario);
    const directory = process.env.PATH_LIQUIDACIONES || "tmp";
    const tmpfilename = `${directory}/${tmpName(directory)}`;
    const fileName = `cuentas-nuevas-patagonia-${new Date().toISOString()}.txt`
    const BancoId = 4 //Number(req.body.BancoId)

    try {
      const file = createWriteStream(tmpfilename, {
        flags: 'a' // 'a' means appending (old data will be preserved)
      })

      const cuentasNuevas = await queryRunner.query(`SELECT per.PersonalId, TRIM(per.PersonalApellido) AS Apellido, TRIM(per.PersonalNombre) AS Nombre, cuit.PersonalCUITCUILCUIT, td.TipoDocumentoCodigo, doc.PersonalDocumentoNro,
      nac.NacionalidadDescripcion Nacionalidad, per.PersonalFechaNacimiento, per.PersonalSexo,
      perdom.domCalle,perdom.domNro, perdom.DomicilioDomPiso, perdom.DomicilioDomDpto, perdom.localidad, perdom.DomicilioCodigoPostal,perdom.provincia,perdom.DomicilioProvinciaId,
      perban.PersonalBancoCBU, banc.BancoDescripcion, banc.NroEmpresaAsignado,
      detsit.SituacionRevistaDescripcion,
      perdom.ProvinciaCodigoBancoCuentaSueldo,
      ie.PersonalFechaIngreso,
      1

      FROM Personal per 
      LEFT JOIN PersonalSituacionRevista sit ON sit.PersonalId=per.PersonalId AND sit.PersonalSituacionRevistaDesde <= @0 
          AND ISNULL(sit.PersonalSituacionRevistaHasta,'9999-12-31') >= @0  -- AND sit.PersonalSituacionRevistaSituacionId IN (2,5,11,12,14,20,26,28)
      LEFT JOIN SituacionRevista detsit ON detsit.SituacionRevistaId = sit.PersonalSituacionRevistaId


      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)

      LEFT JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId 
        AND perban.PersonalBancoDesde = ( SELECT MAX(perbanmax.PersonalBancoDesde) FROM PersonalBanco perbanmax WHERE perbanmax.PersonalId = per.PersonalId) 
        AND perban.PersonalBancoDesde <= @0 
        AND ISNULL(perban.PersonalBancoHasta,'9999-12-31') >= @0
      LEFT JOIN banco AS banc ON banc.BancoId = perban.PersonalBancoBancoId




      LEFT JOIN PersonalDocumento AS doc ON doc.PersonalId = per.PersonalId
                      AND doc.PersonalDocumentoId = ( SELECT MAX(docmax.PersonalDocumentoId) FROM PersonalDocumento docmax WHERE docmax.PersonalId = per.PersonalId) 
      left join TipoDocumento as td on td.TipoDocumentoId = doc.TipoDocumentoId

      left join Nacionalidad as nac on nac.NacionalidadId= per.PersonalNacionalidadId
      LEFT JOIN PersonalIngresoEgreso AS ie ON ie.PersonalId =  per.PersonalId  

      LEFT JOIN (Select  TRIM(dom.DomicilioDomCalle) domCalle,TRIM(dom.DomicilioDomNro) domNro, per.PersonalId, dom.DomicilioDomPiso,dom.DomicilioDomDpto,
                      prov.ProvinciaCodigoBancoCuentaSueldo,
                      TRIM(bar.BarrioDescripcion) barrio, TRIM(loc.LocalidadDescripcion) localidad,TRIM(prov.ProvinciaDescripcion) provincia,TRIM(pais.PaisDescripcion) paid,
                                      
                      dom.DomicilioCodigoPostal, dom.DomicilioPaisId,dom.DomicilioProvinciaId,dom.DomicilioLocalidadId,dom.DomicilioBarrioId
                                      from Personal per
                                      LEFT JOIN NexoDomicilio nexdom ON nexdom.PersonalId = per.PersonalId AND nexdom.NexoDomicilioActual = 1
                                      LEFT JOIN Domicilio dom ON dom.DomicilioId = nexdom.DomicilioId
                                      LEFT JOIN Pais pais on pais.PaisId=dom.DomicilioPaisId
                                      LEFT JOIN Provincia prov on prov.PaisId=pais.PaisId and prov.ProvinciaId=dom.DomicilioProvinciaId
                                      LEFT JOIN Localidad loc on loc.PaisId=pais.PaisId and loc.ProvinciaId=prov.ProvinciaId  and loc.LocalidadId=dom.DomicilioLocalidadId 
                                      LEFT JOIN Barrio bar on bar.PaisId=pais.PaisId and prov.ProvinciaId=bar.ProvinciaId and loc.LocalidadId=bar.LocalidadId and dom.DomicilioBarrioId=bar.BarrioId
                                      ) AS perdom on perdom.PersonalId=per.PersonalId
      WHERE perban.PersonalBancoBancoId = @1 AND perban.PersonalBancoCBU IS NULL AND perban.IndNuevaCuenta =1`, [stmactual, BancoId])

      if (cuentasNuevas.length == 0)
        throw new ClientException('No se encontraron cuentas nuevas para el banco seleccionado')
      //      const cuentasNuevas = []
      for (const row of cuentasNuevas) {
        const NroEmpresaAsignado = row.NroEmpresaAsignado ? row.NroEmpresaAsignado.toString().padStart(4, '0') : '0000'
        const PersonalApellido = row.Apellido ? row.Apellido.trim().slice(0, 15).padEnd(15, ' ') : ' '.repeat(15)
        const Espacios = ' '.repeat(15)
        const PersonalNombre = row.Nombre ? row.Nombre.trim().slice(0, 16).padEnd(16, ' ') : ' '.repeat(16)
        const TipoDocumentoCodigo = '001'  //DNI
        const PersonalDocumentoNro = row.PersonalDocumentoNro ? row.PersonalDocumentoNro.toString().padStart(17, '0') : '0'.repeat(17)
        const ProvinciaDocumento = '00'
        const Nacionalidad = (row.NacionalidadId == 2) ? 'A' : 'E'
        const PersonalFechaNacimiento = row.PersonalFechaNacimiento ? this.formatDDMMAAAA(new Date(row.PersonalFechaNacimiento)) : '00000000'
        const PersonalSexo = row.PersonalSexo ? row.PersonalSexo.trim().charAt(0).toUpperCase() : 'X'
        const EstadoCivil = 'S'
        const DomicilioCalle = row.domCalle ? row.domCalle.trim().slice(0, 19).padEnd(19, ' ') : ' '.repeat(19)
        const DomicilioNro = row.domNro ? row.domNro.trim().slice(0, 5).padStart(5, '0') : '99999'
        const DomicilioDomPiso = this.normalizarPiso(row.DomicilioDomPiso)
        const DomicilioDomDpto = row.DomicilioDomDpto ? row.DomicilioDomDpto.trim().slice(0, 2).padEnd(2, ' ') : '  '
        const Localidad = row.localidad ? row.localidad.trim().slice(0, 30).padStart(30, ' ') : 'LocalidadNoInformada'
        const DomicilioCodigoPostal = row.DomicilioCodigoPostal ? row.DomicilioCodigoPostal.trim().slice(0, 5).padStart(5, '0') : '00000'

        const ProvinciaCodigoBancoCuentaSueldo = row.ProvinciaCodigoBancoCuentaSueldo ? row.ProvinciaCodigoBancoCuentaSueldo.trim().slice(0, 2).padStart(2, '0') : '00'
        const TipoCuenta = '2'  //Caja Ahorro
        const Espacios2 = ' '.repeat(3)
        const ReservadoUsoBanco = ' '.repeat(10)
        const ReservadoUsoEmpresa = ' '.repeat(17)
        const CodigoIdentAfip = '101'

        const PersonalCUITCUILCUIT = row.PersonalCUITCUILCUIT.toString().substring(0, 11).padStart(11, '0')
        const IngresosNetos = '99999'
        const ReservadoUsoBanco2 = ' '.repeat(3)
        const Categoria = ' '.repeat(15)
        const PersonalFechaIngreso = row.PersonalFechaIngreso ? this.formatDDMMAAAA(new Date(row.PersonalFechaIngreso)) : '00000000'
        const DependenciaPago = '01'.padEnd(15, '0')
        const CodPosDependenciaPago = '00000'
        const ReservadoUsoBanco3 = ' '.repeat(22)
        const ReservadoUsoBanco4 = ' '.repeat(3)
        const TelefonoPrefijo = ' '.repeat(4)
        const TelefonoCaracteristica = ' '.repeat(4)
        const TelefonoNumero = ' '.repeat(5)
        const ReservadoUsoBanco5 = ' '.repeat(11)
        const ReservadoUsoBanco6 = ' '.repeat(3)
        const ReservadoUsoBanco7 = ' '.repeat(5)
        //const ReservadoUsoBanco7 = '    X'

        const filerow = NroEmpresaAsignado + PersonalApellido + Espacios + PersonalNombre + TipoDocumentoCodigo + PersonalDocumentoNro +
          ProvinciaDocumento + Nacionalidad +
          PersonalFechaNacimiento + PersonalSexo + EstadoCivil +
          DomicilioCalle + DomicilioNro + DomicilioDomPiso + DomicilioDomDpto + Localidad + DomicilioCodigoPostal + ProvinciaCodigoBancoCuentaSueldo +
          TipoCuenta + Espacios2 + ReservadoUsoBanco + ReservadoUsoEmpresa +
          CodigoIdentAfip + PersonalCUITCUILCUIT +
          IngresosNetos + ReservadoUsoBanco2 +
          Categoria + PersonalFechaIngreso +
          DependenciaPago +
          CodPosDependenciaPago +
          ReservadoUsoBanco3 +
          ReservadoUsoBanco4 +
          TelefonoPrefijo + TelefonoCaracteristica + TelefonoNumero +
          ReservadoUsoBanco5 +
          ReservadoUsoBanco6 +
          ReservadoUsoBanco7 +
          '\r\n'

        console.log('longitud:', filerow.length)
        file.write(filerow)
      }

      file.end()
      await once(file, 'finish')

      res.download(tmpfilename, fileName, async (msg) => { });

    } catch (error) {
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }


  async downloadArchivoBanco(req: Request, res: Response, next: NextFunction) {
    const directory = process.env.PATH_LIQUIDACIONES || "tmp";
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
    const ip = this.getRemoteAddress(req)
    const usuario = res.locals.userName

    const queryRunner = await getConnection(usuario);

    try {
      const periodo = getPeriodoFromRequest(req);
      let options: any = getOptionsFromRequest(req);
      const BancoId = Number(req.body.BancoId)
      const tabIndex = Number(req.body.tabIndex) //1-banco 2-adelanto
      const isTest = req.body.isTest
      let fileTest = isTest ? "-TEST" : ""
      const formattedMonth = String(periodo.month).padStart(2, "0");
      let fileName = `${periodo.year}-${formattedMonth}-banco-${(new Date()).toISOString()}.xlsx`
      const tmpfilename = `${directory}/${tmpName(directory)}${fileTest}`;
      let banco: any[] = []

      let fechaActual = new Date()


      options.filtros.push({ index: 'BancoId', condition: 'AND', operador: '=', valor: [BancoId] })

      switch (tabIndex) {
        case 1: //Banco
          const recordSet = await this.getSaldoCuentas(periodo.year, periodo.month, req.body.options.filtros, req.body.options.sort, queryRunner)
          banco = recordSet.filter((item: any) => item.importe > 0)
          break;
        case 2: //Adelanto
          banco = await this.getBancoSaldoAyudaAsistencial(periodo.year, periodo.month, req.body.options.filtros, req.body.options.sort, queryRunner)
          break;
        default:
          throw new ClientException('Debe posicionarse en la sopapa Listado o Adelanto/Ayuda')
          break;
      }


      const bancoDups = banco.filter(
        (item, index, array) =>
          array.findIndex(p => p.PersonalId === item.PersonalId) !== index
      );

      const bancoExcede = banco.filter(
        (p) =>
          p.ExcedeImporte == '1'
      );


      if (bancoDups.length > 0) {
        const dupIds = bancoDups.map((p: any) => p.PersonalApellidoNombre).join(', ')
        throw new ClientException(`Existen registros duplicados para : ${dupIds}.`)
      }

      if (bancoExcede.length > 0) {
        const excedeIds = bancoExcede.map((p: any) => p.PersonalApellidoNombre).join(', ')
        throw new ClientException(`Existen registros que exceden el importe autorizado para : ${excedeIds}.`)
      }

      if (banco.length == 0)
        throw new ClientException('No hay registros para generar archivo')


      await queryRunner.startTransaction();
      const periodods = await queryRunner.query('SELECT periodo_id FROM lige.dbo.liqmaperiodo WHERE anio=@0 AND mes=@1', [periodo.year, periodo.month])
      const periodo_id = periodods[0]['periodo_id']

      if (!(Number(periodo_id) > 0))
        throw new ClientException('Período no localizado')

      const movpend = await queryRunner.query('SELECT banco_id FROM lige.dbo.liqmvbanco WHERE banco_id=@0', [BancoId])
      if (movpend.length > 0)
        throw new ClientException('Existen movimientos pendientes de aplicar para el banco seleccionado')


      const nro_envio = await BaseController.getProxNumero(queryRunner, `banco_${BancoId}`, usuario, ip)

      const FechaEnvio = (fechaActual.toISOString().split('T')[0]).replaceAll('-', '')


      for (const row of banco) {

        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmvbanco (banco_id, periodo_id, envio_nro, persona_id, importe, cbu, ind_imputacion, fecha, tipocuenta_id, clave_id, 
            aud_usuario_ins, aud_ip_ins, aud_fecha_ins)
          VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9,
          @10, @11, @12)`,
          [
            BancoId, periodo_id, nro_envio, row.PersonalId, row.importe, row.PersonalBancoCBU, row.ind_imputacion, fechaActual, row.tipocuenta_id, row.clave_id,
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
        fileName = `${periodo.year}-${formattedMonth}-banco-${(new Date()).toISOString()}${fileTest}.txt`
        fileName = `${CUITEmpresa.toString().substring(0, 11)}500000001${FechaEnvio.substring(0, 8)}${nro_envio.toString().padStart(5, '0')}${fileTest}.txt`
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
      } else if (BancoId == 10) { //Banco Macro 
        const file = createWriteStream(tmpfilename, {
          flags: 'a'
        })

        fileName = `${periodo.year}-${formattedMonth}-banco-${(new Date()).toISOString()}${fileTest}.txt`
        fileName = `${CUITEmpresa.toString().substring(0, 11)}500000001${FechaEnvio.substring(0, 8)}${nro_envio.toString().padStart(5, '0')}${fileTest}.txt`

        let total = 0
        for (const row of banco) {
          //const PersonalApellido = row.PersonalApellidoNombre.split(",")[0].split(" ")[0].replaceAll('\'', ' ').toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")
          const PersonalApellidoNombre = row.PersonalApellidoNombre.replaceAll('\'', ' ').toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").slice(0, 64).trim();
          if (!row.PersonalCUITCUILCUIT)
            throw new ClientException('Sin cuit para el personal ' + PersonalApellidoNombre)
          if (!row.PersonalBancoCBU)
            throw new ClientException('Sin CBU para el personal ' + PersonalApellidoNombre)

          file.write(format("%s\t%s\t%s\t%s\t%s\t%s\t%s\r\n",
            "",// legajo no es obligatorio
            row.PersonalCUITCUILCUIT.toString().substring(0, 11),

            PersonalApellidoNombre.toString(),
            "", // Se informa el cbu por lo que cuenta se queda en blanco

            row.PersonalBancoCBU.toString(),
            row.importe.toFixed(2),
            "" // comprobante no es obligatorio
          ))

          total += Math.trunc(row.importe * 100)
        }
        //throw new ClientException('Termino bien')
        file.end()
        await once(file, 'finish')

      }


      if (isTest)
        await this.rollbackTransaction(queryRunner)
      else
        await queryRunner.commitTransaction();

      res.download(tmpfilename, fileName, async (msg) => {


      });

    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
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
      const queryRunner = await getConnection(res.locals.userName);

      const formattedMonth = String(periodo.month).padStart(2, "0");
      const filesPath = this.directory + '/' + String(periodo.year)

      const liquidaciones: LiqBanco[] = await this.BancoByPeriodo({
        anio: String(periodo.year),
        mes: String(periodo.month),
        options,

      }, queryRunner);
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
    } finally {
    }
  }


  async BancoByPeriodo(params: {
    anio: string;
    mes: string;
    options: Options;
  }, queryRunner: QueryRunner) {
    return queryRunner.query(`SELECT per.PersonalId as id,per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) as PersonalApellidoNombre, cuit.PersonalCUITCUILCUIT,perban.PersonalBancoCBU, banc.BancoDescripcion ,movpos.importe
      FROM Personal per
      JOIN PersonalBanco AS perban ON perban.PersonalId = per.PersonalId AND perban.IndNuevaCuenta = 0 AND perban.PersonalBancoDesde <= @0 AND ISNULL(perban.PersonalBancoHasta,'9999-12-31') >= @0
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
        currentFilePDF = await PDFDocument.load(new Uint8Array(currentFileBuffer));
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

    const queryRunner = await getConnection(res.locals.userName);

    try {
      if (persona_id == null)
        throw new ClientException(`Debe seleccionar una persona`)


      await queryRunner.startTransaction();


      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmvbanco WHERE persona_id = @0 AND banco_id = @1 AND envio_nro = @2 AND tipocuenta_id = @3`,
        [persona_id, banco_id, envio_nro, tipocuenta_id]
      );

      await queryRunner.commitTransaction();

      this.jsonRes({ list: [] }, res, `Se eliminó el registro `);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }


  }



  async jobLimiteImporteBanco(req: any, res: Response, next: NextFunction) {   //Actualiza el campo HorasAutorizadasMax de Personal con el valor calculado en funcion de los ultimos meses

    const fechaActual = new Date()
    const usuario = this.getUser(res)
    const ip = this.getRemoteAddress(req)
    let EventoLogCodigo = 0
    const anio = fechaActual.getFullYear()
    const mes = fechaActual.getMonth() + 1

    const queryRunner = await getConnection(res.locals.userName);

    try {
      ({ EventoLogCodigo } = await this.eventoLogInicio(
        queryRunner,
        `Limite Importe Banco`,
        { usuario, ip },
        usuario,
        ip,
        "DES"
      ));

      await queryRunner.startTransaction()


      const cuentalimite = await queryRunner.query(`
        WITH Movimientos AS (
        SELECT 
          liq.persona_id PersonaId,
          liq.tipocuenta_id,
          SUM(liq.importe ) AS importe
        FROM lige.dbo.liqmamovimientos liq
        JOIN lige.dbo.liqcotipomovimiento tipo 
          ON tipo.tipo_movimiento_id = liq.tipo_movimiento_id
        JOIN lige.dbo.liqmaperiodo per 
          ON per.periodo_id = liq.periodo_id 
          AND per.anio = @1
          AND per.mes = @2
        WHERE tipo.tipo_movimiento_id IN (11,24,28)
        GROUP BY 
          liq.persona_id, 
          liq.tipocuenta_id
        HAVING SUM(liq.importe ) > 0
        
      ),
      ValorHora AS (
        SELECT 
          MAX(val.ValorLiquidacionHoraNormal) AS ValorLiquidacionHoraNormal
        FROM ValorLiquidacion val
        WHERE val.ValorLiquidacionDesde <= DATEFROMPARTS(@1,@2,1)
          AND ISNULL(val.ValorLiquidacionHasta,'9999-12-31') > DATEFROMPARTS(@1,@2,1)
      )
      SELECT mov.*, val.*, ROUND(mov.importe / val.ValorLiquidacionHoraNormal,0) PonHoras, per.HorasAutorizadasMax 
      FROM Movimientos mov
      JOIN Personal per ON per.PersonalId=mov.persona_id
      CROSS JOIN ValorHora val
`, [fechaActual, anio, mes])

      for (const limite of cuentalimite) {
        const PersonalId = limite.PersonaId
        const HorasAutorizadasMax = 0  //Minimo 65

        await queryRunner.query(`
              UPDATE Personal SET HorasAutorizadasMax=@1 WHERE PersonalId=@0)
          `, [PersonalId, HorasAutorizadasMax])

      }

      await queryRunner.commitTransaction()

      const resMsg = `Se actualizaron los limites de importe para ${cuentalimite.length} personas.`
      await this.eventoLogFin(
        queryRunner,
        EventoLogCodigo,
        'COM',
        {
          res: resMsg,
        },
        usuario,
        ip
      );
      return this.jsonRes({}, res, resMsg);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      await this.eventoLogFin(queryRunner,
        EventoLogCodigo,
        'ERR',
        { res: error },
        usuario,
        ip
      );

      return next(error)
    } finally {
      await queryRunner.release()
    }
  }
}




