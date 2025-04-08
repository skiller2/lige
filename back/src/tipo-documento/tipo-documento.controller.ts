import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import {
  filtrosToSql,
  getOptionsFromRequest,
  isOptions,
  orderToSQL,
} from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { mkdirSync, existsSync, renameSync, copyFileSync, unlinkSync, constants } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import * as path from 'path';
import { FileUploadController } from "src/controller/file-upload.controller";
import * as fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

export class TipoDocumentoController extends BaseController {

  listaTipoDocumento: any[] = [
    {
      id: "id", name: "ID", field: "id",
      fieldName: "docg.doc_id",
      type: "number",
      sortable: true,
      hidden: false,
      maxWidth: 150,
    },
    {
      id: "den_documento", name: "Denominacion", field: "den_documento",
      fieldName: "docg.den_documento",
      type: "number",
      sortable: true,
      hidden: false,
      maxWidth: 150,
    },
    {
      id: "ApellidoNombre", name: "Personal", field: "ApellidoNombre",
      type: "string",
      fieldName: "pers.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "tipo", name: "Tipo", field: "tipo",
      type: "string",
      fieldName: "tipo.detalle",
      searchComponent: "inpurForTipoDocumentoSearch",
      searchType: "string",
      hidden: false,
      searchHidden: false,
      maxWidth: 250,
    },
    {
      id: "objetivo", name: "Objetivo", field: "objetivo.fullname",
      fieldName: "obj.ObjetivoId",
      type: "string",
      formatter: 'complexObject',
      params: {
        complexFieldLabel: 'objetivo.fullname',
      },
      searchComponent: "inpurForObjetivoSearch",
      searchType: "number",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      id: 'cliente', name: 'Cliente', field: 'cliente.fullname',
      fieldName: "cli.ClienteId",
      type: 'string',
      formatter: 'complexObject',
      params: {
        complexFieldLabel: 'cliente.fullname',
      },
      searchComponent: "inpurForClientSearch",
      searchType: "number",
      sortable: true,
      hidden: false,
      searchHidden: false
    },
    {
      id: "fecha", name: "Desde", field: "fecha",
      type: "date",
      fieldName: "docg.fecha",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "fec_doc_ven", name: "Hasta", field: "fec_doc_ven",
      type: "date",
      fieldName: "docg.fec_doc_ven",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "detalle_documento", name: "Detalle Documento", field: "detalle_documento",
      fieldName: "docg.detalle_documento",
      type: "string",
      searchType: "string",
      sortable: true,
      hidden: true,
      searchHidden: false,
    },
  ];

