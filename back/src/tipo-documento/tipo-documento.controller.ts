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
import { mkdirSync, existsSync, renameSync } from "fs";

export class TipoDocumentoController extends BaseController {

  listaTipoDocumento: any[] = [
    {
      id: "id",
      name: "ID",
      field: "id",
      fieldName: "id",
      type: "number",
      sortable: true,
      hidden: false,
      maxWidth: 100,
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
      searchHidden:false,
      maxWidth: 250,
    },
    {
      id: "objetivo", name: "Objetivo", field: "objetivo.fullname",
      fieldName: "obj.objetivo_id",
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
      name: "Periodo",
      type: "periodo",
      id: "periodo",
      field: "periodo",
      fieldName: "periodo",
      sortable: true,
      hidden: false,
      searchHidden:false,
      maxWidth: 150,
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
      searchHidden:true,
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
      searchHidden:true,
      maxWidth: 250,
    }
  ];

  async getGridCols(req, res) {
    this.jsonRes(this.listaTipoDocumento, res);
  }


  async getdocgenralListlist(filterSql: any, orderBy: any, anio:number, mes:number) {

    const result = await dataSource.query(`
      SELECT doc_id AS id, 
      tipo.detalle AS tipo, 
      fecha, 
      CONCAT(TRIM(pers.PersonalApellido), ', ', TRIM(pers.PersonalNombre)) ApellidoNombre,
      obj.ObjetivoId, TRIM(obj.ObjetivoDescripcion) ObjetivoDescripcion,  
      CONCAT(RTRIM(per.mes), '-', RTRIM(per.anio)) AS periodo,
      cli.ClienteId, cli.ClienteDenominacion
      FROM lige.dbo.docgeneral AS docgeneral 
      LEFT JOIN lige.dbo.doctipo AS tipo ON docgeneral.doctipo_id = tipo.doctipo_id
      LEFT JOIN Personal AS pers ON docgeneral.persona_id = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docgeneral.objetivo_id = obj.ObjetivoId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docgeneral.periodo = per.periodo_id
      LEFT JOIN lige.dbo.Cliente AS cli ON docgeneral.cliente_id = cli.ClienteId
      WHERE per.anio = @0 AND per.mes = @1
      AND ${filterSql}
      ${orderBy}
    `, [anio, mes])

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
    const anio:number = req.body.anio
    const mes:number = req.body.mes
    try {
      const TipoDocumentos = await this.getdocgenralListlist(filterSql, orderBy, anio, mes)
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
          SELECT tipo.doctipo_id value, TRIM(tipo.detalle) label
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
    const tipoDocumentoId:string = req.body.tipoDocumentoId
    const denominacion:number = req.body.denominacion
    const PersonalId:number = req.body.PersonalId
    const ClienteId:number = req.body.ClienteId
    const ObjetivoId:number = req.body.ObjetivoId
    const periodo:Date = req.body.periodo? new Date(req.body.periodo) : req.body.periodo
    const archivo:any[] = req.body.archivo
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    try {
      await queryRunner.startTransaction()
      let campos_vacios: any[] = []

      if (!tipoDocumentoId) campos_vacios.push(`- Tipo de documento`)
      if (!tipoDocumentoId) campos_vacios.push(`- Denominación de documento`)
      if ((tipoDocumentoId == 'LIC' || tipoDocumentoId == 'REC' ) && !Number.isInteger(PersonalId)) campos_vacios.push(`- Persona`)
      if (tipoDocumentoId == 'CLI' && !Number.isInteger(ClienteId)) campos_vacios.push(`- Cliente`)
      if (tipoDocumentoId == 'OBJ' && !Number.isInteger(ObjetivoId)) campos_vacios.push(`- Objetivo`)
      // if (tipoDocumentoId == 'ACT' && ) campos_vacios.push(``)
      //if (tipoDocumentoId == 'OBJ' && ) campos_vacios.push(``)
      if (!periodo) campos_vacios.push(`- Periodo`)

      if (campos_vacios.length) {
        campos_vacios.unshift('Debe completar los siguientes campos: ')
        throw new ClientException(campos_vacios)
      }

      const doc_id = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)
      const anio = periodo.getFullYear()
      const mes = periodo.getMonth() + 1
      const liqmaperiodo = await queryRunner.query(`
        SELECT per.periodo_id, per.anio, per.mes
        FROM lige.dbo.liqmaperiodo per
        WHERE per.anio = @0 AND per.mes = @1
      `, [anio, mes])
      if (!liqmaperiodo.length) {
        throw new ClientException(`Periodo Invalido.`)
      }
      // const periodo_id = liqmaperiodo[0].periodo_id
      let now = new Date()
      let path = ''
      let newFieldname = ''
      if (archivo.length) {
        const type = archivo[0].mimetype.split('/')[1]
        const fieldname = archivo[0].fieldname
        const doctipo = await queryRunner.query(`
          SELECT path_origen FROM lige.dbo.doctipo WHERE doctipo_id = @0
        `, [tipoDocumentoId])
        
        const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
        const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
        path = `${anio}/${doctipo[0].path_origen}`
        newFieldname = `${tipoDocumentoId}-${doc_id}-${denominacion}.${type}`
        
        let newFilePath = `${pathArchivos}/${path}`
        
        if (!existsSync(newFilePath)) {
          mkdirSync(newFilePath, { recursive: true })
        }
        newFilePath += `/${newFieldname}`
        
        renameSync(dirFile, newFilePath);
      }

      await queryRunner.query(`
        INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id",
        "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins",
        "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "objetivo_id", "den_documento", "cliente_id")
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
      `, [ doc_id, liqmaperiodo[0].periodo_id, now, PersonalId, ObjetivoId, path, newFieldname,
      usuario, ip, now, usuario, ip, now, tipoDocumentoId, denominacion, ClienteId])
      // throw new ClientException('DEBUG')
      await queryRunner.commitTransaction()
      this.jsonRes({}, res);
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release()
    }
  }

  private async getPersonalDescargaQuery(filterSql: any, orderBy: any, doc_id:number) {
    return dataSource.query(`
      SELECT CONCAT(des.doc_id,'-',cuit.PersonalCUITCUILCUIT,'-',des.fecha_descarga) AS id, des.doc_id, des.fecha_descarga, des.telefono,
      per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre,
      cuit.PersonalCUITCUILCUIT
      FROM lige.dbo.doc_descaga_log AS des 
      LEFT JOIN lige.dbo.regtelefonopersonal tel ON des.telefono = tel.telefono
      LEFT JOIN Personal per ON tel.personal_id = per.PersonalId
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

  private async getPersonalNoDescargaQuery(filterSql: any, orderBy: any, doc_id:number) {
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
          ON p.PersonalSituacionRevistaSituacionId = s.SituacionRevistaId AND p.PersonalSituacionRevistaDesde <= GETDATE() AND ISNULL(p.PersonalSituacionRevistaHasta,'9999-12-31') >= GETDATE()
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

}
