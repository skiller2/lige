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

export class DocumentoController extends BaseController {

  listaDocumento: any[] = [
    {
      id: "id", name: "ID", field: "id",
      fieldName: "id",
      type: "number",
      sortable: false,
      searchHidden: true,
      hidden: true,
      maxWidth: 150,
    },
    {
      id: "DocumentoId", name: "Id", field: "DocumentoId",
      fieldName: "docg.DocumentoId",
      type: "number",
      sortable: false,
      searchHidden: false,
      hidden: false,
      maxWidth: 150,
    },
    {
      id: "DocumentoDenominadorDocumento",
      name: "Denominacion",
      field: "DocumentoDenominadorDocumento",
      fieldName: "docg.DocumentoDenominadorDocumento",
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
      fieldName: "tipo.DocumentoTipoCodigo",
      searchComponent: "inpurForTipoDocumentoSearch",
      searchType: "string",
      hidden: true,
      searchHidden: false,
    },
    {
      id: "DocumentoTipoDetalle", name: "Tipo", field: "DocumentoTipoDetalle",
      type: "string",
      fieldName: "tipo.DocumentoTipoDetalle",
      searchComponent: "inpurForTipoDocumentoSearch",
      searchType: "string",
      hidden: false,
      searchHidden: true,
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
      id: "DocumentoFecha",
      name: "Desde",
      field: "DocumentoFecha",
      type: "date",
      fieldName: "docg.DocumentoFecha",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "DocumentoFechaDocumentoVencimiento",
      name: "Hasta",
      field: "DocumentoFechaDocumentoVencimiento",
      type: "date",
      fieldName: "docg.DocumentoFechaDocumentoVencimiento",
      searchComponent: "inpurForFechaSearch",
      searchType: "date",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      id: "DocumentoDetalle",
      name: "Detalle Documento",
      field: "DocumentoDetalle",
      fieldName: "docg.DocumentoDetalle",
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
      id: "SituacionRevistaId",
      name: "Situacion Revista",
      field: "SituacionRevistaId",
      type: "number",
      fieldName: "sitrev.SituacionRevistaId",
      searchComponent: "inpurForSituacionRevistaSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true,
    },
    {
      id: "SituacionRevistaDescripcion",
      name: "Situacion Revista",
      field: "SituacionRevistaDescripcion",
      type: "string",
      fieldName: "sitrev.SituacionRevistaDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: true,
      hidden: false,
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
      id: "SituacionRevistaId",
      name: "Situacion Revista",
      field: "SituacionRevistaId",
      type: "number",
      fieldName: "sitrev.SituacionRevistaId",
      searchComponent: "inpurForSituacionRevistaSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true,
    },
    {
      id: "SituacionRevistaDescripcion",
      name: "Situacion Revista",
      field: "SituacionRevistaDescripcion",
      type: "string",
      fieldName: "sitrev.SituacionRevistaDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: true,
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
    this.jsonRes(this.listaDocumento, res);
  }


  async getdocgenralListQuery(filterSql: any, orderBy: any) {

    const result = await dataSource.query(`
      SELECT  ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) id,
      docg.DocumentoId,
      docg.DocumentoDenominadorDocumento,
      tipo.DocumentoTipoDetalle AS DocumentoTipoDetalle,
      docg.DocumentoTipoCodigo AS DocumentoTipoCodigo, 
      docg.DocumentoFecha, docg.DocumentoFechaDocumentoVencimiento,
      CONCAT(TRIM(pers.PersonalApellido), ', ', TRIM(pers.PersonalNombre)) ApellidoNombre,
      obj.ObjetivoId, TRIM(eledep.ClienteElementoDependienteDescripcion) ClienteElementoDependienteDescripcion,
      cli.ClienteId, cli.ClienteDenominacion
      FROM Documento AS docg   
      LEFT JOIN DocumentoTipo AS tipo ON docg.DocumentoTipoCodigo = tipo.DocumentoTipoCodigo
      LEFT JOIN Personal AS pers ON docg.PersonalId = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docg.ObjetivoId = obj.ObjetivoId
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docg.Documentoanio = per.anio AND docg.Documentomes = per.mes
      LEFT JOIN lige.dbo.Cliente AS cli ON docg.DocumentoClienteId = cli.ClienteId
      WHERE ${filterSql}
      ${orderBy}
    `,)

    let list = result.map((obj: any) => {
      obj.cliente = { id: obj.ClienteId, fullname: obj.ClienteDenominacion }
      obj.objetivo = { id: obj.ObjetivoId, fullname: obj.ClienteElementoDependienteDescripcion }
      delete obj.cliente_id
      delete obj.ClienteDenominacion
      delete obj.ObjetivoId
      delete obj.ClienteElementoDependienteDescripcion
      return obj
    })
    return list
  }

  async getdocgenralList(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaDocumento);
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
          SELECT tipo.DocumentoTipoCodigo value, TRIM(tipo.DocumentoTipoDetalle) label, tipo.DocumentoTipoDescripcionDenominadorDocumento des_den_documento
          FROM DocumentoTipo tipo`)
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

  async addDocumento(req: any, res: Response, next: NextFunction) {
    const den_documento: string = req.body.DocumentoDenominadorDocumento
    const persona_id: number | null = req.body.PersonalId === 0 ? null : req.body.PersonalId;
    const cliente_id: number | null = req.body.DocumentoClienteId === 0 ? null : req.body.DocumentoClienteId;
    const objetivo_id: number | null = req.body.ObjetivoId === 0 ? null : req.body.ObjetivoId;
    const fecha: Date = req.body.Documentofecha ? new Date(req.body.Documentofecha) : null
    const fec_doc_ven: Date = req.body.DocumentoFechaDocumentoVencimiento ? new Date(req.body.DocumentoFechaDocumentoVencimiento) : null
    const ind_descarga_bot: boolean = req.body.DocumentoIndividuoDescargaBot
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

      archivos[0].ind_descarga_bot = ind_descarga_bot
      const uploadResult = await FileUploadController.handleDOCUpload(persona_id, objetivo_id, cliente_id, null, fecha, fec_doc_ven, den_documento, null, null, archivos[0], usuario, ip, queryRunner)
      const doc_id = uploadResult && typeof uploadResult === 'object' ? uploadResult.doc_id : undefined;



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
      SELECT CONCAT(des.doc_id,'-',ROW_NUMBER() OVER (PARTITION BY des.doc_id ORDER BY des.fecha_descarga)) AS id
          , des.doc_id
          , des.fecha_descarga
          , des.telefono
          , per.PersonalId
          , CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre
          , cuit.PersonalCUITCUILCUIT
          , sitrev.SituacionRevistaDescripcion
      FROM lige.dbo.doc_descaga_log AS des
      LEFT JOIN Personal per ON des.personal_id = per.PersonalId
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId)
      LEFT JOIN PersonalSituacionRevista persitrev ON persitrev.PersonalId = per.PersonalId and persitrev.PersonalSituacionRevistaDesde<=GETDATE() AND ISNULL(persitrev.PersonalSituacionRevistaHasta, '9999-12-31')>= GETDATE() 
      LEFT JOIN SituacionRevista sitrev ON sitrev.SituacionRevistaId = persitrev.PersonalSituacionRevistaSituacionId
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
      
      SELECT per.PersonalId AS id, tel.telefono,
            per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ', ', TRIM(per.PersonalNombre)) ApellidoNombre,
            cuit.PersonalCUITCUILCUIT,
          sitrev.SituacionRevistaDescripcion 
      FROM Personal per
      LEFT JOIN lige.dbo.regtelefonopersonal tel ON tel.personal_id = per.PersonalId
      LEFT JOIN lige.dbo.doc_descaga_log des ON des.telefono = tel.telefono and des.doc_id = @0
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
      --LEFT JOIN (
      --    SELECT p.PersonalId, p.PersonalSituacionRevistaSituacionId, s.SituacionRevistaDescripcion,p.PersonalSituacionRevistaDesde
      --    FROM PersonalSituacionRevista p
      --    JOIN SituacionRevista s
      --    ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= CAST(GETDATE() AS DATE)
      --  ) sitrev ON sitrev.PersonalId = per.PersonalId
      LEFT JOIN PersonalSituacionRevista persitrev ON persitrev.PersonalId = per.PersonalId and persitrev.PersonalSituacionRevistaDesde<=GETDATE() AND ISNULL(persitrev.PersonalSituacionRevistaHasta, '9999-12-31')>= GETDATE() 
      LEFT JOIN SituacionRevista sitrev ON sitrev.SituacionRevistaId = persitrev.PersonalSituacionRevistaSituacionId


      WHERE des.telefono IS NULL
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

  async updateDocumento(req: any, res: Response, next: NextFunction) {
    const doc_id = req.body.DocumentoId
    const doctipo_id: string = req.body.DocumentoTipoCodigo
    const den_documento: string = req.body.DocumentoDenominadorDocumento
    const persona_id: number = req.body.PersonalId
    const cliente_id: number = req.body.DocumentoClienteId
    const objetivo_id: number = req.body.ObjetivoId
    const fecha: Date = req.body.Documentofecha ? new Date(req.body.Documentofecha) : req.body.Documentofecha
    const fec_doc_ven: Date = req.body.DocumentoFechaDocumentoVencimiento ? new Date(req.body.DocumentoFechaDocumentoVencimiento) : req.body.DocumentoFechaDocumentoVencimiento
    const ind_descarga_bot: boolean = req.body.DocumentoIndividuoDescargaBot
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)

    const now = new Date()

    try {
      await queryRunner.startTransaction()
      //Validaciones
      const telefonos = await dataSource.query(`
        SELECT telefono
        FROM lige.dbo.doc_descaga_log
        WHERE doc_id IN (@0)
        `, [doc_id])

      if (telefonos.length) {
        const doc = await queryRunner.query(`
          SELECT DocumentoTipoCodigo, PersonalId, ObjetivoId, DocumentoClienteId, DocumentoIndividuoDescargaBot
          FROM Documento
          WHERE DocumentoId IN (@0)
        `, [doc_id])

        if (doc[0].DocumentoTipoCodigo != doctipo_id
          || doc[0].PersonalId != persona_id
          || doc[0].ObjetivoId != objetivo_id
          || doc[0].DocumentoClienteId != cliente_id
          || doc[0].DocumentoIndividuoDescargaBot != ind_descarga_bot
        ) {
          throw new ClientException('El Documento tiene registros de descarga. Solo se puede modificar la fecha desde, hasta y la denominacion del documento.')
        }

        // Valida si el archivo es update
        if (Array.isArray(req.body.archivo)) {
          for (const data of req.body.archivo) {
            if (data && data.update) throw new ClientException('El Documento tiene registros de descarga. Solo se puede modificar la fecha desde, hasta y la denominacion del documento.')
          }
        }
      }

      const valsTipoDocumento = this.valsTipoDocumento(req.body)
      if (valsTipoDocumento instanceof ClientException)
        throw valsTipoDocumento


      if (req.body.archivo) {
        const archivosActualizados = req.body.archivo.map(file => ({
          ...file,
          doctipo_id: file.doctipo_id !== doctipo_id ? doctipo_id : file.doctipo_id
        }));
        req.body.archivo = archivosActualizados;
      }

      if (req.body.archivo) {
        for (const file of req.body.archivo) {
          file.ind_descarga_bot = ind_descarga_bot
          await FileUploadController.handleDOCUpload(persona_id, objetivo_id, cliente_id, doc_id, fecha, fec_doc_ven, den_documento, null, null, file, usuario, ip, queryRunner)
        }
      }

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
    const doctipo_id: string = tipoDocumento.DocumentoTipoCodigo
    const den_documento: string = tipoDocumento.DocumentoDenominadorDocumento
    const persona_id: number = tipoDocumento.PersonalId
    const cliente_id: number = tipoDocumento.DocumentoClienteId
    const objetivo_id: number = tipoDocumento.ObjetivoId
    const fecha: Date = tipoDocumento.Documentofecha ? new Date(tipoDocumento.Documentofecha) : tipoDocumento.Documentofecha
    const fec_doc_ven: Date = tipoDocumento.DocumentoFechaDocumentoVencimiento ? new Date(tipoDocumento.DocumentoFechaDocumentoVencimiento) : tipoDocumento.DocumentoFechaDocumentoVencimiento

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

  async getDocumentoById(req: any, res: Response, next: NextFunction) {
    const doc_id: number = req.params.id;
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.startTransaction()
      const doc = await queryRunner.query(`
        SELECT DocumentoId, Documentoanio, Documentomes, Documentofecha, DocumentoFechaDocumentoVencimiento, DocumentoTipoCodigo,
        PersonalId, ObjetivoId, DocumentoDenominadorDocumento, DocumentoClienteId,
        RIGHT(DocumentoNombreArchivo, CHARINDEX('.', REVERSE(DocumentoNombreArchivo)) - 1) AS extension,
        DocumentoNombreArchivo, DocumentoIndividuoDescargaBot
        FROM documento
        WHERE DocumentoId IN (@0)
      `, [doc_id])
      await queryRunner.commitTransaction()
      this.jsonRes(doc[0], res, 'Carga Exitosa');
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

}
