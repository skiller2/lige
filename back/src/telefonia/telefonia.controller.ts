import type { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/base.controller.ts";
import { dataSource } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL, getOptionsSINO } from "../impuestos-afip/filtros-utils/filtros.ts";
import type { Options } from "../schemas/filtro.ts";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';
import { Utils } from "../liquidaciones/liquidaciones.utils.ts";
import { recibosController } from "../controller/controller.module.ts";
import { FileUploadController } from "../controller/file-upload.controller.ts";

export class TelefoniaController extends BaseController {
  directory = process.env.PATH_DOCUMENTS || "tmp";
  constructor() {
    super();
    if (!existsSync(this.directory)) {
      mkdirSync(this.directory, { recursive: true });
    }
  }

  listaColumnas: any[] = [
    {
      id: "TelefoniaId",
      name: "TelefoniaId",
      field: "TelefoniaId",
      fieldName: "tel.TelefoniaId",
      type: "number",
      sortable: true,
      searchHidden: true,
      hidden: true
    },
    {
      name: "Teléfono Número",
      type: "string",
      id: "EfectoAtributoIngresoValor",
      field: "EfectoAtributoIngresoValor",
      fieldName: "efeatr.EfectoAtributoIngresoValor",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Efecto",
      type: "string",
      id: "EfectoDescripcionCompleta",
      field: "EfectoDescripcionCompleta",
      fieldName: "CONCAT(TRIM(efe.EfectoDescripcion), ' - ', TRIM(efeinddes.EfectoEfectoIndividualDescripcion), ' (', efe.EfectoAtrDescripcion, ', ', efeinddes.EfectoIndividualAtrDescripcion, ' )' )",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Observación",
      type: "string",
      id: "TelefoniaObservacion",
      field: "TelefoniaObservacion",
      fieldName: "tel.TelefoniaObservacion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    // {
    //   name: "CUIT Persona",
    //   type: "string",
    //   id: "PersonalCUITCUILCUIT",
    //   field: "PersonalCUITCUILCUIT",
    //   fieldName: "cuit.PersonalCUITCUILCUIT",
    //   sortable: true,
    //   searchHidden: true
    // },
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
      name: "PersonalId",
      type: "number",
      id: "PersonalId",
      field: "PersonalId",
      fieldName: "tel.TelefoniaPersonalId",
      sortable: true,
      searchHidden: true,
      hidden: true,
    },
    {
      name: "Objetivo",
      type: "string",
      id: "ClienteElementoDependienteDescripcion",
      field: "ClienteElementoDependienteDescripcion",
      fieldName: "tel.TelefoniaObjetivoId",
      searchComponent: "inputForObjetivoSearch",
      searchType: "number",
      sortable: true,
      searchHidden: false,
      hidden: true,

    },
    // {
    //   name: "Código Objetivo",
    //   type: "string",
    //   id: "codObjetivo",
    //   field: "codObjetivo",
    //   fieldName: "codObjetivo",
    //   sortable: true,
    //   searchHidden: true
    // },
    {
      name: "Objetivo",
      type: "string",
      id: "ObjetivoDescripcion",
      field: "ObjetivoDescripcion",
      fieldName: "ObjetivoDescripcion",
      sortable: true,
      searchHidden: true
    },
    {
      name: "Objetivo Activo",
      id: "Activo",
      field: "Activo",
      fieldName: "ISNULL(eledepcon.Activo,'0')",
      type: 'string',
      searchComponent: "inputForActivo",

      sortable: true,

      formatter: 'collectionFormatter',
      params: { collection: getOptionsSINO },

      exportWithFormatter: true,
      hidden: false,
      searchHidden: false,
      minWidth: 70,
      maxWidth: 70,
      cssClass: 'text-center'
    },
    {
      name: "Coo. Cuenta Objetivo",
      id: "isCoordinadorCuenta",
      field: "isCoordinadorCuenta",
      fieldName: "IIF(objjer.ObjetivoPersonalJerarquicoPersonalId is not null,'1', '0')",
      type: 'string',
      searchComponent: "inputForActivo",

      sortable: true,
      formatter: 'collectionFormatter',
      params: { collection: getOptionsSINO },

      exportWithFormatter: true,
      hidden: false,
      searchHidden: false,
      minWidth: 100,
      maxWidth: 100,
      cssClass: 'text-center'
    },
    {
      name: "Descuenta a Coo. Cuenta",
      id: "DescTelefono",
      field: "DescTelefono",
      fieldName: "IIF(objjer.ObjetivoPersonalJerarquicoSeDescuentaTelefono = 1,'1','0' )",
      type: 'string',
      searchComponent: "inputForActivo",

      sortable: true,
      formatter: 'collectionFormatter',
      params: { collection: getOptionsSINO },
      exportWithFormatter: true,
      hidden: false,
      searchHidden: false,
      minWidth: 100,
      maxWidth: 100,
      cssClass: 'text-center'
    },
    {
      name: "Importe",
      type: "currency",
      id: "importesum",
      field: "importesum",
      fieldName: "conx.importesum",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Importe+Impuesto",
      type: "currency",
      id: "importe",
      field: "importe",
      fieldName: "conx.importe",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Fecha desde",
      type: "date",
      id: "TelefoniaDesde",
      field: "TelefoniaDesde",
      fieldName: "tel.TelefoniaDesde",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Fecha hasta",
      type: "date",
      id: "TelefoniaHasta",
      field: "TelefoniaHasta",
      fieldName: "tel.TelefoniaHasta",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },

  ];

