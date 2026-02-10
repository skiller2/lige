import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/basecontroller.ts";
import { dataSource } from "../data-source.ts";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros.ts";
import { Options } from "../schemas/filtro";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';
import { Utils } from "../liquidaciones/liquidaciones.utils";
import { recibosController } from "../controller/controller.module";
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
      id: "EfectoEfectoIndividualDescripcion",
      field: "EfectoEfectoIndividualDescripcion",
      fieldName: "efeind.EfectoEfectoIndividualDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
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
      searchHidden: false
    },
    {
      name: "Importe",
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
      `SELECT tel.TelefoniaId id,tel.TelefoniaId, efeatr.EfectoAtributoIngresoValor, efeind.EfectoEfectoIndividualDescripcion, eledep.ClienteElementoDependienteDescripcion, CONCAT(TRIM(per.PersonalApellido), ', ',TRIM(per.PersonalNombre)) ApellidoNombre,
      tel.TelefoniaDesde, tel.TelefoniaHasta, tel.TelefoniaObjetivoId, tel.TelefoniaPersonalId, conx.importe,
      per.PersonalId, tel.TelefoniaEfectoId, tel.TelefoniaEfectoEfectoIndividualId
      FROM Telefonia tel 
      JOIN EfectoEfectoIndividual efeind ON efeind.EfectoEfectoIndividualId = tel.TelefoniaEfectoEfectoIndividualId AND efeind.EfectoId =tel.TelefoniaEfectoId
      LEFT JOIN EfectoEfectoIndividualAtributoIngreso efeatr ON efeatr.EfectoEfectoIndividualId = tel.TelefoniaEfectoEfectoIndividualId AND efeatr.EfectoId =tel.TelefoniaEfectoId AND efeatr.EfectoAtributoAtributoIngresoId = 7
      
      LEFT JOIN Objetivo obj ON obj.ObjetivoId = tel.TelefoniaObjetivoId
      LEFT JOIN ClienteElementoDependiente eledep ON eledep.ClienteElementoDependienteId = obj.ClienteElementoDependienteId AND eledep.ClienteId = obj.ClienteId
      LEFT JOIN ObjetivoPersonalJerarquico objjer ON objjer.ObjetivoId = obj.ObjetivoId AND @0 >= objjer.ObjetivoPersonalJerarquicoDesde AND @0 <= ISNULL(objjer.ObjetivoPersonalJerarquicoHasta ,'9999-12-31') AND objjer.ObjetivoPersonalJerarquicoDescuentos = 1
      LEFT JOIN Personal per ON per.PersonalId = ISNULL(tel.TelefoniaPersonalId,objjer.ObjetivoPersonalJerarquicoPersonalId)
      
      LEFT JOIN (
        SELECT asi.TelefoniaId,
        SUM(con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte+ (con.ConsumoTelefoniaAnoMesTelefonoConsumoImporte * imp.ImpuestoInternoTelefoniaImpuesto / 100 )) importe
        
        FROM ConsumoTelefoniaAno anio
        JOIN ConsumoTelefoniaAnoMes mes ON mes.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
        JOIN ConsumoTelefoniaAnoMesTelefonoAsignado asi ON asi.ConsumoTelefoniaAnoMesId=mes.ConsumoTelefoniaAnoMesId AND asi.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId
        JOIN ConsumoTelefoniaAnoMesTelefonoConsumo con ON con.ConsumoTelefoniaAnoMesId = mes.ConsumoTelefoniaAnoMesId AND con.ConsumoTelefoniaAnoId = anio.ConsumoTelefoniaAnoId AND con.ConsumoTelefoniaAnoMesTelefonoAsignadoId= asi.ConsumoTelefoniaAnoMesTelefonoAsignadoId
        JOIN ImpuestoInternoTelefonia imp ON EOMONTH(DATEFROMPARTS(@1,@2,1)) > imp.ImpuestoInternoTelefoniaDesde AND DATEFROMPARTS(@1,@2,1) < ISNULL(imp.ImpuestoInternoTelefoniaHasta ,'9999-12-31') 
        WHERE anio.ConsumoTelefoniaAnoAno = @1 AND mes.ConsumoTelefoniaAnoMesMes = @2
        GROUP BY asi.TelefoniaId
      ) conx ON conx.TelefoniaId = tel.TelefoniaId
        


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


    /*
      const group='administrativo'
      let inGroupAdminis = false
      if ((<any>req)?.groups) {
        for (const rowgroup of (<any>req)?.groups) {
          if (rowgroup.toLowerCase().indexOf(group.toLowerCase()) != -1)
          inGroupAdminis = true
        }
      }
    
    
      if (!inGroupAdminis) {
  
        req.body.options.filtros.filter((f: any) => f.index != 'ApellidoNombreJ')
        req.body.options.filtros.push(
          {
            "index": "ApellidoNombreJ",
            "condition": "AND",
            "operador": "=",
            "valor": res.locals.PersonalId
          })
      }
  */
    /*
    if (req.body.options.filtros.length == 0) {
      this.jsonRes({ list: [] }, res);
      return
    }
    */
    try {
      const telefonos = await this.getTelefonos(fecha, anio, mes, req.body.options)

      this.jsonRes({ list: telefonos }, res);
    } catch (error) {
      return next(error)
    }
  }

  async handleXLSUploadTelefonia(req: Request, res: Response, next: NextFunction) {
    const anioRequest = Number(req.body.anio)
    const mesRequest = Number(req.body.mes)
    const file = req.body?.files?.[0] ?? req.body?.files;
    const fechaRequest = new Date(req.body.fecha);
    const queryRunner = dataSource.createQueryRunner();

    let usuario = res.locals.userName
    let ip = this.getRemoteAddress(req)
    let fechaActual = new Date()
    //console.log("req.body", req.body)
    //throw new ClientException(`test...`)
    const periodo_id = await Utils.getPeriodoId(queryRunner, fechaActual, anioRequest, mesRequest, usuario, ip)

    try {
      if (!anioRequest) throw new ClientException("Faltó indicar el anio");
      if (!mesRequest) throw new ClientException("Faltó indicar el mes");
      if (!fechaRequest) throw new ClientException("Faltó indicar fecha de aplicación");


      const getRecibosGenerados = await recibosController.getRecibosGenerados(queryRunner, periodo_id)

      if (getRecibosGenerados[0].ind_recibos_generados == 1)
        throw new ClientException(`Los recibos para este periodo ya se generaron`)

      await queryRunner.connect();
      await queryRunner.startTransaction();
      //const importeRequest = req.body.monto;
      //const cuitRequest = req.body.cuit;

      //if (!importeRequest) throw new ClientException("Faltó indicar el importe.");

      let dataset = []
      let datasetid = 0


      const now = fechaRequest

      let telefonos = await this.getTelefonos(fechaRequest, 1, 1, { filtros: [], sort: [] })

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
        const total = fimpplanvoz + fserviciosvoz + fpacksms + fpackdatos + fgarantia + fotros + vvoz + vldnldi + vmensajes + vdatos + vroaming + votros + unicavez
        if (Math.abs(totalxls - total) > 0.0001)
          dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` Importe total calculado ($ ${total}) difiere del indicado en la última columna ($ ${totalxls})` })

        if (idx === -1) {
          dataset.push({ id: datasetid++, TelefoniaNro: TelefoniaNro, Detalle: ` sin registro vigente en el sistema, consumo $ ${total}` })
        } else {
          telefonos[idx].fimpplanvoz = fimpplanvoz  //1
          telefonos[idx].fserviciosvoz = fserviciosvoz  //2 
          telefonos[idx].fpacksms = fpacksms //3
          telefonos[idx].fpackdatos = fpackdatos //4
          telefonos[idx].fgarantia = fgarantia //5
          telefonos[idx].fotros = fotros  //6
          telefonos[idx].vvoz = vvoz //7
          telefonos[idx].vldnldi = vldnldi  //8
          telefonos[idx].vmensajes = vmensajes  //9
          telefonos[idx].vdatos = vdatos  //10
          telefonos[idx].vroaming = vroaming //11
          telefonos[idx].votros = votros  //12
          telefonos[idx].unicavez = unicavez  //13
          telefonos[idx].total = total
        }
      }
      const telefonosRegistradosSinConsumo = telefonos.filter((row) => (Number(row.total) < 1 || isNaN(Number(row.total))))
      for (const tel of telefonosRegistradosSinConsumo) {
        if (!tel.TelefoniaHasta || tel.TelefoniaHasta > new Date()) {
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` sin consumos en archivo xls y sin fecha de baja (Efecto: ${tel.EfectoEfectoIndividualDescripcion}), TelefonoId: ${tel.TelefoniaId}` })
        }
      }



      const telRepeat: Record<string, number> = {};

      for (const tel of telefonos) {
        if (!tel.EfectoAtributoIngresoValor)
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` sin número de teléfono asignado (Efecto: ${tel.EfectoEfectoIndividualDescripcion}), TelefonoId: ${tel.TelefoniaId}` })

        telRepeat[tel.TelefoniaEfectoEfectoIndividualId] = (telRepeat[tel.TelefoniaEfectoEfectoIndividualId] || 0) + 1;
        if (telRepeat[tel.TelefoniaEfectoEfectoIndividualId] > 1)
          dataset.push({ id: datasetid++, TelefoniaNro: tel.EfectoAtributoIngresoValor, Detalle: ` se encuentra repetido #${telRepeat[tel.TelefoniaEfectoEfectoIndividualId]} el teléfono (Efecto: ${tel.EfectoEfectoIndividualDescripcion}), TelefonoId: ${tel.TelefoniaId}` })

      }

      if (dataset.length > 0)
        throw new ClientException(`Hubo ${dataset.length} errores que no permiten importar el archivo`, { list: dataset })

      let anioDS = await queryRunner.query('SELECT anio.ConsumoTelefoniaAnoId, anio.ConsumoTelefoniaAnoAno, anio.ConsumoTelefoniaAnoMesUltNro FROM ConsumoTelefoniaAno anio WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest])
      if (!anioDS[0]?.ConsumoTelefoniaAnoId) {
        await queryRunner.query(
          `INSERT INTO ConsumoTelefoniaAno (ConsumoTelefoniaAnoAno, ConsumoTelefoniaAnoMesUltNro)
          VALUES (@0, @1)`,
          [
            anioRequest, 0
          ])
        anioDS = await queryRunner.query('SELECT anio.ConsumoTelefoniaAnoId, anio.ConsumoTelefoniaAnoAno, anio.ConsumoTelefoniaAnoMesUltNro FROM ConsumoTelefoniaAno anio WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest])
        //        throw new ClientException(`No existe el año ${anioRequest} `)
      }
      const ConsumoTelefoniaAnoId = anioDS[0].ConsumoTelefoniaAnoId

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

      await queryRunner.query(
        'DELETE FROM ConsumoTelefoniaAnoMesTelefonoConsumo WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId=@1', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId])
      await queryRunner.query(
        'DELETE FROM ConsumoTelefoniaAnoMesTelefonoAsignado WHERE ConsumoTelefoniaAnoId = @0 AND ConsumoTelefoniaAnoMesId=@1', [ConsumoTelefoniaAnoId, ConsumoTelefoniaAnoMesId])

      for (const telrow of telefonos) {
        ConsumoTelefoniaAnoMesTelefonoUltNro++
        let ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro = 0

        await queryRunner.query(
          `INSERT INTO ConsumoTelefoniaAnoMesTelefonoAsignado (ConsumoTelefoniaAnoMesTelefonoAsignadoId, ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoId, TelefoniaId, ConsumoTelefoniaAnoMesTelefonoConsumoUltlNro, TelefonoConsumoFacturarAPersonalId, TelefonoConsumoFacturarAObjetivoId)
           VALUES (@0,@1,@2,@3,@4,@5,@6)`,
          [ConsumoTelefoniaAnoMesTelefonoUltNro,
            ConsumoTelefoniaAnoMesId,
            anioDS[0].ConsumoTelefoniaAnoId,
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
        'UPDATE ConsumoTelefoniaAnoMes set ConsumoTelefoniaAnoMesTelefonoUltNro = @1 WHERE ConsumoTelefoniaAnoMesId = @0', [ConsumoTelefoniaAnoMesId, ConsumoTelefoniaAnoMesTelefonoUltNro])

      //      throw new ClientException(`OKA`)
      let periodo = String(mesRequest)+ '/' + String(anioRequest)

      //   copyFileSync(file.path, newFilePath);

       await FileUploadController.handleDOCUpload(
          null, 
          null, 
          null, 
          null, 
          new Date(), 
          null, 
          periodo,
          anioRequest,
          mesRequest, 
          file, 
          usuario,
          ip,
          queryRunner)


          
      await queryRunner.commitTransaction();

      this.jsonRes({}, res, "XLS Recibido y procesado!");
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
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

        
        `SELECT DocumentoId,DocumentoTipoCodigo, DocumentoAnio,DocumentoMes
        FROM documento 
        WHERE DocumentoAnio = @0 AND DocumentoMes = @1 AND DocumentoTipoCodigo = 'TEL'`,
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

