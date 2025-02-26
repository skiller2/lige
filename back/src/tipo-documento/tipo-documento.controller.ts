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
import { mkdirSync, existsSync, renameSync, copyFileSync, unlinkSync } from "fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { TextItem } from "pdfjs-dist/types/src/display/api";

export class TipoDocumentoController extends BaseController {

  listaTipoDocumento: any[] = [
    {
      id: "id", name: "ID", field: "id",
      fieldName: "docg.doc_id",
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
      searchHidden: false,
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
      searchHidden: false,
      maxWidth: 150,
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
      SELECT docg.doc_id AS id, 
      tipo.detalle AS tipo, 
      docg.fecha, 
      CONCAT(TRIM(pers.PersonalApellido), ', ', TRIM(pers.PersonalNombre)) ApellidoNombre,
      obj.ObjetivoId, TRIM(obj.ObjetivoDescripcion) ObjetivoDescripcion,  
      CONCAT(RTRIM(per.mes), '-', RTRIM(per.anio)) AS periodo,
      cli.ClienteId, cli.ClienteDenominacion
      FROM lige.dbo.docgeneral AS docg 
      LEFT JOIN lige.dbo.doctipo AS tipo ON docg.doctipo_id = tipo.doctipo_id
      LEFT JOIN Personal AS pers ON docg.persona_id = pers.PersonalId 
      LEFT JOIN Objetivo AS obj ON docg.objetivo_id = obj.ObjetivoId 
      LEFT JOIN lige.dbo.liqmaperiodo AS per ON docg.periodo = per.periodo_id
      LEFT JOIN lige.dbo.Cliente AS cli ON docg.cliente_id = cli.ClienteId
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
    const doctipo_id:string = req.body.doctipo_id
    const den_documento:number = req.body.den_documento
    const persona_id:number = req.body.persona_id
    const cliente_id:number = req.body.cliente_id
    const objetivo_id:number = req.body.objetivo_id
    const fecha:Date = req.body.fecha? new Date(req.body.fecha) : req.body.fecha
    const fec_doc_ven:Date = req.body.fec_doc_ven? new Date(req.body.fec_doc_ven) : req.body.fec_doc_ven
    const archivo:any[] = req.body.archivo
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const now = new Date()
    try {
      await queryRunner.startTransaction()
      const valsTipoDocumento = this.valsTipoDocumento(req.body)
      if (valsTipoDocumento instanceof ClientException)
        throw valsTipoDocumento

      const doc_id = await this.getProxNumero(queryRunner, `docgeneral`, usuario, ip)
      const anio = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      let liqmaperiodo = await queryRunner.query(`
        SELECT per.periodo_id, per.anio, per.mes
        FROM lige.dbo.liqmaperiodo per
        WHERE per.anio = @0 AND per.mes = @1
      `, [anio, mes])
      if (!liqmaperiodo.length) {
        liqmaperiodo = await queryRunner.query(`
          INSERT INTO lige.dbo.liqmaperiodo (anio, mes, version, aud_usuario_ins, aud_ip_ins, aud_fecha_ins,
          aud_usuario_mod, aud_ip_mod, aud_fecha_mod, ind_recibos_generados)
          VALUES (@0, @1, 0, @2, @3, @4, @2, @3, @4, 0)

          SELECT per.periodo_id, per.anio, per.mes
          FROM lige.dbo.liqmaperiodo per
          WHERE per.anio = @0 AND per.mes = @1
        `, [anio, mes, usuario, ip, now])
      }
      // const periodo_id = liqmaperiodo[0].periodo_id
      let path = ''
      let newFieldname = ''
      let detalle_documento = ''
      if (archivo.length) {
        const type = archivo[0].mimetype.split('/')[1]
        const fieldname = archivo[0].fieldname
        const doctipo = await queryRunner.query(`
          SELECT path_origen FROM lige.dbo.doctipo WHERE doctipo_id = @0
        `, [doctipo_id])
        
        const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
        const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
        path = `${anio}/${doctipo[0].path_origen}`
        newFieldname = `${doctipo_id}-${doc_id}-${den_documento}.${type}`

        let newFilePath = `${pathArchivos}/${path}`

        if (type == 'pdf') {
          const loadingTask = getDocument(dirFile);
          const document = await loadingTask.promise;
          for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
            const page = await document.getPage(pagenum);
            const textContent = await page.getTextContent();
            textContent.items.forEach((item: TextItem) => {
              detalle_documento+=item.str + ((item.hasEOL)?'\n':'')
            });
          }
        }
        
        if (!existsSync(newFilePath)) {
          mkdirSync(newFilePath, { recursive: true })
        }
        newFilePath += `/${newFieldname}`
        
        copyFileSync(dirFile, newFilePath)
        unlinkSync(dirFile);
      }
      // throw new ClientException('DEBUG')
      await queryRunner.query(`
        INSERT INTO lige.dbo.docgeneral ("doc_id", "periodo", "fecha", "path", "nombre_archivo", 
        "doctipo_id", "persona_id", "objetivo_id", "den_documento", "cliente_id", "fec_doc_ven"
        "aud_usuario_ins", "aud_ip_ins", "aud_fecha_ins", "aud_usuario_mod", "aud_ip_mod", "aud_fecha_mod",
        "detalle_documento")
        VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @11, @12, @13, @14)
      `, [ doc_id, liqmaperiodo[0].periodo_id, fecha, path, newFieldname, doctipo_id, persona_id, objetivo_id,
      den_documento, cliente_id, fec_doc_ven, usuario, ip, now, detalle_documento])
      
      await queryRunner.commitTransaction()
      this.jsonRes({ doc_id:doc_id }, res);
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

  async updateTipoDocumento(req: any, res: Response, next: NextFunction) {
    const doc_id = req.body.doc_id
    const doctipo_id:string = req.body.doctipo_id
    const den_documento:number = req.body.den_documento
    const persona_id:number = req.body.persona_id
    const cliente_id:number = req.body.cliente_id
    const objetivo_id:number = req.body.objetivo_id
    const fecha:Date = req.body.fecha? new Date(req.body.fecha) : req.body.fecha
    const fec_doc_ven:Date = req.body.fec_doc_ven? new Date(req.body.fec_doc_ven) : req.body.fec_doc_ven
    const archivo:any[] = req.body.archivo
    const queryRunner = dataSource.createQueryRunner();
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const now = new Date()
    try {
      await queryRunner.startTransaction()

      const valsTipoDocumento = this.valsTipoDocumento(req.body)
      if (valsTipoDocumento instanceof ClientException)
        throw valsTipoDocumento

      const anio = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      let liqmaperiodo = await queryRunner.query(`
        SELECT per.periodo_id, per.anio, per.mes
        FROM lige.dbo.liqmaperiodo per
        WHERE per.anio = @0 AND per.mes = @1
      `, [anio, mes])
      if (!liqmaperiodo.length) {
        liqmaperiodo = await queryRunner.query(`
          INSERT INTO lige.dbo.liqmaperiodo (anio, mes, version, aud_usuario_ins, aud_ip_ins, aud_fecha_ins,
          aud_usuario_mod, aud_ip_mod, aud_fecha_mod, ind_recibos_generados)
          VALUES (@0, @1, 0, @2, @3, @4, @2, @3, @4, 0)

          SELECT per.periodo_id, per.anio, per.mes
          FROM lige.dbo.liqmaperiodo per
          WHERE per.anio = @0 AND per.mes = @1
        `, [anio, mes, usuario, ip, now])
      }

      let path = ''
      let newFieldname = ''
      let detalle_documento = ''
      if (archivo.length) {
        const type = archivo[0].mimetype.split('/')[1]
        const fieldname = archivo[0].fieldname
        const doctipo = await queryRunner.query(`
          SELECT path_origen FROM lige.dbo.doctipo WHERE doctipo_id = @0
        `, [doctipo_id])
        
        const pathArchivos = (process.env.PATH_ARCHIVOS) ? process.env.PATH_ARCHIVOS : '.'
        const dirFile = `${process.env.PATH_DOCUMENTS}/temp/${fieldname}.${type}`;
        path = `${anio}/${doctipo[0].path_origen}`
        newFieldname = `${doctipo_id}-${doc_id}-${den_documento}.${type}`

        let newFilePath = `${pathArchivos}/${path}`

        if (type == 'pdf') {
          const loadingTask = getDocument(dirFile);
          const document = await loadingTask.promise;
          for (let pagenum = 1; pagenum <= document.numPages; pagenum++) {
            const page = await document.getPage(pagenum);
            const textContent = await page.getTextContent();
            textContent.items.forEach((item: TextItem) => {
              detalle_documento+=item.str + ((item.hasEOL)?'\n':'')
            });
          }
        }
        
        if (!existsSync(newFilePath)) {
          mkdirSync(newFilePath, { recursive: true })
        }
        newFilePath += `/${newFieldname}`
        
        copyFileSync(dirFile, newFilePath)
        unlinkSync(dirFile);
      }

      await queryRunner.query(`
        UPDATE lige.dbo.docgeneral
        SET periodo = @1 fecha = @2, path = @3, nombre_archivo = @4, 
        doctipo_id = @5, persona_id = @6, objetivo_id = @7, den_documento = @8, cliente_id = @9, fec_doc_ven = @10
        aud_usuario_mod = @11, aud_ip_mod = @12, aud_fecha_mod = @13, detalle_documento = @14
        WHERE doc_id IN (@0)
      `, [ doc_id, liqmaperiodo[0].periodo_id, fecha, path, newFieldname, doctipo_id, persona_id, objetivo_id,
      den_documento, cliente_id, fec_doc_ven, usuario, ip, now, detalle_documento])
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

  private valsTipoDocumento(tipoDocumento:any) {
    const doctipo_id:string = tipoDocumento.doctipo_id
    const den_documento:number = tipoDocumento.den_documento
    const persona_id:number = tipoDocumento.persona_id
    const cliente_id:number = tipoDocumento.cliente_id
    const objetivo_id:number = tipoDocumento.objetivo_id
    const fecha:Date = tipoDocumento.fecha? new Date(tipoDocumento.fecha) : tipoDocumento.fecha
    const fec_doc_ven:Date = tipoDocumento.fec_doc_ven? new Date(tipoDocumento.fec_doc_ven) : tipoDocumento.fec_doc_ven

    let campos_vacios: any[] = []

    if (!doctipo_id) campos_vacios.push(`- Tipo de documento`)
    if (!den_documento) campos_vacios.push(`- Denominación de documento`)
    if ((doctipo_id == 'LIC' || doctipo_id == 'REC' ) && !Number.isInteger(persona_id)) campos_vacios.push(`- Persona`)
    if (doctipo_id == 'CLI' && !Number.isInteger(cliente_id)) campos_vacios.push(`- Cliente`)
    if (doctipo_id == 'OBJ' && !Number.isInteger(objetivo_id)) campos_vacios.push(`- Objetivo`)
    if (!fecha) campos_vacios.push(`- Desde`)
    if (!fec_doc_ven) campos_vacios.push(`- Hasta`)

    if (campos_vacios.length) {
      campos_vacios.unshift('Debe completar los siguientes campos: ')
      return new ClientException(campos_vacios)
    }
  }

}
