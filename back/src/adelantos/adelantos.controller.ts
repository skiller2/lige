import { Request, Response } from "express";
import { BaseController } from "../controller/baseController";
import { dataSource } from "../data-source";
import { QueryFailedError } from "typeorm";

export class AdelantosController extends BaseController {
  async getByPersonalId(
    personalId: string,
    Año: string,
    Mes: string,
    req: any,
    res: Response
  ) {

    try {

      const adelantos = await dataSource.query(
        `SELECT perrel.PersonalCategoriaPersonalId PersonalIdJ, cuit.PersonalCUITCUILCUIT, CONCAT(TRIM(per.PersonalApellido),', ', TRIM(per.PersonalNombre)) AS ApellidoNombre, ade.* 
        FROM PersonalAdelanto ade 
        JOIN Personal per ON per.PersonalId = ade.PersonalId
        LEFT JOIN PersonalCUITCUIL cuit ON cuit.PersonalId = per.PersonalId AND cuit.PersonalCUITCUILId = per.PersonalCUITCUILUltNro
        LEFT JOIN OperacionesPersonalAsignarAJerarquico perrel ON perrel.OperacionesPersonalAAsignarPersonalId = per.PersonalId AND DATEFROMPARTS(@1,@2,28) > perrel.OperacionesPersonalAsignarAJerarquicoDesde AND DATEFROMPARTS(@1,@2,28) < ISNULL(perrel.OperacionesPersonalAsignarAJerarquicoHasta, '9999-12-31')
           WHERE ((ade.PersonalAdelantoAprobado IN (NULL) OR ade.PersonalAdelantoAplicaEl= CONCAT(FORMAT(CONVERT(INT, @2), '00'),'/',@1)) OR ade.PersonalAdelantoAprobado IS NULL)
                AND (ade.PersonalId = @0 or perrel.PersonalCategoriaPersonalId = @3)`,
        [personalId, Año, Mes, req.PersonalId])

      this.jsonRes(adelantos, res);
    } catch (err) {
      this.errRes(err, res, "Error accediendo a la base de datos", 409);
    }
  }

  async delAdelanto(personalId: string, monto: number, ip, res: Response) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new Error("Falta cargar la persona.");

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
      if (error instanceof Error) {
        this.errRes(error, res, error.message, 409);
      } else {
        this.errRes(error, res, "No se pudo borrar.", 409);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async setAdelanto(personalId: string, monto: number, ip, res: Response) {
    const queryRunner = dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (!personalId) throw new Error("Falta cargar la persona.");
      if (!monto) throw new Error("Falta cargar el monto.");

      // Max Val
      //Hay ya un adelanto sin aprob
      // Si hay, lo reemplazas
      const adelantoId =
        (
          await queryRunner.query(
            `
            SELECT per.PersonalAdelantoUltNro as max FROM Personal per WHERE per.PersonalId = @0`,
            [personalId]
          )
        )[0].max + 1;
      
      const adelantoExistente = await queryRunner.query(
        `DELETE From PersonalAdelanto 
                WHERE (PersonalAdelantoAprobado IS NULL)
                AND PersonalId = @0`,
        [personalId]
      );


      const result = await queryRunner.query(
        `INSERT INTO PersonalAdelanto(
                    PersonalAdelantoId, PersonalId, PersonalAdelantoMonto, PersonalAdelantoFechaSolicitud, PersonalAdelantoAprobado, PersonalAdelantoFechaAprobacion, PersonalAdelantoCantidadCuotas, PersonalAdelantoAplicaEl, PersonalAdelantoLiquidoFinanzas, PersonalAdelantoUltimaLiquidacion, PersonalAdelantoCuotaUltNro, PersonalAdelantoMontoAutorizado, PersonalAdelantoJerarquicoId, PersonalAdelantoPuesto, PersonalAdelantoUsuarioId, PersonalAdelantoDia, PersonalAdelantoTiempo)
                    VALUES(
                    @0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14, @15, @16)
                `,
        [
          adelantoId,
          personalId,
          monto,
          new Date(),
          null,
          null,
          1,
          null,
          null,
          "",
          null,
          0,
          null,
          ip,
          null,
          null,
          null,
        ]
      );

      const resultAdelanto = await queryRunner.query(
        `UPDATE Personal SET PersonalAdelantoUltNro=@1 WHERE PersonalId=@0 `,
        [
          personalId,
          adelantoId,
        ]
        );
   

      await queryRunner.commitTransaction();
      this.jsonRes([], res, "Adelanto añadido.");
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      if (error instanceof Error) {
        this.errRes(error, res, error.message, 409);
      } else {
        this.errRes(error, res, "Error al grabar.", 409);
      }
    } finally {
      await queryRunner.release();
    }
  }
}