  async getTelefonosCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }


  getTelefonos(fecha: Date, anio: number, mes: number, options: any) {
    const filterSql = filtrosToSql(options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(options.sort)

    fecha.setHours(0, 0, 0, 0)

    return dataSource.query(
      `
SELECT tel.TelefoniaId id,tel.TelefoniaId, efeatr.EfectoAtributoIngresoValor, 
      CONCAT(TRIM(efe.EfectoDescripcion), ' - ', TRIM(efeinddes.EfectoEfectoIndividualDescripcion), ' (', efe.EfectoAtrDescripcion, ', ', efeinddes.EfectoIndividualAtrDescripcion, ' )' ) EfectoDescripcionCompleta, 
      eledep.ClienteElementoDependienteDescripcion, 
      tel.TelefoniaDesde, tel.TelefoniaHasta, tel.TelefoniaObjetivoId, tel.TelefoniaPersonalId, conx.importe, conx.importesum,
      per.PersonalId, tel.TelefoniaEfectoId, tel.TelefoniaEfectoEfectoIndividualId,
      conx.ImpuestoInternoTelefoniaImpuesto,
      tel.TelefoniaObservacion,
      iif(tel.TelefoniaObjetivoId is not null, CONCAT(obj.ClienteId,'/' ,ISNULL(obj.ClienteElementoDependienteId,0)), null) as codObjetivo,
      iif(tel.TelefoniaPersonalId is not null or objjer.ObjetivoPersonalJerarquicoPersonalId is not null,CONCAT(TRIM(per.PersonalApellido), ', ',TRIM(per.PersonalNombre)), null) ApellidoNombre, cuit.PersonalCUITCUILCUIT,
      iif(tel.TelefoniaObjetivoId is not null or objjer.ObjetivoPersonalJerarquicoPersonalId is not null,CONCAT(CONCAT(obj.ClienteId,'/',ISNULL(obj.ClienteElementoDependienteId,0)), ' ', cli.ClienteDenominacion,' ',eledep.ClienteElementoDependienteDescripcion), null) ObjetivoDescripcion,
      IIF(objjer.ObjetivoPersonalJerarquicoPersonalId is not null,'1', '0') as isCoordinadorCuenta,
      IIF(objjer.ObjetivoPersonalJerarquicoSeDescuentaTelefono = 1,'1','0' ) DescTelefono,
      ISNULL(eledepcon.Activo,0) AS Activo,
      eledepcon.ClienteElementoDependienteContratoFechaDesde,
      eledepcon.ClienteElementoDependienteContratoFechaHasta,
      sit.SituacionRevistaDescripcion,sitrev.PersonalSituacionRevistaSituacionId, 
      CONCAT(TRIM(sit.SituacionRevistaDescripcion),' (Desde: ', FORMAT(sitrev.PersonalSituacionRevistaDesde,'dd/MM/yyyy'),' - Hasta: ', FORMAT(sitrev.PersonalSituacionRevistaHasta,'dd/MM/yyyy'), ')') AS SitRevCom,
      sitrev.PersonalSituacionRevistaDesde, sitrev.PersonalSituacionRevistaHasta,
      1
      FROM Telefonia tel 
      JOIN EfectoEfectoIndividual efeind ON efeind.EfectoEfectoIndividualId = tel.TelefoniaEfectoEfectoIndividualId AND efeind.EfectoId =tel.TelefoniaEfectoId
      LEFT JOIN EfectoEfectoIndividualAtributoIngreso efeatr ON efeatr.EfectoEfectoIndividualId = tel.TelefoniaEfectoEfectoIndividualId AND efeatr.EfectoId =tel.TelefoniaEfectoId AND efeatr.EfectoAtributoAtributoIngresoId = 7
      
      LEFT JOIN Objetivo obj ON obj.ObjetivoId = tel.TelefoniaObjetivoId
      LEFT JOIN Cliente cli ON cli.ClienteId = obj.ClienteId
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId

      LEFT JOIN (
                            SELECT 
                                ec.ClienteId, 
                                ec.ClienteElementoDependienteId, 
                                ec.ClienteElementoDependienteContratoId, 
                                ec.ClienteElementoDependienteContratoFechaDesde, 
                                ec.ClienteElementoDependienteContratoFechaHasta,
								CASE
									WHEN ec.ClienteElementoDependienteContratoFechaDesde<=@0 AND ISNULL(ec.ClienteElementoDependienteContratoFechaHasta,'9999-12-31')>=@0 THEN '1'
									ELSE '0' END AS Activo,
                                ROW_NUMBER() OVER (PARTITION BY ec.ClienteId, ec.ClienteElementoDependienteId 
                                                    ORDER BY ec.ClienteElementoDependienteContratoFechaDesde DESC) AS RowNum
                            FROM ClienteElementoDependienteContrato ec
                            WHERE EOMONTH(@0) >= ec.ClienteElementoDependienteContratoFechaDesde
                        ) eledepcon ON eledepcon.ClienteId = obj.ClienteId 
                            AND eledepcon.ClienteElementoDependienteId = obj.ClienteElementoDependienteId
                            AND eledepcon.RowNum = 1


      LEFT JOIN ObjetivoPersonalJerarquico objjer ON objjer.ObjetivoId = obj.ObjetivoId AND @0 >= objjer.ObjetivoPersonalJerarquicoDesde AND @0 <= ISNULL(objjer.ObjetivoPersonalJerarquicoHasta ,'9999-12-31') AND objjer.ObjetivoPersonalJerarquicoDescuentos = 1
      LEFT JOIN Personal per ON per.PersonalId = ISNULL(tel.TelefoniaPersonalId, objjer.ObjetivoPersonalJerarquicoPersonalId)
      LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

      LEFT JOIN (
        SELECT asi.TelefoniaId, imp.ImpuestoInternoTelefoniaImpuesto,
        SUM(con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte+ (con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte * imp.ImpuestoInternoTelefoniaImpuesto / 100 )) importe,
        
        SUM(con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte) importesum

        FROM ConsumoTelefoniaAno anio
        JOIN ConsumoTelefoniaAnoMes mes ON mes.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
        JOIN ConsumoTelefoniaAnoMesTelefonoAsignado asi ON asi.ConsumoTelefoniaAnoMesId=mes.ConsumoTelefoniaAnoMesId AND asi.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
        JOIN ConsumoTelefoniaAnoMesTelefonoConsumo con ON con.ConsumoTelefoniaAnoMesId = mes.ConsumoTelefoniaAnoMesId AND con.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId AND con.ConsumoTelefoniaAnoMesTelefonoAsignadoId= asi.ConsumoTelefoniaAnoMesTelefonoAsignadoId
        JOIN ImpuestoInternoTelefonia imp ON EOMONTH(DATEFROMPARTS(@1,@2,1)) > imp.ImpuestoInternoTelefoniaDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.ImpuestoInternoTelefoniaHasta ,'9999-12-31') 
        WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2
        GROUP BY asi.TelefoniaId,imp.ImpuestoInternoTelefoniaImpuesto
      ) conx ON conx.TelefoniaId = tel.TelefoniaId
        

          LEFT JOIN EfectoDescripcion efe ON efe.EfectoId = tel.TelefoniaEfectoId
          LEFT JOIN EfectoIndividualDescripcion efeinddes ON efeinddes.EfectoId = tel.TelefoniaEfectoId AND efeinddes.EfectoEfectoIndividualId = tel.TelefoniaEfectoEfectoIndividualId
  
          LEFT JOIN 
          (
          SELECT sitrev2.PersonalId, MAX(sitrev2.PersonalSituacionRevistaId) PersonalSituacionRevistaId
          FROM PersonalSituacionRevista sitrev2
          WHERE @0 >= sitrev2.PersonalSituacionRevistaDesde AND @0 <= ISNULL(sitrev2.PersonalSituacionRevistaHasta,'9999-12-31') 
          GROUP BY sitrev2.PersonalId
          ) sitrev3  ON sitrev3.PersonalId = per.PersonalId
          LEFT JOIN PersonalSituacionRevista sitrev ON sitrev.PersonalId = per.PersonalId AND sitrev.PersonalSituacionRevistaId = sitrev3.PersonalSituacionRevistaId
                  
          LEFT JOIN SituacionRevista sit ON sit.SituacionRevistaId = sitrev.PersonalSituacionRevistaSituacionId



      WHERE @0 >= tel.TelefoniaDesde AND @0 <= ISNULL(tel.TelefoniaHasta,'9999-12-31') 
    AND tel.TelefoniaDesde <> ISNULL(tel.TelefoniaHasta,'9999-12-31') 
        
       AND (${filterSql}) ${orderBy}`,
      [fecha, anio, mes])

  }

  async downloadComprobantes(
    year: string,
    month: string,
    impoexpoId: string,
    res: Response,
    req: Request,
    next: NextFunction
  ) {
    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    try {
      const data = await queryRunner.query(`SELECT DocumentoPath, DocumentoNombreArchivo FROM Documento WHERE DocumentoId = @0`,
        [impoexpoId]
      )

      if (!data[0])
        throw new ClientException(`Archivo de telefono no generado`)

      res.download(this.directory + '/' + data[0].DocumentoPath, data[0].DocumentoNombreArchivo, async (error) => {
        if (error) {
          console.error('Error al descargar el archivo:', error);
          return next(error)
        }
      });
    } catch (error) {
      return next(error)
    }
  }

  async getTelefonosList(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    const fecha = new Date(req.body.fecha)
    //const fecha= new Date(anio,mes-1,1)

    const options: Options = isOptions(req.body.options)
      ? req.body.options
      : { filtros: [], sort: null };

    try {
      const telefonos = await this.getTelefonos(fecha, anio, mes, req.body.options)
      const ImpuestoInternoTelefoniaImpuesto = await this.getImpuestoInterno(anio, mes)
      this.jsonRes({ list: telefonos, ImpuestoInternoTelefoniaImpuesto }, res);
    } catch (error) {
      return next(error)
    }
  }

  async getImpuestoInterno(anio: number, mes: number) {
    const queryRunner = dataSource.createQueryRunner();
    const data = await queryRunner.query(`SELECT imp.ImpuestoInternoTelefoniaImpuesto FROM ImpuestoInternoTelefonia imp WHERE EOMONTH(DATEFROMPARTS(@1,@2,1)) > imp.ImpuestoInternoTelefoniaDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.ImpuestoInternoTelefoniaHasta ,'9999-12-31')`, [null, anio, mes])
    return data[0]?.ImpuestoInternoTelefoniaImpuesto || 0;
  }

  round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

  async handleXLSUploadTelefonia(req: Request, res: Response, next: NextFunction) {
    const anioRequest = Number(req.body.anio)
    const mesRequest = Number(req.body.mes)
    const totaldeclarado = Number(req.body.totaldeclarado)
    const file = req.body?.files?.[0] ?? req.body?.files;
    const fechaRequest:Date = new Date(req.body.fecha);
    const queryRunner = dataSource.createQueryRunner();


    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const fechaActual = new Date()
    let totalsuma = 0
    let totalsumaxls = 0
    let ProcesoAutomaticoLogCodigo = 0
    //console.log("req.body", req.body)
    //throw new ClientException(`test...`)
    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anioRequest, mesRequest, usuario, ip)

    try {
      if (!anioRequest) throw new ClientException("Faltó indicar el anio");
      if (!mesRequest) throw new ClientException("Faltó indicar el mes");
      if (!fechaRequest) throw new ClientException("Faltó indicar fecha de aplicación");
      if (!totaldeclarado) throw new ClientException("Faltó indicar el total declarado");




      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id);

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`);


      ({ ProcesoAutomaticoLogCodigo } = await this.procesoAutomaticoLogInicio(
        queryRunner,
        `Importa XLS Telefonia`,
        { usuario, ip },
        usuario,
        ip
      ))


      await queryRunner.startTransaction();

      let dataset = []
      let datasetid = 0


      const now = fechaRequest

      let telefonos = await this.getTelefonos(fechaRequest, 1, 1, { filtros: [], sort: [] })

      telefonos = telefonos.map(tel => ({ ...tel, ...{ fimpplanvoz: 0, fserviciosvoz: 0, fpacksms: 0, fpackdatos: 0, fgarantia: 0, fotros: 0, vvoz: 0, vldnldi: 0, vmensajes: 0, vdatos: 0, vroaming: 0, votros: 0, unicavez: 0, total: 0 } }));

      const workSheetsFromBuffer = xlsx.parse(readFileSync(FileUploadController.getTempPath() + '/' + file.tempfilename))
      const sheet1 = workSheetsFromBuffer[0];
      //      console.log('telefonos', telefonos)

      sheet1.data.splice(0, 2)

      for (const row of sheet1.data) {
        const TelefoniaNro = String(row[0])
        if (TelefoniaNro === 'undefined')
          continue

        if (telefonos.filter(tel => String(tel.EfectoAtributoIngresoValor).trim() === TelefoniaNro.trim()).length > 1) {
          dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` se encuentra asignado a mas de una persona` })
          continue
        }


        const idx = telefonos.findIndex(tel => String(tel.EfectoAtributoIngresoValor).trim() === TelefoniaNro.trim())
        const fimpplanvoz = parseFloat(row[1])
        const fserviciosvoz = parseFloat(row[2])
        const fpacksms = parseFloat(row[3])
        const fpackdatos = parseFloat(row[4])
        const fgarantia = parseFloat(row[5])
        const fotros = parseFloat(row[6])
        const vvoz = parseFloat(row[8])
        const vldnldi = parseFloat(row[9])
        const vmensajes = parseFloat(row[10])
        const vdatos = parseFloat(row[11])
        const vroaming = parseFloat(row[12])
        const votros = parseFloat(row[13])
        const unicavez = parseFloat(row[15])
        const totalxls = parseFloat(row[16])
        const total = this.round2(fimpplanvoz + fserviciosvoz + fpacksms + fpackdatos + fgarantia + fotros + vvoz + vldnldi + vmensajes + vdatos + vroaming + votros + unicavez)
        if (Math.abs(totalxls - total) > 0.0001)
          dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` Importe total calculado ($ ${total}) difiere del indicado en la última columna ($ ${totalxls}) ` })

        if (idx === -1) {
          dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` sin registro vigente en el sistema, consumo $ ${total}` })
        } else {
          //          if (telefonos[idx].total > 0)
          //            dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` duplicado en XLS, consumo $ ${total}` })

          telefonos[idx].fimpplanvoz += fimpplanvoz  //1
          telefonos[idx].fserviciosvoz += fserviciosvoz  //2 
          telefonos[idx].fpacksms += fpacksms //3
          telefonos[idx].fpackdatos += fpackdatos //4
          telefonos[idx].fgarantia += fgarantia //5
          telefonos[idx].fotros += fotros  //6
          telefonos[idx].vvoz += vvoz //7
          telefonos[idx].vldnldi += vldnldi  //8
          telefonos[idx].vmensajes += vmensajes  //9
          telefonos[idx].vdatos += vdatos  //10
          telefonos[idx].vroaming += vroaming //11
          telefonos[idx].votros += votros  //12
          telefonos[idx].unicavez += unicavez  //13
          telefonos[idx].total += total

        }
        totalsumaxls += totalxls
      }

      if (Math.abs(totalsumaxls - totaldeclarado) > 0.0001)
        throw new ClientException(`Importe declarado (${totaldeclarado}) no coincide con el total calculado`, { totaldeclarado, totalsumaxls })



      const telefonosRegistradosSinConsumo = telefonos.filter((row) => (Number(row.total) < 1 || isNaN(Number(row.total))))
      for (const tel of telefonosRegistradosSinConsumo) {
        if (!tel.TelefoniaHasta || tel.TelefoniaHasta > new Date()) {
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` sin consumos en archivo xls y sin fecha de baja (Efecto: ${tel.EfectoDescripcionCompleta}), TelefonoId: ${tel.TelefoniaId}` })
        }
      }


      const telRepeat: Record<string, number> = {};

      for (const tel of telefonos) {
        if (!tel.EfectoAtributoIngresoValor)
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` sin número de teléfono asignado (Efecto: ${tel.EfectoEfectoIndividualDescripcion}), TelefonoId: ${tel.TelefoniaId}` })

        telRepeat[tel.TelefoniaEfectoEfectoIndividualId] = (telRepeat[tel.TelefoniaEfectoEfectoIndividualId] || 0) + 1;
        if (telRepeat[tel.TelefoniaEfectoEfectoIndividualId] > 1)
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` se encuentra repetido #${telRepeat[tel.TelefoniaEfectoEfectoIndividualId]} el teléfono (Efecto: ${tel.EfectoEfectoIndividualDescripcion}), TelefonoId: ${tel.TelefoniaId}` })

        if (tel.TelefoniaObjetivoId){  
          if (!tel.ClienteElementoDependienteContratoFechaHasta && !tel.ClienteElementoDependienteContratoFechaDesde) 
            dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` Objetivo sin fecha de contrato` })


          if (tel.ClienteElementoDependienteContratoFechaHasta){
            const diffDias = Math.floor(
              (new Date(tel.ClienteElementoDependienteContratoFechaHasta).getTime() - fechaRequest.getTime())
              / (1000 * 60 * 60 * 24)
            );
            if (diffDias < -30)
              dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` Objetivo con fecha de contrato vencida hace más de 30 días (${diffDias} días)` })
          }
        }

        if (tel.PersonalId && tel.PersonalId!= 28496){ //PersonalId 28496 Lince es un caso particular que no tiene situación de revista y se decidió permitirlo igual
          if (tel.PersonalSituacionRevistaSituacionId != 2 && tel.PersonalSituacionRevistaSituacionId != 10)
            dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` Personal ${tel.PersonalId} con situación de revista no activa (${tel.SituacionRevistaDescripcion})` })  
        }
      }

      if (dataset.length > 0)
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo`, { list: dataset })

      //Busco el id del año y mes. Si no existe lo creo
      const percon = await queryRunner.query(`
        SELECT anio.ConsumoTelefoniaAnoId, mes.ConsumoTelefoniaAnoMesId, anio.ConsumoTelefoniaAnoAno, mes.ConsumoTelefoniaAnoMesMes
        FROM ConsumoTelefoniaAno anio
        JOIN ConsumoTelefoniaAnoMes mes ON mes.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
        WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2`, [null, anioRequest, mesRequest])

      let ConsumoTelefoniaAnoId = 0
      let ConsumoTelefoniaAnoMesId = 0
      let ConsumoTelefoniaAnoMesTelefonoUltNro = 0

      if (percon.length) {
        ConsumoTelefoniaAnoId = percon[0].ConsumoTelefoniaAnoId
        ConsumoTelefoniaAnoMesId = percon[0].ConsumoTelefoniaAnoMesId
      } else {
        let anioDS = await queryRunner.query('SELECT anio.ConsumoTelefoniaAnoId, anio.ConsumoTelefoniaAnoAno, anio.ConsumoTelefoniaAnoMesUltNro FROM ConsumoTelefoniaAno anio WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest])
        if (!anioDS[0]?.ConsumoTelefoniaAnoId) {
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAno (ConsumoTelefoniaAnoAno, ConsumoTelefoniaAnoMesUltNro)
            VALUES (@0, @1)`,
            [
              anioRequest, 0
            ])
          anioDS = await queryRunner.query('SELECT anio.ConsumoTelefoniaAnoId, anio.ConsumoTelefoniaAnoAno, anio.ConsumoTelefoniaAnoMesUltNro FROM ConsumoTelefoniaAno anio WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest])
        }
        ConsumoTelefoniaAnoId = anioDS[0].ConsumoTelefoniaAnoId
        ConsumoTelefoniaAnoMesId = anioDS[0].ConsumoTelefoniaAnoMesUltNro

        const mesDS = await queryRunner.query('SELECT mes.ConsumoTelefoniaAnoMesId, mes.ConsumoTelefoniaAnoMesTelefonoUltNro FROM ConsumoTelefoniaAnoMes mes WHERE ConsumoTelefoniaAnoMesMes = @0 AND ConsumoTelefoniaAnoId = @1', [mesRequest, ConsumoTelefoniaAnoId])
        if (mesDS[0]?.ConsumoTelefoniaAnoMesId) {
          ConsumoTelefoniaAnoMesId = Number(anioDS[0].ConsumoTelefoniaAnoMesUltNro)
        } else {
          ConsumoTelefoniaAnoMesId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMes (ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesMes, ConsumoTelefoniaAnoMesMeses, ConsumoTelefoniaAnoMesDesde, ConsumoTelefoniaAnoMesHasta, ConsumoTelefoniaAnoMesTelefonoUltNro)
            VALUES (@0, @1, @2, @3, @4, @5, @6)`,
            [
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              mesRequest,
              mesRequest,
              now,
              null,
              ConsumoTelefoniaAnoMesTelefonoUltNro
            ])
          await queryRunner.query(
            'UPDATE ConsumoTelefoniaAno set ConsumoTelefoniaAnoMesUltNro = @1 WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest, ConsumoTelefoniaAnoMesId])
        }
      }

      /*
            const mesDS = await queryRunner.query('SELECT mes.ConsumoTelefoniaAnoMesId, mes.ConsumoTelefoniaAnoMesTelefonoUltNro FROM ConsumoTelefoniaAnoMes mes WHERE ConsumoTelefoniaAnoMesMes = @0 AND ConsumoTelefoniaAnoId = @1', [mesRequest, ConsumoTelefoniaAnoId])
            let ConsumoTelefoniaAnoMesId = Number(anioDS[0].ConsumoTelefoniaAnoMesUltNro)
            let ConsumoTelefoniaAnoMesTelefonoUltNro = 0
      
            if (!mesDS[0]?.ConsumoTelefoniaAnoMesId) {
              ConsumoTelefoniaAnoMesId++
              await queryRunner.query(
                `INSERT INTO ConsumoTelefoniaAnoMes (ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesMes, ConsumoTelefoniaAnoMesMeses, ConsumoTelefoniaAnoMesDesde, ConsumoTelefoniaAnoMesHasta, ConsumoTelefoniaAnoMesTelefonoUltNro)
                VALUES (@0, @1, @2, @3, @4, @5, @6)`,
                [
                  ConsumoTelefoniaAnoMesId,
                  anioDS[0].ConsumoTelefoniaAnoId,
                  mesRequest,
                  mesRequest,
                  now,
                  null,
                  ConsumoTelefoniaAnoMesTelefonoUltNro
                ])
              await queryRunner.query(
                'UPDATE ConsumoTelefoniaAno set ConsumoTelefoniaAnoMesUltNro = @1 WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest, ConsumoTelefoniaAnoMesId])
      
            } else {
              await queryRunner.query(
                'UPDATE ConsumoTelefoniaAnoMes set ConsumoTelefoniaAnoMesDesde = @0 WHERE ConsumoTelefoniaAnoMesId = @1 AND ConsumoTelefoniaAnoId = @2 ', [now, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId])
            }
      */

      await queryRunner.query(
        'DELETE FROM ConsumoTelefoniaAnoMesTelefonoConsumo WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId=@1', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId])
      await queryRunner.query(
        'DELETE FROM ConsumoTelefoniaAnoMesTelefonoAsignado WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId=@1', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId])

      for (const telrow of telefonos) {
        ConsumoTelefoniaAnoMesTelefonoUltNro++
        let ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro = 0
        totalsuma += telrow.total
        await queryRunner.query(
          `INSERT INTO ConsumoTelefoniaAnoMesTelefonoAsignado (ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, TelefoniaId, ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro, TelefonoConsumoFacturarAPersonalId, TelefonoConsumoFacturarAObjetivoId)
           VALUES (@0,@1,@2,@3,@4,@5,@6)`,
          [ConsumoTelefoniaAnoMesTelefonoUltNro,
            ConsumoTelefoniaAnoMesId,
            ConsumoTelefoniaAnoId,
            telrow.TelefoniaId,
            ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro,
            telrow.PersonalId,
            telrow.TelefoniaObjetivoId
          ])

        let ConsumoTelefoniaAnoMesTelefonoConsumoId = 0


        if (telrow.fimpplanvoz > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              1, //ItemFacturaTelefonicaId
              telrow.fimpplanvoz, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }

        if (telrow.fserviciosvoz > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              2, //ItemFacturaTelefonicaId
              telrow.fserviciosvoz, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }

        if (telrow.fpacksms > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              3, //ItemFacturaTelefonicaId
              telrow.fpacksms, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }

        if (telrow.fpackdatos > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              4, //ItemFacturaTelefonicaId
              telrow.fpackdatos, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.fgarantia > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              5, //ItemFacturaTelefonicaId
              telrow.fgarantia, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.fotros > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              6, //ItemFacturaTelefonicaId
              telrow.fotros, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.vvoz > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              7, //ItemFacturaTelefonicaId
              telrow.vvoz, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.vldnldi > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              8, //ItemFacturaTelefonicaId
              telrow.vldnldi, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.vmensajes > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              9, //ItemFacturaTelefonicaId
              telrow.vmensajes, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.vdatos > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              10, //ItemFacturaTelefonicaId
              telrow.vdatos, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.vroaming > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              11, //ItemFacturaTelefonicaId
              telrow.vroaming, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.votros > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              12, //ItemFacturaTelefonicaId
              telrow.votros, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }
        if (telrow.unicavez > 0) {
          ConsumoTelefoniaAnoMesTelefonoConsumoId++
          await queryRunner.query(
            `INSERT INTO ConsumoTelefoniaAnoMesTelefonoConsumo (ConsumoTelefoniaAnoMesTelefonoConsumoId, ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, ItemFacturaTelefonicaId, ConsumoTelefoniaAnoMesTelefonoConsumoImporte, ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo, ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion)
          VALUES (@0,@1,@2,@3,@4,@5,@6,@7)`,
            [
              ConsumoTelefoniaAnoMesTelefonoConsumoId,
              ConsumoTelefoniaAnoMesTelefonoUltNro,
              ConsumoTelefoniaAnoMesId,
              ConsumoTelefoniaAnoId,
              13, //ItemFacturaTelefonicaId
              telrow.unicavez, //ConsumoTelefoniaAnoMesTelefonoConsumoImporte,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoImporteInformativo,
              null, //ConsumoTelefoniaAnoMesTelefonoConsumoInformativoAccion
            ])
        }

        await queryRunner.query(
          'UPDATE ConsumoTelefoniaAnoMesTelefonoAsignado set ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro = @1 WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId=@1 AND ConsumoTelefoniaAnoMesTelefonoAsignadoId=@2', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoMesTelefonoUltNro, ConsumoTelefoniaAnoMesTelefonoConsumoId])

      }

      await queryRunner.query(
        'UPDATE ConsumoTelefoniaAnoMes set ConsumoTelefoniaAnoMesDesde=@3, ConsumoTelefoniaAnoMesTelefonoUltNro = @2 WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId = @1', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoMesTelefonoUltNro, now])


      await FileUploadController.handleDOCUpload(
        null,
        null,
        null,
        null,
        new Date(),
        null,
        String(mesRequest) + '-' + String(anioRequest),
        anioRequest,
        mesRequest,
        file,
        usuario,
        ip,
        queryRunner)

      if (Math.abs(totalsuma - totalsumaxls) > 0.0001)
        throw new ClientException(`Importe Total del XLS:${this.round2(totalsumaxls)}, Total procesado:${this.round2(totalsuma)} `, { totalsumaxls, totalsuma })


      if (Math.abs(totalsuma - totaldeclarado) > 0.0001)
        throw new ClientException(`Importe Total declarado:${this.round2(totaldeclarado)}, Total procesado:${this.round2(totalsuma)} `, { totaldeclarado, totalsuma })

      await queryRunner.commitTransaction();

      const resMsg = "Se procesaron " + telefonos.length + " teléfonos, con un total de $ " + this.round2(totalsuma)
      await this.procesoAutomaticoLogFin(
        queryRunner,
        ProcesoAutomaticoLogCodigo,
        'COM',
        {
          res: resMsg,
          totalsuma: this.round2(totalsuma),
          anio: anioRequest,
          mes: mesRequest,
          cantGrabados: telefonos.length,
          cantXLS: sheet1.data.length
        },
        usuario,
        ip
      );


      this.jsonRes({}, res, resMsg);
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      await this.procesoAutomaticoLogFin(queryRunner,
        ProcesoAutomaticoLogCodigo,
        'ERR',
        {
          res: error, anio: anioRequest, mes: mesRequest, //cantErrores:dataset.le
        },
        usuario,
        ip
      );


      return next(error)
    } finally {
      await queryRunner.release();
      // unlinkSync(file.path);
    }
  }

  async getImportacionesTelefoniaAnteriores(
    Anio: string,
    Mes: string,
    req: Request,
    res: Response,
    next: NextFunction
  ) {

    try {

      let usuario = res.locals.userName
      let ip = this.getRemoteAddress(req)
      let fechaActual = new Date()
      const queryRunner = dataSource.createQueryRunner();
      //const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, Number(Anio), Number(Mes), usuario, ip)


      const importacionesAnteriores = await dataSource.query(


        `SELECT doc.DocumentoId,DocumentoTipoCodigo, doc.DocumentoAnio,doc.DocumentoMes, doc.DocumentoDenominadorDocumento, FORMAT(DocumentoAudFechaIng, 'dd/MM/yyyy HH:mm:ss') AS DocumentoAudFechaIng
        FROM documento doc
        WHERE doc.DocumentoAnio = @0 AND doc.DocumentoMes = @1 AND doc.DocumentoTipoCodigo = 'TEL'`,
        [Number(Anio), Number(Mes)])

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

  private async getLugarTelefonoQuery(queryRunner: any) {
    return await queryRunner.query(`
        SELECT lug.LugarTelefonoId value, TRIM(lug.LugarTelefonoDescripcion) label
        FROM LugarTelefono lug`)
  }

  async getLugarTelefono(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getLugarTelefonoQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

  private async getTipoTelefonoQuery(queryRunner: any) {
    return await queryRunner.query(`
        SELECT tipo.TipoTelefonoId value, TRIM(tipo.TipoTelefonoDescripcion) label
        FROM TipoTelefono tipo`)
  }

  async getTipoTelefono(req: any, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      const options = await this.getTipoTelefonoQuery(queryRunner)

      this.jsonRes(options, res);
    } catch (error) {
      return next(error)
    }
  }

}

