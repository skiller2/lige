import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";
import { AccesoBotController } from "src/acceso-bot/acceso-bot.controller";

export class AdelantosController extends BaseController {

  listaColumnas: any[] = [
    {
      id: "CUIT",
      name: "CUIT",
      field: "CUIT",
      fieldName: "cuit.PersonalCUITCUILCUIT",
      type: "number",
      sortable: true,
      searchHidden: false
    },
    {
      name: "Apellido Nombre",
      type: "string",
      id: "ApellidoNombre",
      field: "ApellidoNombre",
      fieldName: "per.PersonalId",
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
      fieldName: "per.PersonalId",
      sortable: true,
      searchHidden: true,
      hidden: true,
    },
    {
      name: "Sit Revista",
      type: "string",
      id: "SituacionRevistaDescripcion",
      field: "SituacionRevistaDescripcion",
      fieldName: "sit.SituacionRevistaDescripcion",
      sortable: true,
      hidden: true,
      searchHidden: false
    },
    {
      name: "Importe",
      type: "currency",
      id: "PersonalPrestamoMonto",
      field: "PersonalPrestamoMonto",
      fieldName: "pre.PersonalPrestamoMonto",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Fecha Solicitud",
      type: "date",
      id: "PersonalPrestamoDia",
      field: "PersonalPrestamoDia",
      fieldName: "pre.PersonalPrestamoDia",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Fecha Aprobado",
      type: "date",
      id: "PersonalPrestamoFechaAprobacion",
      field: "PersonalPrestamoFechaAprobacion",
      fieldName: "pre.PersonalPrestamoFechaAprobacion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Forma",
      type: "string",
      id: "FormaPrestamoDescripcion",
      field: "FormaPrestamoDescripcion",
      fieldName: "fp.FormaPrestamoDescripcion",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Grupo Número",
      type: "number",
      id: "GrupoActividadNumero",
      field: "GrupoActividadNumero",
      fieldName: "g.GrupoActividadNumero",
      sortable: true,
      searchHidden: false,
      hidden: false,
    },
    {
      name: "Grupo Detalle",
      type: "string",
      id: "GrupoActividadDetalle",
      field: "GrupoActividadDetalle",
      fieldName: "g.GrupoActividadDetalle",
      searchType: "string",
      sortable: true,
      searchHidden: false
    },
    {
      name: "Estado del BOT",
      type: "string",
      id: "det_status_bot",
      field: "det_status_bot",
      fieldName: "",
      searchType: "string",
      sortable: true,
      searchHidden: true
    },

  ];


