import { NextFunction, Request, Response } from "express";
import { BaseController, ClientException } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";
import { filtrosToSql, isOptions, orderToSQL } from "../impuestos-afip/filtros-utils/filtros";
import { Options } from "../schemas/filtro";

export class LiquidacionesController extends BaseController {

    listaColumnas: any[] = [
        {
          id: "movimiento_id",
          name: "Movimiento",
          field: "movimiento_id",
          fieldName: "movimiento_id",
          type: "number",
          sortable: true,
          searchHidden: false
        },
        {
          name: "Periodo",
          type: "date",
          id: "periodo_id",
          field: "periodo_id",
          fieldName: "periodo_id",
          sortable: true,
          searchHidden: false,
          hidden: false,
        },
        {
          name: "Tipo Movimiento",
          type: "string",
          id: "tipo_movimiento",
          field: "tipo_movimiento",
          fieldName: "tipo_movimiento",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
         name: "Fecha",
          type: "date",
          id: "fecha",
          field: "fecha",
          fieldName: "fecha",
          sortable: true,
          searchHidden: true,
          hidden: false,
        },
        {
          name: "Detalle",
          type: "string",
          id: "detalle",
          field: "detalle",
          fieldName: "detalle",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
          name: "Objetivo",
          type: "string",
          id: "objetivo_id",
          field: "objetivo_id",
          fieldName: "objetivo_id",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
        {
          name: "Persona",
          type: "string",
          id: "persona_id",
          field: "persona_id",
          fieldName: "persona_id",
          sortable: true,
          hidden: false,
          searchHidden: false
        },
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
    
      ];


//   async getByPersonalId(
//     personalId: Number,
//     Año: string,
//     Mes: string,
//     req: any,
//     res: Response,
//     next: NextFunction
//   ) {

//     try {
//       const responsables = await dataSource.query(
//         `SELECT DISTINCT pjer.ObjetivoPersonalJerarquicoPersonalId as PersonalId, 1
//         FroM ObjetivoPersonalJerarquico pje 
//         JOIN ObjetivoPersonalJerarquico pjer ON pjer.ObjetivoId = pje.ObjetivoId AND DATEFROMPARTS(@1,@2,28) > pjer.ObjetivoPersonalJerarquicoDesde AND DATEFROMPARTS(@1,@2,1) <  ISNULL(pjer.ObjetivoPersonalJerarquicoHasta, '9999-12-31')
//         WHERE pje.ObjetivoPersonalJerarquicoPersonalId = @0`,
//         [res.locals.PersonalId, Año, Mes])

//       let PersonalIdList = ""
//       responsables.forEach((row: any) => {
//         PersonalIdList += `${row.PersonalId},`
//       })
//       PersonalIdList += `0`

//       const adelantos = await dataSource.query(
//         `SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, ade.* 
//         FROM PersonalAdelanto ade 
//         JOIN Personal per ON per.PersonalId = ade.PersonalId
//         LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = ( SELECT MAX(cuitmax.PersonalCUITCUILId) FROM PersonalCUITCUIL cuitmax WHERE cuitmax.PersonalId = per.PersonalId) 

//         LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
//            WHERE ((ade.PersonalAdelantoAprobado IN (NULL) OR ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)) OR ade.PersonalAdelantoAprobado IS NULL)
//                 AND (ade.PersonalId = @0 or perrel.PersonalCategoriaPersonalId IN(${PersonalIdList}))`,
//         [personalId, Año, Mes])

//       this.jsonRes(adelantos, res);
//     } catch (error) {
//       return next(error)
//     }
//   }

//   async delAdelanto(personalId: number, monto: number, ip, res: Response, next: NextFunction) {
//     const queryRunner = dataSource.createQueryRunner();
//     try {
//       await queryRunner.connect();
//       await queryRunner.startTransaction();

//       if (!personalId) throw new ClientException("Falta cargar la persona");

//       await queryRunner.query(
//         `DELETE From PersonalAdelanto 
//                 WHERE (PersonalAdelantoAprobado IS NULL)
//                 AND PersonalId = @0`,
//         [personalId]
//       );

//       await queryRunner.commitTransaction();
//       this.jsonRes([], res, "Adelanto/s eliminado.");
//     } catch (error) {
//       if (queryRunner.isTransactionActive)
//         await queryRunner.rollbackTransaction();
//       return next(error)
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   async setAdelanto(personalId: string, monto: number, ip, res: Response, next: NextFunction) {
//     const queryRunner = dataSource.createQueryRunner();
//     try {
//       await queryRunner.connect();
//       await queryRunner.startTransaction();

//       if (!personalId) throw new ClientException("Falta cargar la persona.");
//       if (!monto) throw new ClientException("Falta cargar el monto.");

//       const adelantoExistente = await queryRunner.query(
//         `DELETE From PersonalAdelanto 
//                 WHERE (PersonalAdelantoAprobado IS NULL)
//                 AND PersonalId = @0`,
//         [personalId]
//       );
//       const now = new Date()
//       let today = now
//       today.setHours(0, 0, 0, 0)

//       if (monto > 0) {

//         const adelantoId =
//           Number((
//             await queryRunner.query(
//               `
//             SELECT per.PersonalAdelantoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
//               [personalId]
//             )
//           )[0].max) + 1;



//         const result = await queryRunner.query(
//           `INSERT INTO PersonalAdelanto(
//                     PersonalAdelantoId, PersonalId, PersonalAdelantoMonto, PersonalAdelantoFechaSolicitud, 
//                     PersonalAdelantoAprobado, PersonalAdelantoFechaAprobacion, PersonalAdelantoCantidadCuotas, PersonalAdelantoAplicaEl, 
//                     PersonalAdelantoLiquidoFinanzas, PersonalAdelantoUltimaLiquidacion, PersonalAdelantoCuotaUltNro, PersonalAdelantoMontoAutorizado, 
//                     PersonalAdelantoJerarquicoId, PersonalAdelantoPuesto, PersonalAdelantoUsuarioId, PersonalAdelantoDia, 
//                     PersonalAdelantoTiempo)
//                     VALUES(
//                     @0, @1, @2, @3, 
//                     @4, @5, @6, @7, 
//                     @8, @9, @10, @11, 
//                     @12, @13, @14, @15, 
//                     @16)
//                 `,
//           [
//             adelantoId, //PersonalAdelantoId
//             personalId, //PersonalId
//             monto, //PersonalAdelantoMonto
//             today, //PersonalAdelantoFechaSolicitud
//             null, //PersonalAdelantoAprobado
//             null, //PersonalAdelantoFechaAprobacion
//             0,  //PersonalAdelantoCantidadCuotas
//             null, //PersonalAdelantoAplicaEl
//             null, //PersonalAdelantoLiquidoFinanzas
//             "", //PersonalAdelantoUltimaLiquidacion
//             null, //PersonalAdelantoCuotaUltNro
//             0, //PersonalAdelantoMontoAutorizado
//             null, //PersonalAdelantoJerarquicoId
//             ip, //PersonalAdelantoPuesto
//             null, //PersonalAdelantoUsuarioId
//             today, //PersonalAdelantoDia
//             0 //PersonalAdelantoTiempo  now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds(),
//           ]
//         );

//         const resultAdelanto = await queryRunner.query(
//           `UPDATE Personal SET PersonalAdelantoUltNro=@1 WHERE PersonalId=@0 `,
//           [
//             personalId,
//             adelantoId,
//           ]
//         );

//       }

//       await queryRunner.commitTransaction();
//       this.jsonRes({
//         personalId, //PersonalId
//         PersonalAdelantoMonto: monto, //PersonalAdelantoMonto
//         PersonalAdelantoFechaSolicitud: today, //PersonalAdelantoFechaSolicitud
//       }, res, "Adelanto añadido.");
//     } catch (error) {
//       if (queryRunner.isTransactionActive)
//         await queryRunner.rollbackTransaction();
//       return next(error)
//     } finally {
//       await queryRunner.release();
//     }
//   }

  async getLiquidacionesCols(req: Request, res: Response) {
    this.jsonRes(this.listaColumnas, res);
  }
}

