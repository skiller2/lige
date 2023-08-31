import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import xlsx from 'node-xlsx';


export class TelefoniaController extends BaseController {
  directory = process.env.PATH_TELEFONIA || "tmp";
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
      searchHidden: false
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "ApellidoNombre",
      field: "ApellidoNombre",
      fieldName: "ApellidoNombre",
      searchComponent: "inpurForPersonalSearch",
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
    /*
    {
      name: "Importe",
      type: "currency",
      id: "PersonalAdelantoMonto",
      field: "PersonalAdelantoMonto",
      fieldName: "ade.PersonalAdelantoMonto",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    */
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
    {
      name: "Teléfono Número",
      type: "number",
      id: "TelefoniaNro",
      field: "TelefoniaNro",
      fieldName: "tel.TelefoniaNro",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Objetivo",
      type: "string",
      id: "ObjetivoDescripcion",
      field: "ObjetivoDescripcion",
      fieldName: "obj.ObjetivoDescripcion",
      searchComponent: "inpurForPersonalSearch",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },

  ];


  async getByPersonalId(
    personalId: Number,
    Año: string,
    Mes: string,
    req: any,
    res: Response,
    next: NextFunction
  ) {

    try {
      const responsables = await dataSource.query(
        `SELECT DISTINCT pjer.ObjetivoPersonalJerarquicoPersonalId as PersonalId, 1
        FroM ObjetivoPersonalJerarquico pje 
        JOIN ObjetivoPersonalJerarquico pjer ON pjer.ObjetivoId = pje.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > pjer.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(pjer.ObjetivoPersonalJerarquicoHasta, '9999-12-31')
        WHERE pje.ObjetivoPersonalJerarquicoPersonalId = @0`,
        [res.locals.PersonalId, Año, Mes])

      let PersonalIdList = ""
      responsables.forEach((row: any) => {
        PersonalIdList += `${row.PersonalId},`
      })
      PersonalIdList += `0`

      const adelantos = await dataSource.query(
        `SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, ade.* 
        FROM PersonalAdelanto ade 
        JOIN Personal per ON per.PersonalId = ade.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

        LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
           WHERE ((ade.PersonalAdelantoAprobado IN (NULL) OR ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)) OR ade.PersonalAdelantoAprobado IS NULL)
                AND (ade.PersonalId = @0 or perrel.PersonalCategoriaPersonalId IN(${PersonalIdList}))`,
        [personalId, Año, Mes])

      this.jsonRes(adelantos, res);
    } catch (error) {
      return next(error)
    }
  }

  async delAdelanto(personalId: number, monto: number, ip, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new ClientException("Falta cargar la persona");

      await queryRunner.query(
        `DELETE From PersonalAdelanto 
                WHERE (PersonalAdelantoAprobado IS NULL)
                AND PersonalId = @0`,
        [personalId]
      );

      await queryRunner.commitTransaction();
      this.jsonRes([], res, "Adelanto/s eliminado.");
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async setAdelanto(personalId: string, monto: number, ip, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new ClientException("Falta cargar la persona.");
      if (!monto) throw new ClientException("Falta cargar el monto.");

      const adelantoExistente = await queryRunner.query(
        `DELETE From PersonalAdelanto 
                WHERE (PersonalAdelantoAprobado IS NULL)
                AND PersonalId = @0`,
        [personalId]
      );
      const now = new Date()
      let today = now
      today.setHours(0, 0, 0, 0)

      if (monto > 0) {

        const adelantoId =
          Number((
            await queryRunner.query(
              `
            SELECT per.PersonalAdelantoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
              [personalId]
            )
          )[0].max) + 1;



        const result = await queryRunner.query(
          `INSERT INTO PersonalAdelanto(
                    PersonalAdelantoId, PersonalId, PersonalAdelantoMonto, PersonalAdelantoFechaSolicitud, 
                    PersonalAdelantoAprobado, PersonalAdelantoFechaAprobacion, PersonalAdelantoCantidadCuotas, PersonalAdelantoAplicaEl, 
                    PersonalAdelantoLiquidoFinanzas, PersonalAdelantoUltimaLiquidacion, PersonalAdelantoCuotaUltNro, PersonalAdelantoMontoAutorizado, 
                    PersonalAdelantoJerarquicoId, PersonalAdelantoPuesto, PersonalAdelantoUsuarioId, PersonalAdelantoDia, 
                    PersonalAdelantoTiempo)
                    VALUES(
                    @0, @1, @2, @3, 
                    @4, @5, @6, @7, 
                    @8, @9, @10, @11, 
                    @12, @13, @14, @15, 
                    @16)
                `,
          [
            adelantoId, //PersonalAdelantoId
            personalId, //PersonalId
            monto, //PersonalAdelantoMonto
            today, //PersonalAdelantoFechaSolicitud
            null, //PersonalAdelantoAprobado
            null, //PersonalAdelantoFechaAprobacion
            0,  //PersonalAdelantoCantidadCuotas
            null, //PersonalAdelantoAplicaEl
            null, //PersonalAdelantoLiquidoFinanzas
            "", //PersonalAdelantoUltimaLiquidacion
            null, //PersonalAdelantoCuotaUltNro
            0, //PersonalAdelantoMontoAutorizado
            null, //PersonalAdelantoJerarquicoId
            ip, //PersonalAdelantoPuesto
            null, //PersonalAdelantoUsuarioId
            today, //PersonalAdelantoDia
            0 //PersonalAdelantoTiempo  now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds(),
          ]
        );

        const resultAdelanto = await queryRunner.query(
          `UPDATE Personal SET PersonalAdelantoUltNro=@1 WHERE PersonalId=@0 `,
          [
            personalId,
            adelantoId,
          ]
        );

      }

      await queryRunner.commitTransaction();
      this.jsonRes({
        personalId, //PersonalId
        PersonalAdelantoMonto: monto, //PersonalAdelantoMonto
        PersonalAdelantoFechaSolicitud: today, //PersonalAdelantoFechaSolicitud
      }, res, "Adelanto añadido.");
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async getTelefonosCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }


  getTelefonos(fecha: Date, options: any) {
    const filterSql = filtrosToSql(options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(options.sort)

    return dataSource.query(
      `SELECT tel.TelefoniaId id,tel.TelefoniaId, tel.TelefoniaNro, obj.ObjetivoDescripcion, CONCAT(TRIM(per.PersonalApellido), ', ',TRIM(per.PersonalNombre)) ApellidoNombre,
        tel.TelefoniaDesde, tel.TelefoniaHasta, tel.TelefoniaObjetivoId, tel.TelefoniaPersonalId
        FROM Telefonia tel 
        
        LEFT JOIN Objetivo obj ON obj.ObjetivoId = tel.TelefoniaObjetivoId
        LEFT JOIN ObjetivoPersonalJerarquico objjer ON objjer.ObjetivoId = obj.ObjetivoId AND @0 >= objjer.ObjetivoPersonalJerarquicoDesde AND @0 <= ISNULL(objjer.ObjetivoPersonalJerarquicoHasta ,'9999-12-31') AND objjer.ObjetivoPersonalJerarquicoDescuentos = 1
        
        LEFT JOIN Personal per ON per.PersonalId = ISNULL(tel.TelefoniaPersonalId,objjer.ObjetivoPersonalJerarquicoPersonalId)
        
        WHERE @0 >= tel.TelefoniaDesde AND @0 <= ISNULL(tel.TelefoniaHasta,'9999-12-31')
        
       AND (${filterSql}) 
       ${orderBy}`,
      [fecha])

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
      const telefonos = this.getTelefonos(fecha, req.body.options)

      this.jsonRes({ list: telefonos }, res);
    } catch (error) {
      return next(error)
    }
  }

  async handleXLSUpload(req: Request, res: Response, next: NextFunction) {
    const file = req.file;
    const anioRequest = Number(req.body.anio)
    const mesRequest = Number(req.body.mes)
    const fechaRequest = new Date(req.body.fecha);
    const queryRunner = dataSource.createQueryRunner();

    try {
      if (!anioRequest) throw new ClientException("Faltó indicar el anio");
      if (!mesRequest) throw new ClientException("Faltó indicar el mes");
      if (!fechaRequest) throw new ClientException("Faltó indicar fecha de aplicación");

      await queryRunner.connect();
      await queryRunner.startTransaction();
      //const importeRequest = req.body.monto;
      //const cuitRequest = req.body.cuit;

      //if (!importeRequest) throw new ClientException("Faltó indicar el importe.");
      const importeMonto = 0;






      mkdirSync(`${this.directory}/${anioRequest}`, { recursive: true });
      const newFilePath = `${this.directory
        }/${anioRequest}/${anioRequest}-${mesRequest
          .toString()
          .padStart(2, "0")}.xls`;

      if (existsSync(newFilePath)) throw new ClientException("El documento ya existe.");
      const now = fechaRequest

      let telefonos = await this.getTelefonos(fechaRequest, { filtros: [], sort: [] })
      let telefonosNoRegistrados = []

      const workSheetsFromBuffer = xlsx.parse(readFileSync(file.path))
      const sheet1 = workSheetsFromBuffer[0];
      //      console.log('telefonos', telefonos)

      sheet1.data.splice(0, 2)

      for (const row of sheet1.data) {
        const TelefoniaNro = String(row[0])
        if (TelefoniaNro === 'undefined')
          continue

        const idx = telefonos.findIndex(tel => tel.TelefoniaNro.trim() === TelefoniaNro.trim())
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


        if (idx === -1) {
          telefonosNoRegistrados.push({ TelefoniaNro })
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
          telefonos[idx].total = fimpplanvoz + fserviciosvoz + fpacksms + fpackdatos + fgarantia + fotros + vvoz + vldnldi + vmensajes + vdatos + vroaming + votros + unicavez
        }
      }

      const telefonosRegistradosSinConsumo = telefonos.filter((row) => row.importe < 1)

      
      if (telefonosRegistradosSinConsumo.length > 0) {
        const texts = telefonosRegistradosSinConsumo.map((el) => el.TelefoniaNro);
        throw new ClientException('Teléfonos sin consumo: ' + texts.join('\n'))
      }

      if (telefonosNoRegistrados.length > 0) {
        const texts = telefonosNoRegistrados.map((el) => el.TelefoniaNro);
        throw new ClientException('Teléfonos no registrados: ' + texts.join('\n'))
      }




      const anioDS = await queryRunner.query('SELECT anio.ConsumoTelefoniaAnoId, anio.ConsumoTelefoniaAnoAno, anio.ConsumoTelefoniaAnoMesUltNro FROM ConsumoTelefoniaAno anio WHERE ConsumoTelefoniaAnoAno = @0', [anioRequest])
      if (!anioDS[0].ConsumoTelefoniaAnoId)
        throw new ClientException(`No existe el año ${anioRequest} `)
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
            null,
            null
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

      //   copyFileSync(file.path, newFilePath);
      await queryRunner.commitTransaction();

      this.jsonRes([], res, "XLS Recibido y procesado!");
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      return next(error)
    } finally {
      await queryRunner.release();
      unlinkSync(file.path);
    }
  }


}