  listaPersonalDescarga: any[] = [
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
      id: "ApellidoNombre",
      name: "Apellido Nombre",
      field: "ApellidoNombre",
      type: "string",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "PersonalCUITCUILCUIT",
      name: "CUIT",
      field: "PersonalCUITCUILCUIT",
      type: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "telefono",
      name: "Telefono",
      field: "telefono",
      type: "string",
      fieldName: "des.telefono",
      sortable: true,
      hidden: false,
      searchHidden: true,
      maxWidth: 250,
    },
    {
      id: "fecha_descarga",
      name: "Fecha",
      field: "fecha_descarga",
      type: "dateTime",
      fieldName: "des.fecha_descarga",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    }
  ];

  listaPersonalNoDescarga: any[] = [
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
      id: "PersonalCUITCUILCUIT",
      name: "CUIT",
      field: "PersonalCUITCUILCUIT",
      type: "PersonalCUITCUILCUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "ApellidoNombre",
      name: "Apellido Nombre",
      field: "ApellidoNombre",
      type: "string",
      fieldName: "per.PersonalId",
      searchComponent: "inpurForPersonalSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "telefono",
      name: "Telefono",
      field: "telefono",
      type: "string",
      fieldName: "tel.telefono",
      sortable: true,
      hidden: false,
      searchHidden: true,
      maxWidth: 250,
    }
  ];

  async getGridCols(req, res) {
    this.jsonRes(this.listaTipoDocumento, res);
  }


  async getdocgenralListQuery(filterSql: any, orderBy: any) {

    const result = await dataSource.query(`
      SELECT docg.doc_id AS id,
      docg.den_documento,
      tipo.detalle AS tipo, 
      docg.fecha, docg.fec_doc_ven,
      CONCAT(TRIM(pers.PersonalApellido), ', ', TRIM(pers.PersonalNombre)) ApellidoNombre,
      obj.ObjetivoId, TRIM(obj.ObjetivoDescripcion) ObjetivoDescripcion,
      cli.ClienteId, cli.ClienteDenominacion
      FROM lige.dbo.docgeneral AS docg 
      LEFT JOIN lige.dbo.doctipo AS tipo ON docg.doctipo_id = tipo.doctipo_id
      LEFT JOIN Personal AS pers ON docg.persona_id = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docg.objetivo_id = obj.ObjetivoId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docg.periodo = per.periodo_id
      LEFT JOIN lige.dbo.Cliente AS cli ON docg.cliente_id = cli.ClienteId
      WHERE ${filterSql}
      ${orderBy}
    `,)

    let list = result.map((obj: any) => {
      obj.cliente = { id: obj.ClienteId, fullname: obj.ClienteDenominacion }
      obj.objetivo = { id: obj.ObjetivoId, fullname: obj.ObjetivoDescripcion }
      delete obj.cliente_id
      delete obj.ClienteDenominacion
      delete obj.ObjetivoId
      delete obj.ObjetivoDescripcion
      return obj
    })
    return list
  }

  async getdocgenralList(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaTipoDocumento);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      const TipoDocumentos = await this.getdocgenralListQuery(filterSql, orderBy)
      // console.log("movimientosPendientes " +  TipoDocumentos.length)
      this.jsonRes(
        {
          total: TipoDocumentos.length,
          list: TipoDocumentos,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  private async getTiposDocumentoQuery(queryRunner: any) {
    return await queryRunner.query(`
          SELECT tipo.doctipo_id value, TRIM(tipo.detalle) label, des_den_documento
          FROM lige.dbo.doctipo tipo`)
  }

  async getTipos(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTiposDocumentoQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  async addTipoDocumento(req: any, res: Response, next: NextFunction) {
    const doctipo_id: string = req.body.doctipo_id
    const den_documento: string = req.body.den_documento
    const persona_id: number = req.body.persona_id
    const cliente_id: number = req.body.cliente_id
    const objetivo_id: number = req.body.objetivo_id
    const fecha: Date = req.body.fecha ? new Date(req.body.fecha) : null
    const fec_doc_ven: Date = req.body.fec_doc_ven ? new Date(req.body.fec_doc_ven) : null
    const archivos: any[] = req.body.archivo
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const now = new Date()
    try {
      await queryRunner.startTransaction()
      const valsTipoDocumento = this.valsTipoDocumento(req.body)
      if (valsTipoDocumento instanceof ClientException)
        throw valsTipoDocumento

      const doc_id = await FileUploadController.handleDOCUpload(persona_id, objetivo_id, cliente_id, 0, fecha, fec_doc_ven, den_documento, archivos[0], usuario, ip, queryRunner)

      // throw new ClientException('DEBUG')
      await queryRunner.commitTransaction()
      this.jsonRes({ doc_id }, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getPersonalDescargaQuery(filterSql: any, orderBy: any, doc_id: number) {
    return dataSource.query(`
      SELECT CONCAT(des.doc_id,'-',cuit.PersonalCUITCUILCUIT,'-',des.fecha_descarga) AS id, des.doc_id, des.fecha_descarga, des.telefono,
      per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
      cuit.PersonalCUITCUILCUIT
      FROM lige.dbo.doc_descaga_log AS des 
      LEFT JOIN Personal per ON des.personal_id = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId
      WHERE des.doc_id IN (@0)
      AND ${filterSql}
      ${orderBy}
    `, [doc_id])
  }

  async getPersonalDescarga(req: any, res: Response, next: NextFunction) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null }
    const filterSql = filtrosToSql(options.filtros, this.listaPersonalDescarga)
    const orderBy = orderToSQL(options.sort)
    const doc_id = req.body.doc_id
    try {
      const PersonalDescarga = await this.getPersonalDescargaQuery(filterSql, orderBy, doc_id)

      this.jsonRes(
        {
          length: PersonalDescarga.length,
          list: PersonalDescarga,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getGridDownloadCols(req, res) {
    this.jsonRes(this.listaPersonalDescarga, res);
  }

  private async getPersonalNoDescargaQuery(filterSql: any, orderBy: any, doc_id: number) {
    return dataSource.query(`
      SELECT DISTINCT per.PersonalId AS id, tel.telefono,
      per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
      cuit.PersonalCUITCUILCUIT
      FROM lige.dbo.regtelefonopersonal tel
      LEFT JOIN lige.dbo.doc_descaga_log des ON des.telefono != tel.telefono AND des.doc_id NOT IN (@0)
      LEFT JOIN Personal per ON tel.personal_id = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId
      LEFT JOIN (
          SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
          FROM PersonalSituacionRevista p
          JOIN SituacionRevista s
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= CAST(GETDATE() AS DATE)
			) sitrev ON sitrev.PersonalId = per.PersonalId
      WHERE sitrev.PersonalSituacionRevistaSituacionId IN (2,10,11)
      AND ${filterSql}
      ${orderBy}
    `, [doc_id])
  }

  async getPersonalNoDescarga(req: any, res: Response, next: NextFunction) {
    const options: Options = isOptions(req.body.options) ? req.body.options : { filtros: [], sort: null }
    const filterSql = filtrosToSql(options.filtros, this.listaPersonalDescarga)
    const orderBy = orderToSQL(options.sort)
    const doc_id = req.body.doc_id
    try {
      const PersonalDescarga = await this.getPersonalNoDescargaQuery(filterSql, orderBy, doc_id)
      this.jsonRes(
        {
          length: PersonalDescarga.length,
          list: PersonalDescarga,
        },
        res
      );

    } catch (error) {
      return next(error)
    }
  }

  async getGridNoDownloadCols(req, res) {
    this.jsonRes(this.listaPersonalNoDescarga, res);
  }

  async updateTipoDocumento(req: any, res: Response, next: NextFunction) {
    const doc_id = req.body.doc_id
    const doctipo_id: string = req.body.doctipo_id
    const den_documento: string = req.body.den_documento
    const persona_id: number = req.body.persona_id
    const cliente_id: number = req.body.cliente_id
    const objetivo_id: number = req.body.objetivo_id
    const fecha: Date = req.body.fecha ? new Date(req.body.fecha) : req.body.fecha
    const fec_doc_ven: Date = req.body.fec_doc_ven ? new Date(req.body.fec_doc_ven) : req.body.fec_doc_ven
    const archivo: any[] = req.body.archivo
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const now = new Date()
    try {
      await queryRunner.startTransaction()

      const valsTipoDocumento = this.valsTipoDocumento(req.body)
      if (valsTipoDocumento instanceof ClientException)
        throw valsTipoDocumento

      

      await FileUploadController.handleDOCUpload(persona_id, objetivo_id, cliente_id, doc_id, fecha, fec_doc_ven, den_documento, (archivo?.length) ?archivo![0]:null, usuario, ip, queryRunner)

      // throw new ClientException('DEBUG')
      await queryRunner.commitTransaction()
      this.jsonRes({}, res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private valsTipoDocumento(tipoDocumento: any) {
    const doctipo_id: string = tipoDocumento.doctipo_id
    const den_documento: string = tipoDocumento.den_documento
    const persona_id: number = tipoDocumento.persona_id
    const cliente_id: number = tipoDocumento.cliente_id
    const objetivo_id: number = tipoDocumento.objetivo_id
    const fecha: Date = tipoDocumento.fecha ? new Date(tipoDocumento.fecha) : tipoDocumento.fecha
    const fec_doc_ven: Date = tipoDocumento.fec_doc_ven ? new Date(tipoDocumento.fec_doc_ven) : tipoDocumento.fec_doc_ven

    let campos_vacios: any[] = []

    if (!doctipo_id) campos_vacios.push(`- Tipo de documento`)
    if (!den_documento) campos_vacios.push(`- Denominación de documento`)
    if ((doctipo_id == 'LIC' || doctipo_id == 'REC') && !Number.isInteger(persona_id)) campos_vacios.push(`- Persona`)
    if (doctipo_id == 'CLI' && !Number.isInteger(cliente_id)) campos_vacios.push(`- Cliente`)
    if (doctipo_id == 'OBJ' && !Number.isInteger(objetivo_id)) campos_vacios.push(`- Objetivo`)
    if (!fecha) campos_vacios.push(`- Desde`)
    // if (!fec_doc_ven) campos_vacios.push(`- Hasta`)

    if (campos_vacios.length) {
      campos_vacios.unshift('Debe completar los siguientes campos: ')
      return new ClientException(campos_vacios)
    }
  }

  async getTipoDocumentoById(req: any, res: Response, next: NextFunction) {
    const id: number = req.params.id;
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()
      const doc = await queryRunner.query(`
        SELECT doc_id, periodo, fecha, fec_doc_ven, doctipo_id, persona_id, objetivo_id, den_documento, cliente_id,
        RIGHT(nombre_archivo, CHARINDEX('.', REVERSE(nombre_archivo)) - 1) AS extension,
        nombre_archivo
        FROM lige.dbo.docgeneral
        WHERE doc_id IN (@0)
      `, [id])
      await queryRunner.commitTransaction()
      this.jsonRes(doc[0], res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  async deleteArchivo(req: Request, res: Response, next: NextFunction) {
  
      let deleteId = Number(req.query[0])
      const queryRunner = dataSource.createQueryRunner();
      try {
  
        const document = await dataSource.query(`
          SELECT doc_id AS id, path, nombre_archivo AS name
          FROM lige.dbo.docgeneral
          WHERE doc_id = @0
          `, [deleteId])
        const finalurl = `${document[0]["path"]}`
  
        if (document.length > 0) {
          if (!existsSync(finalurl)) {
            console.log(`Archivo ${document[0]["name"]} no localizado`, { path: finalurl })
          } else {
            await unlink(finalurl);
          }
          throw new ClientException('DEBUG')
          await queryRunner.connect();
          await queryRunner.startTransaction();
  
          await queryRunner.query(`DELETE FROM lige.dbo.docgeneral WHERE doc_id = @0`, [deleteId])
  
          await queryRunner.commitTransaction();
        }
  
        this.jsonRes({ list: [] }, res, `Archivo borrado con exito`);
  
      } catch (error) {
        await this.rollbackTransaction(queryRunner)
        return next(error)
      }
  
    }

}