  async getByPersonalId(
    personalId: Number,
    Ano: string,
    Mes: string,
    req: any,
    res: Response,
    next: NextFunction
  ) {

    try {
      const grupos = await dataSource.query(
        `SELECT DISTINCT ga.GrupoActividadId, ga.GrupoActividadJerarquicoComo, 1
        FroM GrupoActividadJerarquico ga 
        WHERE ga.GrupoActividadJerarquicoPersonalId = @0
        AND DATEFROMPARTS(@1,@2,28) > ga.GrupoActividadJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(ga.GrupoActividadJerarquicoHasta, '9999-12-31')`,
        [res.locals.PersonalId, Ano, Mes])

      let GrupoActividadIdList =[]
      grupos.forEach((row: any) => {
        GrupoActividadIdList.push(row.GrupoActividadId)
      })
      if (GrupoActividadIdList.length == 0)
        GrupoActividadIdList.push(0)

      const adelantos = await dataSource.query(
        `SELECT perrel.GrupoActividadId GrupoActividadId, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, pre.* 
        FROM PersonalPrestamo pre 
        JOIN Personal per ON per.PersonalId = pre.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
        LEFT JOIN GrupoActividadPersonal perrel ON perrel.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.GrupoActividadPersonalHasta, '9999-12-31')
           WHERE ((pre.PersonalPrestamoAprobado IN (NULL) OR pre.PersonalPrestamoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)) OR pre.PersonalPrestamoAprobado IS NULL)
                AND pre.FormaPrestamoId=7 AND (pre.PersonalId = @0 or perrel.GrupoActividadId IN(${GrupoActividadIdList.join(',')}))`,
        [personalId, Ano, Mes])

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
        `DELETE From PersonalPrestamo 
                WHERE (PersonalPrestamoAprobado IS NULL)
                AND PersonalId = @0`,
        [personalId]
      );

      await queryRunner.commitTransaction();
      this.jsonRes([], res, "Ayuda Asistencial eliminada.");
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async setAdelanto(anio: number, mes: number, personalId: number, monto: number, req:any, res: Response, next: NextFunction) {
    const usuario = res.locals.userName
    const ip = this.getRemoteAddress(req)
    const queryRunner = dataSource.createQueryRunner();
    const FormaPrestamoId = 7 //Adelanto
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new ClientException("Falta cargar la persona.");
      if (!monto) throw new ClientException("Falta cargar el monto.");

      const checkrecibos = await queryRunner.query(
        `SELECT per.ind_recibos_generados FROM lige.dbo.liqmaperiodo per WHERE per.anio=@1 AND per.mes=@2`, [,anio, mes]
      );
  
      if (checkrecibos[0]?.ind_recibos_generados ==1)
        throw new ClientException(`Ya se encuentran generados los recibos para el período ${anio}/${mes}, no se puede generar adelantos para el período`)
  

      const aplicaEl = `${String(mes).padStart(2, '0')}/${String(anio).padStart(4, '0')}`
      
      const presPend = await queryRunner.query(`SELECT pre.PersonalPrestamoId FROM PersonalPrestamo pre WHERE pre.PersonalId = @0 AND pre.PersonalPrestamoAprobado = 'S' AND pre.PersonalPrestamoLiquidoFinanzas = 0 AND pre.FormaPrestamoId =@1`,
        [personalId,FormaPrestamoId]
      )
      if (presPend.length>0)
        throw new ClientException(`Ya se encuentra generado, aprobado y pendiente de acreditar en cuenta.  No se puede solicitar nuevo adelanto`)

      const perUltRecibo = await queryRunner.query(`SELECT TOP 1 *, EOMONTH(DATEFROMPARTS(anio, mes, 1)) AS FechaCierre FROM lige.dbo.liqmaperiodo WHERE ind_recibos_generados = 1 ORDER BY anio DESC, mes DESC `)

      const bot = await AccesoBotController.getBotStatus(perUltRecibo[0].anio, perUltRecibo[0].mes, queryRunner, [personalId])

      if (bot[0].visto != 1 && bot[0].doc_id > 0) {
        let errormsg: string[] = []

        if (bot[0].registrado == 0) {
          errormsg.push(`No se puede solicitar adelanto, la persona no se encuentra registrada en el Bot`)
        } else {

          errormsg.push(`No se puede solicitar adelanto, el recibo del mes ${perUltRecibo[0].mes}/${perUltRecibo[0].anio} no ha sido visto por la persona`)

          const sendit = await AccesoBotController.enqueBotMsg(personalId, `Recuerde descargar el recibo ${perUltRecibo[0].mes}/${perUltRecibo[0].anio}, se encuentra disponible`, `RECIBO${bot[0].doc_id}`, usuario, ip)
          if (sendit) errormsg.push('Se envió notificación a la persona recordando que descargue el recibo')
        }
        throw new ClientException(errormsg)
      }

      const FormaPrestamo = await queryRunner.query(`SELECT fp.FormaPrestamoDescripcion FROM FormaPrestamo fp WHERE fp.FormaPrestamoId = @0`, [FormaPrestamoId])
      const FormaPrestamoDescripcion = FormaPrestamo[0]?.FormaPrestamoDescripcion
      if (!FormaPrestamoDescripcion)
        throw new ClientException(`Formato de la ayuda no reconocido ${FormaPrestamoId}`)

      const adelantoExistente = await queryRunner.query(
        `DELETE From PersonalPrestamo 
                WHERE PersonalPrestamoAprobado IS NULL
                AND FormaPrestamoId = @1
                AND PersonalId = @0`,
        [personalId,FormaPrestamoId]
      );
      const now = new Date()
      const hora = this.getTimeString(now)
      let today = now
      today.setHours(0, 0, 0, 0)

      if (monto > 0) {

        const prestamoId =
          Number((
            await queryRunner.query(
              `
            SELECT per.PersonalPrestamoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
              [personalId]
            )
          )[0].max) + 1;

        const usuarioId = await this.getUsuarioId(res,queryRunner)

        const result = await queryRunner.query(
          `INSERT INTO PersonalPrestamo(
                    PersonalPrestamoId, PersonalId, PersonalPrestamoMonto, FormaPrestamoId, 
                    PersonalPrestamoAprobado, PersonalPrestamoFechaAprobacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoAplicaEl, 
                    PersonalPrestamoLiquidoFinanzas, PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCuotaUltNro, PersonalPrestamoMontoAutorizado, 
                    -- PersonalPrestamoJerarquicoId, PersonalPrestamoPuesto, PersonalPrestamoUsuarioId,
                    PersonalPrestamoDia, PersonalPrestamoTiempo)
                    VALUES(
                    @0, @1, @2, @3,
                    @4, @5, @6, @7,
                    @8, @9, @10, @11,
                    -- @12, @13, @14,
                    @15, @16)
                `,
          [
            prestamoId, //PersonalPrestamoId
            personalId, //PersonalId
            monto, //PersonalPrestamoMonto
            FormaPrestamoId, //FormaPrestamoId = 7 Adelanto

            null, //PersonalPrestamoAprobado
            null, //PersonalPrestamoFechaAprobacion
            1,  //PersonalPrestamoCantidadCuotas
            aplicaEl, //PersonalPrestamoAplicaEl

            null, //PersonalPrestamoLiquidoFinanzas
            "", //PersonalPrestamoUltimaLiquidacion
            null, //PersonalPrestamoCuotaUltNro
            0, //PersonalPrestamoMonto

            null, //PersonalPrestamoJerarquicoId
            ip, //PersonalPrestamoPuesto
            usuarioId, //PersonalPrestamoUsuarioId

            today, //PersonalPrestamoDia
            hora, //PersonalPrestamoTiempo  

          ]
        );

        const resultAdelanto = await queryRunner.query(
          `UPDATE Personal SET PersonalPrestamoUltNro=@1 WHERE PersonalId=@0 `,
          [
            personalId,
            prestamoId,
          ]
        );

      }

      await queryRunner.commitTransaction();
      this.jsonRes({
        personalId, //PersonalId
        PersonalPrestamoMonto: monto, //PersonalPrestamoMonto
        PersonalPrestamoDia: today, //PersonalPrestamoDia
        FormaPrestamoId: FormaPrestamoId,
        FormaPrestamoDescripcion: FormaPrestamoDescripcion
      }, res, "Ayuda Asistencial añadido.");
    } catch (error) {
      await this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async getAdelantoPersonaCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getAdelantoPersonaList(req: Request, res: Response, next: NextFunction) {
    const anio = Number(req.body.anio);
    const mes = Number(req.body.mes);
    const mesPrev = (mes - 1 == 0) ? 12 : mes - 1
    const anioPrev = (mes - 1 == 0) ? anio-1 : anio
    
    const queryRunner = dataSource.createQueryRunner();

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
    if (req.body.options.filtros.length == 0) { 
      this.jsonRes({ list: [] }, res);
      return
    }

    const filterSql = filtrosToSql(req.body.options.filtros, this.listaColumnas);
    const orderBy = orderToSQL(req.body.options.sort)
    try {
      const adelantos = await queryRunner.query(
        `SELECT DISTINCT CONCAT(per.PersonalId,'-',pre.PersonalPrestamoId,'-',g.GrupoActividadId) id,
        per.PersonalId, cuit.PersonalCUITCUILCUIT CUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        g.GrupoActividadId, g.GrupoActividadNumero, g.GrupoActividadDetalle,
        pre.PersonalPrestamoId, pre.PersonalPrestamoMonto, pre.PersonalPrestamoAprobado, pre.PersonalPrestamoFechaAprobacion, pre.PersonalPrestamoCantidadCuotas, pre.PersonalPrestamoAplicaEl, pre.PersonalPrestamoLiquidoFinanzas, pre.PersonalPrestamoUltimaLiquidacion, pre.PersonalPrestamoCuotaUltNro,
        -- pre.PersonalPrestamoJerarquicoId, pre.PersonalPrestamoPuesto, pre.PersonalPrestamoUsuarioId,
        pre.PersonalPrestamoDia, pre.PersonalPrestamoTiempo,
        pre.FormaPrestamoId, fp.FormaPrestamoDescripcion
      
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
     
        LEFT JOIN GrupoActividadPersonal ga ON ga.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > ga.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(ga.GrupoActividadPersonalHasta, '9999-12-31')
        LEFT JOIN GrupoActividad g ON g.GrupoActividadId = ga.GrupoActividadId           
     
        LEFT JOIN PersonalPrestamo pre ON pre.PersonalId = per.PersonalId
               -- AND DATEPART(YEAR,pre.PersonalPrestamoDia) = @1 AND DATEPART(MONTH,pre.PersonalPrestamoDia) = @2
               -- pre.PersonalPrestamoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)
               AND (pre.PersonalPrestamoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) OR (pre.PersonalPrestamoAplicaEl IS NULL AND pre.PersonalPrestamoAprobado IS NULL)) 
        LEFT JOIN FormaPrestamo fp ON fp.FormaPrestamoId = pre.FormaPrestamoId

        WHERE (1=1)
       -- AND perrel.PersonalCategoriaPersonalId=@0
       AND (${filterSql}) 
       ${orderBy}`,
        [0, anio, mes])

      const personal = adelantos.map(p => p.PersonalId)
      const resBot = await AccesoBotController.getBotStatus(anioPrev, mesPrev, queryRunner, personal)
      for (const row of resBot) {
        const key = adelantos.findIndex(i => i.PersonalId == row.PersonalId)
        if (key >= 0) {
          adelantos[key].det_status_bot= (row.registro=='OK') ? row.descarga :row.registro
        }
      }

      
      this.jsonRes({ list: adelantos }, res);
    } catch (error) {
      return next(error)
    }
  }
}

