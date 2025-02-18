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
      name: "Personal",
      type: "string",
      id: "PersonalApellidoNombre",
      field: "PersonalApellidoNombre",
      fieldName: "pers.PersonalApellidoNombre",
      searchType: "string",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Tipo",
      type: "tipo",
      id: "tipo",
      field: "tipo",
      fieldName: "tipo.detalle",
      hidden: false,
      searchHidden:false,
      maxWidth: 250,
    },
    {
      name: "Objetivo",
      type: "string",
      id: "ObjetivoDescripcion",
      field: "ObjetivoDescripcion",
      fieldName: "obj.ObjetivoDescripcion",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      name: "Cliente",
      type: "string",
      id: "ClienteDenominacion",
      field: "ClienteDenominacion",
      fieldName: "cli.ClienteDenominacion",
      searchType: "string",
      sortable: true,
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

  async getGridCols(req, res) {
    this.jsonRes(this.listaTipoDocumento, res);
  }


  async getdocgenralListlist(filtros: any, sort: any) {
    const filterSql = filtrosToSql(filtros, this.listaTipoDocumento);
    const orderBy = orderToSQL(sort)
    const stmactual = new Date()

    return dataSource.query(
      `
      SELECT doc_id AS id, 
      tipo.detalle AS tipo, 
      fecha, 
      pers.PersonalApellidoNombre,
      obj.ObjetivoDescripcion,  
      CONCAT(RTRIM(per.mes), '-', RTRIM(per.anio)) AS periodo,
      cli.ClienteDenominacion
      FROM lige.dbo.docgeneral AS docgeneral 
      LEFT JOIN lige.dbo.doctipo AS tipo ON docgeneral.doctipo_id = tipo.doctipo_id
      LEFT JOIN Personal AS pers ON docgeneral.persona_id = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docgeneral.objetivo_id = obj.ObjetivoId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docgeneral.periodo = per.periodo_id
      LEFT JOIN lige.dbo.Cliente AS cli ON docgeneral.cliente_id = cli.ClienteId
      WHERE ${filterSql} ${orderBy}
    `)
  }

  async getdocgenralList(
    req: any,
    res: Response, next: NextFunction
  ) {
    const filterSql = filtrosToSql(req.body.options.filtros, this.listaTipoDocumento);
    const orderBy = orderToSQL(req.body.options.sort)


    try {
      const TipoDocumentos = await this.getdocgenralListlist(req.body.options.filtros, req.body.options.sort)
      console.log("movimientosPendientes " +  TipoDocumentos.length)
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
      let campos_vacios: any[] = []

      if (!tipoDocumentoId) campos_vacios.push(`- Tipo de documento`)
      if (!denominacion) campos_vacios.push(`- Denominación de documento`)
      if (!Number.isInteger(PersonalId)) campos_vacios.push(`- Persona`)
      if (!Number.isInteger(ClienteId)) campos_vacios.push(`- Cliente`)
      if (!Number.isInteger(ObjetivoId)) campos_vacios.push(`- Objetivo`)
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
      let now = new Date()

      await queryRunner.query(`
        INSERT INTO FROM lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "persona_id",
        "path", "nombre_archivo", "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins",
        "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod", "doctipo_id", "objetivo_id", "den_documento", "cliente_id")
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)
      `, [ doc_id, liqmaperiodo[0].periodo_id, now, PersonalId, ObjetivoId, 'path', "nombre_archivo",
      usuario, ip, now, usuario, ip, now, tipoDocumentoId, denominacion, ClienteId])

      this.jsonRes({}, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getPersonalDescargaQuery(filterSql: any, orderBy: any, doc_id:number) {
    return dataSource.query(`
      SELECT CONCAT(des.doc_id, fecha_descarga) AS id, des.doc_id, des.fecha_descarga, des.telefono,
      per.PersonalId, CONCAT(TRIM(per.PersonalApellido), ',', TRIM(per.PersonalNombre)) ApellidoNombre
      FROM lige.dbo.doc_descaga_log AS des 
      LEFT JOIN PersonalTelefono tel ON des.telefono = CONCAT('549', TRIM(tel.PersonalTelefonoCodigoArea), TRIM(tel.PersonalTelefonoNro))
      LEFT JOIN Personal per ON tel.PersonalId = per.PersonalId
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
      console.log('PersonalDescarga: ', PersonalDescarga);
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

}
