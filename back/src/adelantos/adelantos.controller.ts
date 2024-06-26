import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

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
      id: "CUITJPersonalPrestamoFechaSolicitud",
      field: "PersonalPrestamoFechaSolicitud",
      fieldName: "pre.PersonalPrestamoFechaSolicitud",
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
                AND (pre.PersonalId = @0 or perrel.GrupoActividadId IN(${GrupoActividadIdList.join(',')}))`,
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
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async setAdelanto(personalId: number, monto: number, ip, res: Response, next: NextFunction) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new ClientException("Falta cargar la persona.");
      if (!monto) throw new ClientException("Falta cargar el monto.");

      const adelantoExistente = await queryRunner.query(
        `DELETE From PersonalPrestamo 
                WHERE (PersonalPrestamoAprobado IS NULL)
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
            SELECT per.PersonalPrestamoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
              [personalId]
            )
          )[0].max) + 1;



        const result = await queryRunner.query(
          `INSERT INTO PersonalPrestamo(
                    PersonalPrestamoId, PersonalId, PersonalPrestamoMonto, PersonalPrestamoFechaSolicitud, 
                    PersonalPrestamoAprobado, PersonalPrestamoFechaAprobacion, PersonalPrestamoCantidadCuotas, PersonalPrestamoAplicaEl, 
                    PersonalPrestamoLiquidoFinanzas, PersonalPrestamoUltimaLiquidacion, PersonalPrestamoCuotaUltNro, PersonalPrestamoMontoAutorizado, 
                    PersonalPrestamoJerarquicoId, PersonalPrestamoPuesto, PersonalPrestamoUsuarioId, PersonalPrestamoDia, 
                    PersonalPrestamoTiempo)
                    VALUES(
                    @0, @1, @2, @3, 
                    @4, @5, @6, @7, 
                    @8, @9, @10, @11, 
                    @12, @13, @14, @15, 
                    @16)
                `,
          [
            adelantoId, //PersonalPrestamoId
            personalId, //PersonalId
            monto, //PersonalPrestamoMonto
            today, //PersonalPrestamoFechaSolicitud
            null, //PersonalPrestamoAprobado
            null, //PersonalPrestamoFechaAprobacion
            0,  //PersonalPrestamoCantidadCuotas
            null, //PersonalPrestamoAplicaEl
            null, //PersonalPrestamoLiquidoFinanzas
            "", //PersonalPrestamoUltimaLiquidacion
            null, //PersonalPrestamoCuotaUltNro
            0, //PersonalPrestamoMontoAutorizado
            null, //PersonalPrestamoJerarquicoId
            ip, //PersonalPrestamoPuesto
            null, //PersonalPrestamoUsuarioId
            today, //PersonalPrestamoDia
            0 //PersonalPrestamoTiempo  now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds(),
          ]
        );

        const resultAdelanto = await queryRunner.query(
          `UPDATE Personal SET PersonalPrestamoUltNro=@1 WHERE PersonalId=@0 `,
          [
            personalId,
            adelantoId,
          ]
        );

      }

      await queryRunner.commitTransaction();
      this.jsonRes({
        personalId, //PersonalId
        PersonalPrestamoMonto: monto, //PersonalPrestamoMonto
        PersonalPrestamoFechaSolicitud: today, //PersonalPrestamoFechaSolicitud
      }, res, "Ayuda Asistencial añadido.");
    } catch (error) {
      this.rollbackTransaction(queryRunner)
      return next(error)
    } finally {
      await queryRunner.release();
    }
  }

  async getAdelantoPersonaCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }

  async getAdelantoPersonaList(req: Request, res: Response, next: NextFunction) {
    const anio = String(req.body.anio);
    const mes = String(req.body.mes);

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
//TODO Ver como no mostras los adelantos pendientes en un mes viejo
    try {
      const adelantos = await dataSource.query(
        `SELECT DISTINCT CONCAT(per.PersonalId,'-',pre.PersonalPrestamoId,'-',g.GrupoActividadId) id,
        per.PersonalId, cuit.PersonalCUITCUILCUIT CUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre,
        g.GrupoActividadId, g.GrupoActividadNumero, g.GrupoActividadDetalle,
        pre.PersonalPrestamoId, pre.PersonalPrestamoMonto, pre.PersonalPrestamoFechaSolicitud, pre.PersonalPrestamoAprobado, pre.PersonalPrestamoFechaAprobacion, pre.PersonalPrestamoCantidadCuotas, pre.PersonalPrestamoAplicaEl, pre.PersonalPrestamoLiquidoFinanzas, pre.PersonalPrestamoUltimaLiquidacion, pre.PersonalPrestamoCuotaUltNro, pre.PersonalPrestamoMontoAutorizado, pre.PersonalPrestamoJerarquicoId, pre.PersonalPrestamoPuesto, pre.PersonalPrestamoUsuarioId, pre.PersonalPrestamoDia, pre.PersonalPrestamoTiempo
      
        FROM Personal per
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 
     
        LEFT JOIN GrupoActividadPersonal ga ON ga.GrupoActividadPersonalPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > ga.GrupoActividadPersonalDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(ga.GrupoActividadPersonalHasta, '9999-12-31')
        LEFT JOIN GrupoActividad g ON g.GrupoActividadId = ga.GrupoActividadId           
     
        LEFT JOIN PersonalPrestamo pre ON pre.PersonalId = per.PersonalId
               -- AND DATEPART(YEAR,pre.PersonalPrestamoFechaSolicitud) = @1 AND DATEPART(MONTH,pre.PersonalPrestamoFechaSolicitud) = @2
               -- pre.PersonalPrestamoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)
        AND (pre.PersonalPrestamoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1) OR (pre.PersonalPrestamoAplicaEl IS NULL AND pre.PersonalPrestamoAprobado IS NULL)) 
        WHERE (1=1) 
       -- AND perrel.PersonalCategoriaPersonalId=@0
       AND (${filterSql}) 
       ${orderBy}`,
        [0, anio, mes])

      this.jsonRes({ list: adelantos }, res);
    } catch (error) {
      return next(error)
    }
  }
}

