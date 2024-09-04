import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Utils } from "./liquidaciones.utils";
import { mkdirSync, existsSync, readFileSync, unlinkSync, copyFileSync } from "fs";
import xlsx from 'node-xlsx';
import { recibosController } from "src/controller/controller.module";
import { QueryRunner } from "typeorm"

export class LiquidacionesController extends BaseController {
  async getPeriodoStatus(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    try {
      let status = null
      if (anio && mes) {
        status = await dataSource.query(
          `SELECT peri.anio, peri.mes, peri.periodo_id, peri.ind_recibos_generados, peri.aud_fecha_mod FROM lige.dbo.liqmaperiodo peri WHERE peri.anio=@1 and peri.mes=@2`, [,anio, mes]
        )
        if (!status[0])
          throw new ClientException(`No se encontró el período ${mes}/${anio}`)
          
      } else {
        status = await dataSource.query(
          `SELECT TOP 1 peri.anio, peri.mes, peri.periodo_id, peri.ind_recibos_generados, peri.aud_fecha_mod FROM lige.dbo.liqmaperiodo peri WHERE peri.ind_recibos_generados= 1 ORDER BY peri.anio DESC, peri.mes DESC`, [anio, mes]
        )
      }

      this.jsonRes(
        {
          anio:status[0].anio,
          mes: status[0].mes,
          ind_recibos_generados:status[0].ind_recibos_generados,
          stm_recibos_generados:status[0].aud_fecha_mod
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }



  directory = process.env.PATH_LIQUIDACIONES || "tmp";

  async getTipoMovimientoById(req: Request, res: Response, next: NextFunction) {

    const TipoMovimientoFilter = req.params.TipoMovimiento;
    try {
      let tipoMovimiento
      if (TipoMovimientoFilter == 'all') {

        tipoMovimiento = await dataSource.query(
          `SELECT tipo.tipo_movimiento_id, tipo.des_movimiento, tipo.signo, tipo.tipo_movimiento FROM lige.dbo.liqcotipomovimiento AS tipo`
        )
      } else {
        tipoMovimiento = await dataSource.query(
          `SELECT tipo.tipo_movimiento_id, tipo.des_movimiento, tipo.signo, tipo.tipo_movimiento FROM lige.dbo.liqcotipomovimiento AS tipo WHERE tipo.tipo_movimiento_id = @0`
          , [TipoMovimientoFilter])
      }
      this.jsonRes(
        {
          total: tipoMovimiento.length,
          list: tipoMovimiento,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getTipoMovimiento(req: Request, res: Response, next: NextFunction) {

    const TipoMovimientoFilter = req.params.TipoMovimiento;
    try {

      const tipoMovimiento = await dataSource.query(
        `SELECT tipo.tipo_movimiento_id, tipo.des_movimiento, tipo.signo, tipo.tipo_movimiento FROM lige.dbo.liqcotipomovimiento AS tipo WHERE tipo.tipo_movimiento = @0`
        , [TipoMovimientoFilter])

      this.jsonRes(
        {
          total: tipoMovimiento.length,
          list: tipoMovimiento,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getDocumentInfo(documentId: Number) {


    return dataSource.query(
      `SELECT impoexpo_id AS id, path, nombre_archivo_orig AS name FROM lige.dbo.convalorimpoexpo WHERE impoexpo_id = @0`, [documentId])



  }

  async getByDownloadDocument(req: any, res: Response, next: NextFunction) {
    const documentId = Number(req.body.documentId);
    try {

      const document = await this.getDocumentInfo(documentId);

      const finalurl = `${this.directory}/${document[0]["path"]}`
      if (!existsSync(finalurl))
        throw new ClientException(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })

      res.download(finalurl, document[0]["name"])

    } catch (error) {
      return next(error)
    }
  }

  async getTipoCuenta(req: Request, res: Response, next: NextFunction) {
    try {

      const tipoCuenta = await dataSource.query(
        `SELECT tipo.tipocuenta_id,tipo.detalle FROM lige.dbo.liqcontipocuenta AS tipo`)

      this.jsonRes(
        {
          total: tipoCuenta.length,
          list: tipoCuenta,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }


  async getImportacionesAnteriores(
    Anio: string,
    Mes: string,
    req: Request,
    res: Response,
    next: NextFunction
  ) {

    try {

      const importacionesAnteriores = await dataSource.query(

        `SELECT impoexpo_id AS id, path, nombre_archivo_orig AS nombre, path, aud_fecha_ins AS fecha FROM lige.dbo.convalorimpoexpo WHERE anio = @0 AND mes = @1 AND ind_eliminado = 0`,
        [Anio, Mes])

      this.jsonRes(
        {
          total: importacionesAnteriores.length,
          list: importacionesAnteriores,
        },

        res
      );

    } catch (error) {
      return next(error)
    }
  }

  listaColumnas: any[] = [
    {
      id: "MovimientoId",
      name: "Movimiento",
      field: "MovimientoId",
      fieldName: "movimiento_id",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Periodo",
      type: "date",
      id: "periodo",
      field: "periodo",
      fieldName: "periodo",
      sortable: true,
      searchHidden: true,
      hidden: false,
    },
    {
      name: "Tipo Movimiento",
      type: "number",
      id: "tipo_movimiento_id",
      field: "tipo_movimiento_id",
      fieldName: "li.tipo_movimiento_id",
      searchComponent: "inpurForTipoMovimientoSearch",
      searchType: "number",
      sortable: true,
      hidden: true,
      searchHidden: false
    },
    {
      name: "Tipo Movimiento",
      type: "string",
      id: "des_movimiento",
      field: "des_movimiento",
      fieldName: "tipomo.des_movimiento",
      sortable: true,
      hidden: false,
      searchHidden: true
    },
    {
      name: "Fecha",
      type: "date",
      id: "fecha",
      field: "fecha",
      fieldName: "li.fecha",
      searchComponent: "inpurForFechaSearch",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Detalle",
      type: "string",
      id: "detalle",
      field: "detalle",
      fieldName: "detalle",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      name: "Objetivo",
      type: "string",
      id: "ObjetivoDescripcion",
      field: "ObjetivoDescripcion",
      fieldName: "li.objetivo_id",
      searchComponent: "inpurForObjetivoSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false
    },
    {
      name: "CUIT",
      type: "string",
      id: "PersonalCUITCUILCUIT",
      field: "PersonalCUITCUILCUIT",
      fieldName: "PersonalCUITCUILCUIT",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Persona",
      type: "string",
      id: "ApellidoNombre",
      field: "ApellidoNombre",
      fieldName: "li.persona_id",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Cuenta",
      type: "string",
      id: "tipocuenta_id",
      field: "tipocuenta_id",
      fieldName: "li.tipocuenta_id",
      searchType: "string",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Horas",
      type: "number",
      id: "horas",
      field: "horas",
      fieldName: "horas",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Importe",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Categoria Personal",
      type: "currency",
      id: "CategoriaPersonalDescripcion",
      field: "CategoriaPersonalDescripcion",
      fieldName: "CategoriaPersonalDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },


  ];

  async getByLiquidaciones(
    req: any,
    res: Response, next: NextFunction
  ) {

    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)


    try {

      const liqudacion = await dataSource.query(
        `SELECT li.movimiento_id, li.movimiento_id AS id,CONCAT(per.mes,'/',per.anio) AS periodo,tipomo.des_movimiento,li.fecha,li.detalle,obj.ObjetivoDescripcion,CONCAT(TRIM(pers.PersonalApellido),', ', TRIM(pers.PersonalNombre)) AS ApellidoNombre,
        li.tipocuenta_id, li.importe * tipomo.signo AS importe, li.tipo_movimiento_id, li.persona_id,li.objetivo_id, li.horas, cuit.PersonalCUITCUILCUIT,
        cat.CategoriaPersonalDescripcion
        FROM lige.dbo.liqmamovimientos AS li
        INNER JOIN lige.dbo.liqcotipomovimiento AS tipomo ON li.tipo_movimiento_id = tipomo.tipo_movimiento_id 
        INNER JOIN lige.dbo.liqmaperiodo AS per ON li.periodo_id = per.periodo_id 
        LEFT JOIN Personal AS pers ON li.persona_id = pers.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = pers.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = pers.PersonalId) 
        LEFT JOIN CategoriaPersonal cat ON cat.TipoAsociadoId=li.tipo_asociado_id AND cat.CategoriaPersonalId =li.categoria_personal_id
        LEFT JOIN Objetivo AS obj ON li.objetivo_id = obj.ObjetivoId
        WHERE per.anio = @0 AND per.mes = @1 AND (${filterSql}) 
       ${orderBy}
        `, [anio, mes])

      this.jsonRes(
        {
          total: liqudacion.length,
          list: liqudacion,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getLiquidacionesCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async setDeeleteimportacionesQuerys(queryRunner: QueryRunner, deleteId: any, res: Response) {
    if (deleteId != null) {

      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.query(
        `UPDATE lige.dbo.convalorimpoexpo SET ind_eliminado = 1 WHERE impoexpo_id = @0`,
        [deleteId]
      );
      await queryRunner.query(
        `DELETE FROM lige.dbo.liqmamovimientos WHERE impoexpo_id = @0`,
        [deleteId]
      );

      await queryRunner.commitTransaction();

      this.jsonRes({ list: [] }, res, `Se eliminaron con exito los registros `);
    }
  }

  async setDeleteImportaciones(req: Request, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let periodo = req.body[1].split('/');
    let fechaActual = new Date()
    let deleteId = req.body[0].deleteId
    const queryRunner = dataSource.createQueryRunner();

    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseFloat(periodo[1]), parseFloat(periodo[0]), usuario, ip)
    console.log("periodo_id" + periodo_id)
    const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

    console.log("estan generados ? " + getRecibosGenerados[0].ind_recibos_generados)
    if (getRecibosGenerados[0].ind_recibos_generados == 1) {
      this.jsonRes({ list: [] }, res, `Los recibos para este periodo ya se generaron, no se pueden eliminar `);
    } else {
      try {
        await this.setDeeleteimportacionesQuerys(queryRunner, deleteId, res)
      } catch (error) {
        this.rollbackTransaction(queryRunner)
        return next(error)
      } finally {
        //   await queryRunner.release();
      }

    }

  }


  async setAgregarRegistros(req: any, res: Response, next: NextFunction) {

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    let fechaActual = new Date()
    const periodo = req.body[0].split('/');
    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, parseFloat(periodo[1]), parseFloat(periodo[0]), usuario, ip)

    const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)


    try {
      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`)
  
      await queryRunner.connect();
      await queryRunner.startTransaction();

      for (const row of req.body[1].gridDataInsert) {


        let tipo_movimiento_id = row.des_movimiento.id
        let tipocuenta_id = row.des_cuenta.id
        let detalle = row.detalle
        let objetivo_id = row.ObjetivoDescripcion?.id == undefined ? null : row.ObjetivoDescripcion?.id
        let persona_id = row.ApellidoNombre?.id == undefined ? null : row.ApellidoNombre.id
        let importe = row.monto

        if (!tipocuenta_id) throw new ClientException("No se especificó el tipo de cuenta")
        if (!tipo_movimiento_id) throw new ClientException("No se especificó el movimiento")


        let movimiento_id = await Utils.getMovimientoId(queryRunner)

        await queryRunner.query(
          `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, tipocuenta_id, fecha, detalle, objetivo_id, persona_id, importe,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
                  `,
          [
            ++movimiento_id,
            periodo_id,
            tipo_movimiento_id,
            tipocuenta_id,
            fechaActual,
            detalle,
            objetivo_id,
            persona_id,
            importe,
            usuario, ip, fechaActual, usuario, ip, fechaActual,
          ]
        );
      }

      //throw new ClientException("Paso oka")
      await queryRunner.commitTransaction();

      this.jsonRes({ list: [] }, res, `Se procesaron ${req.body[1].gridDataInsert.length} registros `);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      //   await queryRunner.release();
    }

  }


  async handleXLSUpload(req: Request, res: Response, next: NextFunction) {

    const file = req.file;
    const anio = Number(req.body.anio)
    const mes = Number(req.body.mes)
    const fechaActual = new Date();
    const queryRunner = dataSource.createQueryRunner()
    const tipocuenta_id = req.body.tipocuenta
    const tipo_movimiento_id = req.body.movimiento
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let newFilePath = ""

    let dataset = []
    let datasetid = 0

    try {
      if (!anio) throw new ClientException("Faltó indicar el anio");
      if (!mes) throw new ClientException("Faltó indicar el mes");
      if (!tipocuenta_id) new ClientException("No se especificó el tipo de cuenta")
      if (!tipo_movimiento_id) new ClientException("No se especificó el movimiento")
      const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anio, mes, usuario, ip)

      await queryRunner.connect();
      await queryRunner.startTransaction();

      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`)
      //const importeRequest = req.body.monto;
      //const cuitRequest = req.body.cuit;

      //if (!importeRequest) throw new ClientException("Faltó indicar el importe.");


      mkdirSync(`${this.directory}/${anio}`, { recursive: true });

      const workSheetsFromBuffer = xlsx.parse(readFileSync(file.path))
      const sheet1 = workSheetsFromBuffer[0];

      let movimiento_id = await Utils.getMovimientoId(queryRunner)
      const convalorimpoexpo_id = await this.getProxNumero(queryRunner, `convalorimpoexpo`, usuario, ip)

      let contador = 0

      newFilePath = `${anio}/${anio}-${mes
          .toString()
          .padStart(2, "0")}-${convalorimpoexpo_id}.xls`;

      if (existsSync(`${this.directory}/${newFilePath}`)) throw new ClientException("El documento ya existe.");

      let TipoMovimiento = "E"
      let entidad = "liquidacion"
      // file.originalfilename
      // newFilePath
      // Si fue eliminado
      await queryRunner.query(
        `INSERT INTO lige.dbo.convalorimpoexpo (impoexpo_id, tipo_movimiento, path, nombre_archivo_orig, nombre_entidad, ind_eliminado,
          aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod, mes, anio)
            VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13)
                  `,
        [
          convalorimpoexpo_id,
          TipoMovimiento,
          newFilePath,
          file.originalname,
          entidad,
          0,
          usuario, ip, fechaActual, usuario, ip, fechaActual,
          mes,
          anio
        ]
      );
      for (const row of sheet1.data) {
        const cuit = String(row[1]).match(/[0-9]{11}/)
        const detalle = String((row[2]) ? row[2] : '').match(/.{3,}/)
        const importe = String(row[3]).match(/\d*[\.\,]\d*|\d{1,}/)

        contador++

        if (contador == 1 && (cuit == null || detalle == null || importe == null))
          continue

        if (cuit == null && detalle == null && importe == null)
          continue

        if (cuit == null)
          dataset.push({ id: datasetid++, NombreApellido: row[0], cuit: cuit, Detalle: `CUIT no válido` })

        const persona = await queryRunner.query(`SELECT personalId FROM dbo.PersonalCUITCUIL WHERE PersonalCUITCUILCUIT = @0`, [cuit[0]])
        if (persona.length == 0)
          dataset.push({ id: datasetid++, NombreApellido: row[0], cuit: cuit, Detalle: ` CUIT no localizado` })

        if (detalle == null)
          dataset.push({ id: datasetid++, NombreApellido: row[0], cuit: cuit, Detalle: ` Detalle vacío` })

        if (Number(importe[0]) <= 0 || Number.isNaN(Number(importe[0])))
          dataset.push({ id: datasetid++, NombreApellido: row[0], cuit: cuit, Detalle: ` Importe vacío` })

        if (dataset.length == 0)
          await queryRunner.query(
            `INSERT INTO lige.dbo.liqmamovimientos (movimiento_id, periodo_id, tipo_movimiento_id, tipocuenta_id, fecha, detalle, objetivo_id, persona_id, importe,
                  aud_usuario_ins, aud_ip_ins, aud_fecha_ins, aud_usuario_mod, aud_ip_mod, aud_fecha_mod,impoexpo_id)
                    VALUES(@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15)
                          `,
            [
              ++movimiento_id,
              periodo_id,
              tipo_movimiento_id,
              tipocuenta_id,
              fechaActual,
              detalle[0],
              0,
              persona[0].personalId,
              importe[0],
              usuario, ip, fechaActual, usuario, ip, fechaActual,
              convalorimpoexpo_id
            ]
          );
      }//For

      if (dataset.length > 0)
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo`, { list: dataset })

      await queryRunner.commitTransaction();
      copyFileSync(file.path, `${this.directory}/${newFilePath}`);
      this.jsonRes({}, res, `XLS Recibido y se procesaron ${contador} registros`);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
      unlinkSync(file.path);

    }
  }
}

